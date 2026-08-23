import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { whatsappApi } from '@/api';
import type { WhatsappInstance, WhatsappMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Trash2, Loader2, RefreshCw, QrCode, Send, MessageSquare,
  CheckCircle2, XCircle, Clock, Smartphone,
} from 'lucide-react';
import { QrDialog } from './QrDialog';
import { SendMessageDialog } from './SendMessageDialog';

const STATUS_VARIANTS: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  open: { variant: 'default', icon: CheckCircle2 },
  connecting: { variant: 'secondary', icon: Clock },
  close: { variant: 'destructive', icon: XCircle },
  disconnected: { variant: 'destructive', icon: XCircle },
  missing: { variant: 'destructive', icon: XCircle },
  unknown: { variant: 'outline', icon: Clock },
};

export function WhatsappPage() {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [qrInstance, setQrInstance] = useState<WhatsappInstance | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const fetchInstances = () => {
    return whatsappApi.listInstances().then(({ data }) => setInstances(data.data));
  };

  const fetchMessages = () => {
    return whatsappApi.messages({ per_page: 50 }).then(({ data }) => setMessages(data.data));
  };

  useEffect(() => {
    Promise.all([fetchInstances(), fetchMessages()]).finally(() => setIsLoading(false));
  }, []);

  // Auto-refresh status every 5 seconds while there is a connecting instance
  useEffect(() => {
    const hasConnecting = instances.some((i) => i.status === 'connecting');
    if (!hasConnecting) return;

    const interval = setInterval(() => {
      Promise.all(
        instances
          .filter((i) => i.status === 'connecting')
          .map((i) => whatsappApi.status(i.id)),
      ).then(fetchInstances);
    }, 5000);

    return () => clearInterval(interval);
  }, [instances]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const { data } = await whatsappApi.createInstance({});
      await fetchInstances();
      setQrInstance(data.data);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await whatsappApi.deleteInstance(id);
    } catch (e) {
      console.warn('Delete request failed, refreshing list anyway', e);
    }
    fetchInstances();
  };

  const handleRefreshStatus = async (id: number) => {
    await whatsappApi.status(id);
    fetchInstances();
  };

  const handleShowQr = async (instance: WhatsappInstance) => {
    setQrInstance(instance);
  };

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('whatsapp')}</h1>
          <p className="text-sm text-muted-foreground">{t('whatsapp_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSendDialogOpen(true)} className="gap-2">
            <Send className="w-4 h-4" />
            {t('send_message')}
          </Button>
          {instances.length === 0 && (
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('add_instance')}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances" className="gap-2">
            <Smartphone className="w-4 h-4" />
            {t('instances')}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            {t('messages_log')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          {instances.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('no_whatsapp_instances')}</p>
                <p className="text-xs mt-2">{t('add_instance_hint')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.map((instance) => {
                const status = STATUS_VARIANTS[instance.status] || STATUS_VARIANTS.unknown;
                const StatusIcon = status.icon;
                return (
                  <Card key={instance.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {instance.display_name || instance.name}
                          </CardTitle>
                          {instance.phone_number && (
                            <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                              +{instance.phone_number}
                            </p>
                          )}
                        </div>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {t(`whatsapp_status_${instance.status}`, { defaultValue: instance.status })}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {instance.status !== 'open' && (
                          <Button size="sm" variant="outline" onClick={() => handleShowQr(instance)} className="gap-1">
                            <QrCode className="w-4 h-4" />
                            {t('show_qr')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleRefreshStatus(instance.id)} className="gap-1">
                          <RefreshCw className="w-4 h-4" />
                          {t('refresh')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(instance.id)} className="gap-1 text-destructive">
                          <Trash2 className="w-4 h-4" />
                          {t('delete')}
                        </Button>
                      </div>
                      {instance.is_default && (
                        <Badge variant="outline" className="text-xs">{t('default')}</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('to')}</TableHead>
                    <TableHead>{t('message')}</TableHead>
                    <TableHead>{t('event')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('sent_at')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t('no_messages')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="font-mono text-xs" dir="ltr">+{msg.to_number}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{msg.message}</TableCell>
                        <TableCell>
                          {msg.event_type && (
                            <Badge variant="outline" className="text-xs">{msg.event_type}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read'
                                ? 'default'
                                : msg.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {t(`msg_status_${msg.status}`, { defaultValue: msg.status })}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {msg.sent_at || msg.created_at}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {qrInstance && (
        <QrDialog
          instance={qrInstance}
          open={!!qrInstance}
          onOpenChange={(open) => !open && setQrInstance(null)}
          onConnected={() => {
            fetchInstances();
            setQrInstance(null);
          }}
        />
      )}

      <SendMessageDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        instances={instances}
        onSent={() => {
          fetchMessages();
          setSendDialogOpen(false);
        }}
      />
    </div>
  );
}
