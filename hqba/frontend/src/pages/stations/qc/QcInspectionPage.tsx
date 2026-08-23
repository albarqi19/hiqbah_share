import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cropApi } from '@/api';
import type { GreenCoffeeLot, GreenCoffeeInspection, InspectionDecision } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardCheck, FlaskConical, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

type InspectionFormData = {
  moisture_percent: string;
  water_activity: string;
  density: string;
  screen_size: string;
  defect_count: string;
  defect_notes: string;
  visual_notes: string;
};

const emptyForm: InspectionFormData = {
  moisture_percent: '',
  water_activity: '',
  density: '',
  screen_size: '',
  defect_count: '',
  defect_notes: '',
  visual_notes: '',
};

export function QcInspectionPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [lots, setLots] = useState<GreenCoffeeLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<GreenCoffeeLot | null>(null);
  const [form, setForm] = useState<InspectionFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [decisionData, setDecisionData] = useState({ decision: '' as InspectionDecision | '', reason: '', condition_notes: '' });

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const { data } = await cropApi.greenCoffee.listLots({ include: 'crop,inspections.inspector', 'filter[status]': 'received,inspecting' });
      setLots(data.data);
    } catch {
      // silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleSubmitInspection = async () => {
    if (!selectedLot) return;
    setSubmitting(true);
    try {
      await cropApi.greenCoffee.inspect(selectedLot.id, {
        moisture_percent: form.moisture_percent ? parseFloat(form.moisture_percent) : null,
        water_activity: form.water_activity ? parseFloat(form.water_activity) : null,
        density: form.density ? parseFloat(form.density) : null,
        screen_size: form.screen_size || null,
        defect_count: form.defect_count ? parseInt(form.defect_count) : null,
        defect_notes: form.defect_notes || null,
        visual_notes: form.visual_notes || null,
      });
      setForm(emptyForm);
      setSelectedLot(null);
      await fetchLots();
    } catch {
      // silently
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecide = async (inspectionId: number) => {
    if (!decisionData.decision) return;
    setSubmitting(true);
    try {
      await cropApi.greenCoffee.decide(inspectionId, {
        decision: decisionData.decision,
        reason: decisionData.reason || null,
        condition_notes: decisionData.condition_notes || null,
      });
      setDecidingId(null);
      setDecisionData({ decision: '', reason: '', condition_notes: '' });
      await fetchLots();
    } catch {
      // silently
    } finally {
      setSubmitting(false);
    }
  };

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm text-muted-foreground/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-6rem)]">
      {/* Left: Pending Lots */}
      <div className="bg-card rounded-xl p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-amber-400" />
          {t('pending_inspections')}
        </h2>
        <div className="space-y-3">
          {lots.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">{t('no_data')}</div>
          ) : (
            lots.map((lot) => (
              <button
                key={lot.id}
                onClick={() => { setSelectedLot(lot); setDecidingId(null); }}
                className={`w-full text-start p-4 rounded-lg border transition-colors ${
                  selectedLot?.id === lot.id
                    ? 'bg-primary/50 border-primary'
                    : 'bg-muted border-border hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-primary">{lot.batch_id}</span>
                  <Badge variant={lot.status === 'received' ? 'secondary' : 'outline'} className="text-xs">
                    {t(lot.status)}
                  </Badge>
                </div>
                <div className="font-medium">
                  {lot.crop ? (isAr ? lot.crop.name_ar : lot.crop.name) : `Lot #${lot.id}`}
                </div>
                <div className="text-sm text-muted-foreground/70 mt-1">
                  {lot.actual_weight} kg &middot; {lot.bags_count} {t('bags_count')}
                </div>
                {lot.inspections && lot.inspections.length > 0 && (
                  <div className="text-xs text-amber-400 mt-1">
                    {lot.inspections.length} {t('inspect')}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Inspection Form / Results */}
      <div className="lg:col-span-2 bg-card rounded-xl p-6 overflow-y-auto">
        {!selectedLot ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ClipboardCheck className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">{t('start_inspection')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lot Info */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">{t('lot_info')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground/70">{t('serial_number')}</span>
                  <div className="font-mono">{selectedLot.crop?.serial_number || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground/70">{t('actual_weight')}</span>
                  <div>{selectedLot.actual_weight} kg</div>
                </div>
                <div>
                  <span className="text-muted-foreground/70">{t('expected_weight')}</span>
                  <div>{selectedLot.expected_weight} kg</div>
                </div>
                <div>
                  <span className="text-muted-foreground/70">{t('weight_variance')}</span>
                  <div className={selectedLot.weight_variance < 0 ? 'text-red-400' : 'text-green-400'}>
                    {selectedLot.weight_variance} kg
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Inspections */}
            {selectedLot.inspections && selectedLot.inspections.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">{t('inspection_results')}</h3>
                {selectedLot.inspections.map((insp: GreenCoffeeInspection) => (
                  <div key={insp.id} className="bg-card rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      {insp.moisture_percent !== null && (
                        <div><span className="text-muted-foreground/70">{t('moisture')}</span><div>{insp.moisture_percent}%</div></div>
                      )}
                      {insp.water_activity !== null && (
                        <div><span className="text-muted-foreground/70">{t('water_activity')}</span><div>{insp.water_activity}</div></div>
                      )}
                      {insp.density !== null && (
                        <div><span className="text-muted-foreground/70">{t('density')}</span><div>{insp.density}</div></div>
                      )}
                      {insp.screen_size && (
                        <div><span className="text-muted-foreground/70">{t('screen_size')}</span><div>{insp.screen_size}</div></div>
                      )}
                      {insp.defect_count !== null && (
                        <div><span className="text-muted-foreground/70">{t('defect_count')}</span><div>{insp.defect_count}</div></div>
                      )}
                    </div>
                    {insp.decision ? (
                      <div className="flex items-center gap-2">
                        {insp.decision === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        {insp.decision === 'rejected' && <XCircle className="w-5 h-5 text-red-400" />}
                        {insp.decision === 'conditional' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                        <span className="font-medium">{t(insp.decision)}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDecidingId(insp.id)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {t('decide')}
                      </button>
                    )}

                    {/* Decision Form */}
                    {decidingId === insp.id && (
                      <div className="mt-4 bg-accent rounded-lg p-4 space-y-3">
                        <div className="flex gap-3">
                          {(['approved', 'rejected', 'conditional'] as const).map((d) => (
                            <button
                              key={d}
                              onClick={() => setDecisionData((prev) => ({ ...prev, decision: d }))}
                              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${
                                decisionData.decision === d
                                  ? d === 'approved' ? 'bg-green-600 text-white' : d === 'rejected' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                                  : 'bg-muted text-muted-foreground/50 hover:bg-muted0'
                              }`}
                            >
                              {t(d)}
                            </button>
                          ))}
                        </div>
                        {decisionData.decision === 'rejected' && (
                          <textarea
                            value={decisionData.reason}
                            onChange={(e) => setDecisionData((prev) => ({ ...prev, reason: e.target.value }))}
                            placeholder={t('rejection_reason')}
                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-white"
                            rows={2}
                          />
                        )}
                        {decisionData.decision === 'conditional' && (
                          <textarea
                            value={decisionData.condition_notes}
                            onChange={(e) => setDecisionData((prev) => ({ ...prev, condition_notes: e.target.value }))}
                            placeholder={t('condition_notes')}
                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-white"
                            rows={2}
                          />
                        )}
                        {decisionData.decision && (
                          <button
                            onClick={() => handleDecide(insp.id)}
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-lg transition-colors"
                          >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('submit_decision')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* New Inspection Form */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4">{t('inspection_form')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label={t('moisture') + ' (%)'}
                  value={form.moisture_percent}
                  onChange={(v) => setForm((p) => ({ ...p, moisture_percent: v }))}
                  type="number"
                  placeholder="10.5"
                />
                <InputField
                  label={t('water_activity')}
                  value={form.water_activity}
                  onChange={(v) => setForm((p) => ({ ...p, water_activity: v }))}
                  type="number"
                  placeholder="0.55"
                />
                <InputField
                  label={t('density') + ' (g/L)'}
                  value={form.density}
                  onChange={(v) => setForm((p) => ({ ...p, density: v }))}
                  type="number"
                  placeholder="700"
                />
                <InputField
                  label={t('screen_size')}
                  value={form.screen_size}
                  onChange={(v) => setForm((p) => ({ ...p, screen_size: v }))}
                  placeholder="16/18"
                />
                <InputField
                  label={t('defect_count')}
                  value={form.defect_count}
                  onChange={(v) => setForm((p) => ({ ...p, defect_count: v }))}
                  type="number"
                  placeholder="5"
                />
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground/70 mb-1">{t('defect_notes')}</label>
                  <textarea
                    value={form.defect_notes}
                    onChange={(e) => setForm((p) => ({ ...p, defect_notes: e.target.value }))}
                    className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-foreground"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground/70 mb-1">{t('visual_notes')}</label>
                  <textarea
                    value={form.visual_notes}
                    onChange={(e) => setForm((p) => ({ ...p, visual_notes: e.target.value }))}
                    className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-foreground"
                    rows={2}
                  />
                </div>
              </div>
              <button
                onClick={handleSubmitInspection}
                disabled={submitting}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 rounded-lg font-bold text-lg transition-colors"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('submit_inspection')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
