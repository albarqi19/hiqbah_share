<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_instances', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('status', 30)->default('disconnected');
            $table->string('evolution_id')->nullable();
            $table->text('token')->nullable();
            $table->text('qr_code')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('last_qr_at')->nullable();
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('is_default');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_instances');
    }
};
