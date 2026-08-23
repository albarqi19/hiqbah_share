import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calibrationApi } from '@/api/calibration';
import { branchApi } from '@/api/branches';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crosshair, Target, Trash2, BarChart3, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CalibrationSession {
  id: number;
  branch_id: number;
  status: string;
  status_label: string;
  status_label_en: string;
  total_shots: number;
  total_dose_grams: number;
  total_waste_grams: number;
  branch?: { id: number; name: string; name_ar: string };
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  barista?: { id: number; name: string; name_ar: string };
  created_at: string;
}

interface Branch {
  id: number;
  name: string;
  name_ar: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function CalibrationDashboardPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [sessions, setSessions] = useState<CalibrationSession[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [wasteByBranch, setWasteByBranch] = useState<Array<{ name: string; waste: number }>>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        include: 'branch,crop,barista',
        per_page: 50,
      };
      if (branchFilter) params['filter[branch_id]'] = branchFilter;

      const [sessionsRes, branchesRes] = await Promise.all([
        calibrationApi.list(params),
        branchApi.list({ per_page: 100 }),
      ]);

      const rawSessions = sessionsRes.data.data ?? [];
      setSessions(Array.isArray(rawSessions) ? rawSessions : []);
      const rawBranches = branchesRes.data.data ?? [];
      setBranches(Array.isArray(rawBranches) ? rawBranches : []);

      // Calculate waste by branch for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const branchWasteMap = new Map<string, number>();
      for (const s of rawSessions) {
        const sessionDate = new Date(s.created_at);
        if (sessionDate >= sevenDaysAgo && s.branch) {
          const branchName = isAr ? s.branch.name_ar : s.branch.name;
          branchWasteMap.set(branchName, (branchWasteMap.get(branchName) || 0) + s.total_waste_grams);
        }
      }
      setWasteByBranch(
        Array.from(branchWasteMap.entries()).map(([name, waste]) => ({ name, waste: Math.round(waste) }))
      );
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter by date range on client side
  const filteredSessions = sessions.filter((s) => {
    if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  // Today's sessions
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.created_at.slice(0, 10) === today);
  const totalSessionsToday = todaySessions.length;
  const totalShotsToday = todaySessions.reduce((sum, s) => sum + (s.total_shots || 0), 0);
  const totalWasteToday = todaySessions.reduce((sum, s) => sum + (s.total_waste_grams || 0), 0);
  const avgShotsPerSession = totalSessionsToday > 0
    ? (totalShotsToday / totalSessionsToday).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Crosshair className="w-7 h-7" />
        {isAr ? 'لوحة المعايرة' : 'Calibration Dashboard'}
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={<Target className="w-5 h-5" />}
          label={isAr ? 'جلسات اليوم' : 'Sessions Today'}
          value={String(totalSessionsToday)}
          bg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={<Crosshair className="w-5 h-5" />}
          label={isAr ? 'محاولات اليوم' : 'Shots Today'}
          value={String(totalShotsToday)}
          bg="bg-indigo-50 dark:bg-indigo-950/40"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <KpiCard
          icon={<Trash2 className="w-5 h-5" />}
          label={isAr ? 'هدر اليوم (جم)' : 'Waste Today (g)'}
          value={String(Math.round(totalWasteToday))}
          bg="bg-yellow-50 dark:bg-yellow-950/40"
          iconColor="text-yellow-600 dark:text-yellow-400"
        />
        <KpiCard
          icon={<BarChart3 className="w-5 h-5" />}
          label={isAr ? 'متوسط المحاولات' : 'Avg Shots/Session'}
          value={avgShotsPerSession}
          bg="bg-green-50 dark:bg-green-950/40"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground/70" />
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">{isAr ? 'كل الفروع' : 'All Branches'}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {isAr ? b.name_ar : b.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder={isAr ? 'من' : 'From'}
          />
          <input
            type="date"
            className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder={isAr ? 'إلى' : 'To'}
          />
        </div>
      </div>

      {/* Bar Chart: Waste by Branch */}
      {wasteByBranch.length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-bold text-foreground mb-4">
            {isAr ? 'الهدر حسب الفرع (آخر 7 أيام)' : 'Waste by Branch (Last 7 Days)'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={wasteByBranch}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => [typeof value === 'number' ? `${value} g` : String(value), isAr ? 'هدر' : 'Waste']} />
              <Bar dataKey="waste" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-bold text-foreground mb-4">
          {isAr ? 'جلسات المعايرة الأخيرة' : 'Recent Calibration Sessions'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-start py-2 px-2">{isAr ? 'الباريستا' : 'Barista'}</th>
                <th className="text-start py-2 px-2">{isAr ? 'الفرع' : 'Branch'}</th>
                <th className="text-start py-2 px-2">{isAr ? 'المحصول' : 'Crop'}</th>
                <th className="text-center py-2 px-2">{isAr ? 'المحاولات' : 'Shots'}</th>
                <th className="text-center py-2 px-2">{isAr ? 'الهدر (جم)' : 'Waste (g)'}</th>
                <th className="text-center py-2 px-2">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-start py-2 px-2">{isAr ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground/70">
                    {isAr ? 'لا توجد جلسات' : 'No sessions found'}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted">
                    <td className="py-2 px-2">
                      {s.barista ? (isAr ? s.barista.name_ar : s.barista.name) : '-'}
                    </td>
                    <td className="py-2 px-2">
                      {s.branch ? (isAr ? s.branch.name_ar : s.branch.name) : '-'}
                    </td>
                    <td className="py-2 px-2 font-mono text-xs">
                      {s.crop?.serial_number || '-'}
                    </td>
                    <td className="py-2 px-2 text-center font-medium">{s.total_shots || 0}</td>
                    <td className="py-2 px-2 text-center">{Math.round(s.total_waste_grams || 0)}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge className={STATUS_COLORS[s.status] || 'bg-accent text-foreground'}>
                        {isAr ? s.status_label : s.status_label_en}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
