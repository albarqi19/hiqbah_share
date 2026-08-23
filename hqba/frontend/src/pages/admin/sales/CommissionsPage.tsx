import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { salesApi } from '@/api/sales';
import type { Commission, CommissionStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Check, X, CreditCard, CheckCircle2 } from 'lucide-react';
import { userApi } from '@/api/users';

const STATUSES: CommissionStatus[] = ['pending', 'approved', 'paid', 'reversed', 'cancelled'];

const statusColor: Record<CommissionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  reversed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function formatSAR(amount: number): string {
  return amount.toLocaleString('en-SA', { minimumFractionDigits: 2 }) + ' \u0631.\u0633';
}

export function CommissionsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; name_ar: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRep, setFilterRep] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Bulk pay reference
  const [bulkPayRef, setBulkPayRef] = useState('');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<Commission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Mark paid dialog
  const [paidTarget, setPaidTarget] = useState<Commission | null>(null);
  const [paidRef, setPaidRef] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);

  const fetchCommissions = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 200, include: 'order,salesRep' };
      if (filterStatus) params['filter[status]'] = filterStatus;
      if (filterRep) params['filter[sales_rep_id]'] = filterRep;
      const { data } = await salesApi.listCommissions(params);
      setCommissions(data.data);
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
    Promise.all([fetchCommissions(), fetchUsers()]);
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [filterStatus, filterRep]);

  // Summary calculations
  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let paid = 0;
    let total = 0;
    for (const c of commissions) {
      total += c.commission_amount;
      if (c.status === 'pending') pending += c.commission_amount;
      else if (c.status === 'approved') approved += c.commission_amount;
      else if (c.status === 'paid') paid += c.commission_amount;
    }
    return { pending, approved, paid, total };
  }, [commissions]);

  // Selection helpers
  const selectedCommissions = useMemo(
    () => commissions.filter(c => selectedIds.has(c.id)),
    [commissions, selectedIds],
  );

  const allSelectedPending = selectedCommissions.length > 0 && selectedCommissions.every(c => c.status === 'pending');
  const allSelectedApproved = selectedCommissions.length > 0 && selectedCommissions.every(c => c.status === 'approved');

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === commissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(commissions.map(c => c.id)));
    }
  };

  // Actions
  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      await salesApi.approveCommission(id);
      await fetchCommissions();
      setSelectedIds(new Set());
    } catch {
      // silent
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await salesApi.rejectCommission(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      await fetchCommissions();
      setSelectedIds(new Set());
    } catch {
      // silent
    } finally {
      setRejecting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!paidTarget) return;
    setMarkingPaid(true);
    try {
      await salesApi.markCommissionPaid(paidTarget.id, paidRef || undefined);
      setPaidTarget(null);
      setPaidRef('');
      await fetchCommissions();
      setSelectedIds(new Set());
    } catch {
      // silent
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    try {
      await salesApi.bulkApprove([...selectedIds]);
      setSelectedIds(new Set());
      await fetchCommissions();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    setBulkLoading(true);
    try {
      await salesApi.bulkMarkPaid([...selectedIds], bulkPayRef || undefined);
      setSelectedIds(new Set());
      setBulkPayRef('');
      await fetchCommissions();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US');
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
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <DollarSign className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t('commissions')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {commissions.length} {t('commission_records')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('total_pending')}</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 tabular-nums mt-1">
                {formatSAR(summary.pending)}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400">
              <Loader2 className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('total_approved')}</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                {formatSAR(summary.approved)}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('total_paid')}</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {formatSAR(summary.paid)}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <CreditCard className="size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('total_earned')}</p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                {formatSAR(summary.total)}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <DollarSign className="size-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
        >
          <option value="">{t('all_statuses')}</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{t(s)}</option>
          ))}
        </select>

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
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap bg-muted/50 border border-border rounded-lg px-4 py-3">
          <span className="text-sm font-medium">
            {selectedIds.size} {t('selected')}
          </span>

          {allSelectedPending && (
            <button
              onClick={handleBulkApprove}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              {t('approve_selected')}
            </button>
          )}

          {allSelectedApproved && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bulkPayRef}
                onChange={e => setBulkPayRef(e.target.value)}
                placeholder={t('payment_reference') as string}
                className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card w-48"
              />
              <button
                onClick={handleBulkMarkPaid}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
                {t('mark_paid')}
              </button>
            </div>
          )}

          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-muted-foreground hover:text-foreground ms-auto"
          >
            {t('clear_selection')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={commissions.length > 0 && selectedIds.size === commissions.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>{t('order_number')}</TableHead>
              <TableHead>{t('sales_rep')}</TableHead>
              <TableHead>{t('order_total')}</TableHead>
              <TableHead>{t('commission_amount')}</TableHead>
              <TableHead>{t('method')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('created_at')}</TableHead>
              <TableHead>{t('approved_at')}</TableHead>
              <TableHead>{t('paid_at')}</TableHead>
              <TableHead>{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  {t('no_commissions')}
                </TableCell>
              </TableRow>
            ) : (
              commissions.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={() => toggleSelect(c.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {c.order?.order_number ?? `#${c.order_id}`}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.sales_rep
                      ? (isAr ? c.sales_rep.name_ar : c.sales_rep.name)
                      : '\u2014'}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {formatSAR(c.order_total)}
                  </TableCell>
                  <TableCell className="text-sm font-bold tabular-nums">
                    {formatSAR(c.commission_amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.calculation_method === 'percentage'
                      ? `${c.calculation_value}%`
                      : `${formatSAR(c.calculation_value)} ${t('fixed')}`}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[c.status]}>
                      {isAr ? c.status_label : c.status_label_en}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.approved_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.paid_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(c.id)}
                            disabled={actionLoadingId === c.id}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                            title={t('approve') as string}
                          >
                            {actionLoadingId === c.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            {t('approve')}
                          </button>
                          <button
                            onClick={() => { setRejectTarget(c); setRejectReason(''); }}
                            className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                            title={t('reject') as string}
                          >
                            <X className="size-3" />
                            {t('reject')}
                          </button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <button
                          onClick={() => { setPaidTarget(c); setPaidRef(''); }}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                          title={t('mark_paid') as string}
                        >
                          <CreditCard className="size-3" />
                          {t('mark_paid')}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{t('reject_commission')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('order')}: {rejectTarget.order?.order_number ?? `#${rejectTarget.order_id}`}
              {' \u2014 '}
              {formatSAR(rejectTarget.commission_amount)}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">{t('reason')}</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder={t('enter_reject_reason') as string}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="size-4 animate-spin" /> : t('reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Dialog */}
      {paidTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{t('mark_commission_paid')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('order')}: {paidTarget.order?.order_number ?? `#${paidTarget.order_id}`}
              {' \u2014 '}
              {formatSAR(paidTarget.commission_amount)}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment_reference')}</label>
              <input
                type="text"
                value={paidRef}
                onChange={e => setPaidRef(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={t('enter_payment_reference') as string}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPaidTarget(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={markingPaid}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {markingPaid ? <Loader2 className="size-4 animate-spin" /> : t('mark_paid')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
