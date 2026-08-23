import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '@/api';
import type { InventoryItem } from '@/types';
import { formatQuantity } from '@/utils/formatQuantity';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Bell } from 'lucide-react';

export function InventoryAlertsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        const { data } = await inventoryApi.alerts();
        setAlerts(data.data);
      } catch {
        // silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // Group by branch
  const grouped = alerts.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const branchName = isAr ? (item.branch?.name_ar || '') : (item.branch?.name || '');
    if (!acc[branchName]) acc[branchName] = [];
    acc[branchName].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-7 h-7" />
          {t('inventory_alerts')}
        </h1>
        <Badge variant="destructive" className="text-sm">
          {alerts.length} {t('low_stock_alerts')}
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
          <p className="text-green-700 dark:text-green-300 font-medium">{t('no_alerts')}</p>
        </div>
      ) : (
        Object.entries(grouped).map(([branchName, branchAlerts]) => (
          <div key={branchName} className="bg-card rounded-lg border">
            <div className="bg-muted px-4 py-3 border-b">
              <h2 className="font-bold text-foreground">{branchName}</h2>
            </div>
            <div className="divide-y">
              {branchAlerts.map((item) => {
                const percent = item.min_threshold
                  ? Math.round((item.quantity / item.min_threshold) * 100)
                  : 0;
                const isCritical = percent <= 25;

                return (
                  <div key={item.id} className={`px-4 py-3 flex items-center gap-4 ${isCritical ? 'bg-red-50 dark:bg-red-950/30' : 'bg-yellow-50 dark:bg-yellow-950/30'}`}>
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${isCritical ? 'text-red-500 dark:text-red-400' : 'text-yellow-500 dark:text-yellow-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{item.crop?.serial_number}</span>
                        <Badge variant="outline" className="text-xs">
                          {isAr ? item.item_type_label : item.item_type_label_en}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {isAr ? item.crop?.name_ar : item.crop?.name}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className={`text-lg font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {formatQuantity(item.quantity, item.item_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('min_threshold')}: {item.min_threshold} {item.unit}
                      </div>
                    </div>
                    <div className="w-16 shrink-0">
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-center text-muted-foreground mt-1">{percent}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
