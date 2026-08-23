<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('market_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->nullable()->constrained('crops')->nullOnDelete();
            $table->string('source')->default('barista'); // barista, customer, wholesale
            $table->string('feedback_type')->default('general'); // taste, aroma, packaging, general
            $table->tinyInteger('rating')->nullable(); // 1-5
            $table->text('comment');
            $table->string('customer_name')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_feedback');
    }
};
