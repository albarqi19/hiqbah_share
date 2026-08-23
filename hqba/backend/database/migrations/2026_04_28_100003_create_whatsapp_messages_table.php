<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instance_id')->nullable()->constrained('whatsapp_instances')->nullOnDelete();
            $table->string('to_number', 30);
            $table->string('direction', 10)->default('outbound');
            $table->text('message');
            $table->string('status', 20)->default('pending');
            $table->string('event_type', 50)->nullable();
            $table->nullableMorphs('related');
            $table->text('error')->nullable();
            $table->json('response')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('to_number');
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
