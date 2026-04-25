'use client';

import { useEffect, useRef, useState } from 'react';
import { TextInput, Button, Group, Badge, Text } from '@mantine/core';

// ChampCar "Marching Ants" data comes from a publicly shared Google Sheet.
// The sheet is updated by race control in real time during events.
// Format: each row = one car's current position segment on track.
// We poll the CSV export endpoint every 15 seconds.

interface CarPosition {
  carNumber: string;
  driverName: string;
  classname: string;
  segment: string;   // track segment / corner name
  lapCount: number;
  isOwnCar: boolean;
}

const SHEETS_CSV_BASE = 'https://docs.google.com/spreadsheets/d';

// Known ChampCar season sheet IDs (from research)
const KNOWN_SHEETS: Record<string, string> = {
  '2026': '1bP6Dz4GCfj5Xbr90EPFogvon3RBgUK7NZn0XyuSG5So',
  '2025': '1qfBq0elogpzBkLRRR_X2OhfEfoORWfcNFTXzPpr7p8Q',
};
const DEFAULT_GID = '1780407568';

function parseCSV(text: string): string[][] {
  return text.split('\n').map((row) =>
    row.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );
}

export default function ChampcarMap({ myCarNumber = '' }: { myCarNumber?: string }) {
  const [sheetId, setSheetId] = useState(KNOWN_SHEETS['2026']);
  const [gid, setGid] = useState(DEFAULT_GID);
  const [cars, setCars] = useState<CarPosition[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData() {
    try {
      const url = `/api/sheets?sheetId=${encodeURIComponent(sheetId)}&gid=${encodeURIComponent(gid)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const text = await res.text();
      const rows = parseCSV(text);
      if (rows.length < 2) return;

      // Auto-detect columns — look for headers containing car/number/driver/segment keywords
      const headers = rows[0].map((h) => h.toLowerCase());
      const colCar = headers.findIndex((h) => h.includes('car') || h.includes('#') || h.includes('number'));
      const colDriver = headers.findIndex((h) => h.includes('driver') || h.includes('name'));
      const colClass = headers.findIndex((h) => h.includes('class'));
      const colSegment = headers.findIndex((h) => h.includes('segment') || h.includes('position') || h.includes('corner') || h.includes('location'));
      const colLaps = headers.findIndex((h) => h.includes('lap'));

      const parsed: CarPosition[] = rows.slice(1)
        .filter((r) => r.length > 1 && r[colCar >= 0 ? colCar : 0]?.trim())
        .map((r) => ({
          carNumber: colCar >= 0 ? r[colCar] : r[0],
          driverName: colDriver >= 0 ? r[colDriver] : '',
          classname: colClass >= 0 ? r[colClass] : '',
          segment: colSegment >= 0 ? r[colSegment] : '',
          lapCount: colLaps >= 0 ? parseInt(r[colLaps]) || 0 : 0,
          isOwnCar: myCarNumber ? r[colCar >= 0 ? colCar : 0] === myCarNumber : false,
        }));

      setCars(parsed);
      setLastUpdate(new Date());
      setError('');
    } catch (e) {
      setError(`Failed to load: ${e}`);
    }
  }

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    fetchData();
    intervalRef.current = setInterval(fetchData, 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled, sheetId, gid]);

  const ownCar = cars.find((c) => c.isOwnCar);
  const ownIdx = cars.indexOf(ownCar!);
  const carAhead = ownIdx > 0 ? cars[ownIdx - 1] : null;
  const carBehind = ownIdx >= 0 && ownIdx < cars.length - 1 ? cars[ownIdx + 1] : null;

  return (
    <div style={{ background: '#0e0e14', border: '1px solid #1e1e2e', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Text size="sm" fw={700} c="white">🐜 Marching Ants</Text>
        {lastUpdate && <Text size="xs" c="dimmed">updated {lastUpdate.toLocaleTimeString()}</Text>}
        {error && <Text size="xs" c="red">{error}</Text>}
        <Button size="xs" variant={enabled ? 'filled' : 'subtle'} color={enabled ? 'red' : 'teal'} ml="auto"
          onClick={() => setEnabled((e) => !e)}>
          {enabled ? 'Stop' : 'Connect'}
        </Button>
      </div>

      {/* Config (shown when not connected) */}
      {!enabled && (
        <Group gap={6}>
          <TextInput size="xs" label="Sheet ID" value={sheetId} onChange={(e) => setSheetId(e.target.value)} style={{ flex: 1 }} />
          <TextInput size="xs" label="GID" value={gid} onChange={(e) => setGid(e.target.value)} style={{ width: 130 }} />
          <Group gap={4} mt={20}>
            {Object.entries(KNOWN_SHEETS).map(([year, id]) => (
              <Button key={year} size="xs" variant="subtle" onClick={() => setSheetId(id)}>{year}</Button>
            ))}
          </Group>
        </Group>
      )}

      {/* Relative position display */}
      {enabled && ownCar && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {carAhead && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a1a24', borderRadius: 8, padding: '6px 10px', borderLeft: '3px solid #f59f00' }}>
              <span style={{ color: '#f59f00', fontSize: 11, width: 14 }}>▲</span>
              <span style={{ color: '#ffd43b', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{carAhead.carNumber}</span>
              <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>{carAhead.driverName}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{carAhead.segment}</span>
              <Badge size="xs" color="yellow" variant="outline">+{carAhead.lapCount - ownCar.lapCount} laps ahead</Badge>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e2a1e', borderRadius: 8, padding: '6px 10px', borderLeft: '3px solid #2f9e44' }}>
            <span style={{ color: '#2f9e44', fontSize: 11, width: 14 }}>●</span>
            <span style={{ color: '#69db7c', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{ownCar.carNumber}</span>
            <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>{ownCar.driverName || 'YOU'}</span>
            <span style={{ color: '#666', fontSize: 11 }}>{ownCar.segment}</span>
            <Badge size="xs" color="green" variant="outline">Lap {ownCar.lapCount}</Badge>
          </div>
          {carBehind && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a1a24', borderRadius: 8, padding: '6px 10px', borderLeft: '3px solid #e03131' }}>
              <span style={{ color: '#e03131', fontSize: 11, width: 14 }}>▼</span>
              <span style={{ color: '#ff6b6b', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{carBehind.carNumber}</span>
              <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>{carBehind.driverName}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{carBehind.segment}</span>
              <Badge size="xs" color="red" variant="outline">{ownCar.lapCount - carBehind.lapCount} laps back</Badge>
            </div>
          )}
        </div>
      )}

      {/* Full car list when connected */}
      {enabled && cars.length > 0 && !ownCar && (
        <div style={{ maxHeight: 200, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cars.slice(0, 20).map((car, i) => (
            <div key={car.carNumber} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#1a1a24', borderRadius: 6, fontSize: 12 }}>
              <span style={{ color: '#555', width: 20 }}>P{i + 1}</span>
              <span style={{ color: '#4dabf7', fontFamily: 'monospace', fontWeight: 700 }}>#{car.carNumber}</span>
              <span style={{ color: '#aaa', flex: 1 }}>{car.driverName}</span>
              <span style={{ color: '#555' }}>{car.segment}</span>
            </div>
          ))}
        </div>
      )}

      {enabled && cars.length === 0 && !error && (
        <Text size="xs" c="dimmed" ta="center" py="sm">Waiting for race data… (session may not be active)</Text>
      )}
    </div>
  );
}
