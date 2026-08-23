<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crops', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->string('name');
            $table->string('name_ar');
            $table->string('origin_country');
            $table->string('region');
            $table->string('farm')->nullable();
            $table->string('process');
            $table->string('variety')->nullable();
            $table->string('altitude')->nullable();
            $table->string('lot_number');
            $table->string('status')->default('ordered');
            $table->decimal('total_green_weight', 10, 2)->default(0);
            $table->decimal('remaining_green_weight', 10, 2)->default(0);
            $table->string('usage_type')->nullable(); // espresso, filter, both
            $table->jsonb('flavor_notes')->nullable();
            $table->text('description')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('brew_recommendations')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crops');
    }
};
