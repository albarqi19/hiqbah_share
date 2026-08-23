<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<style>
body { font-family: DejaVu Sans, sans-serif; font-size: 12px; direction: rtl; color: #333; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
th { background: #2c3e50; color: #fff; font-size: 11px; }
h1 { font-size: 22px; margin-bottom: 5px; color: #2c3e50; }
h2 { font-size: 14px; color: #7f8c8d; margin: 0; }
.header { border-bottom: 3px solid #2c3e50; padding-bottom: 15px; margin-bottom: 20px; }
.company-name { font-size: 28px; font-weight: bold; color: #2c3e50; }
.meta-grid { display: table; width: 100%; margin-bottom: 20px; }
.meta-col { display: table-cell; width: 50%; vertical-align: top; }
.meta-box { background: #f8f9fa; padding: 12px; border-radius: 4px; margin: 5px; }
.meta-box p { margin: 3px 0; }
.meta-label { color: #7f8c8d; font-size: 10px; }
.totals { margin-top: 15px; width: 50%; margin-right: auto; }
.totals td { border: none; padding: 5px 10px; }
.totals .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #2c3e50; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #7f8c8d; }
.validity { background: #fff3cd; padding: 10px; margin-top: 15px; border-radius: 4px; font-size: 11px; }
.stamp-area { margin-top: 40px; }
.stamp-box { display: inline-block; width: 45%; border: 1px dashed #ccc; padding: 20px; text-align: center; min-height: 60px; }
</style>
</head>
<body>

{{-- ── Header ── --}}
<div class="header">
    <div class="company-name">هقبة للقهوة المختصة</div>
    <div style="color: #7f8c8d;">HIQBAH Specialty Coffee</div>
</div>

<h1>عرض سعر — Proforma Invoice</h1>
<h2>{{ $order->quote_number ?? 'DRAFT' }}</h2>

{{-- ── Meta Info ── --}}
<div class="meta-grid">
    <div class="meta-col">
        <div class="meta-box">
            <p class="meta-label">بيانات العميل — Customer</p>
            <p><strong>{{ $order->customer?->name_ar ?? $order->customer?->name }}</strong></p>
            @if($order->customer?->company)
                <p>{{ $order->customer->company }}</p>
            @endif
            @if($order->customer?->phone)
                <p>{{ $order->customer->phone }}</p>
            @endif
            @if($order->customer?->email)
                <p>{{ $order->customer->email }}</p>
            @endif
            @if($order->customer?->tax_number)
                <p>رقم الضريبة: {{ $order->customer->tax_number }}</p>
            @endif
        </div>
    </div>
    <div class="meta-col">
        <div class="meta-box">
            <p class="meta-label">بيانات عرض السعر — Quote Details</p>
            <p>رقم الطلب: <strong>{{ $order->order_number }}</strong></p>
            <p>تاريخ الإصدار: {{ $order->quote_generated_at?->format('Y-m-d') ?? now()->format('Y-m-d') }}</p>
            <p>صلاحية العرض: {{ now()->addDays(15)->format('Y-m-d') }}</p>
            @if($order->payment_terms)
                <p>شروط الدفع: {{ $order->payment_terms }}</p>
            @endif
            @if($order->salesRep)
                <p>المندوب: {{ $order->salesRep->name_ar ?? $order->salesRep->name }}</p>
            @endif
        </div>
    </div>
</div>

{{-- ── Items Table ── --}}
<table>
    <thead>
        <tr>
            <th style="width: 5%">#</th>
            <th style="width: 30%">المنتج — Product</th>
            <th style="width: 15%">المحصول — Crop</th>
            <th style="width: 10%">النوع — Type</th>
            <th style="width: 10%">الكمية — Qty</th>
            <th style="width: 15%">سعر الوحدة — Unit Price</th>
            <th style="width: 15%">الإجمالي — Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($order->items as $i => $item)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $item->product_name }}</td>
            <td>{{ $item->crop?->serial_number }}</td>
            <td>{{ $item->item_type }}</td>
            <td>{{ $item->quantity }}</td>
            <td>{{ number_format($item->unit_price, 2) }} ر.س</td>
            <td>{{ number_format($item->total_price, 2) }} ر.س</td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- ── Totals ── --}}
<table class="totals">
    <tr>
        <td>المجموع الفرعي — Subtotal</td>
        <td>{{ number_format($order->subtotal, 2) }} ر.س</td>
    </tr>
    @if($order->discount > 0)
    <tr>
        <td>الخصم — Discount</td>
        <td style="color: #e74c3c;">- {{ number_format($order->discount, 2) }} ر.س</td>
    </tr>
    @endif
    <tr>
        <td>ضريبة القيمة المضافة ({{ $order->vat_percent }}%) — VAT</td>
        <td>{{ number_format($order->vat_amount, 2) }} ر.س</td>
    </tr>
    <tr class="total-row">
        <td>الإجمالي — Grand Total</td>
        <td>{{ number_format($order->total, 2) }} ر.س</td>
    </tr>
</table>

{{-- ── Validity Notice ── --}}
<div class="validity">
    <strong>ملاحظة:</strong> هذا عرض سعر وليس فاتورة. صالح لمدة 15 يوم من تاريخ الإصدار. الأسعار لا تشمل تكاليف الشحن إلا إذا ذُكر غير ذلك.
    <br>
    <strong>Note:</strong> This is a proforma invoice, not a tax invoice. Valid for 15 days from issue date. Prices exclude shipping unless stated otherwise.
</div>

@if($order->notes)
<div style="margin-top: 15px;">
    <strong>ملاحظات:</strong> {{ $order->notes }}
</div>
@endif

{{-- ── Signature Area ── --}}
<div class="stamp-area">
    <div class="stamp-box">
        <p>توقيع المورد — Supplier Signature</p>
    </div>
    <div class="stamp-box" style="margin-right: 5%;">
        <p>توقيع العميل — Customer Signature</p>
    </div>
</div>

{{-- ── Footer ── --}}
<div class="footer">
    <p>هقبة للقهوة المختصة — HIQBAH Specialty Coffee | الرياض، المملكة العربية السعودية</p>
</div>

</body>
</html>
