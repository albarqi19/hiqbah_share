<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('company_name_ar')->nullable();
            $table->string('contact_name');
            $table->string('contact_name_ar')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('stage')->default('new_lead');
            $table->string('source')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('estimated_monthly_kg', 10, 2)->nullable();
            $table->foreignId('sales_rep_id')->constrained('users');
            $table->foreignId('converted_customer_id')->nullable()->constrained('customers');
            $table->timestamp('contacted_at')->nullable();
            $table->timestamp('quoted_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->string('lost_reason')->nullable();
            $table->timestamps();

            $table->index('stage');
            $table->index('sales_rep_id');
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
