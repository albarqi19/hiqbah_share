<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cupping_sessions', function (Blueprint $table) {
            $table->decimal('uniformity', 3, 1)->nullable()->after('overall_score');
            $table->decimal('clean_cup', 3, 1)->nullable()->after('uniformity');
            $table->integer('defects')->default(0)->after('clean_cup');
            $table->string('defect_type')->nullable()->after('defects'); // taint, fault
            $table->integer('defect_intensity')->default(0)->after('defect_type');
            $table->decimal('total_score_before_defects', 4, 1)->nullable()->after('defect_intensity');
            $table->decimal('final_score', 4, 1)->nullable()->after('total_score_before_defects');
            $table->string('classification')->nullable()->after('final_score');
            $table->integer('sample_number')->default(1)->after('classification');
            $table->boolean('is_blind_cupping')->default(true)->after('sample_number');
        });
    }

    public function down(): void
    {
        Schema::table('cupping_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'uniformity', 'clean_cup', 'defects', 'defect_type',
                'defect_intensity', 'total_score_before_defects', 'final_score',
                'classification', 'sample_number', 'is_blind_cupping',
            ]);
        });
    }
};
