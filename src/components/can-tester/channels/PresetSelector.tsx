'use client';

import { Select, Button, Group } from '@mantine/core';
import { useState } from 'react';
import { ALL_PRESETS } from '@/lib/can-tester/can/presets';
import { useCANStore } from '@/lib/can-tester/store';

export function PresetSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const loadPreset = useCANStore(s => s.loadPreset);

  const options = ALL_PRESETS.map(p => ({ value: p.id, label: p.name }));

  function handleLoad() {
    const preset = ALL_PRESETS.find(p => p.id === selected);
    if (preset) loadPreset(preset);
  }

  return (
    <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
      <Select
        placeholder="Load device preset…"
        data={options}
        value={selected}
        onChange={setSelected}
        style={{ flex: 1 }}
        clearable
      />
      <Button onClick={handleLoad} disabled={!selected} variant="filled" size="sm">
        Load
      </Button>
    </Group>
  );
}
