'use client';

import { Select, Group, Button, Badge } from '@mantine/core';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { Lap } from '@/lib/types';

function formatLapTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

export default function LapSelector() {
  const { laps, selectedLap, setSelectedLap } = useTelemetry();

  if (laps.length === 0) return null;

  const best = laps.reduce((b, l) => (l.lapTime < b.lapTime ? l : b), laps[0]);

  return (
    <Group gap={8}>
      <Button
        size="xs"
        variant={selectedLap === null ? 'filled' : 'subtle'}
        color="teal"
        onClick={() => setSelectedLap(null)}
      >
        LIVE
      </Button>
      <Select
        size="xs"
        placeholder="Review lap…"
        value={selectedLap?.id ?? null}
        onChange={(id) => {
          const lap = laps.find((l) => l.id === id) ?? null;
          setSelectedLap(lap);
        }}
        data={laps.map((l) => ({
          value: l.id,
          label: `Lap ${l.lapNumber}  ${formatLapTime(l.lapTime)}${l.id === best.id ? ' ★' : ''}`,
        }))}
        style={{ width: 200 }}
        clearable
      />
      {selectedLap && (
        <Badge color="yellow" variant="dot" size="sm">
          Reviewing L{selectedLap.lapNumber}
        </Badge>
      )}
    </Group>
  );
}
