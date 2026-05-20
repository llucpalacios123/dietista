/* eslint-disable */
// ui.jsx — Atoms & molecules for Dietista

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

/* ──────────────── Icons (Lucide-style, hand-drawn paths) ──────────────── */
const Ico = ({ name, size = 20, stroke = 1.75, color = 'currentColor', style }) => {
  const p = {
    home: <><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"/></>,
    book: <><path d="M5 4a1 1 0 011-1h11a2 2 0 012 2v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4z"/><path d="M9 3v18"/></>,
    plate: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/></>,
    trend: <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chev: <polyline points="9 18 15 12 9 6"/>,
    chevL: <polyline points="15 18 9 12 15 6"/>,
    chevD: <polyline points="6 9 12 15 18 9"/>,
    chevU: <polyline points="6 15 12 9 18 15"/>,
    sparkle: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M19 14l.7 1.8L21.5 16.5l-1.8.7L19 19l-.7-1.8-1.8-.7L18.3 15.8 19 14z"/></>,
    flame: <><path d="M12 3c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 2-7 0 2 2 3 4-4z"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    weight: <><path d="M4 21l2-13h12l2 13H4z"/><path d="M9 8a3 3 0 016 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>,
    bolt: <polygon points="13 3 4 14 11 14 10 21 19 10 13 10 13 3"/>,
    bell: <><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></>,
    camera: <><rect x="2.5" y="6.5" width="19" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6.5l1.5-2h5L16 6.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.4-4.4"/></>,
    moon: <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.4 2.6a2 2 0 112.8 2.8L12 14.6 8 16l1.4-4L18.4 2.6z"/></>,
    check: <polyline points="4 12 10 18 20 6"/>,
    x: <><path d="M5 5l14 14M19 5L5 19"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v5h1"/></>,
    apple: <><path d="M12 7c0-2 2-4 4-4 .3 2-1 4-4 4z"/><path d="M12 7c-3 0-6 2-6 6 0 5 4 9 6 9s2-1 3-1 1 1 3 1 6-4 6-9c0-4-3-6-6-6-1 0-2 1-3 1s-2-1-3-1z"/></>,
  }[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {p}
    </svg>
  );
};

/* ──────────────── Macro Ring ──────────────── */
/* Single-ring (for individual macros) */
function MacroRing({
  value, target, label, unit = 'g', color = 'var(--brand-500)',
  bg = 'var(--ring-cal-bg)', size = 86, stroke = 8, showPct = false,
  centerBig, centerSmall, animateKey = 0,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / target, 1.3);
  const dashOffset = c * (1 - pct);
  const over = value > target;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
          <circle
            key={animateKey}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 900ms cubic-bezier(.4,1.2,.5,1)',
            }}
          />
          {over && (
            <circle cx={size/2} cy={size/2} r={r - stroke - 1} fill="none"
              stroke={color} strokeWidth={2} opacity={0.4}/>
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>
          {centerBig ?? (
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }} className="tnum">
              {Math.round(value)}
            </div>
          )}
          {centerSmall ?? (
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginTop: 3 }}>
              /{target}{unit}
            </div>
          )}
        </div>
      </div>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.005em' }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* Hero ring (large, calorie-centric, with concentric macro arcs) */
function HeroMacroRing({
  calories, calTarget,
  protein, proTarget,
  carbs, carbTarget,
  fat, fatTarget,
  size = 220, style = 'concentric',
}) {
  const remaining = Math.max(0, calTarget - calories);
  const isCompact = style === 'minimal' || size < 180;

  // Concentric: 3 inner macro rings + outer calorie ring
  const ringDef = (radius, stroke, color, bg, val, tgt) => {
    const c = 2 * Math.PI * radius;
    const pct = Math.min(val / tgt, 1);
    return { radius, stroke, color, bg, dash: c, offset: c * (1 - pct) };
  };

  // Outer→inner: cal, pro, carb, fat
  const center = size / 2;
  const sw = size > 200 ? 11 : 9;
  const gap = sw + 4;

  const rCal  = (size - sw) / 2;
  const rPro  = rCal - gap;
  const rCarb = rPro - gap;
  const rFat  = rCarb - gap;

  const cCal  = ringDef(rCal,  sw, 'var(--ring-cal)',  'var(--ring-cal-bg)',  calories, calTarget);
  const cPro  = ringDef(rPro,  sw, 'var(--ring-pro)',  'var(--ring-pro-bg)',  protein, proTarget);
  const cCarb = ringDef(rCarb, sw, 'var(--ring-carb)', 'var(--ring-carb-bg)', carbs, carbTarget);
  const cFat  = ringDef(rFat,  sw, 'var(--ring-fat)',  'var(--ring-fat-bg)',  fat, fatTarget);

  if (style === 'minimal') {
    // Single big ring for calories, 3 small rings for macros
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <MacroRing
          value={calories} target={calTarget}
          color="var(--ring-cal)" bg="var(--ring-cal-bg)"
          size={size * 0.7} stroke={10}
          centerBig={
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }} className="tnum">
              {Math.round(calories)}
            </div>
          }
          centerSmall={
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, fontWeight: 500 }}>
              de {calTarget} kcal
            </div>
          }
        />
        <div style={{ display: 'flex', gap: 18 }}>
          <MacroRing label="Proteínas" value={protein} target={proTarget} color="var(--ring-pro)" bg="var(--ring-pro-bg)" size={60} stroke={6}/>
          <MacroRing label="Carbs" value={carbs} target={carbTarget} color="var(--ring-carb)" bg="var(--ring-carb-bg)" size={60} stroke={6}/>
          <MacroRing label="Grasas" value={fat} target={fatTarget} color="var(--ring-fat)" bg="var(--ring-fat-bg)" size={60} stroke={6}/>
        </div>
      </div>
    );
  }

  // Concentric (default)
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {[cCal, cPro, cCarb, cFat].map((ring, i) => (
          <g key={i}>
            <circle cx={center} cy={center} r={ring.radius} fill="none"
              stroke={ring.bg} strokeWidth={ring.stroke}/>
            <circle cx={center} cy={center} r={ring.radius} fill="none"
              stroke={ring.color} strokeWidth={ring.stroke}
              strokeLinecap="round"
              strokeDasharray={ring.dash}
              strokeDashoffset={ring.offset}
              style={{ transition: 'stroke-dashoffset 1100ms cubic-bezier(.3,1.1,.4,1)' }}
            />
          </g>
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Restantes
        </div>
        <div className="tnum" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text)', marginTop: 8 }}>
          {remaining}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, fontWeight: 500 }}>
          kcal · {calories} / {calTarget}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Macro Bar (compact horizontal) ──────────────── */
function MacroBar({ label, value, target, color, unit = 'g' }) {
  const pct = Math.min(value / target, 1) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
          {value}<span style={{ color: 'var(--text-3)', fontWeight: 500 }}>/{target}{unit}</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color, borderRadius: 999,
          transition: 'width 800ms cubic-bezier(.4,1.2,.5,1)',
        }}/>
      </div>
    </div>
  );
}

/* ──────────────── Sparkline ──────────────── */
function Sparkline({ values, width = 100, height = 28, color = 'var(--brand-500)', fill = true, showDots = false }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={area} fill={color} opacity={0.12}/>}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      {showDots && points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill={color}/>
      ))}
    </svg>
  );
}

/* ──────────────── Line Chart (weight) ──────────────── */
function LineChart({ data, width = 340, height = 200, goal, color = 'var(--brand-500)', unit = 'kg' }) {
  const pad = { top: 16, right: 12, bottom: 24, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = data.map(d => d.v);
  const max = Math.max(...values, goal ?? -Infinity) + 0.5;
  const min = Math.min(...values, goal ?? Infinity) - 0.5;
  const range = max - min;
  const xStep = innerW / Math.max(data.length - 1, 1);
  const ptX = i => pad.left + i * xStep;
  const ptY = v => pad.top + (1 - (v - min) / range) * innerH;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${ptX(i)} ${ptY(d.v)}`).join(' ');
  const area = `${path} L ${ptX(data.length-1)} ${pad.top + innerH} L ${ptX(0)} ${pad.top + innerH} Z`;

  // Moving average
  const ma = data.map((_, i) => {
    const s = Math.max(0, i - 3);
    const slice = data.slice(s, i + 1).map(d => d.v);
    return slice.reduce((a,b)=>a+b,0) / slice.length;
  });
  const maPath = ma.map((v, i) => `${i === 0 ? 'M' : 'L'} ${ptX(i)} ${ptY(v)}`).join(' ');

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i / yTicks));

  return (
    <svg width={width} height={height}>
      {/* y grid */}
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} x2={width - pad.right} y1={ptY(v)} y2={ptY(v)}
            stroke="var(--hairline)" strokeWidth={1}/>
          <text x={pad.left - 6} y={ptY(v) + 3} fontSize={9.5} fontWeight={500}
            fill="var(--text-3)" textAnchor="end" className="tnum">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      {/* x labels (sparse) */}
      {data.map((d, i) => i % Math.ceil(data.length / 6) === 0 && (
        <text key={i} x={ptX(i)} y={height - 6} fontSize={9.5} fontWeight={500}
          fill="var(--text-3)" textAnchor="middle">{d.label}</text>
      ))}
      {/* area */}
      <defs>
        <linearGradient id="weightGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#weightGrad)"/>
      {/* goal line */}
      {goal != null && (
        <g>
          <line x1={pad.left} x2={width - pad.right} y1={ptY(goal)} y2={ptY(goal)}
            stroke="var(--text-3)" strokeWidth={1} strokeDasharray="3 3"/>
          <text x={width - pad.right - 2} y={ptY(goal) - 4} fontSize={9.5} fontWeight={600}
            fill="var(--text-3)" textAnchor="end">Meta {goal}{unit}</text>
        </g>
      )}
      {/* moving avg */}
      <path d={maPath} stroke="var(--text-3)" strokeWidth={1.5} fill="none" strokeDasharray="2 2"/>
      {/* main line */}
      <path d={path} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* dots */}
      {data.map((d, i) => (
        <circle key={i} cx={ptX(i)} cy={ptY(d.v)} r={2.6} fill="var(--surface)" stroke={color} strokeWidth={1.8}/>
      ))}
      {/* last point emphasized */}
      <circle cx={ptX(data.length-1)} cy={ptY(data[data.length-1].v)} r={5} fill={color} opacity={0.18}/>
      <circle cx={ptX(data.length-1)} cy={ptY(data[data.length-1].v)} r={3.5} fill={color}/>
    </svg>
  );
}

/* ──────────────── Stacked Macro Bar Chart ──────────────── */
function StackedMacroChart({ data, width = 340, height = 200 }) {
  // data: [{ label, pro, carb, fat }]
  const pad = { top: 12, right: 8, bottom: 22, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const totals = data.map(d => (d.pro * 4) + (d.carb * 4) + (d.fat * 9));
  const max = Math.max(...totals, 100);
  const barW = innerW / data.length * 0.62;
  const xStep = innerW / data.length;

  return (
    <svg width={width} height={height}>
      {/* y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = pad.top + (1 - t) * innerH;
        const v = Math.round(max * t);
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--hairline)" strokeWidth={1}/>
            <text x={pad.left - 4} y={y + 3} fontSize={9} fontWeight={500} fill="var(--text-3)" textAnchor="end" className="tnum">{v}</text>
          </g>
        );
      })}
      {/* bars */}
      {data.map((d, i) => {
        const total = (d.pro*4) + (d.carb*4) + (d.fat*9);
        const x = pad.left + i * xStep + (xStep - barW) / 2;
        const h = (total / max) * innerH;
        const yBase = pad.top + innerH;
        const proH = ((d.pro*4) / max) * innerH;
        const carbH = ((d.carb*4) / max) * innerH;
        const fatH = ((d.fat*9) / max) * innerH;
        return (
          <g key={i}>
            {/* fat (top) */}
            <rect x={x} y={yBase - h} width={barW} height={fatH} fill="var(--ring-fat)" rx={2}/>
            {/* carb */}
            <rect x={x} y={yBase - h + fatH} width={barW} height={carbH} fill="var(--ring-carb)"/>
            {/* pro (bottom) */}
            <rect x={x} y={yBase - proH} width={barW} height={proH} fill="var(--ring-pro)" rx={2}/>
            <text x={x + barW/2} y={yBase + 12} fontSize={9} fontWeight={600} fill="var(--text-3)" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ──────────────── Adherence Heatmap ──────────────── */
function AdherenceHeatmap({ days, weeks = 13 }) {
  // days: array of { date, status: 'great'|'ok'|'off'|'none' }
  const cell = 13;
  const gap = 3;
  const width = weeks * (cell + gap);
  const height = 7 * (cell + gap);

  const colorOf = s => ({
    great: 'var(--brand-500)',
    ok: 'var(--brand-300)',
    off: 'var(--ring-fat-bg)',
    none: 'var(--surface-2)',
  }[s] || 'var(--surface-2)');

  return (
    <svg width={width} height={height}>
      {days.map((d, i) => {
        const w = Math.floor(i / 7);
        const dow = i % 7;
        return (
          <rect key={i}
            x={w * (cell + gap)} y={dow * (cell + gap)}
            width={cell} height={cell} rx={3}
            fill={colorOf(d.status)}/>
        );
      })}
    </svg>
  );
}

/* ──────────────── Streak dots ──────────────── */
function StreakWeek({ days }) {
  // days: [{ label, met: bool, partial?: bool }]
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      {days.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: d.met ? 'var(--brand-500)' : d.partial ? 'var(--brand-200)' : 'var(--surface-2)',
            border: d.met || d.partial ? 0 : '1.5px dashed var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: d.met ? '#fff' : 'var(--text-3)', fontSize: 11, fontWeight: 700,
            boxShadow: d.met ? '0 2px 6px rgba(16,185,129,0.3)' : 'none',
          }}>
            {d.met && <Ico name="check" size={14} stroke={2.5}/>}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '-0.005em' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────── Day Pill (for weekly diary) ──────────────── */
function DayPill({ label, num, active, met, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 4px', borderRadius: 14, minWidth: 44, gap: 4,
      background: active ? 'var(--text)' : 'transparent',
      color: active ? 'var(--surface)' : 'var(--text)',
      transition: 'background 160ms',
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }} className="tnum">{num}</span>
      <span style={{
        width: 5, height: 5, borderRadius: 999,
        background: met ? (active ? '#fff' : 'var(--brand-500)') : 'transparent',
      }}/>
    </button>
  );
}

/* ──────────────── Meal Entry Row ──────────────── */
function MealRow({ meal, expanded, onToggle }) {
  const mealMeta = {
    breakfast: { label: 'Desayuno', icon: '☀️', color: '#fde68a' },
    mid_morning: { label: 'Media mañana', icon: '🍎', color: '#fecaca' },
    lunch: { label: 'Almuerzo', icon: '🥗', color: '#bbf7d0' },
    snack: { label: 'Merienda', icon: '🍪', color: '#fbcfe8' },
    dinner: { label: 'Cena', icon: '🍽️', color: '#c7d2fe' },
  }[meal.type] || { label: meal.type, icon: '🍴', color: '#e5e7eb' };

  return (
    <div className="card card-elev" style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 14, width: '100%', textAlign: 'left',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: mealMeta.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {mealMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{mealMeta.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{meal.time}</span>
          </div>
          <div style={{
            fontSize: 13, color: 'var(--text-2)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginTop: 2,
          }}>
            {meal.summary}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {meal.calories}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>kcal</div>
        </div>
        <div style={{
          width: 20, height: 20, marginLeft: 2,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 160ms',
          color: 'var(--text-3)',
        }}>
          <Ico name="chev" size={16}/>
        </div>
      </button>
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--hairline)',
          padding: '8px 14px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
          background: 'var(--surface-2)',
        }}>
          {meal.foods.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <div style={{
                width: 6, height: 6, borderRadius: 999,
                background: f.confidence > 0.85 ? 'var(--success)' : f.confidence > 0.6 ? 'var(--warning)' : 'var(--danger)',
              }}/>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                {f.name}
                <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
                  {f.quantity}{f.unit}
                </span>
              </div>
              <div className="tnum" style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
                {f.cal} kcal
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px dashed var(--hairline)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>P <b style={{ color: 'var(--ring-pro)' }} className="tnum">{meal.protein}g</b></span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>C <b style={{ color: 'var(--ring-carb)' }} className="tnum">{meal.carbs}g</b></span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>G <b style={{ color: 'var(--ring-fat)' }} className="tnum">{meal.fat}g</b></span>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  Ico, MacroRing, HeroMacroRing, MacroBar, Sparkline, LineChart,
  StackedMacroChart, AdherenceHeatmap, StreakWeek, DayPill, MealRow,
});
