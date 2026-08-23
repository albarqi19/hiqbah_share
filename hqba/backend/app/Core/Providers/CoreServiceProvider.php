<?php

namespace App\Core\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class CoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->loadModuleRoutes();

        // Super admin bypass: any permission check passes for super_admin role.
        Gate::before(function ($user, $ability) {
            return $user->hasRole('super_admin') ? true : null;
        });
    }

    protected function loadModuleRoutes(): void
    {
        $modules = [
            'Procurement',
            'Crops',
            'Recipes',
            'Production',
            'Orders',
            'Inventory',
            'Branch',
            'Quality',
            'Reporting',
            'Pricing',
            'Sales',
            'Whatsapp',
        ];

        foreach ($modules as $module) {
            $routeFile = app_path("Modules/{$module}/routes.php");
            if (file_exists($routeFile)) {
                $this->loadRoutesFrom($routeFile);
            }
        }
    }
}
