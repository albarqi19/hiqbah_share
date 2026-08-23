<?php

namespace App\Core\Services;

use App\Core\Models\AppNotification;
use App\Core\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function send(int $userId, string $type, string $title, string $titleAr, ?string $body = null, ?string $bodyAr = null, ?string $link = null, ?string $referenceType = null, ?int $referenceId = null): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'title_ar' => $titleAr,
            'body' => $body,
            'body_ar' => $bodyAr,
            'link' => $link,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);

        // Send email notification if enabled
        $this->sendEmail($userId, $title, $body ?? $title, $link);

        return $notification;
    }

    public function sendToAdmins(string $type, string $title, string $titleAr, ?string $body = null, ?string $bodyAr = null, ?string $link = null, ?string $referenceType = null, ?int $referenceId = null): void
    {
        $admins = User::role(['super_admin', 'admin'])->get();
        foreach ($admins as $admin) {
            $this->send($admin->id, $type, $title, $titleAr, $body, $bodyAr, $link, $referenceType, $referenceId);
        }
    }

    /**
     * Send email notification to user if they have an email.
     * Fails silently — email is a best-effort channel.
     */
    protected function sendEmail(int $userId, string $subject, string $body, ?string $link = null): void
    {
        try {
            if (!config('mail.from.address')) return;

            $user = User::find($userId);
            if (!$user?->email) return;

            $appUrl = config('app.frontend_url', config('app.url'));
            $fullLink = $link ? rtrim($appUrl, '/') . $link : null;

            Mail::raw(
                $body . ($fullLink ? "\n\n{$fullLink}" : ''),
                function ($message) use ($user, $subject) {
                    $message->to($user->email)->subject("HIQBAH — {$subject}");
                }
            );
        } catch (\Exception $e) {
            Log::warning("Email notification failed for user {$userId}: " . $e->getMessage());
        }
    }

    public function getForUser(int $userId, int $limit = 20)
    {
        return AppNotification::forUser($userId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function getUnreadCount(int $userId): int
    {
        return AppNotification::forUser($userId)->unread()->count();
    }

    public function markAllRead(int $userId): void
    {
        AppNotification::forUser($userId)->unread()->update(['read_at' => now()]);
    }
}
