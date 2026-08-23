import { useState, useMemo } from 'react';
import type { Crop, CropStatus, TimelineEvent } from '@/types';

// ── Types ──

type StageStatus = 'completed' | 'active' | 'pending';

interface StageDefinition {
  id: string;
  icon: string;
  emoji: string;
  title: string;
  titleEn: string;
  col: number;
  row: number;
  desc: string;
  descEn: string;
}

interface StageWithStatus extends StageDefinition {
  status: StageStatus;
  date: string;
  kpis: { label: string; value: string }[];
}

export interface CropJourneyMapProps {
  crop: Crop;
  timeline: TimelineEvent[];
  onStageClick?: (stageId: string) => void;
}

// ── Constants ──

const STAGES: StageDefinition[] = [
  // Row 0 — left to right
  {
    id: 'purchase_order', icon: '01', emoji: '\📋',
    title: 'طلب المحصول', titleEn: 'Purchase Order',
    col: 0, row: 0,
    desc: 'إصدار أمر شراء من المحاسب للمحصول الأخضر',
    descEn: 'Issue a purchase order for green coffee crop',
  },
  {
    id: 'shipping', icon: '02', emoji: '\🚢',
    title: 'الشحن والنقل', titleEn: 'Shipping & Transit',
    col: 1, row: 0,
    desc: 'شحن المحصول من بلد المنشأ إلى المستودع',
    descEn: 'Ship the crop from origin country to warehouse',
  },
  {
    id: 'receiving', icon: '03', emoji: '\📦',
    title: 'الاستلام والتخزين', titleEn: 'Receiving & Storage',
    col: 2, row: 0,
    desc: 'استلام الشحنة وفحص الوزن والحالة العامة وتخزينها',
    descEn: 'Receive shipment, verify weight and condition, store it',
  },
  {
    id: 'inspection', icon: '04', emoji: '\🔬',
    title: 'فحص العينات', titleEn: 'Sample Analysis',
    col: 3, row: 0,
    desc: 'تحليل مخبري للرطوبة والكثافة وعد العيوب',
    descEn: 'Lab analysis for moisture, density, and defect count',
  },
  // Row 1 — right to left
  {
    id: 'trial_roasting', icon: '05', emoji: '\🔥',
    title: 'تحميص تجريبي', titleEn: 'Sample Roasting',
    col: 3, row: 1,
    desc: 'تحميص عينات بملفات تحميص مختلفة لتحديد الأفضل',
    descEn: 'Roast samples with different profiles to find the best',
  },
  {
    id: 'cupping', icon: '06', emoji: '\☕',
    title: 'التذوق والتقييم', titleEn: 'Cupping Session',
    col: 2, row: 1,
    desc: 'جلسة تذوق احترافية وفق معايير SCA',
    descEn: 'Professional cupping session per SCA standards',
  },
  {
    id: 'approval', icon: '07', emoji: '\✅',
    title: 'قرار القبول', titleEn: 'Approval Decision',
    col: 1, row: 1,
    desc: 'اتخاذ قرار القبول أو الرفض بعد جميع الاختبارات',
    descEn: 'Make approval or rejection decision after all tests',
  },
  {
    id: 'recipe', icon: '08', emoji: '\⚙\️',
    title: 'الوصفة', titleEn: 'Recipe',
    col: 0, row: 1,
    desc: 'إعداد الوصفة النهائية للتحميص والإسبريسو',
    descEn: 'Prepare final roast and espresso recipe',
  },
  // Row 2 — left to right
  {
    id: 'production', icon: '09', emoji: '\🏭',
    title: 'الإنتاج والتحميص', titleEn: 'Production',
    col: 0, row: 2,
    desc: 'تحميص الدفعات الإنتاجية وفقاً للملف المعتمد',
    descEn: 'Roast production batches per approved profile',
  },
  {
    id: 'packaging', icon: '10', emoji: '\📦',
    title: 'التعبئة والتغليف', titleEn: 'Packaging',
    col: 1, row: 2,
    desc: 'تعبئة المنتج النهائي بأحجام مختلفة',
    descEn: 'Pack the final product in different sizes',
  },
  {
    id: 'sales', icon: '11', emoji: '\🛒',
    title: 'البيع والتوزيع', titleEn: 'Sales & Distribution',
    col: 2, row: 2,
    desc: 'تلقي الطلبات من العملاء والفروع وتوزيع المنتجات',
    descEn: 'Receive orders and distribute products',
  },
  {
    id: 'report', icon: '12', emoji: '\📊',
    title: 'التقرير النهائي', titleEn: 'Final Report',
    col: 3, row: 2,
    desc: 'تقرير شامل عن المحصول يتضمن التكاليف والإيرادات والهدر',
    descEn: 'Comprehensive crop report: costs, revenue, waste',
  },
];

const CONN_ORDER = [
  'purchase_order', 'shipping', 'receiving', 'inspection',
  'trial_roasting', 'cupping', 'approval', 'recipe',
  'production', 'packaging', 'sales', 'report',
];

const isDark = () => document.documentElement.classList.contains('dark');

const STATUS_STYLE_LIGHT: Record<StageStatus, {
  border: string; bg: string; topBar: string;
  badgeBg: string; badgeText: string; badgeBorder: string;
  dot: string; label: string;
}> = {
  completed: {
    border: '#22C55E', bg: '#FFFFFF', topBar: '#22C55E',
    badgeBg: '#F0FDF4', badgeText: '#16A34A', badgeBorder: '#BBF7D0',
    dot: '#22C55E', label: 'مكتمل',
  },
  active: {
    border: '#F59E0B', bg: '#FFFDF7', topBar: '#F59E0B',
    badgeBg: '#FFFBEB', badgeText: '#D97706', badgeBorder: '#FDE68A',
    dot: '#F59E0B', label: 'جاري',
  },
  pending: {
    border: '#E5E7EB', bg: '#FFFFFF', topBar: '#D1D5DB',
    badgeBg: '#F9FAFB', badgeText: '#9CA3AF', badgeBorder: '#E5E7EB',
    dot: '#D1D5DB', label: 'قادم',
  },
};

const STATUS_STYLE_DARK: Record<StageStatus, {
  border: string; bg: string; topBar: string;
  badgeBg: string; badgeText: string; badgeBorder: string;
  dot: string; label: string;
}> = {
  completed: {
    border: '#22C55E', bg: '#1a1a2e', topBar: '#22C55E',
    badgeBg: '#052e16', badgeText: '#4ade80', badgeBorder: '#166534',
    dot: '#22C55E', label: 'مكتمل',
  },
  active: {
    border: '#F59E0B', bg: '#1a1a2e', topBar: '#F59E0B',
    badgeBg: '#451a03', badgeText: '#fbbf24', badgeBorder: '#92400e',
    dot: '#F59E0B', label: 'جاري',
  },
  pending: {
    border: '#374151', bg: '#111827', topBar: '#4B5563',
    badgeBg: '#1f2937', badgeText: '#6B7280', badgeBorder: '#374151',
    dot: '#4B5563', label: 'قادم',
  },
};

function getStatusStyle(status: StageStatus) {
  return isDark() ? STATUS_STYLE_DARK[status] : STATUS_STYLE_LIGHT[status];
}

// ── Layout Constants ──

const NODE_W = 220;
const NODE_H_CARD = 110;
const GAP_X = 14;
const GAP_Y = 38;
const PAD_X = 32;
const PAD_Y = 20;
const TOTAL_W = PAD_X * 2 + NODE_W * 4 + GAP_X * 3;
const ROW_H = NODE_H_CARD + GAP_Y;
const SVG_H = PAD_Y * 2 + ROW_H * 3;

// ── Status-to-stage mapping ──

const STATUS_ORDER: CropStatus[] = [
  'ordered', 'received', 'inspecting', 'trial_roasting', 'cupping',
  'approved', 'pricing', 'marketing', 'production_ready', 'in_production',
  'depleted', 'closed',
];

// Maps each stage index to its corresponding status index in STATUS_ORDER
const STAGE_STATUS_MAP = [0, 0, 1, 2, 3, 4, 5, 5, 8, 9, 10, 11];

// ── Helpers ──

function getCardPos(stage: StageDefinition) {
  return {
    x: PAD_X + stage.col * (NODE_W + GAP_X),
    y: PAD_Y + stage.row * ROW_H,
  };
}

function getCardCenter(stage: StageDefinition) {
  const p = getCardPos(stage);
  return { x: p.x + NODE_W / 2, y: p.y + NODE_H_CARD / 2 };
}

function resolveStageStatuses(cropStatus: CropStatus): StageStatus[] {
  const currentIndex = STATUS_ORDER.indexOf(cropStatus);
  return STAGES.map((_, i) => {
    const stageIndex = STAGE_STATUS_MAP[i] ?? i;
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  });
}

function getKpisForStage(stageId: string, crop: Crop, timeline: TimelineEvent[]): { label: string; value: string }[] {
  const timelineForStage = timeline.filter(t => t.stage === stageId);

  switch (stageId) {
    case 'purchase_order': {
      const po = crop.purchase_order;
      return po ? [
        { label: 'المورد', value: po.supplier?.name ?? '\—' },
        { label: 'المنشأ', value: `${po.origin_country}` },
        { label: 'الكمية', value: `${po.quantity_kg} كجم` },
        { label: 'رقم الطلب', value: po.po_number },
        { label: 'التكلفة', value: `${po.currency} ${po.total_cost?.toLocaleString()}` },
      ] : [];
    }
    case 'shipping':
      return [
        { label: 'طريقة الشحن', value: 'بحري' },
        { label: 'الحالة', value: crop.purchase_order?.status === 'shipped' ? 'في الطريق' : '\—' },
      ];
    case 'receiving': {
      const lot = timelineForStage[0]?.data;
      return lot ? [
        { label: 'الوزن الفعلي', value: `${lot.actual_weight ?? '\—'} كجم` },
        { label: 'الفرق', value: `${lot.weight_variance ?? '\—'} كجم` },
        { label: 'عدد الأكياس', value: `${lot.bags_count ?? '\—'}` },
      ] : [
        { label: 'الوزن الكلي', value: `${crop.total_green_weight} كجم` },
      ];
    }
    case 'inspection': {
      const insp = timelineForStage[0]?.data;
      return insp ? [
        { label: 'الرطوبة', value: insp.moisture_percent ? `${insp.moisture_percent}%` : '\—' },
        { label: 'الكثافة', value: insp.density ? `${insp.density} g/L` : '\—' },
        { label: 'العيوب', value: insp.defect_count != null ? `${insp.defect_count}` : '\—' },
        { label: 'الحكم', value: insp.decision ? String(insp.decision) : '\—' },
      ] : [];
    }
    case 'trial_roasting': {
      const trial = timelineForStage.find(t => t.data?.status === 'selected')?.data || timelineForStage[0]?.data;
      return trial ? [
        { label: 'عدد التجارب', value: `${timelineForStage.length}` },
        { label: 'المستوى', value: trial.roast_level ? String(trial.roast_level) : '\—' },
        { label: 'المدة', value: trial.total_roast_time ? String(trial.total_roast_time) : '\—' },
        { label: 'فقدان الوزن', value: trial.roast_loss_percent ? `${trial.roast_loss_percent}%` : '\—' },
      ] : [];
    }
    case 'cupping': {
      const cupping = timelineForStage[0]?.data;
      return cupping ? [
        { label: 'النتيجة', value: cupping.final_score ? `${cupping.final_score}` : '\—' },
        { label: 'العطر', value: cupping.fragrance ? `${cupping.fragrance} / 10` : '\—' },
        { label: 'النكهة', value: cupping.flavor ? `${cupping.flavor} / 10` : '\—' },
        { label: 'الحموضة', value: cupping.acidity ? `${cupping.acidity} / 10` : '\—' },
        { label: 'الجسم', value: cupping.body ? `${cupping.body} / 10` : '\—' },
      ] : [];
    }
    case 'approval':
      return [
        { label: 'القرار', value: STATUS_ORDER.indexOf(crop.status) >= STATUS_ORDER.indexOf('approved') ? 'مقبول' : '\—' },
      ];
    case 'recipe':
      return [
        { label: 'الحالة', value: STATUS_ORDER.indexOf(crop.status) >= STATUS_ORDER.indexOf('pricing') ? 'معدة' : '\—' },
      ];
    case 'production':
      return [
        { label: 'تم تحميصه', value: crop.total_green_weight && crop.remaining_green_weight ? `${(crop.total_green_weight - crop.remaining_green_weight).toFixed(1)} كجم` : '\—' },
        { label: 'متبقي أخضر', value: `${crop.remaining_green_weight} كجم` },
      ];
    case 'packaging':
      return [
        { label: 'الأحجام', value: '250g, 500g, 1kg' },
      ];
    case 'sales':
      return [
        { label: 'الطلبات', value: '\—' },
      ];
    case 'report':
      return [
        { label: 'إجمالي التكلفة', value: '\—' },
        { label: 'الإيرادات', value: '\—' },
      ];
    default:
      return [];
  }
}

function getDateForStage(stageId: string, timeline: TimelineEvent[]): string {
  const event = timeline.find(t => t.stage === stageId);
  if (!event?.date) return '\—';
  try {
    return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long' }).format(new Date(event.date));
  } catch {
    return String(event.date).substring(0, 10);
  }
}

function buildPaths(stages: StageWithStatus[]) {
  const paths: { d: string; fromStatus: StageStatus; toStatus: StageStatus }[] = [];
  for (let i = 0; i < CONN_ORDER.length - 1; i++) {
    const fromStage = stages.find(s => s.id === CONN_ORDER[i])!;
    const toStage = stages.find(s => s.id === CONN_ORDER[i + 1])!;
    const from = getCardCenter(fromStage);
    const to = getCardCenter(toStage);
    const sameRow = fromStage.row === toStage.row;

    let d: string;
    if (sameRow) {
      const dir = to.x > from.x ? 1 : -1;
      const startX = from.x + dir * (NODE_W / 2 + 2);
      const endX = to.x - dir * (NODE_W / 2 + 2);
      const midX = (startX + endX) / 2;
      d = `M ${startX} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${endX} ${to.y}`;
    } else {
      const fromPos = getCardPos(fromStage);
      const toPos = getCardPos(toStage);
      const exitY = fromPos.y + NODE_H_CARD + 2;
      const enterY = toPos.y - 2;
      const midY = (exitY + enterY) / 2;

      if (fromStage.col === toStage.col) {
        d = `M ${from.x} ${exitY} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${enterY}`;
      } else {
        const exitX = from.x;
        const enterX = to.x;
        d = `M ${exitX} ${exitY} L ${exitX} ${midY} C ${exitX} ${midY + 8}, ${enterX} ${midY - 8}, ${enterX} ${midY} L ${enterX} ${enterY}`;
      }
    }

    paths.push({ d, fromStatus: fromStage.status, toStatus: toStage.status });
  }
  return paths;
}

// ── Sub-components ──

function AnimatedConnection({ d, fromStatus, toStatus }: { d: string; fromStatus: StageStatus; toStatus: StageStatus }) {
  const isDone = fromStatus === 'completed' && toStatus === 'completed';
  const isActive = fromStatus === 'completed' && toStatus === 'active';
  const color = isDone ? '#22C55E' : isActive ? '#F59E0B' : (isDark() ? '#374151' : '#E5E7EB');

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isDone ? 2 : isActive ? 2.5 : 1.5}
        strokeDasharray={isDone || isActive ? 'none' : '5 4'}
        opacity={isDone || isActive ? 1 : 0.5}
        strokeLinecap="round"
      />
      {isActive && (
        <>
          <circle r={5} fill="#F59E0B" opacity={0.9}>
            <animateMotion dur="2s" repeatCount="indefinite" path={d} />
          </circle>
          <circle r={9} fill="none" stroke="#F59E0B" strokeWidth={1.5} opacity={0.3}>
            <animateMotion dur="2s" repeatCount="indefinite" path={d} />
          </circle>
        </>
      )}
      {isDone && (
        <circle r={2.5} fill="#22C55E" opacity={0.5}>
          <animateMotion dur="3.5s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

function StageCard({
  stage, isSelected, onClick, x, y, animDelay,
}: {
  stage: StageWithStatus; isSelected: boolean;
  onClick: (id: string) => void; x: number; y: number; animDelay: number;
}) {
  const st = getStatusStyle(stage.status);
  const isActive = stage.status === 'active';
  const isPending = stage.status === 'pending';

  return (
    <div
      onClick={() => onClick(stage.id)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H_CARD,
        cursor: 'pointer',
        zIndex: isSelected ? 20 : 1,
        animation: `cardIn 0.45s ease-out ${animDelay}s both`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: st.bg,
          borderRadius: 10,
          border: `${isSelected ? 2 : 1.5}px solid ${isSelected ? st.dot : st.border}`,
          overflow: 'hidden',
          boxShadow: isSelected
            ? `0 0 0 3px ${st.dot}15, 0 8px 20px rgba(0,0,0,0.08)`
            : isActive
              ? '0 2px 12px rgba(245,158,11,0.12)'
              : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.25s, border-color 0.25s',
          display: 'flex',
          flexDirection: 'column' as const,
        }}
      >
        {/* Color bar */}
        <div style={{ height: 4, background: st.topBar, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          {isActive && (
            <div style={{
              position: 'absolute', inset: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.8s ease-in-out infinite',
            }} />
          )}
        </div>

        <div style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', direction: 'rtl' }}>
          {/* Top row */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-[34px] h-[34px] rounded-lg flex-shrink-0 flex items-center justify-center font-mono text-[13px] font-bold"
              style={{
                background: isPending ? (isDark() ? '#1f2937' : '#F9FAFB') : st.badgeBg,
                border: `1.5px solid ${st.badgeBorder}`,
                color: st.badgeText,
              }}
            >
              {stage.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[12.5px] font-bold leading-snug whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ color: isPending ? (isDark() ? '#4B5563' : '#B0B7C0') : (isDark() ? '#F3F4F6' : '#1F2937'), fontFamily: "'Noto Kufi Arabic', sans-serif" }}
              >
                {stage.title}
              </div>
              <div className="text-[9px] text-muted-foreground/70 font-mono tracking-wide mt-px">
                {stage.titleEn}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-1.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: st.badgeBg,
                border: `1px solid ${st.badgeBorder}`,
                color: st.badgeText,
                fontFamily: "'Noto Kufi Arabic', sans-serif",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{
                  background: st.dot,
                  animation: isActive ? 'blink 1.2s ease-in-out infinite' : 'none',
                }}
              />
              {st.label}
            </div>
            <span className="text-[10px] text-muted-foreground/50 font-mono">{stage.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ stage, onClose }: { stage: StageWithStatus; onClose: () => void }) {
  const st = getStatusStyle(stage.status);

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 370,
        background: isDark() ? '#1a1a2e' : '#FFF', borderLeft: `1px solid ${isDark() ? '#374151' : '#E5E7EB'}`,
        boxShadow: isDark() ? '-4px 0 24px rgba(0,0,0,0.3)' : '-4px 0 24px rgba(0,0,0,0.06)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
        direction: 'rtl', animation: 'drawerIn 0.25s ease-out',
      }}
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-border bg-muted/50">
        <div className="flex justify-between items-start mb-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-[46px] h-[46px] rounded-[10px] flex items-center justify-center text-2xl"
              style={{ background: st.badgeBg, border: `2px solid ${st.badgeBorder}` }}
            >
              {stage.emoji}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                {stage.title}
              </h2>
              <span className="text-[11px] text-muted-foreground/70 font-mono">
                {stage.titleEn} &bull; Step {stage.icon}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-[7px] bg-accent border border-border text-muted-foreground cursor-pointer text-[13px] flex items-center justify-center hover:bg-accent"
          >
            &times;
          </button>
        </div>
        <div className="flex gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: st.badgeBg,
              border: `1px solid ${st.badgeBorder}`,
              color: st.badgeText,
              fontFamily: "'Noto Kufi Arabic', sans-serif",
            }}
          >
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: st.dot }} />
            {st.label}
          </div>
          <span className="text-[11px] text-muted-foreground/70 font-mono leading-7">{stage.date}</span>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3.5 border-b border-border">
        <div className="text-[9px] font-bold text-muted-foreground/70 font-mono tracking-widest uppercase mb-1.5">
          الوصف
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
          {stage.desc}
        </p>
      </div>

      {/* KPIs */}
      <div className="px-5 py-3.5 flex-1 overflow-y-auto">
        <div className="text-[9px] font-bold text-muted-foreground/70 font-mono tracking-widest uppercase mb-2.5">
          البيانات والمؤشرات
        </div>
        {stage.kpis.map((kpi, i) => (
          <div
            key={i}
            className={`flex justify-between items-center px-3 py-2.5 rounded-[7px] border border-border mb-1 ${i % 2 === 0 ? 'bg-muted/50' : 'bg-card'}`}
          >
            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{kpi.label}</span>
            <span className="text-[13px] font-bold text-foreground font-mono">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/50 flex gap-2">
        <button
          className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
          style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
        >
          عرض السجلات
        </button>
        <button
          className="flex-1 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-xs font-semibold cursor-pointer"
          style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
        >
          طباعة
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──

export function CropJourneyMap({ crop, timeline, onStageClick }: CropJourneyMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stages: StageWithStatus[] = useMemo(() => {
    const statuses = resolveStageStatuses(crop.status);
    return STAGES.map((stage, i) => ({
      ...stage,
      status: statuses[i],
      date: getDateForStage(stage.id, timeline),
      kpis: getKpisForStage(stage.id, crop, timeline),
    }));
  }, [crop, timeline]);

  const selected = stages.find(s => s.id === selectedId) ?? null;
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const activeStage = stages.find(s => s.status === 'active');
  const progress = Math.round((completedCount / stages.length) * 100);
  const paths = useMemo(() => buildPaths(stages), [stages]);

  const handleCardClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
    onStageClick?.(id);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden">
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
      `}</style>

      {/* Top Bar */}
      <div className="h-[54px] bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0" style={{ direction: 'rtl' }}>
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-lg bg-background flex items-center justify-center text-base">
            \☕
          </div>
          <div>
            <span className="text-sm font-extrabold text-foreground" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
              تتبع المحصول
            </span>
            <span className="text-[10px] text-muted-foreground/70 font-mono me-2">
              Crop Tracker
            </span>
          </div>
          <div className="w-px h-[26px] bg-accent mx-1" />
          <code className="bg-accent rounded-[5px] px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border">
            {crop.serial_number}
          </code>
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-[5px] px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
            {crop.name_ar || crop.name} \— {crop.origin_country}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/70 font-mono">PROGRESS</span>
            <div className="w-[110px] h-[7px] bg-accent rounded border border-border overflow-hidden">
              <div
                className="h-full rounded transition-all duration-600"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #22C55E, #F59E0B)',
                }}
              />
            </div>
            <span className="text-[13px] font-extrabold text-foreground font-mono w-8">
              {progress}%
            </span>
          </div>
          <div className="w-px h-[26px] bg-accent" />
          <div className="text-center leading-none">
            <div className="text-base font-extrabold text-green-500 font-mono">{completedCount}</div>
            <div className="text-[8px] text-muted-foreground/70 font-mono">DONE</div>
          </div>
          {activeStage && (
            <>
              <div className="w-px h-[26px] bg-accent" />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'blink 1.2s ease-in-out infinite' }} />
                <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                  {activeStage.title}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="h-9 bg-card border-b border-border flex items-center px-6 gap-1.5 flex-shrink-0" style={{ direction: 'rtl' }}>
        {['لوحة التحكم', 'المحاصيل', crop.serial_number, 'خط سير المحصول'].map((item, i, arr) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className={`text-[11px] ${i === arr.length - 1 ? 'font-bold text-foreground' : 'text-muted-foreground/70'}`}
              style={{ fontFamily: i === 2 ? "'DM Mono', monospace" : "'Noto Kufi Arabic', sans-serif" }}
            >
              {item}
            </span>
            {i < arr.length - 1 && <span className="text-muted-foreground/50 text-[10px]">/</span>}
          </span>
        ))}
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-auto relative"
        style={{
          background: isDark()
            ? `linear-gradient(rgba(55,65,81,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(55,65,81,0.3) 1px, transparent 1px)`
            : `linear-gradient(#ECEEF1 1px, transparent 1px), linear-gradient(90deg, #ECEEF1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      >
        <div style={{ position: 'relative', width: TOTAL_W, height: SVG_H, margin: '0 auto', minWidth: TOTAL_W }}>
          {/* Row background hints */}
          {[0, 1, 2].map(row => (
            <div
              key={row}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: PAD_Y + row * ROW_H - 2,
                height: NODE_H_CARD + 4,
                background: row === 1 ? 'rgba(245,158,11,0.018)' : 'transparent',
                borderTop: `1px dashed ${isDark() ? 'rgba(75,85,99,0.27)' : 'rgba(229,231,235,0.27)'}`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ))}

          {/* SVG connections */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
            viewBox={`0 0 ${TOTAL_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {paths.map((p, i) => (
              <AnimatedConnection key={i} d={p.d} fromStatus={p.fromStatus} toStatus={p.toStatus} />
            ))}
          </svg>

          {/* Cards */}
          {stages.map((stage, i) => {
            const pos = getCardPos(stage);
            return (
              <StageCard
                key={stage.id}
                stage={stage}
                isSelected={selectedId === stage.id}
                onClick={handleCardClick}
                x={pos.x}
                y={pos.y}
                animDelay={i * 0.04}
              />
            );
          })}
        </div>
      </div>

      {/* Drawer */}
      {selected && <DetailDrawer stage={selected} onClose={() => setSelectedId(null)} />}

      {/* Overlay */}
      {selected && (
        <div
          onClick={() => setSelectedId(null)}
          className="fixed inset-0 bg-black/[0.08] z-[150] cursor-pointer"
        />
      )}
    </div>
  );
}
