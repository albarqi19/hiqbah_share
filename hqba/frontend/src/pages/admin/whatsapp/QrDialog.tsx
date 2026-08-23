import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { whatsappApi } from '@/api';
import type { WhatsappInstance } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  instance: WhatsappInstance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function QrDialog({ instance, open, onOpenChange, onConnected }: Props) {
  const { t } = useTranslation();
  const [qr, setQr] = useState<string | null>(instance.qr_code);
  const [status, setStatus] = useState<string>(instance.status);
  const [isLoading, setIsLoading] = useState(false);

  const refreshQr = async () => {
    setIsLoading(true);
    try {
      const { data } = await whatsappApi.getQr(instance.id);
      setQr(data.data.qr_code);
      setStatus(data.data.status);
    } finally {
      setIsLoading(false);
    }
  };

  // Get fresh QR on open
  useEffect(() => {
    if (open && !instance.qr_code) {
      refreshQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Poll status every 3 seconds while waiting for connection
  useEffect(() => {
    if (!open || status === 'open') return;
    const interval = setInterval(async () => {
      const { data } = await whatsappApi.status(instance.id);
      setStatus(data.data.status);
      if (data.data.status === 'open') {
        clearInterval(interval);
        setTimeout(onConnected, 1500);
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status, instance.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('connect_whatsapp')}</DialogTitle>
          <DialogDescription>{t('scan_qr_hint')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {status === 'open' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-lg font-semibold">{t('whatsapp_connected')}</p>
            </div>
          ) : isLoading || !qr ? (
            <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <img
              src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
              alt="WhatsApp QR Code"
              className="w-64 h-64 border rounded-lg"
            />
          )}

          <ol className="text-xs text-muted-foreground space-y-1 list-decimal pe-5 w-full">
            <li>{t('qr_step_1')}</li>
            <li>{t('qr_step_2')}</li>
            <li>{t('qr_step_3')}</li>
          </ol>

          <Button variant="outline" onClick={refreshQr} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh_qr')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
