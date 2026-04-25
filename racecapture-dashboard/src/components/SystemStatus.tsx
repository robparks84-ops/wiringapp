'use client';

import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { Channel } from '@/lib/types';

interface ChannelHealth {
  name: string;
  value: number;
  unit: string;
  lastUpdate: number;
  updateHz: number;
  status: 'ok' | 'slow' | 'frozen' | 'missing';
}

const FROZEN_MS = 3000;
const SLOW_MS = 1500;

export default function SystemStatus() {
  const { channels, connected, lastError, streams, activeStream, setActiveStream } = useTelemetry();
  const updateTimestamps = useRef<Map<string, number[]>>(new Map());
  const [health, setHealth] = useState<ChannelHealth[]>([]);

  useEffect(() => {
    const now = Date.now();
    channels.forEach((ch, name) => {
      const times = updateTimestamps.current.get(name) ?? [];
      times.push(now);
      if (times.length > 10) times.shift();
      updateTimestamps.current.set(name, times);
    });

    const entries: ChannelHealth[] = [];
    channels.forEach((ch, name) => {
      const times = updateTimestamps.current.get(name) ?? [now];
      const last = times[times.length - 1];
      const age = now - last;
      let hz = 0;
      if (times.length >= 2) {
        const span = times[times.length - 1] - times[0];
        hz = span > 0 ? ((times.length - 1) / span) * 1000 : 0;
      }
      let status: ChannelHealth['status'] = 'ok';
      if (age > FROZEN_MS) status = 'frozen';
      else if (age > SLOW_MS) status = 'slow';
      entries.push({ name, value: ch.value, unit: ch.unit, lastUpdate: last, updateHz: hz, status });
    });

    entries.sort((a, b) => {
      const order = { frozen: 0, slow: 1, ok: 2, missing: 3 };
      return order[a.status] - order[b.status];
    });

    setHealth(entries);
  }, [channels]);

  const gps = channels.get('GPSQual') ?? channels.get('GPSQuality') ?? channels.get('GPS_Quality') ?? channels.get('gpsquality');
  const gpsSats = channels.get('GPSSats');
  const logging = channels.get('Logging') ?? channels.get('logging');
  const frozen = health.filter((h) => h.status === 'frozen').length;
  const slow = health.filter((h) => h.status === 'slow').length;

  const statusColor = (s: ChannelHealth['status']) =>
    ({ ok: '#2f9e44', slow: '#f59f00', frozen: '#e03131', missing: '#555' })[s];

  return (
    <div style={{ background: '#0e0e14', border: '1px solid #1e1e2e', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#2f9e44' : '#e03131', boxShadow: connected ? '0 0 6px #2f9e44' : 'none' }} />
          <span style={{ color: '#aaa', fontSize: 12 }}>podium.live: <span style={{ color: connected ? '#2f9e44' : '#e03131' }}>{connected ? 'LIVE' : 'OFFLINE'}</span></span>
        </div>
        {streams.length > 1 && (
          <select
            value={activeStream?.device_id ?? ''}
            onChange={(e) => {
              const s = streams.find((s) => String(s.device_id) === e.target.value) ?? null;
              setActiveStream(s);
            }}
            style={{
              background: '#1a1a24', color: '#ccc', border: '1px solid #333',
              borderRadius: 6, fontSize: 12, padding: '2px 6px', cursor: 'pointer',
            }}
          >
            {streams.map((s) => (
              <option key={s.device_id} value={s.device_id}>{s.device_name}</option>
            ))}
          </select>
        )}
        {gpsSats && (
          <div style={{ color: '#aaa', fontSize: 12 }}>
            GPS: <span style={{ color: gpsSats.value > 10 ? '#2f9e44' : gpsSats.value > 5 ? '#f59f00' : '#e03131' }}>{gpsSats.value.toFixed(0)} sats</span>
          </div>
        )}
        {gps && !gpsSats && (
          <div style={{ color: '#aaa', fontSize: 12 }}>
            GPS Quality: <span style={{ color: gps.value >= 2 ? '#2f9e44' : gps.value >= 1 ? '#f59f00' : '#e03131' }}>{gps.value.toFixed(0)}</span>
          </div>
        )}
        {logging && (
          <div style={{ color: '#aaa', fontSize: 12 }}>
            Logging: <span style={{ color: logging.value > 0 ? '#2f9e44' : '#e03131' }}>{logging.value > 0 ? 'ACTIVE' : 'OFF'}</span>
          </div>
        )}
        <div style={{ color: '#aaa', fontSize: 12 }}>
          Channels: <span style={{ color: '#fff' }}>{channels.size}</span>
          {frozen > 0 && <span style={{ color: '#e03131', marginLeft: 6 }}>· {frozen} frozen</span>}
          {slow > 0 && <span style={{ color: '#f59f00', marginLeft: 6 }}>· {slow} slow</span>}
        </div>
        {lastError && (
          <div style={{ color: '#e03131', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ⚠ {lastError}
          </div>
        )}
      </div>

      {/* Channel health grid */}
      {health.filter((h) => h.status !== 'ok').length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {health.filter((h) => h.status !== 'ok').map((ch) => (
            <div key={ch.name} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#1a1a24', border: `1px solid ${statusColor(ch.status)}44`,
              borderRadius: 6, padding: '3px 8px', fontSize: 11,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(ch.status) }} />
              <span style={{ color: '#ccc' }}>{ch.name}</span>
              <span style={{ color: statusColor(ch.status) }}>{ch.status === 'frozen' ? 'FROZEN' : 'SLOW'}</span>
              <span style={{ color: '#555' }}>{ch.updateHz.toFixed(1)}Hz</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
