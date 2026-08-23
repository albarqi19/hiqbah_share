<?php

namespace App\Modules\Whatsapp\Services;

use App\Modules\Whatsapp\Models\WhatsappInstance;
use App\Modules\Whatsapp\Models\WhatsappMessage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsappService
{
    public function __construct(
        protected EvolutionApiClient $api,
    ) {}

    public function listInstances()
    {
        return WhatsappInstance::orderBy('is_default', 'desc')
            ->orderBy('id')
            ->get();
    }

    public function defaultInstance(): ?WhatsappInstance
    {
        return WhatsappInstance::where('is_default', true)->first()
            ?? WhatsappInstance::where('status', 'open')->first();
    }

    public function createInstance(array $data): WhatsappInstance
    {
        $name = $data['name'] ?? $this->generateInstanceName();
        $token = 'HQBA_' . Str::random(28);

        $response = $this->api->createInstance($name, $token);

        $finalToken = data_get($response, 'hash.apikey', $token);
        $evolutionId = data_get($response, 'instance.instanceId');

        $instance = WhatsappInstance::create([
            'name' => $name,
            'display_name' => $data['display_name'] ?? $name,
            'status' => 'connecting',
            'evolution_id' => $evolutionId,
            'token' => $finalToken,
            'is_default' => $data['is_default'] ?? !WhatsappInstance::exists(),
            'metadata' => ['api_response' => $response],
        ]);

        $this->refreshQr($instance);

        return $instance->refresh();
    }

    public function refreshQr(WhatsappInstance $instance): WhatsappInstance
    {
        try {
            $data = $this->api->connect($instance->name);

            $qr = data_get($data, 'base64')
                ?? data_get($data, 'qrcode.base64')
                ?? data_get($data, 'qrcode');

            $instance->update([
                'qr_code' => $qr,
                'last_qr_at' => now(),
                'status' => 'connecting',
            ]);
        } catch (\Throwable $e) {
            Log::warning('refreshQr failed', ['name' => $instance->name, 'error' => $e->getMessage()]);
        }

        return $instance;
    }

    public function syncStatus(WhatsappInstance $instance): WhatsappInstance
    {
        try {
            $stateResponse = $this->api->getStatus($instance->name);
        } catch (\Throwable $e) {
            Log::warning('syncStatus connectionState failed', [
                'name' => $instance->name,
                'error' => $e->getMessage(),
            ]);
            return $instance;
        }

        $state = data_get($stateResponse, 'instance.state')
            ?? data_get($stateResponse, 'state')
            ?? data_get($stateResponse, 'instance.connectionStatus')
            ?? 'unknown';

        if ($state === 'unknown') {
            Log::info('syncStatus unknown state', [
                'name' => $instance->name,
                'response' => $stateResponse,
            ]);
            return $instance;
        }

        $update = ['status' => $state];

        if ($state === 'open') {
            try {
                $remote = $this->api->findInstance($instance->name);
            } catch (\Throwable $e) {
                Log::warning('syncStatus findInstance failed', [
                    'name' => $instance->name,
                    'error' => $e->getMessage(),
                ]);
                $remote = null;
            }

            if ($remote) {
                $number = $remote['number'] ?? null;
                if (!$number && !empty($remote['ownerJid'])) {
                    $number = Str::before((string) $remote['ownerJid'], '@');
                }

                if ($number) {
                    $update['phone_number'] = (string) $number;
                }

                if (!empty($remote['profileName'])) {
                    $update['display_name'] = (string) $remote['profileName'];
                }
            }

            $update['connected_at'] = $instance->connected_at ?? now();
            $update['qr_code'] = null;
        }

        $instance->update($update);

        return $instance->refresh();
    }

    public function deleteInstance(WhatsappInstance $instance): void
    {
        $instance->delete();
    }

    public function sendMessage(
        string $phone,
        string $message,
        ?string $eventType = null,
        ?Model $related = null,
        ?WhatsappInstance $instance = null,
    ): WhatsappMessage {
        $instance = $instance ?? $this->defaultInstance();
        $cleanPhone = $this->cleanPhone($phone);

        $log = WhatsappMessage::create([
            'instance_id' => $instance?->id,
            'to_number' => $cleanPhone,
            'message' => $message,
            'event_type' => $eventType,
            'related_type' => $related ? $related->getMorphClass() : null,
            'related_id' => $related?->getKey(),
            'status' => 'pending',
        ]);

        if (!$instance || !$instance->isConnected()) {
            $log->update([
                'status' => 'failed',
                'error' => 'No connected WhatsApp instance available',
            ]);
            return $log;
        }

        if (!$cleanPhone) {
            $log->update(['status' => 'failed', 'error' => 'Invalid phone number']);
            return $log;
        }

        $result = $this->api->sendText($instance->name, $cleanPhone, $message);

        if ($result['success'] ?? false) {
            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
                'response' => $result['response'] ?? null,
            ]);
        } else {
            $log->update([
                'status' => 'failed',
                'error' => is_string($result['error'] ?? null) ? $result['error'] : json_encode($result['error'] ?? null),
            ]);
        }

        return $log->refresh();
    }

    public function cleanPhone(string $phone): ?string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (!$phone) {
            return null;
        }

        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        if (str_starts_with($phone, '0')) {
            $phone = '966' . substr($phone, 1);
        }

        if (strlen($phone) === 9 && str_starts_with($phone, '5')) {
            $phone = '966' . $phone;
        }

        return $phone;
    }

    protected function generateInstanceName(): string
    {
        return 'hqba_' . now()->format('YmdHis');
    }
}
