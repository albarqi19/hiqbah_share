<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained('crops');
            $table->string('source_type'); // App\Modules\Crops\Models\TrialRoast, etc.
            $table->unsignedBigInteger('source_id');
            $table->string('waste_type'); // trial_roast_sample, cupping_waste, roast_loss, etc.
            $table->decimal('weight_grams', 10, 2);
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('created_at');

            $table->index(['source_type', 'source_id']);
            $table->index('crop_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_records');
    }
};
