<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pour_over_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->decimal('dose', 5, 2);
            $table->string('grind_setting');
            $table->string('brew_type')->default('hot'); // hot, iced
            $table->integer('bloom_time'); // seconds
            $table->decimal('bloom_water', 5, 1);
            $table->jsonb('pours'); // [{pour: 1, water: 80, time: 30}, ...]
            $table->decimal('total_water', 6, 1);
            $table->integer('total_time'); // seconds
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pour_over_recipes');
    }
};
