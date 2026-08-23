import { useRef, useCallback } from 'react';

interface CuppingScoreSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
}

const SCORE_COLORS: Record<string, string> = {
  low: '#ef4444',    // 6-6.5
  mid: '#f97316',    // 7-7.5
  good: '#eab308',   // 8-8.5
  great: '#22c55e',  // 9-9.5
  perfect: '#059669', // 10
};

function getScoreColor(value: number): string {
  if (value >= 10) return SCORE_COLORS.perfect;
  if (value >= 9) return SCORE_COLORS.great;
  if (value >= 8) return SCORE_COLORS.good;
  if (value >= 7) return SCORE_COLORS.mid;
  return SCORE_COLORS.low;
}

export function CuppingScoreSlider({
  label,
  value,
  onChange,
  min = 6,
  max = 10,
  step = 0.25,
}: CuppingScoreSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const snapToStep = (val: number): number => {
    const snapped = Math.round(val / step) * step;
    return Math.max(min, Math.min(max, Number(snapped.toFixed(2))));
  };

  const getValueFromY = useCallback(
    (clientY: number) => {
      if (!sliderRef.current) return value;
      const rect = sliderRef.current.getBoundingClientRect();
      const fraction = 1 - (clientY - rect.top) / rect.height;
      return snapToStep(min + fraction * (max - min));
    },
    [min, max, value],
  );

  const handleStart = (clientY: number) => {
    isDragging.current = true;
    const newVal = getValueFromY(clientY);
    if (newVal !== value) {
      onChange(newVal);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleMove = (clientY: number) => {
    if (!isDragging.current) return;
    const newVal = getValueFromY(clientY);
    if (newVal !== value) {
      onChange(newVal);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  const fillPercent = ((value - min) / (max - min)) * 100;
  const scoreColor = getScoreColor(value);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Score Display */}
      <div
        className="text-lg font-bold tabular-nums leading-none"
        style={{ color: scoreColor }}
      >
        {value.toFixed(2)}
      </div>

      {/* Vertical Slider Track */}
      <div
        ref={sliderRef}
        className="relative w-10 h-24 rounded-full bg-accent cursor-pointer touch-none overflow-hidden"
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => handleMove(e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => {
          e.preventDefault();
          handleMove(e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75"
          style={{
            height: `${fillPercent}%`,
            backgroundColor: scoreColor,
            opacity: 0.3,
          }}
        />
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-8 h-3 rounded-full shadow-md transition-all duration-75"
          style={{
            bottom: `calc(${fillPercent}% - 6px)`,
            backgroundColor: scoreColor,
          }}
        />
      </div>

      {/* Label */}
      <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight max-w-[60px]">
        {label}
      </span>
    </div>
  );
}
