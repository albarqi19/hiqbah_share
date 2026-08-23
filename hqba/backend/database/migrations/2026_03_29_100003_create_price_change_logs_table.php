<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_change_logs', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->jsonb('changes');
            $table->string('change_reason')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->timestamp('created_at');

            $table->index(['entity_type', 'entity_id']);
            $table->index('changed_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_change_logs');
    }
};
