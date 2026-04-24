'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Select, Group, Text } from '@mantine/core';

type SessionType = 'practice' | 'qualifying' | 'race' | 'endurance';

const SESSION_LABELS: Record<SessionType, string> = {
  practice: 'Practice',
  qualifying: 'Qualifying',
  race: 'Race',
  endurance: 'Endurance',
};

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function StintPanel() {
  const [sessionType, setSessionType] = useState<SessionType>('endurance');
  const [stintStart, setStintStart] = useState<number | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [pitStart, setPitStart] = useState<number | null>(null);
  const [lastPitDuration, setLastPitDuration] = useState<number | null>(null);
  const [stintElapsed, setStintElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [pitElapsed, setPitElapsed] = useState(0);
  const [sessionLength, setSessionLength] = useState(0); // minutes, 0 = no countdown
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (stintStart) setStintElapsed(now - stintStart);
      if (sessionStart) setSessionElapsed(now - sessionStart);
      if (pitStart) setPitElapsed(now - pitStart);
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stintStart, sessionStart, pitStart]);

  function startSession() {
    const now = Date.now();
    setSessionStart(now);
    setStintStart(now);
    setStintElapsed(0);
    setSessionElapsed(0);
    setPitStart(null);
  }

  function enterPit() {
    setPitStart(Date.now());
    setStintStart(null);
  }

  function exitPit() {
    if (pitStart) setLastPitDuration(Date.now() - pitStart);
    setPitStart(null);
    setStintStart(Date.now());
    setStintElapsed(0);
  }

  function resetSession() {
    setSessionStart(null);
    setStintStart(null);
    setPitStart(null);
    setStintElapsed(0);
    setSessionElapsed(0);
    setPitElapsed(0);
    setLastPitDuration(null);
  }

  const sessionRemaining = sessionLength > 0 && sessionStart
    ? Math.max(0, sessionLength * 60_000 - sessionElapsed)
    : null;

  const inPit = pitStart !== null;
  const running = stintStart !== null || inPit;

  return (
    <div style={{ background: '#0e0e14', border: '1px solid #1e1e2e', borderRadius: 12, padding: '8px 14px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Session type */}
      <Select
        size="xs"
        value={sessionType}
        onChange={(v) => v && setSessionType(v as SessionType)}
        data={Object.entries(SESSION_LABELS).map(([value, label]) => ({ value, label }))}
        style={{ width: 120 }}
        styles={{ input: { background: '#1a1a24', border: '1px solid #333', color: 'white' } }}
      />

      {/* Session timer */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>SESSION</div>
        <div style={{ color: sessionStart ? '#aaa' : '#333', fontSize: 18, fontFamily: 'monospace', fontWeight: 700 }}>
          {formatDuration(sessionElapsed)}
        </div>
      </div>

      {/* Countdown if session length set */}
      {sessionRemaining !== null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>REMAINING</div>
          <div style={{
            fontSize: 18, fontFamily: 'monospace', fontWeight: 700,
            color: sessionRemaining < 300_000 ? '#e03131' : sessionRemaining < 900_000 ? '#f59f00' : '#2f9e44',
          }}>
            {formatDuration(sessionRemaining)}
          </div>
        </div>
      )}

      {/* Stint timer */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>{inPit ? 'IN PIT' : 'STINT'}</div>
        <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color: inPit ? '#f59f00' : '#4dabf7' }}>
          {inPit ? formatDuration(pitElapsed) : formatDuration(stintElapsed)}
        </div>
      </div>

      {/* Last pit */}
      {lastPitDuration !== null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>LAST PIT</div>
          <div style={{ fontSize: 16, fontFamily: 'monospace', color: '#888' }}>{formatDuration(lastPitDuration)}</div>
        </div>
      )}

      {/* Controls */}
      <Group gap={6} ml="auto">
        {!running && (
          <Button size="xs" color="green" onClick={startSession}>Start</Button>
        )}
        {running && !inPit && (
          <Button size="xs" color="yellow" onClick={enterPit}>Pit In</Button>
        )}
        {inPit && (
          <Button size="xs" color="teal" onClick={exitPit}>Pit Out</Button>
        )}
        {running && (
          <Button size="xs" variant="subtle" color="red" onClick={resetSession}>Reset</Button>
        )}
      </Group>
    </div>
  );
}
