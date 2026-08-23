<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @font-face {
            font-family: 'Arial';
            src: local('Arial');
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { width: 100mm; padding: 6mm; direction: rtl; }
        .header { text-align: center; border-bottom: 2px solid #1e1b2e; padding-bottom: 4mm; margin-bottom: 4mm; }
        .brand { font-size: 22pt; font-weight: bold; color: #1e1b2e; letter-spacing: 2px; }
        .brand-ar { font-size: 14pt; color: #666; margin-top: 2mm; }
        .product-name { font-size: 13pt; font-weight: bold; color: #333; margin: 3mm 0; }
        .product-name-ar { font-size: 11pt; color: #555; }
        .origin-box { background: #f5f0eb; border-radius: 3mm; padding: 3mm; margin: 3mm 0; }
        .origin-row { display: flex; justify-content: space-between; font-size: 8pt; margin: 1mm 0; }
        .origin-label { color: #999; }
        .origin-value { font-weight: bold; color: #333; }
        .flavors { text-align: center; margin: 4mm 0; }
        .flavor-title { font-size: 7pt; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        .flavor-notes { font-size: 10pt; font-weight: bold; color: #8B5E3C; margin-top: 2mm; }
        .score-box { text-align: center; background: #1e1b2e; color: white; border-radius: 3mm; padding: 3mm; margin: 3mm 0; }
        .score-number { font-size: 20pt; font-weight: bold; }
        .score-label { font-size: 7pt; opacity: 0.8; }
        .prices { margin: 3mm 0; }
        .price-row { display: flex; justify-content: space-between; font-size: 8pt; padding: 1.5mm 0; border-bottom: 0.5px solid #eee; }
        .price-label { color: #666; }
        .price-value { font-weight: bold; }
        .footer { text-align: center; margin-top: 4mm; font-size: 6pt; color: #999; border-top: 1px solid #eee; padding-top: 2mm; }
        .serial { font-family: monospace; font-size: 7pt; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">HIQBAH</div>
        <div class="brand-ar">حِقبة</div>
    </div>

    @if($marketing)
    <div class="product-name">{{ $marketing->product_name }}</div>
    <div class="product-name-ar">{{ $marketing->product_name_ar }}</div>
    @else
    <div class="product-name">{{ $crop->name }}</div>
    <div class="product-name-ar">{{ $crop->name_ar }}</div>
    @endif

    <div class="origin-box">
        <div class="origin-row">
            <span class="origin-label">المنشأ</span>
            <span class="origin-value">{{ $crop->origin_country }}, {{ $crop->region }}</span>
        </div>
        @if($crop->farm)
        <div class="origin-row">
            <span class="origin-label">المزرعة</span>
            <span class="origin-value">{{ $crop->farm }}</span>
        </div>
        @endif
        <div class="origin-row">
            <span class="origin-label">المعالجة</span>
            <span class="origin-value">{{ $crop->process }}</span>
        </div>
        @if($crop->variety)
        <div class="origin-row">
            <span class="origin-label">الصنف</span>
            <span class="origin-value">{{ $crop->variety }}</span>
        </div>
        @endif
        @if($crop->altitude)
        <div class="origin-row">
            <span class="origin-label">الارتفاع</span>
            <span class="origin-value">{{ $crop->altitude }}</span>
        </div>
        @endif
    </div>

    <div class="flavors">
        <div class="flavor-title">FLAVOR NOTES &bull; إيحاءات النكهة</div>
        <div class="flavor-notes">
            {{ $marketing?->flavor_display ?? implode(' • ', $crop->flavor_notes ?? []) }}
        </div>
    </div>

    @if($cupping_score)
    <div class="score-box">
        <div class="score-number">{{ number_format($cupping_score, 1) }}</div>
        <div class="score-label">SCA CUPPING SCORE &bull; {{ $classification === 'outstanding' ? 'متميز' : ($classification === 'excellent' ? 'ممتاز' : 'جيد جداً') }}</div>
    </div>
    @endif

    @if($pricing)
    <div class="prices">
        @if($pricing->retail_price_250g)
        <div class="price-row">
            <span class="price-label">250g</span>
            <span class="price-value">{{ number_format($pricing->retail_price_250g, 2) }} SAR</span>
        </div>
        @endif
        @if($pricing->retail_price_500g)
        <div class="price-row">
            <span class="price-label">500g</span>
            <span class="price-value">{{ number_format($pricing->retail_price_500g, 2) }} SAR</span>
        </div>
        @endif
        @if($pricing->retail_price_1kg)
        <div class="price-row">
            <span class="price-label">1kg</span>
            <span class="price-value">{{ number_format($pricing->retail_price_1kg, 2) }} SAR</span>
        </div>
        @endif
    </div>
    @endif

    <div class="footer">
        <div class="serial">{{ $crop->serial_number }}</div>
        <div>Scan QR for full journey &bull; امسح للتتبع الكامل</div>
    </div>
</body>
</html>
