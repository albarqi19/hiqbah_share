import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { branchApi } from '@/api';
import type { Branch, BranchFormData } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  type: z.enum(['roastery', 'branch']),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSaved: () => void;
}

export function BranchFormDialog({ open, onOpenChange, branch, onSaved }: Props) {
  const { t } = useTranslation();
  const isEditing = !!branch;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      name_ar: '',
      type: 'branch',
      city: '',
      address: '',
      phone: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (branch) {
      reset({
        name: branch.name,
        name_ar: branch.name_ar,
        type: branch.type,
        city: branch.city || '',
        address: branch.address || '',
        phone: branch.phone || '',
        is_active: branch.is_active,
      });
    } else {
      reset({
        name: '',
        name_ar: '',
        type: 'branch',
        city: '',
        address: '',
        phone: '',
        is_active: true,
      });
    }
  }, [branch, reset]);

  const onSubmit = async (data: BranchFormData) => {
    if (isEditing) {
      await branchApi.update(branch.id, data);
    } else {
      await branchApi.create(data);
    }
    onSaved();
  };

  const isActive = watch('is_active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit') : t('add')} - {t('branches')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('name_en')}</Label>
              <Input dir="ltr" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('name_ar')}</Label>
              <Input {...register('name_ar')} className={errors.name_ar ? 'border-red-500' : ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('type')}</Label>
            <Select
              value={watch('type')}
              onValueChange={(v) => setValue('type', v as 'roastery' | 'branch')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roastery">{t('roastery')}</SelectItem>
                <SelectItem value="branch">{t('branch')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('city')}</Label>
              <Input {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input dir="ltr" {...register('phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('address')}</Label>
            <Textarea {...register('address')} rows={2} />
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
