<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('espresso_recipe_trials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->integer('trial_number');
            $table->decimal('dose', 5, 2);
            $table->string('grind_setting');
            $table->integer('extraction_time'); // seconds
            $table->decimal('yield', 5, 2);
            $table->decimal('tds', 4, 2)->nullable();
            $table->decimal('extraction_percent', 5, 2)->nullable();
            $table->integer('acidity')->nullable(); // 1-10
            $table->integer('finish')->nullable();   // 1-10
            $table->integer('balance')->nullable();   // 1-10
            $table->boolean('is_best_shot')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['recipe_id', 'trial_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('espresso_recipe_trials');
    }
};
