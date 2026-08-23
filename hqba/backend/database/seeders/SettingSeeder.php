<?php

namespace Database\Seeders;

use App\Core\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['group' => 'general', 'key' => 'company_name', 'value' => 'Hiqbah', 'type' => 'string'],
            ['group' => 'general', 'key' => 'company_name_ar', 'value' => 'حِقبة', 'type' => 'string'],
            ['group' => 'general', 'key' => 'currency', 'value' => 'SAR', 'type' => 'string'],
            ['group' => 'general', 'key' => 'timezone', 'value' => 'Asia/Riyadh', 'type' => 'string'],
            ['group' => 'general', 'key' => 'vat_percent', 'value' => '15', 'type' => 'integer'],

            // Inventory
            ['group' => 'inventory', 'key' => 'low_stock_threshold_kg', 'value' => '10', 'type' => 'integer'],
            ['group' => 'inventory', 'key' => 'auto_notify_low_stock', 'value' => '1', 'type' => 'boolean'],

            // Production
            ['group' => 'production', 'key' => 'default_roast_loss_percent', 'value' => '15', 'type' => 'integer'],
            ['group' => 'production', 'key' => 'qc_sample_weight_grams', 'value' => '100', 'type' => 'integer'],

            // Calibration
            ['group' => 'calibration', 'key' => 'calibration_dose_grams', 'value' => '18', 'type' => 'integer'],
            ['group' => 'calibration', 'key' => 'max_calibration_shots', 'value' => '10', 'type' => 'integer'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                $setting,
            );
        }
    }
}
