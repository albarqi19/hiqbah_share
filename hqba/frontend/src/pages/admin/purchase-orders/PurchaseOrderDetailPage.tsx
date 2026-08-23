import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '@/api';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  Mountain,
  Sprout,
  Droplets,
  TreePine,
  Package,
  DollarSign,
  Truck,
  Landmark,
  CalendarDays,
  StickyNote,
  ChevronRight,
} from 'lucide-react';

const statusConfig: Record<PurchaseOrderStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  draft: { variant: 'outline' },
  pending_approval: { variant: 'secondary', className: 'text-amber-700 bg-amber-100' },
  approved: { variant: 'default', className: 'bg-green-600' },
  ordered: { variant: 'outline', className: 'text-blue-700 border-blue-300' },
  shipped: { variant: 'secondary', className: 'text-blue-700 bg-blue-100' },
  in_customs: { variant: 'secondary', className: 'text-yellow-700 bg-yellow-100' },
  received: { variant: 'default', className: 'bg-emerald-600' },
  cancelled: { variant: 'destructive' },
};

/* ── Status timeline steps ── */
const TIMELINE_STEPS: PurchaseOrderStatus[] = [
  'draft', 'pending_approval', 'approved', 'ordered', 'shipped', 'in_customs', 'received',
];

function formatSAR(amount: number): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface StatusAction {
  label: string;
  targetStatus?: string;
  useApprove?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

const statusActions: Partial<Record<PurchaseOrderStatus, StatusAction[]>> = {
  draft: [{ label: 'submit_for_approval', targetStatus: 'pending_approval' }],
  pending_approval: [{ label: 'approve', useApprove: true, variant: 'default' }],
  approved: [{ label: 'mark_as_ordered', targetStatus: 'ordered' }],
  ordered: [{ label: 'mark_as_shipped', targetStatus: 'shipped' }],
  shipped: [{ label: 'mark_in_customs', targetStatus: 'in_customs' }],
  in_customs: [{ label: 'mark_as_received', targetStatus: 'received', variant: 'default' }],
};

/* ── Reusable detail row ── */
function DetailRow({ icon: Icon, label, value, dir }: { icon: typeof MapPin; label: string; value: string | number | null | undefined; dir?: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="size-4 text-muted-foreground/50 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground" dir={dir}>{value}</p>
      </div>
    </div>
  );
}

export function PurchaseOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const { data } = await purchaseOrderApi.get(Number(id), { include: 'supplier' });
      setOrder(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusAction = async (action: StatusAction) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      if (action.useApprove) {
        await purchaseOrderApi.approve(order.id);
      } else if (action.targetStatus) {
        await purchaseOrderApi.updateStatus(order.id, action.targetStatus);
      }
      fetchOrder();
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('no_data')}
      </div>
    );
  }

  const statusKey = (typeof order.status === 'string' ? order.status : String(order.status)) as PurchaseOrderStatus;
  const config = statusConfig[statusKey] || { variant: 'outline' as const };
  const actions = statusActions[statusKey] || [];
  const currentStepIndex = TIMELINE_STEPS.indexOf(statusKey);
  const isCancelled = statusKey === 'cancelled';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/purchase-orders')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground tracking-tight">{order.po_number}</h1>
              <Badge variant={config.variant} className={config.className}>
                {t(order.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.supplier?.name} · {order.origin_country}
            </p>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleStatusAction(action)}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="size-4 animate-spin me-2" />}
                {t(action.label)}
                <ChevronRight className="size-3.5 ms-1 opacity-50" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ── Status Timeline ── */}
      {!isCancelled && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, i) => {
              const isDone = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className={`flex items-center ${i < TIMELINE_STEPS.length - 1 ? 'flex-1' : ''}`}>
                  {/* Step circle + label */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`
                      flex items-center justify-center rounded-full text-[10px] font-bold transition-all
                      ${isCurrent
                        ? 'size-7 bg-emerald-500 text-white ring-4 ring-emerald-500/15'
                        : isDone
                          ? 'size-6 bg-primary text-primary-foreground'
                          : 'size-6 bg-muted text-muted-foreground/40 border border-border'
                      }
                    `}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] whitespace-nowrap leading-none ${
                      isCurrent ? 'font-semibold text-emerald-600' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/35'
                    }`}>
                      {t(step)}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded-full mt-[-18px] ${
                      i < currentStepIndex ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Supplier ── */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
            <Building2 className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{t('supplier')}</h3>
          </div>
          <div className="divide-y divide-border/50">
            <DetailRow icon={Building2} label={t('name')} value={order.supplier?.name} />
            <DetailRow icon={MapPin} label={t('country')} value={order.supplier?.country} />
            <DetailRow icon={Sprout} label={t('contact_person')} value={order.supplier?.contact_person} />
          </div>
        </div>

        {/* ── Coffee Details ── */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
            <Sprout className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{t('coffee_details')}</h3>
          </div>
          <div className="divide-y divide-border/50">
            <DetailRow icon={MapPin} label={t('origin_country')} value={order.origin_country} />
            <DetailRow icon={Mountain} label={t('region')} value={order.region} />
            <DetailRow icon={TreePine} label={t('farm')} value={order.farm} />
            <DetailRow icon={Droplets} label={t('process')} value={order.process} />
            <DetailRow icon={Sprout} label={t('variety')} value={order.variety} />
            <DetailRow icon={Mountain} label={t('altitude')} value={order.altitude} />
          </div>
        </div>

        {/* ── Financial ── */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
            <DollarSign className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{t('financial_summary')}</h3>
          </div>
          <div className="divide-y divide-border/50">
            <DetailRow icon={Package} label={t('quantity_kg')} value={`${order.quantity_kg} kg`} />
            <DetailRow icon={DollarSign} label={t('price_per_kg')} value={formatSAR(order.price_per_kg)} dir="ltr" />
            <DetailRow icon={Truck} label={t('shipping_cost')} value={formatSAR(order.shipping_cost)} dir="ltr" />
            <DetailRow icon={Landmark} label={t('customs_cost')} value={formatSAR(order.customs_cost)} dir="ltr" />

            {/* Total — highlighted */}
            <div className="pt-3 mt-1">
              <div className="bg-muted/60 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('total_cost')}</span>
                <span className="text-lg font-bold text-foreground tabular-nums" dir="ltr">
                  {formatSAR(order.total_cost)}
                </span>
              </div>
            </div>

            <DetailRow icon={CalendarDays} label={t('expected_date')} value={order.expected_date} />
            {order.notes && <DetailRow icon={StickyNote} label={t('notes')} value={order.notes} />}
          </div>
        </div>
      </div>
    </div>
  );
}
