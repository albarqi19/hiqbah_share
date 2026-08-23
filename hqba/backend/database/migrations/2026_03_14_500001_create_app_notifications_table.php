<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('type'); // po_approved, crop_status_changed, cupping_completed, etc.
            $table->string('title');
            $table->string('title_ar');
            $table->text('body')->nullable();
            $table->text('body_ar')->nullable();
            $table->string('link')->nullable(); // e.g. /crops/1?tab=cupping
            $table->string('reference_type')->nullable(); // App\Modules\Crops\Models\Crop
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
