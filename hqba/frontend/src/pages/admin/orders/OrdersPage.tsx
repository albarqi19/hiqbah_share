import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/api';
import type { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShoppingCart, Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-accent text-foreground', sales_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', inventory_check: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  accounting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', sales_confirm: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', pending_payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  allocated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', in_production: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300', packing: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  shipped: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', closed: 'bg-accent text-muted-foreground', cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export function OrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = { include: 'customer,items', per_page: 50 };
        if (filterStatus) params['filter[status]'] = filterStatus;
        const { data } = await orderApi.list(params);
        setOrders(data.data);
      } catch {} finally { setIsLoading(false); }
    };
    fetchOrders();
  }, [filterStatus]);

  const statuses = ['draft', 'sales_review', 'inventory_check', 'accounting', 'sales_confirm', 'pending_payment', 'allocated', 'in_production', 'packing', 'shipped', 'closed', 'cancelled'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ShoppingCart className="w-7 h-7" />{t('orders_menu')}</h1>
        <button onClick={() => navigate('/orders/new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('create_order')}</button>
      </div>

      <div className="flex items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">{t('all_types')}</option>
          {statuses.map(s => (<option key={s} value={s}>{t(s === 'in_production' ? 'in_production_status' : s)}</option>))}
        </select>
      </div>

      {isLoading ? (<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t('order_number')}</TableHead><TableHead>{t('customer')}</TableHead>
              <TableHead>{t('status')}</TableHead><TableHead>{t('total')}</TableHead>
              <TableHead>{t('payment_status')}</TableHead><TableHead>{t('created_at')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {orders.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('no_orders')}</TableCell></TableRow>) : (
                orders.map(order => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/orders/${order.id}`)}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell className="text-sm">{isAr ? order.customer?.name_ar : order.customer?.name}</TableCell>
                    <TableCell><Badge className={`text-xs ${statusColors[order.status]}`}>{isAr ? order.status_label : order.status_label_en}</Badge></TableCell>
                    <TableCell className="font-bold">{order.total.toFixed(2)} SAR</TableCell>
                    <TableCell><Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'} className={order.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'text-orange-600 dark:text-orange-400'}>{t(order.payment_status)}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
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
