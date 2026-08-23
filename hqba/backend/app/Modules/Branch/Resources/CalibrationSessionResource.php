<?php

namespace App\Modules\Branch\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalibrationSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'total_shots' => $this->total_shots,
            'total_dose_grams' => (float) $this->total_dose_grams,
            'total_waste_grams' => (float) $this->total_waste_grams,
            'branch' => $this->whenLoaded('branch', fn () => ['id' => $this->branch->id, 'name' => $this->branch->name, 'name_ar' => $this->branch->name_ar]),
            'machine' => $this->whenLoaded('machine', fn () => ['id' => $this->machine->id, 'name' => $this->machine->name, 'code' => $this->machine->code]),
            'grinder' => $this->whenLoaded('grinder', fn () => ['id' => $this->grinder->id, 'name' => $this->grinder->name, 'code' => $this->grinder->code]),
            'crop' => $this->whenLoaded('crop', fn () => ['id' => $this->crop->id, 'serial_number' => $this->crop->serial_number, 'name' => $this->crop->name, 'name_ar' => $this->crop->name_ar]),
            'recipe' => $this->whenLoaded('recipe', fn () => [
                'id' => $this->recipe->id, 'recipe_code' => $this->recipe->recipe_code,
                'espresso' => $this->recipe->relationLoaded('espressoRecipe') && $this->recipe->espressoRecipe ? [
                    'dose' => (float) $this->recipe->espressoRecipe->dose,
                    'grind_setting' => $this->recipe->espressoRecipe->grind_setting,
                    'extraction_time' => $this->recipe->espressoRecipe->extraction_time,
                    'yield' => (float) $this->recipe->espressoRecipe->yield,
                    'tds' => (float) $this->recipe->espressoRecipe->tds,
                    'extraction_percent' => (float) $this->recipe->espressoRecipe->extraction_percent,
                ] : null,
            ]),
            'barista' => $this->whenLoaded('barista', fn () => ['id' => $this->barista->id, 'name' => $this->barista->name, 'name_ar' => $this->barista->name_ar]),
            'shots' => $this->whenLoaded('shots', fn () =>
                $this->shots->map(fn ($s) => [
                    'id' => $s->id, 'shot_number' => $s->shot_number,
                    'dose' => (float) $s->dose, 'grind_setting' => $s->grind_setting,
                    'extraction_time' => $s->extraction_time, 'yield' => (float) $s->yield,
                    'tds' => $s->tds ? (float) $s->tds : null,
                    'extraction_percent' => $s->extraction_percent ? (float) $s->extraction_percent : null,
                    'acidity_score' => $s->acidity_score, 'finish_score' => $s->finish_score, 'balance_score' => $s->balance_score,
                    'is_within_range' => $s->is_within_range, 'notes' => $s->notes, 'created_at' => $s->created_at,
                ])
            ),
            'approved_at' => $this->approved_at?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
