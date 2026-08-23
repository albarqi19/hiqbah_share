<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cleaning_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('equipment_id')->nullable()->constrained('equipment');
            $table->string('task_name');
            $table->string('task_name_ar');
            $table->string('frequency'); // daily, weekly, monthly
            $table->string('time_of_day')->nullable(); // e.g. "08:00"
            $table->jsonb('steps')->nullable();
            $table->integer('duration_minutes')->default(15);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cleaning_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cleaning_schedule_id')->constrained('cleaning_schedules');
            $table->foreignId('branch_id')->constrained('branches');
            $table->date('assigned_date');
            $table->string('status')->default('pending'); // pending, in_progress, completed, reviewed, overdue
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_status')->nullable(); // approved, rejected
            $table->jsonb('before_photos')->nullable();
            $table->jsonb('after_photos')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'assigned_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cleaning_tasks');
        Schema::dropIfExists('cleaning_schedules');
    }
};
