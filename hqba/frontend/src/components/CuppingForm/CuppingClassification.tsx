import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface CuppingClassificationProps {
  finalScore: number | null;
}

export function CuppingClassification({ finalScore }: CuppingClassificationProps) {
  const { t } = useTranslation();

  if (finalScore === null || finalScore === 0) {
    return null;
  }

  const getClassification = (score: number) => {
    if (score >= 90) return { key: 'outstanding', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 85) return { key: 'excellent', color: 'bg-green-100 text-green-800 border-green-300' };
    if (score >= 80) return { key: 'very_good', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { key: 'below_specialty', color: 'bg-red-100 text-red-800 border-red-300' };
  };

  const cls = getClassification(finalScore);
  const isSpecialty = finalScore >= 80;

  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-bold tabular-nums" style={{ color: finalScore >= 85 ? '#059669' : finalScore >= 80 ? '#ca8a04' : '#dc2626' }}>
        {finalScore.toFixed(1)}
      </div>
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className={cls.color}>
          {t(cls.key)}
        </Badge>
        {isSpecialty && (
          <span className="text-[10px] text-green-600 font-medium">{t('specialty_grade')}</span>
        )}
      </div>
    </div>
  );
}
