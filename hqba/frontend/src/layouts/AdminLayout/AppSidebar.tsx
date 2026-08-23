import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronDown,
  User,
  Bean,
  Factory,
  Warehouse,
  ShieldCheck,
  Monitor,
  SlidersHorizontal,
  DollarSign,
  Tag,
  Percent,
  Calculator,
  Handshake,
  UserPlus,
  Receipt,
  Gavel,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  path: string;
  icon: LucideIcon;
  label: string;
  permission?: string;
};

type NavSection = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
};

const sections: NavSection[] = [
  {
    label: 'coffee_lifecycle',
    icon: Bean,
    defaultOpen: true,
    items: [
      { path: '/suppliers', icon: Truck, label: 'suppliers', permission: 'suppliers.view' },
      { path: '/purchase-orders', icon: ClipboardList, label: 'purchase_orders', permission: 'purchase_orders.view' },
      { path: '/crops', icon: Leaf, label: 'crops', permission: 'crops.view' },
      { path: '/crops/board', icon: Columns3, label: 'status_board', permission: 'crops.view' },
      { path: '/recipes', icon: BookOpen, label: 'recipes_menu', permission: 'recipes.view' },
    ],
  },
  {
    label: 'production',
    icon: Factory,
    defaultOpen: true,
    items: [
      { path: '/packaging', icon: PackageCheck, label: 'packaging', permission: 'production.packaging' },
      { path: '/customers', icon: UserCheck, label: 'customers', permission: 'orders.view' },
      { path: '/orders', icon: ShoppingCart, label: 'orders_menu', permission: 'orders.view' },
      { path: '/transfers', icon: ArrowLeftRight, label: 'transfers', permission: 'inventory.view' },
    ],
  },
  {
    label: 'sales_section',
    icon: Handshake,
    defaultOpen: true,
    items: [
      { path: '/sales/dashboard', icon: TrendingUp, label: 'sales_dashboard', permission: 'sales.view' },
      { path: '/leads', icon: UserPlus, label: 'leads', permission: 'leads.view' },
      { path: '/commissions', icon: Receipt, label: 'commissions', permission: 'commissions.view' },
      { path: '/commission-rules', icon: Gavel, label: 'commission_rules', permission: 'commissions.view' },
    ],
  },
  {
    label: 'pricing_section',
    icon: DollarSign,
    items: [
      { path: '/price-lists', icon: Tag, label: 'price_lists', permission: 'pricing.view' },
      { path: '/discounts', icon: Percent, label: 'discounts', permission: 'pricing.view' },
      { path: '/pricing/simulator', icon: Calculator, label: 'profit_simulator', permission: 'pricing.manage' },
      { path: '/pricing/change-log', icon: History, label: 'price_change_log', permission: 'pricing.view' },
    ],
  },
  {
    label: 'inventory',
    icon: Warehouse,
    items: [
      { path: '/inventory', icon: Package, label: 'inventory', permission: 'inventory.view' },
      { path: '/inventory/movements', icon: History, label: 'inventory_movements', permission: 'inventory.view' },
      { path: '/inventory/alerts', icon: Bell, label: 'inventory_alerts', permission: 'inventory.view' },
      { path: '/inventory/dashboard', icon: BarChart3, label: 'inventory_dashboard', permission: 'inventory.view' },
      { path: '/inventory/audits', icon: ClipboardCheck, label: 'audits', permission: 'inventory.audit' },
      { path: '/inventory/accuracy', icon: Scale, label: 'accuracy', permission: 'inventory.audit' },
    ],
  },
  {
    label: 'quality_and_monitoring',
    icon: ShieldCheck,
    items: [
      { path: '/quality', icon: Shield, label: 'quality_dashboard', permission: 'reports.view' },
      { path: '/calibration', icon: Target, label: 'calibration', permission: 'calibration.view' },
      { path: '/cleaning', icon: SprayCan, label: 'cleaning_schedules', permission: 'cleaning.perform' },
      { path: '/waste-reports', icon: Trash2, label: 'waste_reports', permission: 'quality.waste_view' },
      { path: '/market-feedback', icon: MessageSquare, label: 'market_feedback', permission: 'quality.complaints_view' },
      { path: '/complaints', icon: MessageSquareWarning, label: 'complaints_menu', permission: 'quality.complaints_view' },
    ],
  },
  {
    label: 'system',
    icon: Monitor,
    items: [
      { path: '/notifications', icon: Bell, label: 'notifications_menu' },
      { path: '/activity-log', icon: ScrollText, label: 'activity_log', permission: 'reports.view' },
    ],
  },
  {
    label: 'administration',
    icon: SlidersHorizontal,
    items: [
      { path: '/branches', icon: Building2, label: 'branches', permission: 'branches.view' },
      { path: '/equipment', icon: Wrench, label: 'equipment', permission: 'equipment.view' },
      { path: '/users', icon: Users, label: 'users', permission: 'users.view' },
      { path: '/roles', icon: ShieldCheck, label: 'roles_management', permission: 'roles.view' },
      { path: '/whatsapp', icon: MessageSquare, label: 'whatsapp' },
      { path: '/settings', icon: Settings, label: 'settings', permission: 'settings.view' },
    ],
  },
];

function NavMenuItem({ item, t }: { item: NavItem; t: (key: string) => string }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={t(item.label)}
        render={<NavLink to={item.path} end={item.path === '/'} />}
        className={isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium' : ''}
      >
        <item.icon />
        <span>{t(item.label)}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function CollapsibleSection({ section, t }: { section: NavSection; t: (key: string) => string }) {
  const location = useLocation();
  const { has } = usePermission();

  const allowedItems = section.items.filter((item) => !item.permission || has(item.permission));
  if (allowedItems.length === 0) return null;

  const hasActiveChild = allowedItems.some((item) => location.pathname === item.path);

  return (
    <Collapsible defaultOpen={section.defaultOpen || hasActiveChild} className="group/collapsible">
      <SidebarGroup className="py-0">
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="cursor-pointer text-sidebar-foreground/60 uppercase tracking-wider font-bold text-xs hover:text-sidebar-foreground/80 transition-colors gap-2"
        >
          <section.icon className="size-4 shrink-0" />
          {t(section.label)}
          <ChevronDown className="ms-auto size-3.5 transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-180" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedItems.map((item) => (
                <NavMenuItem key={item.path} item={item} t={t} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const side = i18n.language === 'ar' ? 'right' : 'left';
  const isAr = i18n.language === 'ar';

  return (
    <Sidebar side={side} collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Coffee className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-bold">{t('app_name')}</span>
                <span className="text-xs text-sidebar-foreground/60">{t('coffee_roastery')}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="pt-1 overflow-x-hidden">
        {/* Dashboard - standalone */}
        <SidebarGroup className="pb-0">
          <SidebarMenu>
            <NavMenuItem item={{ path: '/', icon: LayoutDashboard, label: 'dashboard' }} t={t} />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="opacity-30 my-1" />

        {/* Collapsible Sections */}
        {sections.map((section) => (
          <CollapsibleSection key={section.label} section={section} t={t} />
        ))}
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {/* User Info */}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary">
                <User className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none min-w-0">
                <span className="text-sm font-medium truncate">
                  {isAr ? user?.name_ar : user?.name}
                </span>
                <span className="text-xs text-sidebar-foreground/50 truncate">
                  {user?.roles?.[0]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              tooltip={t('logout')}
            >
              <LogOut />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
