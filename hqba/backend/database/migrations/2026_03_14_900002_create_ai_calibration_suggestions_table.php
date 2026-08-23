<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_calibration_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('equipment_grinder_id')->nullable()->constrained('equipment');
            $table->foreignId('equipment_machine_id')->nullable()->constrained('equipment');
            $table->decimal('suggested_dose', 6, 2)->nullable();
            $table->string('suggested_grind')->nullable();
            $table->integer('suggested_time')->nullable();
            $table->decimal('suggested_yield', 6, 2)->nullable();
            $table->decimal('confidence', 5, 2)->nullable(); // 0-100
            $table->text('reasoning_ar')->nullable();
            $table->text('reasoning_en')->nullable();
            $table->jsonb('alerts')->nullable(); // grinder_drift, bean_aging, etc.
            $table->jsonb('analysis_data')->nullable(); // raw input/output
            $table->string('status')->default('pending'); // pending, published, dismissed
            $table->foreignId('requested_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_calibration_suggestions');
    }
};
