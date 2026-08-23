<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    public function up(): void
    {
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\RoleAndPermissionSeeder',
            '--force' => true,
        ]);

        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\BranchSeeder',
            '--force' => true,
        ]);

        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\SettingSeeder',
            '--force' => true,
        ]);
    }

    public function down(): void
    {
        // No-op: seeders are idempotent
    }
};
