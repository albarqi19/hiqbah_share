"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, ShoppingCart, Users2, Wallet, Percent, Target, Info, AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

// Phase 1A (File 16) scope: read-only views built from existing GET /api/orders
// and GET /api/customers data only. No rep assignment, commission, AR aging, or
// lead model exists in this system yet — see the Commissions/Leads panels below.

type SalesOrderItem = { quantityKg: number; productionStatus: string };

type SalesOrder = {
  id: string;
  orderNumber: number;
  customerId: string;
  customer: { id: string; name: string };
  paymentStatus: string;
  createdAt: string;
  items: SalesOrderItem[];
};

type SalesCustomer = {
  id: string;
  name: string;
  nameAr: string | null;
  phone: string | null;
  _count: { orders: number };
};

type FetchResult<T> = { status: "ok"; data: T } | { status: "error"; code: number };

async function fetchSalesData<T>(url: string): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { status: "error", code: res.status };
    return { status: "ok", data: (await res.json()) as T };
  } catch {
    return { status: "error", code: 0 };
  }
}

type TabKey = "overview" | "ordersSummary" | "portfolio" | "payments" | "commissions" | "leads";

const TABS: { key: TabKey; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { key: "overview",      labelKey: "salesTabOverview",      icon: BarChart3 },
  { key: "ordersSummary", labelKey: "salesTabOrdersSummary", icon: ShoppingCart },
  { key: "portfolio",     labelKey: "salesTabPortfolio",     icon: Users2 },
  { key: "payments",      labelKey: "salesTabPayments",      icon: Wallet },
  { key: "commissions",   labelKey: "salesTabCommissions",   icon: Percent },
  { key: "leads",         labelKey: "salesTabLeads",         icon: Target },
];

function StatusPill({ labelKey, cls }: { labelKey: TranslationKey; cls: string }) {
  const { t } = useI18n();
  return <span className={`status-badge ${cls}`}>{t(labelKey)}</span>;
}

function paymentPillClass(status: string) {
  if (status === "Paid") return "status-completed";
  if (status === "Partial Paid") return "status-pending";
  return "status-not-paid";
}

function paymentLabelKey(status: string): TranslationKey {
  if (status === "Paid") return "statusPaid";
  if (status === "Partial Paid") return "statusPartialPaid";
  return "statusNotPaid";
}

function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800">
      <Info size={15} className="flex-shrink-0 mt-0.5" />
      <p>{children}</p>
    </div>
  );
}

function ComingSoonPanel({ icon: Icon, titleKey, noticeKey }: { icon: React.ElementType; titleKey: TranslationKey; noticeKey: TranslationKey }) {
  const { t } = useI18n();
  return (
    <div className="text-center py-14 bg-white rounded-2xl border border-border">
      <Icon size={36} className="mx-auto mb-3 text-brown/30" />
      <p className="font-bold text-charcoal mb-2">{t(titleKey)}</p>
      <p className="text-xs text-brown/60 max-w-md mx-auto leading-relaxed">{t(noticeKey)}</p>
    </div>
  );
}

function AccessBlocked({ messageKey }: { messageKey: TranslationKey }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
      <AlertTriangle size={15} className="flex-shrink-0" />
      <p>{t(messageKey)}</p>
    </div>
  );
}

export default function SalesPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<SalesOrder[] | null>(null);
  const [customers, setCustomers] = useState<SalesCustomer[] | null>(null);
  const [ordersBlocked, setOrdersBlocked] = useState(false);
  const [customersBlocked, setCustomersBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ordersRes, customersRes] = await Promise.all([
        fetchSalesData<SalesOrder[]>("/api/orders"),
        fetchSalesData<SalesCustomer[]>("/api/customers"),
      ]);
      if (ordersRes.status === "ok") setOrders(ordersRes.data); else setOrdersBlocked(true);
      if (customersRes.status === "ok") setCustomers(customersRes.data); else setCustomersBlocked(true);
      setLoading(false);
    })();
  }, []);

  const totalKgOrdered = useMemo(
    () => (orders ?? []).reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantityKg, 0), 0),
    [orders]
  );

  const recentOrders = useMemo(() => (orders ?? []).slice(0, 10), [orders]);

  const lastOrderByCustomer = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of orders ?? []) {
      const existing = map.get(o.customerId);
      if (!existing || new Date(o.createdAt) > new Date(existing)) map.set(o.customerId, o.createdAt);
    }
    return map;
  }, [orders]);

  const portfolioRows = useMemo(
    () =>
      (customers ?? [])
        .map((c) => ({ ...c, lastOrderAt: lastOrderByCustomer.get(c.id) ?? null }))
        .sort((a, b) => b._count.orders - a._count.orders),
    [customers, lastOrderByCustomer]
  );

  const outstandingOrders = useMemo(
    () => (orders ?? []).filter((o) => o.paymentStatus !== "Paid"),
    [orders]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal">{t("sales")}</h1>
        <p className="text-brown text-sm font-medium">{t("salesSubtitle")}</p>
      </div>

      <NoticeBanner>{t("salesOrgWideNotice")}</NoticeBanner>

      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
              tab === key ? "text-orange border-b-2 border-orange" : "text-brown hover:text-charcoal"
            }`}
          >
            <Icon size={15} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {ordersBlocked && <AccessBlocked messageKey="salesNoAccessOrders" />}
          {customersBlocked && <AccessBlocked messageKey="salesNoAccessCustomers" />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-brown/60 mb-1">{t("salesTotalOrders")}</p>
              <p className="text-2xl font-extrabold text-charcoal">{orders?.length ?? "—"}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-brown/60 mb-1">{t("salesTotalCustomers")}</p>
              <p className="text-2xl font-extrabold text-charcoal">{customers?.length ?? "—"}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-brown/60 mb-1">{t("salesTotalKgOrdered")}</p>
              <p className="text-2xl font-extrabold text-charcoal">{orders ? totalKgOrdered.toFixed(1) : "—"}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "ordersSummary" && (
        <div className="space-y-4">
          {ordersBlocked ? (
            <AccessBlocked messageKey="salesNoAccessOrders" />
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-cream/50">
                <p className="text-sm font-bold text-charcoal">{t("salesRecentOrders")}</p>
                <a href="/dashboard/orders" className="text-xs font-bold text-orange hover:underline">{t("salesViewAllOrders")}</a>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-center py-8 text-sm text-brown/50">{t("salesNoOrdersYet")}</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-2.5 font-semibold">#{o.orderNumber}</td>
                        <td className="px-4 py-2.5">{o.customer.name}</td>
                        <td className="px-4 py-2.5 text-brown/60">{formatDate(o.createdAt)}</td>
                        <td className="px-4 py-2.5 text-end">
                          <StatusPill labelKey={paymentLabelKey(o.paymentStatus)} cls={paymentPillClass(o.paymentStatus)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="space-y-4">
          {customersBlocked ? (
            <AccessBlocked messageKey="salesNoAccessCustomers" />
          ) : (
            <>
              <NoticeBanner>{t("salesPortfolioNotice")}</NoticeBanner>
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-cream/50">
                  <p className="text-sm font-bold text-charcoal">{t("salesTabPortfolio")}</p>
                  <a href="/dashboard/customers" className="text-xs font-bold text-orange hover:underline">{t("salesViewAllCustomers")}</a>
                </div>
                {portfolioRows.length === 0 ? (
                  <p className="text-center py-8 text-sm text-brown/50">{t("noCustomers")}</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {portfolioRows.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-2.5 font-semibold">{c.name}</td>
                          <td className="px-4 py-2.5 text-brown/60">{c.phone || "—"}</td>
                          <td className="px-4 py-2.5 text-end">{c._count.orders} {t("salesOrderCount")}</td>
                          <td className="px-4 py-2.5 text-end text-brown/60">
                            {c.lastOrderAt ? formatDate(c.lastOrderAt) : t("salesNoOrdersYet")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4">
          {ordersBlocked ? (
            <AccessBlocked messageKey="salesNoAccessOrders" />
          ) : (
            <>
              <NoticeBanner>{t("salesPaymentNotice")}</NoticeBanner>
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-cream/50">
                  <p className="text-sm font-bold text-charcoal">{t("salesOutstandingOrders")}</p>
                </div>
                {outstandingOrders.length === 0 ? (
                  <p className="text-center py-8 text-sm text-brown/50">{t("salesNoOutstanding")}</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {outstandingOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 py-2.5 font-semibold">#{o.orderNumber}</td>
                          <td className="px-4 py-2.5">{o.customer.name}</td>
                          <td className="px-4 py-2.5 text-brown/60">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-2.5 text-end">
                            <StatusPill labelKey={paymentLabelKey(o.paymentStatus)} cls={paymentPillClass(o.paymentStatus)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "commissions" && (
        <ComingSoonPanel icon={Percent} titleKey="salesComingSoon" noticeKey="salesCommissionsNotice" />
      )}

      {tab === "leads" && (
        <ComingSoonPanel icon={Target} titleKey="salesComingSoon" noticeKey="salesLeadsNotice" />
      )}
    </div>
  );
}
