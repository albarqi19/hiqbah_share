import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { permissionApi } from '@/api';
import type { PermissionGroup, User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Save } from 'lucide-react';
import { PermissionMatrix } from '../roles/PermissionMatrix';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved: () => void;
}

export function UserPermissionsDialog({ open, onOpenChange, user, onSaved }: Props) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [direct, setDirect] = useState<Set<string>>(new Set());
  const [inherited, setInherited] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setIsLoading(true);
    setError(null);
    Promise.all([
      permissionApi.catalog(),
      permissionApi.forUser(user.id),
    ])
      .then(([catalog, userPerms]) => {
        setGroups(catalog.data.data);
        setInherited(new Set(userPerms.data.data.role_permissions));
        setDirect(new Set(userPerms.data.data.direct_permissions));
      })
      .finally(() => setIsLoading(false));
  }, [open, user]);

  const togglePerm = (perm: string) => {
    setDirect((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleResource = (resource: string, allSelected: boolean) => {
    const group = groups.find((g) => g.resource === resource);
    if (!group) return;
    setDirect((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => {
        if (inherited.has(p.name)) return;
        if (allSelected) next.delete(p.name);
        else next.add(p.name);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await permissionApi.syncForUser(user.id, Array.from(direct));
      onSaved();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || t('error_occurred'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('extra_permissions_title')}</DialogTitle>
          <DialogDescription>{t('extra_permissions_hint')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {t('inherited_count', { count: inherited.size })}</p>
              <p>• {t('direct_count', { count: direct.size })}</p>
            </div>

            <PermissionMatrix
              groups={groups}
              selected={new Set([...inherited, ...direct])}
              onToggle={togglePerm}
              onToggleResource={toggleResource}
              disabledPermissions={inherited}
            />
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
