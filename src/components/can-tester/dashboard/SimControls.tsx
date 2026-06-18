'use client';

import { Group, Button, NumberInput, Text, Badge, Select } from '@mantine/core';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useCANStore } from '@/lib/can-tester/store';
import { SimWaveform } from '@/lib/can-tester/types';

interface Props {
  onStart: () => void;
  onStop: () => void;
}

const WAVEFORMS: { value: SimWaveform; label: string }[] = [
  { value: 'sine',        label: 'Sine'        },
  { value: 'ramp',        label: 'Ramp'        },
  { value: 'step',        label: 'Step'        },
  { value: 'random-walk', label: 'Random Walk' },
  { value: 'constant',    label: 'Constant'    },
];

export function SimControls({ onStart, onStop }: Props) {
  const { running, updateRateHz } = useCANStore(s => s.simConfig);
  const setSimRunning = useCANStore(s => s.setSimRunning);
  const setSimUpdateRate = useCANStore(s => s.setSimUpdateRate);
  const channels = useCANStore(s => s.channels);
  const updateChannel = useCANStore(s => s.updateChannel);

  function handleGlobalWaveform(waveform: string | null) {
    if (!waveform) return;
    channels.forEach(ch => updateChannel(ch.id, { waveform: waveform as SimWaveform }));
  }

  return (
    <Group gap="sm" wrap="wrap" align="flex-end">
      {running ? (
        <Button leftSection={<IconPlayerStop size={14} />} color="red" size="sm" onClick={onStop}>
          Stop Sim
        </Button>
      ) : (
        <Button leftSection={<IconPlayerPlay size={14} />} color="green" size="sm" onClick={onStart}
          disabled={channels.length === 0}
        >
          Start Sim
        </Button>
      )}

      <NumberInput
        label="Update rate"
        value={updateRateHz}
        onChange={v => setSimUpdateRate(Number(v))}
        min={1} max={60} step={1}
        suffix=" Hz"
        style={{ width: 120 }}
        size="sm"
        disabled={running}
      />

      <Select
        label="All waveforms"
        placeholder="Override all…"
        data={WAVEFORMS}
        onChange={handleGlobalWaveform}
        clearable
        style={{ width: 150 }}
        size="sm"
        disabled={running}
      />

      {running && <Badge color="green" variant="dot" size="sm" mt="xl">Simulating</Badge>}
      {channels.length === 0 && !running && (
        <Text size="xs" c="dimmed">Add channels in the Channel Map tab first.</Text>
      )}
    </Group>
  );
}
