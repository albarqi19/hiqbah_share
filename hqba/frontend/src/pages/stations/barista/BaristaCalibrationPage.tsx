import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calibrationApi } from '@/api/calibration';
import { equipmentApi } from '@/api/equipment';
import { cropApi } from '@/api/crops';
import type { Equipment, Crop } from '@/types';
import { Loader2, Coffee, Target, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Shot {
  id: number; shot_number: number; dose: number; grind_setting: string;
  extraction_time: number; yield: number; tds: number | null;
  extraction_percent: number | null; acidity_score: number | null;
  finish_score: number | null; balance_score: number | null;
  is_within_range: boolean;
}

interface Session {
  id: number; status: string; total_shots: number; total_waste_grams: number;
  machine?: { name: string; code: string }; grinder?: { name: string; code: string };
  crop?: { serial_number: string; name: string; name_ar: string };
  recipe?: { recipe_code: string; espresso?: { dose: number; grind_setting: string; extraction_time: number; yield: number; tds: number; extraction_percent: number } };
  shots?: Shot[];
}

export function BaristaCalibrationPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shotForm, setShotForm] = useState({ dose: '18', grind_setting: '', extraction_time: '', yield: '', tds: '' });

  const [machines, setMachines] = useState<Equipment[]>([]);
  const [grinders, setGrinders] = useState<Equipment[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setup, setSetup] = useState({ machine_id: '', grinder_id: '', crop_id: '' });

  useEffect(() => {
    const fetchOptions = async () => {
      setSetupLoading(true);
      try {
        const [machinesRes, grindersRes, cropsRes] = await Promise.all([
          equipmentApi.list({ 'filter[type]': 'espresso_machine', 'filter[status]': 'active', per_page: 50 }),
          equipmentApi.list({ 'filter[type]': 'grinder', 'filter[status]': 'active', per_page: 50 }),
          cropApi.list({ per_page: 50 }),
        ]);
        setMachines(machinesRes.data.data);
        setGrinders(grindersRes.data.data);
        setCrops(cropsRes.data.data);
      } catch { /* silently */ } finally { setSetupLoading(false); }
    };
    fetchOptions();
  }, []);

  const startSession = async () => {
    if (!setup.machine_id || !setup.grinder_id || !setup.crop_id) return;
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const { data } = await calibrationApi.start({
        branch_id: user.branch_id,
        equipment_machine_id: parseInt(setup.machine_id),
        equipment_grinder_id: parseInt(setup.grinder_id),
        crop_id: parseInt(setup.crop_id),
        barista_id: user.id,
      });
      setSession(data.data);
    } catch {} finally { setIsLoading(false); }
  };

  const handleAddShot = async () => {
    if (!session || !shotForm.extraction_time || !shotForm.yield) return;
    setSubmitting(true);
    try {
      const { data } = await calibrationApi.addShot(session.id, {
        dose: parseFloat(shotForm.dose), grind_setting: shotForm.grind_setting,
        extraction_time: parseInt(shotForm.extraction_time), yield: parseFloat(shotForm.yield),
        tds: shotForm.tds ? parseFloat(shotForm.tds) : null,
      });
      setSession(data.data);
      setShotForm(p => ({ ...p, grind_setting: '', extraction_time: '', yield: '', tds: '' }));
    } catch {} finally { setSubmitting(false); }
  };

  const handleFinish = async () => {
    if (!session) return;
    setSubmitting(true);
    try { const { data } = await calibrationApi.finish(session.id); setSession(data.data); } catch {} finally { setSubmitting(false); }
  };

  const target = session?.recipe?.espresso;

  // No session: setup screen
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Coffee className="w-20 h-20 text-amber-400 mb-6" />
        <h1 className="text-3xl font-bold mb-8">{t('calibrating')}</h1>

        {setupLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        ) : (
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground/70 mb-2">
                {isAr ? 'ماكينة الإسبريسو' : 'Espresso Machine'}
              </label>
              <select
                value={setup.machine_id}
                onChange={e => setSetup(p => ({ ...p, machine_id: e.target.value }))}
                className="w-full bg-accent border border-border rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">{isAr ? '— اختر الماكينة —' : '— Select Machine —'}</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground/70 mb-2">
                {isAr ? 'الطاحونة' : 'Grinder'}
              </label>
              <select
                value={setup.grinder_id}
                onChange={e => setSetup(p => ({ ...p, grinder_id: e.target.value }))}
                className="w-full bg-accent border border-border rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">{isAr ? '— اختر الطاحونة —' : '— Select Grinder —'}</option>
                {grinders.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground/70 mb-2">
                {isAr ? 'المحصول' : 'Crop'}
              </label>
              <select
                value={setup.crop_id}
                onChange={e => setSetup(p => ({ ...p, crop_id: e.target.value }))}
                className="w-full bg-accent border border-border rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">{isAr ? '— اختر المحصول —' : '— Select Crop —'}</option>
                {crops.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.serial_number} — {isAr ? c.name_ar : c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startSession}
              disabled={isLoading || !setup.machine_id || !setup.grinder_id || !setup.crop_id}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-5 rounded-2xl text-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('start_inspection')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-6rem)]">
      {/* Left: Target Recipe */}
      <div className="bg-card rounded-xl p-4 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" /> {t('target_profile')}
        </h2>
        <div className="text-sm text-muted-foreground/70">
          {session.machine?.name} + {session.grinder?.name}
        </div>
        <div className="text-sm text-primary">{session.crop?.serial_number}</div>
        {target && (
          <div className="space-y-2">
            <ParamRow label={t('dose')} value={`${target.dose}g`} />
            <ParamRow label={t('grind_setting')} value={target.grind_setting} />
            <ParamRow label={t('extraction_time')} value={`${target.extraction_time}s`} />
            <ParamRow label={t('yield_label')} value={`${target.yield}g`} />
            <ParamRow label={t('tds')} value={`${target.tds}`} />
            <ParamRow label={t('extraction_percent')} value={`${target.extraction_percent}%`} />
          </div>
        )}
        <div className="pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground/70">{t('total')}: {session.total_shots} shots</div>
          <div className="text-sm text-muted-foreground/70">{t('total_waste')}: {session.total_waste_grams}g</div>
        </div>
        {/* Shots log */}
        <div className="space-y-2">
          {session.shots?.map(shot => (
            <div key={shot.id} className={`rounded-lg p-2 text-sm ${shot.is_within_range ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">#{shot.shot_number}</span>
                {shot.is_within_range ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
              </div>
              <div className="text-xs text-muted-foreground/70">{shot.dose}g → {shot.yield}g / {shot.extraction_time}s {shot.tds ? `/ TDS ${shot.tds}` : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: New Shot Form */}
      <div className="lg:col-span-2 bg-card rounded-xl p-6 overflow-y-auto">
        {session.status === 'open' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Shot #{(session.total_shots || 0) + 1}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('dose')} (g)</label>
                <input type="number" value={shotForm.dose} onChange={e => setShotForm(p => ({ ...p, dose: e.target.value }))}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-4 text-white text-2xl text-center font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('grind_setting')}</label>
                <input value={shotForm.grind_setting} onChange={e => setShotForm(p => ({ ...p, grind_setting: e.target.value }))} placeholder={target?.grind_setting || ''}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-4 text-white text-2xl text-center font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('extraction_time')} (s)</label>
                <input type="number" value={shotForm.extraction_time} onChange={e => setShotForm(p => ({ ...p, extraction_time: e.target.value }))} placeholder={target ? String(target.extraction_time) : ''}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-4 text-white text-2xl text-center font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('yield_label')} (g)</label>
                <input type="number" value={shotForm.yield} onChange={e => setShotForm(p => ({ ...p, yield: e.target.value }))} placeholder={target ? String(target.yield) : ''}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-4 text-white text-2xl text-center font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('tds')}</label>
                <input type="number" step="0.1" value={shotForm.tds} onChange={e => setShotForm(p => ({ ...p, tds: e.target.value }))} placeholder={target ? String(target.tds) : ''}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-4 text-white text-2xl text-center font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleAddShot} disabled={submitting || !shotForm.extraction_time}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-colors">
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6" /> New Shot</>}
              </button>
              {session.total_shots > 0 && (
                <button onClick={handleFinish} disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-colors">
                  <CheckCircle2 className="w-6 h-6" /> {t('complete')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <CheckCircle2 className="w-20 h-20 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">{t('completed')}</h2>
            <p className="text-muted-foreground/70">{session.total_shots} shots — {session.total_waste_grams}g waste</p>
            <button onClick={() => setSession(null)} className="mt-8 bg-accent hover:bg-muted text-white px-8 py-3 rounded-xl transition-colors">
              {t('back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-accent rounded-lg px-4 py-3">
      <span className="text-muted-foreground/70 text-sm">{label}</span>
      <span className="font-bold text-lg">{value}</span>
    </div>
  );
}
