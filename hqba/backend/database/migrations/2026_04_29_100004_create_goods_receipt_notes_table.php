<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_receipt_notes', function (Blueprint $table) {
            $table->id();
            $table->string('grn_number')->unique();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->foreignId('received_by')->constrained('users');
            $table->timestamp('received_at');

            // Quantities (header roll-up)
            $table->integer('bags_received')->default(0);
            $table->decimal('total_weight_received', 10, 2);
            $table->decimal('expected_weight', 10, 2);
            $table->decimal('variance_weight', 10, 2)->default(0);
            $table->decimal('variance_percent', 6, 2)->default(0);

            // Shipping documents
            $table->string('delivery_note_number')->nullable();
            $table->string('carrier')->nullable();
            $table->json('shipping_documents')->nullable(); // array of file paths
            $table->json('photos')->nullable();

            // Condition snapshot at receiving
            $table->string('condition')->default('good'); // GrnCondition

            // Workflow
            $table->string('status')->default('received'); // GrnStatus

            // QC layer
            $table->timestamp('qc_started_at')->nullable();
            $table->foreignId('qc_completed_by')->nullable()->constrained('users');
            $table->timestamp('qc_completed_at')->nullable();
            $table->string('qc_decision')->nullable(); // accepted | conditionally_accepted | rejected
            $table->decimal('qc_moisture_percent', 4, 2)->nullable();
            $table->decimal('qc_cupping_score', 4, 2)->nullable();
            $table->text('qc_notes')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['purchase_order_id', 'status']);
            $table->index('received_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_notes');
    }
};
