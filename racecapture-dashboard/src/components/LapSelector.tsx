'use client';

import { Select, Group, Button, Badge } from '@mantine/core';
import { useTelemetry } from '@/contexts/TelemetryContext';

function formatLapTime(s: number | null) {
  if (s == null || s <= 0) return '--:--.---';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

export default function LapSelector() {
  const { laps, selectedLap, setSelectedLap } = useTelemetry();

  if (laps.length === 0) return null;

  const timedLaps = laps.filter((l) => l.lapTime != null && l.lapTime > 0);
  const best = timedLaps.length > 0
    ? timedLaps.reduce((b, l) => ((l.lapTime ?? Infinity) < (b.lapTime ?? Infinity) ? l : b), timedLaps[0])
    : null;

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
        value={selectedLap?.id != null ? String(selectedLap.id) : null}
        onChange={(id) => {
          const lap = laps.find((l) => String(l.id) === id) ?? null;
          setSelectedLap(lap);
        }}
        data={laps
          .filter((l) => l.id != null)
          .map((l) => ({
            value: String(l.id),
            label: `Lap ${l.lapNumber}  ${formatLapTime(l.lapTime)}${best && l.id === best.id ? ' ★' : ''}`,
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
