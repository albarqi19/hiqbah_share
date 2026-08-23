<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('recipe_code')->unique();
            $table->string('recipe_type'); // espresso, pour_over
            $table->integer('version')->default(1);
            $table->foreignId('parent_recipe_id')->nullable()->constrained('recipes')->nullOnDelete();
            $table->boolean('is_current')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->string('status')->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
