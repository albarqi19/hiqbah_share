import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MessageSquareWarning, Plus } from 'lucide-react';
import client from '@/api/client';

interface Complaint {
  id: number; subject: string; description: string; severity: string; status: string;
  customer?: { name: string; name_ar: string } | null;
  crop?: { serial_number: string; name: string } | null;
  creator?: { name: string; name_ar: string };
  resolution: string | null; created_at: string;
}

const severityColors: Record<string, string> = { low: 'bg-accent text-foreground', medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
const statusColors: Record<string, string> = { open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', investigating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', resolved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', closed: 'bg-accent text-muted-foreground' };

export function ComplaintsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', severity: 'medium', crop_id: '', customer_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try { const { data } = await client.get('/complaints', { params: { include: 'customer,crop,creator', per_page: 50 } }); const items = data.data?.data ?? data.data ?? []; setComplaints(Array.isArray(items) ? items : []); } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { subject: form.subject, description: form.description, severity: form.severity };
      if (form.crop_id) payload.crop_id = parseInt(form.crop_id);
      if (form.customer_id) payload.customer_id = parseInt(form.customer_id);
      await client.post('/complaints', payload);
      setShowForm(false); setForm({ subject: '', description: '', severity: 'medium', crop_id: '', customer_id: '' });
      await fetchComplaints();
    } catch {} finally { setSaving(false); }
  };

  const handleResolve = async (id: number) => {
    const resolution = prompt(isAr ? 'أدخل الحل:' : 'Enter resolution:');
    if (!resolution) return;
    try { await client.put(`/complaints/${id}/resolve`, { resolution }); await fetchComplaints(); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><MessageSquareWarning className="w-7 h-7" />{isAr ? 'الشكاوى' : 'Complaints'}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{isAr ? 'شكوى جديدة' : 'New Complaint'}</button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{isAr ? 'الموضوع' : 'Subject'}</TableHead>
              <TableHead>{isAr ? 'الخطورة' : 'Severity'}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('customer')}</TableHead>
              <TableHead>{t('crop')}</TableHead>
              <TableHead>{t('created_at')}</TableHead>
              <TableHead>{t('actions')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {complaints.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('no_data')}</TableCell></TableRow> : (
                complaints.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.subject}</TableCell>
                    <TableCell><Badge className={severityColors[c.severity]}>{c.severity}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{isAr ? c.customer?.name_ar : c.customer?.name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.crop?.serial_number || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {c.status === 'open' && <button onClick={() => handleResolve(c.id)} className="text-xs text-green-600 dark:text-green-400 hover:underline">{isAr ? 'حل' : 'Resolve'}</button>}
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
            <h2 className="text-lg font-bold">{isAr ? 'شكوى جديدة' : 'New Complaint'}</h2>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder={isAr ? 'الموضوع' : 'Subject'} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={isAr ? 'الوصف' : 'Description'} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={saving || !form.subject} className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
