<?php

namespace App\Modules\Whatsapp\Listeners;

use App\Core\Events\UserCreated;
use App\Core\Models\User;
use App\Modules\Whatsapp\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendUserWelcomeWhatsapp
{
    public function __construct(
        protected WhatsappService $whatsapp,
    ) {}

    public function handle(UserCreated $event): void
    {
        $user = $event->user;

        if (empty($user->phone)) {
            Log::info('Skip WhatsApp welcome — user has no phone', ['user_id' => $user->id]);
            return;
        }

        $message = $this->buildMessage($user, $event->plainPin, $event->plainPassword);

        $this->whatsapp->sendMessage(
            phone: $user->phone,
            message: $message,
            eventType: 'user_welcome',
            related: $user,
        );
    }

    protected function buildMessage(User $user, ?string $pin, ?string $password): string
    {
        $lang = $user->language?->value ?? 'ar';

        if ($lang === 'en') {
            $name = $user->name ?: $user->name_ar;
            $lines = [
                "Hello {$name} 👋",
                "Your account has been created on Hiqbah system.",
                '',
            ];

            if ($pin) {
                $lines[] = "🔐 PIN: {$pin}";
            }

            if ($password) {
                $lines[] = "🔑 Password: {$password}";
            }

            $lines[] = '';
            $lines[] = 'The system login link will be shared with you soon.';
            $lines[] = 'Please keep this information safe.';

            return implode("\n", $lines);
        }

        $name = $user->name_ar ?: $user->name;
        $lines = [
            "مرحباً {$name} 👋",
            'تم إنشاء حسابك في نظام حِقبة',
            '',
        ];

        if ($pin) {
            $lines[] = "🔐 رمز الدخول (PIN): {$pin}";
        }

        if ($password) {
            $lines[] = "🔑 كلمة المرور: {$password}";
        }

        $lines[] = '';
        $lines[] = 'سيتم مشاركة رابط الدخول للنظام معك قريباً.';
        $lines[] = 'يُرجى الاحتفاظ بهذه المعلومات في مكان آمن 🔒';

        return implode("\n", $lines);
    }
}
