import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customerApi } from '@/api/customers';
import { orderApi } from '@/api/orders';
import { salesApi } from '@/api/sales';
import client from '@/api/client';
import type { Customer, Order, Lead } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowRight, ArrowLeft, Building2, Phone, Mail, MapPin, User, CreditCard, Tag, ShoppingCart, Users, FileText } from 'lucide-react';

interface SalesRepUser {
  id: number;
  name: string;
  name_ar: string;
}

const TIER_STYLES: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  silver: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  vip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sales_review: 'bg-blue-100 text-blue-700',
  inventory_check: 'bg-cyan-100 text-cyan-700',
  accounting: 'bg-indigo-100 text-indigo-700',
  sales_confirm: 'bg-blue-100 text-blue-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  allocated: 'bg-teal-100 text-teal-700',
  in_production: 'bg-orange-100 text-orange-700',
  packing: 'bg-orange-100 text-orange-700',
  partially_shipped: 'bg-amber-100 text-amber-700',
  shipped: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-200 text-red-800',
};

function formatSAR(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Riyadh' }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }).format(new Date(dateStr));
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Assign rep dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [salesReps, setSalesReps] = useState<SalesRepUser[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [assigningRep, setAssigningRep] = useState(false);
  const [repsLoading, setRepsLoading] = useState(false);

  const customerId = Number(id);

  const fetchCustomer = async () => {
    try {
      const { data } = await customerApi.get(customerId);
      setCustomer(data.data);
    } catch {
      // handle error silently
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await orderApi.list({ 'filter[customer_id]': customerId, per_page: 50 });
      setOrders(data.data);
    } catch {
      // handle error silently
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const { data } = await salesApi.listLeads({ 'filter[converted_customer_id]': customerId, per_page: 50 });
      setLeads(data.data);
    } catch {
      // handle error silently
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchCustomer();
      setIsLoading(false);
    };
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const fetchSalesReps = async () => {
    setRepsLoading(true);
    try {
      const { data } = await client.get('/users', { params: { 'filter[role]': 'sales_rep', per_page: 100 } });
      setSalesReps(data.data || []);
    } catch {
      // handle error silently
    } finally {
      setRepsLoading(false);
    }
  };

  const handleOpenAssignDialog = () => {
    setSelectedRepId(customer?.sales_rep_id ?? null);
    setShowAssignDialog(true);
    fetchSalesReps();
  };

  const handleAssignRep = async () => {
    if (!selectedRepId) return;
    setAssigningRep(true);
    try {
      await salesApi.assignRep(customerId, selectedRepId);
      await fetchCustomer();
      setShowAssignDialog(false);
    } catch {
      // handle error silently
    } finally {
      setAssigningRep(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'orders' && orders.length === 0) {
      fetchOrders();
    } else if (value === 'leads' && leads.length === 0) {
      fetchLeads();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('back_to_customers')}
        </button>
        <div className="text-center py-12 text-muted-foreground">{t('customer_not_found')}</div>
      </div>
    );
  }

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <BackArrow className="w-4 h-4" />
        {t('back_to_customers')}
      </button>

      {/* Profile Card */}
      <Card className="bg-card rounded-xl shadow-sm border p-6">
        <div className="flex flex-col gap-6">
          {/* Header row: Name + badges */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {isAr ? customer.name_ar : customer.name}
              </h1>
              {customer.company && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {customer.company}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={customer.type === 'internal' ? 'default' : 'outline'}
                className={customer.type === 'internal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}
              >
                {t(customer.type)}
              </Badge>
              <Badge className={TIER_STYLES[customer.customer_tier] || TIER_STYLES.standard}>
                {t(`tier_${customer.customer_tier}`)}
              </Badge>
              <Badge className={customer.is_active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }>
                {customer.is_active ? t('active') : t('inactive')}
              </Badge>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoItem icon={<Phone className="w-4 h-4" />} label={t('phone')} value={customer.phone} />
            <InfoItem icon={<Mail className="w-4 h-4" />} label={t('email')} value={customer.email} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label={t('city')} value={customer.city} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label={t('address')} value={customer.address} />
            <InfoItem icon={<FileText className="w-4 h-4" />} label={t('tax_number')} value={customer.tax_number} />
            <InfoItem icon={<CreditCard className="w-4 h-4" />} label={t('credit_limit')} value={formatSAR(customer.credit_limit)} />
            <InfoItem icon={<Tag className="w-4 h-4" />} label={t('payment_terms')} value={customer.payment_terms ? t(`payment_terms_${customer.payment_terms}`) : null} />
          </div>

          {/* Sales Rep section */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('sales_rep')}
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {customer.sales_rep
                    ? (isAr ? customer.sales_rep.name_ar : customer.sales_rep.name)
                    : (isAr ? 'غير معين' : 'Not Assigned')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {t('price_list')}: {customer.price_list
                    ? (isAr ? customer.price_list.name_ar : customer.price_list.name)
                    : '—'}
                </span>
              </div>
              <button
                onClick={handleOpenAssignDialog}
                className="px-3 py-1.5 text-xs font-medium border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                {customer.sales_rep_id ? t('change_rep') : t('assign_rep')}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="orders" onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" />
            {t('orders')}
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {t('pre_contract_history')}
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {t('additional_info')}
          </TabsTrigger>
        </TabsList>

        {/* Orders tab */}
        <TabsContent value="orders">
          <Card className="bg-card rounded-xl shadow-sm border">
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {t('no_orders')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('order_number')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('total')}</TableHead>
                    <TableHead>{t('payment_status')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/orders/${order.id}`)}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <Badge className={ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}>
                          {isAr ? order.status_label : order.status_label_en}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatSAR(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-700'}>
                          {t(`payment_${order.payment_status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Pre-Contract History (Leads) tab */}
        <TabsContent value="leads">
          <Card className="bg-card rounded-xl shadow-sm border p-6">
            {leadsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {t('no_lead_history')}
              </div>
            ) : (
              <div className="space-y-6">
                {leads.map((lead) => (
                  <div key={lead.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {isAr ? (lead.company_name_ar || lead.company_name) : lead.company_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {lead.contact_name} {lead.source ? `(${t(`lead_source_${lead.source}`)})` : ''}
                        </p>
                      </div>
                      <Badge className={lead.stage === 'converted'
                        ? 'bg-green-100 text-green-700'
                        : lead.stage === 'lost'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }>
                        {isAr ? lead.stage_label : lead.stage_label_en}
                      </Badge>
                    </div>

                    {/* Stage timeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TimelineStep
                        label={t('contacted_at')}
                        date={lead.contacted_at}
                        completed={!!lead.contacted_at}
                      />
                      <TimelineStep
                        label={t('quoted_at')}
                        date={lead.quoted_at}
                        completed={!!lead.quoted_at}
                      />
                      <TimelineStep
                        label={t('converted_at')}
                        date={lead.converted_at}
                        completed={!!lead.converted_at}
                      />
                    </div>

                    {lead.estimated_monthly_kg && (
                      <p className="text-sm text-muted-foreground">
                        {t('estimated_monthly_kg')}: <span className="font-medium text-foreground">{lead.estimated_monthly_kg} kg</span>
                      </p>
                    )}

                    {lead.notes && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t('notes')}</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes}</p>
                      </div>
                    )}

                    {lead.lost_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">{t('lost_reason')}</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{lead.lost_reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Additional Info tab */}
        <TabsContent value="info">
          <Card className="bg-card rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {customer.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t('notes')}</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {customer.notes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('created_at')}</p>
                  <p className="text-sm font-medium">{formatDateTime(customer.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('updated_at')}</p>
                  <p className="text-sm font-medium">{formatDateTime(customer.updated_at)}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Rep Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-foreground">
              {customer.sales_rep_id ? t('change_rep') : t('assign_rep')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('select_sales_rep')}</p>

            {repsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <select
                value={selectedRepId ?? ''}
                onChange={(e) => setSelectedRepId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">{t('select_rep_placeholder')}</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {isAr ? rep.name_ar : rep.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAssignDialog(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAssignRep}
                disabled={assigningRep || !selectedRepId}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50 transition-colors hover:bg-primary/90"
              >
                {assigningRep ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable info row with icon, label, and value */
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

/** Timeline step for lead history */
function TimelineStep({ label, date, completed }: { label: string; date: string | null | undefined; completed: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg p-2 ${completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/30'}`}>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{formatDateTime(date)}</p>
      </div>
    </div>
  );
}
