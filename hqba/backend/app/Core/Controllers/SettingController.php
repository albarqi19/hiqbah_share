<?php

namespace App\Core\Controllers;

use App\Core\Enums\SettingType;
use App\Core\Models\Setting;
use App\Core\Requests\UpdateSettingsRequest;
use App\Core\Resources\SettingResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Setting::query();

        if ($request->has('group')) {
            $query->group($request->group);
        }

        $settings = $query->orderBy('group')->orderBy('key')->get();

        return $this->success(SettingResource::collection($settings));
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        foreach ($request->settings as $item) {
            Setting::setValue(
                key: $item['key'],
                value: $item['value'],
                group: $item['group'] ?? 'general',
                type: SettingType::tryFrom($item['type'] ?? 'string') ?? SettingType::String,
            );
        }

        $settings = Setting::orderBy('group')->orderBy('key')->get();

        return $this->success(SettingResource::collection($settings));
    }
}
