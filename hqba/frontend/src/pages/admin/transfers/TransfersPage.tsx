import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { transferApi } from '@/api';
import type { TransferOrder } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Truck, Check, Ship, PackageCheck, CheckCircle2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-accent text-foreground', approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', shipped: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const actionMap: Record<string, { label: string; icon: React.ReactNode; color: string; action: string }> = {
  draft: { label: 'approve_transfer', icon: <Check className="w-3 h-3" />, color: 'text-blue-600 dark:text-blue-400', action: 'approve' },
  approved: { label: 'ship_transfer', icon: <Ship className="w-3 h-3" />, color: 'text-orange-600 dark:text-orange-400', action: 'ship' },
  shipped: { label: 'receive_transfer', icon: <PackageCheck className="w-3 h-3" />, color: 'text-green-600 dark:text-green-400', action: 'receive' },
  received: { label: 'confirm_transfer', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-600 dark:text-emerald-400', action: 'confirm' },
};

export function TransfersPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try { const { data } = await transferApi.list({ include: 'fromBranch,toBranch,items.crop,creator', per_page: 50 }); setTransfers(data.data); } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleAction = async (transfer: TransferOrder, action: string) => {
    setActing(transfer.id);
    try {
      if (action === 'approve') await transferApi.approve(transfer.id);
      else if (action === 'ship') await transferApi.ship(transfer.id);
      else if (action === 'receive') {
        // Auto-receive with sent quantities
        const received: Record<number, number> = {};
        transfer.items?.forEach(i => { received[i.id] = i.quantity_sent; });
        await transferApi.receive(transfer.id, received);
      }
      else if (action === 'confirm') await transferApi.confirm(transfer.id);
      await fetchTransfers();
    } catch {} finally { setActing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Truck className="w-7 h-7" />{t('transfers')}</h1>
      </div>

      {isLoading ? (<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>#</TableHead><TableHead>{t('from_branch')}</TableHead><TableHead>{t('to_branch')}</TableHead>
              <TableHead>{t('order_items')}</TableHead><TableHead>{t('status')}</TableHead><TableHead>{t('created_at')}</TableHead><TableHead>{t('actions')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {transfers.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('no_data')}</TableCell></TableRow>) : (
                transfers.map(tf => {
                  const act = actionMap[tf.status];
                  return (
                    <TableRow key={tf.id}>
                      <TableCell className="font-mono text-sm">{tf.transfer_number}</TableCell>
                      <TableCell className="text-sm">{isAr ? tf.from_branch?.name_ar : tf.from_branch?.name}</TableCell>
                      <TableCell className="text-sm">{isAr ? tf.to_branch?.name_ar : tf.to_branch?.name}</TableCell>
                      <TableCell className="text-xs">
                        {tf.items?.map((item, i) => (
                          <div key={i}>{item.crop?.serial_number} × {item.quantity_sent} ({item.item_type})</div>
                        ))}
                      </TableCell>
                      <TableCell><Badge className={statusColors[tf.status]}>{isAr ? tf.status_label : tf.status_label_en}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(tf.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {act && (
                          <button onClick={() => handleAction(tf, act.action)} disabled={acting === tf.id}
                            className={`flex items-center gap-1 text-xs ${act.color} hover:underline disabled:opacity-50`}>
                            {acting === tf.id ? <Loader2 className="w-3 h-3 animate-spin" /> : act.icon}
                            {t(act.label)}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
