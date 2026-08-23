import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { auditApi } from '@/api/audits';
import { branchApi } from '@/api';
import type { Branch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2, ClipboardCheck, Plus, ArrowLeft, CheckCircle2, Lock, Eye,
} from 'lucide-react';

interface AuditItem {
  id: number;
  crop_id: number;
  item_type: string;
  system_quantity: number;
  actual_quantity: number | null;
  variance: number | null;
  notes: string | null;
  crop?: { serial_number: string; name: string; name_ar: string };
}

interface Audit {
  id: number;
  branch_id: number;
  audit_type: string;
  status: string;
  items_count: number;
  counted_items: number;
  total_variance: number | null;
  created_at: string;
  completed_at: string | null;
  branch?: { name: string; name_ar: string };
  creator?: { name: string; name_ar: string };
  items?: AuditItem[];
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  closed: 'bg-accent text-muted-foreground',
};

const auditTypes = ['green', 'roasted', 'finished', 'bar', 'full'] as const;

export function InventoryAuditsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [audits, setAudits] = useState<Audit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail view
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ branch_id: '', audit_type: 'full' });
  const [creating, setCreating] = useState(false);

  // Count item
  const [countingItemId, setCountingItemId] = useState<number | null>(null);
  const [countQty, setCountQty] = useState('');
  const [countNotes, setCountNotes] = useState('');
  const [counting, setCounting] = useState(false);

  // Action states
  const [acting, setActing] = useState(false);

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await auditApi.list({ include: 'branch,creator', per_page: 50 });
      const items = (data.data as any)?.data ?? data.data ?? [];
      setAudits(Array.isArray(items) ? items : []);
    } catch {
      toast.error(isAr ? 'فشل تحميل الجرد' : 'Failed to load audits');
    } finally {
      setIsLoading(false);
    }
  }, [isAr]);

  const fetchBranches = useCallback(async () => {
    try {
      const { data } = await branchApi.list({ per_page: 100 });
      setBranches(data.data);
    } catch {
      // silently
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAudits(), fetchBranches()]);
  }, [fetchAudits, fetchBranches]);

  const fetchAuditDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const { data } = await auditApi.get(id);
      setSelectedAudit(data.data);
    } catch {
      toast.error(isAr ? 'فشل تحميل تفاصيل الجرد' : 'Failed to load audit details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.branch_id) return;
    setCreating(true);
    try {
      await auditApi.create({
        branch_id: parseInt(createForm.branch_id),
        audit_type: createForm.audit_type,
      });
      toast.success(isAr ? 'تم إنشاء الجرد بنجاح' : 'Audit created successfully');
      setCreateOpen(false);
      setCreateForm({ branch_id: '', audit_type: 'full' });
      await fetchAudits();
    } catch {
      toast.error(isAr ? 'فشل إنشاء الجرد' : 'Failed to create audit');
    } finally {
      setCreating(false);
    }
  };

  const handleCountItem = async () => {
    if (!selectedAudit || !countingItemId || countQty === '') return;
    setCounting(true);
    try {
      await auditApi.countItem(selectedAudit.id, countingItemId, {
        actual_quantity: parseFloat(countQty),
        notes: countNotes || undefined,
      });
      toast.success(isAr ? 'تم تسجيل العدد' : 'Count recorded');
      setCountingItemId(null);
      setCountQty('');
      setCountNotes('');
      await fetchAuditDetail(selectedAudit.id);
    } catch {
      toast.error(isAr ? 'فشل تسجيل العدد' : 'Failed to record count');
    } finally {
      setCounting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAudit) return;
    setActing(true);
    try {
      await auditApi.approve(selectedAudit.id);
      toast.success(isAr ? 'تم اعتماد الجرد' : 'Audit approved');
      await fetchAuditDetail(selectedAudit.id);
      await fetchAudits();
    } catch {
      toast.error(isAr ? 'فشل اعتماد الجرد' : 'Failed to approve audit');
    } finally {
      setActing(false);
    }
  };

  const handleClose = async () => {
    if (!selectedAudit) return;
    setActing(true);
    try {
      await auditApi.close(selectedAudit.id);
      toast.success(isAr ? 'تم إغلاق الجرد' : 'Audit closed');
      await fetchAuditDetail(selectedAudit.id);
      await fetchAudits();
    } catch {
      toast.error(isAr ? 'فشل إغلاق الجرد' : 'Failed to close audit');
    } finally {
      setActing(false);
    }
  };

  const auditTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      green: { ar: 'أخضر', en: 'Green' },
      roasted: { ar: 'محمص', en: 'Roasted' },
      finished: { ar: 'منتج نهائي', en: 'Finished' },
      bar: { ar: 'بار', en: 'Bar' },
      full: { ar: 'شامل', en: 'Full' },
    };
    return isAr ? labels[type]?.ar ?? type : labels[type]?.en ?? type;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      open: { ar: 'مفتوح', en: 'Open' },
      approved: { ar: 'معتمد', en: 'Approved' },
      closed: { ar: 'مغلق', en: 'Closed' },
    };
    return isAr ? labels[status]?.ar ?? status : labels[status]?.en ?? status;
  };

  // ── Detail View ──
  if (selectedAudit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedAudit(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7" />
              {isAr ? 'تفاصيل الجرد' : 'Audit Details'} #{selectedAudit.id}
            </h1>
            <Badge className={statusColors[selectedAudit.status]}>
              {statusLabel(selectedAudit.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedAudit.status === 'open' && (
              <Button
                onClick={handleApprove}
                disabled={acting}
                className="bg-green-600 hover:bg-green-700"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <CheckCircle2 className="w-4 h-4 me-1" />}
                {isAr ? 'اعتماد' : 'Approve'}
              </Button>
            )}
            {selectedAudit.status === 'approved' && (
              <Button
                onClick={handleClose}
                disabled={acting}
                variant="outline"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Lock className="w-4 h-4 me-1" />}
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            )}
          </div>
        </div>

        {/* Audit Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoCard label={isAr ? 'الفرع' : 'Branch'} value={isAr ? selectedAudit.branch?.name_ar : selectedAudit.branch?.name} />
          <InfoCard label={isAr ? 'النوع' : 'Type'} value={auditTypeLabel(selectedAudit.audit_type)} />
          <InfoCard label={isAr ? 'التاريخ' : 'Date'} value={new Date(selectedAudit.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')} />
          <InfoCard
            label={isAr ? 'التقدم' : 'Progress'}
            value={`${selectedAudit.counted_items ?? 0} / ${selectedAudit.items_count ?? 0}`}
          />
        </div>

        {/* Items Table */}
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? 'المحصول' : 'Crop'}</TableHead>
                  <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                  <TableHead>{isAr ? 'كمية النظام' : 'System Qty'}</TableHead>
                  <TableHead>{isAr ? 'الكمية الفعلية' : 'Actual Qty'}</TableHead>
                  <TableHead>{isAr ? 'الفرق' : 'Variance'}</TableHead>
                  <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                  {selectedAudit.status === 'open' && (
                    <TableHead>{t('actions')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!selectedAudit.items || selectedAudit.items.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedAudit.items.map((item) => {
                    const variance = item.actual_quantity !== null
                      ? item.actual_quantity - item.system_quantity
                      : null;
                    const isEditing = countingItemId === item.id;
                    return (
                      <TableRow key={item.id} className={variance !== null && variance !== 0 ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}>
                        <TableCell>
                          <div className="font-mono text-xs text-muted-foreground">{item.crop?.serial_number}</div>
                          <div className="text-sm">{isAr ? item.crop?.name_ar : item.crop?.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{auditTypeLabel(item.item_type)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.system_quantity}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <input
                              type="number"
                              value={countQty}
                              onChange={(e) => setCountQty(e.target.value)}
                              className="w-24 border border-border rounded px-2 py-1 text-sm bg-background text-foreground"
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                          ) : (
                            <span className={item.actual_quantity !== null ? 'font-medium' : 'text-muted-foreground/70'}>
                              {item.actual_quantity !== null ? item.actual_quantity : '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {variance !== null ? (
                            <span className={`font-bold text-sm ${variance > 0 ? 'text-green-600 dark:text-green-400' : variance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              value={countNotes}
                              onChange={(e) => setCountNotes(e.target.value)}
                              placeholder={isAr ? 'ملاحظات...' : 'Notes...'}
                              className="w-full border border-border rounded px-2 py-1 text-sm bg-background text-foreground"
                            />
                          ) : (
                            item.notes || '—'
                          )}
                        </TableCell>
                        {selectedAudit.status === 'open' && (
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  onClick={handleCountItem}
                                  disabled={counting || countQty === ''}
                                  className="h-7 text-xs"
                                >
                                  {counting ? <Loader2 className="w-3 h-3 animate-spin" /> : (isAr ? 'حفظ' : 'Save')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setCountingItemId(null); setCountQty(''); setCountNotes(''); }}
                                  className="h-7 text-xs"
                                >
                                  {t('cancel')}
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setCountingItemId(item.id);
                                  setCountQty(item.actual_quantity !== null ? String(item.actual_quantity) : '');
                                  setCountNotes(item.notes || '');
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                {isAr ? 'عد' : 'Count'}
                              </button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7" />
          {isAr ? 'جرد المخزون' : 'Inventory Audits'}
        </h1>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {isAr ? 'جرد جديد' : 'New Audit'}
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
                <TableHead>#</TableHead>
                <TableHead>{isAr ? 'الفرع' : 'Branch'}</TableHead>
                <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{isAr ? 'التقدم' : 'Progress'}</TableHead>
                <TableHead>{isAr ? 'إجمالي الفرق' : 'Total Variance'}</TableHead>
                <TableHead>{t('created_at')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-mono text-sm">{audit.id}</TableCell>
                    <TableCell className="text-sm">
                      {isAr ? audit.branch?.name_ar : audit.branch?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {auditTypeLabel(audit.audit_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[audit.status]}>
                        {statusLabel(audit.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-accent rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${audit.items_count > 0 ? ((audit.counted_items ?? 0) / audit.items_count) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {audit.counted_items ?? 0}/{audit.items_count}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {audit.total_variance !== null ? (
                        <span className={`font-bold text-sm ${audit.total_variance > 0 ? 'text-green-600 dark:text-green-400' : audit.total_variance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {audit.total_variance > 0 ? '+' : ''}{audit.total_variance}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(audit.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => fetchAuditDetail(audit.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Eye className="w-3 h-3" />
                        {isAr ? 'عرض' : 'View'}
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Audit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? 'جرد جديد' : 'New Audit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'الفرع' : 'Branch'}
              </label>
              <select
                value={createForm.branch_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, branch_id: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="">{isAr ? 'اختر الفرع' : 'Select branch'}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {isAr ? b.name_ar : b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'نوع الجرد' : 'Audit Type'}
              </label>
              <select
                value={createForm.audit_type}
                onChange={(e) => setCreateForm((p) => ({ ...p, audit_type: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                {auditTypes.map((type) => (
                  <option key={type} value={type}>
                    {auditTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.branch_id}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              {isAr ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground mt-1">{value || '—'}</div>
    </div>
  );
}
