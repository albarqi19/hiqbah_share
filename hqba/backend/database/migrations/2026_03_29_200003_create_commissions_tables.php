<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar');
            $table->string('type');
            $table->decimal('value', 10, 2);
            $table->foreignId('sales_rep_id')->nullable()->constrained('users');
            $table->string('customer_tier')->nullable();
            $table->decimal('min_order_total', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index('sales_rep_id');
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('sales_rep_id')->constrained('users');
            $table->foreignId('commission_rule_id')->nullable()->constrained('commission_rules');
            $table->decimal('order_total', 12, 2);
            $table->decimal('commission_amount', 10, 2);
            $table->string('calculation_method');
            $table->decimal('calculation_value', 10, 2);
            $table->string('status')->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('users');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->unsignedBigInteger('reversed_by_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['order_id', 'sales_rep_id'], 'commission_order_rep_unique');
            $table->index('sales_rep_id');
            $table->index('status');
            $table->foreign('reversed_by_id')->references('id')->on('commissions');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('commission_rules');
    }
};
