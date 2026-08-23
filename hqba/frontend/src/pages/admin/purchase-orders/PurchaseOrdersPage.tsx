import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '@/api';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { PurchaseOrderFormDialog } from './PurchaseOrderFormDialog';

const statusConfig: Record<PurchaseOrderStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  draft: { variant: 'outline' },
  pending_approval: { variant: 'secondary', className: 'text-amber-700' },
  approved: { variant: 'default', className: 'bg-green-600' },
  ordered: { variant: 'outline', className: 'text-blue-700 border-blue-300' },
  shipped: { variant: 'secondary', className: 'text-blue-700' },
  in_customs: { variant: 'secondary', className: 'text-yellow-700' },
  received: { variant: 'default', className: 'bg-emerald-600' },
  cancelled: { variant: 'destructive' },
};

function formatSAR(amount: number): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await purchaseOrderApi.list({ include: 'supplier' });
      setOrders(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdd = () => {
    setEditingOrder(null);
    setDialogOpen(true);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    await purchaseOrderApi.delete(id);
    fetchOrders();
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('purchase_orders')}</h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('add')}
        </Button>
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
                <TableHead>{t('po_number')}</TableHead>
                <TableHead>{t('supplier')}</TableHead>
                <TableHead>{t('origin_country')}</TableHead>
                <TableHead>{t('region')}</TableHead>
                <TableHead>{t('quantity_kg')}</TableHead>
                <TableHead>{t('total_cost')}</TableHead>
                <TableHead>{t('expected_date')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-24">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const config = statusConfig[order.status];
                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => navigate(`/purchase-orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">{order.po_number}</TableCell>
                      <TableCell>{order.supplier?.name || '—'}</TableCell>
                      <TableCell>{order.origin_country}</TableCell>
                      <TableCell>{order.region}</TableCell>
                      <TableCell>{order.quantity_kg}</TableCell>
                      <TableCell dir="ltr">{formatSAR(order.total_cost)}</TableCell>
                      <TableCell>{order.expected_date}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className={config.className}>
                          {t(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(order);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(order.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <PurchaseOrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editingOrder}
        onSaved={handleSaved}
      />
    </div>
  );
}
