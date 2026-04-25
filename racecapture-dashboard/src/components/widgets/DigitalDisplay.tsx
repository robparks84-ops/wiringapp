'use client';

import type { ColorZone, ChannelStats } from '@/lib/types';

interface Props {
  value: number;
  label: string;
  unit: string;
  zones: ColorZone[];
  stats?: ChannelStats;
}

function getZoneColor(value: number, zones: ColorZone[]): string {
  for (const zone of zones) {
    if (value <= zone.upTo) return zone.color;
  }
  return zones[zones.length - 1]?.color ?? '#e8e8e8';
}

export default function DigitalDisplay({ value, label, unit, zones, stats }: Props) {
  const color = getZoneColor(value, zones);
  const avg = stats ? stats.sum / stats.count : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '8px',
        background: '#0e0e14',
        borderRadius: 12,
      }}
    >
      <div style={{ color: '#999', fontSize: 13, marginBottom: 4, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </div>
      <div
        style={{
          color,
          fontSize: 'clamp(28px, 5vw, 56px)',
          fontFamily: 'monospace',
          fontWeight: 700,
          lineHeight: 1,
          textShadow: `0 0 12px ${color}55`,
        }}
      >
        {value >= 1000 ? value.toFixed(0) : value.toFixed(1)}
        <span style={{ fontSize: '0.45em', color: '#aaa', marginLeft: 4 }}>{unit}</span>
      </div>
      {stats && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 8,
            fontSize: 11,
            color: '#777',
          }}
        >
          <span>MIN <span style={{ color: '#4dabf7' }}>{stats.min.toFixed(1)}</span></span>
          <span>AVG <span style={{ color: '#69db7c' }}>{avg!.toFixed(1)}</span></span>
          <span>MAX <span style={{ color: '#ff6b6b' }}>{stats.max.toFixed(1)}</span></span>
        </div>
      )}
    </div>
  );
}
