import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { salesApi } from '@/api/sales';
import client from '@/api/client';
import type { CommissionRule } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Settings2 } from 'lucide-react';

const TYPES = ['percentage', 'fixed_per_order', 'fixed_per_kg'] as const;
const TIERS = ['standard', 'silver', 'gold', 'vip'] as const;

const typeColor: Record<string, string> = {
  percentage: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  fixed_per_order: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  fixed_per_kg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const tierColor: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  silver: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  vip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

interface FormState {
  name: string;
  name_ar: string;
  type: string;
  value: string;
  sales_rep_id: string;
  customer_tier: string;
  min_order_total: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: '',
  name_ar: '',
  type: 'percentage',
  value: '',
  sales_rep_id: '',
  customer_tier: '',
  min_order_total: '',
  is_active: true,
};

function formatSAR(amount: number): string {
  return amount.toLocaleString('en-SA', { minimumFractionDigits: 2 }) + ' \u0631.\u0633';
}

export function CommissionRulesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; name_ar: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const { data } = await salesApi.listRules();
      setRules(data.data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchRules(),
      client.get('/users', { params: { per_page: 100 } }).then(r => setUsers(r.data.data)),
    ]);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        name_ar: form.name_ar,
        type: form.type,
        value: parseFloat(form.value),
        is_active: form.is_active,
      };
      if (form.sales_rep_id) payload.sales_rep_id = parseInt(form.sales_rep_id, 10);
      else payload.sales_rep_id = null;
      if (form.customer_tier) payload.customer_tier = form.customer_tier;
      else payload.customer_tier = null;
      if (form.min_order_total) payload.min_order_total = parseFloat(form.min_order_total);
      else payload.min_order_total = null;

      if (editId) {
        await salesApi.updateRule(editId, payload);
      } else {
        await salesApi.createRule(payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      await fetchRules();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule: CommissionRule) => {
    setForm({
      name: rule.name,
      name_ar: rule.name_ar,
      type: rule.type,
      value: String(rule.value),
      sales_rep_id: rule.sales_rep_id ? String(rule.sales_rep_id) : '',
      customer_tier: rule.customer_tier || '',
      min_order_total: rule.min_order_total != null ? String(rule.min_order_total) : '',
      is_active: rule.is_active,
    });
    setEditId(rule.id);
    setShowForm(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  const formatValue = (rule: CommissionRule): string => {
    if (rule.type === 'percentage') return `${rule.value}%`;
    return formatSAR(rule.value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('commission_rules')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rules.length} {t('rules')}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('add_commission_rule')}
        </button>
      </div>

      {/* Table */}
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
                <TableHead>{t('value')}</TableHead>
                <TableHead>{t('sales_rep')}</TableHead>
                <TableHead>{t('customer_tier')}</TableHead>
                <TableHead>{t('min_order_total')}</TableHead>
                <TableHead>{t('active')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {t('no_commission_rules')}
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {isAr ? rule.name_ar : rule.name}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColor[rule.type]}>
                        {isAr ? rule.type_label : rule.type_label_en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums font-medium">
                      {formatValue(rule)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rule.sales_rep
                        ? (isAr ? rule.sales_rep.name_ar : rule.sales_rep.name)
                        : (isAr ? '\u0627\u0644\u0643\u0644' : 'All')}
                    </TableCell>
                    <TableCell>
                      {rule.customer_tier ? (
                        <Badge className={tierColor[rule.customer_tier]}>
                          {t(rule.customer_tier)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {rule.min_order_total != null
                        ? formatSAR(rule.min_order_total)
                        : <span className="text-muted-foreground">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        rule.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }>
                        {rule.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-xs text-primary hover:underline"
                      >
                        {t('edit')}
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold">
              {editId ? t('edit_commission_rule') : t('add_commission_rule')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Name EN */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('name_en')}</label>
                <input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {/* Name AR */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('name_ar')}</label>
                <input
                  value={form.name_ar}
                  onChange={e => setForm(prev => ({ ...prev, name_ar: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  dir="rtl"
                />
              </div>
              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('type')}</label>
                <select
                  value={form.type}
                  onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {TYPES.map(tp => (
                    <option key={tp} value={tp}>{t(tp)}</option>
                  ))}
                </select>
              </div>
              {/* Value */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('value')}</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form.value}
                  onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {/* Sales Rep */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('sales_rep')}</label>
                <select
                  value={form.sales_rep_id}
                  onChange={e => setForm(prev => ({ ...prev, sales_rep_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{isAr ? '\u0627\u0644\u0643\u0644' : 'All'}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{isAr ? u.name_ar : u.name}</option>
                  ))}
                </select>
              </div>
              {/* Customer Tier */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('customer_tier')}</label>
                <select
                  value={form.customer_tier}
                  onChange={e => setForm(prev => ({ ...prev, customer_tier: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">&mdash;</option>
                  {TIERS.map(tier => (
                    <option key={tier} value={tier}>{t(tier)}</option>
                  ))}
                </select>
              </div>
              {/* Min Order Total */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('min_order_total')}</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form.min_order_total}
                  onChange={e => setForm(prev => ({ ...prev, min_order_total: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={t('optional') as string}
                />
              </div>
              {/* Is Active */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium">{t('active')}</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.value}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
