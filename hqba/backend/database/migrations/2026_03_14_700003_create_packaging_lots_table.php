<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packaging_lots', function (Blueprint $table) {
            $table->id();
            $table->string('lot_number')->unique();
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('roast_batch_id')->nullable()->constrained('roast_batches');
            $table->foreignId('packed_by')->constrained('users');
            $table->string('status')->default('pending'); // pending, packed, completed
            $table->string('package_size'); // 250, 500, 1000
            $table->integer('bags_count');
            $table->decimal('roasted_weight_used_kg', 10, 2);
            $table->decimal('net_weight_per_bag_g', 8, 2);
            $table->decimal('total_net_weight_kg', 10, 2);
            $table->decimal('packaging_waste_g', 8, 2)->nullable();
            $table->string('sku')->nullable();
            $table->jsonb('qr_data')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('packed_at')->nullable();
            $table->timestamps();

            $table->index('crop_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packaging_lots');
    }
};
