import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cropApi } from '@/api';
import type { GreenCoffeeLot, Crop } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Truck, CheckCircle2, ScanBarcode } from 'lucide-react';

export function WarehouseStationPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [lots, setLots] = useState<GreenCoffeeLot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Receive form
  const [receiveForm, setReceiveForm] = useState({ crop_id: '', purchase_order_id: '', bags_count: '', expected_weight: '', actual_weight: '', arrival_date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const [lotsRes, cropsRes] = await Promise.all([
        cropApi.greenCoffee.listLots({ include: 'crop', per_page: 50 }),
        cropApi.list({ per_page: 100 }),
      ]);
      setLots(lotsRes.data.data);
      setCrops(cropsRes.data.data);
    } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLots(); }, []);

  const handleReceive = async () => {
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await cropApi.greenCoffee.receive({
        crop_id: parseInt(receiveForm.crop_id),
        purchase_order_id: receiveForm.purchase_order_id ? parseInt(receiveForm.purchase_order_id) : null,
        bags_count: parseInt(receiveForm.bags_count),
        expected_weight: parseFloat(receiveForm.expected_weight),
        actual_weight: parseFloat(receiveForm.actual_weight),
        arrival_date: receiveForm.arrival_date || new Date().toISOString().split('T')[0],
        received_by: user.id || 1,
        notes: receiveForm.notes || null,
      });
      setShowReceive(false);
      setReceiveForm({ crop_id: '', purchase_order_id: '', bags_count: '', expected_weight: '', actual_weight: '', arrival_date: '', notes: '' });
      await fetchLots();
    } catch {} finally { setSubmitting(false); }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="w-12 h-12 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Package className="w-7 h-7 text-blue-400" />
          {isAr ? 'محطة المستودع' : 'Warehouse Station'}
        </h1>
        <button onClick={() => setShowReceive(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
          <Truck className="w-5 h-5" />
          {isAr ? 'استلام شحنة' : 'Receive Shipment'}
        </button>
      </div>

      {/* Recent Lots */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lots.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('no_data')}</p>
          </div>
        ) : (
          lots.map(lot => (
            <div key={lot.id} className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-blue-400">{lot.batch_id}</span>
                <Badge className={`text-xs ${lot.status === 'approved' ? 'bg-green-600' : lot.status === 'received' ? 'bg-blue-600' : 'bg-yellow-600'}`}>
                  {t(lot.status)}
                </Badge>
              </div>
              <div className="font-medium mb-2">
                {lot.crop ? (isAr ? lot.crop.name_ar : lot.crop.name) : `Lot #${lot.id}`}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground/70">
                <div>{t('bags_count')}: <span className="text-white font-bold">{lot.bags_count}</span></div>
                <div>{t('actual_weight')}: <span className="text-white font-bold">{lot.actual_weight} kg</span></div>
                <div>{t('expected_weight')}: {lot.expected_weight} kg</div>
                <div className={lot.weight_variance < 0 ? 'text-red-400' : 'text-green-400'}>
                  {t('variance')}: {lot.weight_variance} kg
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">{t('arrival_date')}: {lot.arrival_date}</div>
            </div>
          ))
        )}
      </div>

      {/* Receive Dialog */}
      {showReceive && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg space-y-4 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2"><ScanBarcode className="w-6 h-6 text-green-400" />{isAr ? 'استلام شحنة جديدة' : 'Receive New Shipment'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-muted-foreground/70 mb-1">
                  {isAr ? 'المحصول' : 'Crop'}
                </label>
                <select
                  value={receiveForm.crop_id}
                  onChange={e => setReceiveForm(p => ({ ...p, crop_id: e.target.value }))}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-white"
                >
                  <option value="">{isAr ? '— اختر المحصول —' : '— Select Crop —'}</option>
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.serial_number} — {isAr ? c.name_ar : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('bags_count')}</label>
                <input type="number" value={receiveForm.bags_count} onChange={e => setReceiveForm(p => ({ ...p, bags_count: e.target.value }))}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('arrival_date')}</label>
                <input type="date" value={receiveForm.arrival_date} onChange={e => setReceiveForm(p => ({ ...p, arrival_date: e.target.value }))}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('expected_weight')} (kg)</label>
                <input type="number" step="0.01" value={receiveForm.expected_weight} onChange={e => setReceiveForm(p => ({ ...p, expected_weight: e.target.value }))}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground/70 mb-1">{t('actual_weight')} (kg)</label>
                <input type="number" step="0.01" value={receiveForm.actual_weight} onChange={e => setReceiveForm(p => ({ ...p, actual_weight: e.target.value }))}
                  className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReceive(false)} className="flex-1 bg-accent hover:bg-muted text-white py-3 rounded-xl font-bold transition-colors">{t('cancel')}</button>
              <button onClick={handleReceive} disabled={submitting || !receiveForm.crop_id || !receiveForm.bags_count}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />{isAr ? 'تأكيد الاستلام' : 'Confirm Receipt'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
