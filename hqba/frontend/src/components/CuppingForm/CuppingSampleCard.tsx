import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CuppingScoreSlider } from './CuppingScoreSlider';
import { CuppingClassification } from './CuppingClassification';
import { FlavorWheelModal } from '@/components/CoffeeFlavorWheel/FlavorWheelModal';
import { Badge } from '@/components/ui/badge';
import { Palette } from 'lucide-react';

export interface SampleScores {
  fragrance: number;
  aroma: number;
  flavor: number;
  aftertaste: number;
  acidity: number;
  body: number;
  balance: number;
  sweetness: number;
  uniformity: number;
  clean_cup: number;
  overall_score: number;
  defects: number;
  defect_intensity: number;
  flavor_notes: string[];
  notes: string;
}

interface CuppingSampleCardProps {
  sampleNumber: number;
  cropName?: string;
  isBlind: boolean;
  scores: SampleScores;
  onChange: (scores: SampleScores) => void;
}

const SCA_ATTRIBUTES = [
  { key: 'fragrance', labelKey: 'fragrance' },
  { key: 'aroma', labelKey: 'aroma' },
  { key: 'flavor', labelKey: 'flavor_score' },
  { key: 'aftertaste', labelKey: 'aftertaste_score' },
  { key: 'acidity', labelKey: 'acidity_score' },
  { key: 'body', labelKey: 'body_score' },
  { key: 'balance', labelKey: 'balance_score' },
  { key: 'sweetness', labelKey: 'sweetness_score' },
  { key: 'uniformity', labelKey: 'uniformity' },
  { key: 'clean_cup', labelKey: 'clean_cup' },
  { key: 'overall_score', labelKey: 'overall_score' },
] as const;

export function CuppingSampleCard({
  sampleNumber,
  cropName,
  isBlind,
  scores,
  onChange,
}: CuppingSampleCardProps) {
  const { t } = useTranslation();
  const [flavorWheelOpen, setFlavorWheelOpen] = useState(false);

  const updateScore = (key: string, value: number) => {
    onChange({ ...scores, [key]: value });
  };

  const finalScore = useMemo(() => {
    const total =
      scores.fragrance + scores.aroma + scores.flavor + scores.aftertaste +
      scores.acidity + scores.body + scores.balance + scores.sweetness +
      scores.uniformity + scores.clean_cup + scores.overall_score;
    const defectPenalty = scores.defects * scores.defect_intensity;
    return total - defectPenalty;
  }, [scores]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t('sample')} #{sampleNumber}
            {!isBlind && cropName && (
              <span className="text-sm font-normal text-muted-foreground ms-2">— {cropName}</span>
            )}
            {isBlind && (
              <Badge variant="secondary" className="ms-2 text-[10px]">{t('blind_cupping')}</Badge>
            )}
          </CardTitle>
          <CuppingClassification finalScore={finalScore} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Sliders - 3 columns on desktop, scrollable on mobile */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2 justify-items-center">
          {SCA_ATTRIBUTES.map(({ key, labelKey }) => (
            <CuppingScoreSlider
              key={key}
              label={t(labelKey)}
              value={(scores as unknown as Record<string, number>)[key] || 6}
              onChange={(v) => updateScore(key, v)}
            />
          ))}
        </div>

        {/* Defects row */}
        <div className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
          <span className="text-sm font-medium text-red-700">{t('defects_label')}</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">#</label>
            <input
              type="number"
              min={0}
              max={5}
              value={scores.defects}
              onChange={(e) => onChange({ ...scores, defects: Number(e.target.value) })}
              className="w-14 h-8 text-center border rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">×</label>
            <select
              value={scores.defect_intensity}
              onChange={(e) => onChange({ ...scores, defect_intensity: Number(e.target.value) })}
              className="h-8 border rounded-md text-sm px-2"
            >
              <option value={0}>0</option>
              <option value={2}>2 (Taint)</option>
              <option value={4}>4 (Fault)</option>
            </select>
          </div>
          <span className="text-sm font-bold text-red-600">
            = -{scores.defects * scores.defect_intensity}
          </span>
        </div>

        {/* Flavor Notes */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlavorWheelOpen(true)}
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            {t('flavor_wheel')}
          </Button>
          {scores.flavor_notes.map((note) => (
            <Badge key={note} variant="outline" className="text-xs">
              {note}
            </Badge>
          ))}
        </div>

        {/* Notes */}
        <Textarea
          placeholder={t('notes')}
          value={scores.notes}
          onChange={(e) => onChange({ ...scores, notes: e.target.value })}
          rows={2}
          className="text-sm"
        />

        {/* Flavor Wheel Modal */}
        <FlavorWheelModal
          open={flavorWheelOpen}
          onOpenChange={setFlavorWheelOpen}
          initialSelection={scores.flavor_notes}
          onConfirm={(flavors) => onChange({ ...scores, flavor_notes: flavors })}
        />
      </CardContent>
    </Card>
  );
}
