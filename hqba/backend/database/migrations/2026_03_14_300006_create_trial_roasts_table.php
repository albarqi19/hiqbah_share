<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_roasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('green_coffee_lot_id')->constrained('green_coffee_lots');
            $table->foreignId('roaster_id')->constrained('users');
            $table->integer('trial_number');
            $table->decimal('sample_weight_grams', 8, 2);
            $table->decimal('roasted_weight_grams', 8, 2)->nullable();
            $table->decimal('roast_loss_grams', 8, 2)->nullable();
            $table->decimal('roast_loss_percent', 5, 2)->nullable();
            $table->decimal('charge_temp', 5, 1)->nullable();
            $table->string('drying_time')->nullable();
            $table->string('maillard_time')->nullable();
            $table->string('first_crack_time')->nullable();
            $table->decimal('first_crack_temp', 5, 1)->nullable();
            $table->string('development_time')->nullable();
            $table->decimal('development_percent', 5, 2)->nullable();
            $table->decimal('drop_temp', 5, 1)->nullable();
            $table->string('total_roast_time')->nullable();
            $table->jsonb('roast_curve_data')->nullable();
            $table->string('roast_level')->nullable();
            $table->string('usage_type')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('in_progress');
            $table->timestamp('roasted_at');
            $table->timestamps();

            $table->unique(['crop_id', 'trial_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_roasts');
    }
};
