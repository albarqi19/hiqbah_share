<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Controllers\ApiController;
use App\Core\Models\User;
use App\Modules\Orders\Models\Customer;
use App\Modules\Sales\Services\SalesRepService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesRepController extends ApiController
{
    public function __construct(private SalesRepService $service) {}

    public function assignCustomer(Request $request, Customer $customer): JsonResponse
    {
        $request->validate(['sales_rep_id' => ['required', 'exists:users,id']]);

        $customer = $this->service->assignCustomer($customer->id, $request->input('sales_rep_id'));

        return $this->success($customer, 'تم تعيين المندوب');
    }

    public function bulkAssignCustomers(Request $request): JsonResponse
    {
        $request->validate([
            'customer_ids' => ['required', 'array', 'min:1'],
            'sales_rep_id' => ['required', 'exists:users,id'],
        ]);

        $customers = $this->service->bulkAssignCustomers(
            $request->input('customer_ids'),
            $request->input('sales_rep_id')
        );

        return $this->success($customers, 'تم تعيين المندوب للعملاء');
    }

    public function repCustomers(User $user): JsonResponse
    {
        $customers = Customer::where('sales_rep_id', $user->id)
            ->where('is_active', true)
            ->paginate(request('per_page', 25));

        return $this->success($customers);
    }
}
