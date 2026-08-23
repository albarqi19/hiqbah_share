import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Leaf, ShoppingCart, DollarSign, AlertTriangle, Flame, Trash2, Package, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import client from '@/api/client';

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899'];

interface DashboardData {
  kpis: {
    active_crops: number; orders_today: number; revenue_month: number;
    low_stock_count: number; roast_batches_today: number; waste_today_grams: number;
    total_inventory_items: number; pending_orders: number;
  };
  charts: {
    monthly_sales: Array<{ month: string; total: number }>;
    weekly_production: Array<{ week: string; total_kg: number; batches: number }>;
    waste_by_type: Array<{ type: string; grams: number }>;
  };
  recent_activities: Array<{ id: number; description: string; subject_type: string; causer: string; created_at: string }>;
  alerts: Array<{ type: string; message: string; severity: string }>;
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAr = i18n.language === 'ar';
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await client.get('/dashboard/admin');
        setData(res.data);
      } catch { } finally { setIsLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const { kpis, charts, recent_activities, alerts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('welcome_back')}، {isAr ? user?.name_ar : user?.name}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={<Leaf className="w-5 h-5" />} label={isAr ? 'محاصيل نشطة' : 'Active Crops'} value={String(kpis.active_crops)} bg="bg-green-50 dark:bg-green-950/40" iconColor="text-green-600 dark:text-green-400" />
        <KpiCard icon={<ShoppingCart className="w-5 h-5" />} label={isAr ? 'طلبات اليوم' : 'Orders Today'} value={String(kpis.orders_today)} bg="bg-blue-50 dark:bg-blue-950/40" iconColor="text-blue-600 dark:text-blue-400" />
        <KpiCard icon={<DollarSign className="w-5 h-5" />} label={isAr ? 'إيرادات الشهر' : 'Monthly Revenue'} value={`${kpis.revenue_month.toFixed(0)} SAR`} bg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5" />} label={isAr ? 'مخزون منخفض' : 'Low Stock'} value={String(kpis.low_stock_count)} bg={kpis.low_stock_count > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-muted'} iconColor={kpis.low_stock_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground/70'} />
        <KpiCard icon={<Flame className="w-5 h-5" />} label={isAr ? 'تحميص اليوم' : 'Roast Today'} value={String(kpis.roast_batches_today)} bg="bg-orange-50 dark:bg-orange-950/40" iconColor="text-orange-600 dark:text-orange-400" />
        <KpiCard icon={<Trash2 className="w-5 h-5" />} label={isAr ? 'هدر اليوم' : 'Waste Today'} value={`${(kpis.waste_today_grams / 1000).toFixed(1)} kg`} bg="bg-yellow-50 dark:bg-yellow-950/40" iconColor="text-yellow-600 dark:text-yellow-400" />
        <KpiCard icon={<Package className="w-5 h-5" />} label={isAr ? 'عناصر المخزون' : 'Stock Items'} value={String(kpis.total_inventory_items)} bg="bg-indigo-50 dark:bg-indigo-950/40" iconColor="text-indigo-600 dark:text-indigo-400" />
        <KpiCard icon={<Clock className="w-5 h-5" />} label={isAr ? 'طلبات معلقة' : 'Pending Orders'} value={String(kpis.pending_orders)} bg="bg-amber-50 dark:bg-amber-950/40" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.waste_by_type.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">{isAr ? 'الهدر حسب النوع' : 'Waste by Type'}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={charts.waste_by_type.map(w => ({ name: w.type, value: w.grams }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${(value / 1000).toFixed(1)}kg`}>
                  {charts.waste_by_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {charts.monthly_sales.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">{isAr ? 'المبيعات الشهرية' : 'Monthly Sales'}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.monthly_sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Alerts + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-bold text-foreground mb-3">{isAr ? 'التنبيهات' : 'Alerts'}</h3>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground/70 text-sm text-center py-4">{isAr ? 'لا توجد تنبيهات' : 'No alerts'}</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${a.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {a.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-bold text-foreground mb-3">{isAr ? 'آخر النشاطات' : 'Recent Activities'}</h3>
          {recent_activities.length === 0 ? (
            <p className="text-muted-foreground/70 text-sm text-center py-4">{isAr ? 'لا توجد نشاطات' : 'No activities'}</p>
          ) : (
            <div className="space-y-2">
              {recent_activities.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm">{a.description}</span>
                    <div className="text-xs text-muted-foreground/70">{a.causer} — {a.subject_type}</div>
                  </div>
                  <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, bg, iconColor }: { icon: React.ReactNode; label: string; value: string; bg: string; iconColor: string }) {
  return (
    <div className={`${bg} border border-border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
