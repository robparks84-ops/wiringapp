'use client';

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ChannelHistory, ColorZone } from '@/lib/types';

interface Props {
  history: ChannelHistory[];
  lapHistory?: ChannelHistory[];
  label: string;
  unit: string;
  min: number;
  max: number;
  zones: ColorZone[];
  graphByDistance: boolean;
  showLapOverlay?: boolean;
}

function getZoneColor(value: number, zones: ColorZone[]): string {
  for (const zone of zones) {
    if (value <= zone.upTo) return zone.color;
  }
  return zones[zones.length - 1]?.color ?? '#4dabf7';
}

export default function LineChart({
  history,
  lapHistory,
  label,
  unit,
  min,
  max,
  zones,
  graphByDistance,
  showLapOverlay = false,
}: Props) {
  const primaryColor = zones[Math.floor(zones.length / 2)]?.color ?? '#4dabf7';

  const data = history.map((h) => ({
    x: graphByDistance ? parseFloat(h.distance.toFixed(3)) : parseFloat(((h.timestamp - (history[0]?.timestamp ?? 0)) / 1000).toFixed(1)),
    value: h.value,
  }));

  const lapData = lapHistory?.map((h) => ({
    x: graphByDistance ? parseFloat(h.distance.toFixed(3)) : parseFloat(((h.timestamp - (lapHistory[0]?.timestamp ?? 0)) / 1000).toFixed(1)),
    value: h.value,
  }));

  // Merge for dual-series display
  const merged = data.map((d, i) => ({
    ...d,
    lapValue: lapData?.[i]?.value,
  }));

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0e0e14',
        borderRadius: 12,
        padding: '8px 4px 4px 4px',
      }}
    >
      <div style={{ color: '#999', fontSize: 12, letterSpacing: 1, paddingLeft: 8, marginBottom: 4 }}>
        {label.toUpperCase()}
        <span style={{ color: '#555', fontSize: 10, marginLeft: 8 }}>
          {graphByDistance ? 'by distance (km)' : 'by time (s)'}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={merged} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="x"
              stroke="#444"
              tick={{ fill: '#666', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[min, max]}
              stroke="#444"
              tick={{ fill: '#666', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a24', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
              itemStyle={{ color: primaryColor }}
              formatter={(v: number) => [`${v.toFixed(2)} ${unit}`, label]}
            />
            {/* Zone reference lines */}
            {zones.slice(0, -1).map((z, i) => (
              <ReferenceLine key={i} y={Math.min(z.upTo, max)} stroke={z.color} strokeDasharray="3 3" strokeOpacity={0.4} />
            ))}
            <Line
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {showLapOverlay && lapHistory && (
              <Line
                type="monotone"
                dataKey="lapValue"
                stroke="#f59f00"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
