<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><style>
body { font-family: DejaVu Sans, sans-serif; font-size: 12px; direction: rtl; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
th { background: #f5f5f5; }
h1 { font-size: 20px; margin-bottom: 5px; }
.header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
.meta { display: flex; justify-content: space-between; }
</style></head>
<body>
<div class="header">
<h1>كشف تجميع الطلب — Packing Slip</h1>
<p>رقم الطلب: {{ $order->order_number }}</p>
<p>التاريخ: {{ now()->format('Y-m-d') }}</p>
<p>العميل: {{ $order->customer?->name_ar ?? $order->customer?->name }}</p>
</div>
<table>
<thead><tr><th>#</th><th>المنتج</th><th>المحصول</th><th>النوع</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
<tbody>
@foreach($order->items as $i => $item)
<tr>
<td>{{ $i + 1 }}</td>
<td>{{ $item->product_name }}</td>
<td>{{ $item->crop?->serial_number }}</td>
<td>{{ $item->item_type }}</td>
<td>{{ $item->quantity }}</td>
<td>{{ number_format($item->unit_price, 2) }}</td>
<td>{{ number_format($item->total_price, 2) }}</td>
</tr>
@endforeach
</tbody>
</table>
<div style="margin-top:20px; text-align:left;">
<p>المجموع: {{ number_format($order->subtotal, 2) }} SAR</p>
<p>الضريبة ({{ $order->vat_percent }}%): {{ number_format($order->vat_amount, 2) }} SAR</p>
<p>الخصم: {{ number_format($order->discount, 2) }} SAR</p>
<p><strong>الإجمالي: {{ number_format($order->total, 2) }} SAR</strong></p>
</div>
<div style="margin-top:40px;">
<p>توقيع المستلم: ________________</p>
<p>التاريخ: ________________</p>
</div>
</body></html>
