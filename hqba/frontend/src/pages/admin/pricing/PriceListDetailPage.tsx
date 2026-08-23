import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pricingApi } from '@/api/pricing';
import client from '@/api/client';
import type { PriceList, PriceListItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Archive,
  Pencil,
  Tag,
  CalendarDays,
  User,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  pending_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const typeColors: Record<string, string> = {
  wholesale: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  retail: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  vip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  custom: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const itemTypeLabels: Record<string, string> = {
  finished_250: '250g',
  finished_500: '500g',
  finished_1kg: '1 \u0643\u062c\u0645',
  green: 'Green',
  roasted: 'Roasted',
  bar: 'Bar',
};

const itemTypeBadgeColors: Record<string, string> = {
  finished_250: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  finished_500: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  finished_1kg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  roasted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  bar: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

const itemTypes = ['finished_250', 'finished_500', 'finished_1kg', 'green', 'roasted', 'bar'] as const;

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-SA', { minimumFractionDigits: 2 }) + ' \u0631.\u0633';
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-SA');
}

interface CropOption {
  id: number;
  serial_number: string;
  name: string;
  name_ar: string;
}

interface AddItemFormData {
  crop_id: string;
  item_type: string;
  unit_price: string;
  min_quantity: string;
  effective_from: string;
  effective_until: string;
  change_reason: string;
}

const defaultFormData: AddItemFormData = {
  crop_id: '',
  item_type: '',
  unit_price: '',
  min_quantity: '1',
  effective_from: '',
  effective_until: '',
  change_reason: '',
};

export function PriceListDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [priceList, setPriceList] = useState<PriceList | null>(null);
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Add item dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formData, setFormData] = useState<AddItemFormData>(defaultFormData);
  const [crops, setCrops] = useState<CropOption[]>([]);

  // Delete confirm dialog
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const priceListId = Number(id);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [priceListRes, itemsRes] = await Promise.all([
        pricingApi.getPriceList(priceListId),
        pricingApi.listItems(priceListId, { per_page: 100 }),
      ]);
      setPriceList(priceListRes.data.data);
      setItems(itemsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // Fetch crops for the add item dropdown
  useEffect(() => {
    client
      .get('/crops', { params: { per_page: 100 } })
      .then((r) => setCrops(r.data.data))
      .catch(console.error);
  }, []);

  const handleApprove = async () => {
    if (!priceList) return;
    setIsUpdating(true);
    try {
      await pricingApi.approvePriceList(priceList.id);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!priceList) return;
    setIsUpdating(true);
    try {
      await pricingApi.archivePriceList(priceList.id);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData(defaultFormData);
    setShowAddDialog(true);
  };

  const handleFormChange = (field: keyof AddItemFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async () => {
    if (!formData.crop_id || !formData.item_type || !formData.unit_price) return;
    setIsAddingItem(true);
    try {
      await pricingApi.setItem(priceListId, {
        crop_id: Number(formData.crop_id),
        item_type: formData.item_type,
        unit_price: Number(formData.unit_price),
        min_quantity: Number(formData.min_quantity) || 1,
        effective_from: formData.effective_from || null,
        effective_until: formData.effective_until || null,
        change_reason: formData.change_reason || null,
      });
      setShowAddDialog(false);
      setFormData(defaultFormData);
      // Refresh items
      const itemsRes = await pricingApi.listItems(priceListId, { per_page: 100 });
      setItems(itemsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteItemId === null) return;
    setIsDeleting(true);
    try {
      await pricingApi.removeItem(priceListId, deleteItemId);
      setDeleteItemId(null);
      // Refresh items
      const itemsRes = await pricingApi.listItems(priceListId, { per_page: 100 });
      setItems(itemsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!priceList) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('no_data')}
      </div>
    );
  }

  const canApprove = priceList.status === 'draft' || priceList.status === 'pending_approval';
  const canArchive = priceList.status === 'active';
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/price-lists')}
          >
            <BackArrow className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {isAr ? priceList.name_ar : priceList.name}
              </h1>
              <Badge className={`text-xs ${typeColors[priceList.type]}`}>
                {isAr ? priceList.type_label : priceList.type_label_en}
              </Badge>
              <Badge className={`text-xs ${statusColors[priceList.status]}`}>
                {isAr ? priceList.status_label : priceList.status_label_en}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {priceList.code}
              {priceList.is_default && (
                <span className="ms-2 text-green-600 font-medium">
                  ({t('default')})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="flex items-center gap-2">
          {canApprove && (
            <Button
              variant="default"
              size="sm"
              onClick={handleApprove}
              disabled={isUpdating}
              className="gap-1.5"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {t('approve')}
            </Button>
          )}
          {canArchive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isUpdating}
              className="gap-1.5 text-red-600 hover:text-red-700"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              {t('archive')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/price-lists`)}
            className="gap-1.5"
          >
            <Pencil className="w-4 h-4" />
            {t('edit')}
          </Button>
        </div>
      </div>

      {/* ── Price List Info Card ── */}
      <Card className="bg-card rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Name */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('name')}
            </p>
            <p className="text-sm font-medium text-foreground">
              {isAr ? priceList.name_ar : priceList.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? priceList.name : priceList.name_ar}
            </p>
          </div>

          {/* Code */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('code')}
            </p>
            <p className="text-sm font-mono font-medium text-foreground">
              {priceList.code}
            </p>
          </div>

          {/* Rounding Rule */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('rounding_rule')}
            </p>
            <p className="text-sm font-medium text-foreground">
              {isAr ? priceList.rounding_rule_label : priceList.rounding_rule_label_en}
            </p>
          </div>

          {/* Currency */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('currency')}
            </p>
            <p className="text-sm font-medium text-foreground">
              {priceList.currency}
            </p>
          </div>

          {/* Default */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('is_default')}
            </p>
            <p className="text-sm font-medium text-foreground">
              {priceList.is_default ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" /> {t('yes')}
                </span>
              ) : (
                <span className="text-muted-foreground">{t('no')}</span>
              )}
            </p>
          </div>

          {/* Created By */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('created_by')}
            </p>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {priceList.creator
                  ? isAr
                    ? priceList.creator.name_ar
                    : priceList.creator.name
                  : '-'}
              </p>
            </div>
          </div>

          {/* Approved By */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('approved_by')}
            </p>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {priceList.approver
                  ? isAr
                    ? priceList.approver.name_ar
                    : priceList.approver.name
                  : '-'}
              </p>
            </div>
            {priceList.approved_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(priceList.approved_at)}
              </p>
            )}
          </div>

          {/* Dates */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('created_at')}
            </p>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {formatDate(priceList.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {(priceList.description || priceList.description_ar) && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
              {t('description')}
            </p>
            <p className="text-sm text-foreground">
              {isAr
                ? priceList.description_ar || priceList.description
                : priceList.description || priceList.description_ar}
            </p>
          </div>
        )}
      </Card>

      {/* ── Items Section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {t('items')}
            <span className="text-sm font-normal text-muted-foreground">
              ({items.length})
            </span>
          </h2>
          <Button onClick={handleOpenAddDialog} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('add')}
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('crop')}</TableHead>
                <TableHead>{t('item_type')}</TableHead>
                <TableHead>{t('unit_price')}</TableHead>
                <TableHead>{t('min_quantity')}</TableHead>
                <TableHead>{t('effective_from')}</TableHead>
                <TableHead>{t('effective_until')}</TableHead>
                <TableHead>{t('active')}</TableHead>
                <TableHead className="w-20">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {item.crop?.serial_number}
                        </p>
                        <p className="text-sm font-medium">
                          {item.crop
                            ? isAr
                              ? item.crop.name_ar
                              : item.crop.name
                            : '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${
                          itemTypeBadgeColors[item.item_type] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {itemTypeLabels[item.item_type] ||
                          (isAr ? item.item_type_label : item.item_type_label_en)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums" dir="ltr">
                      {formatPrice(item.unit_price)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.min_quantity}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.effective_from)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.effective_until)}
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteItemId(item.id)}
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Add Item Dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('add')} - {t('items')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Select */}
            <div className="space-y-2">
              <Label>{t('crop')}</Label>
              <Select
                value={formData.crop_id}
                onValueChange={(v) => handleFormChange('crop_id', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_crop')} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.id} value={String(crop.id)}>
                      {crop.serial_number} - {isAr ? crop.name_ar : crop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item Type */}
            <div className="space-y-2">
              <Label>{t('item_type')}</Label>
              <Select
                value={formData.item_type}
                onValueChange={(v) => handleFormChange('item_type', v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_type')} />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {itemTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Price & Min Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('unit_price')} (\u0631.\u0633)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  dir="ltr"
                  value={formData.unit_price}
                  onChange={(e) => handleFormChange('unit_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('min_quantity')}</Label>
                <Input
                  type="number"
                  min="1"
                  dir="ltr"
                  value={formData.min_quantity}
                  onChange={(e) =>
                    handleFormChange('min_quantity', e.target.value)
                  }
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('effective_from')}</Label>
                <Input
                  type="date"
                  dir="ltr"
                  value={formData.effective_from}
                  onChange={(e) =>
                    handleFormChange('effective_from', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('effective_until')}</Label>
                <Input
                  type="date"
                  dir="ltr"
                  value={formData.effective_until}
                  onChange={(e) =>
                    handleFormChange('effective_until', e.target.value)
                  }
                />
              </div>
            </div>

            {/* Change Reason */}
            <div className="space-y-2">
              <Label>{t('change_reason')}</Label>
              <Textarea
                value={formData.change_reason}
                onChange={(e) =>
                  handleFormChange('change_reason', e.target.value)
                }
                rows={2}
                placeholder={t('change_reason_placeholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={
                isAddingItem ||
                !formData.crop_id ||
                !formData.item_type ||
                !formData.unit_price
              }
            >
              {isAddingItem && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={deleteItemId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteItemId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('confirm_delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('delete_item_confirm')}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteItemId(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
