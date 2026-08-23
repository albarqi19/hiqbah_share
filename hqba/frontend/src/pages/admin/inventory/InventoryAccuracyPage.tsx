import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '@/api/inventory';
import { auditApi } from '@/api/audits';
import { wasteRecordApi } from '@/api/wasteRecords';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Leaf, Coffee, ShoppingBag, DollarSign,
  ClipboardCheck, Trash2,
} from 'lucide-react';

interface ValuationItem {
  id: number;
  item_type: string;
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  branch?: { id: number; name: string; name_ar: string };
  quantity: number;
  cost_per_unit: number;
  total_value: number;
}

interface AuditRecord {
  id: number;
  branch?: { id: number; name: string; name_ar: string };
  audit_type: string;
  status: string;
  total_items: number;
  counted_items: number;
  variance_count: number;
  created_at: string;
}

interface WasteRecord {
  id: number;
  crop?: { serial_number: string };
  waste_type: string;
  weight_grams: number;
  reason: string | null;
  created_at: string;
}

interface SummaryData {
  total_green_kg: number;
  total_roasted_kg: number;
  total_finished_bags: number;
}

const ITEM_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  green: { en: 'Green', ar: 'أخضر' },
  roasted: { en: 'Roasted', ar: 'محمص' },
  finished: { en: 'Finished', ar: 'منتج' },
};

const AUDIT_STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  closed: 'bg-accent text-foreground',
};

export function InventoryAccuracyPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [valuation, setValuation] = useState<ValuationItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [calibrationWaste, setCalibrationWaste] = useState<WasteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, valuationRes, auditsRes, wasteRes] = await Promise.all([
          inventoryApi.summary(),
          inventoryApi.valuation(),
          auditApi.list({ per_page: 10 }),
          wasteRecordApi.list({ 'filter[waste_type]': 'calibration_waste', per_page: 10 }),
        ]);

        setSummary(summaryRes.data.data);

        const valData = valuationRes.data.data;
        if (Array.isArray(valData)) {
          setValuation(valData);
          setTotalValue(valData.reduce((s: number, v: ValuationItem) => s + (v.total_value || 0), 0));
        } else if (valData && typeof valData === 'object') {
          const items = (valData as unknown as Record<string, unknown>).items as ValuationItem[] | undefined;
          const total = (valData as unknown as Record<string, unknown>).total_value as number | undefined;
          setValuation(items || []);
          setTotalValue(total || 0);
        }

        const auditData = auditsRes.data.data;
        setAudits(Array.isArray(auditData) ? auditData : []);

        const wasteData = wasteRes.data.data;
        setCalibrationWaste(Array.isArray(wasteData) ? wasteData : []);
      } catch {
        // silently handle
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <ClipboardCheck className="w-7 h-7" />
        {isAr ? 'دقة المخزون' : 'Inventory Accuracy'}
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={<Leaf className="w-5 h-5" />}
          label={isAr ? 'بن أخضر (كجم)' : 'Green Coffee (kg)'}
          value={`${summary.total_green_kg.toFixed(1)}`}
          bg="bg-green-50 dark:bg-green-950/40"
          iconColor="text-green-600 dark:text-green-400"
        />
        <KpiCard
          icon={<Coffee className="w-5 h-5" />}
          label={isAr ? 'بن محمص (كجم)' : 'Roasted Coffee (kg)'}
          value={`${summary.total_roasted_kg.toFixed(1)}`}
          bg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label={isAr ? 'منتجات جاهزة' : 'Finished Bags'}
          value={String(Math.round(summary.total_finished_bags))}
          bg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label={isAr ? 'قيمة المخزون (ر.س)' : 'Inventory Value (SAR)'}
          value={totalValue.toLocaleString(isAr ? 'ar-SA' : 'en-US', { maximumFractionDigits: 0 })}
          bg="bg-indigo-50 dark:bg-indigo-950/40"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
      </div>

      {/* Valuation Table */}
      {valuation.length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-bold text-foreground mb-4">
            {isAr ? 'تقييم المخزون' : 'Inventory Valuation'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-start py-2 px-2">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="text-start py-2 px-2">{isAr ? 'المحصول' : 'Crop'}</th>
                  <th className="text-start py-2 px-2">{isAr ? 'الفرع' : 'Branch'}</th>
                  <th className="text-end py-2 px-2">{isAr ? 'الكمية' : 'Quantity'}</th>
                  <th className="text-end py-2 px-2">{isAr ? 'تكلفة الوحدة' : 'Cost/Unit'}</th>
                  <th className="text-end py-2 px-2">{isAr ? 'القيمة' : 'Total Value'}</th>
                </tr>
              </thead>
              <tbody>
                {valuation.map((v) => (
                  <tr key={v.id} className="border-b border-border hover:bg-muted">
                    <td className="py-2 px-2">
                      <Badge className="bg-accent text-foreground">
                        {isAr
                          ? (ITEM_TYPE_LABELS[v.item_type]?.ar || v.item_type)
                          : (ITEM_TYPE_LABELS[v.item_type]?.en || v.item_type)}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 font-mono text-xs">{v.crop?.serial_number || '-'}</td>
                    <td className="py-2 px-2">
                      {v.branch ? (isAr ? v.branch.name_ar : v.branch.name) : '-'}
                    </td>
                    <td className="py-2 px-2 text-end font-medium">{v.quantity}</td>
                    <td className="py-2 px-2 text-end">{v.cost_per_unit?.toFixed(2) || '-'}</td>
                    <td className="py-2 px-2 text-end font-medium">
                      {(v.total_value || 0).toLocaleString(isAr ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit History */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          {isAr ? 'سجل الجرد' : 'Audit History'}
        </h3>
        {audits.length === 0 ? (
          <p className="text-muted-foreground/70 text-sm text-center py-6">
            {isAr ? 'لا توجد عمليات جرد' : 'No audits found'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-start py-2 px-2">#</th>
                  <th className="text-start py-2 px-2">{isAr ? 'الفرع' : 'Branch'}</th>
                  <th className="text-start py-2 px-2">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="text-center py-2 px-2">{isAr ? 'العناصر' : 'Items'}</th>
                  <th className="text-center py-2 px-2">{isAr ? 'تم عدها' : 'Counted'}</th>
                  <th className="text-center py-2 px-2">{isAr ? 'الفروقات' : 'Variance'}</th>
                  <th className="text-center py-2 px-2">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="text-start py-2 px-2">{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id} className="border-b border-border hover:bg-muted">
                    <td className="py-2 px-2 text-muted-foreground/70">{a.id}</td>
                    <td className="py-2 px-2">
                      {a.branch ? (isAr ? a.branch.name_ar : a.branch.name) : '-'}
                    </td>
                    <td className="py-2 px-2">{a.audit_type || '-'}</td>
                    <td className="py-2 px-2 text-center">{a.total_items || 0}</td>
                    <td className="py-2 px-2 text-center">{a.counted_items || 0}</td>
                    <td className="py-2 px-2 text-center">
                      {a.variance_count !== undefined && a.variance_count > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">{a.variance_count}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Badge className={AUDIT_STATUS_COLORS[a.status] || 'bg-accent text-foreground'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calibration Waste */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-yellow-600" />
          {isAr ? 'هدر المعايرة الأخير' : 'Recent Calibration Waste'}
        </h3>
        {calibrationWaste.length === 0 ? (
          <p className="text-muted-foreground/70 text-sm text-center py-6">
            {isAr ? 'لا توجد سجلات هدر' : 'No calibration waste records'}
          </p>
        ) : (
          <div className="space-y-2">
            {calibrationWaste.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-sm font-medium">{w.reason || '-'}</span>
                  <div className="text-xs text-muted-foreground/70">
                    {w.crop?.serial_number || '-'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {Math.round(w.weight_grams)} g
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {new Date(w.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
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
