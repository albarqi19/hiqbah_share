import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { packagingApi, roastingApi } from '@/api';
import type { PackagingLot, RoastBatch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PackageCheck, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', packed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };

export function PackagingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [lots, setLots] = useState<PackagingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ crop_id: '', roast_batch_id: '', package_size: '250', bags_count: '', roasted_weight_used_kg: '' });
  const [saving, setSaving] = useState(false);
  const [approvedBatches, setApprovedBatches] = useState<RoastBatch[]>([]);

  const fetchLots = async () => {
    setIsLoading(true);
    try { const { data } = await packagingApi.list({ include: 'crop,roastBatch,packer', per_page: 50 }); setLots(data.data); } catch { toast.error(t('error')); } finally { setIsLoading(false); }
  };

  const fetchApprovedBatches = async () => {
    try {
      const { data } = await roastingApi.queue({ 'filter[status]': 'approved', include: 'crop', per_page: 100 });
      setApprovedBatches(data.data);
    } catch {}
  };

  useEffect(() => { fetchLots(); fetchApprovedBatches(); }, []);

  const handleCreate = async () => {
    if (!form.roast_batch_id) { toast.error(isAr ? 'اختر باتش التحميص' : 'Select a roast batch'); return; }
    setSaving(true);
    try {
      await packagingApi.create({
        crop_id: parseInt(form.crop_id),
        roast_batch_id: parseInt(form.roast_batch_id),
        package_size: form.package_size,
        bags_count: parseInt(form.bags_count),
        roasted_weight_used_kg: parseFloat(form.roasted_weight_used_kg),
        packed_by: JSON.parse(localStorage.getItem('user') || '{}').id || 1,
      });
      setShowForm(false); setForm({ crop_id: '', roast_batch_id: '', package_size: '250', bags_count: '', roasted_weight_used_kg: '' });
      toast.success(isAr ? 'تم إنشاء لوت التعبئة' : 'Packaging lot created');
      await fetchLots();
    } catch { toast.error(t('error')); } finally { setSaving(false); }
  };

  const handleComplete = async (id: number) => {
    try { await packagingApi.complete(id); toast.success(isAr ? 'تم إكمال التعبئة' : 'Packaging completed'); await fetchLots(); } catch { toast.error(t('error')); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><PackageCheck className="w-7 h-7" />{t('packaging_lots')}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('create_packaging')}</button>
      </div>

      {isLoading ? (<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t('lot_number')}</TableHead><TableHead>{t('crop')}</TableHead><TableHead>{t('package_size')}</TableHead>
              <TableHead>{t('bags_count_label')}</TableHead><TableHead>{t('status')}</TableHead><TableHead>{t('actions')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {lots.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('no_data')}</TableCell></TableRow>) : (
                lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-mono text-sm">{lot.lot_number}</TableCell>
                    <TableCell><span className="font-mono text-xs text-muted-foreground">{lot.crop?.serial_number}</span><br /><span className="text-sm">{isAr ? lot.crop?.name_ar : lot.crop?.name}</span></TableCell>
                    <TableCell>{lot.package_size}g</TableCell>
                    <TableCell className="font-bold">{lot.bags_count}</TableCell>
                    <TableCell><Badge className={statusColors[lot.status]}>{isAr ? lot.status_label : lot.status_label_en}</Badge></TableCell>
                    <TableCell>
                      {lot.status !== 'completed' && (<button onClick={() => handleComplete(lot.id)} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"><CheckCircle2 className="w-3 h-3" />{t('complete_packaging')}</button>)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{t('create_packaging')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? 'باتش التحميص' : 'Roast Batch'}</label>
                <select value={form.roast_batch_id} onChange={e => { const batch = approvedBatches.find(b => b.id === Number(e.target.value)); setForm(p => ({ ...p, roast_batch_id: e.target.value, crop_id: batch ? String(batch.crop_id) : '' })); }} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">{isAr ? 'اختر باتش...' : 'Select batch...'}</option>
                  {approvedBatches.map(b => (<option key={b.id} value={b.id}>{b.batch_number} — {isAr ? b.crop?.name_ar : b.crop?.name} ({b.roasted_weight_kg}kg)</option>))}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">{t('package_size')}</label><select value={form.package_size} onChange={e => setForm(p => ({ ...p, package_size: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="250">250g</option><option value="500">500g</option><option value="1000">1kg</option></select></div>
              <div><label className="block text-sm font-medium mb-1">{t('bags_count_label')}</label><input type="number" value={form.bags_count} onChange={e => setForm(p => ({ ...p, bags_count: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('roasted_weight_kg')} ({t('kg')})</label><input type="number" step="0.01" value={form.roasted_weight_used_kg} onChange={e => setForm(p => ({ ...p, roasted_weight_used_kg: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={saving || !form.crop_id || !form.bags_count} className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
