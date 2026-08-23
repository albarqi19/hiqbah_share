import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '@/api';
import type { InventorySummary, InventoryMovement } from '@/types';
import { Loader2, Package, Leaf, Coffee, ShoppingBag, AlertTriangle, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#06b6d4'];

export function InventoryDashboardPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, movementsRes] = await Promise.all([
          inventoryApi.summary(),
          inventoryApi.movements({ include: 'crop,staff', per_page: 10 }),
        ]);
        setSummary(summaryRes.data.data);
        const rawMovements = movementsRes.data.data ?? [];
        setRecentMovements(Array.isArray(rawMovements) ? rawMovements : []);
      } catch {
        // silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare chart data
  const cropChartData = (summary.by_crop ?? []).map((c) => ({
    name: c.serial_number,
    [t('green')]: c.green_kg,
    [t('roasted')]: c.roasted_kg,
    [t('finished_bags')]: c.finished_bags,
  }));

  const branchChartData = (summary.by_branch ?? []).map((b) => ({
    name: isAr ? b.branch_name_ar : b.branch_name,
    value: b.items_count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="w-7 h-7" />
        {t('inventory_dashboard')}
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={<Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />}
          label={t('green_coffee_stock')}
          value={`${summary.total_green_kg.toFixed(1)} kg`}
          bg="bg-green-50 dark:bg-green-950/40"
          border="border-green-200 dark:border-green-800"
        />
        <KpiCard
          icon={<Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          label={t('roasted_coffee_stock')}
          value={`${summary.total_roasted_kg.toFixed(1)} kg`}
          bg="bg-amber-50 dark:bg-amber-950/40"
          border="border-amber-200 dark:border-amber-800"
        />
        <KpiCard
          icon={<ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          label={t('finished_bags')}
          value={`${Math.round(summary.total_finished_bags)} bags`}
          bg="bg-blue-50 dark:bg-blue-950/40"
          border="border-blue-200 dark:border-blue-800"
        />
        <KpiCard
          icon={<Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          label={t('movements_today')}
          value={String(summary.movements_today)}
          bg="bg-indigo-50 dark:bg-indigo-950/40"
          border="border-indigo-200 dark:border-indigo-800"
        />
        <KpiCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          label={t('low_stock_alerts')}
          value={String(summary.low_stock_count)}
          bg={summary.low_stock_count > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-muted'}
          border={summary.low_stock_count > 0 ? 'border-red-200 dark:border-red-800' : 'border-border'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Crop */}
        {cropChartData.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">{t('stock_by_crop')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cropChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={t('green')} fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey={t('roasted')} fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stock by Branch */}
        {branchChartData.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">{t('stock_by_branch')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={branchChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {branchChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Movements */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-bold text-foreground mb-4">{t('recent_movements')}</h3>
        <div className="space-y-2">
          {recentMovements.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('no_data')}</p>
          ) : (
            recentMovements.map((mov) => (
              <div key={mov.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                {mov.direction === 'in' ? (
                  <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {isAr ? mov.movement_type_label : mov.movement_type_label_en}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mov.crop?.serial_number} &middot; {isAr ? mov.staff?.name_ar : mov.staff?.name}
                  </div>
                </div>
                <div className={`font-bold text-sm ${mov.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.direction === 'in' ? '+' : '-'}{mov.quantity}
                </div>
                <div className="text-xs text-muted-foreground/70 whitespace-nowrap">
                  {new Date(mov.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, bg, border }: {
  icon: React.ReactNode; label: string; value: string; bg: string; border: string;
}) {
  return (
    <div className={`${bg} border ${border} rounded-lg p-4`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}
