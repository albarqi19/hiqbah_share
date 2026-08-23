<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roast_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('recipe_id')->nullable()->constrained('recipes');
            $table->foreignId('roaster_id')->constrained('users');
            $table->string('status')->default('queued'); // queued, roasting, cooling, pending_qc, approved, rejected
            $table->integer('queue_position')->default(0);
            $table->boolean('is_priority')->default(false);

            // Weights
            $table->decimal('green_weight_kg', 10, 2);
            $table->decimal('roasted_weight_kg', 10, 2)->nullable();
            $table->decimal('roast_loss_kg', 10, 2)->nullable();
            $table->decimal('roast_loss_percent', 5, 2)->nullable();

            // Roast profile (target from trial roast)
            $table->decimal('target_charge_temp', 5, 1)->nullable();
            $table->string('target_first_crack_time')->nullable();
            $table->decimal('target_first_crack_temp', 5, 1)->nullable();
            $table->string('target_development_time')->nullable();
            $table->decimal('target_drop_temp', 5, 1)->nullable();
            $table->string('target_total_time')->nullable();
            $table->string('target_roast_level')->nullable();

            // Actual roast data
            $table->decimal('actual_charge_temp', 5, 1)->nullable();
            $table->string('actual_first_crack_time')->nullable();
            $table->decimal('actual_first_crack_temp', 5, 1)->nullable();
            $table->string('actual_development_time')->nullable();
            $table->decimal('actual_development_percent', 5, 2)->nullable();
            $table->decimal('actual_drop_temp', 5, 1)->nullable();
            $table->string('actual_total_time')->nullable();
            $table->string('actual_roast_level')->nullable();
            $table->jsonb('roast_curve_data')->nullable();

            // Timestamps
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('crop_id');
            $table->index('queue_position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roast_batches');
    }
};
