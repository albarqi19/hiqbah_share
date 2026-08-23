<?php

namespace App\Core\Models;

use App\Core\Enums\SettingType;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'type' => SettingType::class,
        ];
    }

    // ── Scopes ──

    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    // ── Static Helpers ──

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            SettingType::Integer => (int) $setting->value,
            SettingType::Boolean => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            SettingType::Json => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    public static function setValue(string $key, mixed $value, string $group = 'general', SettingType $type = SettingType::String): void
    {
        $storeValue = match ($type) {
            SettingType::Json => json_encode($value),
            SettingType::Boolean => $value ? '1' : '0',
            default => (string) $value,
        };

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $storeValue, 'group' => $group, 'type' => $type],
        );
    }
}
