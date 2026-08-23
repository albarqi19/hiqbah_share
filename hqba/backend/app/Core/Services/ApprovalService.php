<?php

namespace App\Core\Services;

use App\Core\Enums\ApprovalActionType;
use App\Core\Enums\ApprovalRequestStatus;
use App\Core\Enums\ApprovalType;
use App\Core\Models\ApprovalAction;
use App\Core\Models\ApprovalRequest;
use App\Core\Models\ApprovalRule;
use App\Core\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Generic approval engine.
 *
 * Lifecycle:
 *   1) submit($entity, $amount, $userId)  → finds matching ApprovalRule, creates ApprovalRequest
 *   2) act($request, $approver, approve|reject, $comment) → records ApprovalAction
 *      → engine evaluates whether request is now Approved / Rejected / still Pending
 *   3) Caller listens and triggers entity-specific side-effects
 *      (e.g. PurchaseOrderService::onApproved()).
 *
 * Approver definition format (in approval_rules.required_approvers):
 *   [
 *     {"type":"role","value":"finance_manager"},
 *     {"type":"user","value":5}
 *   ]
 *
 * For Sequential: array order = step order.
 */
class ApprovalService
{
    /**
     * Submit an entity for approval. Returns the created ApprovalRequest.
     */
    public function submit(Model $entity, float $amount, int $userId, ?string $notes = null): ApprovalRequest
    {
        $rule = ApprovalRule::findMatching(get_class($entity), $amount);

        if (! $rule) {
            throw ValidationException::withMessages([
                'approval' => ["لا توجد قاعدة اعتماد لـ " . class_basename($entity) . " بمبلغ {$amount}."],
            ]);
        }

        $approvers = $rule->required_approvers ?? [];

        return ApprovalRequest::create([
            'approvable_type' => get_class($entity),
            'approvable_id' => $entity->getKey(),
            'approval_rule_id' => $rule->id,
            'requested_by' => $userId,
            'amount' => $amount,
            'status' => ApprovalRequestStatus::Pending,
            'current_step' => 1,
            'total_steps' => count($approvers),
            'notes' => $notes,
        ]);
    }

    /**
     * Record an approver's action on a request and evaluate the result.
     */
    public function act(
        ApprovalRequest $request,
        User $approver,
        ApprovalActionType $action,
        ?string $comment = null,
    ): ApprovalRequest {
        if (! $request->isPending()) {
            throw ValidationException::withMessages([
                'approval' => ['طلب الاعتماد منتهٍ بالفعل بحالة ' . $request->status->label()],
            ]);
        }

        if (! $this->canApproverAct($request, $approver)) {
            throw ValidationException::withMessages([
                'approval' => ['ليس لديك صلاحية اعتماد هذا الطلب في الخطوة الحالية.'],
            ]);
        }

        return DB::transaction(function () use ($request, $approver, $action, $comment) {
            ApprovalAction::create([
                'approval_request_id' => $request->id,
                'approver_id' => $approver->id,
                'action' => $action,
                'step' => $request->current_step,
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            // Reject ⇒ short-circuit
            if ($action === ApprovalActionType::Reject) {
                $request->update([
                    'status' => ApprovalRequestStatus::Rejected,
                    'completed_at' => now(),
                ]);

                return $request->fresh();
            }

            // super_admin shortcut: a single approve from super_admin completes all remaining steps.
            if ($approver->hasRole('super_admin')) {
                $request->update([
                    'status' => ApprovalRequestStatus::Approved,
                    'current_step' => $request->total_steps,
                    'completed_at' => now(),
                ]);

                return $request->fresh();
            }

            $this->evaluateAfterApprove($request);

            return $request->fresh();
        });
    }

    /**
     * Cancel a pending approval (e.g., when the underlying entity is cancelled).
     */
    public function cancel(ApprovalRequest $request, ?string $reason = null): ApprovalRequest
    {
        if ($request->status !== ApprovalRequestStatus::Pending) {
            return $request;
        }

        $request->update([
            'status' => ApprovalRequestStatus::Cancelled,
            'completed_at' => now(),
            'notes' => $reason ? trim(($request->notes ?? '') . "\nCancelled: {$reason}") : $request->notes,
        ]);

        return $request->fresh();
    }

    /**
     * For UI: list approvers who still need to act on this request right now.
     */
    public function pendingApprovers(ApprovalRequest $request): array
    {
        $rule = $request->rule;
        $approvers = $rule->required_approvers ?? [];
        $type = $rule->approval_type;

        if ($type === ApprovalType::Sequential) {
            $next = $approvers[$request->current_step - 1] ?? null;

            return $next ? [$next] : [];
        }

        // For parallel / any_one: everyone who hasn't approved yet.
        $alreadyApprovedIds = $request->actions()
            ->where('action', ApprovalActionType::Approve->value)
            ->pluck('approver_id')
            ->all();

        return array_values(array_filter($approvers, function ($a) use ($alreadyApprovedIds) {
            return ! ($a['type'] === 'user' && in_array($a['value'], $alreadyApprovedIds));
        }));
    }

    // ── Internal ──

    protected function evaluateAfterApprove(ApprovalRequest $request): void
    {
        $rule = $request->rule;
        $type = $rule->approval_type;
        $approvers = $rule->required_approvers ?? [];
        $approves = $request->actions()->where('action', ApprovalActionType::Approve->value)->count();

        if ($type === ApprovalType::AnyOne) {
            $request->update([
                'status' => ApprovalRequestStatus::Approved,
                'completed_at' => now(),
            ]);

            return;
        }

        if ($type === ApprovalType::Sequential) {
            if ($request->current_step >= $request->total_steps) {
                $request->update([
                    'status' => ApprovalRequestStatus::Approved,
                    'completed_at' => now(),
                ]);
            } else {
                $request->update(['current_step' => $request->current_step + 1]);
            }

            return;
        }

        // Parallel: need all approvers to approve.
        if ($approves >= count($approvers)) {
            $request->update([
                'status' => ApprovalRequestStatus::Approved,
                'completed_at' => now(),
            ]);
        }
    }

    protected function canApproverAct(ApprovalRequest $request, User $approver): bool
    {
        // super_admin bypass — same convention as Gate::before
        if ($approver->hasRole('super_admin')) {
            return true;
        }

        $rule = $request->rule;
        $approvers = $rule->required_approvers ?? [];
        $type = $rule->approval_type;

        // Already acted? cannot act again.
        $alreadyActed = $request->actions()
            ->where('approver_id', $approver->id)
            ->exists();

        if ($alreadyActed && $type !== ApprovalType::Sequential) {
            return false;
        }

        if ($type === ApprovalType::Sequential) {
            $expected = $approvers[$request->current_step - 1] ?? null;

            return $expected ? $this->matches($expected, $approver) : false;
        }

        // Parallel & AnyOne: any defined approver can act.
        foreach ($approvers as $a) {
            if ($this->matches($a, $approver)) {
                return true;
            }
        }

        return false;
    }

    protected function matches(array $definition, User $user): bool
    {
        $type = $definition['type'] ?? null;
        $value = $definition['value'] ?? null;

        return match ($type) {
            'user' => (int) $value === (int) $user->id,
            'role' => $user->hasRole((string) $value),
            default => false,
        };
    }
}
