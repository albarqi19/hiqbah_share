<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Detail fields move to purchase_order_items.
            // Existing columns stay for backward-compat with old POs but become nullable.
            $table->string('origin_country')->nullable()->change();
            $table->string('region')->nullable()->change();
            $table->string('process')->nullable()->change();
            $table->decimal('quantity_kg', 10, 2)->nullable()->change();
            $table->decimal('price_per_kg', 10, 2)->nullable()->change();
            // total_cost is now derived from items + shipping + customs, can be null at create time.
            $table->decimal('total_cost', 12, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('origin_country')->nullable(false)->change();
            $table->string('region')->nullable(false)->change();
            $table->string('process')->nullable(false)->change();
            $table->decimal('quantity_kg', 10, 2)->nullable(false)->change();
            $table->decimal('price_per_kg', 10, 2)->nullable(false)->change();
            $table->decimal('total_cost', 12, 2)->nullable(false)->change();
        });
    }
};
