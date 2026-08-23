<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $rules = [
            // ── Purchase Requisition ──
            [
                'name' => 'Requisition - Standard',
                'entity_type' => 'App\\Modules\\Procurement\\Models\\PurchaseRequisition',
                'min_amount' => 0,
                'max_amount' => null,
                'required_approvers' => json_encode([
                    ['type' => 'role', 'value' => 'admin'],
                ]),
                'approval_type' => 'any_one',
                'priority' => 10,
                'is_active' => true,
                'description' => 'كل طلب شراء داخلي يعتمده مسؤول الشراء (Admin) في MVP.',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // ── Purchase Order ──
            [
                'name' => 'PO - Small (≤ 5,000 SAR)',
                'entity_type' => 'App\\Modules\\Procurement\\Models\\PurchaseOrder',
                'min_amount' => 0,
                'max_amount' => 5000,
                'required_approvers' => json_encode([
                    ['type' => 'role', 'value' => 'admin'],
                ]),
                'approval_type' => 'any_one',
                'priority' => 30,
                'is_active' => true,
                'description' => 'PO صغيرة: مسؤول الشراء يعتمد بشكل مستقل.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'PO - Mid (5,001 – 50,000 SAR)',
                'entity_type' => 'App\\Modules\\Procurement\\Models\\PurchaseOrder',
                'min_amount' => 5000.01,
                'max_amount' => 50000,
                'required_approvers' => json_encode([
                    ['type' => 'role', 'value' => 'admin'],
                    ['type' => 'role', 'value' => 'accountant'],
                ]),
                'approval_type' => 'sequential',
                'priority' => 20,
                'is_active' => true,
                'description' => 'PO متوسطة: تحتاج اعتماد مسؤول الشراء ثم المحاسب.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'PO - Large (> 50,000 SAR)',
                'entity_type' => 'App\\Modules\\Procurement\\Models\\PurchaseOrder',
                'min_amount' => 50000.01,
                'max_amount' => null,
                'required_approvers' => json_encode([
                    ['type' => 'role', 'value' => 'admin'],
                    ['type' => 'role', 'value' => 'accountant'],
                    ['type' => 'role', 'value' => 'super_admin'],
                ]),
                'approval_type' => 'sequential',
                'priority' => 10,
                'is_active' => true,
                'description' => 'PO كبيرة: تتطلب تسلسلاً كاملاً وانتهاء بالمالك.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('approval_rules')->insert($rules);
    }

    public function down(): void
    {
        DB::table('approval_rules')
            ->whereIn('entity_type', [
                'App\\Modules\\Procurement\\Models\\PurchaseRequisition',
                'App\\Modules\\Procurement\\Models\\PurchaseOrder',
            ])
            ->delete();
    }
};
