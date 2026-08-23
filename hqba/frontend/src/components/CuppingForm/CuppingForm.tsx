import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CuppingSampleCard, type SampleScores } from './CuppingSampleCard';
import { CuppingComparisonView } from './CuppingComparisonView';
import { BarChart3, Save, Loader2 } from 'lucide-react';
import type { TrialRoast } from '@/types';

const DEFAULT_SCORES: SampleScores = {
  fragrance: 7,
  aroma: 7,
  flavor: 7,
  aftertaste: 7,
  acidity: 7,
  body: 7,
  balance: 7,
  sweetness: 10,
  uniformity: 10,
  clean_cup: 10,
  overall_score: 7,
  defects: 0,
  defect_intensity: 0,
  flavor_notes: [],
  notes: '',
};

export interface Sample {
  number: number;
  trialRoastId?: number;
  trialLabel?: string;
  cropName?: string;
  scores: SampleScores;
}

interface CuppingFormProps {
  cropName?: string;
  isBlind?: boolean;
  trialRoasts?: TrialRoast[];
  onSave?: (samples: Sample[]) => Promise<void>;
}

export function CuppingForm({
  cropName,
  isBlind = true,
  trialRoasts = [],
  onSave,
}: CuppingFormProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [samples, setSamples] = useState<Sample[]>([]);
  const [activeTab, setActiveTab] = useState('1');
  const [showComparison, setShowComparison] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-create samples from completed trial roasts
  useEffect(() => {
    const completedTrials = trialRoasts.filter(
      (t) => t.status === 'completed' || t.status === 'selected',
    );

    if (completedTrials.length > 0 && samples.length === 0) {
      const autoSamples = completedTrials.map((trial, i) => ({
        number: i + 1,
        trialRoastId: trial.id,
        trialLabel: isBlind
          ? `${isAr ? 'عينة' : 'Sample'} #${i + 1}`
          : `${isAr ? 'تجربة' : 'Trial'} #${trial.trial_number} — ${trial.roast_level || ''}`,
        cropName,
        scores: { ...DEFAULT_SCORES },
      }));
      setSamples(autoSamples);
    }
  }, [trialRoasts]);

  const updateSample = (index: number, scores: SampleScores) => {
    setSamples((prev) =>
      prev.map((s, i) => (i === index ? { ...s, scores } : s)),
    );
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(samples);
    } finally {
      setIsSaving(false);
    }
  };

  if (samples.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground/70 text-sm">
        {isAr
          ? 'لا توجد تجارب تحميص مكتملة. أكمل التحميص التجريبي أولاً.'
          : 'No completed trial roasts. Complete trial roasting first.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('cupping_session')}</h3>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? `${samples.length} عينة — كل عينة مرتبطة بتجربة تحميص مختلفة`
              : `${samples.length} samples — each linked to a different trial roast`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showComparison ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            className="gap-2"
            disabled={samples.length < 2}
          >
            <BarChart3 className="w-4 h-4" />
            {t('compare')}
          </Button>
          {onSave && (
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('save')}
            </Button>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && samples.length >= 2 && (
        <CuppingComparisonView samples={samples} />
      )}

      {/* Sample Tabs */}
      {!showComparison && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {samples.map((s) => (
              <TabsTrigger key={s.number} value={String(s.number)}>
                {s.trialLabel || `${t('sample')} #${s.number}`}
              </TabsTrigger>
            ))}
          </TabsList>

          {samples.map((sample, index) => (
            <TabsContent key={sample.number} value={String(sample.number)}>
              <CuppingSampleCard
                sampleNumber={sample.number}
                cropName={sample.cropName}
                isBlind={isBlind}
                scores={sample.scores}
                onChange={(scores) => updateSample(index, scores)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
