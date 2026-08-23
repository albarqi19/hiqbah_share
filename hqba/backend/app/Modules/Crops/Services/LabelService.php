<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class LabelService
{
    public function generateLabel(Crop $crop): string
    {
        $crop->load(['pricing', 'marketing', 'cuppingSessions', 'purchaseOrder.supplier']);

        $data = [
            'crop' => $crop,
            'marketing' => $crop->marketing,
            'pricing' => $crop->pricing,
            'cupping_score' => $crop->cuppingSessions->max('final_score'),
            'classification' => $crop->cuppingSessions->first()?->classification,
            'qr_url' => config('app.frontend_url', 'http://localhost:5173') . '/crops/' . $crop->id . '/journey',
        ];

        $pdf = Pdf::loadView('labels.crop-label', $data);
        $pdf->setPaper([0, 0, 283.46, 425.20], 'portrait'); // 100mm x 150mm

        $filename = "label-{$crop->serial_number}.pdf";
        $path = "labels/{$filename}";

        Storage::disk('public')->put($path, $pdf->output());

        // Update marketing with PDF URL
        if ($crop->marketing) {
            $crop->marketing->update(['label_pdf_url' => "/storage/{$path}"]);
        }

        return "/storage/{$path}";
    }
}
