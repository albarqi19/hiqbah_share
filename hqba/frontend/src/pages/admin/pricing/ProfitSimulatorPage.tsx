import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pricingApi } from '@/api/pricing';
import client from '@/api/client';
import type { MarginSimulation } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface CropOption {
  id: number;
  serial_number: string;
  name: string;
  name_ar: string;
}

const ITEM_TYPES = ['finished_250', 'finished_500', 'finished_1kg'] as const;

function formatSAR(value: number): string {
  return `${value.toFixed(2)} SAR`;
}

export function ProfitSimulatorPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [crops, setCrops] = useState<CropOption[]>([]);
  const [cropsLoading, setCropsLoading] = useState(true);

  const [form, setForm] = useState<{ crop_id: number; item_type: string; new_price: number }>({
    crop_id: 0,
    item_type: 'finished_250',
    new_price: 0,
  });

  const [result, setResult] = useState<MarginSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrops = async () => {
      setCropsLoading(true);
      try {
        const { data: res } = await client.get<{ data: CropOption[] }>('/crops', {
          params: { per_page: 200, 'filter[status]': 'active' },
        });
        setCrops(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setCropsLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const handleSimulate = async () => {
    if (!form.crop_id || !form.item_type || form.new_price <= 0) return;
    setIsSimulating(true);
    setError(null);
    setResult(null);
    try {
      const { data: res } = await pricingApi.simulateMargin({
        crop_id: form.crop_id,
        item_type: form.item_type,
        new_price: form.new_price,
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setError(t('simulation_error'));
    } finally {
      setIsSimulating(false);
    }
  };

  const marginBarMax = result
    ? Math.max(Math.abs(result.current_margin_percent), Math.abs(result.new_margin_percent), 1)
    : 1;

  const marginBarWidth = (value: number) =>
    `${Math.max((Math.abs(value) / marginBarMax) * 100, 2)}%`;

  const marginColor = (value: number) =>
    value >= 0 ? 'bg-green-500' : 'bg-red-500';

  const changeColor = (value: number) =>
    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {t('profit_simulator')}
        </h1>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('simulation_parameters')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Crop Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('crop')}
            </label>
            {cropsLoading ? (
              <div className="flex items-center gap-2 h-10 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('loading')}
              </div>
            ) : (
              <select
                value={form.crop_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, crop_id: Number(e.target.value) }))
                }
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value={0}>{t('select_crop')}</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.serial_number} - {isAr ? crop.name_ar : crop.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Item Type Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('item_type')}
            </label>
            <select
              value={form.item_type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, item_type: e.target.value }))
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            >
              {ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
          </div>

          {/* New Price Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('new_price')} (SAR)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.new_price || ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, new_price: Number(e.target.value) }))
              }
              placeholder="0.00"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            />
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating || !form.crop_id || form.new_price <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed h-10"
          >
            {isSimulating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {t('simulate')}
          </button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-300 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Profitability Verdict */}
          <Card className="p-6 flex items-center justify-center">
            {result.is_profitable ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-2xl px-6 py-3 gap-2">
                <TrendingUp className="w-6 h-6" />
                {isAr ? 'مربح' : 'Profitable'}
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-2xl px-6 py-3 gap-2">
                <AlertTriangle className="w-6 h-6" />
                {isAr ? 'غير مربح' : 'Not Profitable'}
              </Badge>
            )}
          </Card>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Cost Per Unit */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('cost_per_unit')}
              </p>
              <p className="text-xl font-bold text-foreground">
                {formatSAR(result.cost_per_unit)}
              </p>
            </Card>

            {/* Current Price → New Price */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('price_comparison')}
              </p>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="text-muted-foreground">
                  {formatSAR(result.current_price)}
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className={changeColor(result.new_price - result.current_price)}>
                  {formatSAR(result.new_price)}
                </span>
              </div>
            </Card>

            {/* Margin % Comparison */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('margin_percent')}
              </p>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className={result.current_margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {result.current_margin_percent.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className={result.new_margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {result.new_margin_percent.toFixed(1)}%
                </span>
              </div>
            </Card>

            {/* Margin Change */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('margin_change')}
              </p>
              <div className={`flex items-center gap-1 text-xl font-bold ${changeColor(result.margin_change)}`}>
                {result.margin_change > 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : result.margin_change < 0 ? (
                  <TrendingDown className="w-5 h-5" />
                ) : null}
                <span>
                  {result.margin_change > 0 ? '+' : ''}
                  {result.margin_change.toFixed(1)}%
                </span>
              </div>
            </Card>

            {/* Profit Per Unit: Current */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('profit_per_unit_current')}
              </p>
              <p className={`text-xl font-bold ${result.profit_per_unit_current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatSAR(result.profit_per_unit_current)}
              </p>
            </Card>

            {/* Profit Per Unit: New */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('profit_per_unit_new')}
              </p>
              <p className={`text-xl font-bold ${result.profit_per_unit_new >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatSAR(result.profit_per_unit_new)}
              </p>
            </Card>
          </div>

          {/* Visual Margin Comparison Bar */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('margin_comparison')}
            </h3>

            {/* Current Margin Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('current_margin')}</span>
                <span>{result.current_margin_percent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${marginColor(result.current_margin_percent)}`}
                  style={{ width: marginBarWidth(result.current_margin_percent) }}
                />
              </div>
            </div>

            {/* New Margin Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('new_margin')}</span>
                <span>{result.new_margin_percent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${marginColor(result.new_margin_percent)}`}
                  style={{ width: marginBarWidth(result.new_margin_percent) }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
