<?php

namespace Database\Seeders;

use App\Core\Models\Branch;
use App\Core\Models\Equipment;
use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\CropMarketing;
use App\Modules\Crops\Models\CropPricing;
use App\Modules\Crops\Models\CuppingSession;
use App\Modules\Crops\Models\GreenCoffeeInspection;
use App\Modules\Crops\Models\GreenCoffeeLot;
use App\Modules\Crops\Models\TrialRoast;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Branch\Models\CalibrationSession;
use App\Modules\Branch\Models\CalibrationShot;
use App\Modules\Branch\Models\CleaningSchedule;
use App\Modules\Branch\Models\CleaningTask;
use App\Modules\Inventory\Models\TransferOrder;
use App\Modules\Inventory\Models\TransferOrderItem;
use App\Modules\Orders\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatusHistory;
use App\Modules\Procurement\Models\PurchaseOrder;
use App\Modules\Procurement\Models\Supplier;
use App\Modules\Production\Models\PackagingLot;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Production\Models\RoastQualityCheck;
use App\Modules\Quality\Models\WasteRecord;
use App\Modules\Recipes\Models\EspressoRecipe;
use App\Modules\Recipes\Models\EspressoRecipeTrial;
use App\Modules\Recipes\Models\PourOverRecipe;
use App\Modules\Recipes\Models\Recipe;
use Illuminate\Database\Seeder;

class SampleCropJourneySeeder extends Seeder
{
    public function run(): void
    {
        $roastery = Branch::where('type', 'roastery')->first();
        $branch1 = Branch::where('type', 'branch')->first();
        $admin = User::first();
        $userId = $admin->id;
        $inventory = app(InventoryService::class);

        // ══════════════════════════════════════════
        // USERS (Staff)
        // ══════════════════════════════════════════
        $roaster = User::firstOrCreate(['email' => 'roaster@hiqbah.com'], [
            'name' => 'Khalid Al-Roaster', 'name_ar' => 'خالد المحمّص',
            'password' => bcrypt('password'), 'pin' => bcrypt('111111'),
            'branch_id' => $roastery->id, 'is_active' => true, 'language' => 'ar',
        ]);
        $roaster->assignRole('roaster');

        $qGrader = User::firstOrCreate(['email' => 'qgrader@hiqbah.com'], [
            'name' => 'Sara Al-Grader', 'name_ar' => 'سارة المقيّمة',
            'password' => bcrypt('password'), 'pin' => bcrypt('222222'),
            'branch_id' => $roastery->id, 'is_active' => true, 'language' => 'ar',
        ]);
        $qGrader->assignRole('q_grader');

        $barista = User::firstOrCreate(['email' => 'barista@hiqbah.com'], [
            'name' => 'Omar Al-Barista', 'name_ar' => 'عمر الباريستا',
            'password' => bcrypt('password'), 'pin' => bcrypt('333333'),
            'branch_id' => $branch1->id, 'is_active' => true, 'language' => 'ar',
        ]);
        $barista->assignRole('head_barista');

        $warehouse = User::firstOrCreate(['email' => 'warehouse@hiqbah.com'], [
            'name' => 'Fahad Al-Warehouse', 'name_ar' => 'فهد المستودع',
            'password' => bcrypt('password'), 'pin' => bcrypt('444444'),
            'branch_id' => $roastery->id, 'is_active' => true, 'language' => 'ar',
        ]);
        $warehouse->assignRole('warehouse');

        $accountant = User::firstOrCreate(['email' => 'accountant@hiqbah.com'], [
            'name' => 'Noura Al-Accountant', 'name_ar' => 'نورة المحاسبة',
            'password' => bcrypt('password'), 'pin' => bcrypt('555555'),
            'branch_id' => $roastery->id, 'is_active' => true, 'language' => 'ar',
        ]);
        $accountant->assignRole('accountant');

        $this->command->info('✅ Staff: 5 users created (roaster, q_grader, barista, warehouse, accountant)');

        // ══════════════════════════════════════════
        // EQUIPMENT
        // ══════════════════════════════════════════
        // Roastery equipment
        Equipment::firstOrCreate(['code' => 'RST-001'], [
            'branch_id' => $roastery->id, 'type' => 'roaster', 'name' => 'Probat P25',
            'brand' => 'Probat', 'model' => 'P25', 'status' => 'active',
            'notes' => 'Main production roaster - 25kg capacity',
        ]);
        Equipment::firstOrCreate(['code' => 'RST-002'], [
            'branch_id' => $roastery->id, 'type' => 'roaster', 'name' => 'Ikawa Pro V3',
            'brand' => 'Ikawa', 'model' => 'Pro V3', 'status' => 'active',
            'notes' => 'Sample roaster for trial roasts - 50g capacity',
        ]);
        Equipment::firstOrCreate(['code' => 'GRD-001'], [
            'branch_id' => $roastery->id, 'type' => 'grinder', 'name' => 'Mahlkönig EK43S',
            'brand' => 'Mahlkönig', 'model' => 'EK43S', 'status' => 'active',
            'notes' => 'QC cupping grinder',
        ]);

        // Branch 1 equipment
        Equipment::firstOrCreate(['code' => 'ESP-B1-001'], [
            'branch_id' => $branch1->id, 'type' => 'espresso_machine', 'name' => 'La Marzocco Linea PB',
            'brand' => 'La Marzocco', 'model' => 'Linea PB', 'status' => 'active',
            'notes' => '2 group heads - main bar machine',
        ]);
        Equipment::firstOrCreate(['code' => 'GRD-B1-001'], [
            'branch_id' => $branch1->id, 'type' => 'grinder', 'name' => 'Mythos One',
            'brand' => 'Nuova Simonelli', 'model' => 'Mythos One', 'status' => 'active',
            'notes' => 'Main espresso grinder',
        ]);
        Equipment::firstOrCreate(['code' => 'GRD-B1-002'], [
            'branch_id' => $branch1->id, 'type' => 'grinder', 'name' => 'Mahlkönig EK43',
            'brand' => 'Mahlkönig', 'model' => 'EK43', 'status' => 'active',
            'notes' => 'Filter/pour-over grinder',
        ]);
        Equipment::firstOrCreate(['code' => 'BRW-B1-001'], [
            'branch_id' => $branch1->id, 'type' => 'brewer', 'name' => 'Hario V60',
            'brand' => 'Hario', 'model' => 'V60 02', 'status' => 'active',
        ]);

        $this->command->info('✅ Equipment: 7 items (3 roastery + 4 branch)');

        // ══════════════════════════════════════════
        // SUPPLIERS
        // ══════════════════════════════════════════
        $supplierEth = Supplier::firstOrCreate(['name' => 'Buku Abel Farm'], [
            'country' => 'Ethiopia', 'contact_person' => 'Ahmed Hassan',
            'email' => 'ahmed@bukuabel.com', 'phone' => '+251911234567', 'is_active' => true,
        ]);
        $supplierCol = Supplier::firstOrCreate(['name' => 'Finca La Esperanza'], [
            'country' => 'Colombia', 'contact_person' => 'Carlos Gutierrez',
            'email' => 'carlos@laesperanza.co', 'phone' => '+573001234567', 'is_active' => true,
        ]);
        Supplier::firstOrCreate(['name' => 'Daterra Estate'], [
            'country' => 'Brazil', 'contact_person' => 'Ana Paula',
            'email' => 'ana@daterra.com.br', 'phone' => '+5534991234567', 'is_active' => true,
        ]);

        $this->command->info('✅ Suppliers: 3 (Ethiopia, Colombia, Brazil)');

        // ══════════════════════════════════════════
        // CROP 1: Ethiopia Guji (Full Journey → Marketing)
        // ══════════════════════════════════════════
        $po1 = PurchaseOrder::firstOrCreate(['po_number' => 'PO-2026-100'], [
            'supplier_id' => $supplierEth->id, 'origin_country' => 'Ethiopia',
            'region' => 'Guji, Hambella', 'farm' => 'Buku Abel', 'process' => 'Washed',
            'variety' => 'Heirloom 74110', 'altitude' => '2100-2350m',
            'quantity_kg' => 60, 'price_per_kg' => 52, 'shipping_cost' => 800,
            'customs_cost' => 350, 'total_cost' => 4270, 'currency' => 'SAR',
            'expected_date' => '2026-03-01', 'status' => 'received',
            'created_by' => $userId, 'approved_by' => $userId, 'approved_at' => now()->subDays(30),
        ]);

        $crop1 = Crop::firstOrCreate(['serial_number' => 'CR-2026-ETH-100'], [
            'purchase_order_id' => $po1->id, 'supplier_id' => $supplierEth->id,
            'name' => 'Ethiopia Guji Hambella Buku Abel', 'name_ar' => 'إثيوبيا قوجي هامبيلا بوكو أبيل',
            'origin_country' => 'Ethiopia', 'region' => 'Guji, Hambella', 'farm' => 'Buku Abel',
            'process' => 'Washed', 'variety' => 'Heirloom 74110', 'altitude' => '2100-2350m',
            'lot_number' => 'PO-2026-100', 'status' => 'production_ready',
            'total_green_weight' => 59.50, 'remaining_green_weight' => 58.845, // 59.50 - 0.6kg(trials) - 0.055kg(cupping)
            'usage_type' => 'both',
            'flavor_notes' => ['Jasmine', 'Blueberry', 'Dark Chocolate', 'Bergamot', 'Honey'],
            'description' => 'Exceptional Ethiopian Guji from Buku Abel farm. Clean washed process with complex floral and fruit notes.',
            'description_ar' => 'محصول إثيوبي استثنائي من مزرعة بوكو أبيل في قوجي. معالجة مغسولة نظيفة مع نوتات زهرية وفاكهية معقدة.',
            'brew_recommendations' => 'Espresso: 18g in, 36g out, 28s. Pour Over: 15g, 250ml, 3:30 total.',
        ]);

        $lot1 = GreenCoffeeLot::firstOrCreate(['batch_id' => 'GC-2026-100'], [
            'crop_id' => $crop1->id, 'purchase_order_id' => $po1->id,
            'bags_count' => 4, 'expected_weight' => 60.00, 'actual_weight' => 59.50,
            'weight_variance' => -0.50, 'arrival_date' => '2026-02-28',
            'received_by' => $warehouse->id, 'status' => 'approved',
        ]);

        GreenCoffeeInspection::firstOrCreate(['green_coffee_lot_id' => $lot1->id], [
            'inspector_id' => $qGrader->id, 'moisture_percent' => 10.8, 'water_activity' => 0.54,
            'density' => 720, 'screen_size' => '15-17', 'defect_count' => 3,
            'defect_notes' => 'Minor: 2 broken beans, 1 quaker',
            'visual_notes' => 'Uniform green-blue color, consistent size',
            'decision' => 'approved', 'inspected_at' => now()->subDays(25),
        ]);

        $trial1 = TrialRoast::firstOrCreate(['crop_id' => $crop1->id, 'trial_number' => 1], [
            'green_coffee_lot_id' => $lot1->id, 'roaster_id' => $roaster->id,
            'sample_weight_grams' => 200, 'roasted_weight_grams' => 168,
            'roast_loss_grams' => 32, 'roast_loss_percent' => 16.0,
            'charge_temp' => 200, 'drying_time' => '4:30', 'maillard_time' => '3:15',
            'first_crack_time' => '9:20', 'first_crack_temp' => 198,
            'development_time' => '1:40', 'development_percent' => 15.1,
            'drop_temp' => 210, 'total_roast_time' => '11:00',
            'roast_level' => 'light', 'usage_type' => 'filter',
            'notes' => 'Light roast for filter - bright acidity, floral notes dominant',
            'status' => 'completed', 'roasted_at' => now()->subDays(22),
        ]);

        $trial2 = TrialRoast::firstOrCreate(['crop_id' => $crop1->id, 'trial_number' => 2], [
            'green_coffee_lot_id' => $lot1->id, 'roaster_id' => $roaster->id,
            'sample_weight_grams' => 200, 'roasted_weight_grams' => 170,
            'roast_loss_grams' => 30, 'roast_loss_percent' => 15.0,
            'charge_temp' => 205, 'drying_time' => '4:45', 'maillard_time' => '3:30',
            'first_crack_time' => '9:45', 'first_crack_temp' => 201,
            'development_time' => '2:00', 'development_percent' => 17.0,
            'drop_temp' => 215, 'total_roast_time' => '11:45',
            'roast_level' => 'medium_light', 'usage_type' => 'both',
            'notes' => 'Medium-light - balanced sweetness with fruit and chocolate. Best shot.',
            'status' => 'selected', 'roasted_at' => now()->subDays(21),
        ]);

        TrialRoast::firstOrCreate(['crop_id' => $crop1->id, 'trial_number' => 3], [
            'green_coffee_lot_id' => $lot1->id, 'roaster_id' => $roaster->id,
            'sample_weight_grams' => 200, 'roasted_weight_grams' => 164,
            'roast_loss_grams' => 36, 'roast_loss_percent' => 18.0,
            'charge_temp' => 210, 'drying_time' => '5:00', 'maillard_time' => '3:45',
            'first_crack_time' => '10:15', 'first_crack_temp' => 204,
            'development_time' => '2:30', 'development_percent' => 19.6,
            'drop_temp' => 222, 'total_roast_time' => '12:45',
            'roast_level' => 'medium', 'usage_type' => 'espresso',
            'notes' => 'Medium roast - chocolate heavy, lower acidity',
            'status' => 'completed', 'roasted_at' => now()->subDays(20),
        ]);

        foreach ([$trial1, $trial2] as $trial) {
            WasteRecord::firstOrCreate(
                ['source_type' => TrialRoast::class, 'source_id' => $trial->id],
                ['crop_id' => $crop1->id, 'waste_type' => 'trial_roast_sample',
                 'weight_grams' => $trial->sample_weight_grams,
                 'reason' => "Trial roast #{$trial->trial_number}",
                 'created_by' => $roaster->id, 'created_at' => $trial->roasted_at]
            );
        }

        $cupping1 = CuppingSession::firstOrCreate(
            ['crop_id' => $crop1->id, 'trial_roast_id' => $trial2->id, 'sample_number' => 1],
            ['grader_id' => $qGrader->id, 'scheduled_date' => now()->subDays(18),
             'cups_count' => 5, 'dose_per_cup' => 11, 'total_coffee_used' => 55,
             'fragrance' => 8.5, 'aroma' => 8.25, 'flavor' => 8.5, 'aftertaste' => 8.0,
             'acidity' => 8.25, 'body' => 7.75, 'balance' => 8.25,
             'sweetness' => 10.0, 'uniformity' => 10.0, 'clean_cup' => 10.0,
             'overall_score' => 8.5, 'defects' => 0, 'defect_intensity' => 0,
             'total_score_before_defects' => 96.0, 'final_score' => 96.0,
             'classification' => 'outstanding', 'is_blind_cupping' => true,
             'flavor_notes' => ['Jasmine', 'Blueberry', 'Dark Chocolate', 'Bergamot', 'Honey'],
             'description' => 'Exceptional cup with complex floral aromatics.',
             'brew_recommendations' => 'Best as pour-over at light-medium roast.',
             'decision' => 'approved', 'status' => 'completed']
        );
        WasteRecord::firstOrCreate(
            ['source_type' => CuppingSession::class, 'source_id' => $cupping1->id],
            ['crop_id' => $crop1->id, 'waste_type' => 'cupping_waste', 'weight_grams' => 55,
             'reason' => 'Cupping session - 5 cups × 11g', 'created_by' => $qGrader->id, 'created_at' => now()->subDays(18)]
        );

        // Espresso Recipe
        $recipe1 = Recipe::firstOrCreate(['recipe_code' => 'HB-ESP-ETH-100'], [
            'crop_id' => $crop1->id, 'recipe_type' => 'espresso', 'version' => 1,
            'is_current' => true, 'created_by' => $barista->id, 'status' => 'published',
            'approved_by' => $roaster->id, 'approved_at' => now()->subDays(14), 'published_at' => now()->subDays(13),
        ]);
        EspressoRecipeTrial::firstOrCreate(['recipe_id' => $recipe1->id, 'trial_number' => 1], [
            'dose' => 18.0, 'grind_setting' => '2.5', 'extraction_time' => 24, 'yield' => 34.0,
            'tds' => 8.9, 'extraction_percent' => 19.2, 'acidity' => 7, 'finish' => 6, 'balance' => 6,
            'is_best_shot' => false, 'notes' => 'Under-extracted, sour',
        ]);
        EspressoRecipeTrial::firstOrCreate(['recipe_id' => $recipe1->id, 'trial_number' => 2], [
            'dose' => 18.0, 'grind_setting' => '2.2', 'extraction_time' => 28, 'yield' => 36.0,
            'tds' => 9.4, 'extraction_percent' => 21.1, 'acidity' => 8, 'finish' => 8, 'balance' => 9,
            'is_best_shot' => true, 'notes' => 'Excellent balance! Best shot.',
        ]);
        EspressoRecipe::firstOrCreate(['recipe_id' => $recipe1->id], [
            'dose' => 18.0, 'grind_setting' => '2.2', 'extraction_time' => 28,
            'yield' => 36.0, 'tds' => 9.4, 'extraction_percent' => 21.1,
        ]);

        // Pour Over Recipe
        $recipe1po = Recipe::firstOrCreate(['recipe_code' => 'HB-PO-ETH-100'], [
            'crop_id' => $crop1->id, 'recipe_type' => 'pour_over', 'version' => 1,
            'is_current' => true, 'created_by' => $barista->id, 'status' => 'published',
            'approved_by' => $roaster->id, 'approved_at' => now()->subDays(12), 'published_at' => now()->subDays(11),
        ]);
        PourOverRecipe::firstOrCreate(['recipe_id' => $recipe1po->id], [
            'dose' => 15.0, 'grind_setting' => '28', 'brew_type' => 'hot',
            'bloom_time' => 30, 'bloom_water' => 45,
            'pours' => [['pour' => 1, 'water' => 100, 'time' => 45], ['pour' => 2, 'water' => 60, 'time' => 30], ['pour' => 3, 'water' => 45, 'time' => 25]],
            'total_water' => 250, 'total_time' => 210,
        ]);

        // Pricing + Marketing
        CropPricing::firstOrCreate(['crop_id' => $crop1->id], [
            'landed_cost_per_kg' => 71.17, 'green_cost_per_kg' => 71.17,
            'roasting_loss_percent' => 15.0, 'roasting_cost_per_kg' => 8.00,
            'packaging_cost_per_unit' => 3.50, 'operation_cost_per_kg' => 5.00,
            'shipping_cost_per_kg' => 4.00, 'total_cost_per_kg_roasted' => 100.73,
            'target_margin_percent' => 35, 'retail_price_250g' => 34.00,
            'retail_price_500g' => 65.00, 'retail_price_1kg' => 125.00,
            'wholesale_price_kg' => 110.00, 'status' => 'approved',
            'set_by' => $accountant->id, 'approved_by' => $userId, 'approved_at' => now()->subDays(10),
        ]);
        CropMarketing::firstOrCreate(['crop_id' => $crop1->id], [
            'product_name' => 'Hiqbah Ethiopia Guji Hambella',
            'product_name_ar' => 'حِقبة إثيوبيا قوجي هامبيلا',
            'marketing_description' => 'Single-origin specialty coffee from Buku Abel farm in Guji, Ethiopia. Cupping Score: 96.0 — Outstanding.',
            'marketing_description_ar' => 'قهوة مختصة أحادية المصدر من مزرعة بوكو أبيل في قوجي، إثيوبيا. درجة التقييم: 96.0 — متميز.',
            'flavor_display' => 'Jasmine • Blueberry • Dark Chocolate • Bergamot • Honey',
            'social_media_text' => "☕ NEW: Ethiopia Guji Hambella — SCA 96.0 Outstanding\n🌸 Jasmine | 🫐 Blueberry | 🍫 Dark Chocolate\n#HiqbahCoffee",
            'social_media_text_ar' => "☕ وصل جديد: إثيوبيا قوجي هامبيلا — SCA 96.0 متميز\n🌸 ياسمين | 🫐 توت أزرق | 🍫 شوكولاتة داكنة\n#حقبة_قهوة",
            'status' => 'approved', 'created_by' => $userId,
        ]);

        $this->command->info('✅ Crop 1: CR-2026-ETH-100 (Ethiopia Guji) — Full journey → production_ready');

        // ══════════════════════════════════════════
        // CROP 2: Colombia Huila (Mid-journey → Cupping)
        // ══════════════════════════════════════════
        $po2 = PurchaseOrder::firstOrCreate(['po_number' => 'PO-2026-101'], [
            'supplier_id' => $supplierCol->id, 'origin_country' => 'Colombia',
            'region' => 'Huila, San Agustin', 'farm' => 'Finca La Esperanza', 'process' => 'Natural',
            'variety' => 'Caturra', 'altitude' => '1800-2000m',
            'quantity_kg' => 30, 'price_per_kg' => 38, 'shipping_cost' => 500,
            'customs_cost' => 200, 'total_cost' => 1840, 'currency' => 'SAR',
            'expected_date' => '2026-03-10', 'status' => 'received',
            'created_by' => $userId, 'approved_by' => $userId, 'approved_at' => now()->subDays(15),
        ]);

        $crop2 = Crop::firstOrCreate(['serial_number' => 'CR-2026-COL-101'], [
            'purchase_order_id' => $po2->id, 'supplier_id' => $supplierCol->id,
            'name' => 'Colombia Huila San Agustin Natural', 'name_ar' => 'كولومبيا هويلا سان أغوستين ناتشورال',
            'origin_country' => 'Colombia', 'region' => 'Huila, San Agustin',
            'farm' => 'Finca La Esperanza', 'process' => 'Natural',
            'variety' => 'Caturra', 'altitude' => '1800-2000m',
            'lot_number' => 'PO-2026-101', 'status' => 'cupping',
            'total_green_weight' => 29.80, 'remaining_green_weight' => 29.40,
            'usage_type' => null,
        ]);

        $lot2 = GreenCoffeeLot::firstOrCreate(['batch_id' => 'GC-2026-101'], [
            'crop_id' => $crop2->id, 'purchase_order_id' => $po2->id,
            'bags_count' => 2, 'expected_weight' => 30.00, 'actual_weight' => 29.80,
            'weight_variance' => -0.20, 'arrival_date' => '2026-03-08',
            'received_by' => $warehouse->id, 'status' => 'approved',
        ]);

        GreenCoffeeInspection::firstOrCreate(['green_coffee_lot_id' => $lot2->id], [
            'inspector_id' => $qGrader->id, 'moisture_percent' => 11.2, 'water_activity' => 0.56,
            'density' => 695, 'screen_size' => '14-16', 'defect_count' => 5,
            'defect_notes' => 'Minor: 3 broken, 2 immature', 'visual_notes' => 'Dark green, natural process color',
            'decision' => 'approved', 'inspected_at' => now()->subDays(10),
        ]);

        $trial2_1 = TrialRoast::firstOrCreate(['crop_id' => $crop2->id, 'trial_number' => 1], [
            'green_coffee_lot_id' => $lot2->id, 'roaster_id' => $roaster->id,
            'sample_weight_grams' => 200, 'roasted_weight_grams' => 166,
            'roast_loss_grams' => 34, 'roast_loss_percent' => 17.0,
            'charge_temp' => 205, 'drying_time' => '5:15', 'first_crack_time' => '10:00',
            'first_crack_temp' => 200, 'development_time' => '2:15', 'development_percent' => 18.4,
            'drop_temp' => 218, 'total_roast_time' => '12:15',
            'roast_level' => 'medium', 'usage_type' => 'espresso',
            'notes' => 'Medium roast - heavy body, strawberry, brown sugar',
            'status' => 'completed', 'roasted_at' => now()->subDays(5),
        ]);

        WasteRecord::firstOrCreate(
            ['source_type' => TrialRoast::class, 'source_id' => $trial2_1->id],
            ['crop_id' => $crop2->id, 'waste_type' => 'trial_roast_sample', 'weight_grams' => 200,
             'reason' => 'Trial roast #1', 'created_by' => $roaster->id, 'created_at' => now()->subDays(5)]
        );

        // Cupping session (scheduled, not yet completed)
        CuppingSession::firstOrCreate(
            ['crop_id' => $crop2->id, 'trial_roast_id' => $trial2_1->id, 'sample_number' => 1],
            ['grader_id' => $qGrader->id, 'scheduled_date' => now()->addDays(1),
             'cups_count' => 5, 'dose_per_cup' => 11, 'total_coffee_used' => 55,
             'is_blind_cupping' => true, 'status' => 'scheduled']
        );

        $this->command->info('✅ Crop 2: CR-2026-COL-101 (Colombia Huila) — Mid-journey → cupping scheduled');

        // ══════════════════════════════════════════
        // INVENTORY (Sync all existing data)
        // ══════════════════════════════════════════
        $costPerKg1 = $po1->total_cost / $po1->quantity_kg; // ~71.17

        // Crop 1: Green coffee received → inventory
        $inventory->recordMovement(
            $roastery->id, $crop1->id, ItemType::Green, MovementType::Receiving,
            (float) $lot1->actual_weight, $warehouse->id,
            get_class($lot1), $lot1->id, $costPerKg1,
            "Seed: Green coffee received {$lot1->batch_id}",
        );

        // Crop 1: Trial roast waste deductions (3 × 200g = 600g = 0.6 kg)
        $inventory->recordMovement(
            $roastery->id, $crop1->id, ItemType::Green, MovementType::TrialWaste,
            0.60, $roaster->id, null, null, null,
            'Seed: Trial roast samples (3 × 200g)',
        );

        // Crop 1: Cupping waste (55g = 0.055 kg)
        $inventory->recordMovement(
            $roastery->id, $crop1->id, ItemType::Green, MovementType::CuppingWaste,
            0.055, $qGrader->id, null, null, null,
            'Seed: Cupping waste (5 cups × 11g)',
        );

        $costPerKg2 = $po2->total_cost / $po2->quantity_kg; // ~61.33

        // Crop 2: Green coffee received → inventory
        $inventory->recordMovement(
            $roastery->id, $crop2->id, ItemType::Green, MovementType::Receiving,
            (float) $lot2->actual_weight, $warehouse->id,
            get_class($lot2), $lot2->id, $costPerKg2,
            "Seed: Green coffee received {$lot2->batch_id}",
        );

        // Crop 2: Trial roast waste (200g = 0.2 kg)
        $inventory->recordMovement(
            $roastery->id, $crop2->id, ItemType::Green, MovementType::TrialWaste,
            0.20, $roaster->id, null, null, null,
            'Seed: Trial roast sample (1 × 200g)',
        );

        $this->command->info('✅ Inventory: Base inventory synced (Phase 2)');

        // ══════════════════════════════════════════
        // PHASE 3: PRODUCTION (Roasting → QC → Packaging)
        // ══════════════════════════════════════════

        // Roast Batch: 10 kg Ethiopian green → 8.5 kg roasted
        $roastBatch = RoastBatch::firstOrCreate(['batch_number' => 'RB-2026-0001'], [
            'crop_id' => $crop1->id, 'recipe_id' => $recipe1->id, 'roaster_id' => $roaster->id,
            'status' => 'approved', 'queue_position' => 1, 'is_priority' => false,
            'green_weight_kg' => 10.00, 'roasted_weight_kg' => 8.50,
            'roast_loss_kg' => 1.50, 'roast_loss_percent' => 15.0,
            'target_charge_temp' => 205, 'target_first_crack_time' => '9:45',
            'target_first_crack_temp' => 201, 'target_development_time' => '2:00',
            'target_drop_temp' => 215, 'target_total_time' => '11:45', 'target_roast_level' => 'medium_light',
            'actual_charge_temp' => 204, 'actual_first_crack_time' => '9:50',
            'actual_first_crack_temp' => 200, 'actual_development_time' => '2:05',
            'actual_drop_temp' => 214, 'actual_total_time' => '11:55', 'actual_roast_level' => 'medium_light',
            'started_at' => now()->subDays(7), 'completed_at' => now()->subDays(7),
        ]);

        // Update crop remaining weight for production roasting
        $crop1->deductGreenWeightKg(10.00);

        // Inventory: deduct green, add roasted, record loss
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Green, MovementType::RoastingOut, 10.00, $roaster->id, get_class($roastBatch), $roastBatch->id, null, "Seed: Roasting {$roastBatch->batch_number}");
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Roasted, MovementType::RoastingIn, 8.50, $roaster->id, get_class($roastBatch), $roastBatch->id, null, "Seed: Roasted {$roastBatch->batch_number}");

        // Waste record for roast loss
        WasteRecord::firstOrCreate(['source_type' => RoastBatch::class, 'source_id' => $roastBatch->id], [
            'crop_id' => $crop1->id, 'waste_type' => 'roast_loss', 'weight_grams' => 1500,
            'reason' => "Roast loss RB-2026-0001 (15%)", 'created_by' => $roaster->id, 'created_at' => now()->subDays(7),
        ]);

        // QC Check: approved (score 85)
        RoastQualityCheck::firstOrCreate(['roast_batch_id' => $roastBatch->id], [
            'inspector_id' => $qGrader->id, 'sample_weight_grams' => 100,
            'color_score' => 8, 'aroma_score' => 9, 'flavor_score' => 8,
            'acidity_score' => 8, 'body_score' => 9, 'balance_score' => 9,
            'total_score' => 85.0, 'decision' => 'approved',
            'checked_at' => now()->subDays(7),
        ]);

        // QC waste
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Roasted, MovementType::QcWaste, 0.10, $qGrader->id, null, null, null, "Seed: QC sample waste RB-2026-0001");

        // Packaging: 30 × 250g bags from roasted
        $packagingLot = PackagingLot::firstOrCreate(['lot_number' => 'PK-2026-0001'], [
            'crop_id' => $crop1->id, 'roast_batch_id' => $roastBatch->id, 'packed_by' => $warehouse->id,
            'status' => 'completed', 'package_size' => '250', 'bags_count' => 30,
            'roasted_weight_used_kg' => 7.50, 'net_weight_per_bag_g' => 250, 'total_net_weight_kg' => 7.50,
            'sku' => 'HB-ETH-250', 'packed_at' => now()->subDays(6),
            'qr_data' => ['lot' => 'PK-2026-0001', 'crop' => 'CR-2026-ETH-100', 'batch' => 'RB-2026-0001', 'size' => '250g'],
        ]);

        // Inventory: deduct roasted, add finished bags
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Roasted, MovementType::PackagingOut, 7.50, $warehouse->id, get_class($packagingLot), $packagingLot->id, null, "Seed: Packaging {$packagingLot->lot_number}");
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Finished250, MovementType::PackagingIn, 30, $warehouse->id, get_class($packagingLot), $packagingLot->id, null, "Seed: 30 × 250g bags");

        $this->command->info('✅ Production: RB-2026-0001 (10kg→8.5kg) → QC ✓ → PK-2026-0001 (30 bags)');

        // ══════════════════════════════════════════
        // PHASE 3: CUSTOMERS & ORDERS
        // ══════════════════════════════════════════

        // Sync branches as internal customers
        $internalCustomer = Customer::firstOrCreate(['branch_id' => $branch1->id, 'type' => 'internal'], [
            'name' => $branch1->name, 'name_ar' => $branch1->name_ar,
            'city' => 'Jeddah', 'is_active' => true,
        ]);

        $externalCustomer = Customer::firstOrCreate(['name' => 'Elite Coffee Shop', 'type' => 'external'], [
            'name_ar' => 'مقهى النخبة', 'company' => 'Elite Coffee Co.',
            'email' => 'orders@elitecoffee.sa', 'phone' => '+966501234567',
            'address' => '123 King Fahd Road', 'city' => 'Riyadh',
            'tax_number' => '300012345600003', 'is_active' => true,
        ]);

        // Order 1: Shipped (external customer)
        $order1 = Order::firstOrCreate(['order_number' => 'ORD-2026-0001'], [
            'customer_id' => $externalCustomer->id, 'created_by' => $userId,
            'status' => 'shipped', 'subtotal' => 340.00, 'vat_percent' => 15,
            'vat_amount' => 51.00, 'discount' => 0, 'total' => 391.00,
            'payment_method' => 'bank_transfer', 'payment_status' => 'paid', 'paid_at' => now()->subDays(4),
            'shipping_address' => '123 King Fahd Road, Riyadh', 'shipping_city' => 'Riyadh',
            'shipped_at' => now()->subDays(3),
        ]);
        OrderItem::firstOrCreate(['order_id' => $order1->id, 'crop_id' => $crop1->id, 'item_type' => 'finished_250'], [
            'product_name' => 'Hiqbah Ethiopia Guji 250g', 'quantity' => 10, 'unit_price' => 34.00, 'total_price' => 340.00,
        ]);

        // Order status history
        $orderStatuses = ['draft', 'sales_review', 'inventory_check', 'accounting', 'sales_confirm', 'pending_payment', 'allocated', 'shipped'];
        foreach ($orderStatuses as $i => $status) {
            OrderStatusHistory::firstOrCreate(
                ['order_id' => $order1->id, 'to_status' => $status],
                ['from_status' => $i > 0 ? $orderStatuses[$i - 1] : null, 'changed_by' => $userId, 'created_at' => now()->subDays(8 - $i)]
            );
        }

        // Sale inventory deduction
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Finished250, MovementType::from('sale'), 10, $userId, get_class($order1), $order1->id, null, "Seed: Sale ORD-2026-0001");

        // Order 2: Draft (new order)
        $order2 = Order::firstOrCreate(['order_number' => 'ORD-2026-0002'], [
            'customer_id' => $externalCustomer->id, 'created_by' => $userId,
            'status' => 'draft', 'subtotal' => 650.00, 'vat_percent' => 15,
            'vat_amount' => 97.50, 'discount' => 50, 'total' => 697.50,
            'payment_status' => 'unpaid',
        ]);
        OrderItem::firstOrCreate(['order_id' => $order2->id, 'crop_id' => $crop1->id, 'item_type' => 'finished_500'], [
            'product_name' => 'Hiqbah Ethiopia Guji 500g', 'quantity' => 10, 'unit_price' => 65.00, 'total_price' => 650.00,
        ]);

        $this->command->info('✅ Orders: 2 customers + 2 orders (1 shipped, 1 draft)');

        // ══════════════════════════════════════════
        // PHASE 3: TRANSFER (Roastery → Branch)
        // ══════════════════════════════════════════

        $transfer = TransferOrder::firstOrCreate(['transfer_number' => 'TF-2026-0001'], [
            'from_branch_id' => $roastery->id, 'to_branch_id' => $branch1->id,
            'created_by' => $userId, 'approved_by' => $userId,
            'status' => 'confirmed',
            'approved_at' => now()->subDays(5), 'shipped_at' => now()->subDays(4), 'received_at' => now()->subDays(3),
        ]);
        TransferOrderItem::firstOrCreate(['transfer_order_id' => $transfer->id, 'crop_id' => $crop1->id], [
            'item_type' => 'finished_250', 'quantity_sent' => 5, 'quantity_received' => 5, 'quantity_variance' => 0,
        ]);

        // Transfer inventory: out from roastery, in to branch
        $inventory->recordMovement($roastery->id, $crop1->id, ItemType::Finished250, MovementType::TransferOut, 5, $userId, get_class($transfer), $transfer->id, null, "Seed: Transfer out TF-2026-0001");
        $inventory->recordMovement($branch1->id, $crop1->id, ItemType::Finished250, MovementType::TransferIn, 5, $userId, get_class($transfer), $transfer->id, null, "Seed: Transfer in TF-2026-0001");

        $this->command->info('✅ Transfer: TF-2026-0001 (5 × 250g bags → Branch 1) — confirmed');

        // ══════════════════════════════════════════
        // PHASE 4: BRANCH OPERATIONS
        // ══════════════════════════════════════════

        // Cleaning schedules for Branch 1
        $espressoMachine = Equipment::where('code', 'ESP-B1-001')->first();
        $grinderMythos = Equipment::where('code', 'GRD-B1-001')->first();

        $schedule1 = CleaningSchedule::firstOrCreate(['branch_id' => $branch1->id, 'task_name' => 'Backflush espresso machine'], [
            'task_name_ar' => 'غسيل عكسي للماكينة', 'frequency' => 'daily', 'time_of_day' => '22:00',
            'equipment_id' => $espressoMachine?->id, 'duration_minutes' => 10,
            'steps' => ['Insert blind basket', 'Add cleaning powder', 'Run 5 backflush cycles', 'Rinse with clean water', 'Wipe group heads'],
            'is_active' => true,
        ]);
        $schedule2 = CleaningSchedule::firstOrCreate(['branch_id' => $branch1->id, 'task_name' => 'Clean grinder'], [
            'task_name_ar' => 'تنظيف الطاحونة', 'frequency' => 'daily', 'time_of_day' => '22:15',
            'equipment_id' => $grinderMythos?->id, 'duration_minutes' => 15,
            'steps' => ['Remove hopper', 'Vacuum burrs chamber', 'Run Grindz tablets', 'Wipe exterior', 'Reassemble'],
            'is_active' => true,
        ]);
        CleaningSchedule::firstOrCreate(['branch_id' => $branch1->id, 'task_name' => 'Deep clean steam wands'], [
            'task_name_ar' => 'تنظيف عميق لأذرع البخار', 'frequency' => 'weekly', 'time_of_day' => '21:00',
            'equipment_id' => $espressoMachine?->id, 'duration_minutes' => 20,
            'steps' => ['Soak in Cafiza solution 15min', 'Scrub with brush', 'Rinse thoroughly', 'Polish'],
            'is_active' => true,
        ]);

        // Generate today's tasks
        foreach ([$schedule1, $schedule2] as $sched) {
            CleaningTask::firstOrCreate(
                ['cleaning_schedule_id' => $sched->id, 'assigned_date' => today()],
                ['branch_id' => $branch1->id, 'status' => 'pending'],
            );
        }

        // A completed task from yesterday
        CleaningTask::firstOrCreate(
            ['cleaning_schedule_id' => $schedule1->id, 'assigned_date' => today()->subDay()],
            ['branch_id' => $branch1->id, 'status' => 'completed', 'started_at' => now()->subDay()->setHour(22),
             'completed_at' => now()->subDay()->setHour(22)->addMinutes(10), 'completed_by' => $barista->id],
        );

        // Calibration session (completed, 3 shots)
        $calibration = CalibrationSession::firstOrCreate(
            ['branch_id' => $branch1->id, 'barista_id' => $barista->id, 'created_at' => today()],
            [
                'equipment_machine_id' => $espressoMachine?->id ?? 4,
                'equipment_grinder_id' => $grinderMythos?->id ?? 5,
                'crop_id' => $crop1->id, 'recipe_id' => $recipe1->id,
                'status' => 'approved', 'total_shots' => 3,
                'total_dose_grams' => 162, 'total_waste_grams' => 162,
                'approved_by' => $userId, 'approved_at' => today(),
            ]
        );
        $shots = [
            ['dose' => 18, 'grind_setting' => '2.3', 'extraction_time' => 25, 'yield' => 34, 'tds' => 8.8, 'extraction_percent' => 19.5, 'is_within_range' => false],
            ['dose' => 18, 'grind_setting' => '2.2', 'extraction_time' => 27, 'yield' => 35, 'tds' => 9.2, 'extraction_percent' => 20.8, 'is_within_range' => true],
            ['dose' => 18, 'grind_setting' => '2.2', 'extraction_time' => 28, 'yield' => 36, 'tds' => 9.4, 'extraction_percent' => 21.0, 'is_within_range' => true],
        ];
        foreach ($shots as $i => $s) {
            CalibrationShot::firstOrCreate(
                ['calibration_session_id' => $calibration->id, 'shot_number' => $i + 1],
                array_merge($s, ['created_at' => now()]),
            );
        }

        // Calibration waste record
        WasteRecord::firstOrCreate(
            ['source_type' => CalibrationSession::class, 'source_id' => $calibration->id],
            ['crop_id' => $crop1->id, 'waste_type' => 'calibration_waste', 'weight_grams' => 162,
             'reason' => 'Calibration: 3 shots', 'created_by' => $barista->id, 'created_at' => today()],
        );

        $this->command->info('✅ Branch ops: 3 cleaning schedules + 3 tasks + 1 calibration (3 shots, approved)');

        // ══════════════════════════════════════════
        // FINAL: Set thresholds + Summary
        // ══════════════════════════════════════════
        $items = \App\Modules\Inventory\Models\InventoryItem::all();
        foreach ($items as $item) {
            $threshold = match ($item->item_type->value) {
                'green' => 10.00,
                'roasted' => 2.00,
                'bar' => 500,
                default => 5.00,
            };
            $item->update(['min_threshold' => $threshold]);
        }

        // Print final inventory
        $this->command->info('');
        $this->command->info('📦 Final Inventory:');
        $allItems = \App\Modules\Inventory\Models\InventoryItem::with(['branch', 'crop'])->get();
        foreach ($allItems as $inv) {
            $branchName = $inv->branch?->name ?? '?';
            $cropSn = $inv->crop?->serial_number ?? '?';
            $low = $inv->isLow() ? ' ⚠️ LOW' : '';
            $this->command->info("   {$branchName} | {$cropSn} | {$inv->item_type->value}: {$inv->quantity} {$inv->unit}{$low}");
        }
        $this->command->info('');
        $this->command->info('🔑 Login credentials:');
        $this->command->info('   Admin:      admin@hiqbah.com / password (PIN: 000000)');
        $this->command->info('   Roaster:    roaster@hiqbah.com / password (PIN: 111111)');
        $this->command->info('   Q-Grader:   qgrader@hiqbah.com / password (PIN: 222222)');
        $this->command->info('   Barista:    barista@hiqbah.com / password (PIN: 333333)');
        $this->command->info('   Warehouse:  warehouse@hiqbah.com / password (PIN: 444444)');
        $this->command->info('   Accountant: accountant@hiqbah.com / password (PIN: 555555)');
    }
}
