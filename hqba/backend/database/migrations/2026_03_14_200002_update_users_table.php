<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name_ar')->after('name');
            $table->string('pin')->nullable()->after('password'); // hashed, needs full varchar
            $table->foreignId('branch_id')->nullable()->after('pin')
                ->constrained('branches')->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('branch_id');
            $table->string('language', 2)->default('ar')->after('is_active');
            $table->string('avatar')->nullable()->after('language');
            $table->timestamp('last_login_at')->nullable()->after('avatar');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn([
                'name_ar', 'pin', 'branch_id', 'is_active',
                'language', 'avatar', 'last_login_at',
            ]);
        });
    }
};
