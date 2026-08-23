<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // total_cost is computed from items + shipping + customs after items are inserted.
            $table->decimal('total_cost', 12, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->decimal('total_cost', 12, 2)->nullable(false)->change();
        });
    }
};
