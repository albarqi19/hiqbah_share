import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { flavorWheelData, type FlavorNode } from './FlavorWheelData';
import { X, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FlavorWheelProps {
  selected: string[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
  onClear: () => void;
  zoomedCategory: string | null;
  onZoom: (category: string | null) => void;
  hoveredNode: string | null;
  onHover: (name: string | null) => void;
  maxSelections?: number;
}

// SVG arc path helper
function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + outerR * Math.cos(toRad(startAngle));
  const y1 = cy + outerR * Math.sin(toRad(startAngle));
  const x2 = cx + outerR * Math.cos(toRad(endAngle));
  const y2 = cy + outerR * Math.sin(toRad(endAngle));
  const x3 = cx + innerR * Math.cos(toRad(endAngle));
  const y3 = cy + innerR * Math.sin(toRad(endAngle));
  const x4 = cx + innerR * Math.cos(toRad(startAngle));
  const y4 = cy + innerR * Math.sin(toRad(startAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

// Find a FlavorNode by name in the tree
function findNode(nodes: FlavorNode[], name: string): FlavorNode | null {
  for (const n of nodes) {
    if (n.name === name) return n;
    if (n.children) {
      const found = findNode(n.children, name);
      if (found) return found;
    }
  }
  return null;
}

export function FlavorWheel({
  selected,
  onToggle,
  onRemove,
  onClear,
  zoomedCategory,
  onZoom,
  hoveredNode,
  onHover,
  maxSelections = 5,
}: FlavorWheelProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;

  // Ring radii
  const innerR1 = 60,
    outerR1 = 120; // Inner ring (categories)
  const innerR2 = 122,
    outerR2 = 190; // Middle ring (subcategories)
  const innerR3 = 192,
    outerR3 = 245; // Outer ring (specific flavors)

  // Data to render (filtered if zoomed)
  const data = useMemo(() => {
    if (zoomedCategory) {
      return flavorWheelData.filter((d) => d.name === zoomedCategory);
    }
    return flavorWheelData;
  }, [zoomedCategory]);

  // Build segments
  const segments = useMemo(() => {
    const result: Array<{
      path: string;
      node: FlavorNode;
      ring: number;
      midAngle: number;
      spanAngle: number;
    }> = [];

    const totalCategories = data.length;
    const gapAngle = 1; // gap between segments in degrees
    let angle = -90; // start at top

    data.forEach((cat) => {
      const catSpan = 360 / totalCategories - gapAngle;
      const catStart = angle;
      const catEnd = angle + catSpan;

      // Inner ring segment
      result.push({
        path: arcPath(cx, cy, innerR1, outerR1, catStart, catEnd),
        node: cat,
        ring: 1,
        midAngle: (catStart + catEnd) / 2,
        spanAngle: catSpan,
      });

      // Middle ring (subcategories)
      if (cat.children) {
        const subCount = cat.children.length;
        const subSpan = catSpan / subCount;
        let subAngle = catStart;

        cat.children.forEach((sub) => {
          const subEnd = subAngle + subSpan;

          result.push({
            path: arcPath(cx, cy, innerR2, outerR2, subAngle + 0.3, subEnd - 0.3),
            node: sub,
            ring: 2,
            midAngle: (subAngle + subEnd) / 2,
            spanAngle: subSpan - 0.6,
          });

          // Outer ring (specific flavors)
          if (sub.children) {
            const leafCount = sub.children.length;
            const leafSpan = (subSpan - 0.6) / leafCount;
            let leafAngle = subAngle + 0.3;

            sub.children.forEach((leaf) => {
              const leafEnd = leafAngle + leafSpan;

              result.push({
                path: arcPath(cx, cy, innerR3, outerR3, leafAngle + 0.2, leafEnd - 0.2),
                node: leaf,
                ring: 3,
                midAngle: (leafAngle + leafEnd) / 2,
                spanAngle: leafSpan - 0.4,
              });

              leafAngle = leafEnd;
            });
          }

          subAngle = subEnd;
        });
      }

      angle = catEnd + gapAngle;
    });

    return result;
  }, [data, cx, cy, innerR1, outerR1, innerR2, outerR2, innerR3, outerR3]);

  // Get label position for a segment
  const getLabelPos = (midAngle: number, radius: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(toRad(midAngle)),
      y: cy + radius * Math.sin(toRad(midAngle)),
      rotation: midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle,
    };
  };

  // Determine if a label should be shown based on segment size
  const shouldShowLabel = (ring: number, spanAngle: number) => {
    if (ring === 1) return true;
    if (ring === 2) return spanAngle > 8;
    if (ring === 3) return spanAngle > 6;
    return false;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Breadcrumb / Back button */}
      {zoomedCategory && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onZoom(null)}>
            <ArrowLeft className="w-4 h-4 me-1" />
            {isAr ? 'العودة' : 'Back'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {isAr
              ? flavorWheelData.find((d) => d.name === zoomedCategory)?.name_ar
              : zoomedCategory}
          </span>
        </div>
      )}

      {/* SVG Wheel */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[500px] select-none"
        style={{
          transform: zoomedCategory ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Center circle */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR1 - 2}
          fill="#f8f7f4"
          stroke="#e5e4e0"
          strokeWidth="1"
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] fill-muted-foreground font-medium"
        >
          {isAr ? 'عجلة النكهات' : 'Flavor Wheel'}
        </text>

        {/* Segments */}
        {segments.map((seg, i) => {
          const isSelected = selected.includes(seg.node.name);
          const isHovered = hoveredNode === seg.node.name;
          const labelRadius =
            seg.ring === 1
              ? (innerR1 + outerR1) / 2
              : seg.ring === 2
                ? (innerR2 + outerR2) / 2
                : (innerR3 + outerR3) / 2;

          return (
            <g key={`${seg.node.name}-${i}`}>
              {/* Visible path — no pointer events */}
              <path
                d={seg.path}
                fill={seg.node.colour}
                stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isSelected ? 2.5 : 0.5}
                pointerEvents="none"
                style={{
                  opacity: isSelected ? 1 : isHovered ? 0.95 : 0.8,
                  transition: 'opacity 0.15s ease',
                }}
              />
              {/* Invisible hit-test overlay */}
              <path
                d={seg.path}
                fill="transparent"
                stroke="transparent"
                strokeWidth={3}
                pointerEvents="all"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (seg.ring === 1 && !zoomedCategory) {
                    onZoom(seg.node.name);
                  } else {
                    onToggle(seg.node.name);
                  }
                }}
                onPointerEnter={() => onHover(seg.node.name)}
                onPointerLeave={() => onHover(null)}
              />
              {/* Labels */}
              {shouldShowLabel(seg.ring, seg.spanAngle) &&
                (() => {
                  const pos = getLabelPos(seg.midAngle, labelRadius);
                  const fontSize = seg.ring === 1 ? '7px' : seg.ring === 2 ? '5.5px' : '4.5px';
                  return (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                      className="fill-white font-bold pointer-events-none"
                      style={{
                        fontSize,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      {isAr ? seg.node.name_ar : seg.node.name}
                    </text>
                  );
                })()}
            </g>
          );
        })}
      </svg>

      {/* Hovered flavor tooltip */}
      {hoveredNode && (
        <div className="text-center text-sm text-muted-foreground min-h-[24px]">
          {(() => {
            const node = findNode(flavorWheelData, hoveredNode);
            if (!node) return null;
            return (
              <span>
                <strong>{isAr ? node.name_ar : node.name}</strong>
                {node.definition && (
                  <span className="text-muted-foreground/70 ms-2">— {node.definition}</span>
                )}
              </span>
            );
          })()}
        </div>
      )}

      {/* Selected flavors chips */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[32px]">
        {selected.map((name) => {
          const node = findNode(flavorWheelData, name);
          return (
            <Badge
              key={name}
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-red-50"
              style={{ borderColor: node?.colour, color: node?.colour }}
              onClick={() => onRemove(name)}
            >
              {isAr ? node?.name_ar || name : name}
              <X className="w-3 h-3" />
            </Badge>
          );
        })}
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs text-muted-foreground/70"
          >
            <RotateCcw className="w-3 h-3 me-1" />
            {isAr ? 'مسح الكل' : 'Clear all'}
          </Button>
        )}
      </div>

      {/* Selection count */}
      <p className="text-xs text-muted-foreground/70">
        {selected.length}/{maxSelections}{' '}
        {isAr ? 'نكهات مختارة' : 'flavors selected'}
      </p>
    </div>
  );
}
