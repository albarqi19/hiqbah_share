import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, Star, MessageSquareWarning, Trash2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import client from '@/api/client';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];

interface QualityData {
  batch_pass_rate: number;
  average_cupping_score: number;
  total_complaints: number;
  total_waste_kg: number;
  roast_consistency: number;
  batches_by_status: Array<{ status: string; count: number }>;
  waste_by_type: Array<{ waste_type: string; total_grams: number }>;
  complaints_by_month: Array<{ month: string; count: number }>;
  cupping_scores_trend: Array<{ id: number; score: number; date: string }>;
}

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  queued: { en: 'Queued', ar: 'في الانتظار' },
  roasting: { en: 'Roasting', ar: 'تحميص' },
  cooling: { en: 'Cooling', ar: 'تبريد' },
  pending_qc: { en: 'Pending QC', ar: 'بانتظار الفحص' },
  approved: { en: 'Approved', ar: 'معتمد' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
};

const WASTE_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  roast_loss: { en: 'Roast Loss', ar: 'فاقد التحميص' },
  calibration_waste: { en: 'Calibration', ar: 'معايرة' },
  cupping_waste: { en: 'Cupping', ar: 'تذوق' },
  defect_waste: { en: 'Defects', ar: 'عيوب' },
  packaging_waste: { en: 'Packaging', ar: 'تعبئة' },
  expired: { en: 'Expired', ar: 'منتهي' },
};

export function QualityDashboardPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [data, setData] = useState<QualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await client.get('/dashboard/quality');
        setData(res.data);
      } catch {
        // silently handle
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const batchChartData = data.batches_by_status.map((b) => ({
    name: isAr
      ? (STATUS_LABELS[b.status]?.ar || b.status)
      : (STATUS_LABELS[b.status]?.en || b.status),
    value: b.count,
  }));

  const wasteChartData = data.waste_by_type.map((w) => ({
    name: isAr
      ? (WASTE_TYPE_LABELS[w.waste_type]?.ar || w.waste_type)
      : (WASTE_TYPE_LABELS[w.waste_type]?.en || w.waste_type),
    value: Math.round(w.total_grams),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Star className="w-7 h-7" />
        {isAr ? 'لوحة الجودة' : 'Quality Intelligence Dashboard'}
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label={isAr ? 'نسبة اعتماد الدفعات' : 'Batch Pass Rate'}
          value={`${data.batch_pass_rate}%`}
          bg="bg-green-50 dark:bg-green-950/40"
          iconColor="text-green-600 dark:text-green-400"
        />
        <KpiCard
          icon={<Star className="w-5 h-5" />}
          label={isAr ? 'متوسط درجة التذوق' : 'Avg Cupping Score'}
          value={String(data.average_cupping_score)}
          bg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={<MessageSquareWarning className="w-5 h-5" />}
          label={isAr ? 'شكاوى الشهر' : 'Complaints (Month)'}
          value={String(data.total_complaints)}
          bg={data.total_complaints > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-muted'}
          iconColor={data.total_complaints > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground/70'}
        />
        <KpiCard
          icon={<Trash2 className="w-5 h-5" />}
          label={isAr ? 'إجمالي الهدر (كجم)' : 'Total Waste (kg)'}
          value={String(data.total_waste_kg)}
          bg="bg-yellow-50 dark:bg-yellow-950/40"
          iconColor="text-yellow-600 dark:text-yellow-400"
        />
      </div>

      {/* Roast Consistency */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {isAr ? 'ثبات التحميص (الانحراف المعياري لنسبة الفاقد)' : 'Roast Consistency (Std Dev of Loss %)'}
          </span>
          <span className="text-lg font-bold text-foreground">{data.roast_consistency}%</span>
          {data.roast_consistency <= 1 && (
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded">
              {isAr ? 'ممتاز' : 'Excellent'}
            </span>
          )}
          {data.roast_consistency > 1 && data.roast_consistency <= 2 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              {isAr ? 'جيد' : 'Good'}
            </span>
          )}
          {data.roast_consistency > 2 && (
            <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
              {isAr ? 'يحتاج تحسين' : 'Needs Improvement'}
            </span>
          )}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batches by Status - Pie */}
        {batchChartData.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">
              {isAr ? 'الدفعات حسب الحالة' : 'Batches by Status'}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={batchChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {batchChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Waste by Type - Bar */}
        {wasteChartData.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">
              {isAr ? 'الهدر حسب النوع' : 'Waste by Type'}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={wasteChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value)} g`, isAr ? 'هدر' : 'Waste']} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cupping Score Trend - Line */}
        {data.cupping_scores_trend.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">
              {isAr ? 'مؤشر درجات التذوق' : 'Cupping Score Trend'}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.cupping_scores_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Complaints by Month - Line */}
        {data.complaints_by_month.length > 0 && (
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-bold text-foreground mb-4">
              {isAr ? 'الشكاوى حسب الشهر' : 'Complaints by Month'}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.complaints_by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, bg, iconColor }: {
  icon: React.ReactNode; label: string; value: string; bg: string; iconColor: string;
}) {
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
