import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '@/api/sales';
import { useAuthStore } from '@/stores/authStore';
import type { SalesRepDashboard, SalesManagerDashboard } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, ShoppingCart, DollarSign, TrendingUp, Target, UserCheck, Clock, CheckCircle2 } from 'lucide-react';

type SortField = 'name' | 'orders_count' | 'orders_total' | 'commission_earned' | 'customers_count';
type SortDir = 'asc' | 'desc';

const LEAD_STAGE_COLORS: Record<string, string> = {
  new_lead: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  quoted: 'bg-purple-500',
  converted: 'bg-green-500',
  lost: 'bg-red-500',
};

function formatSAR(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
  iconBg,
  iconColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`bg-card rounded-xl shadow-sm border p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
        <div className={`${iconBg} ${iconColor} rounded-full p-3`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RepDashboardView({ data }: { data: SalesRepDashboard }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const leadStages = Object.entries(data.leads_by_stage);
  const maxLeadCount = leadStages.length > 0
    ? Math.max(...leadStages.map(([, count]) => count), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label={t('sales.my_customers')}
          value={String(data.my_customers_count)}
          iconBg="bg-blue-100 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label={t('sales.my_orders_this_month')}
          value={String(data.my_orders_count)}
          subValue={formatSAR(data.my_orders_total)}
          iconBg="bg-green-100 dark:bg-green-950/40"
          iconColor="text-green-600 dark:text-green-400"
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label={t('sales.conversion_rate')}
          value={`${data.conversion_rate.toFixed(1)}%`}
          iconBg="bg-purple-100 dark:bg-purple-950/40"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label={t('sales.total_commission_earned')}
          value={formatSAR(data.commissions.total_earned)}
          iconBg="bg-amber-100 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Commission Breakdown */}
      <Card className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('sales.commission_breakdown')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-xs text-muted-foreground">{t('sales.commission_pending')}</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{formatSAR(data.commissions.total_pending)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">{t('sales.commission_approved')}</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatSAR(data.commissions.total_approved)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-muted-foreground">{t('sales.commission_paid')}</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatSAR(data.commissions.total_paid)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/30">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-xs text-muted-foreground">{t('sales.commission_total')}</p>
              <p className="text-lg font-bold text-foreground">{formatSAR(data.commissions.total_earned)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Leads Funnel */}
      <Card className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('sales.leads_funnel')}</h3>
        {leadStages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('sales.no_leads')}</p>
        ) : (
          <div className="space-y-3">
            {leadStages.map(([stage, count]) => {
              const barColor = LEAD_STAGE_COLORS[stage] || 'bg-gray-400';
              const widthPercent = (count / maxLeadCount) * 100;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28 shrink-0 text-end">
                    {t(`sales.lead_stage_${stage}`)}
                  </span>
                  <div className="flex-1 h-8 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full rounded-full flex items-center justify-end px-3 transition-all duration-500`}
                      style={{ width: `${Math.max(widthPercent, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Orders */}
      <Card className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('sales.recent_orders')}</h3>
        {data.recent_orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('sales.no_orders')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.order_number')}</TableHead>
                  <TableHead>{t('orders.customer')}</TableHead>
                  <TableHead className="text-end">{t('orders.total')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_orders.slice(0, 10).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>
                      {isAr
                        ? (order.customer?.name_ar || order.customer?.name || '-')
                        : (order.customer?.name || '-')}
                    </TableCell>
                    <TableCell className="text-end font-medium">{formatSAR(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {isAr ? order.status_label : order.status_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ManagerDashboardView({ data }: { data: SalesManagerDashboard }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [sortField, setSortField] = useState<SortField>('orders_total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedReps = data.reps_performance.toSorted((a, b) => {
    let valA: number | string;
    let valB: number | string;

    switch (sortField) {
      case 'name':
        valA = isAr ? a.rep.name_ar : a.rep.name;
        valB = isAr ? b.rep.name_ar : b.rep.name;
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB), isAr ? 'ar' : 'en')
          : String(valB).localeCompare(String(valA), isAr ? 'ar' : 'en');
      case 'orders_count':
        valA = a.orders_count;
        valB = b.orders_count;
        break;
      case 'orders_total':
        valA = a.orders_total;
        valB = b.orders_total;
        break;
      case 'commission_earned':
        valA = a.commission_earned;
        valB = b.commission_earned;
        break;
      case 'customers_count':
        valA = a.customers_count;
        valB = b.customers_count;
        break;
      default:
        return 0;
    }
    return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label={t('sales.total_sales_this_month')}
          value={formatSAR(data.total_sales_this_month)}
          iconBg="bg-green-100 dark:bg-green-950/40"
          iconColor="text-green-600 dark:text-green-400"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label={t('sales.pending_commission_approvals')}
          value={String(data.pending_approvals_count)}
          iconBg="bg-yellow-100 dark:bg-yellow-950/40"
          iconColor="text-yellow-600 dark:text-yellow-400"
          onClick={() => navigate('/commissions')}
        />
        <MetricCard
          icon={<UserCheck className="w-5 h-5" />}
          label={t('sales.commission_payable')}
          value={formatSAR(data.commission_payable_total)}
          iconBg="bg-blue-100 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Reps Performance Table */}
      <Card className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('sales.reps_performance')}</h3>
        {sortedReps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('sales.no_reps')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    {t('sales.rep_name')}{sortIndicator('name')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground text-end"
                    onClick={() => handleSort('orders_count')}
                  >
                    {t('sales.orders_count')}{sortIndicator('orders_count')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground text-end"
                    onClick={() => handleSort('orders_total')}
                  >
                    {t('sales.orders_total')}{sortIndicator('orders_total')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground text-end"
                    onClick={() => handleSort('commission_earned')}
                  >
                    {t('sales.commission_earned')}{sortIndicator('commission_earned')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground text-end"
                    onClick={() => handleSort('customers_count')}
                  >
                    {t('sales.customers_count')}{sortIndicator('customers_count')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReps.map((rep) => (
                  <TableRow
                    key={rep.rep.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/sales/rep-performance/${rep.rep.id}`)}
                  >
                    <TableCell className="font-medium">
                      {isAr ? rep.rep.name_ar : rep.rep.name}
                    </TableCell>
                    <TableCell className="text-end">{rep.orders_count}</TableCell>
                    <TableCell className="text-end font-medium">{formatSAR(rep.orders_total)}</TableCell>
                    <TableCell className="text-end font-medium">{formatSAR(rep.commission_earned)}</TableCell>
                    <TableCell className="text-end">{rep.customers_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function SalesDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isManager =
    user?.roles?.includes('sales_manager') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('super_admin');

  const [repData, setRepData] = useState<SalesRepDashboard | null>(null);
  const [managerData, setManagerData] = useState<SalesManagerDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (isManager) {
          const { data: res } = await salesApi.getManagerDashboard();
          setManagerData(res.data);
        } else {
          const { data: res } = await salesApi.getRepDashboard();
          setRepData(res.data);
        }
      } catch {
        setError(t('common.error_loading'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isManager, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isManager ? t('sales.manager_dashboard_title') : t('sales.rep_dashboard_title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isManager ? t('sales.manager_dashboard_subtitle') : t('sales.rep_dashboard_subtitle')}
        </p>
      </div>

      {isManager && managerData ? (
        <ManagerDashboardView data={managerData} />
      ) : repData ? (
        <RepDashboardView data={repData} />
      ) : null}
    </div>
  );
}
