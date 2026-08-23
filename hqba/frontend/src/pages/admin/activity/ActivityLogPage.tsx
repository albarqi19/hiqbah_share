import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ScrollText } from 'lucide-react';
import client from '@/api/client';

interface Activity {
  id: number; description: string; subject_type: string; subject_id: number | null;
  causer: { id: number; name: string; name_ar: string } | null; event: string | null;
  properties: Record<string, unknown>; created_at: string;
}

export function ActivityLogPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try { const { data } = await client.get('/activity-log', { params: { per_page: 50 } }); setActivities(data.data.data || data.data); } catch {} finally { setIsLoading(false); }
    };
    fetchActivities();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ScrollText className="w-7 h-7" />{isAr ? 'سجل النشاطات' : 'Activity Log'}</h1>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
              <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
              <TableHead>{isAr ? 'الحدث' : 'Event'}</TableHead>
              <TableHead>{isAr ? 'المستخدم' : 'User'}</TableHead>
              <TableHead>{t('created_at')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {activities.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('no_data')}</TableCell></TableRow> : (
                activities.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{a.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.subject_type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.event || '—'}</TableCell>
                    <TableCell className="text-sm">{isAr ? a.causer?.name_ar : a.causer?.name || 'System'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
