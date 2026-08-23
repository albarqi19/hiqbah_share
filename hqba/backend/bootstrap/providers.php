<?php

use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    App\Core\Providers\CoreServiceProvider::class,
    App\Providers\EventServiceProvider::class,
];
