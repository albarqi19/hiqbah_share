import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { roastingApi } from '@/api';
import type { RoastBatch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, Flame, Thermometer, Clock, Star, Play, CheckCircle2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  queued: 'bg-muted',
  roasting: 'bg-orange-600 animate-pulse',
  cooling: 'bg-blue-600',
  pending_qc: 'bg-yellow-600',
  approved: 'bg-green-600',
  rejected: 'bg-red-600',
};

export function RoasterStationPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [batches, setBatches] = useState<RoastBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<RoastBatch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Complete form
  const [completeForm, setCompleteForm] = useState({
    roasted_weight_kg: '',
    actual_charge_temp: '',
    actual_first_crack_time: '',
    actual_first_crack_temp: '',
    actual_development_time: '',
    actual_drop_temp: '',
    actual_total_time: '',
    actual_roast_level: '',
  });

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const { data } = await roastingApi.queue({ include: 'crop,roaster', per_page: 50 });
      setBatches(data.data);
    } catch {
      // silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStart = async (batch: RoastBatch) => {
    setSubmitting(true);
    try {
      await roastingApi.start(batch.id);
      await fetchQueue();
      setSelectedBatch(null);
    } catch {
      // silently
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedBatch || !completeForm.roasted_weight_kg) return;
    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        roasted_weight_kg: parseFloat(completeForm.roasted_weight_kg),
      };
      if (completeForm.actual_charge_temp) data.actual_charge_temp = parseFloat(completeForm.actual_charge_temp);
      if (completeForm.actual_first_crack_time) data.actual_first_crack_time = completeForm.actual_first_crack_time;
      if (completeForm.actual_first_crack_temp) data.actual_first_crack_temp = parseFloat(completeForm.actual_first_crack_temp);
      if (completeForm.actual_development_time) data.actual_development_time = completeForm.actual_development_time;
      if (completeForm.actual_drop_temp) data.actual_drop_temp = parseFloat(completeForm.actual_drop_temp);
      if (completeForm.actual_total_time) data.actual_total_time = completeForm.actual_total_time;
      if (completeForm.actual_roast_level) data.actual_roast_level = completeForm.actual_roast_level;

      await roastingApi.complete(selectedBatch.id, data);
      setCompleteForm({ roasted_weight_kg: '', actual_charge_temp: '', actual_first_crack_time: '', actual_first_crack_temp: '', actual_development_time: '', actual_drop_temp: '', actual_total_time: '', actual_roast_level: '' });
      setSelectedBatch(null);
      await fetchQueue();
    } catch {
      // silently
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    );
  }

  const ProfileParam = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 bg-accent rounded-lg px-4 py-3">
        {icon}
        <div>
          <div className="text-xs text-muted-foreground/70">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-6rem)]">
      {/* Left: Queue */}
      <div className="bg-card rounded-xl p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          {t('roasting_queue')}
        </h2>
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">{t('no_batches')}</div>
          ) : (
            batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => setSelectedBatch(batch)}
                className={`w-full text-start p-4 rounded-lg border transition-colors ${
                  selectedBatch?.id === batch.id
                    ? 'bg-orange-900/30 border-orange-500'
                    : 'bg-muted border-border hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-orange-400">{batch.batch_number}</span>
                  <div className="flex items-center gap-2">
                    {batch.is_priority && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    <Badge className={`text-xs ${statusColors[batch.status]}`}>
                      {isAr ? batch.status_label : batch.status_label_en}
                    </Badge>
                  </div>
                </div>
                <div className="font-medium">
                  {batch.crop ? (isAr ? batch.crop.name_ar : batch.crop.name) : ''}
                </div>
                <div className="text-sm text-muted-foreground/70 mt-1">
                  {batch.green_weight_kg} kg &middot; {batch.crop?.origin_country}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Batch Details */}
      <div className="lg:col-span-2 bg-card rounded-xl p-6 overflow-y-auto">
        {!selectedBatch ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Flame className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">{t('select_batch')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Batch Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-orange-400">{selectedBatch.batch_number}</h2>
                <p className="text-muted-foreground/70">
                  {selectedBatch.crop ? (isAr ? selectedBatch.crop.name_ar : selectedBatch.crop.name) : ''}
                  {' — '}{selectedBatch.green_weight_kg} kg
                </p>
              </div>
              <Badge className={`text-sm ${statusColors[selectedBatch.status]}`}>
                {isAr ? selectedBatch.status_label : selectedBatch.status_label_en}
              </Badge>
            </div>

            {/* Target Profile */}
            {selectedBatch.target.charge_temp && (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-400">{t('target_profile')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <ProfileParam icon={<Thermometer className="w-5 h-5 text-red-400" />} label={t('charge')} value={`${selectedBatch.target.charge_temp}°C`} />
                  <ProfileParam icon={<Clock className="w-5 h-5 text-yellow-400" />} label={t('first_crack')} value={selectedBatch.target.first_crack_time} />
                  <ProfileParam icon={<Thermometer className="w-5 h-5 text-yellow-400" />} label={`${t('first_crack')} °C`} value={selectedBatch.target.first_crack_temp ? `${selectedBatch.target.first_crack_temp}°C` : null} />
                  <ProfileParam icon={<Clock className="w-5 h-5 text-green-400" />} label={t('development')} value={selectedBatch.target.development_time} />
                  <ProfileParam icon={<Thermometer className="w-5 h-5 text-orange-400" />} label={t('drop_temp')} value={selectedBatch.target.drop_temp ? `${selectedBatch.target.drop_temp}°C` : null} />
                  <ProfileParam icon={<Clock className="w-5 h-5 text-blue-400" />} label={t('total_roast_time')} value={selectedBatch.target.total_time} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedBatch.status === 'queued' && (
              <button
                onClick={() => handleStart(selectedBatch)}
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-5 rounded-xl font-bold text-xl transition-colors flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Play className="w-6 h-6" /> {t('start_roasting')}</>}
              </button>
            )}

            {(selectedBatch.status === 'roasting' || selectedBatch.status === 'cooling') && (
              <div className="bg-muted rounded-lg p-4 space-y-4">
                <h3 className="font-bold text-lg text-green-400">{t('actual_data')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={`${t('roasted_weight_kg')} *`} value={completeForm.roasted_weight_kg} onChange={(v) => setCompleteForm(p => ({ ...p, roasted_weight_kg: v }))} type="number" placeholder="8.5" />
                  <InputField label={`${t('charge')} °C`} value={completeForm.actual_charge_temp} onChange={(v) => setCompleteForm(p => ({ ...p, actual_charge_temp: v }))} type="number" placeholder="200" />
                  <InputField label={`${t('first_crack')} (time)`} value={completeForm.actual_first_crack_time} onChange={(v) => setCompleteForm(p => ({ ...p, actual_first_crack_time: v }))} placeholder="9:30" />
                  <InputField label={`${t('first_crack')} °C`} value={completeForm.actual_first_crack_temp} onChange={(v) => setCompleteForm(p => ({ ...p, actual_first_crack_temp: v }))} type="number" placeholder="198" />
                  <InputField label={t('development')} value={completeForm.actual_development_time} onChange={(v) => setCompleteForm(p => ({ ...p, actual_development_time: v }))} placeholder="2:00" />
                  <InputField label={`${t('drop_temp')} °C`} value={completeForm.actual_drop_temp} onChange={(v) => setCompleteForm(p => ({ ...p, actual_drop_temp: v }))} type="number" placeholder="215" />
                  <InputField label={t('total_roast_time')} value={completeForm.actual_total_time} onChange={(v) => setCompleteForm(p => ({ ...p, actual_total_time: v }))} placeholder="11:45" />
                  <div>
                    <label className="block text-sm text-muted-foreground/70 mb-1">{t('roast_level')}</label>
                    <select
                      value={completeForm.actual_roast_level}
                      onChange={(e) => setCompleteForm(p => ({ ...p, actual_roast_level: e.target.value }))}
                      className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-foreground text-lg"
                    >
                      <option value="">—</option>
                      <option value="light">{t('light')}</option>
                      <option value="medium_light">{t('medium_light')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="medium_dark">{t('medium_dark')}</option>
                      <option value="dark">{t('dark')}</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleComplete}
                  disabled={submitting || !completeForm.roasted_weight_kg}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-5 rounded-xl font-bold text-xl transition-colors flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> {t('complete_batch')}</>}
                </button>
              </div>
            )}

            {/* Completed batch results */}
            {selectedBatch.roasted_weight_kg && (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-green-400">{t('actual_data')}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-accent rounded-lg p-3">
                    <div className="text-xs text-muted-foreground/70">{t('green_weight_kg')}</div>
                    <div className="text-xl font-bold">{selectedBatch.green_weight_kg} kg</div>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <div className="text-xs text-muted-foreground/70">{t('roasted_weight_kg')}</div>
                    <div className="text-xl font-bold text-green-400">{selectedBatch.roasted_weight_kg} kg</div>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <div className="text-xs text-muted-foreground/70">{t('roast_loss')}</div>
                    <div className="text-xl font-bold text-red-400">{selectedBatch.roast_loss_percent}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
}
