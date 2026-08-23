import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { customerApi } from '@/api';
import type { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Plus, RefreshCw } from 'lucide-react';

export function CustomersPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', name_ar: '', type: 'external', company: '', email: '', phone: '', city: '', tax_number: '' });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try { const { data } = await customerApi.list({ per_page: 100 }); setCustomers(data.data); } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) { await customerApi.update(editId, form); }
      else { await customerApi.create(form); }
      setShowForm(false); setEditId(null); setForm({ name: '', name_ar: '', type: 'external', company: '', email: '', phone: '', city: '', tax_number: '' });
      await fetchCustomers();
    } catch {} finally { setSaving(false); }
  };

  const handleSync = async () => { try { await customerApi.syncBranches(); await fetchCustomers(); } catch {} };

  const handleEdit = (c: Customer) => {
    setForm({ name: c.name, name_ar: c.name_ar, type: c.type, company: c.company || '', email: c.email || '', phone: c.phone || '', city: c.city || '', tax_number: c.tax_number || '' });
    setEditId(c.id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="w-7 h-7" />{t('customers')}</h1>
        <div className="flex gap-2">
          <button onClick={handleSync} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"><RefreshCw className="w-4 h-4" />{t('sync_branches')}</button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', name_ar: '', type: 'external', company: '', email: '', phone: '', city: '', tax_number: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('add_customer')}</button>
        </div>
      </div>

      {isLoading ? (<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t('name')}</TableHead><TableHead>{t('type')}</TableHead><TableHead>{t('company')}</TableHead>
              <TableHead>{t('city')}</TableHead><TableHead>{t('phone')}</TableHead><TableHead>{t('actions')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {customers.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('no_customers')}</TableCell></TableRow>) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{isAr ? c.name_ar : c.name}</TableCell>
                    <TableCell><Badge variant={c.type === 'internal' ? 'default' : 'outline'} className={c.type === 'internal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}>{t(c.type)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.company || '—'}</TableCell>
                    <TableCell className="text-sm">{c.city || '—'}</TableCell>
                    <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                    <TableCell><button onClick={() => handleEdit(c)} className="text-xs text-primary hover:underline">{t('edit')}</button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold">{editId ? t('edit_customer') : t('add_customer')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">{t('name_en')}</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('name_ar')}</label><input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" dir="rtl" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('type')}</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="external">{t('external')}</option><option value="internal">{t('internal')}</option></select></div>
              <div><label className="block text-sm font-medium mb-1">{t('company')}</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('email')}</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('phone')}</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('city')}</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('tax_number')}</label><input value={form.tax_number} onChange={e => setForm(p => ({ ...p, tax_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
