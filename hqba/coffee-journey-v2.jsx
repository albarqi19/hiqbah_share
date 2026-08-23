import { useState, useRef } from "react";

/*
 * Coffee Bean Journey — Industrial Factory Dashboard
 * Snake layout: Row 0 L→R, Row 1 R→L, Row 2 L→R
 * Clean connection routing — no lines crossing cards
 */

const STAGES = [
  {
    id: "order", icon: "01", emoji: "📋",
    title: "طلب المحصول", titleEn: "Purchase Order",
    status: "completed", date: "15 يناير",
    desc: "إصدار أمر شراء من المحاسب للمحصول الأخضر",
    kpis: [
      { label: "المورد", value: "مزرعة يرغاشيفي" },
      { label: "المنشأ", value: "إثيوبيا" },
      { label: "الكمية", value: "500 كجم" },
      { label: "رقم اللوط", value: "LOT-2025-042" },
      { label: "التكلفة", value: "SAR 42,500" },
    ],
    col: 0, row: 0,
  },
  {
    id: "shipping", icon: "02", emoji: "🚢",
    title: "الشحن والنقل", titleEn: "Shipping & Transit",
    status: "completed", date: "01 فبراير",
    desc: "شحن بحري من أديس أبابا إلى ميناء الدمام",
    kpis: [
      { label: "طريقة الشحن", value: "بحري" },
      { label: "المدة", value: "21 يوم" },
      { label: "الحاوية", value: "CONT-8842" },
      { label: "التأمين", value: "مؤمّن" },
    ],
    col: 1, row: 0,
  },
  {
    id: "receiving", icon: "03", emoji: "📦",
    title: "الاستلام والتخزين", titleEn: "Receiving & Storage",
    status: "completed", date: "22 فبراير",
    desc: "استلام الشحنة وفحص الوزن والحالة العامة وتخزينها",
    kpis: [
      { label: "الوزن الفعلي", value: "498.5 كجم" },
      { label: "الفرق", value: "-1.5 كجم" },
      { label: "الحالة", value: "ممتازة" },
      { label: "المستودع", value: "الخبر - A3" },
    ],
    col: 2, row: 0,
  },
  {
    id: "sampling", icon: "04", emoji: "🔬",
    title: "فحص العينات", titleEn: "Sample Analysis",
    status: "completed", date: "24 فبراير",
    desc: "تحليل مخبري للرطوبة والكثافة وعد العيوب",
    kpis: [
      { label: "الرطوبة", value: "10.8%" },
      { label: "الكثافة", value: "720 g/L" },
      { label: "العيوب", value: "2 / 300g" },
      { label: "الحكم", value: "مطابق" },
    ],
    col: 3, row: 0,
  },
  // Row 1 — reversed: col 3 → 0
  {
    id: "sample_roast", icon: "05", emoji: "🔥",
    title: "تحميص تجريبي", titleEn: "Sample Roasting",
    status: "completed", date: "25 فبراير",
    desc: "تحميص 3 عينات بملفات تحميص مختلفة لتحديد الأفضل",
    kpis: [
      { label: "عدد الملفات", value: "3" },
      { label: "الملف الأمثل", value: "City+" },
      { label: "المدة", value: "11:30 د" },
      { label: "فقدان الوزن", value: "14.2%" },
    ],
    col: 3, row: 1,
  },
  {
    id: "cupping", icon: "06", emoji: "☕",
    title: "التذوق والتقييم", titleEn: "Cupping Session",
    status: "completed", date: "26 فبراير",
    desc: "جلسة تذوق احترافية وفق معايير SCA",
    kpis: [
      { label: "النتيجة", value: "86.5" },
      { label: "العطر", value: "8.5 / 10" },
      { label: "النكهة", value: "8.0 / 10" },
      { label: "الحموضة", value: "8.5 / 10" },
      { label: "الجسم", value: "7.5 / 10" },
    ],
    col: 2, row: 1,
  },
  {
    id: "decision", icon: "07", emoji: "✅",
    title: "قرار القبول", titleEn: "Approval Decision",
    status: "completed", date: "26 فبراير",
    desc: "تمت الموافقة على المحصول بعد اجتياز جميع اختبارات الجودة",
    kpis: [
      { label: "القرار", value: "مقبول" },
      { label: "المعتمد", value: "أحمد الغامدي" },
      { label: "المنصب", value: "مدير الجودة" },
    ],
    col: 1, row: 1,
  },
  {
    id: "calibration", icon: "08", emoji: "⚙️",
    title: "المعايرة", titleEn: "Machine Calibration",
    status: "completed", date: "27 فبراير",
    desc: "معايرة الآلات والمطاحن وتحديد الوصفة النهائية",
    kpis: [
      { label: "الجرعة", value: "18.5g" },
      { label: "العائد", value: "38g" },
      { label: "الوقت", value: "28 ثانية" },
      { label: "TDS", value: "1.35" },
      { label: "درجة الطحن", value: "4.5" },
    ],
    col: 0, row: 1,
  },
  // Row 2 — normal: col 0 → 3
  {
    id: "production", icon: "09", emoji: "🏭",
    title: "الإنتاج والتحميص", titleEn: "Production",
    status: "active", date: "01 مارس",
    desc: "تحميص الدفعات الإنتاجية وفقاً للملف المعتمد",
    kpis: [
      { label: "تم تحميصه", value: "285 كجم" },
      { label: "متبقي أخضر", value: "213.5 كجم" },
      { label: "عدد الدفعات", value: "19 دفعة" },
      { label: "متوسط الفقد", value: "14.5%" },
    ],
    col: 0, row: 2,
  },
  {
    id: "packaging", icon: "10", emoji: "📦",
    title: "التعبئة والتغليف", titleEn: "Packaging",
    status: "pending", date: "—",
    desc: "تعبئة المنتج النهائي بأحجام مختلفة مع ملصقات المعلومات",
    kpis: [
      { label: "الأحجام", value: "250g, 500g, 1kg" },
      { label: "إجمالي الأكياس", value: "—" },
    ],
    col: 1, row: 2,
  },
  {
    id: "sales", icon: "11", emoji: "🛒",
    title: "البيع والتوزيع", titleEn: "Sales & Distribution",
    status: "pending", date: "—",
    desc: "تلقي الطلبات من العملاء والفروع وتوزيع المنتجات",
    kpis: [
      { label: "الطلبات", value: "—" },
      { label: "الفروع", value: "الخبر، الرياض" },
    ],
    col: 2, row: 2,
  },
  {
    id: "report", icon: "12", emoji: "📊",
    title: "التقرير النهائي", titleEn: "Final Report",
    status: "pending", date: "—",
    desc: "تقرير شامل عن المحصول يتضمن التكاليف والإيرادات والهدر",
    kpis: [
      { label: "إجمالي التكلفة", value: "—" },
      { label: "الإيرادات", value: "—" },
      { label: "الهدر", value: "—" },
    ],
    col: 3, row: 2,
  },
];

// Connections in order
const CONN_ORDER = [
  "order", "shipping", "receiving", "sampling",
  "sample_roast", "cupping", "decision", "calibration",
  "production", "packaging", "sales", "report",
];

const STATUS_STYLE = {
  completed: {
    border: "#22C55E", bg: "#FFFFFF", topBar: "#22C55E",
    badgeBg: "#F0FDF4", badgeText: "#16A34A", badgeBorder: "#BBF7D0",
    dot: "#22C55E", label: "مكتمل",
  },
  active: {
    border: "#F59E0B", bg: "#FFFDF7", topBar: "#F59E0B",
    badgeBg: "#FFFBEB", badgeText: "#D97706", badgeBorder: "#FDE68A",
    dot: "#F59E0B", label: "جاري",
  },
  pending: {
    border: "#E5E7EB", bg: "#FFFFFF", topBar: "#D1D5DB",
    badgeBg: "#F9FAFB", badgeText: "#9CA3AF", badgeBorder: "#E5E7EB",
    dot: "#D1D5DB", label: "قادم",
  },
};

const NODE_W = 220;
const NODE_H_CARD = 110;
const GAP_X = 14;
const GAP_Y = 38;
const PAD_X = 32;
const PAD_Y = 20;
const TOTAL_W = PAD_X * 2 + NODE_W * 4 + GAP_X * 3;
const ROW_H = NODE_H_CARD + GAP_Y;

function getCardPos(stage) {
  return {
    x: PAD_X + stage.col * (NODE_W + GAP_X),
    y: PAD_Y + stage.row * ROW_H,
  };
}

function getCardCenter(stage) {
  const p = getCardPos(stage);
  return { x: p.x + NODE_W / 2, y: p.y + NODE_H_CARD / 2 };
}

function buildPaths() {
  const paths = [];
  for (let i = 0; i < CONN_ORDER.length - 1; i++) {
    const fromStage = STAGES.find((s) => s.id === CONN_ORDER[i]);
    const toStage = STAGES.find((s) => s.id === CONN_ORDER[i + 1]);
    const from = getCardCenter(fromStage);
    const to = getCardCenter(toStage);
    const sameRow = fromStage.row === toStage.row;

    let d;
    if (sameRow) {
      // Horizontal — straight with slight curve
      const dir = to.x > from.x ? 1 : -1;
      const startX = from.x + dir * (NODE_W / 2 + 2);
      const endX = to.x - dir * (NODE_W / 2 + 2);
      const midX = (startX + endX) / 2;
      d = `M ${startX} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${endX} ${to.y}`;
    } else {
      // Vertical transition between rows — route along the edge
      const fromPos = getCardPos(fromStage);
      const toPos = getCardPos(toStage);

      // Determine which side to exit/enter
      const goingDown = toStage.row > fromStage.row;
      const exitY = fromPos.y + NODE_H_CARD + 2;
      const enterY = toPos.y - 2;
      const midY = (exitY + enterY) / 2;

      if (fromStage.col === toStage.col) {
        // Same column, just go straight down
        d = `M ${from.x} ${exitY} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${enterY}`;
      } else {
        // Different columns — go down from source, across, then down to target
        const exitX = from.x;
        const enterX = to.x;
        d = `M ${exitX} ${exitY} L ${exitX} ${midY} C ${exitX} ${midY + 8}, ${enterX} ${midY - 8}, ${enterX} ${midY} L ${enterX} ${enterY}`;
      }
    }

    paths.push({
      d,
      fromStatus: fromStage.status,
      toStatus: toStage.status,
    });
  }
  return paths;
}

function AnimatedConnection({ d, fromStatus, toStatus }) {
  const isDone = fromStatus === "completed" && toStatus === "completed";
  const isActive = fromStatus === "completed" && toStatus === "active";
  const color = isDone ? "#22C55E" : isActive ? "#F59E0B" : "#E5E7EB";

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isDone ? 2 : isActive ? 2.5 : 1.5}
        strokeDasharray={isDone || isActive ? "none" : "5 4"}
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

function StageCard({ stage, isSelected, onClick, x, y, animDelay }) {
  const st = STATUS_STYLE[stage.status];
  const isActive = stage.status === "active";
  const isPending = stage.status === "pending";

  return (
    <div
      onClick={() => onClick(stage.id)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H_CARD,
        cursor: "pointer",
        zIndex: isSelected ? 20 : 1,
        animation: `cardIn 0.45s ease-out ${animDelay}s both`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: st.bg,
          borderRadius: 10,
          border: `${isSelected ? 2 : 1.5}px solid ${isSelected ? st.dot : st.border}`,
          overflow: "hidden",
          boxShadow: isSelected
            ? `0 0 0 3px ${st.dot}15, 0 8px 20px rgba(0,0,0,0.08)`
            : isActive
              ? "0 2px 12px rgba(245,158,11,0.12)"
              : "0 1px 3px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.25s, border-color 0.25s",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Color bar */}
        <div style={{ height: 4, background: st.topBar, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          {isActive && (
            <div style={{
              position: "absolute", inset: 0, width: "40%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
              animation: "shimmer 1.8s ease-in-out infinite",
            }} />
          )}
        </div>

        <div style={{ padding: "10px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", direction: "rtl" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Number badge */}
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: isPending ? "#F9FAFB" : st.badgeBg,
              border: `1.5px solid ${st.badgeBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: st.badgeText,
            }}>
              {stage.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 700,
                color: isPending ? "#B0B7C0" : "#1F2937",
                fontFamily: "'Noto Kufi Arabic', sans-serif",
                lineHeight: 1.4,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {stage.title}
              </div>
              <div style={{
                fontSize: 9, color: "#A0A8B4",
                fontFamily: "'DM Mono', monospace", letterSpacing: 0.4, marginTop: 1,
              }}>
                {stage.titleEn}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: st.badgeBg, border: `1px solid ${st.badgeBorder}`,
              borderRadius: 5, padding: "2px 8px",
              fontSize: 10, fontWeight: 600, color: st.badgeText,
              fontFamily: "'Noto Kufi Arabic', sans-serif",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: st.dot,
                display: "inline-block",
                animation: isActive ? "blink 1.2s ease-in-out infinite" : "none",
              }} />
              {st.label}
            </div>
            <span style={{ fontSize: 10, color: "#C0C5CC", fontFamily: "'DM Mono', monospace" }}>
              {stage.date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ stage, onClose }) {
  if (!stage) return null;
  const st = STATUS_STYLE[stage.status];

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 370,
      background: "#FFF", borderLeft: "1px solid #E5E7EB",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.06)",
      zIndex: 200, display: "flex", flexDirection: "column",
      direction: "rtl", animation: "drawerIn 0.25s ease-out",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #F3F4F6", background: "#FAFBFC" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 10,
              background: st.badgeBg, border: `2px solid ${st.badgeBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>
              {stage.emoji}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1F2937", fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                {stage.title}
              </h2>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>
                {stage.titleEn} • Step {stage.icon}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 7,
            background: "#F3F4F6", border: "1px solid #E5E7EB",
            color: "#6B7280", cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: st.badgeBg, border: `1px solid ${st.badgeBorder}`,
            borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600,
            color: st.badgeText, fontFamily: "'Noto Kufi Arabic', sans-serif",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot }} />
            {st.label}
          </div>
          <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Mono', monospace", lineHeight: "28px" }}>
            {stage.date}
          </span>
        </div>
      </div>

      {/* Desc */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A0A8B4", marginBottom: 5, fontFamily: "'DM Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>
          الوصف
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#4B5563", lineHeight: 1.8, fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
          {stage.desc}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ padding: "14px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A0A8B4", marginBottom: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>
          البيانات والمؤشرات
        </div>
        {stage.kpis.map((kpi, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 12px",
            background: i % 2 === 0 ? "#FAFBFC" : "#FFF",
            borderRadius: 7, border: "1px solid #F3F4F6", marginBottom: 4,
          }}>
            <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{kpi.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", fontFamily: "'DM Mono', monospace" }}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFBFC", display: "flex", gap: 8 }}>
        <button style={{
          flex: 1, padding: "9px 0", borderRadius: 8,
          background: "#1F2937", border: "none", color: "#FFF",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Noto Kufi Arabic', sans-serif",
        }}>عرض السجلات</button>
        <button style={{
          flex: 1, padding: "9px 0", borderRadius: 8,
          background: "#FFF", border: "1px solid #E5E7EB", color: "#4B5563",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Noto Kufi Arabic', sans-serif",
        }}>طباعة</button>
      </div>
    </div>
  );
}

export default function CoffeeJourneyIndustrial() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = STAGES.find((s) => s.id === selectedId);
  const completed = STAGES.filter((s) => s.status === "completed").length;
  const active = STAGES.find((s) => s.status === "active");
  const progress = Math.round((completed / STAGES.length) * 100);
  const paths = buildPaths();

  const SVG_W = TOTAL_W;
  const SVG_H = PAD_Y * 2 + ROW_H * 3;

  return (
    <div style={{ width: "100%", height: "100vh", background: "#F5F6F8", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        * { box-sizing:border-box; margin:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }
      `}</style>

      {/* ─── Top Bar ─── */}
      <div style={{
        height: 54, background: "#FFF", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", direction: "rtl", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#111827", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>☕</div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111827", fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
              تتبع المحصول
            </span>
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace", marginRight: 8 }}>
              Crop Tracker
            </span>
          </div>
          <div style={{ width: 1, height: 26, background: "#E5E7EB", margin: "0 4px" }} />
          <code style={{
            background: "#F3F4F6", borderRadius: 5, padding: "3px 10px",
            fontSize: 11, fontWeight: 600, color: "#6B7280", border: "1px solid #E5E7EB",
          }}>LOT-2025-042</code>
          <div style={{
            background: "#FFFBEB", borderRadius: 5, padding: "3px 10px",
            fontSize: 11, fontWeight: 600, color: "#92600A", border: "1px solid #FDE68A",
            fontFamily: "'Noto Kufi Arabic', sans-serif",
          }}>يرغاشيفي — إثيوبيا</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>PROGRESS</span>
            <div style={{ width: 110, height: 7, background: "#F3F4F6", borderRadius: 4, border: "1px solid #E5E7EB", overflow: "hidden" }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "linear-gradient(90deg, #22C55E, #F59E0B)",
                borderRadius: 4, transition: "width 0.6s ease",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#111827", fontFamily: "'DM Mono', monospace", width: 32 }}>
              {progress}%
            </span>
          </div>
          <div style={{ width: 1, height: 26, background: "#E5E7EB" }} />
          <div style={{ textAlign: "center", lineHeight: 1.1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#22C55E", fontFamily: "'DM Mono', monospace" }}>{completed}</div>
            <div style={{ fontSize: 8, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>DONE</div>
          </div>
          {active && (
            <>
              <div style={{ width: 1, height: 26, background: "#E5E7EB" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", animation: "blink 1.2s ease-in-out infinite" }} />
                <span style={{ fontSize: 12, color: "#92600A", fontWeight: 600, fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                  {active.title}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Breadcrumb ─── */}
      <div style={{
        height: 36, background: "#FFF", borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", padding: "0 24px", direction: "rtl", gap: 6, flexShrink: 0,
      }}>
        {["لوحة التحكم", "المحاصيل", "LOT-2025-042", "خط سير المحصول"].map((item, i, arr) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 11,
              color: i === arr.length - 1 ? "#111827" : "#9CA3AF",
              fontWeight: i === arr.length - 1 ? 700 : 400,
              fontFamily: i === 2 ? "'DM Mono', monospace" : "'Noto Kufi Arabic', sans-serif",
            }}>{item}</span>
            {i < arr.length - 1 && <span style={{ color: "#D1D5DB", fontSize: 10 }}>/</span>}
          </span>
        ))}
      </div>

      {/* ─── Canvas ─── */}
      <div style={{
        flex: 1, overflow: "auto", position: "relative",
        background: `
          linear-gradient(#ECEEF1 1px, transparent 1px),
          linear-gradient(90deg, #ECEEF1 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}>
        <div style={{ position: "relative", width: SVG_W, height: SVG_H, margin: "0 auto", minWidth: SVG_W }}>

          {/* Row labels */}
          {[
            { row: 0, label: "الاستلام والفحص", labelEn: "RECEIVING & QC" },
            { row: 1, label: "التقييم والمعايرة", labelEn: "EVALUATION & CALIBRATION" },
            { row: 2, label: "الإنتاج والتوزيع", labelEn: "PRODUCTION & DISTRIBUTION" },
          ].map(({ row, label, labelEn }) => (
            <div key={row} style={{
              position: "absolute",
              left: 0, right: 0,
              top: PAD_Y + row * ROW_H - 2,
              height: NODE_H_CARD + 4,
              background: row === 1 ? "rgba(245,158,11,0.018)" : "transparent",
              borderTop: "1px dashed #E5E7EB44",
              pointerEvents: "none",
              zIndex: 0,
            }} />
          ))}

          {/* SVG connections */}
          <svg
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {paths.map((p, i) => (
              <AnimatedConnection key={i} d={p.d} fromStatus={p.fromStatus} toStatus={p.toStatus} />
            ))}
          </svg>

          {/* Cards */}
          {STAGES.map((stage, i) => {
            const pos = getCardPos(stage);
            return (
              <StageCard
                key={stage.id}
                stage={stage}
                isSelected={selectedId === stage.id}
                onClick={setSelectedId}
                x={pos.x}
                y={pos.y}
                animDelay={i * 0.04}
              />
            );
          })}
        </div>
      </div>

      {/* ─── Drawer ─── */}
      {selected && <DetailDrawer stage={selected} onClose={() => setSelectedId(null)} />}

      {/* Overlay */}
      {selected && (
        <div
          onClick={() => setSelectedId(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.08)",
            zIndex: 150, cursor: "pointer",
          }}
        />
      )}
    </div>
  );
}
