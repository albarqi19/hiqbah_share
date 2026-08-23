import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '@/api';
import type { Supplier } from '@/types';
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
import { SupplierFormDialog } from './SupplierFormDialog';

export function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data } = await supplierApi.list();
      setSuppliers(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    await supplierApi.delete(id);
    fetchSuppliers();
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchSuppliers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('suppliers')}</h1>
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
                <TableHead>{t('country')}</TableHead>
                <TableHead>{t('contact_person')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-24">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.country}</TableCell>
                    <TableCell>{supplier.contact_person || '—'}</TableCell>
                    <TableCell dir="ltr">{supplier.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
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

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
        onSaved={handleSaved}
      />
    </div>
  );
}
