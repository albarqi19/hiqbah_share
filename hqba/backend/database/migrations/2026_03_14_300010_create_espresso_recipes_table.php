<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('espresso_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->decimal('dose', 5, 2);
            $table->string('grind_setting');
            $table->integer('extraction_time');
            $table->decimal('yield', 5, 2);
            $table->decimal('tds', 4, 2);
            $table->decimal('extraction_percent', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('espresso_recipes');
    }
};
