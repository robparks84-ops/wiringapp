'use client';

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChannelHistory } from '@/lib/types';

interface Props {
  throttleHistory: ChannelHistory[];
  brakeHistory: ChannelHistory[];
  steeringHistory?: ChannelHistory[];
  graphByDistance: boolean;
}

export default function InputTrace({ throttleHistory, brakeHistory, steeringHistory, graphByDistance }: Props) {
  const base = throttleHistory.length > 0 ? throttleHistory : brakeHistory;
  const startX = base[0]?.timestamp ?? 0;
  const startDist = base[0]?.distance ?? 0;

  function getX(h: ChannelHistory): number {
    return graphByDistance
      ? parseFloat((h.distance - startDist).toFixed(3))
      : parseFloat(((h.timestamp - startX) / 1000).toFixed(1));
  }

  // Merge all three traces onto a shared x-axis
  const merged = base.map((h, i) => ({
    x: getX(h),
    throttle: throttleHistory[i]?.value ?? 0,
    brake: brakeHistory[i]?.value ?? 0,
    steering: steeringHistory?.[i]?.value ?? null,
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0e0e14', borderRadius: 12, padding: '8px 4px 4px 4px' }}>
      <div style={{ color: '#999', fontSize: 11, letterSpacing: 1, paddingLeft: 8, marginBottom: 2 }}>
        DRIVER INPUTS
        <span style={{ color: '#555', fontSize: 10, marginLeft: 8 }}>
          {graphByDistance ? 'by distance (km)' : 'by time (s)'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, paddingLeft: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#69db7c' }}>■ Throttle</span>
        <span style={{ fontSize: 10, color: '#ff6b6b' }}>■ Brake</span>
        {steeringHistory && <span style={{ fontSize: 10, color: '#74c0fc' }}>— Steering</span>}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={merged} margin={{ top: 2, right: 8, bottom: 2, left: 0 }}>
            <XAxis dataKey="x" stroke="#333" tick={{ fill: '#555', fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="#333" tick={{ fill: '#555', fontSize: 9 }} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{ background: '#1a1a24', border: '1px solid #333', borderRadius: 6, fontSize: 11 }}
              formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
            />
            <Area type="monotone" dataKey="throttle" stroke="#2f9e44" fill="#2f9e4422" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="brake" stroke="#e03131" fill="#e0313122" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            {steeringHistory && (
              <Area type="monotone" dataKey="steering" stroke="#4dabf7" fill="none" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
