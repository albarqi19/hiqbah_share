<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items');
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('movement_type');
            $table->string('direction'); // in, out
            $table->decimal('quantity', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->decimal('total_cost', 12, 2)->nullable();
            $table->foreignId('staff_id')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamp('created_at');

            $table->index('inventory_item_id');
            $table->index(['branch_id', 'created_at']);
            $table->index('crop_id');
            $table->index('movement_type');
            $table->index(['reference_type', 'reference_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
