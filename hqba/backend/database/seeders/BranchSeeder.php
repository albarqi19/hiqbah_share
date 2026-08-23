<?php

namespace Database\Seeders;

use App\Core\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        Branch::firstOrCreate(
            ['name' => 'Hiqbah Roastery'],
            [
                'name_ar' => 'محمصة حِقبة',
                'type' => 'roastery',
                'city' => 'Jeddah',
                'is_active' => true,
            ]
        );

        Branch::firstOrCreate(
            ['name' => 'Hiqbah Branch 1'],
            [
                'name_ar' => 'فرع حِقبة 1',
                'type' => 'branch',
                'city' => 'Jeddah',
                'is_active' => true,
            ]
        );
    }
}
