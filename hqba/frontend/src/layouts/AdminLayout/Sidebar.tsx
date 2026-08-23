import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Users,
  Settings,
  LogOut,
  Coffee,
  Truck,
  ClipboardList,
  Leaf,
  BookOpen,
  Columns3,
  Package,
  History,
  Bell,
  BarChart3,
  PackageCheck,
  UserCheck,
  ShoppingCart,
  ArrowLeftRight,
  MessageSquareWarning,
  ScrollText,
  ClipboardCheck,
  Target,
  Trash2,
  Shield,
  SprayCan,
  MessageSquare,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';

interface NavItemConfig {
  path: string;
  icon: React.ElementType;
  label: string;
  permission?: string;
  anyOf?: string[];
}

const coffeeItems: NavItemConfig[] = [
  { path: '/suppliers', icon: Truck, label: 'suppliers', permission: 'suppliers.view' },
  { path: '/purchase-orders', icon: ClipboardList, label: 'purchase_orders', permission: 'purchase_orders.view' },
  { path: '/crops', icon: Leaf, label: 'crops', permission: 'crops.view' },
  { path: '/crops/board', icon: Columns3, label: 'status_board', permission: 'crops.view' },
  { path: '/recipes', icon: BookOpen, label: 'recipes_menu', permission: 'recipes.view' },
];

const productionItems: NavItemConfig[] = [
  { path: '/packaging', icon: PackageCheck, label: 'packaging', permission: 'production.packaging' },
  { path: '/customers', icon: UserCheck, label: 'customers', permission: 'orders.view' },
  { path: '/orders', icon: ShoppingCart, label: 'orders_menu', permission: 'orders.view' },
  { path: '/transfers', icon: ArrowLeftRight, label: 'transfers', permission: 'inventory.view' },
];

const inventoryItems: NavItemConfig[] = [
  { path: '/inventory', icon: Package, label: 'inventory', permission: 'inventory.view' },
  { path: '/inventory/movements', icon: History, label: 'inventory_movements', permission: 'inventory.view' },
  { path: '/inventory/alerts', icon: Bell, label: 'inventory_alerts', permission: 'inventory.view' },
  { path: '/inventory/dashboard', icon: BarChart3, label: 'inventory_dashboard', permission: 'inventory.view' },
  { path: '/inventory/audits', icon: ClipboardCheck, label: 'audits', permission: 'inventory.audit' },
  { path: '/inventory/accuracy', icon: Scale, label: 'accuracy', permission: 'inventory.audit' },
];

const qualityItems: NavItemConfig[] = [
  { path: '/quality', icon: Shield, label: 'quality_dashboard', permission: 'reports.view' },
  { path: '/calibration', icon: Target, label: 'calibration', permission: 'calibration.view' },
  { path: '/cleaning', icon: SprayCan, label: 'cleaning_schedules', permission: 'cleaning.perform' },
  { path: '/waste-reports', icon: Trash2, label: 'waste_reports', permission: 'quality.waste_view' },
  { path: '/market-feedback', icon: MessageSquare, label: 'market_feedback', permission: 'quality.complaints_view' },
  { path: '/complaints', icon: MessageSquareWarning, label: 'complaints_menu', permission: 'quality.complaints_view' },
];

const systemItems: NavItemConfig[] = [
  { path: '/notifications', icon: Bell, label: 'notifications_menu' },
  { path: '/activity-log', icon: ScrollText, label: 'activity_log', permission: 'reports.view' },
];

const adminItems: NavItemConfig[] = [
  { path: '/branches', icon: Building2, label: 'branches', permission: 'branches.view' },
  { path: '/equipment', icon: Wrench, label: 'equipment', permission: 'equipment.view' },
  { path: '/users', icon: Users, label: 'users', permission: 'users.view' },
  { path: '/roles', icon: ShieldCheck, label: 'roles_management', permission: 'roles.view' },
  { path: '/settings', icon: Settings, label: 'settings', permission: 'settings.view' },
];

function NavItem({
  path,
  icon: Icon,
  label,
  t,
}: {
  path: string;
  icon: React.ElementType;
  label: string;
  t: (key: string) => string;
}) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-sidebar-active text-white font-medium'
            : 'text-muted-foreground/70 hover:bg-sidebar-hover hover:text-white',
        )
      }
    >
      <Icon className="w-5 h-5" />
      <span>{t(label)}</span>
    </NavLink>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function useAllowedItems(items: NavItemConfig[]): NavItemConfig[] {
  const { has, hasAny } = usePermission();
  return items.filter((item) => {
    if (item.anyOf?.length) return hasAny(item.anyOf);
    if (item.permission) return has(item.permission);
    return true;
  });
}

function Section({ label, items, t }: { label: string; items: NavItemConfig[]; t: (key: string) => string }) {
  const allowed = useAllowedItems(items);
  if (!allowed.length) return null;
  return (
    <>
      <SectionLabel label={t(label)} />
      {allowed.map((item) => (
        <NavItem key={item.path} path={item.path} icon={item.icon} label={item.label} t={t} />
      ))}
    </>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col min-h-screen shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 shrink-0">
        <Coffee className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold tracking-tight">{t('app_name')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        <NavItem path="/" icon={LayoutDashboard} label="dashboard" t={t} />

        <Section label="coffee_lifecycle" items={coffeeItems} t={t} />
        <Section label="production" items={productionItems} t={t} />
        <Section label="inventory" items={inventoryItems} t={t} />
        <Section label="quality_and_monitoring" items={qualityItems} t={t} />
        <Section label="system" items={systemItems} t={t} />
        <Section label="administration" items={adminItems} t={t} />
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/70 hover:bg-sidebar-hover hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
