import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { salesApi } from '@/api/sales';
import type { Lead, LeadStage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Users, LayoutGrid, List, Phone, Mail, MapPin, Building2, ArrowRight } from 'lucide-react';
import { userApi } from '@/api/users';

type ViewMode = 'kanban' | 'table';

const STAGES: LeadStage[] = ['new_lead', 'contacted', 'quoted', 'converted', 'lost'];

const NEXT_STAGE: Partial<Record<LeadStage, LeadStage>> = {
  new_lead: 'contacted',
  contacted: 'quoted',
  quoted: 'converted',
};

const SOURCES = ['referral', 'website', 'exhibition', 'cold_call', 'social_media'] as const;

const stageColor: Record<LeadStage, string> = {
  new_lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  quoted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const stageDot: Record<LeadStage, string> = {
  new_lead: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  quoted: 'bg-purple-500',
  converted: 'bg-emerald-500',
  lost: 'bg-red-500',
};

const emptyForm = {
  company_name: '',
  company_name_ar: '',
  contact_name: '',
  contact_name_ar: '',
  email: '',
  phone: '',
  city: '',
  source: '' as string,
  estimated_monthly_kg: '',
  sales_rep_id: '',
  notes: '',
};

const emptyConvertForm = {
  name: '',
  name_ar: '',
  email: '',
  phone: '',
  city: '',
  company: '',
  type: 'external' as string,
};

export function LeadsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; name_ar: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Filters
  const [filterRep, setFilterRep] = useState('');
  const [filterSource, setFilterSource] = useState('');

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Lost dialog
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [markingLost, setMarkingLost] = useState(false);

  // Convert dialog
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [convertForm, setConvertForm] = useState(emptyConvertForm);
  const [converting, setConverting] = useState(false);

  // Transitioning state
  const [transitioningId, setTransitioningId] = useState<number | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 200, include: 'salesRep' };
      if (filterRep) params['filter[sales_rep_id]'] = filterRep;
      if (filterSource) params['filter[source]'] = filterSource;
      const { data } = await salesApi.listLeads(params);
      setLeads(data.data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await userApi.list({ per_page: 100 });
      setUsers(data.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    Promise.all([fetchLeads(), fetchUsers()]);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [filterRep, filterSource]);

  const grouped = useMemo(() => {
    const groups: Record<LeadStage, Lead[]> = {
      new_lead: [],
      contacted: [],
      quoted: [],
      converted: [],
      lost: [],
    };
    leads.forEach(l => {
      if (groups[l.stage]) groups[l.stage].push(l);
    });
    return groups;
  }, [leads]);

  // Handlers
  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.estimated_monthly_kg) payload.estimated_monthly_kg = Number(form.estimated_monthly_kg);
      if (form.sales_rep_id) payload.sales_rep_id = Number(form.sales_rep_id);
      if (!form.source) delete payload.source;
      await salesApi.createLead(payload);
      setShowCreate(false);
      setForm(emptyForm);
      await fetchLeads();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (lead: Lead) => {
    const next = NEXT_STAGE[lead.stage];
    if (!next) return;
    setTransitioningId(lead.id);
    try {
      await salesApi.transitionLead(lead.id, next);
      await fetchLeads();
    } catch {
      // silent
    } finally {
      setTransitioningId(null);
    }
  };

  const handleMarkLost = async () => {
    if (!lostLead) return;
    setMarkingLost(true);
    try {
      await salesApi.markLeadLost(lostLead.id, lostReason);
      setLostLead(null);
      setLostReason('');
      await fetchLeads();
    } catch {
      // silent
    } finally {
      setMarkingLost(false);
    }
  };

  const openConvert = (lead: Lead) => {
    setConvertLead(lead);
    setConvertForm({
      name: lead.company_name,
      name_ar: lead.company_name_ar || '',
      email: lead.email || '',
      phone: lead.phone || '',
      city: lead.city || '',
      company: lead.company_name,
      type: 'external',
    });
  };

  const handleConvert = async () => {
    if (!convertLead) return;
    setConverting(true);
    try {
      await salesApi.convertLead(convertLead.id, convertForm);
      setConvertLead(null);
      setConvertForm(emptyConvertForm);
      await fetchLeads();
    } catch {
      // silent
    } finally {
      setConverting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('leads')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {leads.length} {isAr ? 'عميل محتمل' : 'leads'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
            >
              <LayoutGrid className="size-4" />
              {t('kanban')}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
            >
              <List className="size-4" />
              {t('table')}
            </button>
          </div>

          <button
            onClick={() => { setShowCreate(true); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            <Plus className="size-4" />
            {t('add_lead')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterRep}
          onChange={e => setFilterRep(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
        >
          <option value="">{t('all_sales_reps')}</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{isAr ? u.name_ar : u.name}</option>
          ))}
        </select>

        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
        >
          <option value="">{t('all_sources')}</option>
          {SOURCES.map(s => (
            <option key={s} value={s}>{t(s)}</option>
          ))}
        </select>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {STAGES.map(stage => {
            const items = grouped[stage];
            return (
              <div key={stage} className="flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${stageDot[stage]}`} />
                    <h3 className="font-semibold text-sm">{t(stage)}</h3>
                  </div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map(lead => (
                    <Card key={lead.id} className="p-3 space-y-2">
                      <div className="font-semibold text-sm leading-snug">
                        {isAr ? (lead.company_name_ar || lead.company_name) : lead.company_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isAr ? (lead.contact_name_ar || lead.contact_name) : lead.contact_name}
                      </div>

                      {lead.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 opacity-60" />
                          {lead.city}
                        </div>
                      )}

                      {lead.estimated_monthly_kg && (
                        <div className="text-xs text-muted-foreground">
                          {lead.estimated_monthly_kg} {t('kg_month')}
                        </div>
                      )}

                      {lead.sales_rep && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground/70 pt-1 border-t border-border/40">
                          <Building2 className="size-3 opacity-50" />
                          {isAr ? lead.sales_rep.name_ar : lead.sales_rep.name}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-foreground">
                            <Phone className="size-3.5" />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-foreground">
                            <Mail className="size-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Action buttons */}
                      {stage !== 'converted' && stage !== 'lost' && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                          {NEXT_STAGE[stage] && (
                            <button
                              onClick={() => handleTransition(lead)}
                              disabled={transitioningId === lead.id}
                              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                            >
                              {transitioningId === lead.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <ArrowRight className="size-3" />
                              )}
                              {t(NEXT_STAGE[stage]!)}
                            </button>
                          )}
                          {stage === 'quoted' && (
                            <button
                              onClick={() => openConvert(lead)}
                              className="text-xs text-emerald-600 hover:underline"
                            >
                              {t('convert_to_customer')}
                            </button>
                          )}
                          <button
                            onClick={() => { setLostLead(lead); setLostReason(''); }}
                            className="text-xs text-red-500 hover:underline ms-auto"
                          >
                            {t('mark_lost')}
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('company')}</TableHead>
                <TableHead>{t('contact')}</TableHead>
                <TableHead>{t('city')}</TableHead>
                <TableHead>{t('stage')}</TableHead>
                <TableHead>{t('source')}</TableHead>
                <TableHead>{t('est_monthly_kg')}</TableHead>
                <TableHead>{t('sales_rep')}</TableHead>
                <TableHead>{t('created_at')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {t('no_leads')}
                  </TableCell>
                </TableRow>
              ) : (
                leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {isAr ? (lead.company_name_ar || lead.company_name) : lead.company_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isAr ? (lead.contact_name_ar || lead.contact_name) : lead.contact_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.city || '—'}</TableCell>
                    <TableCell>
                      <Badge className={stageColor[lead.stage]}>{t(lead.stage)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.source ? t(lead.source) : '—'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {lead.estimated_monthly_kg ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.sales_rep ? (isAr ? lead.sales_rep.name_ar : lead.sales_rep.name) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lead.stage !== 'converted' && lead.stage !== 'lost' && (
                          <>
                            {NEXT_STAGE[lead.stage] && (
                              <button
                                onClick={() => handleTransition(lead)}
                                disabled={transitioningId === lead.id}
                                className="text-xs text-primary hover:underline disabled:opacity-50"
                              >
                                {transitioningId === lead.id ? (
                                  <Loader2 className="size-3 animate-spin inline" />
                                ) : (
                                  t(NEXT_STAGE[lead.stage]!)
                                )}
                              </button>
                            )}
                            {lead.stage === 'quoted' && (
                              <button
                                onClick={() => openConvert(lead)}
                                className="text-xs text-emerald-600 hover:underline"
                              >
                                {t('convert')}
                              </button>
                            )}
                            <button
                              onClick={() => { setLostLead(lead); setLostReason(''); }}
                              className="text-xs text-red-500 hover:underline"
                            >
                              {t('lost')}
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Lead Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{t('add_lead')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('company_name_en')}</label>
                <input
                  value={form.company_name}
                  onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('company_name_ar')}</label>
                <input
                  value={form.company_name_ar}
                  onChange={e => setForm(p => ({ ...p, company_name_ar: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('contact_name_en')}</label>
                <input
                  value={form.contact_name}
                  onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('contact_name_ar')}</label>
                <input
                  value={form.contact_name_ar}
                  onChange={e => setForm(p => ({ ...p, contact_name_ar: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('city')}</label>
                <input
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('source')}</label>
                <select
                  value={form.source}
                  onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t('select_source')}</option>
                  {SOURCES.map(s => (
                    <option key={s} value={s}>{t(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('est_monthly_kg')}</label>
                <input
                  type="number"
                  value={form.estimated_monthly_kg}
                  onChange={e => setForm(p => ({ ...p, estimated_monthly_kg: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('sales_rep')}</label>
                <select
                  value={form.sales_rep_id}
                  onChange={e => setForm(p => ({ ...p, sales_rep_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t('select_sales_rep')}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{isAr ? u.name_ar : u.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{t('notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.company_name || !form.contact_name}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Lost Dialog */}
      {lostLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{t('mark_lost')}</h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? (lostLead.company_name_ar || lostLead.company_name) : lostLead.company_name}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">{t('lost_reason')}</label>
              <textarea
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder={t('enter_lost_reason') as string}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setLostLead(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleMarkLost}
                disabled={markingLost || !lostReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {markingLost ? <Loader2 className="size-4 animate-spin" /> : t('mark_lost')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Customer Dialog */}
      {convertLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold">{t('convert_to_customer')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('convert_lead_description')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('name_en')}</label>
                <input
                  value={convertForm.name}
                  onChange={e => setConvertForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('name_ar')}</label>
                <input
                  value={convertForm.name_ar}
                  onChange={e => setConvertForm(p => ({ ...p, name_ar: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('company')}</label>
                <input
                  value={convertForm.company}
                  onChange={e => setConvertForm(p => ({ ...p, company: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('type')}</label>
                <select
                  value={convertForm.type}
                  onChange={e => setConvertForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="external">{t('external')}</option>
                  <option value="internal">{t('internal')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={convertForm.email}
                  onChange={e => setConvertForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                <input
                  value={convertForm.phone}
                  onChange={e => setConvertForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{t('city')}</label>
                <input
                  value={convertForm.city}
                  onChange={e => setConvertForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConvertLead(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConvert}
                disabled={converting || !convertForm.name}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {converting ? <Loader2 className="size-4 animate-spin" /> : t('convert_to_customer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
