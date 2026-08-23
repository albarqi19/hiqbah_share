<?php

namespace App\Modules\Whatsapp\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Whatsapp\Models\WhatsappInstance;
use App\Modules\Whatsapp\Models\WhatsappMessage;
use App\Modules\Whatsapp\Requests\SendMessageRequest;
use App\Modules\Whatsapp\Requests\StoreInstanceRequest;
use App\Modules\Whatsapp\Resources\WhatsappInstanceResource;
use App\Modules\Whatsapp\Resources\WhatsappMessageResource;
use App\Modules\Whatsapp\Services\WhatsappService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsappInstanceController extends ApiController
{
    public function __construct(
        protected WhatsappService $service,
    ) {}

    public function index(): JsonResponse
    {
        return $this->success(WhatsappInstanceResource::collection($this->service->listInstances()));
    }

    public function store(StoreInstanceRequest $request): JsonResponse
    {
        $instance = $this->service->createInstance($request->validated());

        return $this->created(new WhatsappInstanceResource($instance));
    }

    public function show(WhatsappInstance $instance): JsonResponse
    {
        return $this->success(new WhatsappInstanceResource($instance));
    }

    public function qr(WhatsappInstance $instance): JsonResponse
    {
        try {
            $instance = $this->service->refreshQr($instance);
        } catch (\Throwable $e) {
            return $this->error('QR refresh failed: ' . $e->getMessage(), 502);
        }

        return $this->success([
            'qr_code' => $instance->qr_code,
            'status' => $instance->status,
            'last_qr_at' => $instance->last_qr_at,
        ]);
    }

    public function status($instance): JsonResponse
    {
        $id = (int) $instance;
        $model = WhatsappInstance::find($id);

        if (!$model) {
            return $this->error('Instance not found', 404);
        }

        try {
            $model = $this->service->syncStatus($model);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('status syncStatus error', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
        }

        $fresh = $model->fresh() ?? $model;

        return $this->success(new WhatsappInstanceResource($fresh));
    }

    public function destroy($instance): JsonResponse
    {
        $id = (int) $instance;
        $model = WhatsappInstance::find($id);

        $existedBefore = $model !== null;
        $deleted = false;
        $error = null;

        if ($model) {
            try {
                $deleted = (bool) $model->delete();
            } catch (\Throwable $e) {
                $error = $e->getMessage();
                \Illuminate\Support\Facades\Log::error('WhatsappInstance delete failed', [
                    'id' => $id,
                    'error' => $error,
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $stillExists = WhatsappInstance::where('id', $id)->exists();

        return response()->json([
            'success' => !$stillExists,
            'message' => $stillExists ? 'Instance still exists in DB' : 'Deleted successfully',
            'debug' => [
                'id' => $id,
                'existed_before' => $existedBefore,
                'delete_returned' => $deleted,
                'still_exists' => $stillExists,
                'error' => $error,
            ],
        ], $stillExists ? 500 : 200);
    }

    public function send(SendMessageRequest $request): JsonResponse
    {
        $instance = $request->instance_id
            ? WhatsappInstance::find($request->instance_id)
            : null;

        $message = $this->service->sendMessage(
            phone: $request->phone,
            message: $request->message,
            eventType: 'manual',
            instance: $instance,
        );

        return $this->success(new WhatsappMessageResource($message));
    }

    public function messages(Request $request): JsonResponse
    {
        $messages = WhatsappMessage::with('instance')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->event_type, fn ($q, $e) => $q->where('event_type', $e))
            ->latest()
            ->paginate($request->per_page ?? 25);

        return $this->success(WhatsappMessageResource::collection($messages));
    }
}
