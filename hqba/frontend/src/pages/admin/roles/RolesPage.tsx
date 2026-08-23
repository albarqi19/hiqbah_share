import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { roleApi } from '@/api';
import type { Role } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { Can } from '@/components/Can';
import { RoleFormDialog } from './RoleFormDialog';

export function RolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const fetchRoles = () => {
    setIsLoading(true);
    roleApi.list().then(({ data }) => {
      setRoles(data.data);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleAdd = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await roleApi.delete(role.id);
      fetchRoles();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || t('error_occurred'));
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchRoles();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          {t('roles_management')}
        </h1>
        <Can permission="roles.create">
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('add_role')}
          </Button>
        </Can>
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
                <TableHead>{t('role_name')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('permissions_count')}</TableHead>
                <TableHead>{t('users_count')}</TableHead>
                <TableHead className="w-40">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      {t(`role_${role.name}`, { defaultValue: role.name.replace(/_/g, ' ') })}
                      <span className="text-xs text-muted-foreground ms-2" dir="ltr">{role.name}</span>
                    </TableCell>
                    <TableCell>
                      {role.is_system ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="w-3 h-3" />
                          {t('system_role')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t('custom_role')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{role.permissions_count ?? 0}</TableCell>
                    <TableCell>{role.users_count ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Can permission="roles.view">
                          <Link
                            to={`/roles/${role.id}/permissions`}
                            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                            title={t('manage_permissions')}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Link>
                        </Can>
                        <Can permission="roles.update">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            disabled={role.is_system}
                            title={role.is_system ? t('system_role') : t('edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Can>
                        <Can permission="roles.delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-700"
                            disabled={role.is_system}
                            title={role.is_system ? t('system_role') : t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={editingRole}
        onSaved={handleSaved}
      />
    </div>
  );
}
