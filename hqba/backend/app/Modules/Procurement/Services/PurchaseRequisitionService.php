<?php

namespace App\Modules\Procurement\Services;

use App\Core\Enums\ApprovalActionType;
use App\Core\Enums\ApprovalRequestStatus;
use App\Core\Models\ApprovalRequest;
use App\Core\Models\User;
use App\Core\Services\ApprovalService;
use App\Modules\Procurement\Enums\RequisitionStatus;
use App\Modules\Procurement\Events\PurchaseRequisitionApproved;
use App\Modules\Procurement\Models\PurchaseRequisition;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PurchaseRequisitionService
{
    public function __construct(
        protected ApprovalService $approvalService,
    ) {}

    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(PurchaseRequisition::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('department'),
                AllowedFilter::exact('urgency'),
                AllowedFilter::exact('requested_by'),
                AllowedFilter::exact('preferred_supplier_id'),
                'requisition_number',
            ])
            ->allowedSorts(['requisition_number', 'created_at', 'needed_by', 'urgency'])
            ->allowedIncludes(['requester', 'approver', 'preferredSupplier', 'purchaseOrder'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data, int $userId): PurchaseRequisition
    {
        $data['requisition_number'] = PurchaseRequisition::generateRequisitionNumber();
        $data['requested_by'] = $userId;
        $data['status'] = RequisitionStatus::Draft->value;

        return PurchaseRequisition::create($data);
    }

    public function update(PurchaseRequisition $req, array $data): PurchaseRequisition
    {
        if (! $req->status->isEditable()) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن تعديل طلب الشراء في حالة ' . $req->status->label()],
            ]);
        }

        $req->update($data);

        return $req->fresh();
    }

    public function delete(PurchaseRequisition $req): void
    {
        if ($req->status === RequisitionStatus::Converted) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن حذف طلب شراء تم تحويله بالفعل لأمر شراء.'],
            ]);
        }

        $req->delete();
    }

    /**
     * Submit for approval. Creates an ApprovalRequest tied to this requisition.
     */
    public function submit(PurchaseRequisition $req, int $userId): PurchaseRequisition
    {
        if ($req->status !== RequisitionStatus::Draft && $req->status !== RequisitionStatus::Rejected) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن إرسال طلب للاعتماد من حالة ' . $req->status->label()],
            ]);
        }

        DB::transaction(function () use ($req, $userId) {
            $this->approvalService->submit($req, $req->estimatedValue(), $userId);
            $req->update(['status' => RequisitionStatus::PendingApproval]);
        });

        return $req->fresh();
    }

    /**
     * Approver acts on the requisition's pending approval request.
     */
    public function act(PurchaseRequisition $req, User $approver, ApprovalActionType $action, ?string $comment = null): PurchaseRequisition
    {
        $approvalRequest = $this->latestPendingApproval($req);

        if (! $approvalRequest) {
            throw ValidationException::withMessages([
                'approval' => ['لا يوجد طلب اعتماد معلّق لهذا الطلب.'],
            ]);
        }

        DB::transaction(function () use ($req, $approver, $action, $comment, $approvalRequest) {
            $updated = $this->approvalService->act($approvalRequest, $approver, $action, $comment);

            if ($updated->status === ApprovalRequestStatus::Approved) {
                $req->update([
                    'status' => RequisitionStatus::Approved,
                    'approved_by' => $approver->id,
                    'approved_at' => now(),
                ]);

                PurchaseRequisitionApproved::dispatch($req->fresh());
            } elseif ($updated->status === ApprovalRequestStatus::Rejected) {
                $req->update([
                    'status' => RequisitionStatus::Rejected,
                    'rejection_reason' => $comment,
                ]);
            }
        });

        return $req->fresh();
    }

    public function cancel(PurchaseRequisition $req, ?string $reason = null): PurchaseRequisition
    {
        if (! $req->status->isCancellable()) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن إلغاء الطلب في حالة ' . $req->status->label()],
            ]);
        }

        DB::transaction(function () use ($req, $reason) {
            if ($pending = $this->latestPendingApproval($req)) {
                $this->approvalService->cancel($pending, $reason);
            }

            $req->update([
                'status' => RequisitionStatus::Cancelled,
                'rejection_reason' => $reason,
            ]);
        });

        return $req->fresh();
    }

    /**
     * Mark a requisition as converted to a PO.
     */
    public function markConverted(PurchaseRequisition $req, int $poId): PurchaseRequisition
    {
        if ($req->status !== RequisitionStatus::Approved) {
            throw ValidationException::withMessages([
                'status' => ['طلب الشراء يجب أن يكون "معتمد" قبل التحويل لأمر شراء.'],
            ]);
        }

        $req->update([
            'status' => RequisitionStatus::Converted,
            'converted_to_po_id' => $poId,
            'converted_at' => now(),
        ]);

        return $req->fresh();
    }

    protected function latestPendingApproval(PurchaseRequisition $req): ?ApprovalRequest
    {
        return ApprovalRequest::where('approvable_type', PurchaseRequisition::class)
            ->where('approvable_id', $req->id)
            ->where('status', ApprovalRequestStatus::Pending)
            ->latest('id')
            ->first();
    }
}
