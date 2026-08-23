import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { qualityApi } from '@/api/quality';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';

const sourceColors: Record<string, string> = { barista: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', customer: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', wholesale: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };

export function MarketFeedbackPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ source: 'barista', feedback_type: 'general', rating: '', comment: '', crop_id: '', customer_name: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        qualityApi.feedback.list({ include: 'crop,creator', per_page: 50 }),
        qualityApi.feedback.summary(),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (listRes.data as any).data?.data ?? (listRes.data as any).data ?? [];
      setItems(Array.isArray(raw) ? raw : []);
      setSummary(summaryRes.data.data);
    } catch { toast.error(isAr ? 'فشل تحميل البيانات' : 'Failed to load data'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.comment.trim()) return;
    setSaving(true);
    try {
      await qualityApi.feedback.create({
        ...form,
        crop_id: form.crop_id ? parseInt(form.crop_id) : null,
        rating: form.rating ? parseInt(form.rating) : null,
      });
      setShowForm(false);
      setForm({ source: 'barista', feedback_type: 'general', rating: '', comment: '', crop_id: '', customer_name: '' });
      toast.success(isAr ? 'تم إضافة الملاحظة' : 'Feedback added');
      await fetchData();
    } catch { toast.error(isAr ? 'فشل' : 'Failed'); } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-7 h-7" />{isAr ? 'مراقبة السوق' : 'Market Monitoring'}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{isAr ? 'إضافة ملاحظة' : 'Add Feedback'}</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{summary.total}</div><div className="text-sm text-muted-foreground">{isAr ? 'إجمالي الملاحظات' : 'Total Feedback'}</div></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold flex items-center justify-center gap-1">{summary.avg_rating}<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /></div><div className="text-sm text-muted-foreground">{isAr ? 'متوسط التقييم' : 'Avg Rating'}</div></CardContent></Card>
          {summary.by_source?.map((s: any) => (
            <Card key={s.source}><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{s.count}</div><div className="text-sm text-muted-foreground">{s.source}</div></CardContent></Card>
          ))}
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>{isAr ? 'المصدر' : 'Source'}</TableHead>
            <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
            <TableHead>{isAr ? 'التقييم' : 'Rating'}</TableHead>
            <TableHead>{isAr ? 'التعليق' : 'Comment'}</TableHead>
            <TableHead>{isAr ? 'المحصول' : 'Crop'}</TableHead>
            <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{isAr ? 'لا توجد بيانات' : 'No data'}</TableCell></TableRow>
            ) : items.map((fb: any) => (
              <TableRow key={fb.id}>
                <TableCell><Badge className={sourceColors[fb.source] || ''}>{fb.source}</Badge></TableCell>
                <TableCell>{fb.feedback_type}</TableCell>
                <TableCell>{fb.rating ? <span className="flex items-center gap-1">{fb.rating}<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /></span> : '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{fb.comment}</TableCell>
                <TableCell className="font-mono text-xs">{fb.crop?.serial_number || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{isAr ? 'إضافة ملاحظة سوق' : 'Add Market Feedback'}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">{isAr ? 'المصدر' : 'Source'}</label>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="barista">{isAr ? 'باريستا' : 'Barista'}</option>
                  <option value="customer">{isAr ? 'عميل' : 'Customer'}</option>
                  <option value="wholesale">{isAr ? 'تاجر جملة' : 'Wholesale'}</option>
                </select></div>
              <div><label className="block text-sm font-medium mb-1">{isAr ? 'النوع' : 'Type'}</label>
                <select value={form.feedback_type} onChange={e => setForm(p => ({ ...p, feedback_type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="general">{isAr ? 'عام' : 'General'}</option>
                  <option value="taste">{isAr ? 'المذاق' : 'Taste'}</option>
                  <option value="aroma">{isAr ? 'الرائحة' : 'Aroma'}</option>
                  <option value="packaging">{isAr ? 'التعبئة' : 'Packaging'}</option>
                </select></div>
              <div><label className="block text-sm font-medium mb-1">{isAr ? 'التقييم' : 'Rating'} (1-5)</label>
                <input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">{isAr ? 'التعليق' : 'Comment'} *</label>
                <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} /></div>
              <div><label className="block text-sm font-medium mb-1">{isAr ? 'اسم العميل' : 'Customer Name'}</label>
                <input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleSubmit} disabled={saving || !form.comment.trim()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
