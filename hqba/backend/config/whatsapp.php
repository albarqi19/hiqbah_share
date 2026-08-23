<?php

return [
    'api_url' => env('WHATSAPP_API_URL', 'http://evo-r0oo0g0gk0wokgogskcckcsg.185.253.118.195.sslip.io'),
    'api_key' => env('WHATSAPP_API_KEY', 'M7VI1DkNkekhjtavggrssXrLwta3Rr1m'),
    'default_instance' => env('WHATSAPP_DEFAULT_INSTANCE', 'hqba_main'),
    'webhook_url' => env('WHATSAPP_WEBHOOK_URL'),
    'app_url' => env('APP_FRONTEND_URL', env('APP_URL', 'http://localhost:5173')),
    'timeout' => 30,
];
