<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar');
            $table->string('code')->unique()->nullable();
            $table->string('type');
            $table->string('calculation');
            $table->decimal('value', 10, 2);
            $table->decimal('min_order_amount', 12, 2)->nullable();
            $table->integer('min_quantity')->nullable();
            $table->integer('max_uses')->nullable();
            $table->integer('times_used')->default(0);
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->foreignId('price_list_id')->nullable()->constrained('price_lists');
            $table->boolean('is_active')->default(true);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index('type');
            $table->index('code');
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
