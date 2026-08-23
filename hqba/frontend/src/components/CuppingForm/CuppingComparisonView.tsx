import { useTranslation } from 'react-i18next';
import { CuppingScoreRadar } from './CuppingScoreRadar';
import type { SampleScores } from './CuppingSampleCard';
import { CuppingClassification } from './CuppingClassification';

interface Sample {
  number: number;
  cropName?: string;
  scores: SampleScores;
}

interface CuppingComparisonViewProps {
  samples: Sample[];
}

const SAMPLE_COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444', '#8b5cf6'];

const RADAR_KEYS = [
  'fragrance', 'aroma', 'flavor', 'aftertaste',
  'acidity', 'body', 'balance', 'sweetness', 'overall_score',
] as const;

export function CuppingComparisonView({ samples }: CuppingComparisonViewProps) {
  const { t } = useTranslation();

  const radarSamples = samples.map((s, i) => ({
    name: `${t('sample')} #${s.number}`,
    color: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
    scores: RADAR_KEYS.map((key) => ({
      label: key,
      value: (s.scores as unknown as Record<string, number>)[key] || 6,
    })),
  }));

  const calcFinalScore = (scores: SampleScores) => {
    const total =
      scores.fragrance + scores.aroma + scores.flavor + scores.aftertaste +
      scores.acidity + scores.body + scores.balance + scores.sweetness +
      scores.uniformity + scores.clean_cup + scores.overall_score;
    return total - (scores.defects * scores.defect_intensity);
  };

  return (
    <div className="space-y-6">
      {/* Radar Chart Overlay */}
      <div className="flex justify-center">
        <CuppingScoreRadar samples={radarSamples} size={320} />
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 flex-wrap">
        {samples.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SAMPLE_COLORS[i % SAMPLE_COLORS.length] }}
            />
            <span className="text-sm">
              {t('sample')} #{s.number}
              {s.cropName && <span className="text-muted-foreground/70 ms-1">({s.cropName})</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Score Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-start py-2 pe-4 text-muted-foreground font-medium">{t('sample')}</th>
              {RADAR_KEYS.map((key) => (
                <th key={key} className="py-2 px-2 text-center text-muted-foreground font-medium text-xs">
                  {key.charAt(0).toUpperCase() + key.slice(1, 5)}
                </th>
              ))}
              <th className="py-2 px-2 text-center text-muted-foreground font-medium">{t('final_score')}</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s, i) => (
              <tr key={s.number} className="border-b last:border-0">
                <td className="py-2 pe-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SAMPLE_COLORS[i % SAMPLE_COLORS.length] }}
                    />
                    <span className="font-medium">#{s.number}</span>
                  </div>
                </td>
                {RADAR_KEYS.map((key) => {
                  const val = (s.scores as unknown as Record<string, number>)[key] || 0;
                  return (
                    <td key={key} className="py-2 px-2 text-center tabular-nums">
                      {val.toFixed(1)}
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center">
                  <CuppingClassification finalScore={calcFinalScore(s.scores)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
