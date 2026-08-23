<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('requisition_number')->unique();
            $table->foreignId('requested_by')->constrained('users');
            $table->string('department');
            $table->string('urgency')->default('normal');

            // Target spec (what we want to buy)
            $table->decimal('target_quantity_kg', 10, 2);
            $table->decimal('target_price_per_kg', 10, 2)->nullable();
            $table->string('target_origin_country')->nullable();
            $table->string('target_region')->nullable();
            $table->string('target_process')->nullable();
            $table->string('target_variety')->nullable();
            $table->foreignId('preferred_supplier_id')->nullable()->constrained('suppliers');

            $table->date('needed_by');
            $table->text('justification')->nullable();

            // Workflow
            $table->string('status')->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('converted_to_po_id')->nullable()->constrained('purchase_orders');
            $table->timestamp('converted_at')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'department']);
            $table->index('needed_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requisitions');
    }
};
