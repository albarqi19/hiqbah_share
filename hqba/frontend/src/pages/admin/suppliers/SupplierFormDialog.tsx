import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supplierApi } from '@/api';
import type { Supplier, SupplierFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSaved: () => void;
}

export function SupplierFormDialog({ open, onOpenChange, supplier, onSaved }: Props) {
  const { t } = useTranslation();
  const isEditing = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      name: '',
      country: '',
      contact_person: '',
      email: '',
      phone: '',
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        country: supplier.country,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active,
      });
    } else {
      reset({
        name: '',
        country: '',
        contact_person: '',
        email: '',
        phone: '',
        notes: '',
        is_active: true,
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    if (isEditing) {
      await supplierApi.update(supplier.id, data);
    } else {
      await supplierApi.create(data);
    }
    onSaved();
  };

  const isActive = watch('is_active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit') : t('add')} - {t('suppliers')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input {...register('name')} className={errors.name ? 'border-red-500' : ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('country')}</Label>
              <Input {...register('country')} className={errors.country ? 'border-red-500' : ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('contact_person')}</Label>
            <Input {...register('contact_person')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input dir="ltr" type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input dir="ltr" {...register('phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea {...register('notes')} rows={2} />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label>{t('active')}</Label>
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
