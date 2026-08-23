import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pricingApi } from '@/api/pricing';
import type { PriceList } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2, Plus, Tag, Check, Archive } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  pending_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const typeColors: Record<string, string> = {
  wholesale: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  retail: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  vip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  custom: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const priceListTypes = ['wholesale', 'retail', 'vip', 'custom'] as const;
const priceListStatuses = ['draft', 'pending_approval', 'active', 'archived'] as const;
const roundingRules = ['nearest_halala', 'nearest_riyal', 'nearest_5', 'none'] as const;

const priceListSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(priceListTypes),
  rounding_rule: z.enum(roundingRules),
  description: z.string().optional().or(z.literal('')),
  description_ar: z.string().optional().or(z.literal('')),
  is_default: z.boolean().default(false),
});

type PriceListFormData = z.infer<typeof priceListSchema>;

export function PriceListsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [data, setData] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PriceListFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(priceListSchema) as any,
    defaultValues: {
      name: '',
      name_ar: '',
      code: '',
      type: 'retail',
      rounding_rule: 'none',
      description: '',
      description_ar: '',
      is_default: false,
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 50 };
      if (filterType) params['filter[type]'] = filterType;
      if (filterStatus) params['filter[status]'] = filterStatus;
      const { data: res } = await pricingApi.listPriceLists(params);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus]);

  const handleAdd = () => {
    setEditId(null);
    reset({
      name: '',
      name_ar: '',
      code: '',
      type: 'retail',
      rounding_rule: 'none',
      description: '',
      description_ar: '',
      is_default: false,
    });
    setShowForm(true);
  };

  const handleEdit = (priceList: PriceList) => {
    setEditId(priceList.id);
    reset({
      name: priceList.name,
      name_ar: priceList.name_ar,
      code: priceList.code,
      type: priceList.type,
      rounding_rule: priceList.rounding_rule,
      description: priceList.description || '',
      description_ar: priceList.description_ar || '',
      is_default: priceList.is_default,
    });
    setShowForm(true);
  };

  const handleSave = async (formData: PriceListFormData) => {
    try {
      if (editId) {
        await pricingApi.updatePriceList(editId, formData);
      } else {
        await pricingApi.createPriceList(formData);
      }
      setShowForm(false);
      setEditId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await pricingApi.approvePriceList(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await pricingApi.archivePriceList(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const isDefault = watch('is_default');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Tag className="w-7 h-7" />
          {t('price_lists')}
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
          {priceListTypes.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('all_statuses')}</option>
          {priceListStatuses.map((status) => (
            <option key={status} value={status}>
              {t(status)}
            </option>
          ))}
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
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('items_count')}</TableHead>
                <TableHead>{t('default')}</TableHead>
                <TableHead>{t('created_at')}</TableHead>
                <TableHead className="w-28">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((priceList) => (
                  <TableRow
                    key={priceList.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigate(`/price-lists/${priceList.id}`)}
                  >
                    <TableCell className="font-medium">
                      {isAr ? priceList.name_ar : priceList.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {priceList.code}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${typeColors[priceList.type]}`}>
                        {isAr ? priceList.type_label : priceList.type_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColors[priceList.status]}`}>
                        {isAr ? priceList.status_label : priceList.status_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {priceList.items_count ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {priceList.is_default && (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(priceList.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(priceList);
                          }}
                          title={t('edit')}
                        >
                          {t('edit')}
                        </Button>
                        {(priceList.status === 'draft' ||
                          priceList.status === 'pending_approval') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(priceList.id);
                            }}
                            title={t('approve')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {priceList.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(priceList.id);
                            }}
                            title={t('archive')}
                          >
                            <Archive className="w-4 h-4" />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? t('edit') : t('add')} - {t('price_lists')}
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
                  className={errors.code ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('type')}</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(v) =>
                    setValue('type', v as PriceListFormData['type'])
                  }
                >
                  <SelectTrigger
                    className={errors.type ? 'border-red-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceListTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('rounding_rule')}</Label>
              <Select
                value={watch('rounding_rule')}
                onValueChange={(v) =>
                  setValue(
                    'rounding_rule',
                    v as PriceListFormData['rounding_rule']
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roundingRules.map((rule) => (
                    <SelectItem key={rule} value={rule}>
                      {t(rule)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('description_en')}</Label>
                <Textarea {...register('description')} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t('description_ar')}</Label>
                <Textarea dir="rtl" {...register('description_ar')} rows={2} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={isDefault}
                onCheckedChange={(checked) =>
                  setValue('is_default', checked as boolean)
                }
              />
              <Label>{t('is_default')}</Label>
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
