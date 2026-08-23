import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { equipmentApi, branchApi } from '@/api';
import type { Equipment, EquipmentFormData, Branch } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const equipmentSchema = z.object({
  branch_id: z.coerce.number().min(1),
  type: z.enum(['espresso_machine', 'grinder', 'brewer', 'roaster']),
  code: z.string().min(1).max(20),
  name: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).default('active'),
  notes: z.string().optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onSaved: () => void;
}

export function EquipmentFormDialog({ open, onOpenChange, equipment, onSaved }: Props) {
  const { t, i18n } = useTranslation();
  const isEditing = !!equipment;
  const [branches, setBranches] = useState<Branch[]>([]);
  const isAr = i18n.language === 'ar';

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(equipmentSchema) as any,
    defaultValues: {
      branch_id: 0,
      type: 'espresso_machine',
      code: '',
      name: '',
      brand: '',
      model: '',
      status: 'active',
      notes: '',
    },
  });

  useEffect(() => {
    branchApi.list({ per_page: 100 }).then(({ data }) => setBranches(data.data));
  }, []);

  useEffect(() => {
    if (equipment) {
      reset({
        branch_id: equipment.branch_id,
        type: equipment.type,
        code: equipment.code,
        name: equipment.name,
        brand: equipment.brand || '',
        model: equipment.model || '',
        status: equipment.status,
        notes: equipment.notes || '',
      });
    } else {
      reset({
        branch_id: 0,
        type: 'espresso_machine',
        code: '',
        name: '',
        brand: '',
        model: '',
        status: 'active',
        notes: '',
      });
    }
  }, [equipment, reset]);

  const onSubmit = async (data: EquipmentFormData) => {
    if (isEditing) {
      await equipmentApi.update(equipment.id, data);
    } else {
      await equipmentApi.create(data);
    }
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit') : t('add')} - {t('equipment')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('branch')}</Label>
              <Select
                value={String(watch('branch_id') || '')}
                onValueChange={(v) => setValue('branch_id', Number(v))}
              >
                <SelectTrigger className={errors.branch_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('branch')} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {isAr ? b.name_ar : b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('type')}</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as EquipmentFormData['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="espresso_machine">{t('espresso_machine')}</SelectItem>
                  <SelectItem value="grinder">{t('grinder')}</SelectItem>
                  <SelectItem value="brewer">{t('brewer')}</SelectItem>
                  <SelectItem value="roaster">{t('roaster')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('code')}</Label>
              <Input dir="ltr" {...register('code')} className={errors.code ? 'border-red-500' : ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input {...register('name')} className={errors.name ? 'border-red-500' : ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('brand')}</Label>
              <Input dir="ltr" {...register('brand')} />
            </div>
            <div className="space-y-2">
              <Label>{t('model')}</Label>
              <Input dir="ltr" {...register('model')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('status')}</Label>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as EquipmentFormData['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea {...register('notes')} rows={2} />
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
