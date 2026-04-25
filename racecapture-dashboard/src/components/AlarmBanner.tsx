'use client';

import { useEffect, useRef, useState } from 'react';
import { IconBell, IconBellOff, IconX } from '@tabler/icons-react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { AlarmRule, AlarmEvent } from '@/lib/types';

interface Props {
  rules: AlarmRule[];
}

let eventId = 0;

export default function AlarmBanner({ rules }: Props) {
  const { channels } = useTelemetry();
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [muted, setMuted] = useState(false);
  const latchedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  function playTone(freq: number) {
    if (muted) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  useEffect(() => {
    for (const rule of rules) {
      const ch = channels.get(rule.channelName);
      if (!ch) continue;
      const triggered =
        rule.condition === 'above' ? ch.value > rule.threshold : ch.value < rule.threshold;
      const key = `${rule.id}-${rule.channelName}`;

      if (triggered && (!rule.latched || !latchedRef.current.has(key))) {
        latchedRef.current.add(key);
        const ev: AlarmEvent = {
          id: String(++eventId),
          ruleId: rule.id,
          channelName: rule.channelName,
          value: ch.value,
          severity: rule.severity,
          message: rule.message,
          timestamp: Date.now(),
          acknowledged: false,
        };
        setEvents((prev) => [ev, ...prev.slice(0, 19)]);
        playTone(rule.severity === 'danger' ? 880 : 440);
      }

      if (!triggered && !rule.latched) {
        latchedRef.current.delete(key);
      }
    }
  }, [channels, rules, muted]);

  function ack(id: string) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e)));
  }

  const active = events.filter((e) => !e.acknowledged);

  if (active.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 60, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 340 }}>
      {active.slice(0, 5).map((ev) => (
        <div
          key={ev.id}
          style={{
            background: ev.severity === 'danger' ? '#3b0000' : '#3b2500',
            border: `1px solid ${ev.severity === 'danger' ? '#e03131' : '#f76707'}`,
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          <IconBell size={16} color={ev.severity === 'danger' ? '#ff6b6b' : '#fd7e14'} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{ev.channelName} {ev.value.toFixed(2)}</div>
            <div style={{ color: '#aaa', fontSize: 11 }}>{ev.message}</div>
          </div>
          <button
            onClick={() => ack(ev.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 2 }}
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={() => setMuted((m) => !m)}
        style={{ alignSelf: 'flex-end', background: '#1a1a24', border: '1px solid #333', borderRadius: 6, color: '#888', cursor: 'pointer', padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {muted ? <IconBell size={12} /> : <IconBellOff size={12} />}
        {muted ? 'Unmute' : 'Mute'} alarms
      </button>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.75 } }`}</style>
    </div>
  );
}
