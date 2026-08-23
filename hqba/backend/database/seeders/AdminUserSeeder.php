<?php

namespace Database\Seeders;

use App\Core\Models\Branch;
use App\Core\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
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

        $admin->assignRole('super_admin');
    }
}
