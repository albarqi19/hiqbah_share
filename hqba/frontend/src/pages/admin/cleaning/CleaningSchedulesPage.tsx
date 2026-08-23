import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cleaningApi } from '@/api/cleaning';
import { branchApi } from '@/api';
import type { Branch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2, SprayCan, Plus, Clock, CheckCircle2, PlayCircle,
  Star, CalendarDays, ListChecks,
} from 'lucide-react';

interface CleaningSchedule {
  id: number;
  branch_id: number;
  equipment_id: number | null;
  task_name: string;
  task_name_ar: string;
  frequency: string;
  time_of_day: string;
  steps: string[] | null;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  equipment?: { name: string; name_ar: string };
  branch?: { name: string; name_ar: string };
}

interface CleaningTask {
  id: number;
  schedule_id: number;
  branch_id: number;
  task_name: string;
  task_name_ar: string;
  status: string;
  scheduled_time: string;
  started_at: string | null;
  completed_at: string | null;
  reviewed_at: string | null;
  review_status: string | null;
  performer?: { name: string; name_ar: string };
  schedule?: CleaningSchedule;
}

interface CleanlinessScore {
  score: number;
  total_tasks: number;
  completed_tasks: number;
  reviewed_passed: number;
  reviewed_failed: number;
  pending_review: number;
}

const taskStatusColors: Record<string, string> = {
  pending: 'bg-accent text-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  reviewed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  missed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const frequencyOptions = ['daily', 'weekly', 'monthly', 'after_use'] as const;
const timeOptions = ['morning', 'midday', 'evening', 'closing'] as const;

export function CleaningSchedulesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('schedules');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Schedules
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  // Today tasks
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Score
  const [score, setScore] = useState<CleanlinessScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    branch_id: '',
    equipment_id: '',
    task_name: '',
    task_name_ar: '',
    frequency: 'daily',
    time_of_day: 'morning',
    steps: '',
    duration_minutes: '15',
  });

  // Task actions
  const [actingTaskId, setActingTaskId] = useState<number | null>(null);

  const frequencyLabel = (freq: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      daily: { ar: 'يومي', en: 'Daily' },
      weekly: { ar: 'أسبوعي', en: 'Weekly' },
      monthly: { ar: 'شهري', en: 'Monthly' },
      after_use: { ar: 'بعد الاستخدام', en: 'After Use' },
    };
    return isAr ? labels[freq]?.ar ?? freq : labels[freq]?.en ?? freq;
  };

  const timeLabel = (time: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      morning: { ar: 'صباحي', en: 'Morning' },
      midday: { ar: 'ظهري', en: 'Midday' },
      evening: { ar: 'مسائي', en: 'Evening' },
      closing: { ar: 'إغلاق', en: 'Closing' },
    };
    return isAr ? labels[time]?.ar ?? time : labels[time]?.en ?? time;
  };

  const taskStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'معلق', en: 'Pending' },
      in_progress: { ar: 'قيد التنفيذ', en: 'In Progress' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      reviewed: { ar: 'تمت المراجعة', en: 'Reviewed' },
      missed: { ar: 'فائت', en: 'Missed' },
    };
    return isAr ? labels[status]?.ar ?? status : labels[status]?.en ?? status;
  };

  const fetchBranches = useCallback(async () => {
    try {
      const { data } = await branchApi.list({ per_page: 100 });
      const items = data.data ?? [];
      setBranches(items);
      if (items.length > 0 && !selectedBranchId) {
        setSelectedBranchId(String(items[0].id));
      }
    } catch {
      // silently
    }
  }, [selectedBranchId]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedBranchId) return;
    setSchedulesLoading(true);
    try {
      const { data } = await cleaningApi.listSchedules({
        branch_id: parseInt(selectedBranchId),
        include: 'equipment,branch',
        per_page: 50,
      });
      setSchedules(data.data);
    } catch {
      toast.error(isAr ? 'فشل تحميل الجداول' : 'Failed to load schedules');
    } finally {
      setSchedulesLoading(false);
    }
  }, [selectedBranchId, isAr]);

  const fetchTasks = useCallback(async () => {
    if (!selectedBranchId) return;
    setTasksLoading(true);
    try {
      const { data } = await cleaningApi.todayTasks({
        branch_id: parseInt(selectedBranchId),
        include: 'performer,schedule',
      });
      setTasks(data.data);
    } catch {
      toast.error(isAr ? 'فشل تحميل المهام' : 'Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  }, [selectedBranchId, isAr]);

  const fetchScore = useCallback(async () => {
    if (!selectedBranchId) return;
    setScoreLoading(true);
    try {
      const { data } = await cleaningApi.score({
        branch_id: parseInt(selectedBranchId),
      });
      setScore(data.data as CleanlinessScore);
    } catch {
      toast.error(isAr ? 'فشل تحميل النتيجة' : 'Failed to load score');
    } finally {
      setScoreLoading(false);
    }
  }, [selectedBranchId, isAr]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (!selectedBranchId) return;
    if (activeTab === 'schedules') fetchSchedules();
    else if (activeTab === 'tasks') fetchTasks();
    else if (activeTab === 'score') fetchScore();
  }, [selectedBranchId, activeTab, fetchSchedules, fetchTasks, fetchScore]);

  const handleCreateSchedule = async () => {
    if (!createForm.task_name || !createForm.branch_id) return;
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        branch_id: parseInt(createForm.branch_id),
        task_name: createForm.task_name,
        task_name_ar: createForm.task_name_ar,
        frequency: createForm.frequency,
        time_of_day: createForm.time_of_day,
        duration_minutes: parseInt(createForm.duration_minutes),
      };
      if (createForm.equipment_id) {
        payload.equipment_id = parseInt(createForm.equipment_id);
      }
      if (createForm.steps.trim()) {
        payload.steps = createForm.steps.split('\n').filter((s) => s.trim());
      }
      await cleaningApi.createSchedule(payload);
      toast.success(isAr ? 'تم إنشاء الجدول بنجاح' : 'Schedule created successfully');
      setCreateOpen(false);
      setCreateForm({
        branch_id: '', equipment_id: '', task_name: '', task_name_ar: '',
        frequency: 'daily', time_of_day: 'morning', steps: '', duration_minutes: '15',
      });
      await fetchSchedules();
    } catch {
      toast.error(isAr ? 'فشل إنشاء الجدول' : 'Failed to create schedule');
    } finally {
      setCreating(false);
    }
  };

  const handleStartTask = async (taskId: number) => {
    setActingTaskId(taskId);
    try {
      await cleaningApi.startTask(taskId);
      toast.success(isAr ? 'تم بدء المهمة' : 'Task started');
      await fetchTasks();
    } catch {
      toast.error(isAr ? 'فشل بدء المهمة' : 'Failed to start task');
    } finally {
      setActingTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    setActingTaskId(taskId);
    try {
      await cleaningApi.completeTask(taskId);
      toast.success(isAr ? 'تم إكمال المهمة' : 'Task completed');
      await fetchTasks();
    } catch {
      toast.error(isAr ? 'فشل إكمال المهمة' : 'Failed to complete task');
    } finally {
      setActingTaskId(null);
    }
  };

  const handleReviewTask = async (taskId: number, reviewStatus: string) => {
    setActingTaskId(taskId);
    try {
      await cleaningApi.reviewTask(taskId, { review_status: reviewStatus });
      toast.success(isAr ? 'تمت المراجعة' : 'Task reviewed');
      await fetchTasks();
    } catch {
      toast.error(isAr ? 'فشلت المراجعة' : 'Failed to review task');
    } finally {
      setActingTaskId(null);
    }
  };

  const completedCount = tasks.filter((tk) => ['completed', 'reviewed'].includes(tk.status)).length;
  const taskProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const setTab = (val: unknown) => {
    if (typeof val === 'string') setActiveTab(val);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SprayCan className="w-7 h-7" />
          {isAr ? 'جداول التنظيف' : 'Cleaning Schedules'}
        </h1>

        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {isAr ? 'الفرع:' : 'Branch:'}
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm min-w-[160px]"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {isAr ? b.name_ar : b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="schedules">
            <CalendarDays className="w-4 h-4 me-1" />
            {isAr ? 'الجداول' : 'Schedules'}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="w-4 h-4 me-1" />
            {isAr ? 'مهام اليوم' : "Today's Tasks"}
          </TabsTrigger>
          <TabsTrigger value="score">
            <Star className="w-4 h-4 me-1" />
            {isAr ? 'النتيجة' : 'Score'}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Schedules ── */}
        <TabsContent value="schedules">
          <div className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setCreateForm((p) => ({ ...p, branch_id: selectedBranchId }));
                setCreateOpen(true);
              }} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {isAr ? 'جدول جديد' : 'New Schedule'}
              </Button>
            </div>

            {schedulesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="bg-card rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? 'المهمة' : 'Task'}</TableHead>
                      <TableHead>{isAr ? 'المعدات' : 'Equipment'}</TableHead>
                      <TableHead>{isAr ? 'التكرار' : 'Frequency'}</TableHead>
                      <TableHead>{isAr ? 'الوقت' : 'Time'}</TableHead>
                      <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
                      <TableHead>{isAr ? 'الخطوات' : 'Steps'}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {t('no_data')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {isAr ? schedule.task_name_ar : schedule.task_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {schedule.equipment
                              ? (isAr ? schedule.equipment.name_ar : schedule.equipment.name)
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {frequencyLabel(schedule.frequency)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {timeLabel(schedule.time_of_day)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {schedule.duration_minutes} {isAr ? 'د' : 'min'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {schedule.steps && schedule.steps.length > 0 ? (
                              <span>{schedule.steps.length} {isAr ? 'خطوات' : 'steps'}</span>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {schedule.is_active ? (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                {isAr ? 'نشط' : 'Active'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-accent text-muted-foreground">
                                {isAr ? 'غير نشط' : 'Inactive'}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Today's Tasks ── */}
        <TabsContent value="tasks">
          <div className="space-y-4 mt-4">
            {/* Progress Bar */}
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {isAr ? 'تقدم مهام اليوم' : "Today's Progress"}
                </span>
                <span className="text-sm font-bold text-primary">
                  {taskProgress}% ({completedCount}/{tasks.length})
                </span>
              </div>
              <div className="w-full bg-accent rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>

            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 bg-card rounded-lg border">
                    {t('no_data')}
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="bg-card rounded-lg border p-4 flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {task.status === 'completed' || task.status === 'reviewed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="w-6 h-6 text-blue-500 animate-pulse" />
                        ) : task.status === 'missed' ? (
                          <Clock className="w-6 h-6 text-red-500" />
                        ) : (
                          <Clock className="w-6 h-6 text-muted-foreground/70" />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {isAr ? task.task_name_ar : task.task_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Badge className={taskStatusColors[task.status]} >
                            {taskStatusLabel(task.status)}
                          </Badge>
                          {task.scheduled_time && (
                            <span>{task.scheduled_time}</span>
                          )}
                          {task.performer && (
                            <span>
                              {isAr ? task.performer.name_ar : task.performer.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartTask(task.id)}
                            disabled={actingTaskId === task.id}
                            className="h-8 text-xs"
                          >
                            {actingTaskId === task.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <PlayCircle className="w-3 h-3 me-1" />}
                            {isAr ? 'بدء' : 'Start'}
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={actingTaskId === task.id}
                            className="h-8 text-xs bg-green-600 hover:bg-green-700"
                          >
                            {actingTaskId === task.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <CheckCircle2 className="w-3 h-3 me-1" />}
                            {isAr ? 'إكمال' : 'Complete'}
                          </Button>
                        )}
                        {task.status === 'completed' && !task.review_status && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewTask(task.id, 'passed')}
                              disabled={actingTaskId === task.id}
                              className="h-8 text-xs text-green-600 border-green-300"
                            >
                              {actingTaskId === task.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : (isAr ? 'قبول' : 'Pass')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewTask(task.id, 'failed')}
                              disabled={actingTaskId === task.id}
                              className="h-8 text-xs text-red-600 border-red-300"
                            >
                              {isAr ? 'رفض' : 'Fail'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Score ── */}
        <TabsContent value="score">
          <div className="mt-4">
            {scoreLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : score ? (
              <div className="space-y-6">
                {/* Score Circle */}
                <div className="bg-card rounded-lg border p-8 flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none" stroke="#e5e7eb" strokeWidth="12"
                      />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke={score.score >= 80 ? '#10b981' : score.score >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(score.score / 100) * 327} 327`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">{score.score}%</span>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    {isAr ? 'نتيجة النظافة' : 'Cleanliness Score'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr
                      ? `${score.completed_tasks} من ${score.total_tasks} مهام مكتملة`
                      : `${score.completed_tasks} of ${score.total_tasks} tasks completed`}
                  </p>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <ScoreCard
                    label={isAr ? 'إجمالي المهام' : 'Total Tasks'}
                    value={String(score.total_tasks)}
                    color="text-foreground"
                    bg="bg-muted"
                  />
                  <ScoreCard
                    label={isAr ? 'مكتملة' : 'Completed'}
                    value={String(score.completed_tasks)}
                    color="text-green-700 dark:text-green-400"
                    bg="bg-green-50 dark:bg-green-950/30"
                  />
                  <ScoreCard
                    label={isAr ? 'اجتازت المراجعة' : 'Passed Review'}
                    value={String(score.reviewed_passed)}
                    color="text-emerald-700 dark:text-emerald-400"
                    bg="bg-emerald-50 dark:bg-emerald-950/30"
                  />
                  <ScoreCard
                    label={isAr ? 'فشلت المراجعة' : 'Failed Review'}
                    value={String(score.reviewed_failed)}
                    color="text-red-700 dark:text-red-400"
                    bg="bg-red-50 dark:bg-red-950/30"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 bg-card rounded-lg border">
                {t('no_data')}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Schedule Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? 'جدول تنظيف جديد' : 'New Cleaning Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الفرع' : 'Branch'}</label>
              <select
                value={createForm.branch_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, branch_id: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{isAr ? 'اختر الفرع' : 'Select branch'}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{isAr ? b.name_ar : b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? 'اسم المهمة (EN)' : 'Task Name (EN)'}</label>
                <input
                  type="text"
                  value={createForm.task_name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, task_name: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Clean grinder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? 'اسم المهمة (AR)' : 'Task Name (AR)'}</label>
                <input
                  type="text"
                  value={createForm.task_name_ar}
                  onChange={(e) => setCreateForm((p) => ({ ...p, task_name_ar: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  dir="rtl"
                  placeholder="مثال: تنظيف المطحنة"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? 'التكرار' : 'Frequency'}</label>
                <select
                  value={createForm.frequency}
                  onChange={(e) => setCreateForm((p) => ({ ...p, frequency: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {frequencyOptions.map((f) => (
                    <option key={f} value={f}>{frequencyLabel(f)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? 'وقت التنفيذ' : 'Time of Day'}</label>
                <select
                  value={createForm.time_of_day}
                  onChange={(e) => setCreateForm((p) => ({ ...p, time_of_day: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {timeOptions.map((tm) => (
                    <option key={tm} value={tm}>{timeLabel(tm)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'المدة (دقائق)' : 'Duration (minutes)'}
              </label>
              <input
                type="number"
                value={createForm.duration_minutes}
                onChange={(e) => setCreateForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'الخطوات (سطر لكل خطوة)' : 'Steps (one per line)'}
              </label>
              <textarea
                value={createForm.steps}
                onChange={(e) => setCreateForm((p) => ({ ...p, steps: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder={isAr ? 'خطوة 1\nخطوة 2\nخطوة 3' : 'Step 1\nStep 2\nStep 3'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={creating || !createForm.task_name || !createForm.branch_id}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              {isAr ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScoreCard({ label, value, color, bg }: {
  label: string; value: string; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg border p-4 text-center`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
