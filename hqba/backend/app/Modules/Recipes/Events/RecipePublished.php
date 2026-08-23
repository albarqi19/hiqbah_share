<?php

namespace App\Modules\Recipes\Events;

use App\Modules\Recipes\Models\Recipe;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecipePublished
{
    use Dispatchable, SerializesModels;

    public function __construct(public Recipe $recipe) {}
}
