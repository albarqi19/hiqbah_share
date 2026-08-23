<?php

namespace App\Core\Events;

use App\Core\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public ?string $plainPin = null,
        public ?string $plainPassword = null,
    ) {}
}
