<?php

namespace Database\Seeders;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Orders\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Pricing\Enums\DiscountCalculation;
use App\Modules\Pricing\Enums\DiscountType;
use App\Modules\Pricing\Enums\PriceListStatus;
use App\Modules\Pricing\Enums\PriceListType;
use App\Modules\Pricing\Enums\RoundingRule;
use App\Modules\Pricing\Models\Discount;
use App\Modules\Pricing\Models\PriceChangeLog;
use App\Modules\Pricing\Models\PriceList;
use App\Modules\Pricing\Models\PriceListItem;
use App\Modules\Sales\Enums\CommissionStatus;
use App\Modules\Sales\Enums\CommissionType;
use App\Modules\Sales\Enums\LeadStage;
use App\Modules\Sales\Models\Commission;
use App\Modules\Sales\Models\CommissionRule;
use App\Modules\Sales\Models\Lead;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalesAndPricingSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Sales & Pricing data...');

        $admin = User::where('email', 'admin@hiqbah.com')->first();
        $accountant = User::where('email', 'accountant@hiqbah.com')->first();

        if (! $admin) {
            $this->command->warn('Admin user not found. Run AdminUserSeeder first.');
            return;
        }

        // ── 1. Create Sales Rep & Sales Manager Users ──
        $this->command->info('  → Creating sales users...');

        $salesManager = User::firstOrCreate(
            ['email' => 'sales.manager@hiqbah.com'],
            [
                'name' => 'Faisal Al-Sales',
                'name_ar' => 'فيصل مدير المبيعات',
                'password' => bcrypt('password'),
                'pin' => bcrypt('666666'),
                'branch_id' => 1,
                'is_active' => true,
                'language' => 'ar',
            ]
        );
        $salesManager->assignRole('sales_manager');

        $salesRep1 = User::firstOrCreate(
            ['email' => 'rep1@hiqbah.com'],
            [
                'name' => 'Mohammed Al-Rep',
                'name_ar' => 'محمد المندوب',
                'password' => bcrypt('password'),
                'pin' => bcrypt('777777'),
                'branch_id' => 1,
                'is_active' => true,
                'language' => 'ar',
            ]
        );
        $salesRep1->assignRole('sales_rep');

        $salesRep2 = User::firstOrCreate(
            ['email' => 'rep2@hiqbah.com'],
            [
                'name' => 'Ali Al-Rep',
                'name_ar' => 'علي المندوب',
                'password' => bcrypt('password'),
                'pin' => bcrypt('888888'),
                'branch_id' => 1,
                'is_active' => true,
                'language' => 'ar',
            ]
        );
        $salesRep2->assignRole('sales_rep');

        // ── 2. Price Lists ──
        $this->command->info('  → Creating price lists...');

        $wholesaleList = PriceList::firstOrCreate(
            ['code' => 'WHL-STD'],
            [
                'name' => 'Wholesale Standard',
                'name_ar' => 'الجملة القياسي',
                'type' => PriceListType::Wholesale,
                'currency' => 'SAR',
                'is_default' => true,
                'is_active' => true,
                'description' => 'Standard wholesale pricing for B2B clients',
                'description_ar' => 'أسعار الجملة القياسية لعملاء الأعمال',
                'rounding_rule' => RoundingRule::NearestRiyal,
                'status' => PriceListStatus::Active,
                'created_by' => $accountant?->id ?? $admin->id,
                'approved_by' => $admin->id,
                'approved_at' => now()->subDays(10),
            ]
        );

        $retailList = PriceList::firstOrCreate(
            ['code' => 'RTL-STD'],
            [
                'name' => 'Retail Standard',
                'name_ar' => 'التجزئة القياسي',
                'type' => PriceListType::Retail,
                'currency' => 'SAR',
                'is_default' => true,
                'is_active' => true,
                'description' => 'Standard retail pricing for consumers and branches',
                'description_ar' => 'أسعار التجزئة القياسية للمستهلكين والفروع',
                'rounding_rule' => RoundingRule::NearestHalala,
                'status' => PriceListStatus::Active,
                'created_by' => $accountant?->id ?? $admin->id,
                'approved_by' => $admin->id,
                'approved_at' => now()->subDays(10),
            ]
        );

        $vipList = PriceList::firstOrCreate(
            ['code' => 'VIP-GOLD'],
            [
                'name' => 'VIP Gold Partners',
                'name_ar' => 'شركاء VIP الذهبي',
                'type' => PriceListType::Vip,
                'currency' => 'SAR',
                'is_default' => false,
                'is_active' => true,
                'description' => 'Special pricing for VIP gold-tier wholesale partners',
                'description_ar' => 'أسعار خاصة لشركاء الجملة من الفئة الذهبية',
                'rounding_rule' => RoundingRule::NearestRiyal,
                'status' => PriceListStatus::Active,
                'created_by' => $admin->id,
                'approved_by' => $admin->id,
                'approved_at' => now()->subDays(5),
            ]
        );

        $draftList = PriceList::firstOrCreate(
            ['code' => 'RMD-2026'],
            [
                'name' => 'Ramadan 2026 Special',
                'name_ar' => 'عروض رمضان 2026',
                'type' => PriceListType::Custom,
                'currency' => 'SAR',
                'is_default' => false,
                'is_active' => false,
                'description' => 'Special pricing for Ramadan campaign',
                'description_ar' => 'أسعار خاصة لحملة رمضان',
                'rounding_rule' => RoundingRule::NearestRiyal,
                'status' => PriceListStatus::Draft,
                'created_by' => $salesManager->id,
            ]
        );

        // ── 3. Price List Items (linked to existing crops) ──
        $this->command->info('  → Adding price list items...');

        $crops = Crop::all();
        foreach ($crops as $crop) {
            $cropPricing = $crop->pricing;
            if (! $cropPricing) {
                continue;
            }

            // Wholesale prices (slightly lower than retail)
            foreach (['finished_250', 'finished_500', 'finished_1kg'] as $itemType) {
                $retailPrice = match ($itemType) {
                    'finished_250' => (float) ($cropPricing->retail_price_250g ?? 0),
                    'finished_500' => (float) ($cropPricing->retail_price_500g ?? 0),
                    'finished_1kg' => (float) ($cropPricing->retail_price_1kg ?? 0),
                };

                if ($retailPrice <= 0) {
                    continue;
                }

                // Retail list = same as crop pricing
                PriceListItem::firstOrCreate(
                    [
                        'price_list_id' => $retailList->id,
                        'crop_id' => $crop->id,
                        'item_type' => $itemType,
                        'effective_from' => null,
                    ],
                    [
                        'unit_price' => $retailPrice,
                        'min_quantity' => 1,
                        'is_active' => true,
                    ]
                );

                // Wholesale = 15% discount from retail
                PriceListItem::firstOrCreate(
                    [
                        'price_list_id' => $wholesaleList->id,
                        'crop_id' => $crop->id,
                        'item_type' => $itemType,
                        'effective_from' => null,
                    ],
                    [
                        'unit_price' => round($retailPrice * 0.85, 2),
                        'min_quantity' => 5,
                        'is_active' => true,
                    ]
                );

                // VIP = 25% discount from retail
                PriceListItem::firstOrCreate(
                    [
                        'price_list_id' => $vipList->id,
                        'crop_id' => $crop->id,
                        'item_type' => $itemType,
                        'effective_from' => null,
                    ],
                    [
                        'unit_price' => round($retailPrice * 0.75, 2),
                        'min_quantity' => 10,
                        'is_active' => true,
                    ]
                );
            }
        }

        // ── 4. Discounts ──
        $this->command->info('  → Creating discounts...');

        Discount::firstOrCreate(
            ['code' => 'BULK50'],
            [
                'name' => 'Bulk Order 50+ bags',
                'name_ar' => 'طلب كبير 50+ كيس',
                'type' => DiscountType::Volume,
                'calculation' => DiscountCalculation::Percentage,
                'value' => 10,
                'min_quantity' => 50,
                'is_active' => true,
                'created_by' => $admin->id,
            ]
        );

        Discount::firstOrCreate(
            ['code' => 'WELCOME10'],
            [
                'name' => 'Welcome - New Client',
                'name_ar' => 'ترحيب - عميل جديد',
                'type' => DiscountType::Coupon,
                'calculation' => DiscountCalculation::Percentage,
                'value' => 10,
                'max_uses' => 100,
                'is_active' => true,
                'valid_from' => now()->startOfYear(),
                'valid_until' => now()->endOfYear(),
                'created_by' => $salesManager->id,
            ]
        );

        Discount::firstOrCreate(
            ['code' => 'SUMMER50'],
            [
                'name' => 'Summer Sale',
                'name_ar' => 'تخفيضات الصيف',
                'type' => DiscountType::Seasonal,
                'calculation' => DiscountCalculation::FixedAmount,
                'value' => 50,
                'min_order_amount' => 500,
                'max_uses' => 200,
                'is_active' => true,
                'valid_from' => now()->month(6)->startOfMonth(),
                'valid_until' => now()->month(8)->endOfMonth(),
                'created_by' => $salesManager->id,
            ]
        );

        // Customer-specific discount for Elite Coffee Shop
        $eliteCustomer = Customer::where('company', 'like', '%Elite%')->first();
        if ($eliteCustomer) {
            Discount::firstOrCreate(
                ['code' => 'ELITE-VIP'],
                [
                    'name' => 'Elite Coffee VIP Discount',
                    'name_ar' => 'خصم VIP لإيليت كوفي',
                    'type' => DiscountType::CustomerSpecific,
                    'calculation' => DiscountCalculation::Percentage,
                    'value' => 5,
                    'customer_id' => $eliteCustomer->id,
                    'is_active' => true,
                    'created_by' => $salesManager->id,
                ]
            );
        }

        // ── 5. Update Existing Customers with Sales Fields ──
        $this->command->info('  → Updating customers with sales data...');

        // Assign sales rep to existing customers
        $customers = Customer::all();
        foreach ($customers as $customer) {
            $updates = [];

            if (! $customer->sales_rep_id) {
                $updates['sales_rep_id'] = $customer->type === 'external' ? $salesRep1->id : null;
            }

            if (! $customer->price_list_id) {
                $updates['price_list_id'] = $customer->type === 'external'
                    ? $wholesaleList->id
                    : $retailList->id;
            }

            if (! $customer->payment_terms) {
                $updates['payment_terms'] = $customer->type === 'external' ? 'net_30' : 'prepaid';
            }

            if (! $customer->customer_tier) {
                $updates['customer_tier'] = 'standard';
            }

            if ($customer->company && str_contains($customer->company, 'Elite')) {
                $updates['customer_tier'] = 'gold';
                $updates['credit_limit'] = 50000;
                $updates['price_list_id'] = $vipList->id;
            }

            if (! empty($updates)) {
                $customer->update($updates);
            }
        }

        // ── 6. Commission Rules ──
        $this->command->info('  → Creating commission rules...');

        // Default rule for all reps
        CommissionRule::firstOrCreate(
            ['name' => 'Default Commission'],
            [
                'name_ar' => 'عمولة افتراضية',
                'type' => CommissionType::Percentage,
                'value' => 5,
                'is_active' => true,
                'created_by' => $admin->id,
            ]
        );

        // Higher commission for VIP tier customers
        CommissionRule::firstOrCreate(
            ['name' => 'VIP Customer Commission'],
            [
                'name_ar' => 'عمولة عملاء VIP',
                'type' => CommissionType::Percentage,
                'value' => 3,
                'customer_tier' => 'vip',
                'is_active' => true,
                'created_by' => $admin->id,
            ]
        );

        // Gold tier = 4%
        CommissionRule::firstOrCreate(
            ['name' => 'Gold Customer Commission'],
            [
                'name_ar' => 'عمولة العملاء الذهبيين',
                'type' => CommissionType::Percentage,
                'value' => 4,
                'customer_tier' => 'gold',
                'is_active' => true,
                'created_by' => $admin->id,
            ]
        );

        // Fixed per order for rep1 (special deal)
        CommissionRule::firstOrCreate(
            ['name' => 'Mohammed Fixed Bonus'],
            [
                'name_ar' => 'مكافأة محمد الثابتة',
                'type' => CommissionType::FixedPerOrder,
                'value' => 25,
                'sales_rep_id' => $salesRep1->id,
                'min_order_total' => 1000,
                'is_active' => true,
                'created_by' => $admin->id,
            ]
        );

        // ── 7. Leads ──
        $this->command->info('  → Creating leads...');

        $leadsData = [
            [
                'company_name' => 'Arabica Lounge',
                'company_name_ar' => 'أرابيكا لاونج',
                'contact_name' => 'Hassan Ali',
                'contact_name_ar' => 'حسن علي',
                'email' => 'hassan@arabicalounge.com',
                'phone' => '0501234567',
                'city' => 'Riyadh',
                'stage' => LeadStage::NewLead,
                'source' => 'exhibition',
                'estimated_monthly_kg' => 50,
                'sales_rep_id' => $salesRep1->id,
                'notes' => 'Met at Saudi Coffee Expo 2026. Interested in specialty Ethiopian.',
            ],
            [
                'company_name' => 'The Roast House',
                'company_name_ar' => 'ذا روست هاوس',
                'contact_name' => 'Tariq Nasser',
                'contact_name_ar' => 'طارق ناصر',
                'email' => 'tariq@roasthouse.sa',
                'phone' => '0559876543',
                'city' => 'Jeddah',
                'stage' => LeadStage::Contacted,
                'source' => 'referral',
                'estimated_monthly_kg' => 100,
                'sales_rep_id' => $salesRep1->id,
                'contacted_at' => now()->subDays(5),
                'notes' => "Referred by Elite Coffee Shop.\n---\nCalled on " . now()->subDays(5)->format('Y-m-d') . ". Very interested, wants to see samples.",
            ],
            [
                'company_name' => 'Café Serenity',
                'company_name_ar' => 'كافيه سيرينيتي',
                'contact_name' => 'Layla Ahmed',
                'contact_name_ar' => 'ليلى أحمد',
                'email' => 'layla@cafeserenity.com',
                'phone' => '0507654321',
                'city' => 'Dammam',
                'stage' => LeadStage::Quoted,
                'source' => 'website',
                'estimated_monthly_kg' => 30,
                'sales_rep_id' => $salesRep2->id,
                'contacted_at' => now()->subDays(12),
                'quoted_at' => now()->subDays(3),
                'notes' => "Contacted via website form.\n---\nSent quote for 30kg/month Ethiopian + Colombian blend.",
            ],
            [
                'company_name' => 'Brew Masters',
                'company_name_ar' => 'برو ماسترز',
                'contact_name' => 'Khalid Omar',
                'contact_name_ar' => 'خالد عمر',
                'email' => 'khalid@brewmasters.sa',
                'phone' => '0543216789',
                'city' => 'Riyadh',
                'stage' => LeadStage::Lost,
                'source' => 'cold_call',
                'estimated_monthly_kg' => 20,
                'sales_rep_id' => $salesRep2->id,
                'contacted_at' => now()->subDays(20),
                'quoted_at' => now()->subDays(15),
                'lost_at' => now()->subDays(7),
                'lost_reason' => 'Chose a cheaper competitor. Price too high for their budget.',
            ],
            [
                'company_name' => 'Mountain Peak Café',
                'company_name_ar' => 'كافيه ماونتن بيك',
                'contact_name' => 'Salem Rashid',
                'contact_name_ar' => 'سالم راشد',
                'email' => 'salem@mountainpeak.sa',
                'phone' => '0567891234',
                'city' => 'Abha',
                'stage' => LeadStage::NewLead,
                'source' => 'social_media',
                'estimated_monthly_kg' => 15,
                'sales_rep_id' => $salesRep1->id,
                'notes' => 'Found us on Instagram. Small café in Abha, looking for specialty beans.',
            ],
            [
                'company_name' => 'Gulf Roasters Co.',
                'company_name_ar' => 'شركة محامص الخليج',
                'contact_name' => 'Abdullah Fahad',
                'contact_name_ar' => 'عبدالله فهد',
                'email' => 'abdullah@gulfroasters.com',
                'phone' => '0512345678',
                'city' => 'Riyadh',
                'stage' => LeadStage::Contacted,
                'source' => 'exhibition',
                'estimated_monthly_kg' => 200,
                'sales_rep_id' => $salesRep2->id,
                'contacted_at' => now()->subDays(2),
                'notes' => 'Large wholesale distributor. Potential high-value client. Wants exclusive Ethiopian supply.',
            ],
            [
                'company_name' => 'Boutique Bean',
                'company_name_ar' => 'بوتيك بين',
                'contact_name' => 'Nora Saud',
                'contact_name_ar' => 'نورة سعود',
                'email' => 'nora@boutiquebean.sa',
                'phone' => '0534567890',
                'city' => 'Jeddah',
                'stage' => LeadStage::Quoted,
                'source' => 'referral',
                'estimated_monthly_kg' => 40,
                'sales_rep_id' => $salesRep1->id,
                'contacted_at' => now()->subDays(8),
                'quoted_at' => now()->subDays(1),
                'notes' => "Premium boutique café chain.\n---\nQuoted VIP pricing. Decision expected this week.",
            ],
        ];

        foreach ($leadsData as $leadData) {
            Lead::firstOrCreate(
                ['email' => $leadData['email']],
                $leadData
            );
        }

        // ── 8. Create a Converted Lead → Customer flow ──
        $this->command->info('  → Creating converted lead example...');

        $convertedLead = Lead::firstOrCreate(
            ['email' => 'omar@cuppacoffee.sa'],
            [
                'company_name' => 'Cuppa Coffee',
                'company_name_ar' => 'كُبّا كوفي',
                'contact_name' => 'Omar Yousef',
                'contact_name_ar' => 'عمر يوسف',
                'phone' => '0545678901',
                'city' => 'Riyadh',
                'stage' => LeadStage::Converted,
                'source' => 'exhibition',
                'estimated_monthly_kg' => 60,
                'sales_rep_id' => $salesRep1->id,
                'contacted_at' => now()->subDays(30),
                'quoted_at' => now()->subDays(20),
                'converted_at' => now()->subDays(14),
                'notes' => "Met at Saudi Coffee Expo.\n---\nSample delivered. Very impressed with Ethiopian quality.\n---\nQuote accepted. Converting to customer.",
            ]
        );

        $cuppaCustomer = Customer::firstOrCreate(
            ['email' => 'omar@cuppacoffee.sa'],
            [
                'name' => 'Omar Yousef',
                'name_ar' => 'عمر يوسف',
                'type' => 'external',
                'company' => 'Cuppa Coffee',
                'phone' => '0545678901',
                'email' => 'omar@cuppacoffee.sa',
                'city' => 'Riyadh',
                'address' => 'Al Olaya District, Riyadh',
                'sales_rep_id' => $salesRep1->id,
                'price_list_id' => $wholesaleList->id,
                'payment_terms' => 'net_30',
                'customer_tier' => 'silver',
                'credit_limit' => 20000,
                'is_active' => true,
            ]
        );

        $convertedLead->update(['converted_customer_id' => $cuppaCustomer->id]);

        // ── 9. Update Existing Orders with Sales Rep ──
        $this->command->info('  → Linking orders to sales reps...');

        Order::whereNull('sales_rep_id')->each(function (Order $order) use ($salesRep1) {
            $customer = $order->customer;
            $order->update([
                'sales_rep_id' => $customer?->sales_rep_id ?? $salesRep1->id,
            ]);
        });

        // ── 10. Generate Commissions for Paid Orders ──
        $this->command->info('  → Generating commissions for paid orders...');

        $paidOrders = Order::where('payment_status', 'paid')->get();
        foreach ($paidOrders as $order) {
            $repId = $order->sales_rep_id ?? $order->customer?->sales_rep_id;
            if (! $repId) {
                continue;
            }

            // Find applicable rule
            $rule = CommissionRule::where('is_active', true)
                ->where(function ($q) use ($repId) {
                    $q->where('sales_rep_id', $repId)->orWhereNull('sales_rep_id');
                })
                ->orderByRaw('sales_rep_id IS NOT NULL DESC')
                ->first();

            if (! $rule) {
                continue;
            }

            $amount = match ($rule->type) {
                CommissionType::Percentage => round((float) $order->total * ((float) $rule->value / 100), 2),
                CommissionType::FixedPerOrder => (float) $rule->value,
                CommissionType::FixedPerKg => round($order->items()->sum('quantity') * (float) $rule->value, 2),
            };

            Commission::firstOrCreate(
                ['order_id' => $order->id, 'sales_rep_id' => $repId],
                [
                    'commission_rule_id' => $rule->id,
                    'order_total' => $order->total,
                    'commission_amount' => $amount,
                    'calculation_method' => $rule->type->value,
                    'calculation_value' => $rule->value,
                    'status' => CommissionStatus::Approved,
                    'approved_by' => $salesManager->id,
                    'approved_at' => now()->subDays(1),
                ]
            );
        }

        // ── 11. Price Change Log Sample ──
        $this->command->info('  → Creating price change log samples...');

        $firstItem = PriceListItem::first();
        if ($firstItem) {
            PriceChangeLog::firstOrCreate(
                ['entity_type' => 'price_list_item', 'entity_id' => $firstItem->id, 'created_at' => now()->subDays(3)],
                [
                    'changes' => [
                        ['field' => 'unit_price', 'old_value' => $firstItem->unit_price + 5, 'new_value' => $firstItem->unit_price],
                    ],
                    'change_reason' => 'تعديل السعر بعد مراجعة التكاليف',
                    'changed_by' => $accountant?->id ?? $admin->id,
                ]
            );
        }

        // ── Summary ──
        $this->command->info('');
        $this->command->info('✓ Sales & Pricing data seeded successfully:');
        $this->command->info('  • Users: 3 new (sales_manager, 2x sales_rep)');
        $this->command->info('  • Price Lists: ' . PriceList::count());
        $this->command->info('  • Price List Items: ' . PriceListItem::count());
        $this->command->info('  • Discounts: ' . Discount::count());
        $this->command->info('  • Commission Rules: ' . CommissionRule::count());
        $this->command->info('  • Leads: ' . Lead::count());
        $this->command->info('  • Commissions: ' . Commission::count());
        $this->command->info('');
        $this->command->info('New login credentials:');
        $this->command->info('  Sales Manager: sales.manager@hiqbah.com / password (PIN: 666666)');
        $this->command->info('  Sales Rep 1:   rep1@hiqbah.com / password (PIN: 777777)');
        $this->command->info('  Sales Rep 2:   rep2@hiqbah.com / password (PIN: 888888)');
    }
}
