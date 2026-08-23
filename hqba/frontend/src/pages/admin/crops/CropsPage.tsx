import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cropApi } from '@/api';
import type { Crop, CropStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const statusConfig: Record<CropStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  ordered: { variant: 'outline', className: 'text-muted-foreground border-border' },
  received: { variant: 'secondary', className: 'text-blue-700 bg-blue-100' },
  inspecting: { variant: 'secondary', className: 'text-amber-700 bg-amber-100' },
  trial_roasting: { variant: 'secondary', className: 'text-orange-700 bg-orange-100' },
  cupping: { variant: 'secondary', className: 'text-amber-700 bg-amber-100' },
  approved: { variant: 'default', className: 'bg-green-600' },
  pricing: { variant: 'secondary', className: 'text-yellow-700 bg-yellow-100' },
  marketing: { variant: 'secondary', className: 'text-pink-700 bg-pink-100' },
  production_ready: { variant: 'default', className: 'bg-emerald-600' },
  in_production: { variant: 'secondary', className: 'text-indigo-700 bg-indigo-100' },
  depleted: { variant: 'outline', className: 'text-muted-foreground border-border' },
  closed: { variant: 'outline', className: 'text-muted-foreground border-border' },
};

export function CropsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCrops = async () => {
    setIsLoading(true);
    try {
      const { data } = await cropApi.list({ include: 'supplier' });
      setCrops(data.data);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('crops')}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('serial_number')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('origin_country')}</TableHead>
                <TableHead>{t('process')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('remaining_green_weight')}</TableHead>
                <TableHead>{t('created_at')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                crops.map((crop) => {
                  const config = statusConfig[crop.status];
                  return (
                    <TableRow
                      key={crop.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => navigate(`/crops/${crop.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{crop.serial_number}</TableCell>
                      <TableCell className="font-medium">
                        {isAr ? crop.name_ar : crop.name}
                      </TableCell>
                      <TableCell>{crop.origin_country}</TableCell>
                      <TableCell>{t(crop.process)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className={config.className}>
                          {t(crop.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{crop.remaining_green_weight} kg</TableCell>
                      <TableCell>{new Date(crop.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
