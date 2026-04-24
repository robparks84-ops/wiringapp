'use client';

import type { ColorZone } from '@/lib/types';

interface Props {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  zones: ColorZone[];
  size?: number;
}

const START_ANGLE = 225; // degrees from 3 o'clock (SVG convention)
const SWEEP = 270;       // total arc sweep in degrees

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg - 90); // -90 to start from top
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function valueToAngle(value: number, min: number, max: number): number {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return START_ANGLE - SWEEP / 2 + pct * SWEEP - 90;
  // Simplified: map pct → arc
}

function getZoneColor(value: number, zones: ColorZone[]): string {
  for (const zone of zones) {
    if (value <= zone.upTo) return zone.color;
  }
  return zones[zones.length - 1]?.color ?? '#e03131';
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function DialGauge({ value, min, max, label, unit, zones, size = 200 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.36;
  const tickOuterR = size * 0.43;
  const tickInnerMajor = size * 0.37;
  const tickInnerMinor = size * 0.40;
  const labelR = size * 0.30;

  // Arc angles: start at bottom-left, sweep clockwise
  const arcStart = 135; // degrees in SVG (0 = right, goes clockwise)
  const arcEnd = 405;   // 135 + 270

  const needleColor = getZoneColor(value, zones);
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const needleDeg = arcStart + pct * SWEEP;

  // Build zone arcs
  const zoneArcs: { start: number; end: number; color: string }[] = [];
  let prevBoundary = min;
  let prevAngle = arcStart;
  for (const zone of zones) {
    const boundary = Math.min(zone.upTo, max);
    const endAngle = arcStart + ((boundary - min) / (max - min)) * SWEEP;
    if (boundary > prevBoundary) {
      zoneArcs.push({ start: prevAngle, end: endAngle, color: zone.color });
    }
    prevBoundary = boundary;
    prevAngle = endAngle;
    if (boundary >= max) break;
  }

  // Ticks: major every 10%, minor every 2%
  const ticks: { angle: number; major: boolean; labelVal: number | null }[] = [];
  const MAJOR_COUNT = 10;
  const MINOR_PER_MAJOR = 4;
  const totalTicks = MAJOR_COUNT * (MINOR_PER_MAJOR + 1);
  for (let i = 0; i <= totalTicks; i++) {
    const frac = i / totalTicks;
    const angle = arcStart + frac * SWEEP;
    const isMajor = i % (MINOR_PER_MAJOR + 1) === 0;
    let labelVal: number | null = null;
    if (isMajor) {
      const raw = min + frac * (max - min);
      // Format: if max >= 1000, show in k
      labelVal = raw;
    }
    ticks.push({ angle, major: isMajor, labelVal });
  }

  // Needle points
  const needleTip = polarToXY(cx, cy, outerR - size * 0.04, needleDeg);
  const needleBase1 = polarToXY(cx, cy, size * 0.05, needleDeg + 90);
  const needleBase2 = polarToXY(cx, cy, size * 0.05, needleDeg - 90);

  // Format value display
  const displayValue = max >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(value >= 100 ? 0 : 1);

  function formatLabel(val: number): string {
    if (max >= 1000) return `${Math.round(val / 1000)}k`;
    if (max >= 100) return String(Math.round(val));
    return val % 1 === 0 ? String(val) : val.toFixed(1);
  }

  return (
    <svg
      width={size}
      height={size + size * 0.18}
      viewBox={`0 0 ${size} ${size + size * 0.18}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Black circle background */}
      <circle cx={cx} cy={cy} r={outerR + size * 0.02} fill="#111" />
      <circle cx={cx} cy={cy} r={outerR} fill="#0a0a0a" />

      {/* Zone arcs on the tick ring */}
      {zoneArcs.map((arc, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, (tickOuterR + tickInnerMajor) / 2, arc.start, arc.end)}
          fill="none"
          stroke={arc.color}
          strokeWidth={(tickOuterR - tickInnerMajor) * 0.6}
          strokeLinecap="butt"
          opacity={arc.color === '#2f9e44' ? 0 : 0.85} // hide green zone (it's the normal range - ticks handle it)
        />
      ))}

      {/* Ticks */}
      {ticks.map((tick, i) => {
        const outer = polarToXY(cx, cy, tickOuterR, tick.angle);
        const inner = polarToXY(
          cx,
          cy,
          tick.major ? tickInnerMajor : tickInnerMinor,
          tick.angle,
        );
        return (
          <line
            key={i}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="#22d3ee"
            strokeWidth={tick.major ? 2.5 : 1}
            strokeLinecap="round"
          />
        );
      })}

      {/* Tick labels */}
      {ticks
        .filter((t) => t.major && t.labelVal !== null)
        .map((tick, i) => {
          const pos = polarToXY(cx, cy, labelR, tick.angle);
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={size * 0.07}
              fontFamily="sans-serif"
            >
              {formatLabel(tick.labelVal!)}
            </text>
          );
        })}

      {/* Needle */}
      <polygon
        points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        fill={needleColor}
        opacity={0.95}
      />
      {/* Pivot cap */}
      <circle cx={cx} cy={cy} r={size * 0.045} fill="#888" />
      <circle cx={cx} cy={cy} r={size * 0.025} fill="#555" />

      {/* Channel label */}
      <text
        x={cx}
        y={cy + outerR * 0.55}
        textAnchor="middle"
        fill="white"
        fontSize={size * 0.09}
        fontFamily="sans-serif"
        fontWeight="400"
      >
        {label}
      </text>

      {/* Value */}
      <text
        x={cx}
        y={size + size * 0.10}
        textAnchor="middle"
        fill={needleColor}
        fontSize={size * 0.10}
        fontFamily="monospace"
        fontWeight="600"
      >
        {displayValue}
        {unit ? ` ${unit}` : ''}
      </text>
    </svg>
  );
}
