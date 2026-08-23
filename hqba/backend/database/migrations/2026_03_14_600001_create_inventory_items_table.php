<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('item_type'); // green, roasted, finished_250, finished_500, finished_1kg, bar
            $table->string('sku')->nullable();
            $table->decimal('quantity', 12, 2)->default(0);
            $table->string('unit')->default('kg'); // kg, bags, g
            $table->decimal('min_threshold', 10, 2)->nullable();
            $table->timestamp('last_movement_at')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'crop_id', 'item_type']);
            $table->index('item_type');
            $table->index('crop_id');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
