<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable'); // approvable_type + approvable_id
            $table->foreignId('approval_rule_id')->constrained('approval_rules');
            $table->foreignId('requested_by')->constrained('users');
            $table->decimal('amount', 14, 2);
            $table->string('status')->default('pending'); // pending | approved | rejected | cancelled
            $table->integer('current_step')->default(1); // for sequential
            $table->integer('total_steps')->default(1);
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
    }
};
