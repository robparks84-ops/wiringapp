'use client';

import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { LapNote } from '@/lib/types';

interface LapRecord {
  lapNumber: number;
  time: number;
  sectors: number[];
  flagged: boolean;
}

interface SectorBest {
  overall: number | null;
  personal: number | null;
}

// F1-style sector color
function sectorColor(time: number, personal: number | null, overall: number | null): string {
  if (!personal || !overall) return '#aaa';
  if (time <= overall) return '#c084fc'; // purple — overall best
  if (time <= personal) return '#2f9e44'; // green — personal best
  return '#f59f00';                        // yellow — slower
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

function formatDelta(s: number): string {
  return (s > 0 ? '+' : '') + s.toFixed(3) + 's';
}

const SECTOR_COUNT = 3;

export default function DeltaTimer() {
  const { channels } = useTelemetry();
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [lapHistory, setLapHistory] = useState<LapRecord[]>([]);
  const [currentSector, setCurrentSector] = useState(0);
  const [sectorTimes, setSectorTimes] = useState<number[]>([]);
  const [sectorBests, setSectorBests] = useState<SectorBest[]>(
    Array.from({ length: SECTOR_COUNT }, () => ({ overall: null, personal: null })),
  );
  const [lapCount, setLapCount] = useState(1);
  const [notes, setNotes] = useState<LapNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const lapStartRef = useRef(Date.now());
  const sectorStartRef = useRef(Date.now());
  const prevLapRef = useRef(0);
  const prevSectorRef = useRef(-1);

  const lapCountCh = channels.get('LapCount') ?? channels.get('lapCount');
  const lapTimeCh = channels.get('LapTime') ?? channels.get('CurrentLapTime') ?? channels.get('laptime');
  const sectorCh = channels.get('Sector') ?? channels.get('sector') ?? channels.get('CurrentSector');

  // Lap crossing detection
  useEffect(() => {
    if (!lapCountCh) return;
    const newCount = Math.round(lapCountCh.value);
    if (newCount > prevLapRef.current && prevLapRef.current > 0) {
      const elapsed = lapTimeCh ? lapTimeCh.value : (Date.now() - lapStartRef.current) / 1000;
      const record: LapRecord = { lapNumber: lapCount, time: elapsed, sectors: [...sectorTimes], flagged: false };
      setLapHistory((prev) => [...prev, record]);
      setSectorBests((prev) =>
        prev.map((b, i) => {
          const t = sectorTimes[i];
          if (t === undefined) return b;
          return {
            overall: b.overall === null ? t : Math.min(b.overall, t),
            personal: b.personal === null ? t : Math.min(b.personal, t),
          };
        }),
      );
      setLapCount((c) => c + 1);
      setSectorTimes([]);
      setCurrentSector(0);
      lapStartRef.current = Date.now();
      sectorStartRef.current = Date.now();
    }
    prevLapRef.current = newCount;
  }, [lapCountCh?.value]);

  // Sector crossing detection
  useEffect(() => {
    if (!sectorCh) return;
    const s = Math.round(sectorCh.value);
    if (s !== prevSectorRef.current && s >= 0 && s < SECTOR_COUNT) {
      const elapsed = (Date.now() - sectorStartRef.current) / 1000;
      setSectorTimes((prev) => [...prev, elapsed]);
      setCurrentSector(s);
      sectorStartRef.current = Date.now();
    }
    prevSectorRef.current = s;
  }, [sectorCh?.value]);

  // Current lap timer
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentLapTime(lapTimeCh ? lapTimeCh.value : (Date.now() - lapStartRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [lapTimeCh]);

  const bestLap = lapHistory.length > 0 ? lapHistory.reduce((b, l) => l.time < b.time ? l : b, lapHistory[0]) : null;
  const lastLap = lapHistory[lapHistory.length - 1] ?? null;
  const delta = bestLap ? currentLapTime - bestLap.time : null;

  // Predicted lap time: extrapolate from sector pace
  let predicted: number | null = null;
  if (sectorTimes.length > 0 && sectorBests.some((b) => b.personal !== null)) {
    const completedRatio = sectorTimes.reduce((a, b) => a + b, 0);
    const bestTotal = sectorBests.reduce((a, b) => a + (b.personal ?? 0), 0);
    if (bestTotal > 0 && completedRatio > 0) {
      const sectors = sectorTimes.length;
      const avgRatio = sectorTimes.reduce((a, t, i) => {
        const best = sectorBests[i]?.personal;
        return best ? a + t / best : a;
      }, 0) / sectors;
      const remaining = sectorBests.slice(sectors).reduce((a, b) => a + (b.personal ?? 0) * avgRatio, 0);
      predicted = completedRatio + remaining;
    }
  }

  function addNote() {
    if (!noteInput.trim()) return;
    setNotes((n) => [...n, { lapNumber: lapCount, text: noteInput.trim(), timestamp: Date.now() }]);
    setNoteInput('');
  }

  function toggleFlag(lapNum: number) {
    setLapHistory((h) => h.map((l) => l.lapNumber === lapNum ? { ...l, flagged: !l.flagged } : l));
  }

  return (
    <div style={{ background: '#0e0e14', border: '1px solid #1e1e2e', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Main timing row */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Current lap */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>CURRENT LAP</div>
          <div style={{ color: 'white', fontSize: 22, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1 }}>{formatTime(currentLapTime)}</div>
          <div style={{ color: '#444', fontSize: 10 }}>Lap {lapCount}</div>
        </div>

        {/* Delta */}
        {delta !== null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>Δ BEST</div>
            <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1, color: delta > 0 ? '#e03131' : '#2f9e44' }}>
              {formatDelta(delta)}
            </div>
          </div>
        )}

        {/* Predicted lap */}
        {predicted !== null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>PREDICTED</div>
            <div style={{ color: '#c084fc', fontSize: 22, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1 }}>{formatTime(predicted)}</div>
          </div>
        )}

        {/* Best lap */}
        {bestLap && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>BEST</div>
            <div style={{ color: '#c084fc', fontSize: 20, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1 }}>{formatTime(bestLap.time)}</div>
            <div style={{ color: '#444', fontSize: 10 }}>L{bestLap.lapNumber}</div>
          </div>
        )}

        {/* Last lap */}
        {lastLap && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 10, letterSpacing: 1 }}>LAST</div>
            <div style={{
              fontSize: 20, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1,
              color: bestLap && lastLap.time <= bestLap.time ? '#c084fc' : lastLap.time < (lapHistory[lapHistory.length - 2]?.time ?? Infinity) ? '#2f9e44' : '#f59f00',
            }}>
              {formatTime(lastLap.time)}
            </div>
          </div>
        )}

        {/* Sector lights */}
        {sectorBests.some((b) => b.personal !== null) && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#444', fontSize: 10 }}>S</span>
            {sectorBests.map((b, i) => {
              const t = sectorTimes[i];
              const active = i === currentSector && t === undefined;
              const color = t !== undefined ? sectorColor(t, b.personal, b.overall) : active ? '#333' : '#1a1a24';
              return (
                <div key={i} style={{
                  width: 28, height: 14, borderRadius: 3,
                  background: color,
                  border: active ? '1px solid #555' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t !== undefined && <span style={{ color: 'rgba(0,0,0,0.7)', fontSize: 9, fontWeight: 700 }}>{t.toFixed(1)}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Lap history strip */}
        {lapHistory.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {lapHistory.slice(-6).map((lt) => (
              <div
                key={lt.lapNumber}
                title="Click to flag this lap"
                onClick={() => toggleFlag(lt.lapNumber)}
                style={{
                  background: lt.flagged ? '#3b1a00' : bestLap?.lapNumber === lt.lapNumber ? '#2e1065' : '#1a1a24',
                  border: `1px solid ${lt.flagged ? '#f76707' : bestLap?.lapNumber === lt.lapNumber ? '#7c3aed' : '#333'}`,
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: lt.flagged ? '#fd7e14' : bestLap?.lapNumber === lt.lapNumber ? '#c084fc' : '#888',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {lt.flagged ? '⚑ ' : ''}L{lt.lapNumber} {formatTime(lt.time)}
              </div>
            ))}
          </div>
        )}

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes((s) => !s)}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid #333', borderRadius: 6, color: '#666', fontSize: 11, cursor: 'pointer', padding: '3px 8px' }}
        >
          📝 Notes
        </button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder={`Note for lap ${lapCount}…`}
              style={{ flex: 1, background: '#1a1a24', border: '1px solid #333', borderRadius: 6, color: 'white', padding: '4px 10px', fontSize: 12, outline: 'none' }}
            />
            <button onClick={addNote} style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: 'white', padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Add</button>
          </div>
          {notes.slice(-5).reverse().map((n, i) => (
            <div key={i} style={{ fontSize: 11, color: '#888' }}>
              <span style={{ color: '#555' }}>L{n.lapNumber}:</span> {n.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
