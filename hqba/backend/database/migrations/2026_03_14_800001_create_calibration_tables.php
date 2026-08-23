<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calibration_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('equipment_machine_id')->constrained('equipment');
            $table->foreignId('equipment_grinder_id')->constrained('equipment');
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('recipe_id')->nullable()->constrained('recipes');
            $table->foreignId('barista_id')->constrained('users');
            $table->string('status')->default('open'); // open, completed, approved
            $table->integer('total_shots')->default(0);
            $table->decimal('total_dose_grams', 8, 2)->default(0);
            $table->decimal('total_waste_grams', 8, 2)->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
        });

        Schema::create('calibration_shots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calibration_session_id')->constrained('calibration_sessions')->cascadeOnDelete();
            $table->integer('shot_number');
            $table->decimal('dose', 6, 2);
            $table->string('grind_setting');
            $table->integer('extraction_time'); // seconds
            $table->decimal('yield', 6, 2);
            $table->decimal('tds', 5, 2)->nullable();
            $table->decimal('extraction_percent', 5, 2)->nullable();
            $table->integer('acidity_score')->nullable();  // 1-10
            $table->integer('finish_score')->nullable();   // 1-10
            $table->integer('balance_score')->nullable();  // 1-10
            $table->boolean('is_within_range')->default(false);
            $table->text('notes')->nullable();
            $table->timestamp('created_at');

            $table->index('calibration_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calibration_shots');
        Schema::dropIfExists('calibration_sessions');
    }
};
