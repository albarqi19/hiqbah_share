import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseOrderApi, supplierApi } from '@/api';
import type { PurchaseOrder, PurchaseOrderFormData, Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const purchaseOrderSchema = z.object({
  supplier_id: z.number().min(1),
  origin_country: z.string().min(1),
  region: z.string().min(1),
  farm: z.string().optional(),
  process: z.string().min(1),
  variety: z.string().optional(),
  altitude: z.string().optional(),
  quantity_kg: z.number().min(0.01),
  price_per_kg: z.number().min(0.01),
  shipping_cost: z.number().min(0).default(0),
  customs_cost: z.number().min(0).default(0),
  expected_date: z.string().min(1),
  notes: z.string().optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
  onSaved: () => void;
}

export function PurchaseOrderFormDialog({ open, onOpenChange, order, onSaved }: Props) {
  const { t } = useTranslation();
  const isEditing = !!order;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(purchaseOrderSchema) as any,
    defaultValues: {
      supplier_id: 0,
      origin_country: '',
      region: '',
      farm: '',
      process: '',
      variety: '',
      altitude: '',
      quantity_kg: 0,
      price_per_kg: 0,
      shipping_cost: 0,
      customs_cost: 0,
      expected_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    supplierApi.list({ is_active: true }).then(({ data }) => {
      setSuppliers(data.data);
    });
  }, []);

  useEffect(() => {
    if (order) {
      reset({
        supplier_id: order.supplier_id,
        origin_country: order.origin_country,
        region: order.region,
        farm: order.farm || '',
        process: order.process,
        variety: order.variety || '',
        altitude: order.altitude || '',
        quantity_kg: order.quantity_kg,
        price_per_kg: order.price_per_kg,
        shipping_cost: order.shipping_cost,
        customs_cost: order.customs_cost,
        expected_date: order.expected_date,
        notes: order.notes || '',
      });
    } else {
      reset({
        supplier_id: 0,
        origin_country: '',
        region: '',
        farm: '',
        process: '',
        variety: '',
        altitude: '',
        quantity_kg: 0,
        price_per_kg: 0,
        shipping_cost: 0,
        customs_cost: 0,
        expected_date: '',
        notes: '',
      });
    }
  }, [order, reset]);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (isEditing) {
      await purchaseOrderApi.update(order.id, data);
    } else {
      await purchaseOrderApi.create(data);
    }
    onSaved();
  };

  const quantityKg = watch('quantity_kg') || 0;
  const pricePerKg = watch('price_per_kg') || 0;
  const shippingCost = watch('shipping_cost') || 0;
  const customsCost = watch('customs_cost') || 0;
  const calculatedTotal = (quantityKg * pricePerKg) + shippingCost + customsCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit') : t('add')} - {t('purchase_orders')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Supplier & Origin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('supplier')}</Label>
              <Select
                value={watch('supplier_id') ? String(watch('supplier_id')) : ''}
                onValueChange={(v) => setValue('supplier_id', Number(v))}
              >
                <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('select_supplier')} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('origin_country')}</Label>
              <Input {...register('origin_country')} className={errors.origin_country ? 'border-red-500' : ''} />
            </div>
          </div>

          {/* Section 2: Coffee Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('region')}</Label>
              <Input {...register('region')} className={errors.region ? 'border-red-500' : ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('farm')}</Label>
              <Input {...register('farm')} />
            </div>
            <div className="space-y-2">
              <Label>{t('process')}</Label>
              <Select
                value={String(watch('process') || '')}
                onValueChange={(v) => v && setValue('process', v as never)}
              >
                <SelectTrigger className={errors.process ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('select_process')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Washed">{t('washed')}</SelectItem>
                  <SelectItem value="Natural">{t('natural')}</SelectItem>
                  <SelectItem value="Honey">{t('honey')}</SelectItem>
                  <SelectItem value="Anaerobic">{t('anaerobic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 3: Variety & Altitude */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('variety')}</Label>
              <Input {...register('variety')} />
            </div>
            <div className="space-y-2">
              <Label>{t('altitude')}</Label>
              <Input {...register('altitude')} placeholder="e.g. 1800-2000m" />
            </div>
          </div>

          {/* Section 4: Financials */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('quantity_kg')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('quantity_kg', { valueAsNumber: true })}
                className={errors.quantity_kg ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('price_per_kg')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('price_per_kg', { valueAsNumber: true })}
                className={errors.price_per_kg ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('shipping_cost')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('shipping_cost', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('customs_cost')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('customs_cost', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Calculated Total */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">{t('total_cost')}:</span>{' '}
            <span className="font-bold text-lg" dir="ltr">
              {new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(calculatedTotal)}
            </span>
          </div>

          {/* Section 5: Date & Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('expected_date')}</Label>
              <Input
                type="date"
                {...register('expected_date')}
                className={errors.expected_date ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('notes')}</Label>
              <Textarea {...register('notes')} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
