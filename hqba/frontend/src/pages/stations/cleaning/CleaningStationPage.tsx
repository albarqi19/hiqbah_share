import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Loader2, SprayCan, Play, CheckCircle2, Clock, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/api/client';

interface Task {
  id: number; status: string; status_label: string; status_label_en: string;
  assigned_date: string; started_at: string | null; completed_at: string | null;
  schedule?: { task_name: string; task_name_ar: string; frequency: string; time_of_day: string | null; steps: string[] | null; duration_minutes: number; equipment?: { name: string; code: string } | null };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-600', in_progress: 'bg-blue-600 animate-pulse', completed: 'bg-green-600', reviewed: 'bg-emerald-600', overdue: 'bg-red-600',
};

export function CleaningStationPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [completeDialog, setCompleteDialog] = useState<number | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try { const { data } = await client.get('/cleaning/tasks/today'); setTasks(data.data); } catch { toast.error(isAr ? 'فشل تحميل المهام' : 'Failed to load tasks'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStart = async (id: number) => {
    setActing(id);
    try { await client.put(`/cleaning/tasks/${id}/start`); toast.success(isAr ? 'تم البدء' : 'Started'); await fetchTasks(); } catch { toast.error(isAr ? 'فشل' : 'Failed'); } finally { setActing(null); }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { if (reader.result) setAfterPhotos(prev => [...prev, reader.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  const openCompleteDialog = (id: number) => {
    setCompleteDialog(id);
    setCompleteNotes('');
    setAfterPhotos([]);
  };

  const handleComplete = async () => {
    if (!completeDialog) return;
    setActing(completeDialog);
    try {
      await client.put(`/cleaning/tasks/${completeDialog}/complete`, { notes: completeNotes || 'Completed', after_photos: afterPhotos.length > 0 ? afterPhotos : null });
      toast.success(isAr ? 'تم الإكمال' : 'Completed');
      setCompleteDialog(null);
      await fetchTasks();
    } catch { toast.error(isAr ? 'فشل' : 'Failed'); } finally { setActing(null); }
  };

  if (isLoading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="w-12 h-12 animate-spin text-cyan-400" /></div>;

  const completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'reviewed').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <SprayCan className="w-7 h-7 text-cyan-400" />
          {isAr ? 'مهام التنظيف اليوم' : "Today's Cleaning Tasks"}
        </h1>
        <div className="text-sm text-muted-foreground/70">
          {completedCount}/{tasks.length} {t('completed')}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }} />
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <SprayCan className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('no_data')}</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`bg-card rounded-xl p-5 border ${task.status === 'in_progress' ? 'border-blue-500' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">{isAr ? task.schedule?.task_name_ar : task.schedule?.task_name}</h3>
                  {task.schedule?.equipment && (
                    <span className="text-sm text-muted-foreground/70">{task.schedule.equipment.name} ({task.schedule.equipment.code})</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {task.schedule?.time_of_day && (
                    <span className="text-sm text-muted-foreground/70 flex items-center gap-1"><Clock className="w-4 h-4" />{task.schedule.time_of_day}</span>
                  )}
                  <Badge className={`${statusColors[task.status]} text-white`}>
                    {isAr ? task.status_label : task.status_label_en}
                  </Badge>
                </div>
              </div>

              {/* Steps */}
              {task.schedule?.steps && task.schedule.steps.length > 0 && task.status !== 'completed' && task.status !== 'reviewed' && (
                <div className="mb-3 space-y-1">
                  {task.schedule.steps.map((step, i) => (
                    <div key={i} className="text-sm text-muted-foreground/70 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent text-xs flex items-center justify-center">{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {task.status === 'pending' && (
                  <button onClick={() => handleStart(task.id)} disabled={acting === task.id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors">
                    {acting === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5" />{t('start_inspection')}</>}
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button onClick={() => openCompleteDialog(task.id)} disabled={acting === task.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors">
                    {acting === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />{t('complete')}</>}
                  </button>
                )}
                {(task.status === 'completed' || task.status === 'reviewed') && (
                  <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" />{t('completed')}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Dialog with Photos */}
      {completeDialog && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-border">
            <h2 className="text-xl font-bold text-white">{isAr ? 'إكمال المهمة' : 'Complete Task'}</h2>

            <div>
              <label className="block text-sm text-muted-foreground/70 mb-1">{isAr ? 'ملاحظات' : 'Notes'}</label>
              <textarea value={completeNotes} onChange={e => setCompleteNotes(e.target.value)}
                className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-white text-lg" rows={2}
                placeholder={isAr ? 'أي ملاحظات...' : 'Any notes...'} />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground/70 mb-2">{isAr ? 'صور بعد التنظيف' : 'After Photos'}</label>
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" multiple
                onChange={handlePhotoCapture} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full bg-accent border-2 border-dashed border-border rounded-xl py-4 text-muted-foreground/50 flex items-center justify-center gap-2 hover:border-cyan-500 transition-colors">
                <Camera className="w-6 h-6" /> {isAr ? 'التقاط صورة' : 'Capture Photo'}
              </button>
              {afterPhotos.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {afterPhotos.map((photo, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={photo} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      <button onClick={() => setAfterPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCompleteDialog(null)} className="flex-1 bg-accent text-white py-3 rounded-xl font-bold">{t('cancel')}</button>
              <button onClick={handleComplete} disabled={acting !== null}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />{isAr ? 'إكمال' : 'Complete'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
