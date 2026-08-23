import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { equipmentApi } from '@/api';
import type { Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { EquipmentFormDialog } from './EquipmentFormDialog';

export function EquipmentPage() {
  const { t, i18n } = useTranslation();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  const fetchEquipment = () => {
    setIsLoading(true);
    equipmentApi.list({ include: 'branch' }).then(({ data }) => {
      setEquipment(data.data);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchEquipment(); }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    await equipmentApi.delete(id);
    fetchEquipment();
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchEquipment();
  };

  const isAr = i18n.language === 'ar';

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'maintenance': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('equipment')}</h1>
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
                <TableHead>{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead>{t('brand')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-24">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{t(item.type)}</TableCell>
                    <TableCell>{isAr ? item.branch?.name_ar : item.branch?.name}</TableCell>
                    <TableCell>{item.brand || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(item.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {t(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(item.id)}
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

      <EquipmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={editingItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
