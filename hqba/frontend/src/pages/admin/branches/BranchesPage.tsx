import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { branchApi } from '@/api';
import type { Branch } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { BranchFormDialog } from './BranchFormDialog';

export function BranchesPage() {
  const { t, i18n } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const { data } = await branchApi.list({ include: 'users,equipment' });
      setBranches(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAdd = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    await branchApi.delete(id);
    fetchBranches();
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchBranches();
  };

  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('branches')}</h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('add')}
        </Button>
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
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('city')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('users')}</TableHead>
                <TableHead>{t('equipment')}</TableHead>
                <TableHead className="w-24">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      {isAr ? branch.name_ar : branch.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(branch.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{branch.city || '—'}</TableCell>
                    <TableCell dir="ltr">{branch.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                        {branch.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>{branch.users_count ?? 0}</TableCell>
                    <TableCell>{branch.equipment_count ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(branch)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(branch.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <BranchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editingBranch}
        onSaved={handleSaved}
      />
    </div>
  );
}
