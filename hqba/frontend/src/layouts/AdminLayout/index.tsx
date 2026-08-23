import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DirectionProvider } from '@/components/ui/direction';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';

export function AdminLayout() {
  const { i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <DirectionProvider direction={dir}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  );
}
