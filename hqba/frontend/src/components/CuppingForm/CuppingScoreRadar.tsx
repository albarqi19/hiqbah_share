import { useMemo } from 'react';

interface RadarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface CuppingScoreRadarProps {
  samples: Array<{
    name: string;
    color: string;
    scores: RadarDataPoint[];
  }>;
  size?: number;
}

const RADAR_ATTRIBUTES = [
  'fragrance', 'aroma', 'flavor', 'aftertaste',
  'acidity', 'body', 'balance', 'sweetness', 'overall_score',
];

export function CuppingScoreRadar({ samples, size = 300 }: CuppingScoreRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const levels = [6, 7, 8, 9, 10];

  const angleStep = (2 * Math.PI) / RADAR_ATTRIBUTES.length;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = ((value - 6) / 4) * maxRadius; // 6-10 range → 0-maxRadius
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const gridPaths = useMemo(() => {
    return levels.map((level) => {
      const radius = ((level - 6) / 4) * maxRadius;
      const points = RADAR_ATTRIBUTES.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
      });
      return points.join(' ');
    });
  }, [cx, cy, maxRadius, angleStep]);

  const axisLines = useMemo(() => {
    return RADAR_ATTRIBUTES.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return {
        x2: cx + maxRadius * Math.cos(angle),
        y2: cy + maxRadius * Math.sin(angle),
      };
    });
  }, [cx, cy, maxRadius, angleStep]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]">
      {/* Grid circles */}
      {gridPaths.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={i === levels.length - 1 ? 1.5 : 0.5}
        />
      ))}

      {/* Axis lines */}
      {axisLines.map((line, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={line.x2}
          y2={line.y2}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis labels */}
      {RADAR_ATTRIBUTES.map((attr, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 20;
        const x = cx + labelRadius * Math.cos(angle);
        const y = cy + labelRadius * Math.sin(angle);
        return (
          <text
            key={attr}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[8px] fill-muted-foreground/70"
          >
            {attr.charAt(0).toUpperCase() + attr.slice(1, 4)}
          </text>
        );
      })}

      {/* Sample polygons (overlay) */}
      {samples.map((sample, si) => {
        const points = sample.scores.map((s, i) => {
          const p = getPoint(i, s.value || 6);
          return `${p.x},${p.y}`;
        });

        return (
          <g key={si}>
            <polygon
              points={points.join(' ')}
              fill={sample.color}
              fillOpacity={0.15}
              stroke={sample.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {/* Dots */}
            {sample.scores.map((s, i) => {
              const p = getPoint(i, s.value || 6);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill={sample.color}
                  stroke="white"
                  strokeWidth={1}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
