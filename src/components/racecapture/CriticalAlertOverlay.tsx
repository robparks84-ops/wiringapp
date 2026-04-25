'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { WidgetConfig } from '@/lib/racecaptureTypes';

interface ActiveAlert {
  id: string;
  channelName: string;
  value: number;
  threshold: number;
  condition: 'above' | 'below';
  color: string;
  label: string;
  unit: string;
  isDanger: boolean;
}

interface Props {
  widgets: WidgetConfig[];
}

function getZoneColor(value: number, zones: WidgetConfig['zones']): { color: string; zoneIndex: number } {
  for (let i = 0; i < zones.length; i++) {
    if (value <= zones[i].upTo) return { color: zones[i].color, zoneIndex: i };
  }
  return { color: zones[zones.length - 1]?.color ?? '#e03131', zoneIndex: zones.length - 1 };
}

function isCritical(color: string): boolean {
  const c = color.toLowerCase();
  return c.includes('e031') || c.includes('c92a') || c.includes('f03e') || c === '#ff0000' || c === '#cc0000';
}

function isWarning(color: string): boolean {
  const c = color.toLowerCase();
  return c.includes('f767') || c.includes('e859') || c.includes('fd7e') || c.includes('f76b');
}

export default function CriticalAlertOverlay({ widgets }: Props) {
  const { channels } = useTelemetry();
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousZonesRef = useRef<Map<string, number>>(new Map());

  const playAlarmTone = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      [880, 1100, 880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sawtooth';
        const t = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    } catch { /* audio not available */ }
  }, []);

  useEffect(() => {
    const newAlerts: ActiveAlert[] = [];

    for (const widget of widgets) {
      if (widget.type === 'gforce') continue;
      const ch = channels.get(widget.channelName);
      if (!ch) continue;

      const { color, zoneIndex } = getZoneColor(ch.value, widget.zones);
      const prevZone = previousZonesRef.current.get(widget.channelName) ?? -1;

      if ((isCritical(color) || isWarning(color)) && zoneIndex !== prevZone) {
        const prevZoneData = zoneIndex > 0 ? widget.zones[zoneIndex - 1] : null;
        const threshold = prevZoneData ? prevZoneData.upTo : widget.min;
        newAlerts.push({
          id: `${widget.id}-${zoneIndex}`,
          channelName: widget.channelName,
          value: ch.value,
          threshold,
          condition: ch.value > threshold ? 'above' : 'below',
          color,
          label: widget.label,
          unit: widget.unit,
          isDanger: isCritical(color),
        });
      }

      previousZonesRef.current.set(widget.channelName, zoneIndex);
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const fresh = newAlerts.filter((a) => !ids.has(a.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
      setDismissed(false);
      playAlarmTone();
    }

    setAlerts((prev) =>
      prev.filter((alert) => {
        const ch = channels.get(alert.channelName);
        if (!ch) return true;
        const widget = widgets.find((w) => w.channelName === alert.channelName);
        if (!widget) return false;
        const { color } = getZoneColor(ch.value, widget.zones);
        return isCritical(color) || isWarning(color);
      }),
    );
  }, [channels, widgets, playAlarmTone]);

  useEffect(() => {
    if (alerts.length > 0 && !dismissed) {
      alarmIntervalRef.current = setInterval(playAlarmTone, 3000);
    } else {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    }
    return () => { if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current); };
  }, [alerts.length, dismissed, playAlarmTone]);

  if (alerts.length === 0 || dismissed) return null;

  const anyDanger = alerts.some((a) => a.isDanger);

  return (
    <div
      onClick={() => setDismissed(true)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: '24px 16px',
        animation: 'flashBg 0.5s ease-in-out infinite alternate',
        background: anyDanger ? 'rgba(180,0,0,0.93)' : 'rgba(170,80,0,0.93)',
        overflowY: 'auto',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        border: `12px solid ${anyDanger ? '#ff0000' : '#ff8c00'}`,
        animation: 'flashBorder 0.4s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 'clamp(48px, 8vw, 90px)', animation: 'pulse 0.5s ease-in-out infinite alternate', marginBottom: 8 }}>
        ⚠️
      </div>
      <div style={{
        fontSize: 'clamp(18px, 4vw, 40px)',
        color: 'white',
        fontWeight: 900,
        letterSpacing: 6,
        textTransform: 'uppercase',
        textShadow: '0 0 30px rgba(255,255,255,0.7)',
        marginBottom: 24,
      }}>
        {alerts.length === 1 ? 'ALERT' : `${alerts.length} ALERTS`}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 680,
        marginBottom: 28,
      }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              alignItems: 'center',
              gap: 16,
              background: alert.isDanger ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.30)',
              border: `3px solid ${alert.isDanger ? 'rgba(255,80,80,0.7)' : 'rgba(255,160,40,0.7)'}`,
              borderRadius: 12,
              padding: '14px 20px',
            }}
          >
            <div>
              <div style={{ color: 'white', fontSize: 'clamp(15px, 2.5vw, 24px)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
                {alert.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(11px, 1.5vw, 15px)', marginTop: 2 }}>
                {alert.condition === 'above' ? '▲ exceeds' : '▼ below'} {alert.threshold.toFixed(1)} {alert.unit}
              </div>
            </div>

            <div style={{
              background: alert.isDanger ? '#e03131' : '#f76707',
              color: 'white',
              fontSize: 'clamp(9px, 1.2vw, 12px)',
              fontWeight: 700,
              letterSpacing: 1,
              borderRadius: 4,
              padding: '3px 8px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {alert.isDanger ? 'DANGER' : 'WARNING'}
            </div>

            <div style={{
              color: alert.color,
              fontSize: 'clamp(22px, 4vw, 44px)',
              fontFamily: 'monospace',
              fontWeight: 900,
              textShadow: `0 0 20px ${alert.color}99`,
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}>
              {alert.value.toFixed(1)}
              <span style={{ fontSize: '0.45em', color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>{alert.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: 'clamp(11px, 1.5vw, 16px)',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 2,
        animation: 'fadeInOut 1.5s ease-in-out infinite',
      }}>
        TAP ANYWHERE TO DISMISS
      </div>

      <style>{`
        @keyframes flashBg {
          from { background-color: ${anyDanger ? 'rgba(180,0,0,0.93)' : 'rgba(170,80,0,0.93)'}; }
          to   { background-color: ${anyDanger ? 'rgba(230,0,0,0.97)' : 'rgba(220,110,0,0.97)'}; }
        }
        @keyframes flashBorder { from { opacity:1; } to { opacity:0.25; } }
        @keyframes pulse { from { transform:scale(1); } to { transform:scale(1.08); } }
        @keyframes fadeInOut { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
      `}</style>
    </div>
  );
}
