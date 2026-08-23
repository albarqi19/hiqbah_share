<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('sales_rep_id')->nullable()->after('branch_id')->constrained('users');
            $table->foreignId('price_list_id')->nullable()->after('sales_rep_id')->constrained('price_lists');
            $table->string('payment_terms')->nullable()->after('price_list_id');
            $table->decimal('credit_limit', 12, 2)->nullable()->after('payment_terms');
            $table->string('customer_tier')->default('standard')->after('credit_limit');

            $table->index('sales_rep_id');
            $table->index('price_list_id');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['sales_rep_id']);
            $table->dropForeign(['price_list_id']);
            $table->dropIndex(['sales_rep_id']);
            $table->dropIndex(['price_list_id']);
            $table->dropColumn(['sales_rep_id', 'price_list_id', 'payment_terms', 'credit_limit', 'customer_tier']);
        });
    }
};
