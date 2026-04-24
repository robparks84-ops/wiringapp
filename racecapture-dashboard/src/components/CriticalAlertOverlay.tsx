'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { WidgetConfig } from '@/lib/types';

interface ActiveAlert {
  id: string;
  channelName: string;
  value: number;
  threshold: number;
  condition: 'above' | 'below';
  color: string;
  label: string;
  unit: string;
}

interface Props {
  widgets: WidgetConfig[];
}

// Returns the zone color for a value — last zone whose upTo >= value
function getZoneColor(value: number, zones: WidgetConfig['zones']): { color: string; zoneIndex: number } {
  for (let i = 0; i < zones.length; i++) {
    if (value <= zones[i].upTo) return { color: zones[i].color, zoneIndex: i };
  }
  return { color: zones[zones.length - 1]?.color ?? '#e03131', zoneIndex: zones.length - 1 };
}

const DANGER_COLORS = new Set(['#e03131', '#c92a2a', '#f03e3e', '#ff0000', '#cc0000']);
const WARNING_COLORS = new Set(['#f76707', '#e8590c', '#fd7e14', '#ff6b35']);

function isCritical(color: string): boolean {
  const normalized = color.toLowerCase();
  return DANGER_COLORS.has(normalized) || normalized.includes('e031') || normalized.includes('c92a') || normalized.includes('f03e');
}

function isWarning(color: string): boolean {
  const normalized = color.toLowerCase();
  return WARNING_COLORS.has(normalized) || normalized.includes('f767') || normalized.includes('e859') || normalized.includes('fd7e');
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
    } catch {
      // audio not available
    }
  }, []);

  useEffect(() => {
    const newAlerts: ActiveAlert[] = [];

    for (const widget of widgets) {
      if (widget.type === 'gforce') continue;
      const ch = channels.get(widget.channelName);
      if (!ch) continue;

      const { color, zoneIndex } = getZoneColor(ch.value, widget.zones);
      const prevZone = previousZonesRef.current.get(widget.channelName) ?? -1;

      // Entered a critical or warning zone
      if ((isCritical(color) || isWarning(color)) && zoneIndex !== prevZone) {
        // Find the threshold that was crossed
        const crossedZone = widget.zones[zoneIndex];
        const prevZoneData = zoneIndex > 0 ? widget.zones[zoneIndex - 1] : null;
        const threshold = prevZoneData ? prevZoneData.upTo : widget.min;
        const condition = ch.value > threshold ? 'above' : 'below';

        newAlerts.push({
          id: `${widget.id}-${zoneIndex}`,
          channelName: widget.channelName,
          value: ch.value,
          threshold,
          condition,
          color,
          label: widget.label,
          unit: widget.unit,
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

    // Remove alerts whose channel is back in a safe zone
    setAlerts((prev) =>
      prev.filter((alert) => {
        const ch = channels.get(alert.channelName);
        if (!ch) return true;
        const { color } = getZoneColor(ch.value, widgets.find((w) => w.channelName === alert.channelName)?.zones ?? []);
        return isCritical(color) || isWarning(color);
      }),
    );
  }, [channels, widgets, playAlarmTone]);

  // Repeat alarm tone every 3 seconds while active
  useEffect(() => {
    if (alerts.length > 0 && !dismissed) {
      alarmIntervalRef.current = setInterval(playAlarmTone, 3000);
    } else {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [alerts.length, dismissed, playAlarmTone]);

  if (alerts.length === 0 || dismissed) return null;

  const primaryAlert = alerts[0];
  const isDanger = isCritical(primaryAlert.color);

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
        animation: 'flashBg 0.5s ease-in-out infinite alternate',
        background: isDanger ? 'rgba(180, 0, 0, 0.92)' : 'rgba(180, 90, 0, 0.92)',
      }}
    >
      {/* Flashing border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `12px solid ${isDanger ? '#ff0000' : '#ff8c00'}`,
          animation: 'flashBorder 0.4s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}
      />

      {/* Warning icon */}
      <div
        style={{
          fontSize: 'clamp(60px, 12vw, 120px)',
          animation: 'pulse 0.5s ease-in-out infinite alternate',
          marginBottom: 16,
        }}
      >
        ⚠️
      </div>

      {/* Channel name */}
      <div
        style={{
          fontSize: 'clamp(20px, 5vw, 48px)',
          color: 'white',
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: '0 0 30px rgba(255,255,255,0.8)',
          marginBottom: 8,
        }}
      >
        {primaryAlert.label}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 'clamp(48px, 14vw, 140px)',
          color: 'white',
          fontFamily: 'monospace',
          fontWeight: 900,
          lineHeight: 1,
          textShadow: '0 0 60px rgba(255,255,255,0.9)',
          animation: 'pulse 0.5s ease-in-out infinite alternate',
          marginBottom: 8,
        }}
      >
        {primaryAlert.value.toFixed(1)}
        <span style={{ fontSize: '0.35em', opacity: 0.8, marginLeft: 8 }}>{primaryAlert.unit}</span>
      </div>

      {/* Message */}
      <div
        style={{
          fontSize: 'clamp(16px, 3vw, 32px)',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        {primaryAlert.condition === 'above' ? 'EXCEEDS' : 'BELOW'} THRESHOLD of{' '}
        {primaryAlert.threshold.toFixed(1)} {primaryAlert.unit}
      </div>

      {/* Additional alerts */}
      {alerts.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {alerts.slice(1).map((a) => (
            <div
              key={a.id}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 8,
                padding: '6px 14px',
                color: 'white',
                fontSize: 'clamp(12px, 2vw, 18px)',
                fontWeight: 700,
              }}
            >
              {a.label}: {a.value.toFixed(1)} {a.unit}
            </div>
          ))}
        </div>
      )}

      {/* Dismiss instruction */}
      <div
        style={{
          fontSize: 'clamp(12px, 1.5vw, 18px)',
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 2,
          animation: 'fadeInOut 1.5s ease-in-out infinite',
        }}
      >
        TAP ANYWHERE TO DISMISS
      </div>

      <style>{`
        @keyframes flashBg {
          from { background-color: ${isDanger ? 'rgba(180,0,0,0.92)' : 'rgba(180,90,0,0.92)'}; }
          to   { background-color: ${isDanger ? 'rgba(255,0,0,0.96)' : 'rgba(255,120,0,0.96)'}; }
        }
        @keyframes flashBorder {
          from { opacity: 1; }
          to   { opacity: 0.3; }
        }
        @keyframes pulse {
          from { transform: scale(1); }
          to   { transform: scale(1.05); }
        }
        @keyframes fadeInOut {
          0%,100% { opacity: 0.4; }
          50%     { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
