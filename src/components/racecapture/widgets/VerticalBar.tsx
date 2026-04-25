'use client';

import type { ColorZone, ChannelStats } from '@/lib/racecaptureTypes';

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

export default function VerticalBar({ value, min, max, label, unit, zones, stats }: Props) {
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
        alignItems: 'center',
        height: '100%',
        padding: '10px 8px',
        background: '#0e0e14',
        borderRadius: 12,
        gap: 6,
      }}
    >
      <div style={{ color: '#aaa', fontSize: 11, letterSpacing: 1 }}>{label.toUpperCase()}</div>
      <div style={{ color, fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
        {value.toFixed(1)}
        <span style={{ fontSize: 10, color: '#888', marginLeft: 2 }}>{unit}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        <span style={{ fontSize: 10, color: '#555' }}>{max}</span>
        <div
          style={{
            position: 'relative',
            flex: 1,
            width: 32,
            background: '#1a1a24',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${pct}%`,
              background: `linear-gradient(0deg, ${color}88, ${color})`,
              borderRadius: 6,
              transition: 'height 0.1s ease, background 0.3s ease',
            }}
          />
          {minPct !== null && (
            <div
              style={{
                position: 'absolute',
                bottom: `${minPct}%`,
                left: 0,
                right: 0,
                height: 2,
                background: '#4dabf7',
                opacity: 0.7,
              }}
            />
          )}
          {maxPct !== null && (
            <div
              style={{
                position: 'absolute',
                bottom: `${maxPct}%`,
                left: 0,
                right: 0,
                height: 2,
                background: '#ff6b6b',
                opacity: 0.7,
              }}
            />
          )}
        </div>
        <span style={{ fontSize: 10, color: '#555' }}>{min}</span>
      </div>

      {stats && avg !== null && (
        <div style={{ fontSize: 10, color: '#69db7c' }}>AVG {avg.toFixed(1)}</div>
      )}
    </div>
  );
}
