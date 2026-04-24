'use client';

import { useState } from 'react';
import { Modal, TextInput, ScrollArea, Stack, Button, Group, Badge, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import type { WidgetConfig, WidgetType, ColorZone } from '@/lib/types';

const DEFAULT_ZONES: ColorZone[] = [
  { upTo: Infinity, color: '#4dabf7' },
];

const CHANNEL_DEFAULTS: Record<string, Partial<WidgetConfig>> = {
  RPM: { min: 0, max: 10000, zones: [{ upTo: 7000, color: '#2f9e44' }, { upTo: 8500, color: '#f59f00' }, { upTo: Infinity, color: '#e03131' }] },
  Speed: { min: 0, max: 200, unit: 'mph', zones: [{ upTo: Infinity, color: '#4dabf7' }] },
  EngineTemp: { min: 0, max: 300, unit: '°F', zones: [{ upTo: 120, color: '#1c7ed6' }, { upTo: 180, color: '#f59f00' }, { upTo: 210, color: '#2f9e44' }, { upTo: 240, color: '#f76707' }, { upTo: Infinity, color: '#e03131' }] },
  OilTemp: { min: 0, max: 300, unit: '°F', zones: [{ upTo: 120, color: '#1c7ed6' }, { upTo: 180, color: '#f59f00' }, { upTo: 210, color: '#2f9e44' }, { upTo: 240, color: '#f76707' }, { upTo: Infinity, color: '#e03131' }] },
  OilPress: { min: 0, max: 150, unit: 'psi', zones: [{ upTo: 10, color: '#e03131' }, { upTo: 20, color: '#f76707' }, { upTo: 80, color: '#2f9e44' }, { upTo: Infinity, color: '#f59f00' }] },
  FuelLevel: { min: 0, max: 100, unit: '%', zones: [{ upTo: 15, color: '#e03131' }, { upTo: 30, color: '#f76707' }, { upTo: Infinity, color: '#2f9e44' }] },
  TPS: { min: 0, max: 100, unit: '%', zones: [{ upTo: Infinity, color: '#69db7c' }] },
  Battery: { min: 0, max: 20, unit: 'V', zones: [{ upTo: 11.5, color: '#e03131' }, { upTo: 12.5, color: '#f59f00' }, { upTo: Infinity, color: '#2f9e44' }] },
};

interface Props {
  onAdd: (config: WidgetConfig) => void;
  onClose: () => void;
}

let idCounter = Date.now();

export default function ChannelPicker({ onAdd, onClose }: Props) {
  const { channels } = useTelemetry();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<WidgetType>('dial');

  const channelNames = Array.from(channels.keys()).filter((n) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );

  function add(name: string) {
    const defaults = CHANNEL_DEFAULTS[name] ?? {};
    const config: WidgetConfig = {
      id: String(++idCounter),
      type: selectedType,
      channelName: name,
      label: name,
      unit: defaults.unit ?? channels.get(name)?.unit ?? '',
      min: defaults.min ?? 0,
      max: defaults.max ?? 100,
      zones: defaults.zones ?? DEFAULT_ZONES,
    };
    onAdd(config);
    onClose();
  }

  const typeButtons: { type: WidgetType; label: string }[] = [
    { type: 'dial', label: 'Dial' },
    { type: 'digital', label: 'Digital' },
    { type: 'hbar', label: 'H-Bar' },
    { type: 'vbar', label: 'V-Bar' },
    { type: 'linechart', label: 'Chart' },
  ];

  return (
    <Modal opened onClose={onClose} title="Add Widget" size="md" centered>
      <Stack gap="sm">
        <TextInput
          leftSection={<IconSearch size={14} />}
          placeholder="Search channels…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div>
          <Text size="xs" c="dimmed" mb={6}>Widget type</Text>
          <Group gap={6}>
            {typeButtons.map((b) => (
              <Button
                key={b.type}
                size="xs"
                variant={selectedType === b.type ? 'filled' : 'subtle'}
                onClick={() => setSelectedType(b.type)}
              >
                {b.label}
              </Button>
            ))}
          </Group>
        </div>

        {channelNames.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            {channels.size === 0
              ? 'No active stream — waiting for RaceCapture to connect'
              : 'No channels match your search'}
          </Text>
        ) : (
          <ScrollArea h={320}>
            <Stack gap={4}>
              {channelNames.map((name) => {
                const ch = channels.get(name)!;
                return (
                  <button
                    key={name}
                    onClick={() => add(name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#1a1a24',
                      border: '1px solid #2a2a38',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: 'white',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{name}</span>
                    <Group gap={8}>
                      <Badge size="sm" color="gray" variant="outline">
                        {ch.value.toFixed(2)} {ch.unit}
                      </Badge>
                    </Group>
                  </button>
                );
              })}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Modal>
  );
}
