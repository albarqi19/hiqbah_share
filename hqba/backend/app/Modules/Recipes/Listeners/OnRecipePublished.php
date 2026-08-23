<?php

namespace App\Modules\Recipes\Listeners;

use App\Core\Services\NotificationService;
use App\Modules\Recipes\Events\RecipePublished;

class OnRecipePublished
{
    public function handle(RecipePublished $event): void
    {
        $recipe = $event->recipe;
        $crop = $recipe->crop;

        app(NotificationService::class)->sendToAdmins(
            'recipe_published',
            "Recipe published: {$recipe->recipe_code} for {$crop->serial_number}",
            "تم نشر الوصفة: {$recipe->recipe_code} للمحصول {$crop->serial_number}",
            null, null,
            "/recipes/{$recipe->id}",
            get_class($recipe),
            $recipe->id,
        );
    }
}
