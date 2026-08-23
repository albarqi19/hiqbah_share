<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('audit_type'); // green, roasted, finished, bar, full
            $table->string('status')->default('open'); // open, counting, review, approved, closed
            $table->foreignId('opened_by')->constrained('users');
            $table->timestamp('opened_at');
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('total_system_value', 14, 2)->default(0);
            $table->decimal('total_actual_value', 14, 2)->default(0);
            $table->decimal('total_variance_value', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_audit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_audit_id')->constrained('inventory_audits')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items');
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('item_type');
            $table->decimal('system_quantity', 12, 2);
            $table->decimal('actual_quantity', 12, 2)->nullable();
            $table->decimal('variance', 12, 2)->nullable();
            $table->decimal('variance_percent', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('counted_by')->nullable()->constrained('users');
            $table->timestamp('counted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_audit_items');
        Schema::dropIfExists('inventory_audits');
    }
};
