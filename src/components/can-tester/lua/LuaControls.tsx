'use client';

import { Group, Button, NumberInput, Text, Badge } from '@mantine/core';
import { IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-react';
import { useCANStore } from '@/lib/can-tester/store';

interface Props {
  onRun: () => void;
  onStop: () => void;
}

export function LuaControls({ onRun, onStop }: Props) {
  const { running, tickRateHz } = useCANStore(s => s.luaState);
  const clearConsole = useCANStore(s => s.clearConsole);
  const setLuaTickRate = useCANStore(s => s.setLuaTickRate);

  return (
    <Group gap="sm" wrap="wrap">
      {running ? (
        <Button
          leftSection={<IconPlayerStop size={14} />}
          color="red"
          onClick={onStop}
          size="sm"
        >
          Stop
        </Button>
      ) : (
        <Button
          leftSection={<IconPlayerPlay size={14} />}
          color="green"
          onClick={onRun}
          size="sm"
        >
          Run
        </Button>
      )}

      <Button
        leftSection={<IconTrash size={14} />}
        variant="subtle"
        color="gray"
        size="sm"
        onClick={clearConsole}
      >
        Clear
      </Button>

      <Group gap="xs" wrap="nowrap">
        <Text size="sm">Tick rate:</Text>
        <NumberInput
          value={tickRateHz}
          onChange={v => setLuaTickRate(Number(v))}
          min={1}
          max={100}
          step={1}
          suffix=" Hz"
          style={{ width: 100 }}
          size="sm"
          disabled={running}
        />
      </Group>

      {running && (
        <Badge color="green" variant="dot" size="sm">Running</Badge>
      )}
    </Group>
  );
}
