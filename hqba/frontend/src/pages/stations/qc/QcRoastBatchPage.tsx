import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoastBatch } from '@/types';
import { Loader2, Microscope, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import client from '@/api/client';

export function QcRoastBatchPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [batches, setBatches] = useState<RoastBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<RoastBatch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState({ color: 0, aroma: 0, flavor: 0, acidity: 0, body: 0, balance: 0 });
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'conditional' | ''>('');
  const [reason, setReason] = useState('');

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const { data } = await client.get('/quality-checks/pending');
      setBatches(data.data);
    } catch { /* silently */ } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const avgScore = Math.round((totalScore / 6) * 10);

  const handleSubmitQc = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      // Create QC check
      const { data: qcRes } = await client.post(`/roasting/batches/${selectedBatch.id}/quality-check`, {
        inspector_id: JSON.parse(localStorage.getItem('user') || '{}').id || 1,
        color_score: scores.color, aroma_score: scores.aroma, flavor_score: scores.flavor,
        acidity_score: scores.acidity, body_score: scores.body, balance_score: scores.balance,
      });
      const qcId = qcRes.data.id;

      // Submit decision
      if (decision) {
        await client.put(`/quality-checks/${qcId}/decide`, {
          decision, reason: reason || null,
        });
      }

      setSelectedBatch(null);
      setScores({ color: 0, aroma: 0, flavor: 0, acidity: 0, body: 0, balance: 0 });
      setDecision('');
      setReason('');
      await fetchPending();
    } catch { /* silently */ } finally { setSubmitting(false); }
  };

  const ScoreSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground/70 w-20">{label}</span>
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-3 rounded text-sm font-bold transition-colors ${
              n <= value
                ? n >= 8 ? 'bg-green-600 text-white' : n >= 5 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'
                : 'bg-accent text-muted-foreground hover:bg-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-lg font-bold w-8 text-center">{value || '—'}</span>
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
      {/* Left: Pending Batches */}
      <div className="bg-card rounded-xl p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Microscope className="w-5 h-5 text-blue-400" />
          {t('pending_qc')}
        </h2>
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">{t('no_data')}</div>
          ) : (
            batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => { setSelectedBatch(batch); setScores({ color: 0, aroma: 0, flavor: 0, acidity: 0, body: 0, balance: 0 }); setDecision(''); }}
                className={`w-full text-start p-4 rounded-lg border transition-colors ${
                  selectedBatch?.id === batch.id ? 'bg-blue-900/30 border-blue-500' : 'bg-muted border-border hover:bg-accent'
                }`}
              >
                <div className="font-mono text-sm text-blue-400">{batch.batch_number}</div>
                <div className="font-medium">{batch.crop ? (isAr ? batch.crop.name_ar : batch.crop.name) : ''}</div>
                <div className="text-sm text-muted-foreground/70">{batch.roasted_weight_kg} kg {t('roasted')}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: QC Form */}
      <div className="lg:col-span-2 bg-card rounded-xl p-6 overflow-y-auto">
        {!selectedBatch ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Microscope className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">{t('select_batch')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-400">{selectedBatch.batch_number}</h2>
              <p className="text-muted-foreground/70">{selectedBatch.crop ? (isAr ? selectedBatch.crop.name_ar : selectedBatch.crop.name) : ''}</p>
            </div>

            {/* Score sliders */}
            <div className="space-y-4 bg-muted rounded-lg p-4">
              <ScoreSlider label={t('color')} value={scores.color} onChange={(v) => setScores(p => ({ ...p, color: v }))} />
              <ScoreSlider label={t('aroma')} value={scores.aroma} onChange={(v) => setScores(p => ({ ...p, aroma: v }))} />
              <ScoreSlider label={t('flavor_score')} value={scores.flavor} onChange={(v) => setScores(p => ({ ...p, flavor: v }))} />
              <ScoreSlider label={t('acidity_score')} value={scores.acidity} onChange={(v) => setScores(p => ({ ...p, acidity: v }))} />
              <ScoreSlider label={t('body_score')} value={scores.body} onChange={(v) => setScores(p => ({ ...p, body: v }))} />
              <ScoreSlider label={t('balance_score')} value={scores.balance} onChange={(v) => setScores(p => ({ ...p, balance: v }))} />

              <div className="text-center pt-2 border-t border-border">
                <span className="text-muted-foreground/70 text-sm">{t('final_score')}</span>
                <div className={`text-4xl font-bold ${avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {avgScore}/100
                </div>
              </div>
            </div>

            {/* Decision */}
            <div className="flex gap-3">
              {([['approved', 'bg-green-600', CheckCircle2], ['rejected', 'bg-red-600', XCircle], ['conditional', 'bg-yellow-600', AlertTriangle]] as const).map(([d, color, Icon]) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
                    decision === d ? `${color} text-white` : 'bg-accent text-muted-foreground/70 hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(d)}
                </button>
              ))}
            </div>

            {decision === 'rejected' && (
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={t('rejection_reason')}
                className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-white" rows={2} />
            )}

            <button
              onClick={handleSubmitQc}
              disabled={submitting || !decision || Object.values(scores).some(s => s === 0)}
              className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white py-5 rounded-xl font-bold text-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('submit_decision')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
