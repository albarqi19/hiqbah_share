<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('item_type');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('min_quantity', 10, 2)->default(1);
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['price_list_id', 'crop_id', 'item_type', 'effective_from'],
                'pli_unique_price'
            );
            $table->index(['crop_id', 'item_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};
