'use client';

import type { ColorZone, ChannelStats } from '@/lib/types';

interface Props {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  zones: ColorZone[];
  stats?: ChannelStats;
}

function getZoneColor(value: number, zones: ColorZone[]): string {
  for (const zone of zones) {
    if (value <= zone.upTo) return zone.color;
  }
  return zones[zones.length - 1]?.color ?? '#4dabf7';
}

export default function HorizontalBar({ value, min, max, label, unit, zones, stats }: Props) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min))) * 100;
  const color = getZoneColor(value, zones);
  const avg = stats ? stats.sum / stats.count : null;
  const minPct = stats ? Math.max(0, Math.min(100, ((stats.min - min) / (max - min)) * 100)) : null;
  const maxPct = stats ? Math.max(0, Math.min(100, ((stats.max - min) / (max - min)) * 100)) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        padding: '10px 14px',
        background: '#0e0e14',
        borderRadius: 12,
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: 12 }}>
        <span style={{ letterSpacing: 1 }}>{label.toUpperCase()}</span>
        <span style={{ color, fontFamily: 'monospace', fontWeight: 600 }}>
          {value.toFixed(1)} {unit}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 24,
          background: '#1a1a24',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 6,
            transition: 'width 0.1s ease, background 0.3s ease',
          }}
        />
        {/* Min marker */}
        {minPct !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${minPct}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: '#4dabf7',
              opacity: 0.7,
            }}
          />
        )}
        {/* Max marker */}
        {maxPct !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${maxPct}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: '#ff6b6b',
              opacity: 0.7,
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555' }}>
        <span>{min}</span>
        {stats && avg !== null && (
          <span style={{ color: '#69db7c' }}>AVG {avg.toFixed(1)}</span>
        )}
        <span>{max}</span>
      </div>
    </div>
  );
}
