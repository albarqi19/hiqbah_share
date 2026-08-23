<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_orders', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique();
            $table->foreignId('from_branch_id')->constrained('branches');
            $table->foreignId('to_branch_id')->constrained('branches');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->string('status')->default('draft'); // draft, approved, shipped, received, confirmed, cancelled
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('transfer_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_order_id')->constrained('transfer_orders')->cascadeOnDelete();
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('item_type'); // finished_250, finished_500, finished_1kg, bar
            $table->integer('quantity_sent');
            $table->integer('quantity_received')->nullable();
            $table->integer('quantity_variance')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_order_items');
        Schema::dropIfExists('transfer_orders');
    }
};
