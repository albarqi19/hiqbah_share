import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pricingApi } from '@/api/pricing';
import type { Discount } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Plus, Percent, Ban } from 'lucide-react';

const typeColors: Record<string, string> = {
  volume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  seasonal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  customer_specific: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  coupon: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const discountTypes = ['volume', 'seasonal', 'customer_specific', 'coupon'] as const;
const calculationTypes = ['percentage', 'fixed_amount'] as const;

const discountSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  code: z.string().optional().or(z.literal('')),
  type: z.enum(discountTypes),
  calculation: z.enum(calculationTypes),
  value: z.coerce.number().min(0),
  min_order_amount: z.coerce.number().min(0).optional().or(z.literal('')),
  min_quantity: z.coerce.number().min(0).optional().or(z.literal('')),
  max_uses: z.coerce.number().min(0).optional().or(z.literal('')),
  valid_from: z.string().optional().or(z.literal('')),
  valid_until: z.string().optional().or(z.literal('')),
});

type DiscountFormData = z.infer<typeof discountSchema>;

export function DiscountsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [data, setData] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(discountSchema) as any,
    defaultValues: {
      name: '',
      name_ar: '',
      code: '',
      type: 'volume',
      calculation: 'percentage',
      value: 0,
      min_order_amount: '',
      min_quantity: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 50 };
      if (filterType) params['filter[type]'] = filterType;
      if (filterActive) params['filter[is_active]'] = filterActive;
      const { data: res } = await pricingApi.listDiscounts(params);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, filterActive]);

  const handleAdd = () => {
    setEditId(null);
    reset({
      name: '',
      name_ar: '',
      code: '',
      type: 'volume',
      calculation: 'percentage',
      value: 0,
      min_order_amount: '',
      min_quantity: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
    });
    setShowForm(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditId(discount.id);
    reset({
      name: discount.name,
      name_ar: discount.name_ar,
      code: discount.code || '',
      type: discount.type,
      calculation: discount.calculation,
      value: discount.value,
      min_order_amount: discount.min_order_amount ?? '',
      min_quantity: discount.min_quantity ?? '',
      max_uses: discount.max_uses ?? '',
      valid_from: discount.valid_from?.split('T')[0] || '',
      valid_until: discount.valid_until?.split('T')[0] || '',
    });
    setShowForm(true);
  };

  const handleSave = async (formData: DiscountFormData) => {
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        name_ar: formData.name_ar,
        code: formData.code || null,
        type: formData.type,
        calculation: formData.calculation,
        value: formData.value,
        min_order_amount: formData.min_order_amount || null,
        min_quantity: formData.min_quantity || null,
        max_uses: formData.max_uses || null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
      };

      if (editId) {
        await pricingApi.updateDiscount(editId, payload);
      } else {
        await pricingApi.createDiscount(payload);
      }
      setShowForm(false);
      setEditId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await pricingApi.deactivateDiscount(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const formatValue = (discount: Discount) => {
    if (discount.calculation === 'percentage') {
      return `${discount.value}%`;
    }
    return `${discount.value} ${t('sar')}`;
  };

  const formatUsage = (discount: Discount) => {
    const used = discount.times_used;
    const max = discount.max_uses;
    if (max === null) {
      return `${used} / \u221E`;
    }
    return `${used} / ${max}`;
  };

  const formatPeriod = (discount: Discount) => {
    const from = discount.valid_from
      ? new Date(discount.valid_from).toLocaleDateString()
      : '—';
    const until = discount.valid_until
      ? new Date(discount.valid_until).toLocaleDateString()
      : '—';
    return `${from} → ${until}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Percent className="w-7 h-7" />
          {t('discounts')}
        </h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('add')}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('all_types')}</option>
          {discountTypes.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('all_statuses')}</option>
          <option value="1">{t('active')}</option>
          <option value="0">{t('inactive')}</option>
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
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('code')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('calculation')}</TableHead>
                <TableHead>{t('value')}</TableHead>
                <TableHead>{t('usage')}</TableHead>
                <TableHead>{t('valid_period')}</TableHead>
                <TableHead>{t('active')}</TableHead>
                <TableHead className="w-28">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">
                      {isAr ? discount.name_ar : discount.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {discount.code || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${typeColors[discount.type]}`}>
                        {isAr ? discount.type_label : discount.type_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isAr
                        ? discount.calculation_label
                        : discount.calculation_label_en}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatValue(discount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatUsage(discount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPeriod(discount)}
                    </TableCell>
                    <TableCell>
                      {discount.is_active ? (
                        <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          {t('active')}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {t('inactive')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(discount)}
                          title={t('edit')}
                        >
                          {t('edit')}
                        </Button>
                        {discount.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeactivate(discount.id)}
                            title={t('deactivate')}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? t('edit') : t('add')} - {t('discounts')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('name_en')}</Label>
                <Input
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('name_ar')}</Label>
                <Input
                  dir="rtl"
                  {...register('name_ar')}
                  className={errors.name_ar ? 'border-red-500' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('code')}</Label>
                <Input
                  dir="ltr"
                  {...register('code')}
                  placeholder={t('optional')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('type')}</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(v) =>
                    setValue('type', v as DiscountFormData['type'])
                  }
                >
                  <SelectTrigger
                    className={errors.type ? 'border-red-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('calculation')}</Label>
                <Select
                  value={watch('calculation')}
                  onValueChange={(v) =>
                    setValue('calculation', v as DiscountFormData['calculation'])
                  }
                >
                  <SelectTrigger
                    className={errors.calculation ? 'border-red-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationTypes.map((calc) => (
                      <SelectItem key={calc} value={calc}>
                        {t(calc)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('value')}</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  {...register('value')}
                  className={errors.value ? 'border-red-500' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('min_order_amount')}</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  {...register('min_order_amount')}
                  placeholder={t('optional')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('min_quantity')}</Label>
                <Input
                  type="number"
                  min="0"
                  {...register('min_quantity')}
                  placeholder={t('optional')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('max_uses')}</Label>
              <Input
                type="number"
                min="0"
                {...register('max_uses')}
                placeholder={t('optional')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('valid_from')}</Label>
                <Input type="date" {...register('valid_from')} />
              </div>
              <div className="space-y-2">
                <Label>{t('valid_until')}</Label>
                <Input type="date" {...register('valid_until')} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                )}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
