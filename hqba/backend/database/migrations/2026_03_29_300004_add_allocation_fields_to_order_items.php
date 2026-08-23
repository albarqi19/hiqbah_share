<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->integer('quantity_allocated')->default(0)->after('quantity');
            $table->integer('quantity_shipped')->default(0)->after('quantity_allocated');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('total_price');
            $table->decimal('final_price', 12, 2)->nullable()->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['quantity_allocated', 'quantity_shipped', 'discount_amount', 'final_price']);
        });
    }
};
