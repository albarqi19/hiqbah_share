<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Sales\Models\Lead;
use App\Modules\Sales\Requests\CreateLeadRequest;
use App\Modules\Sales\Requests\UpdateLeadRequest;
use App\Modules\Sales\Resources\LeadResource;
use App\Modules\Sales\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends ApiController
{
    public function __construct(private LeadService $service) {}

    public function index(): JsonResponse
    {
        return $this->success(LeadResource::collection($this->service->list()));
    }

    public function store(CreateLeadRequest $request): JsonResponse
    {
        $lead = $this->service->create($request->validated());

        return $this->created(new LeadResource($lead->load('salesRep')));
    }

    public function show(Lead $lead): JsonResponse
    {
        $lead->load(['salesRep', 'convertedCustomer']);

        return $this->success(new LeadResource($lead));
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $lead = $this->service->update($lead, $request->validated());

        return $this->success(new LeadResource($lead));
    }

    public function transition(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'stage' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $lead = $this->service->transition($lead, $request->input('stage'), auth()->id(), $request->input('notes'));

        return $this->success(new LeadResource($lead), 'تم تحديث مرحلة العميل المحتمل');
    }

    public function convert(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'string', 'in:internal,external'],
            'company' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string'],
            'tax_number' => ['nullable', 'string'],
            'payment_terms' => ['nullable', 'string'],
            'customer_tier' => ['nullable', 'string', 'in:standard,silver,gold,vip'],
            'price_list_id' => ['nullable', 'exists:price_lists,id'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
        ]);

        $customer = $this->service->convertToCustomer($lead, $request->all(), auth()->id());

        return $this->created(['customer' => $customer, 'lead' => new LeadResource($lead->fresh())], 'تم تحويل العميل المحتمل بنجاح');
    }

    public function markLost(Request $request, Lead $lead): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string']]);

        $lead = $this->service->markLost($lead, $request->input('reason'), auth()->id());

        return $this->success(new LeadResource($lead));
    }

    public function funnel(): JsonResponse
    {
        $repId = request('sales_rep_id');

        return $this->success($this->service->getLeadsByStage($repId));
    }
}
