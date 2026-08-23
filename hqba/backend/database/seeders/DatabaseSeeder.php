<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            BranchSeeder::class,
            SettingSeeder::class,
            AdminUserSeeder::class,
            SampleCropJourneySeeder::class,
            SalesAndPricingSeeder::class,
        ]);
    }
}
