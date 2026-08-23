<?php

namespace App\Modules\Sales\Services;

use App\Modules\Orders\Models\Customer;
use App\Modules\Sales\Enums\LeadStage;
use App\Modules\Sales\Events\LeadConverted;
use App\Modules\Sales\Models\Lead;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LeadService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Lead::class)
            ->allowedFilters([
                AllowedFilter::exact('stage'),
                AllowedFilter::exact('sales_rep_id'),
                AllowedFilter::exact('source'),
                AllowedFilter::partial('company_name'),
                AllowedFilter::partial('city'),
            ])
            ->allowedSorts(['company_name', 'created_at', 'stage', 'estimated_monthly_kg'])
            ->allowedIncludes(['salesRep', 'convertedCustomer'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Lead
    {
        return Lead::create($data);
    }

    public function update(Lead $lead, array $data): Lead
    {
        $lead->update($data);

        return $lead->fresh();
    }

    public function transition(Lead $lead, string $newStage, int $userId, ?string $notes = null): Lead
    {
        $newStageEnum = LeadStage::from($newStage);
        $allowed = $lead->stage->allowedTransitions();

        if (! in_array($newStageEnum, $allowed)) {
            throw ValidationException::withMessages([
                'stage' => ['لا يمكن الانتقال من ' . $lead->stage->label() . ' إلى ' . $newStageEnum->label()],
            ]);
        }

        $updateData = ['stage' => $newStageEnum];

        // Set timestamp based on new stage
        $updateData = match ($newStageEnum) {
            LeadStage::Contacted => [...$updateData, 'contacted_at' => now()],
            LeadStage::Quoted => [...$updateData, 'quoted_at' => now()],
            LeadStage::Lost => [...$updateData, 'lost_at' => now()],
            default => $updateData,
        };

        if ($notes) {
            $updateData['notes'] = ($lead->notes ? $lead->notes . "\n---\n" : '') . $notes;
        }

        $lead->update($updateData);

        return $lead->fresh();
    }

    public function convertToCustomer(Lead $lead, array $customerData, int $userId): Customer
    {
        if ($lead->stage === LeadStage::Converted) {
            throw ValidationException::withMessages([
                'lead' => ['هذا العميل المحتمل تم تحويله مسبقاً'],
            ]);
        }

        return DB::transaction(function () use ($lead, $customerData, $userId) {
            $customer = Customer::create([
                'name' => $customerData['name'] ?? $lead->contact_name,
                'name_ar' => $customerData['name_ar'] ?? $lead->contact_name_ar ?? $lead->contact_name,
                'type' => $customerData['type'] ?? 'external',
                'company' => $customerData['company'] ?? $lead->company_name,
                'email' => $customerData['email'] ?? $lead->email,
                'phone' => $customerData['phone'] ?? $lead->phone,
                'city' => $customerData['city'] ?? $lead->city,
                'address' => $customerData['address'] ?? $lead->address,
                'sales_rep_id' => $lead->sales_rep_id,
                'payment_terms' => $customerData['payment_terms'] ?? null,
                'customer_tier' => $customerData['customer_tier'] ?? 'standard',
                'notes' => $customerData['notes'] ?? null,
                ...(isset($customerData['tax_number']) ? ['tax_number' => $customerData['tax_number']] : []),
                ...(isset($customerData['price_list_id']) ? ['price_list_id' => $customerData['price_list_id']] : []),
                ...(isset($customerData['credit_limit']) ? ['credit_limit' => $customerData['credit_limit']] : []),
            ]);

            $lead->update([
                'stage' => LeadStage::Converted,
                'converted_customer_id' => $customer->id,
                'converted_at' => now(),
            ]);

            LeadConverted::dispatch($lead, $customer);

            return $customer;
        });
    }

    public function markLost(Lead $lead, string $reason, int $userId): Lead
    {
        $lead->update([
            'stage' => LeadStage::Lost,
            'lost_at' => now(),
            'lost_reason' => $reason,
        ]);

        return $lead->fresh();
    }

    public function getLeadsByStage(?int $repId = null): array
    {
        $query = Lead::query();
        if ($repId) {
            $query->where('sales_rep_id', $repId);
        }

        $counts = $query->selectRaw('stage, count(*) as count')
            ->groupBy('stage')
            ->pluck('count', 'stage')
            ->toArray();

        $result = [];
        foreach (LeadStage::cases() as $stage) {
            $result[$stage->value] = $counts[$stage->value] ?? 0;
        }

        return $result;
    }
}
