'use client';

import { useState } from 'react';

interface Slice {
  label: string;
  emoji: string;
  value: number;
  color: string;
}

// Pizza-themed colors for each slice
const PIZZA_COLORS = [
  '#c0392b', // tomato sauce red
  '#e8c97a', // mozzarella gold
  '#2d6a4f', // basil green
  '#c8934a', // crust amber
  '#5b21b6', // purple olive
  '#1a6bb5', // blue cheese
  '#854d0e', // mushroom brown
  '#166534', // spinach dark green
  '#9d174d', // prosciutto pink
  '#1e3a5f', // anchovy navy
];

// Pizza topping patterns as SVG elements
function ToppingPattern({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill={color} />
      <circle cx="4" cy="4" r="1.5" fill="rgba(255,255,255,0.2)" />
    </pattern>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

// Crust arc path (outer ring)
function crustPath(cx: number, cy: number, r: number, crustW: number, startAngle: number, endAngle: number) {
  const outerR = r + crustW;
  const s1 = polarToCartesian(cx, cy, r, startAngle);
  const s2 = polarToCartesian(cx, cy, outerR, startAngle);
  const e1 = polarToCartesian(cx, cy, r, endAngle);
  const e2 = polarToCartesian(cx, cy, outerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e2.x} ${e2.y}`,
    `L ${e1.x} ${e1.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${s1.x} ${s1.y}`,
    'Z',
  ].join(' ');
}

export default function PizzaChart({ slices, title }: { slices: Slice[]; title?: string }) {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0 || slices.length === 0) return null;

  const cx = 120;
  const cy = 120;
  const r = 85;
  const crustW = 12;
  const size = 260;

  let currentAngle = 0;
  const sliceData = slices.map((s, i) => {
    const angle = (s.value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    const midAngle = start + angle / 2;
    const labelR = r * 0.62;
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    currentAngle = end;
    return { ...s, start, end, midAngle, labelPos, index: i };
  });

  return (
    <div className="border-t border-lb px-4 py-4">
      {title && (
        <div className="mb-3">
          <span className="text-[11px] font-semibold tracking-wide text-brown">🍕 {title}</span>
          <p className="text-[9px] text-mid mt-0.5">Click a slice to see details</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* SVG Pizza */}
        <div className="shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
            <defs>
              {sliceData.map((s, i) => (
                <ToppingPattern key={i} id={`topping-${i}`} color={PIZZA_COLORS[i % PIZZA_COLORS.length]} />
              ))}
              {/* Sauce base gradient */}
              <radialGradient id="sauce" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c0392b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#922b21" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Pizza sauce base */}
            <circle cx={cx} cy={cy} r={r + crustW} fill="#c8934a" />
            <circle cx={cx} cy={cy} r={r + crustW - 2} fill="#922b21" />

            {/* Slices */}
            {sliceData.map((s, i) => {
              const isActive = activeSlice === i;
              const scaleOffset = isActive ? 6 : 0;
              const midRad = ((s.midAngle - 90) * Math.PI) / 180;
              const tx = scaleOffset * Math.cos(midRad);
              const ty = scaleOffset * Math.sin(midRad);
              return (
                <g key={i}
                  transform={isActive ? `translate(${tx}, ${ty})` : ''}
                  style={{ transition: 'transform 0.2s ease', cursor: 'pointer' }}
                  onClick={() => setActiveSlice(isActive ? null : i)}
                >
                  {/* Slice fill */}
                  <path
                    d={slicePath(cx, cy, r, s.start, s.end)}
                    fill={`url(#topping-${i})`}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  />
                  {/* Crust */}
                  <path
                    d={crustPath(cx, cy, r, crustW, s.start, s.end)}
                    fill="#c8934a"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />
                  {/* Crust shadow */}
                  <path
                    d={crustPath(cx, cy, r, crustW, s.start, s.end)}
                    fill="none"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="1"
                  />
                  {/* Emoji label on slice */}
                  {s.end - s.start > 18 && (
                    <text
                      x={s.labelPos.x}
                      y={s.labelPos.y + 5}
                      textAnchor="middle"
                      fontSize="14"
                      style={{ userSelect: 'none' }}
                    >
                      {s.emoji}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center hole — cheese circle */}
            <circle cx={cx} cy={cy} r={22} fill="#f5ead6" />
            <circle cx={cx} cy={cy} r={20} fill="#e8c97a" opacity="0.7" />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fontFamily="system-ui" fontWeight="700" fill="#3b1f0a">
              FOLLOW
            </text>
            <text x={cx} y={cy + 7} textAnchor="middle" fontSize="9" fontFamily="system-ui" fontWeight="700" fill="#3b1f0a">
              DOUGH
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full">
          {sliceData.map((s, i) => {
            const pct = Math.round((s.value / total) * 100);
            const isActive = activeSlice === i;
            return (
              <button
                key={i}
                onClick={() => setActiveSlice(isActive ? null : i)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 text-left transition-all ${isActive ? 'bg-lb shadow-sm' : 'hover:bg-lb/50'}`}
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ background: PIZZA_COLORS[i % PIZZA_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate">{s.emoji} {s.label}</div>
                  <div className="h-1.5 bg-lb rounded-full mt-0.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: PIZZA_COLORS[i % PIZZA_COLORS.length] }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold font-mono">{pct}%</div>
                  <div className="text-[9px] text-mid font-mono">
                    ${(s.value / 1000).toFixed(0)}K
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active slice detail */}
      {activeSlice !== null && (
        <div className="mt-3 bg-brown text-cream rounded-xl px-4 py-3 text-[11px]">
          <div className="font-semibold text-gold mb-0.5">
            {sliceData[activeSlice].emoji} {sliceData[activeSlice].label}
          </div>
          <div className="text-cream/70">
            ${sliceData[activeSlice].value.toLocaleString()} raised from this sector
            · {Math.round((sliceData[activeSlice].value / total) * 100)}% of total funding
          </div>
        </div>
      )}
    </div>
  );
}
