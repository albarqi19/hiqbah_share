import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { notificationApi } from '@/api/notifications';
import type { AppNotification } from '@/api/notifications';
import { Bell, Globe, User, Check, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
export function Header() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAr = i18n.language === 'ar';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationApi.list();
      const result = data.data;
      setNotifications(result.notifications);
      setUnreadCount(result.unread_count);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.read_at) {
      await notificationApi.markRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item))
      );
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? '\u0627\u0644\u0622\u0646' : 'now';
    if (mins < 60) return isAr ? `${mins} \u062F` : `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isAr ? `${hours} \u0633` : `${hours}h`;
    const days = Math.floor(hours / 24);
    return isAr ? `${days} \u064A` : `${days}d`;
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur-sm px-4 sticky top-0 z-10">
      <SidebarTrigger className="-ms-2" />
      <Separator orientation="vertical" className="me-2 h-4 bg-border/50" />

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="font-semibold">{isAr ? '\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A' : 'Notifications'}</span>
                {unreadCount > 0 && (
                  <button
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={handleMarkAllRead}
                  >
                    <Check className="size-3" />
                    {isAr ? '\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0643\u0644' : 'Mark all read'}
                  </button>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {isAr ? '\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A' : 'No notifications'}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex w-full items-start gap-2.5">
                    {!n.read_at && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary animate-pulse" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${n.read_at ? 'text-muted-foreground' : 'font-medium'}`}>
                        {isAr ? n.title_ar : n.title}
                      </p>
                      {(isAr ? n.body_ar : n.body) && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                          {isAr ? n.body_ar : n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-1 font-medium">
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-transform dark:rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLang}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Globe className="size-4" />
          <span className="text-xs font-medium">{i18n.language === 'ar' ? 'EN' : '\u0639\u0631\u0628\u064A'}</span>
        </Button>

        {/* User Info */}
        <Separator orientation="vertical" className="mx-1.5 h-4 bg-border/50" />
        <div className="flex items-center gap-2.5 text-sm">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <User className="size-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium leading-tight text-foreground">
              {i18n.language === 'ar' ? user?.name_ar : user?.name}
            </p>
            <p className="text-[11px] text-muted-foreground/70">{user?.roles?.[0]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
