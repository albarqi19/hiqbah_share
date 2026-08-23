<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_marketing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->unique()->constrained('crops');
            $table->string('product_name');
            $table->string('product_name_ar');
            $table->text('marketing_description')->nullable();
            $table->text('marketing_description_ar')->nullable();
            $table->string('flavor_display')->nullable();
            $table->string('label_template')->nullable();
            $table->string('label_pdf_url')->nullable();
            $table->text('social_media_text')->nullable();
            $table->text('social_media_text_ar')->nullable();
            $table->jsonb('photos')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_marketing');
    }
};
