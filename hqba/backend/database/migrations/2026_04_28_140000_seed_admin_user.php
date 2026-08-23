<?php

use App\Core\Models\Branch;
use App\Core\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $roastery = Branch::where('type', 'roastery')->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@hiqbah.com'],
            [
                'name' => 'Admin',
                'name_ar' => 'المدير',
                'password' => 'password',
                'pin' => '000000',
                'branch_id' => $roastery?->id,
                'is_active' => true,
                'language' => 'ar',
            ]
        );

        if (class_exists(\Spatie\Permission\Models\Role::class)) {
            $role = \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => 'super_admin', 'guard_name' => 'web']
            );
            $admin->assignRole($role);
        }
    }

    public function down(): void
    {
        User::where('email', 'admin@hiqbah.com')->forceDelete();
    }
};
