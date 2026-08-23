import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '@/api';
import type { Setting } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, unknown>>({});

  useEffect(() => {
    settingsApi.list().then(({ data }) => {
      setSettings(data.data);
    }).finally(() => setIsLoading(false));
  }, []);

  const handleChange = (key: string, value: unknown) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updates = Object.entries(edited).map(([key, value]) => {
      const setting = settings.find((s) => s.key === key);
      return { key, value, group: setting?.group, type: setting?.type };
    });
    try {
      const { data } = await settingsApi.update(updates);
      setSettings(data.data);
      setEdited({});
    } finally {
      setIsSaving(false);
    }
  };

  const getValue = (setting: Setting) => {
    return edited[setting.key] !== undefined ? edited[setting.key] : setting.value;
  };

  // Group settings
  const groups = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        {Object.keys(edited).length > 0 && (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('save')}
          </Button>
        )}
      </div>

      {Object.entries(groups).map(([group, groupSettings]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="capitalize">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupSettings.map((setting) => (
              <div key={setting.key} className="flex items-center gap-4">
                <Label className="w-48 shrink-0 text-sm text-muted-foreground">
                  {setting.key.replace(/_/g, ' ')}
                </Label>
                {setting.type === 'boolean' ? (
                  <Switch
                    checked={getValue(setting) as boolean}
                    onCheckedChange={(v) => handleChange(setting.key, v)}
                  />
                ) : (
                  <Input
                    type={setting.type === 'integer' ? 'number' : 'text'}
                    value={String(getValue(setting))}
                    onChange={(e) => handleChange(
                      setting.key,
                      setting.type === 'integer' ? Number(e.target.value) : e.target.value,
                    )}
                    className="max-w-xs"
                    dir={setting.key.endsWith('_ar') ? 'rtl' : 'ltr'}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
