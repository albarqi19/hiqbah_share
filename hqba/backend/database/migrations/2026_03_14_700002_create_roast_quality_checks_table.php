<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roast_quality_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('roast_batch_id')->constrained('roast_batches');
            $table->foreignId('inspector_id')->constrained('users');
            $table->decimal('sample_weight_grams', 8, 2)->default(100);
            $table->integer('color_score')->nullable();       // 1-10
            $table->integer('aroma_score')->nullable();       // 1-10
            $table->integer('flavor_score')->nullable();      // 1-10
            $table->integer('acidity_score')->nullable();     // 1-10
            $table->integer('body_score')->nullable();        // 1-10
            $table->integer('balance_score')->nullable();     // 1-10
            $table->decimal('total_score', 5, 1)->nullable(); // calculated /100
            $table->string('decision')->nullable();           // approved, rejected, conditional
            $table->text('rejection_reason')->nullable();
            $table->text('corrective_action')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();

            $table->index('roast_batch_id');
            $table->index('decision');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roast_quality_checks');
    }
};
