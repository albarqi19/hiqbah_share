<?php

namespace App\Core\Resources;

use App\Core\Enums\SettingType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group' => $this->group,
            'key' => $this->key,
            'value' => $this->castValue(),
            'type' => $this->type,
        ];
    }

    protected function castValue(): mixed
    {
        return match ($this->type) {
            SettingType::Integer => (int) $this->value,
            SettingType::Boolean => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            SettingType::Json => json_decode($this->value, true),
            default => $this->value,
        };
    }
}
