'use client';

import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';

interface LapTime {
  lapNumber: number;
  time: number;
}

export default function DeltaTimer() {
  const { channels } = useTelemetry();
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [bestLap, setBestLap] = useState<LapTime | null>(null);
  const [lapHistory, setLapHistory] = useState<LapTime[]>([]);
  const [lapCount, setLapCount] = useState(1);
  const lapStartRef = useRef<number>(Date.now());
  const prevLapTrigger = useRef<number>(0);

  // Use the LapCount channel if available, otherwise use time-based detection
  const lapCountChannel = channels.get('LapCount') ?? channels.get('lapCount');
  const lapTimeChannel = channels.get('LapTime') ?? channels.get('laptime') ?? channels.get('CurrentLapTime');

  useEffect(() => {
    if (lapCountChannel && lapCountChannel.value !== prevLapTrigger.current) {
      const newCount = Math.round(lapCountChannel.value);
      if (newCount > prevLapTrigger.current && prevLapTrigger.current > 0) {
        const elapsed = (Date.now() - lapStartRef.current) / 1000;
        const lt: LapTime = { lapNumber: lapCount, time: elapsed };
        setLapHistory((prev) => [...prev, lt]);
        setBestLap((prev) => (!prev || elapsed < prev.time ? lt : prev));
        setLapCount((c) => c + 1);
        lapStartRef.current = Date.now();
      }
      prevLapTrigger.current = newCount;
    }
  }, [lapCountChannel, lapCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lapTimeChannel) {
        setCurrentLapTime(lapTimeChannel.value);
      } else {
        setCurrentLapTime((Date.now() - lapStartRef.current) / 1000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [lapTimeChannel]);

  const delta = bestLap ? currentLapTime - bestLap.time : null;

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(3);
    return `${m}:${sec.padStart(6, '0')}`;
  }

  return (
    <div
      style={{
        background: '#0e0e14',
        border: '1px solid #222',
        borderRadius: 12,
        padding: '10px 16px',
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>CURRENT LAP</div>
        <div style={{ color: 'white', fontSize: 22, fontFamily: 'monospace', fontWeight: 700 }}>
          {formatTime(currentLapTime)}
        </div>
        <div style={{ color: '#555', fontSize: 11 }}>Lap {lapCount}</div>
      </div>

      {delta !== null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>DELTA</div>
          <div
            style={{
              fontSize: 22,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: delta > 0 ? '#e03131' : '#2f9e44',
            }}
          >
            {delta > 0 ? '+' : ''}{delta.toFixed(3)}s
          </div>
          <div style={{ color: '#555', fontSize: 11 }}>vs best</div>
        </div>
      )}

      {bestLap && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>BEST LAP</div>
          <div style={{ color: '#c084fc', fontSize: 22, fontFamily: 'monospace', fontWeight: 700 }}>
            {formatTime(bestLap.time)}
          </div>
          <div style={{ color: '#555', fontSize: 11 }}>Lap {bestLap.lapNumber}</div>
        </div>
      )}

      {lapHistory.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {lapHistory.slice(-5).map((lt) => (
            <div
              key={lt.lapNumber}
              style={{
                background: bestLap?.lapNumber === lt.lapNumber ? '#2e1065' : '#1a1a24',
                border: `1px solid ${bestLap?.lapNumber === lt.lapNumber ? '#7c3aed' : '#333'}`,
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontFamily: 'monospace',
                color: bestLap?.lapNumber === lt.lapNumber ? '#c084fc' : '#aaa',
              }}
            >
              L{lt.lapNumber} {formatTime(lt.time)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
