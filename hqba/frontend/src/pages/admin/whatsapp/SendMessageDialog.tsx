import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { whatsappApi } from '@/api';
import type { WhatsappInstance } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instances: WhatsappInstance[];
  onSent: () => void;
}

export function SendMessageDialog({ open, onOpenChange, instances, onSent }: Props) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [instanceId, setInstanceId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const connectedInstances = instances.filter((i) => i.status === 'open');

  const handleSend = async () => {
    if (!phone || !message) return;
    setIsSending(true);
    try {
      await whatsappApi.send({
        phone,
        message,
        instance_id: instanceId ? Number(instanceId) : undefined,
      });
      setPhone('');
      setMessage('');
      setInstanceId('');
      onSent();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('send_message')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {connectedInstances.length > 1 && (
            <div className="space-y-2">
              <Label>{t('instance')}</Label>
              <Select value={instanceId} onValueChange={(v) => setInstanceId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('default')} />
                </SelectTrigger>
                <SelectContent>
                  {connectedInstances.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.display_name || i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('phone')}</Label>
            <Input
              dir="ltr"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966..."
            />
          </div>

          <div className="space-y-2">
            <Label>{t('message')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder={t('message_placeholder')}
            />
            <p className="text-xs text-muted-foreground text-end">{message.length}/4000</p>
          </div>

          {connectedInstances.length === 0 && (
            <p className="text-xs text-destructive">{t('no_connected_instance')}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !phone || !message || connectedInstances.length === 0}
            className="gap-2"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
