import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, Check, CheckCheck } from 'lucide-react';

interface Notification {
  id: number; type: string; title: string; title_ar: string;
  body: string | null; body_ar: string | null; link: string | null;
  read_at: string | null; created_at: string;
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try { const { data } = await notificationApi.list(); const notifs = data.data?.notifications ?? data.data ?? []; setNotifications(Array.isArray(notifs) ? notifs : []); } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: number) => {
    try { await notificationApi.markRead(id); await fetchNotifications(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await notificationApi.markAllRead(); await fetchNotifications(); } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-7 h-7" />{isAr ? 'الإشعارات' : 'Notifications'}
          {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>}
        </h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-2 text-sm text-primary hover:underline"><CheckCheck className="w-4 h-4" />{isAr ? 'قراءة الكل' : 'Mark all read'}</button>
        )}
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">{t('no_data')}</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`bg-card rounded-lg border p-4 flex items-start gap-3 ${!n.read_at ? 'border-primary/20 bg-primary/5' : ''}`}>
                <Bell className={`w-5 h-5 mt-0.5 shrink-0 ${!n.read_at ? 'text-primary' : 'text-muted-foreground/70'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{isAr ? n.title_ar : n.title}</div>
                  {(isAr ? n.body_ar : n.body) && <div className="text-xs text-muted-foreground mt-1">{isAr ? n.body_ar : n.body}</div>}
                  <div className="text-xs text-muted-foreground/70 mt-1">{new Date(n.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
                {!n.read_at && (
                  <button onClick={() => handleMarkRead(n.id)} className="text-xs text-primary hover:underline shrink-0"><Check className="w-4 h-4" /></button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
