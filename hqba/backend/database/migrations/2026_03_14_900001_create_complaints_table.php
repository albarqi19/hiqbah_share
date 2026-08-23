<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->foreignId('crop_id')->nullable()->constrained('crops');
            $table->foreignId('roast_batch_id')->nullable()->constrained('roast_batches');
            $table->foreignId('order_id')->nullable()->constrained('orders');
            $table->string('subject');
            $table->text('description');
            $table->string('severity')->default('medium'); // low, medium, high, critical
            $table->string('status')->default('open'); // open, investigating, resolved, closed
            $table->text('investigation_notes')->nullable();
            $table->text('resolution')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('severity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
