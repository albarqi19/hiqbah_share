import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { LogOut, Coffee } from 'lucide-react';

export function StationLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      {/* Station Header */}
      <header className="h-14 bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Coffee className="w-6 h-6 text-primary" />
          <span className="font-bold">{t('app_name')}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground/50">{user?.name_ar}</span>
          <button
            onClick={() => logout()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Station Content - fullscreen, touch-optimized */}
      <main className="flex-1 p-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
