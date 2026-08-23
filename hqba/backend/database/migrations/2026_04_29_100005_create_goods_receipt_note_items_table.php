<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_receipt_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_note_id')->constrained('goods_receipt_notes')->cascadeOnDelete();
            $table->foreignId('purchase_order_item_id')->constrained('purchase_order_items');

            $table->integer('bags_received')->default(0);
            $table->decimal('weight_received', 10, 2);
            $table->decimal('expected_weight', 10, 2);
            $table->decimal('variance', 10, 2)->default(0);
            $table->string('condition')->default('good'); // GrnCondition

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('goods_receipt_note_id');
            $table->index('purchase_order_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_note_items');
    }
};
