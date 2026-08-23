<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_request_id')->constrained('approval_requests')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->string('action'); // approve | reject
            $table->integer('step')->default(1);
            $table->text('comment')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();

            $table->index('approval_request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_actions');
    }
};
