<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FileUploadController extends ApiController
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
            'type' => ['required', 'string', 'in:shipping_document,inspection_photo,product_photo'],
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        $path = $file->store("uploads/{$type}", 'public');

        return $this->success([
            'url' => "/storage/{$path}",
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ]);
    }
}
