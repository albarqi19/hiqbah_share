<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><style>
body { font-family: DejaVu Sans, sans-serif; font-size: 14px; direction: rtl; }
.label { border: 3px solid #000; padding: 20px; max-width: 400px; margin: auto; }
.field { margin: 10px 0; }
.field-label { font-weight: bold; color: #555; font-size: 12px; }
.field-value { font-size: 16px; }
h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
</style></head>
<body>
<div class="label">
<h2>HIQBAH — بوليصة شحن</h2>
<div class="field"><div class="field-label">رقم الطلب / Order #</div><div class="field-value">{{ $order->order_number }}</div></div>
<div class="field"><div class="field-label">العميل / Customer</div><div class="field-value">{{ $order->customer?->name_ar ?? $order->customer?->name }}</div></div>
<div class="field"><div class="field-label">عنوان الشحن / Shipping Address</div><div class="field-value">{{ $order->shipping_address ?? '—' }}</div></div>
<div class="field"><div class="field-label">المدينة / City</div><div class="field-value">{{ $order->shipping_city ?? '—' }}</div></div>
<div class="field"><div class="field-label">التاريخ / Date</div><div class="field-value">{{ now()->format('Y-m-d') }}</div></div>
</div>
</body></html>
