<?php

namespace App\Modules\Whatsapp\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionApiClient
{
    protected string $apiUrl;
    protected string $apiKey;
    protected int $timeout;

    public function __construct()
    {
        $this->apiUrl = rtrim(config('whatsapp.api_url'), '/');
        $this->apiKey = config('whatsapp.api_key');
        $this->timeout = (int) config('whatsapp.timeout', 30);
    }

    public function fetchInstances(): array
    {
        try {
            $response = $this->request()->get($this->apiUrl . '/instance/fetchInstances');
        } catch (\Throwable $e) {
            Log::error('Evolution fetchInstances connection error', [
                'url' => $this->apiUrl,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Cannot reach WhatsApp gateway: ' . $e->getMessage(), 0, $e);
        }

        if (!$response->successful()) {
            Log::error('Evolution fetchInstances HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('WhatsApp gateway returned ' . $response->status() . ': ' . $response->body());
        }

        return $response->json() ?? [];
    }

    public function findInstance(string $name): ?array
    {
        foreach ($this->fetchInstances() as $instance) {
            if (($instance['name'] ?? null) === $name) {
                return $instance;
            }
        }
        return null;
    }

    public function createInstance(string $name, ?string $token = null): array
    {
        $payload = [
            'instanceName' => $name,
            'token' => $token,
            'qrcode' => true,
            'integration' => 'WHATSAPP-BAILEYS',
            'reject_call' => false,
            'groups_ignore' => true,
            'always_online' => false,
            'read_messages' => false,
            'read_status' => false,
            'sync_full_history' => false,
        ];

        $response = $this->request()->post($this->apiUrl . '/instance/create', $payload);

        if (!$response->successful()) {
            throw new \RuntimeException('Evolution createInstance failed: ' . $response->body());
        }

        return $response->json();
    }

    public function connect(string $name): array
    {
        $response = $this->request()->get($this->apiUrl . "/instance/connect/{$name}");

        if (!$response->successful()) {
            throw new \RuntimeException('Evolution connect failed: ' . $response->body());
        }

        return $response->json();
    }

    public function getStatus(string $name): array
    {
        $response = $this->shortRequest()->get($this->apiUrl . "/instance/connectionState/{$name}");
        return $response->successful() ? $response->json() : ['instance' => ['state' => 'unknown']];
    }

    public function logout(string $name): bool
    {
        return $this->shortRequest()->delete($this->apiUrl . "/instance/logout/{$name}")->successful();
    }

    public function delete(string $name): bool
    {
        return $this->shortRequest()->delete($this->apiUrl . "/instance/delete/{$name}")->successful();
    }

    protected function shortRequest(): PendingRequest
    {
        return Http::timeout(3)
            ->connectTimeout(3)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'apikey' => $this->apiKey,
            ]);
    }

    public function sendText(string $instance, string $number, string $text): array
    {
        $response = $this->request()->post(
            $this->apiUrl . "/message/sendText/{$instance}",
            ['number' => $number, 'text' => $text]
        );

        if (!$response->successful()) {
            Log::warning('WhatsApp sendText failed', [
                'instance' => $instance,
                'number' => $number,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['success' => false, 'error' => $response->body(), 'status' => $response->status()];
        }

        return ['success' => true, 'response' => $response->json()];
    }

    protected function request(): PendingRequest
    {
        return Http::timeout($this->timeout)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'apikey' => $this->apiKey,
            ]);
    }
}
