<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cleaning_schedules', function (Blueprint $table) {
            $table->string('area')->nullable()->after('equipment_id');
        });
    }

    public function down(): void
    {
        Schema::table('cleaning_schedules', function (Blueprint $table) {
            $table->dropColumn('area');
        });
    }
};
