<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('entity_type'); // e.g. App\Modules\Procurement\Models\PurchaseOrder
            $table->decimal('min_amount', 14, 2)->default(0);
            $table->decimal('max_amount', 14, 2)->nullable(); // null = no upper bound
            $table->json('required_approvers'); // [{"type":"role","value":"finance_manager"}, {"type":"user","value":5}]
            $table->string('approval_type')->default('sequential'); // sequential | parallel | any_one
            $table->integer('priority')->default(0); // higher checks first
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['entity_type', 'is_active', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_rules');
    }
};
