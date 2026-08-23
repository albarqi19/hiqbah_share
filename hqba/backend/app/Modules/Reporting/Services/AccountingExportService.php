<?php

namespace App\Modules\Reporting\Services;

use App\Modules\Inventory\Models\InventoryMovement;
use App\Modules\Orders\Models\Order;
use App\Modules\Procurement\Models\PurchaseOrder;

class AccountingExportService
{
    public function generateExportData(string $type, ?string $from = null, ?string $to = null): array
    {
        return match ($type) {
            'purchases' => $this->getPurchaseEntries($from, $to),
            'sales' => $this->getSalesEntries($from, $to),
            'inventory_adjustments' => $this->getInventoryAdjustments($from, $to),
            default => [],
        };
    }

    protected function getPurchaseEntries(?string $from, ?string $to): array
    {
        $query = PurchaseOrder::where('status', 'received');
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to);

        return $query->get()->map(fn ($po) => [
            'date' => $po->created_at->toDateString(),
            'reference' => $po->po_number,
            'description' => "Purchase: {$po->po_number}",
            'debit_account' => 'Inventory - Green Coffee',
            'credit_account' => 'Accounts Payable',
            'amount' => (float) $po->total_cost,
            'currency' => $po->currency,
        ])->toArray();
    }

    protected function getSalesEntries(?string $from, ?string $to): array
    {
        $query = Order::where('status', 'shipped')->where('payment_status', 'paid');
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to);

        return $query->get()->map(fn ($o) => [
            'date' => $o->shipped_at?->toDateString() ?? $o->created_at->toDateString(),
            'reference' => $o->order_number,
            'description' => "Sale: {$o->order_number}",
            'debit_account' => 'Accounts Receivable',
            'credit_account' => 'Sales Revenue',
            'amount' => (float) $o->subtotal,
            'vat' => (float) $o->vat_amount,
            'total' => (float) $o->total,
            'currency' => 'SAR',
        ])->toArray();
    }

    protected function getInventoryAdjustments(?string $from, ?string $to): array
    {
        $query = InventoryMovement::whereIn('movement_type', ['adjustment_in', 'adjustment_out', 'reconciliation']);
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to);

        return $query->with('crop')->get()->map(fn ($m) => [
            'date' => $m->created_at->toDateString(),
            'reference' => "ADJ-{$m->id}",
            'description' => $m->notes ?? "Inventory adjustment",
            'crop' => $m->crop?->serial_number,
            'direction' => $m->direction,
            'quantity' => (float) $m->quantity,
            'notes' => $m->notes,
        ])->toArray();
    }
}
