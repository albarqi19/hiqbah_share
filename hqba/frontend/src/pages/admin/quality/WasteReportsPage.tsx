import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { wasteRecordApi } from '@/api';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Trash2, SlidersHorizontal, Calendar } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

interface WasteRecord {
  id: number;
  crop_id: number;
  waste_type: string;
  weight_grams: number;
  source: string;
  notes: string | null;
  created_at: string;
  crop?: { serial_number: string; name: string; name_ar: string };
}

interface WasteSummary {
  today_grams: number;
  week_grams: number;
  month_grams: number;
  by_type: { waste_type: string; total_grams: number; count: number }[];
}

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#ec4899', '#06b6d4', '#8b5cf6'];

const wasteTypeColors: Record<string, string> = {
  roasting_loss: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  grinding_loss: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  defective: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  sampling: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  spillage: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  other: 'bg-accent text-foreground',
};

export function WasteReportsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const wasteTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      roasting_loss: { ar: 'فقد التحميص', en: 'Roasting Loss' },
      grinding_loss: { ar: 'فقد الطحن', en: 'Grinding Loss' },
      expired: { ar: 'منتهي الصلاحية', en: 'Expired' },
      defective: { ar: 'معيب', en: 'Defective' },
      sampling: { ar: 'عينات', en: 'Sampling' },
      spillage: { ar: 'انسكاب', en: 'Spillage' },
      other: { ar: 'أخرى', en: 'Other' },
    };
    return isAr ? labels[type]?.ar ?? type : labels[type]?.en ?? type;
  };

  const formatGrams = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1)} kg`;
    }
    return `${grams} g`;
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        include: 'crop',
        per_page: 25,
        page,
      };
      if (filterType) params['filter[waste_type]'] = filterType;
      if (filterDateFrom) params['filter[date_from]'] = filterDateFrom;
      if (filterDateTo) params['filter[date_to]'] = filterDateTo;

      const [recordsRes, summaryRes] = await Promise.all([
        wasteRecordApi.list(params),
        wasteRecordApi.summary(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resData = recordsRes.data as any;
      const rawRecords = resData.data?.data ?? resData.data ?? [];
      setRecords(Array.isArray(rawRecords) ? rawRecords : []);
      const meta = resData.data?.meta ?? resData.meta;
      if (meta) {
        setLastPage(meta.last_page ?? 1);
      }
      setSummary(summaryRes.data.data as unknown as WasteSummary);
    } catch {
      toast.error(isAr ? 'فشل تحميل بيانات الهدر' : 'Failed to load waste data');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterType, filterDateFrom, filterDateTo, isAr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pieData = (summary?.by_type ?? []).map((item) => ({
    name: wasteTypeLabel(item.waste_type),
    value: item.total_grams,
    count: item.count,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trash2 className="w-7 h-7" />
          {isAr ? 'تقارير الهدر' : 'Waste Reports'}
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label={isAr ? 'هدر اليوم' : 'Today'}
            value={formatGrams(summary.today_grams)}
            bg="bg-red-50 dark:bg-red-950/40"
            border="border-red-200 dark:border-red-800"
            icon={<Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />}
          />
          <SummaryCard
            label={isAr ? 'هدر الأسبوع' : 'This Week'}
            value={formatGrams(summary.week_grams)}
            bg="bg-orange-50 dark:bg-orange-950/40"
            border="border-orange-200 dark:border-orange-800"
            icon={<Calendar className="w-5 h-5 text-orange-500 dark:text-orange-400" />}
          />
          <SummaryCard
            label={isAr ? 'هدر الشهر' : 'This Month'}
            value={formatGrams(summary.month_grams)}
            bg="bg-yellow-50 dark:bg-yellow-950/40"
            border="border-yellow-200 dark:border-yellow-800"
            icon={<Calendar className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />}
          />
        </div>
      )}

      {/* Chart + Filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">
              {isAr ? 'الهدر حسب النوع' : 'Waste by Type'}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatGrams(value)}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatGrams(Number(value))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg border p-4 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {isAr ? 'تصفية' : 'Filters'}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              {isAr ? 'نوع الهدر' : 'Waste Type'}
            </label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            >
              <option value="">{isAr ? 'جميع الأنواع' : 'All types'}</option>
              {Object.keys(wasteTypeColors).map((type) => (
                <option key={type} value={type}>{wasteTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'من تاريخ' : 'From'}
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'إلى تاريخ' : 'To'}
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
          </div>
          {(filterType || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}
              className="text-xs text-primary hover:underline"
            >
              {isAr ? 'مسح التصفية' : 'Clear filters'}
            </button>
          )}
        </div>
      </div>

      {/* Waste Records Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? 'المحصول' : 'Crop'}</TableHead>
                  <TableHead>{isAr ? 'نوع الهدر' : 'Waste Type'}</TableHead>
                  <TableHead>{isAr ? 'الوزن' : 'Weight'}</TableHead>
                  <TableHead>{isAr ? 'المصدر' : 'Source'}</TableHead>
                  <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                  <TableHead>{t('created_at')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">{record.crop?.serial_number}</div>
                        <div className="text-sm">{isAr ? record.crop?.name_ar : record.crop?.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={wasteTypeColors[record.waste_type] ?? 'bg-accent text-foreground'}>
                          {wasteTypeLabel(record.waste_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {formatGrams(record.weight_grams)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.source}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {record.notes || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                          dateStyle: 'short',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 bg-background text-foreground hover:bg-muted"
              >
                {isAr ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {lastPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 bg-background text-foreground hover:bg-muted"
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, bg, border, icon }: {
  label: string; value: string; bg: string; border: string; icon: React.ReactNode;
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
