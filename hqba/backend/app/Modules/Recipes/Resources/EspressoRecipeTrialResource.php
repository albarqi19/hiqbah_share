<?php

namespace App\Modules\Recipes\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EspressoRecipeTrialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recipe_id' => $this->recipe_id,
            'trial_number' => $this->trial_number,
            'dose' => $this->dose,
            'grind_setting' => $this->grind_setting,
            'extraction_time' => $this->extraction_time,
            'yield' => $this->yield,
            'tds' => $this->tds,
            'extraction_percent' => $this->extraction_percent,
            'acidity' => $this->acidity,
            'finish' => $this->finish,
            'balance' => $this->balance,
            'is_best_shot' => $this->is_best_shot,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
