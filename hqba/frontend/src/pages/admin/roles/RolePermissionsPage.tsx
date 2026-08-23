import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { roleApi, permissionApi } from '@/api';
import type { PermissionGroup, Role } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Can } from '@/components/Can';
import { PermissionMatrix } from './PermissionMatrix';

export function RolePermissionsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      roleApi.get(Number(id)),
      permissionApi.catalog(),
    ])
      .then(([roleRes, permsRes]) => {
        setRole(roleRes.data.data);
        setGroups(permsRes.data.data);
        setSelected(new Set(roleRes.data.data.permissions ?? []));
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const togglePerm = (perm: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleResource = (resource: string, allSelected: boolean) => {
    const group = groups.find((g) => g.resource === resource);
    if (!group) return;
    setSelected((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => {
        if (allSelected) next.delete(p.name);
        else next.add(p.name);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setError(null);
    setIsSaving(true);
    try {
      await roleApi.syncPermissions(role.id, Array.from(selected));
      navigate('/roles');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || t('error_occurred'));
    } finally {
      setIsSaving(false);
    }
  };

  const isSuperAdmin = role?.name === 'super_admin';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) {
    return <p className="text-center text-muted-foreground py-12">{t('no_data')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/roles" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t(`role_${role.name}`, { defaultValue: role.name.replace(/_/g, ' ') })}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground" dir="ltr">{role.name}</span>
              {role.is_system && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Lock className="w-3 h-3" />
                  {t('system_role')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Can permission="roles.update">
          <Button onClick={handleSave} disabled={isSaving || isSuperAdmin} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('save_permissions')}
          </Button>
        </Can>
      </div>

      {isSuperAdmin && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm">
          {t('super_admin_locked_message')}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {t('permissions_selected_count', { count: selected.size })}
          </p>
        </div>
        <PermissionMatrix
          groups={groups}
          selected={selected}
          onToggle={togglePerm}
          onToggleResource={toggleResource}
          readOnly={isSuperAdmin}
        />
      </div>
    </div>
  );
}
