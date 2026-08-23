import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '@/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import { UserFormDialog } from './UserFormDialog';
import { UserPermissionsDialog } from './UserPermissionsDialog';
import { Can } from '@/components/Can';

export function UsersPage() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permsDialogOpen, setPermsDialogOpen] = useState(false);
  const [permsUser, setPermsUser] = useState<User | null>(null);

  const fetchUsers = () => {
    setIsLoading(true);
    userApi.list({ include: 'branch,roles' }).then(({ data }) => {
      setUsers(data.data);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    await userApi.delete(id);
    fetchUsers();
  };

  const handleToggle = async (id: number) => {
    await userApi.toggleActive(id);
    fetchUsers();
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchUsers();
  };

  const handleManagePerms = (user: User) => {
    setPermsUser(user);
    setPermsDialogOpen(true);
  };

  const handlePermsSaved = () => {
    setPermsDialogOpen(false);
    fetchUsers();
  };

  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('users')}</h1>
        <Can permission="users.create">
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('add')}
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
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead>{t('roles')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-28">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {isAr ? user.name_ar : user.name}
                    </TableCell>
                    <TableCell dir="ltr">{user.email}</TableCell>
                    <TableCell>
                      {user.branch
                        ? (isAr ? user.branch.name_ar : user.branch.name)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {t(`role_${role}`, { defaultValue: role.replace(/_/g, ' ') })}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Can permission="users.update">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} title={t('edit')}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Can>
                        <Can permission="roles.assign">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleManagePerms(user)}
                            title={t('extra_permissions_title')}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        </Can>
                        <Can permission="users.update">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleToggle(user.id)}
                            title={user.is_active ? t('inactive') : t('active')}
                          >
                            {user.is_active
                              ? <ToggleRight className="w-5 h-5 text-green-600" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground/70" />
                            }
                          </Button>
                        </Can>
                        <Can permission="users.delete">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                            title={t('delete')}
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

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSaved={handleSaved}
      />

      <UserPermissionsDialog
        open={permsDialogOpen}
        onOpenChange={setPermsDialogOpen}
        user={permsUser}
        onSaved={handlePermsSaved}
      />
    </div>
  );
}
