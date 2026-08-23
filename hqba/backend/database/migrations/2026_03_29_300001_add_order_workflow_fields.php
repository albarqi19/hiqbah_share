<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('sales_rep_id')->nullable()->after('created_by')->constrained('users');
            $table->foreignId('price_list_id')->nullable()->after('sales_rep_id')->constrained('price_lists');
            $table->foreignId('discount_id')->nullable()->after('discount')->constrained('discounts');
            $table->string('discount_code')->nullable()->after('discount_id');
            $table->string('payment_terms')->nullable()->after('payment_status');
            $table->date('payment_due_date')->nullable()->after('payment_terms');
            $table->string('quote_number')->nullable()->after('internal_notes');
            $table->timestamp('quote_generated_at')->nullable()->after('quote_number');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
            $table->text('delivery_notes')->nullable()->after('delivered_at');

            $table->index('sales_rep_id');
            $table->index('payment_due_date');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['sales_rep_id']);
            $table->dropForeign(['price_list_id']);
            $table->dropForeign(['discount_id']);
            $table->dropIndex(['sales_rep_id']);
            $table->dropIndex(['payment_due_date']);
            $table->dropColumn([
                'sales_rep_id', 'price_list_id', 'discount_id', 'discount_code',
                'payment_terms', 'payment_due_date',
                'quote_number', 'quote_generated_at',
                'delivered_at', 'delivery_notes',
            ]);
        });
    }
};
