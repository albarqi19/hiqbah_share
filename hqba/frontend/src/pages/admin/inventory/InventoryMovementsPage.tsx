import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '@/api';
import type { InventoryMovement } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';

export function InventoryMovementsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDirection, setFilterDirection] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          include: 'branch,crop,staff',
          per_page: 50,
        };
        if (filterDirection) params['filter[direction]'] = filterDirection;
        const { data } = await inventoryApi.movements(params);
        setMovements(data.data);
      } catch {
        // silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovements();
  }, [filterDirection]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-7 h-7" />
          {t('inventory_movements')}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
        >
          <option value="">{t('all_types')}</option>
          <option value="in">{t('incoming')}</option>
          <option value="out">{t('outgoing')}</option>
        </select>
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
                <TableHead className="w-8"></TableHead>
                <TableHead>{t('created_at')}</TableHead>
                <TableHead>{t('crop')}</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead>{t('movement')}</TableHead>
                <TableHead>{t('stock')}</TableHead>
                <TableHead>{t('remaining')}</TableHead>
                <TableHead>{t('users')}</TableHead>
                <TableHead>{t('notes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {mov.direction === 'in' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(mov.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{mov.crop?.serial_number}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {isAr ? mov.branch?.name_ar : mov.branch?.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mov.direction === 'in' ? 'default' : 'destructive'}
                        className={`text-xs ${mov.direction === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}
                      >
                        {isAr ? mov.movement_type_label : mov.movement_type_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-bold ${mov.direction === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {mov.direction === 'in' ? '+' : '-'}{mov.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {mov.balance_after}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {isAr ? mov.staff?.name_ar : mov.staff?.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground/70 max-w-[200px] truncate">
                      {mov.notes}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
