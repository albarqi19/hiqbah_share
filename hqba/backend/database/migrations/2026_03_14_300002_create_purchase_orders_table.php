<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->string('origin_country');
            $table->string('region');
            $table->string('farm')->nullable();
            $table->string('process'); // Washed, Natural, Honey
            $table->string('variety')->nullable();
            $table->string('altitude')->nullable();
            $table->decimal('quantity_kg', 10, 2);
            $table->decimal('price_per_kg', 10, 2);
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->decimal('customs_cost', 10, 2)->default(0);
            $table->decimal('total_cost', 12, 2);
            $table->string('currency', 5)->default('SAR');
            $table->date('expected_date');
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
