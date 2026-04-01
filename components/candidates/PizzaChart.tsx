'use client';

import { useState } from 'react';

interface Slice {
  label: string;
  emoji: string;
  value: number;
  color: string;
}

const SLICE_COLORS = ['#c0392b', '#2d6a4f', '#5b21b6', '#c8934a', '#1a6bb5', '#854d0e'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
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

  const cx = 80;
  const cy = 80;
  const r = 55;
  const crustW = 9;
  const size = 178;

  let currentAngle = 0;
  const sliceData = slices.map((s, i) => {
    const angle = (s.value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    const midAngle = start + angle / 2;
    const labelR = r * 0.6;
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    currentAngle = end;
    return { ...s, start, end, midAngle, labelPos, index: i };
  });

  return (
    <div className="px-4 pb-4 pt-1">
      {title && (
        <div className="mb-2">
          <span className="text-[9px] font-semibold tracking-wide text-brown uppercase">🍕 {title}</span>
          <p className="text-[8px] text-mid mt-0.5">Tap a slice for details</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Compact pizza SVG */}
        <div className="shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
            {/* Sauce base */}
            <circle cx={cx} cy={cy} r={r + crustW} fill="#c8934a" />
            <circle cx={cx} cy={cy} r={r + crustW - 2} fill="#922b21" />

            {sliceData.map((s, i) => {
              const isActive = activeSlice === i;
              const scaleOffset = isActive ? 5 : 0;
              const midRad = ((s.midAngle - 90) * Math.PI) / 180;
              const tx = scaleOffset * Math.cos(midRad);
              const ty = scaleOffset * Math.sin(midRad);
              const col = SLICE_COLORS[i % SLICE_COLORS.length];
              return (
                <g
                  key={i}
                  transform={isActive ? `translate(${tx}, ${ty})` : ''}
                  style={{ transition: 'transform 0.2s ease', cursor: 'pointer' }}
                  onClick={() => setActiveSlice(isActive ? null : i)}
                >
                  <path
                    d={slicePath(cx, cy, r, s.start, s.end)}
                    fill={col}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="1.5"
                    opacity={activeSlice !== null && !isActive ? 0.5 : 1}
                  />
                  <path
                    d={crustPath(cx, cy, r, crustW, s.start, s.end)}
                    fill="#c8934a"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />
                  {/* Emoji on larger slices */}
                  {s.end - s.start > 25 && (
                    <text
                      x={s.labelPos.x}
                      y={s.labelPos.y + 5}
                      textAnchor="middle"
                      fontSize="13"
                      style={{ userSelect: 'none' }}
                    >
                      {s.emoji}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center cheese hole */}
            <circle cx={cx} cy={cy} r={16} fill="#f5ead6" />
            <circle cx={cx} cy={cy} r={14} fill="#e8c97a" opacity="0.8" />
            <text x={cx} y={cy - 3} textAnchor="middle" fontSize="7" fontFamily="system-ui" fontWeight="700" fill="#3b1f0a">
              FOLLOW
            </text>
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize="7" fontFamily="system-ui" fontWeight="700" fill="#3b1f0a">
              DOUGH
            </text>
          </svg>
        </div>

        {/* Compact legend */}
        <div className="flex-1 min-w-0">
          {sliceData.map((s, i) => {
            const pct = Math.round((s.value / total) * 100);
            const isActive = activeSlice === i;
            const col = SLICE_COLORS[i % SLICE_COLORS.length];
            return (
              <button
                key={i}
                onClick={() => setActiveSlice(isActive ? null : i)}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded mb-0.5 text-left transition-all ${isActive ? 'bg-lb shadow-sm' : 'hover:bg-lb/50'}`}
              >
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: col }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate">{s.emoji} {s.label}</div>
                  <div className="h-1 bg-lb rounded-full mt-0.5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                  </div>
                </div>
                <div className="text-right shrink-0 ml-1">
                  <div className="text-[10px] font-bold">{pct}%</div>
                  <div className="text-[8px] text-mid">${(s.value / 1_000_000).toFixed(1)}M</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active slice callout */}
      {activeSlice !== null && (
        <div className="mt-2 bg-brown text-cream rounded-lg px-3 py-2 text-[10px]">
          <span className="font-semibold text-gold">{sliceData[activeSlice].emoji} {sliceData[activeSlice].label}: </span>
          <span className="text-cream/80">
            ${sliceData[activeSlice].value.toLocaleString()} · {Math.round((sliceData[activeSlice].value / total) * 100)}% of total
          </span>
        </div>
      )}
    </div>
  );
}
