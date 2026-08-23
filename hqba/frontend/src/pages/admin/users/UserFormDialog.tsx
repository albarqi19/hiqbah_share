import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userApi, branchApi, roleApi } from '@/api';
import type { User, Branch, Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  email: z.union([z.string().email(), z.literal('')]),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  pin: z.string().length(6).optional().or(z.literal('')),
  branch_id: z.coerce.number().nullable().optional(),
  is_active: z.boolean().default(true),
  language: z.enum(['ar', 'en']).default('ar'),
  roles: z.array(z.string()).min(1),
});

type UserFormData = z.infer<typeof userSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: Props) {
  const { t, i18n } = useTranslation();
  const isEditing = !!user;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const isAr = i18n.language === 'ar';

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      name: '', name_ar: '', email: '', phone: '', password: '', pin: '',
      branch_id: null, is_active: true, language: 'ar', roles: [],
    },
  });

  useEffect(() => {
    branchApi.list({ per_page: 100 }).then(({ data }) => setBranches(data.data));
    roleApi.list().then(({ data }) => setRoles(data.data));
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        name_ar: user.name_ar,
        email: user.email,
        phone: user.phone || '',
        password: '',
        pin: '',
        branch_id: user.branch_id,
        is_active: user.is_active,
        language: user.language,
        roles: user.roles || [],
      });
    } else {
      reset({
        name: '', name_ar: '', email: '', phone: '', password: '', pin: '',
        branch_id: null, is_active: true, language: 'ar', roles: [],
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormData) => {
    const payload: Partial<UserFormData> = { ...data };
    if (!payload.password) delete payload.password;
    if (!payload.pin) delete payload.pin;
    if (!payload.phone) delete payload.phone;
    if (!payload.email) delete payload.email;

    if (isEditing) {
      await userApi.update(user.id, payload as UserFormData);
    } else {
      await userApi.create(payload as UserFormData);
    }
    onSaved();
  };

  const selectedRoles = watch('roles');
  const isActive = watch('is_active');

  const toggleRole = (role: string) => {
    const current = selectedRoles || [];
    if (current.includes(role)) {
      setValue('roles', current.filter((item: string) => item !== role));
    } else {
      setValue('roles', [...current, role]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit') : t('add')} - {t('users')}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input dir="ltr" type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')} <span className="text-xs text-muted-foreground">({t('whatsapp')})</span></Label>
              <Input dir="ltr" type="tel" {...register('phone')} placeholder="+966..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t('password')} {isEditing
                  ? `(${t('leave_empty_to_keep')})`
                  : <span className="text-xs text-muted-foreground">({t('auto_generated_if_empty')})</span>}
              </Label>
              <Input dir="ltr" type="password" {...register('password')} />
            </div>
            <div className="space-y-2">
              <Label>
                {t('pin')} {isEditing
                  ? '(6 digits)'
                  : <span className="text-xs text-muted-foreground">({t('auto_generated_if_empty')})</span>}
              </Label>
              <Input dir="ltr" maxLength={6} {...register('pin')} placeholder="000000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('branch')}</Label>
              <Select
                value={String(watch('branch_id') || '')}
                onValueChange={(v) => setValue('branch_id', v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
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
              <Label>{t('language')}</Label>
              <Select
                value={watch('language')}
                onValueChange={(v) => setValue('language', v as 'ar' | 'en')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t('arabic')}</SelectItem>
                  <SelectItem value="en">{t('english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label>{t('active')}</Label>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label className={errors.roles ? 'text-red-500' : ''}>
              {t('roles')} *
            </Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedRoles?.includes(role.name)}
                    onCheckedChange={() => toggleRole(role.name)}
                  />
                  <span>{t(`role_${role.name}`, { defaultValue: role.name.replace(/_/g, ' ') })}</span>
                </label>
              ))}
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
