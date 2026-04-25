'use client';

import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { FlagColor } from '@/lib/racecaptureTypes';

const FLAG_CHANNEL_NAMES = [
  'FlagColor', 'Flag_Color', 'flagcolor', 'Flag', 'TrackFlag',
  'TrackStatus', 'Flagtronics', 'FT_Flag', 'FT200_Flag',
  'CourseFlag', 'RaceFlag',
];

const FLAG_VALUES: Record<number, FlagColor> = {
  0: 'unknown',
  1: 'green',
  2: 'yellow',
  3: 'red',
  4: 'black',
  5: 'white',
  6: 'checkered',
  7: 'checkered',
};

const FLAG_STYLES: Record<FlagColor, { bg: string; text: string; label: string; flash: boolean }> = {
  green:     { bg: '#1a6b2a', text: '#69db7c', label: 'GREEN',     flash: false },
  yellow:    { bg: '#5c3c00', text: '#ffd43b', label: 'YELLOW',    flash: true  },
  red:       { bg: '#5c0000', text: '#ff6b6b', label: 'RED',       flash: true  },
  black:     { bg: '#111',    text: '#aaa',    label: 'BLACK',     flash: false },
  white:     { bg: '#1a1a2e', text: '#e8e8e8', label: 'WHITE',     flash: false },
  checkered: { bg: '#111',    text: '#e8e8e8', label: 'FINISH',    flash: true  },
  unknown:   { bg: '#1a1a1a', text: '#555',    label: '—',         flash: false },
};

function flagEmoji(flag: FlagColor): string {
  return { green: '🟢', yellow: '🟡', red: '🔴', black: '⚫', white: '⚪', checkered: '🏁', unknown: '◯' }[flag];
}

export default function FlagDisplay() {
  const { channels } = useTelemetry();
  const [currentFlag, setCurrentFlag] = useState<FlagColor>('unknown');
  const [prevFlag, setPrevFlag] = useState<FlagColor>('unknown');
  const [flashOn, setFlashOn] = useState(true);
  const flashRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let flagValue: number | null = null;
    for (const name of FLAG_CHANNEL_NAMES) {
      const ch = channels.get(name);
      if (ch !== undefined) { flagValue = ch.value; break; }
    }
    if (flagValue === null) {
      for (const [name, ch] of channels) {
        if (name.toLowerCase().includes('flag') || name.toLowerCase().includes('track_status')) {
          flagValue = ch.value;
          break;
        }
      }
    }

    const flag: FlagColor = flagValue !== null
      ? (FLAG_VALUES[Math.round(flagValue)] ?? 'unknown')
      : 'unknown';

    if (flag !== currentFlag) {
      setPrevFlag(currentFlag);
      setCurrentFlag(flag);

      if (flag !== 'unknown') {
        try {
          if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = flag === 'green' ? 880 : flag === 'red' ? 220 : 550;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        } catch { /* audio unavailable */ }
      }
    }
  }, [channels, currentFlag]);

  useEffect(() => {
    const style = FLAG_STYLES[currentFlag];
    if (style.flash) {
      flashRef.current = setInterval(() => setFlashOn((f) => !f), 500);
    } else {
      if (flashRef.current) clearInterval(flashRef.current);
      setFlashOn(true);
    }
    return () => { if (flashRef.current) clearInterval(flashRef.current); };
  }, [currentFlag]);

  const style = FLAG_STYLES[currentFlag];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: flashOn ? style.bg : '#0a0a0f',
      border: `2px solid ${flashOn ? style.text + '88' : '#222'}`,
      borderRadius: 10,
      padding: '6px 14px',
      transition: 'background 0.15s, border-color 0.15s',
      minWidth: 120,
    }}>
      <span style={{ fontSize: 20 }}>{flagEmoji(currentFlag)}</span>
      <div>
        <div style={{ color: style.text, fontWeight: 900, fontSize: 15, letterSpacing: 2 }}>
          {style.label}
        </div>
        {prevFlag !== 'unknown' && prevFlag !== currentFlag && (
          <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>
            was {prevFlag.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
