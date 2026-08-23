import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cropApi } from '@/api';
import type { Crop, CropStatus } from '@/types';
import { Loader2, Leaf, MapPin, Weight, Building2 } from 'lucide-react';

const STATUS_ORDER: CropStatus[] = [
  'ordered', 'received', 'inspecting', 'trial_roasting', 'cupping',
  'approved', 'pricing', 'marketing', 'production_ready', 'in_production',
  'depleted', 'closed',
];

const dotColor: Record<CropStatus, string> = {
  ordered:          'bg-muted-foreground',
  received:         'bg-blue-400',
  inspecting:       'bg-amber-400',
  trial_roasting:   'bg-orange-400',
  cupping:          'bg-amber-500',
  approved:         'bg-emerald-400',
  pricing:          'bg-yellow-400',
  marketing:        'bg-pink-400',
  production_ready: 'bg-emerald-500',
  in_production:    'bg-indigo-400',
  depleted:         'bg-border',
  closed:           'bg-border',
};

export function CropStatusBoardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    cropApi.list({ include: 'supplier', per_page: 200 })
      .then(({ data }) => setCrops(data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const grouped = useMemo(() =>
    STATUS_ORDER.reduce<Record<CropStatus, Crop[]>>((acc, s) => {
      acc[s] = crops.filter((c) => c.status === s);
      return acc;
    }, {} as Record<CropStatus, Crop[]>),
    [crops]
  );

  const activeStatuses = STATUS_ORDER.filter(
    (s) => grouped[s].length > 0 || !['depleted', 'closed'].includes(s)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('status_board')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {crops.length} {isAr ? 'محصول' : 'crops'}
            </p>
          </div>
        </div>
      </div>

      {/* Board */}
      <div
        className="flex gap-1.5 -mx-6 px-6 overflow-x-auto pb-4"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        {activeStatuses.map((status) => {
          const items = grouped[status];
          const isEmpty = items.length === 0;

          /* ── Collapsed empty column ── */
          if (isEmpty) {
            return (
              <div
                key={status}
                className="shrink-0 w-10 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center pt-3 gap-2"
              >
                <span className={`size-2 rounded-full shrink-0 ${dotColor[status]}`} />
                <span
                  className="text-[11px] font-medium text-muted-foreground/50 whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {t(status)}
                </span>
              </div>
            );
          }

          /* ── Expanded column with crops ── */
          return (
            <div
              key={status}
              className="shrink-0 w-[260px] flex flex-col rounded-xl bg-muted/50 border border-border/60"
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                <span className={`size-2 rounded-full shrink-0 ${dotColor[status]}`} />
                <span className="text-[13px] font-semibold text-foreground truncate flex-1">
                  {t(status)}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums bg-background rounded-md px-1.5 py-0.5 shrink-0">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin">
                {items.map((crop) => (
                  <div
                    key={crop.id}
                    onClick={() => navigate(`/crops/${crop.id}`)}
                    className="group bg-card rounded-lg border border-border/60 p-3 cursor-pointer hover:border-border hover:shadow-sm transition-all duration-150"
                  >
                    <div className="font-mono text-[11px] text-muted-foreground tracking-wide mb-1.5">
                      {crop.serial_number}
                    </div>
                    <div className="font-semibold text-sm text-card-foreground leading-snug mb-2.5 group-hover:text-primary transition-colors truncate">
                      {isAr ? crop.name_ar : crop.name}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      {crop.origin_country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 opacity-50" />
                          {crop.origin_country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Weight className="size-3 opacity-50" />
                        {crop.remaining_green_weight} kg
                      </span>
                    </div>
                    {crop.supplier && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mt-2 pt-2 border-t border-border/40">
                        <Building2 className="size-3 opacity-40" />
                        <span className="truncate">{crop.supplier.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
