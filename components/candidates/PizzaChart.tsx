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

// Crimped pastry edge — scallop circles around the rim
function ScallopedCrust({ cx, cy, r, crustW }: { cx: number; cy: number; r: number; crustW: number }) {
  const numScallops = 18;
  const scallopsR = r + crustW * 0.55;
  const bumpR = crustW * 0.48;
  const scallops = Array.from({ length: numScallops }, (_, i) => {
    const angle = ((i / numScallops) * 360 - 90) * (Math.PI / 180);
    return {
      x: cx + scallopsR * Math.cos(angle),
      y: cy + scallopsR * Math.sin(angle),
    };
  });
  return (
    <>
      {/* Crust base ring */}
      <circle cx={cx} cy={cy} r={r + crustW} fill="#c8934a" />
      <circle cx={cx} cy={cy} r={r + crustW} fill="none" stroke="#b8792a" strokeWidth="1" />
      {/* Scallop bumps — crimped pie edge */}
      {scallops.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={bumpR} fill="#b8792a" opacity="0.7" />
      ))}
      {/* Inner pastry ring — the pale inside of the crust */}
      <circle cx={cx} cy={cy} r={r + 2} fill="#e8c97a" opacity="0.4" />
    </>
  );
}

export default function PizzaChart({ slices, title }: { slices: Slice[]; title?: string }) {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0 || slices.length === 0) return null;

  const cx = 80;
  const cy = 80;
  const r = 55;
  const crustW = 10;
  const size = 180;

  let currentAngle = 0;
  const sliceData = slices.map((s, i) => {
    const angle = (s.value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    const midAngle = start + angle / 2;
    const labelPos = polarToCartesian(cx, cy, r * 0.6, midAngle);
    currentAngle = end;
    return { ...s, start, end, midAngle, labelPos, index: i };
  });

  return (
    <div className="px-4 pb-4 pt-1">
      {title && (
        <div className="mb-2">
          <span className="text-[12px] font-semibold tracking-wide text-brown uppercase">🥧 {title}</span>
          <p className="text-[11px] text-mid mt-0.5">Tap a slice for details</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Pie chart SVG */}
        <div className="shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
            {/* Crimped pastry crust */}
            <ScallopedCrust cx={cx} cy={cy} r={r} crustW={crustW} />

            {/* Pie filling slices */}
            {sliceData.map((s, i) => {
              const isActive = activeSlice === i;
              const offset = isActive ? 5 : 0;
              const midRad = ((s.midAngle - 90) * Math.PI) / 180;
              const col = SLICE_COLORS[i % SLICE_COLORS.length];
              return (
                <g
                  key={i}
                  transform={isActive ? `translate(${offset * Math.cos(midRad)}, ${offset * Math.sin(midRad)})` : ''}
                  style={{ transition: 'transform 0.2s ease', cursor: 'pointer' }}
                  onClick={() => setActiveSlice(isActive ? null : i)}
                >
                  <path
                    d={slicePath(cx, cy, r, s.start, s.end)}
                    fill={col}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1.5"
                    opacity={activeSlice !== null && !isActive ? 0.45 : 1}
                  />
                  {/* Emoji label on larger slices */}
                  {s.end - s.start > 25 && (
                    <text
                      x={s.labelPos.x}
                      y={s.labelPos.y + 5}
                      textAnchor="middle"
                      fontSize="12"
                      style={{ userSelect: 'none' }}
                    >
                      {s.emoji}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center medallion — pie steam hole */}
            <circle cx={cx} cy={cy} r={17} fill="#f5ead6" />
            <circle cx={cx} cy={cy} r={15} fill="#e8c97a" opacity="0.9" />
            <text x={cx} y={cy + 1} textAnchor="middle" fontSize="11" fontFamily="system-ui" fontWeight="800" fill="#3b1f0a">
              $
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="5.5" fontFamily="system-ui" fontWeight="700" fill="#3b1f0a" opacity="0.7">
              FTD
            </text>
          </svg>
        </div>

        {/* Legend */}
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
                  <div className="text-[13px] font-medium truncate">{s.emoji} {s.label}</div>
                  <div className="h-1 bg-lb rounded-full mt-0.5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                  </div>
                </div>
                <div className="text-right shrink-0 ml-1">
                  <div className="text-[13px] font-bold">{pct}%</div>
                  <div className="text-[11px] text-mid">${(s.value / 1_000_000).toFixed(1)}M</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active slice callout */}
      {activeSlice !== null && (
        <div className="mt-2 bg-brown text-cream rounded-lg px-3 py-2 text-[13px]">
          <span className="font-semibold text-gold">{sliceData[activeSlice].emoji} {sliceData[activeSlice].label}: </span>
          <span className="text-cream/80">
            ${sliceData[activeSlice].value.toLocaleString()} · {Math.round((sliceData[activeSlice].value / total) * 100)}% of total
          </span>
        </div>
      )}
    </div>
  );
}
