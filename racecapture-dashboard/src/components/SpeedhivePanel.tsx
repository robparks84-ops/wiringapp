'use client';

import { useEffect, useRef, useState } from 'react';
import { TextInput, Button, Group, Badge, Text, Select, ScrollArea } from '@mantine/core';

// MYLAPS Speedhive / CloudTiming live leaderboard.
// API base: https://api2.mylaps.com
// Auth: optional API token (from cloudtiming.mylaps.com → API Management).
// Many read endpoints are public without authentication.

interface Competitor {
  position: number;
  carNumber: string;
  driverName: string;
  className: string;
  lapCount: number;
  totalTime: string;
  bestLap: string;
  lastLap: string;
  gap: string;
  gapToNext: string;
  status: string; // DQ/DNS/DNF or empty
}

interface MylapsEvent {
  id: string;
  name: string;
  date: string;
}

interface MylapsSession {
  id: string;
  name: string;
  type: string;
}

const POLL_MS = 15_000;

async function mylapsGet(path: string, token: string): Promise<unknown> {
  const res = await fetch(`/api/mylaps/${path}`, {
    headers: token ? { 'x-mylaps-token': token } : {},
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function parseCompetitors(raw: unknown): Competitor[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: Record<string, unknown>, i: number) => ({
    position: (r.position as number) ?? i + 1,
    carNumber: String(r.carNumber ?? r.number ?? r.bib ?? r.competitorId ?? ''),
    driverName: String(r.name ?? r.driverName ?? r.competitorName ?? ''),
    className: String(r.class ?? r.className ?? r.category ?? ''),
    lapCount: Number(r.laps ?? r.lapCount ?? 0),
    totalTime: String(r.totalTime ?? r.time ?? ''),
    bestLap: String(r.bestLap ?? r.fastestLap ?? ''),
    lastLap: String(r.lastLap ?? r.lastLapTime ?? ''),
    gap: String(r.gap ?? r.diff ?? ''),
    gapToNext: String(r.gapToNext ?? ''),
    status: String(r.status ?? ''),
  }));
}

export default function SpeedhivePanel({ myCarNumber = '' }: { myCarNumber?: string }) {
  const [orgId, setOrgId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [events, setEvents] = useState<MylapsEvent[]>([]);
  const [sessions, setSessions] = useState<MylapsSession[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchEvents() {
    if (!orgId.trim()) return;
    setLoadingEvents(true);
    try {
      const data = await mylapsGet(`organizations/${orgId}/events?limit=20`, apiToken) as { events?: MylapsEvent[]; data?: MylapsEvent[] };
      const list = (data?.events ?? data?.data ?? (Array.isArray(data) ? data : [])) as MylapsEvent[];
      setEvents(list);
      setError('');
    } catch (e) {
      setError(`Events: ${e}`);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchSessions(eventId: string) {
    try {
      const data = await mylapsGet(`events/${eventId}/sessions`, apiToken) as { sessions?: MylapsSession[]; data?: MylapsSession[] };
      const list = (data?.sessions ?? data?.data ?? (Array.isArray(data) ? data : [])) as MylapsSession[];
      setSessions(list);
    } catch (e) {
      setError(`Sessions: ${e}`);
    }
  }

  async function fetchResults() {
    if (!selectedSessionId) return;
    try {
      const data = await mylapsGet(`sessions/${selectedSessionId}/results`, apiToken) as { results?: unknown; data?: unknown };
      const raw = data?.results ?? data?.data ?? data;
      setCompetitors(parseCompetitors(raw));
      setLastUpdate(new Date());
      setError('');
    } catch (e) {
      setError(`Results: ${e}`);
    }
  }

  useEffect(() => {
    if (selectedEventId) fetchSessions(selectedEventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!connected || !selectedSessionId) return;
    fetchResults();
    intervalRef.current = setInterval(fetchResults, POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, selectedSessionId]);

  function connect() {
    if (!selectedSessionId) { setError('Select a session first'); return; }
    setConnected(true);
  }

  function disconnect() {
    setConnected(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  const ownIdx = myCarNumber
    ? competitors.findIndex((c) => c.carNumber === myCarNumber)
    : -1;
  const ownCar = ownIdx >= 0 ? competitors[ownIdx] : null;
  const carAhead = ownIdx > 0 ? competitors[ownIdx - 1] : null;
  const carBehind = ownIdx >= 0 && ownIdx < competitors.length - 1 ? competitors[ownIdx + 1] : null;

  return (
    <div style={{ background: '#0e0e14', border: '1px solid #1e1e2e', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Text size="sm" fw={700} c="white">🏁 Speedhive</Text>
        {lastUpdate && <Text size="xs" c="dimmed">updated {lastUpdate.toLocaleTimeString()}</Text>}
        {error && <Text size="xs" c="red">{error}</Text>}
        <Button size="xs" variant={connected ? 'filled' : 'subtle'} color={connected ? 'red' : 'teal'} ml="auto"
          onClick={connected ? disconnect : connect}>
          {connected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>

      {/* Config */}
      {!connected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Group gap={6} align="flex-end">
            <TextInput size="xs" label="Org ID" value={orgId} onChange={(e) => setOrgId(e.target.value)}
              placeholder="e.g. 12345" style={{ width: 120 }} />
            <TextInput size="xs" label="API Token (optional)" value={apiToken}
              onChange={(e) => setApiToken(e.target.value)} style={{ flex: 1 }} />
            <Button size="xs" loading={loadingEvents} onClick={fetchEvents} disabled={!orgId.trim()}>
              Load Events
            </Button>
          </Group>
          {events.length > 0 && (
            <Select
              size="xs"
              label="Event"
              placeholder="Select event…"
              value={selectedEventId}
              onChange={setSelectedEventId}
              data={events.map((e) => ({ value: e.id, label: `${e.name} (${e.date ?? ''})` }))}
            />
          )}
          {sessions.length > 0 && (
            <Select
              size="xs"
              label="Session"
              placeholder="Select session…"
              value={selectedSessionId}
              onChange={setSelectedSessionId}
              data={sessions.map((s) => ({ value: s.id, label: `${s.name} (${s.type ?? ''})` }))}
            />
          )}
        </div>
      )}

      {/* Relative position display */}
      {connected && ownCar && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {carAhead && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a1a24', borderRadius: 8, padding: '6px 10px', borderLeft: '3px solid #f59f00' }}>
              <span style={{ color: '#f59f00', fontSize: 11, width: 14 }}>▲</span>
              <span style={{ color: '#555', fontSize: 11, width: 20 }}>P{carAhead.position}</span>
              <span style={{ color: '#ffd43b', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{carAhead.carNumber}</span>
              <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>{carAhead.driverName}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{carAhead.lastLap}</span>
              <Badge size="xs" color="yellow" variant="outline">{carAhead.gap || `${carAhead.lapCount - ownCar.lapCount}L`}</Badge>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e2a1e', borderRadius: 8, padding: '6px 10px', borderLeft: '3px solid #2f9e44' }}>
            <span style={{ color: '#2f9e44', fontSize: 11, width: 14 }}>●</span>
            <span style={{ color: '#555', fontSize: 11, width: 20 }}>P{ownCar.position}</span>
            <span style={{ color: '#69db7c', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{ownCar.carNumber}</span>
            <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>{ownCar.driverName}</span>
            <span style={{ color: '#666', fontSize: 11 }}>{ownCar.lastLap}</span>
            <Badge size="xs" color="green" variant="outline">Lap {ownCar.lapCount}</Badge>
          </div>
          {carBehind && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a1a24', borderRadius: 8, padding: '6px 10px', borderLeft: '3px solid #e03131' }}>
              <span style={{ color: '#e03131', fontSize: 11, width: 14 }}>▼</span>
              <span style={{ color: '#555', fontSize: 11, width: 20 }}>P{carBehind.position}</span>
              <span style={{ color: '#ff6b6b', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{carBehind.carNumber}</span>
              <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>{carBehind.driverName}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{carBehind.lastLap}</span>
              <Badge size="xs" color="red" variant="outline">{carBehind.gapToNext || `${ownCar.lapCount - carBehind.lapCount}L`}</Badge>
            </div>
          )}
        </div>
      )}

      {/* Full leaderboard when connected but own car not found */}
      {connected && competitors.length > 0 && (
        <ScrollArea h={200}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {competitors.slice(0, 30).map((c) => (
              <div
                key={c.position}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 8px',
                  background: c.carNumber === myCarNumber ? '#1e2a1e' : '#1a1a24',
                  borderRadius: 5,
                  fontSize: 11,
                  borderLeft: c.carNumber === myCarNumber ? '3px solid #2f9e44' : '3px solid transparent',
                }}
              >
                <span style={{ color: '#555', width: 22 }}>P{c.position}</span>
                <span style={{ color: '#4dabf7', fontFamily: 'monospace', fontWeight: 700, width: 36 }}>#{c.carNumber}</span>
                <span style={{ color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.driverName}</span>
                <span style={{ color: '#666', width: 24, textAlign: 'right' }}>{c.lapCount}</span>
                <span style={{ color: '#888', width: 56, textAlign: 'right', fontFamily: 'monospace' }}>{c.bestLap}</span>
                <span style={{ color: '#555', width: 56, textAlign: 'right', fontFamily: 'monospace' }}>{c.gap}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {connected && competitors.length === 0 && !error && (
        <Text size="xs" c="dimmed" ta="center" py="sm">Waiting for timing data…</Text>
      )}
    </div>
  );
}
