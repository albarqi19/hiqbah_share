<?php

namespace App\Modules\Reporting\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Reporting\Services\AccountingExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AccountingExportController extends ApiController
{
    public function __construct(protected AccountingExportService $service) {}

    public function export(Request $request): JsonResponse|Response
    {
        $request->validate([
            'type' => ['required', 'in:purchases,sales,inventory_adjustments'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'format' => ['nullable', 'in:json,csv'],
        ]);

        $data = $this->service->generateExportData(
            $request->input('type'),
            $request->input('from'),
            $request->input('to'),
        );

        if ($request->input('format') === 'csv') {
            $csvData = $this->convertToCsv($data);
            return response($csvData, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="qoyod-export-' . now()->format('Y-m-d') . '.csv"',
            ]);
        }

        return $this->success([
            'type' => $request->input('type'),
            'from' => $request->input('from'),
            'to' => $request->input('to'),
            'entries_count' => count($data),
            'entries' => $data,
        ]);
    }

    private function convertToCsv(array $data): string
    {
        if (empty($data)) {
            return '';
        }

        $output = fopen('php://temp', 'r+');

        // Write header row from first entry's keys
        fputcsv($output, array_keys($data[0]));

        // Write data rows
        foreach ($data as $row) {
            fputcsv($output, array_values($row));
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}
