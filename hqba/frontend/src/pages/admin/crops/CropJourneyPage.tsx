import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropApi } from '@/api';
import type { Crop, TimelineEvent } from '@/types';
import { CropJourneyMap } from '@/components/CropJourney/CropJourneyMap';
import { ArrowRight, Loader2 } from 'lucide-react';

export function CropJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [cropRes, timelineRes] = await Promise.all([
          cropApi.get(Number(id)),
          cropApi.getTimeline(Number(id)),
        ]);
        setCrop(cropRes.data.data);
        setTimeline(timelineRes.data.data);
      } catch {
        // error handled silently
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">لم يتم العثور على المحصول</p>
          <button
            onClick={() => navigate('/crops')}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            العودة إلى قائمة المحاصيل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Back button bar */}
      <div className="h-10 bg-card border-b border-border flex items-center px-4 flex-shrink-0" style={{ direction: 'rtl' }}>
        <button
          onClick={() => navigate(`/crops/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
            العودة إلى تفاصيل المحصول
          </span>
        </button>
      </div>

      {/* Journey Map */}
      <div className="flex-1 overflow-hidden">
        <CropJourneyMap
          crop={crop}
          timeline={timeline}
          onStageClick={(stageId) => {
            console.log('Stage clicked:', stageId);
          }}
        />
      </div>
    </div>
  );
}
