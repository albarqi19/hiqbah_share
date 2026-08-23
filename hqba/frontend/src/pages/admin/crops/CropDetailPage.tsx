import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { cropApi } from '@/api';
import type { Crop, CropStatus, TimelineEvent, GreenCoffeeLot, TrialRoast, CuppingSession, CropPricing, CropMarketing } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  Search,
  Flame,
  Coffee,
  DollarSign,
  Megaphone,
  CheckCircle,
  Clock,
  Map,
  FileText,
  Download,
} from 'lucide-react';
import { CuppingForm } from '@/components/CuppingForm/CuppingForm';

const statusConfig: Record<CropStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  ordered: { variant: 'outline', className: 'text-muted-foreground border-border' },
  received: { variant: 'secondary', className: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40' },
  inspecting: { variant: 'secondary', className: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40' },
  trial_roasting: { variant: 'secondary', className: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40' },
  cupping: { variant: 'secondary', className: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40' },
  approved: { variant: 'default', className: 'bg-green-600' },
  pricing: { variant: 'secondary', className: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/40' },
  marketing: { variant: 'secondary', className: 'text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/40' },
  production_ready: { variant: 'default', className: 'bg-emerald-600' },
  in_production: { variant: 'secondary', className: 'text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40' },
  depleted: { variant: 'outline', className: 'text-muted-foreground border-border' },
  closed: { variant: 'outline', className: 'text-muted-foreground border-border' },
};

const stageIcons: Record<string, React.ReactNode> = {
  purchase_order: <Package className="w-5 h-5" />,
  receiving: <Truck className="w-5 h-5" />,
  inspection: <Search className="w-5 h-5" />,
  trial_roasting: <Flame className="w-5 h-5" />,
  cupping: <Coffee className="w-5 h-5" />,
  pricing: <DollarSign className="w-5 h-5" />,
  marketing: <Megaphone className="w-5 h-5" />,
};

function formatSAR(amount: number): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || '—'}</p>
    </div>
  );
}

export function CropDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setTab = (tab: string) => setSearchParams({ tab });

  const [crop, setCrop] = useState<Crop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [greenLots, setGreenLots] = useState<GreenCoffeeLot[]>([]);
  const [trialRoasts, setTrialRoasts] = useState<TrialRoast[]>([]);
  const [savedCuppings, setSavedCuppings] = useState<CuppingSession[]>([]);
  const [pricing, setPricing] = useState<CropPricing | null>(null);
  const [marketing, setMarketing] = useState<CropMarketing | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [isApprovingPricing, setIsApprovingPricing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Receive form state
  const [receiveForm, setReceiveForm] = useState({ bags_count: 1, expected_weight: 0, actual_weight: 0, arrival_date: new Date().toISOString().split('T')[0] });
  // Trial roast form state
  const [trialForm, setTrialForm] = useState({ sample_weight_grams: 200, green_coffee_lot_id: 0 });

  const isAr = i18n.language === 'ar';

  const fetchCrop = async () => {
    setIsLoading(true);
    try {
      const { data } = await cropApi.get(Number(id));
      setCrop(data.data);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCrop();
  }, [id]);

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (!id) return;
    const cropId = Number(id);

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        switch (activeTab) {
          case 'timeline': {
            const { data } = await cropApi.getTimeline(cropId);
            setTimeline(data.data);
            break;
          }
          case 'green_coffee': {
            const { data } = await cropApi.greenCoffee.listLots({ crop_id: cropId });
            setGreenLots(data.data);
            break;
          }
          case 'trial_roasts': {
            const { data } = await cropApi.trialRoasts.list(cropId);
            setTrialRoasts(data.data);
            break;
          }
          case 'cupping': {
            // Load trial roasts + saved cupping sessions
            if (trialRoasts.length === 0) {
              const { data } = await cropApi.trialRoasts.list(cropId);
              setTrialRoasts(data.data || data);
            }
            const cuppingRes = await cropApi.cupping.list(cropId);
            setSavedCuppings(cuppingRes.data.data || cuppingRes.data);
            break;
          }
          case 'pricing': {
            try {
              const { data } = await cropApi.pricing.get(cropId);
              setPricing(data.data);
            } catch {
              setPricing(null);
            }
            break;
          }
          case 'marketing': {
            try {
              const { data } = await cropApi.marketing.get(cropId);
              setMarketing(data.data);
            } catch {
              setMarketing(null);
            }
            break;
          }
        }
      } catch {
        // error handled silently
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, id]);

  const handleReceive = async () => {
    if (!id || !crop) return;
    setActionLoading(true);
    try {
      await cropApi.greenCoffee.receive({
        crop_id: Number(id),
        purchase_order_id: crop.purchase_order_id,
        bags_count: receiveForm.bags_count,
        expected_weight: receiveForm.expected_weight,
        actual_weight: receiveForm.actual_weight,
        arrival_date: receiveForm.arrival_date,
        received_by: 1, // current user - should come from auth store
      });
      // Reload data
      const { data } = await cropApi.greenCoffee.listLots({ crop_id: Number(id) });
      setGreenLots(data.data);
      fetchCrop(); // refresh crop status
      setReceiveForm({ bags_count: 1, expected_weight: 0, actual_weight: 0, arrival_date: new Date().toISOString().split('T')[0] });
    } catch {
      // error
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTrial = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const lotId = trialForm.green_coffee_lot_id || greenLots[0]?.id;
      if (!lotId) return;
      await cropApi.trialRoasts.create(Number(id), {
        green_coffee_lot_id: lotId,
        roaster_id: 1, // current user
        sample_weight_grams: trialForm.sample_weight_grams,
        roasted_at: new Date().toISOString(),
      });
      const { data } = await cropApi.trialRoasts.list(Number(id));
      setTrialRoasts(data.data);
      fetchCrop();
    } catch {
      // error
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePricing = async () => {
    if (!id) return;
    setIsApprovingPricing(true);
    try {
      await cropApi.pricing.approve(Number(id));
      const { data } = await cropApi.pricing.get(Number(id));
      setPricing(data.data);
    } catch {
      // error handled silently
    } finally {
      setIsApprovingPricing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('no_data')}
      </div>
    );
  }

  const config = statusConfig[crop.status];
  const weightPercent = crop.total_green_weight > 0
    ? Math.round((crop.remaining_green_weight / crop.total_green_weight) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/crops')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                <span className="font-mono">{crop.serial_number}</span>
                <span className="mx-1.5 text-muted-foreground/30">—</span>
                {isAr ? crop.name_ar : crop.name}
              </h1>
              <Badge variant={config.variant} className={config.className}>
                {t(crop.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {crop.origin_country} · {crop.region} · {crop.remaining_green_weight}/{crop.total_green_weight} kg
            </p>
          </div>
        </div>
        <Link to={`/crops/${id}/journey`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Map className="size-4" />
            {isAr ? 'خط سير المحصول' : 'View Journey'}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1 rounded-lg gap-0.5 flex-wrap h-auto">
          <TabsTrigger value="overview" className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('overview')}</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('timeline')}</TabsTrigger>
          <TabsTrigger value="green_coffee" className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('green_coffee')}</TabsTrigger>
          <TabsTrigger value="trial_roasts" disabled={['ordered'].includes(crop.status)} className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('trial_roasts')}
          </TabsTrigger>
          <TabsTrigger value="cupping" disabled={['ordered', 'received', 'inspecting', 'trial_roasting'].includes(crop.status)} className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('cupping')}
          </TabsTrigger>
          <TabsTrigger value="pricing" disabled={['ordered', 'received', 'inspecting', 'trial_roasting', 'cupping'].includes(crop.status)} className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('pricing')}
          </TabsTrigger>
          <TabsTrigger value="marketing" disabled={['ordered', 'received', 'inspecting', 'trial_roasting', 'cupping', 'approved'].includes(crop.status)} className="rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('marketing')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crop Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
                <Package className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{t('crop_info')}</h3>
              </div>
              <div className="divide-y divide-border/50">
                <InfoRow label={t('serial_number')} value={<span className="font-mono">{crop.serial_number}</span>} />
                <InfoRow label={t('origin_country')} value={crop.origin_country} />
                <InfoRow label={t('region')} value={crop.region} />
                <InfoRow label={t('farm')} value={crop.farm} />
                <InfoRow label={t('process')} value={t(crop.process)} />
                <InfoRow label={t('variety')} value={crop.variety} />
                <InfoRow label={t('altitude')} value={crop.altitude} />
                <InfoRow label={t('lot_number')} value={crop.lot_number} />
              </div>
            </div>

            {/* Weight Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
                <Package className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{t('weight_info')}</h3>
              </div>
              <div className="divide-y divide-border/50">
                <InfoRow label={t('total_green_weight')} value={`${crop.total_green_weight} kg`} />
                <InfoRow label={t('remaining_green_weight')} value={`${crop.remaining_green_weight} kg`} />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground text-xs">{t('remaining')}</span>
                  <span className="font-semibold text-sm tabular-nums">{weightPercent}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${weightPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
                <Clock className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{t('status_info')}</h3>
              </div>
              <div className="space-y-3">
                <div className="py-2">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('status')}</span>
                  <div className="mt-1">
                    <Badge variant={config.variant} className={config.className}>
                      {t(crop.status)}
                    </Badge>
                  </div>
                </div>
                {crop.usage_type && (
                  <InfoRow label={t('usage_type')} value={
                    <Badge variant="outline">{t(crop.usage_type)}</Badge>
                  } />
                )}
                {crop.flavor_notes && crop.flavor_notes.length > 0 && (
                  <div className="py-2">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('flavor_notes')}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {crop.flavor_notes.map((note, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4 bg-muted/60 -mx-5 -mt-5 px-5 py-3 rounded-t-xl border-b border-border/50">
                <Truck className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{t('supplier')}</h3>
              </div>
              <div className="divide-y divide-border/50">
                <InfoRow label={t('name')} value={crop.supplier?.name} />
                <InfoRow label={t('country')} value={crop.supplier?.country} />
                <InfoRow label={t('contact_person')} value={crop.supplier?.contact_person} />
                <InfoRow label={t('email')} value={crop.supplier?.email} />
                <InfoRow label={t('phone')} value={crop.supplier?.phone} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          {tabLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('no_data')}</div>
          ) : (
            <div className="relative">
              <div className="absolute start-6 top-0 bottom-0 w-0.5 bg-muted" />
              <div className="space-y-6">
                {timeline.map((event, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 ps-14">
                    <div className="absolute start-0 flex items-center justify-center w-12 h-12 rounded-full bg-card border-2 border-border text-muted-foreground">
                      {stageIcons[event.stage] || <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 bg-card rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{t(event.stage)}</h4>
                        <Badge variant={event.status === 'completed' ? 'default' : 'outline'}
                          className={event.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          {t(event.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.date ? new Date(event.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Green Coffee Tab */}
        <TabsContent value="green_coffee">
          <div className="space-y-4">
            {/* Receive Form */}
            <Card className="border-dashed border-2 border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-600" />
                  {t('receive')} {t('green_coffee')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('bags_count')}</label>
                    <input type="number" min={1} value={receiveForm.bags_count}
                      onChange={(e) => setReceiveForm(p => ({ ...p, bags_count: Number(e.target.value) }))}
                      className="w-full h-9 border rounded-md px-3 text-sm bg-background text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('expected_weight')} (kg)</label>
                    <input type="number" step="0.1" value={receiveForm.expected_weight || ''}
                      onChange={(e) => setReceiveForm(p => ({ ...p, expected_weight: Number(e.target.value) }))}
                      className="w-full h-9 border rounded-md px-3 text-sm bg-background text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('actual_weight')} (kg)</label>
                    <input type="number" step="0.1" value={receiveForm.actual_weight || ''}
                      onChange={(e) => setReceiveForm(p => ({ ...p, actual_weight: Number(e.target.value) }))}
                      className="w-full h-9 border rounded-md px-3 text-sm bg-background text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('arrival_date')}</label>
                    <input type="date" value={receiveForm.arrival_date}
                      onChange={(e) => setReceiveForm(p => ({ ...p, arrival_date: e.target.value }))}
                      className="w-full h-9 border rounded-md px-3 text-sm bg-background text-foreground" />
                  </div>
                  <Button onClick={handleReceive} disabled={actionLoading || !receiveForm.actual_weight} className="gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                    {t('receive')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lots List */}
            {tabLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : greenLots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/60 text-sm">{t('no_data')}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {greenLots.map((lot) => (
                  <Card key={lot.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="font-mono text-sm">{lot.batch_id}</span>
                        <Badge variant={lot.status === 'approved' ? 'default' : 'outline'}
                          className={lot.status === 'approved' ? 'bg-green-600' : lot.status === 'rejected' ? 'text-red-600 border-red-300' : ''}
                        >
                          {t(lot.status)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <InfoRow label={t('bags_count')} value={lot.bags_count} />
                      <div className="grid grid-cols-2 gap-2">
                        <InfoRow label={t('expected_weight')} value={`${lot.expected_weight} kg`} />
                        <InfoRow label={t('actual_weight')} value={`${lot.actual_weight} kg`} />
                      </div>
                      <InfoRow label={t('weight_variance')} value={
                        <span className={Number(lot.weight_variance) < 0 ? 'text-red-600' : 'text-green-600'}>
                          {Number(lot.weight_variance) > 0 ? '+' : ''}{lot.weight_variance} kg
                        </span>
                      } />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Trial Roasts Tab */}
        <TabsContent value="trial_roasts">
          <div className="space-y-4">
            {/* Add Trial Form */}
            {greenLots.length > 0 && (
              <Card className="border-dashed border-2 border-orange-300 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-950/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-600" />
                    {t('add')} {t('trial_roast')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('sample_weight')} (g)</label>
                      <input type="number" min={50} step={10} value={trialForm.sample_weight_grams}
                        onChange={(e) => setTrialForm(p => ({ ...p, sample_weight_grams: Number(e.target.value) }))}
                        className="w-full h-9 border rounded-md px-3 text-sm bg-background text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('green_coffee')} Lot</label>
                      <select value={trialForm.green_coffee_lot_id || greenLots[0]?.id || ''}
                        onChange={(e) => setTrialForm(p => ({ ...p, green_coffee_lot_id: Number(e.target.value) }))}
                        className="w-full h-9 border rounded-md px-3 text-sm bg-background text-foreground">
                        {greenLots.map(lot => (
                          <option key={lot.id} value={lot.id}>{lot.batch_id} ({lot.actual_weight}kg)</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleCreateTrial} disabled={actionLoading} className="gap-2">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                      {t('add')} {t('trial_roast')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {tabLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : trialRoasts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/60 text-sm">
                {greenLots.length === 0 ? t('receive_green_coffee_first') : t('no_data')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trialRoasts.map((trial) => (
                  <Card key={trial.id} className={trial.status === 'selected' ? 'border-green-500 border-2' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{t('trial')} #{trial.trial_number}</span>
                        <Badge
                          variant={trial.status === 'selected' ? 'default' : 'outline'}
                          className={trial.status === 'selected' ? 'bg-green-600' : trial.status === 'completed' ? 'text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700' : ''}
                        >
                          {t(trial.status)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <InfoRow label={t('sample_weight')} value={`${trial.sample_weight_grams}g`} />
                        <InfoRow label={t('roasted_weight')} value={trial.roasted_weight_grams ? `${trial.roasted_weight_grams}g` : '—'} />
                      </div>
                      {trial.roast_loss_percent !== null && (
                        <InfoRow label={t('roast_loss')} value={
                          <span className="text-orange-600 font-semibold">{trial.roast_loss_percent}%</span>
                        } />
                      )}
                      {trial.roast_level && (
                        <InfoRow label={t('roast_level')} value={
                          <Badge variant="outline">{t(trial.roast_level)}</Badge>
                        } />
                      )}
                      {trial.charge_temp && <InfoRow label={t('charge_temp')} value={`${trial.charge_temp}°C`} />}
                      {trial.first_crack_time && <InfoRow label={t('first_crack')} value={`${trial.first_crack_time} @ ${trial.first_crack_temp}°C`} />}
                      {trial.total_roast_time && <InfoRow label={t('total_roast_time')} value={trial.total_roast_time} />}

                      {/* Action buttons */}
                      {trial.status === 'in_progress' && (
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-xs text-orange-600 font-medium">{t('complete_trial_roast')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground/60">{t('roasted_weight')} (g)</label>
                              <input type="number" step="0.1" id={`rw-${trial.id}`} defaultValue=""
                                placeholder="170" className="w-full h-8 border rounded px-2 text-sm bg-background text-foreground" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60">{t('roast_level')}</label>
                              <select id={`rl-${trial.id}`} className="w-full h-8 border rounded px-2 text-sm bg-background text-foreground">
                                <option value="light">{t('light')}</option>
                                <option value="medium_light">{t('medium_light')}</option>
                                <option value="medium">{t('medium')}</option>
                                <option value="medium_dark">{t('medium_dark')}</option>
                                <option value="dark">{t('dark')}</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground/60">{t('charge_temp')} °C</label>
                              <input type="number" id={`ct-${trial.id}`} placeholder="200" className="w-full h-8 border rounded px-2 text-sm bg-background text-foreground" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60">{t('first_crack')}</label>
                              <input type="text" id={`fc-${trial.id}`} placeholder="9:30" className="w-full h-8 border rounded px-2 text-sm bg-background text-foreground" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60">{t('drop_temp')} °C</label>
                              <input type="number" id={`dt-${trial.id}`} placeholder="210" className="w-full h-8 border rounded px-2 text-sm bg-background text-foreground" />
                            </div>
                          </div>
                          <Button size="sm" className="w-full gap-2" disabled={actionLoading}
                            onClick={async () => {
                              setActionLoading(true);
                              try {
                                const rw = (document.getElementById(`rw-${trial.id}`) as HTMLInputElement)?.value;
                                const rl = (document.getElementById(`rl-${trial.id}`) as HTMLSelectElement)?.value;
                                const ct = (document.getElementById(`ct-${trial.id}`) as HTMLInputElement)?.value;
                                const fc = (document.getElementById(`fc-${trial.id}`) as HTMLInputElement)?.value;
                                const dt = (document.getElementById(`dt-${trial.id}`) as HTMLInputElement)?.value;
                                await cropApi.trialRoasts.complete(trial.id, {
                                  roasted_weight_grams: Number(rw) || undefined,
                                  roast_level: rl || undefined,
                                  charge_temp: Number(ct) || undefined,
                                  first_crack_time: fc || undefined,
                                  drop_temp: Number(dt) || undefined,
                                });
                                const { data } = await cropApi.trialRoasts.list(Number(id));
                                setTrialRoasts(data.data);
                                fetchCrop();
                              } finally { setActionLoading(false); }
                            }}
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            {t('complete')}
                          </Button>
                        </div>
                      )}

                      {trial.status === 'completed' && (
                        <div className="text-xs text-green-600 text-center pt-1">
                          ✓ {t('completed')} — {isAr ? 'جاهز للتقييم' : 'Ready for cupping'}
                        </div>
                      )}

                      {trial.status === 'selected' && (
                        <div className="text-xs text-emerald-700 font-bold text-center pt-1 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {isAr ? 'أفضل تجربة (اختيرت بناءً على الكبّينغ)' : 'Best trial (selected by cupping score)'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Cupping Tab */}
        <TabsContent value="cupping">
          {/* Saved Cupping Sessions */}
          {savedCuppings.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{t('cupping_session')} — {t('completed')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedCuppings.map((s) => (
                  <Card key={s.id} className="border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/30">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('sample')} #{s.sample_number}</span>
                        <Badge variant="default" className="bg-green-600">{s.final_score?.toFixed(1) || '—'}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                        <span>Frag: {s.fragrance}</span>
                        <span>Aroma: {s.aroma}</span>
                        <span>Flavor: {s.flavor}</span>
                        <span>Acid: {s.acidity}</span>
                        <span>Body: {s.body}</span>
                        <span>After: {s.aftertaste}</span>
                        <span>Bal: {s.balance}</span>
                        <span>Sweet: {s.sweetness}</span>
                        <span>Over: {s.overall_score}</span>
                      </div>
                      {s.flavor_notes && s.flavor_notes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.flavor_notes.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{n}</Badge>
                          ))}
                        </div>
                      )}
                      {s.classification && (
                        <Badge variant="outline" className={
                          s.classification === 'outstanding' ? 'text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-700' :
                            s.classification === 'excellent' ? 'text-green-700 border-green-300 dark:text-green-300 dark:border-green-700' :
                              'text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-700'
                        }>
                          {t(s.classification)}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Decision Buttons */}
              {crop.status === 'cupping' && savedCuppings.some(s => !s.decision) && (
                <Card className="border-2 border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">{t('cupping_decision')}</p>
                    <div className="flex gap-3">
                      <Button className="gap-2 bg-green-600 hover:bg-green-700" disabled={actionLoading}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const lastSession = savedCuppings[savedCuppings.length - 1];
                            await cropApi.cupping.decide(lastSession.id, { decision: 'approved' });
                            fetchCrop();
                            const cuppingRes = await cropApi.cupping.list(Number(id));
                            setSavedCuppings(cuppingRes.data.data || cuppingRes.data);
                            setTab('pricing');
                          } finally { setActionLoading(false); }
                        }}>
                        <CheckCircle className="w-4 h-4" />
                        {t('approve')} — {t('pricing')}
                      </Button>
                      <Button variant="outline" className="gap-2 text-orange-600 border-orange-300" disabled={actionLoading}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const lastSession = savedCuppings[savedCuppings.length - 1];
                            await cropApi.cupping.decide(lastSession.id, { decision: 'retest' });
                            fetchCrop();
                            setTab('trial_roasts');
                          } finally { setActionLoading(false); }
                        }}>
                        {t('retest')}
                      </Button>
                      <Button variant="outline" className="gap-2 text-red-600 border-red-300" disabled={actionLoading}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const lastSession = savedCuppings[savedCuppings.length - 1];
                            await cropApi.cupping.decide(lastSession.id, { decision: 'rejected', reason: 'Quality below standard' });
                            fetchCrop();
                          } finally { setActionLoading(false); }
                        }}>
                        {t('reject')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <hr className="my-4" />
              <h3 className="text-sm font-semibold text-muted-foreground">{t('add_sample')}</h3>
            </div>
          )}

          <CuppingForm
            cropName={isAr ? crop.name_ar : crop.name}
            isBlind={true}
            trialRoasts={trialRoasts}
            onSave={async (samples) => {
              if (!id) return;

              try {
                for (const sample of samples) {
                  await cropApi.cupping.create(Number(id), {
                    trial_roast_id: sample.trialRoastId || trialRoasts[0]?.id,
                    grader_id: 1,
                    scheduled_date: new Date().toISOString().split('T')[0],
                    cups_count: 5,
                    dose_per_cup: 11,
                    sample_number: sample.number,
                    is_blind_cupping: true,
                    fragrance: sample.scores.fragrance,
                    aroma: sample.scores.aroma,
                    flavor: sample.scores.flavor,
                    aftertaste: sample.scores.aftertaste,
                    acidity: sample.scores.acidity,
                    body: sample.scores.body,
                    balance: sample.scores.balance,
                    sweetness: sample.scores.sweetness,
                    uniformity: sample.scores.uniformity,
                    clean_cup: sample.scores.clean_cup,
                    overall_score: sample.scores.overall_score,
                    defects: sample.scores.defects,
                    defect_intensity: sample.scores.defect_intensity,
                    flavor_notes: sample.scores.flavor_notes,
                    notes: sample.scores.notes,
                    status: 'completed',
                  });
                }
                alert(t('success'));
                const cuppingRes = await cropApi.cupping.list(Number(id));
                setSavedCuppings(cuppingRes.data.data || cuppingRes.data);
                fetchCrop();
              } catch (err) {
                console.error('Save cupping failed:', err);
                alert(t('error'));
              }
            }}
          />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          {tabLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !pricing ? (
            <div className="text-center py-12 text-muted-foreground">{t('no_pricing_data')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t('cost_breakdown')}
                    <Badge variant={pricing.status === 'approved' ? 'default' : 'outline'}
                      className={pricing.status === 'approved' ? 'bg-green-600' : ''}
                    >
                      {t(pricing.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label={t('landed_cost_per_kg')} value={formatSAR(pricing.landed_cost_per_kg)} />
                  <InfoRow label={t('green_cost_per_kg')} value={formatSAR(pricing.green_cost_per_kg)} />
                  <InfoRow label={t('roasting_loss_percent')} value={`${pricing.roasting_loss_percent}%`} />
                  <InfoRow label={t('roasting_cost')} value={formatSAR(pricing.roasting_cost_per_kg)} />
                  <InfoRow label={t('packaging_cost')} value={formatSAR(pricing.packaging_cost_per_unit)} />
                  <InfoRow label={t('operation_cost')} value={formatSAR(pricing.operation_cost_per_kg)} />
                  <InfoRow label={t('shipping_cost')} value={formatSAR(pricing.shipping_cost_per_kg)} />
                  <div className="border-t pt-3">
                    <span className="text-sm text-muted-foreground">{t('total_cost_per_kg_roasted')}</span>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400" dir="ltr">
                      {formatSAR(pricing.total_cost_per_kg_roasted)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('retail_prices')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pricing.retail_price_250g !== null && (
                    <InfoRow label={t('retail_price_250g')} value={formatSAR(pricing.retail_price_250g)} />
                  )}
                  {pricing.retail_price_500g !== null && (
                    <InfoRow label={t('retail_price_500g')} value={formatSAR(pricing.retail_price_500g)} />
                  )}
                  {pricing.retail_price_1kg !== null && (
                    <InfoRow label={t('retail_price_1kg')} value={formatSAR(pricing.retail_price_1kg)} />
                  )}
                  {pricing.wholesale_price_kg !== null && (
                    <InfoRow label={t('wholesale_price_kg')} value={formatSAR(pricing.wholesale_price_kg)} />
                  )}
                  {pricing.status === 'pending' && (
                    <div className="pt-4">
                      <Button onClick={handleApprovePricing} disabled={isApprovingPricing} className="gap-2">
                        {isApprovingPricing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {t('approve_pricing')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing">
          {tabLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !marketing ? (
            <div className="text-center py-12 text-muted-foreground">{t('no_marketing_data')}</div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-3">
                {marketing.status === 'draft' && crop.status === 'marketing' && (
                  <Button
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                    onClick={async () => {
                      if (!id) return;
                      setActionLoading(true);
                      try {
                        await cropApi.marketing.approve(Number(id));
                        await fetchCrop();
                        const { data } = await cropApi.marketing.get(Number(id));
                        setMarketing(data.data);
                      } catch {
                        alert(t('error'));
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {isAr ? 'اعتماد التسويق' : 'Approve Marketing'}
                  </Button>
                )}
                {marketing.status === 'approved' && (
                  <Badge className="bg-green-600 text-white py-1 px-3">{isAr ? 'معتمد' : 'Approved'}</Badge>
                )}
                <Button
                  className="gap-2"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!id) return;
                    setActionLoading(true);
                    try {
                      const { data } = await cropApi.marketing.generateLabel(Number(id));
                      const labelUrl = data.data.label_url;
                      window.open(labelUrl, '_blank');
                    } catch {
                      alert(t('error'));
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isAr ? 'إنشاء ملصق PDF' : 'Generate Label'}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!id) return;
                    setActionLoading(true);
                    try {
                      const { data } = await cropApi.marketing.exportText(Number(id));
                      const result = data.data;
                      const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = result.filename;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      alert(t('error'));
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                  {isAr ? 'تصدير النص' : 'Export Text'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('product_info')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label={t('product_name')} value={marketing.product_name} />
                    <InfoRow label={t('product_name_ar')} value={marketing.product_name_ar} />
                    {marketing.flavor_display && (
                      <InfoRow label={t('flavor_display')} value={marketing.flavor_display} />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('marketing_content')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {marketing.marketing_description && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t('marketing_description')}</span>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{isAr ? (marketing.marketing_description_ar || marketing.marketing_description) : marketing.marketing_description}</p>
                      </div>
                    )}
                    {marketing.social_media_text && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t('social_media_text')}</span>
                        <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                          {isAr ? (marketing.social_media_text_ar || marketing.social_media_text) : marketing.social_media_text}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
