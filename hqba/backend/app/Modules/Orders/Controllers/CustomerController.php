<?php

namespace App\Modules\Orders\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Orders\Models\Customer;
use App\Modules\Orders\Requests\CustomerRequest;
use App\Modules\Orders\Resources\CustomerResource;
use App\Modules\Orders\Services\CustomerService;
use Illuminate\Http\JsonResponse;

class CustomerController extends ApiController
{
    public function __construct(protected CustomerService $service) {}

    public function index(): JsonResponse
    {
        return $this->success(CustomerResource::collection($this->service->list()));
    }

    public function store(CustomerRequest $request): JsonResponse
    {
        return $this->created(new CustomerResource($this->service->create($request->validated())));
    }

    public function show(Customer $customer): JsonResponse
    {
        return $this->success(new CustomerResource($customer));
    }

    public function update(Customer $customer, CustomerRequest $request): JsonResponse
    {
        return $this->success(new CustomerResource($this->service->update($customer, $request->validated())));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->service->delete($customer);
        return $this->noContent('Customer deleted');
    }

    public function syncBranches(): JsonResponse
    {
        $this->service->syncBranchCustomers();
        return $this->success(null, 'Branch customers synced');
    }
}
