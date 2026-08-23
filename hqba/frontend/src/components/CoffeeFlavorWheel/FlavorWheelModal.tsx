import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlavorWheel } from './FlavorWheel';
import { useFlavorWheel } from './useFlavorWheel';
import { Button } from '@/components/ui/button';

interface FlavorWheelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelection?: string[];
  onConfirm: (flavors: string[]) => void;
  maxSelections?: number;
}

export function FlavorWheelModal({
  open,
  onOpenChange,
  initialSelection = [],
  onConfirm,
  maxSelections = 5,
}: FlavorWheelModalProps) {
  const { t } = useTranslation();
  const {
    selected,
    setSelected,
    zoomedCategory,
    hoveredNode,
    setHoveredNode,
    toggleFlavor,
    removeFlavor,
    clearAll,
    zoomTo,
  } = useFlavorWheel(initialSelection, maxSelections);

  // Sync selection when modal opens with new initial values
  useEffect(() => {
    if (open) {
      setSelected(initialSelection);
      zoomTo(null);
    }
  }, [open, initialSelection, setSelected, zoomTo]);

  const handleConfirm = () => {
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('flavor_wheel', 'Flavor Wheel')} —{' '}
            {t('select_flavors', 'Select Flavors')}
          </DialogTitle>
        </DialogHeader>

        <FlavorWheel
          selected={selected}
          onToggle={toggleFlavor}
          onRemove={removeFlavor}
          onClear={clearAll}
          zoomedCategory={zoomedCategory}
          onZoom={zoomTo}
          hoveredNode={hoveredNode}
          onHover={setHoveredNode}
          maxSelections={maxSelections}
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('save', 'Save')} ({selected.length}{' '}
            {t('flavor_notes', 'flavor notes')})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
