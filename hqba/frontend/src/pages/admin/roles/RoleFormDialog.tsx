import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { roleApi } from '@/api';
import type { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSaved: () => void;
}

export function RoleFormDialog({ open, onOpenChange, role, onSaved }: Props) {
  const { t } = useTranslation();
  const isEditing = !!role;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '');
      setError(null);
    }
  }, [open, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[a-z0-9_]+$/.test(name)) {
      setError(t('invalid_role_name'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing && role) {
        await roleApi.update(role.id, { name });
      } else {
        await roleApi.create({ name });
      }
      onSaved();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || t('error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit_role') : t('add_role')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('role_name')} *</Label>
            <Input
              dir="ltr"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="e.g. branch_supervisor"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{t('role_name_hint')}</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

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
