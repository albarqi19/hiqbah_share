import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '@/api';
import type { InventoryItem, ItemType } from '@/types';
import { formatQuantity } from '@/utils/formatQuantity';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Package, AlertTriangle, SlidersHorizontal } from 'lucide-react';

export function InventoryPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterLow, setFilterLow] = useState(false);

  // Adjust dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        include: 'branch,crop',
        per_page: 100,
      };
      if (filterType) params['filter[item_type]'] = filterType;
      if (filterLow) params['filter[below_threshold]'] = '1';
      const { data } = await inventoryApi.list(params);
      setItems(data.data);
    } catch {
      // silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType, filterLow]);

  const handleAdjust = async () => {
    if (!adjustItem || !adjustReason) return;
    setAdjusting(true);
    try {
      await inventoryApi.adjust({
        branch_id: adjustItem.branch_id,
        crop_id: adjustItem.crop_id,
        item_type: adjustItem.item_type,
        new_quantity: parseFloat(adjustQty),
        reason: adjustReason,
      });
      setAdjustOpen(false);
      setAdjustItem(null);
      setAdjustQty('');
      setAdjustReason('');
      await fetchItems();
    } catch {
      // silently
    } finally {
      setAdjusting(false);
    }
  };

  const itemTypes: ItemType[] = ['green', 'roasted', 'finished_250', 'finished_500', 'finished_1kg', 'bar'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="w-7 h-7" />
          {t('inventory')}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          >
            <option value="">{t('all_types')}</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>{t(type)}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filterLow}
            onChange={(e) => setFilterLow(e.target.checked)}
            className="rounded border-border"
          />
          <AlertTriangle className="w-4 h-4 text-red-500" />
          {t('low_stock_only')}
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('crop')}</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead>{t('item_type')}</TableHead>
                <TableHead>{t('stock')}</TableHead>
                <TableHead>{t('min_threshold')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className={item.is_low ? 'bg-red-50 dark:bg-red-950/30' : ''}>
                    <TableCell>
                      <div className="font-mono text-xs text-muted-foreground">{item.crop?.serial_number}</div>
                      <div className="font-medium text-sm">{isAr ? item.crop?.name_ar : item.crop?.name}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {isAr ? item.branch?.name_ar : item.branch?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {isAr ? item.item_type_label : item.item_type_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatQuantity(item.quantity, item.item_type)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.min_threshold !== null ? `${item.min_threshold} ${item.unit}` : '—'}
                    </TableCell>
                    <TableCell>
                      {item.is_low ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 me-1" />
                          {t('low_stock')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          {t('ok_stock')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => {
                          setAdjustItem(item);
                          setAdjustQty(String(item.quantity));
                          setAdjustOpen(true);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {t('adjust_inventory')}
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Adjust Dialog */}
      {adjustOpen && adjustItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{t('adjust_inventory')}</h2>
            <div className="text-sm text-muted-foreground">
              {adjustItem.crop?.serial_number} — {isAr ? adjustItem.item_type_label : adjustItem.item_type_label_en}
            </div>
            <div className="text-sm">
              {t('current_quantity')}: <strong>{formatQuantity(adjustItem.quantity, adjustItem.item_type)}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('new_quantity')}</label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('reason')}</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                rows={2}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAdjustOpen(false); setAdjustItem(null); }}
                className="px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground hover:bg-muted"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting || !adjustReason}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
              >
                {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
