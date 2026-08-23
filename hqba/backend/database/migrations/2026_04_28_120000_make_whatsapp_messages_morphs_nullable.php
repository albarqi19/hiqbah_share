<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE whatsapp_messages ALTER COLUMN related_type DROP NOT NULL');
        DB::statement('ALTER TABLE whatsapp_messages ALTER COLUMN related_id DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE whatsapp_messages ALTER COLUMN related_type SET NOT NULL');
        DB::statement('ALTER TABLE whatsapp_messages ALTER COLUMN related_id SET NOT NULL');
    }
};
