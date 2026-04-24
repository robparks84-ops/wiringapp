'use client';

import { useState } from 'react';
import { Modal, Select, TextInput, NumberInput, Button, Group, Stack, Text, ActionIcon, ColorInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { WidgetConfig, WidgetType, ColorZone } from '@/lib/types';

interface Props {
  config: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
  onClose: () => void;
}

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'dial', label: 'Dial Gauge' },
  { value: 'gforce', label: 'G-Force Plot' },
  { value: 'digital', label: 'Digital Display' },
  { value: 'hbar', label: 'Horizontal Bar' },
  { value: 'vbar', label: 'Vertical Bar' },
  { value: 'linechart', label: 'Line Chart' },
];

export default function WidgetConfigModal({ config, onSave, onClose }: Props) {
  const [type, setType] = useState<WidgetType>(config.type);
  const [label, setLabel] = useState(config.label);
  const [unit, setUnit] = useState(config.unit);
  const [min, setMin] = useState(config.min);
  const [max, setMax] = useState(config.max);
  const [zones, setZones] = useState<ColorZone[]>(config.zones);
  const [channelNameY, setChannelNameY] = useState(config.channelNameY ?? '');

  function updateZone(i: number, field: keyof ColorZone, value: number | string) {
    setZones((z) => z.map((zone, idx) => idx === i ? { ...zone, [field]: value } : zone));
  }

  function addZone() {
    setZones((z) => [...z, { upTo: max, color: '#e03131' }]);
  }

  function removeZone(i: number) {
    setZones((z) => z.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    onSave({ ...config, type, label, unit, min, max, zones, channelNameY: channelNameY || undefined });
  }

  return (
    <Modal opened onClose={onClose} title="Widget Settings" size="md" centered>
      <Stack gap="sm">
        <Select
          label="Widget type"
          data={WIDGET_TYPES}
          value={type}
          onChange={(v) => v && setType(v as WidgetType)}
        />
        <TextInput label="Display label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <TextInput label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. °F, RPM, mph" />

        {type !== 'gforce' && type !== 'digital' && (
          <Group grow>
            <NumberInput label="Min" value={min} onChange={(v) => setMin(Number(v))} />
            <NumberInput label="Max" value={max} onChange={(v) => setMax(Number(v))} />
          </Group>
        )}

        {type === 'gforce' && (
          <TextInput
            label="Y-axis channel (longitudinal G)"
            value={channelNameY}
            onChange={(e) => setChannelNameY(e.target.value)}
            placeholder="e.g. AccelY"
          />
        )}

        <div>
          <Text size="sm" fw={500} mb={4}>Color zones</Text>
          <Text size="xs" c="dimmed" mb={8}>
            Each zone applies its color when value is ≤ the threshold. Zones are evaluated top-to-bottom.
          </Text>
          <Stack gap={6}>
            {zones.map((zone, i) => (
              <Group key={i} gap={6} align="flex-end">
                <NumberInput
                  label={i === 0 ? 'Up to' : undefined}
                  value={zone.upTo === Infinity ? '' : zone.upTo}
                  onChange={(v) => updateZone(i, 'upTo', v === '' ? Infinity : Number(v))}
                  placeholder="∞"
                  style={{ flex: 1 }}
                />
                <ColorInput
                  label={i === 0 ? 'Color' : undefined}
                  value={zone.color}
                  onChange={(v) => updateZone(i, 'color', v)}
                  style={{ flex: 1 }}
                  format="hex"
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => removeZone(i)}
                  mb={i === 0 ? 0 : undefined}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconPlus size={12} />}
            mt={8}
            onClick={addZone}
          >
            Add zone
          </Button>
        </div>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
