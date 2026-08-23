<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items');
            $table->decimal('quantity_allocated', 10, 2);
            $table->string('status')->default('reserved');
            $table->foreignId('allocated_by')->constrained('users');
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('inventory_item_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_allocations');
    }
};
