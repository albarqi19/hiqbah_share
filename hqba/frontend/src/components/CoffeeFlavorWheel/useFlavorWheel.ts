import { useState, useCallback } from 'react';

export function useFlavorWheel(initialSelection: string[] = [], maxSelections = 5) {
  const [selected, setSelected] = useState<string[]>(initialSelection);
  const [zoomedCategory, setZoomedCategory] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const toggleFlavor = useCallback(
    (name: string) => {
      setSelected((prev) => {
        if (prev.includes(name)) {
          return prev.filter((f) => f !== name);
        }
        if (prev.length >= maxSelections) return prev;
        // Haptic feedback on mobile
        if (navigator.vibrate) navigator.vibrate(10);
        return [...prev, name];
      });
    },
    [maxSelections]
  );

  const removeFlavor = useCallback((name: string) => {
    setSelected((prev) => prev.filter((f) => f !== name));
  }, []);

  const clearAll = useCallback(() => {
    setSelected([]);
    setZoomedCategory(null);
  }, []);

  const zoomTo = useCallback((category: string | null) => {
    setZoomedCategory(category);
  }, []);

  return {
    selected,
    setSelected,
    zoomedCategory,
    hoveredNode,
    setHoveredNode,
    toggleFlavor,
    removeFlavor,
    clearAll,
    zoomTo,
  };
}
