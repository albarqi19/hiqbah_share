<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignId('requisition_id')->nullable()->constrained('purchase_requisitions');

            // Coffee spec
            $table->string('origin_country');
            $table->string('region');
            $table->string('farm')->nullable();
            $table->string('process'); // Washed, Natural, Honey
            $table->string('variety')->nullable();
            $table->string('altitude')->nullable();

            // Commercial
            $table->decimal('quantity_kg', 10, 2);
            $table->decimal('price_per_kg', 10, 2);
            $table->decimal('subtotal', 12, 2); // quantity * price

            // Quality expectations
            $table->decimal('expected_cupping_score', 4, 2)->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('purchase_order_id');
            $table->index('requisition_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};
