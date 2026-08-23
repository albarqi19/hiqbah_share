<?php

namespace App\Core\Controllers;

use App\Core\Models\AppNotification;
use App\Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function __construct(protected NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getForUser(auth()->id());
        $unreadCount = $this->notificationService->getUnreadCount(auth()->id());

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markRead(string $id): JsonResponse
    {
        $notification = AppNotification::findOrFail($id);
        $notification->markAsRead();

        return $this->success(null, 'Marked as read');
    }

    public function markAllRead(): JsonResponse
    {
        $this->notificationService->markAllRead(auth()->id());

        return $this->success(null, 'All marked as read');
    }
}
