<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cupping_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained('crops');
            $table->foreignId('trial_roast_id')->constrained('trial_roasts');
            $table->foreignId('grader_id')->constrained('users');
            $table->date('scheduled_date');
            $table->integer('cups_count');
            $table->decimal('dose_per_cup', 5, 2);
            $table->decimal('total_coffee_used', 8, 2);
            // SCA Cupping Scores (1-10 scale)
            $table->decimal('fragrance', 3, 1)->nullable();
            $table->decimal('aroma', 3, 1)->nullable();
            $table->decimal('flavor', 3, 1)->nullable();
            $table->decimal('acidity', 3, 1)->nullable();
            $table->decimal('body', 3, 1)->nullable();
            $table->decimal('aftertaste', 3, 1)->nullable();
            $table->decimal('balance', 3, 1)->nullable();
            $table->decimal('sweetness', 3, 1)->nullable();
            $table->decimal('overall_score', 4, 1)->nullable();
            $table->jsonb('flavor_notes')->nullable();
            $table->text('description')->nullable();
            $table->text('brew_recommendations')->nullable();
            $table->string('decision')->nullable(); // approved, rejected, retest
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
            $table->jsonb('photos')->nullable();
            $table->string('status')->default('scheduled');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupping_sessions');
    }
};
