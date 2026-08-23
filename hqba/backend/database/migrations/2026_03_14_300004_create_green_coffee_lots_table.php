<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('green_coffee_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->string('batch_id')->unique();
            $table->integer('bags_count');
            $table->decimal('expected_weight', 10, 2);
            $table->decimal('actual_weight', 10, 2);
            $table->decimal('weight_variance', 10, 2)->default(0);
            $table->date('arrival_date');
            $table->string('barcode')->nullable();
            $table->string('qr_code')->nullable();
            $table->string('shipping_document')->nullable();
            $table->foreignId('received_by')->constrained('users');
            $table->string('status')->default('received');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('green_coffee_lots');
    }
};
