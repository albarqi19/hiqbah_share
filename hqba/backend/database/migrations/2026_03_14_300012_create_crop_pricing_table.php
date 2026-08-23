<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_pricing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->unique()->constrained('crops');
            $table->decimal('landed_cost_per_kg', 10, 2)->default(0);
            $table->decimal('green_cost_per_kg', 10, 2);
            $table->decimal('roasting_loss_percent', 5, 2);
            $table->decimal('roasting_cost_per_kg', 10, 2)->default(0);
            $table->decimal('packaging_cost_per_unit', 10, 2)->default(0);
            $table->decimal('operation_cost_per_kg', 10, 2)->default(0);
            $table->decimal('shipping_cost_per_kg', 10, 2)->default(0);
            $table->decimal('total_cost_per_kg_roasted', 10, 2);
            $table->decimal('target_margin_percent', 5, 2)->default(30);
            $table->decimal('retail_price_250g', 10, 2)->nullable();
            $table->decimal('retail_price_500g', 10, 2)->nullable();
            $table->decimal('retail_price_1kg', 10, 2)->nullable();
            $table->decimal('wholesale_price_kg', 10, 2)->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('set_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_pricing');
    }
};
