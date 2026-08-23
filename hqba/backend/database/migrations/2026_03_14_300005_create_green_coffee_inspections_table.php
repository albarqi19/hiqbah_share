<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('green_coffee_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('green_coffee_lot_id')->constrained('green_coffee_lots');
            $table->foreignId('inspector_id')->constrained('users');
            $table->decimal('moisture_percent', 5, 2)->nullable();
            $table->decimal('water_activity', 5, 3)->nullable();
            $table->decimal('density', 8, 2)->nullable();
            $table->string('screen_size')->nullable();
            $table->integer('defect_count')->nullable();
            $table->text('defect_notes')->nullable();
            $table->text('visual_notes')->nullable();
            $table->string('decision'); // approved, rejected, conditional
            $table->text('rejection_reason')->nullable();
            $table->text('condition_notes')->nullable();
            $table->jsonb('photos')->nullable();
            $table->timestamp('inspected_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('green_coffee_inspections');
    }
};
