import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderApi } from '@/api';
import type { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, ArrowRight, ChevronRight, CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusFlow = ['draft', 'sales_review', 'inventory_check', 'accounting', 'sales_confirm', 'pending_payment', 'allocated', 'in_production', 'packing', 'shipped', 'closed'];
const statusColors: Record<string, string> = {
  draft: 'bg-muted0', sales_review: 'bg-blue-500', inventory_check: 'bg-cyan-500', accounting: 'bg-yellow-500',
  sales_confirm: 'bg-indigo-500', pending_payment: 'bg-orange-500', allocated: 'bg-amber-500',
  in_production: 'bg-pink-500', packing: 'bg-teal-500', shipped: 'bg-green-500', closed: 'bg-muted-foreground', cancelled: 'bg-red-500',
};

export function OrderDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    try { const { data } = await orderApi.get(Number(id)); setOrder(data.data); } catch { toast.error(isAr ? 'فشل تحميل الطلب' : 'Failed to load order'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleAdvance = async () => {
    if (!order) return;
    const currentIdx = statusFlow.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[currentIdx + 1];
    setActing(true);
    try { await orderApi.transition(order.id, nextStatus); toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated'); await fetchOrder(); } catch (e: any) { toast.error(e?.response?.data?.message || (isAr ? 'فشل تحديث الحالة' : 'Failed to update status')); } finally { setActing(false); }
  };

  const handlePay = async () => {
    if (!order) return;
    setActing(true);
    try { await orderApi.confirmPayment(order.id, payMethod); toast.success(isAr ? 'تم تأكيد الدفع' : 'Payment confirmed'); await fetchOrder(); } catch (e: any) { toast.error(e?.response?.data?.message || (isAr ? 'فشل تأكيد الدفع' : 'Failed to confirm payment')); } finally { setActing(false); }
  };

  const handleCancel = async () => {
    if (!order || !cancelReason) return;
    setActing(true);
    try { await orderApi.cancel(order.id, cancelReason); setShowCancel(false); toast.success(isAr ? 'تم إلغاء الطلب' : 'Order cancelled'); await fetchOrder(); } catch (e: any) { toast.error(e?.response?.data?.message || (isAr ? 'فشل إلغاء الطلب' : 'Failed to cancel order')); } finally { setActing(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="text-center py-12 text-muted-foreground">{isAr ? 'لم يتم العثور على الطلب أو لا تملك صلاحية الوصول' : 'Order not found or access denied'}</div>;

  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const currentIdx = statusFlow.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"><BackIcon className="w-4 h-4" />{t('back')}</button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-muted-foreground">{isAr ? order.customer?.name_ar : order.customer?.name}</p>
        </div>
        <Badge className={`text-sm py-1 px-3 ${statusColors[order.status]} text-white`}>{isAr ? order.status_label : order.status_label_en}</Badge>
      </div>

      {/* Progress Bar */}
      {order.status !== 'cancelled' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {statusFlow.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${i <= currentIdx ? `${statusColors[s]} text-white` : 'bg-accent text-muted-foreground/70'}`}>
                {t(s === 'in_production' ? 'in_production_status' : s)}
              </div>
              {i < statusFlow.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div><div className="text-xs text-muted-foreground">{t('subtotal')}</div><div className="font-bold">{order.subtotal.toFixed(2)}</div></div>
          <div><div className="text-xs text-muted-foreground">{t('vat')} ({order.vat_percent}%)</div><div className="font-bold">{order.vat_amount.toFixed(2)}</div></div>
          <div><div className="text-xs text-muted-foreground">{t('discount_label')}</div><div className="font-bold text-red-600 dark:text-red-400">-{order.discount.toFixed(2)}</div></div>
          <div><div className="text-xs text-muted-foreground">{t('total')}</div><div className="text-xl font-bold text-green-700 dark:text-green-400">{order.total.toFixed(2)} SAR</div></div>
          <div><div className="text-xs text-muted-foreground">{t('payment_status')}</div><Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'} className={order.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : ''}>{t(order.payment_status)}</Badge></div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card rounded-lg border">
        <div className="px-4 py-3 border-b font-bold text-foreground">{t('order_items')}</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t('product_name_label')}</TableHead><TableHead>{t('crop')}</TableHead>
            <TableHead>{t('type')}</TableHead><TableHead>{t('stock')}</TableHead>
            <TableHead>{t('unit_price')}</TableHead><TableHead>{t('total_price')}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {order.items?.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="font-mono text-xs">{item.crop?.serial_number}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{item.item_type}</Badge></TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit_price.toFixed(2)}</TableCell>
                <TableCell className="font-bold">{item.total_price.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      {order.status !== 'closed' && order.status !== 'cancelled' && (
        <div className="flex gap-3 flex-wrap">
          {order.status === 'pending_payment' && (
            <div className="flex items-center gap-2">
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="bank_transfer">{t('bank_transfer')}</option>
                <option value="cash">{t('cash')}</option>
              </select>
              <button onClick={handlePay} disabled={acting} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
                <CreditCard className="w-4 h-4" />{t('confirm_payment')}
              </button>
            </div>
          )}
          {currentIdx < statusFlow.length - 1 && order.status !== 'pending_payment' && (
            <button onClick={handleAdvance} disabled={acting} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ChevronRight className="w-4 h-4" />{t('advance_status')}</>}
            </button>
          )}
          <button onClick={() => setShowCancel(true)} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-950/30">
            <XCircle className="w-4 h-4" />{t('cancel_order')}
          </button>
        </div>
      )}

      {/* Status History */}
      {order.status_history && order.status_history.length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-bold text-foreground mb-3">{t('order_history')}</h3>
          <div className="space-y-2">
            {order.status_history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="text-xs text-muted-foreground/70 w-32">{new Date(h.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</div>
                <Badge className={`text-xs ${statusColors[h.to]} text-white`}>{h.to}</Badge>
                <span className="text-muted-foreground">{h.changed_by}</span>
                {h.notes && <span className="text-muted-foreground/70">— {h.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400">{t('cancel_order')}</h2>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder={t('reason')} className="w-full border rounded-lg px-3 py-2" rows={3} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCancel(false)} className="px-4 py-2 border rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleCancel} disabled={acting || !cancelReason} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">{t('confirm_delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
