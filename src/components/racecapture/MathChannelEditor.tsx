'use client';

import { useState, useEffect } from 'react';
import { Modal, TextInput, NumberInput, Button, Stack, Group, Text, ActionIcon } from '@mantine/core';
import { IconPlus, IconTrash, IconCalculator } from '@tabler/icons-react';
import type { MathChannel } from '@/lib/racecaptureTypes';
import { loadMathChannels, saveMathChannels, evaluateMathChannel } from '@/lib/mathChannels';
import { useTelemetry } from '@/contexts/TelemetryContext';

interface Props {
  onClose: () => void;
}

let idCounter = Date.now();

export default function MathChannelEditor({ onClose }: Props) {
  const { channels } = useTelemetry();
  const [mathChannels, setMathChannels] = useState<MathChannel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [previewValue, setPreviewValue] = useState<number | null>(null);

  useEffect(() => { setMathChannels(loadMathChannels()); }, []);

  function preview() {
    try {
      const val = evaluateMathChannel(formula, channels);
      setPreviewValue(val);
    } catch {
      setPreviewValue(null);
    }
  }

  function save() {
    if (!name.trim() || !formula.trim()) return;
    const ch: MathChannel = {
      id: editingId ?? String(++idCounter),
      name: name.trim(),
      formula: formula.trim(),
      unit,
      min,
      max,
    };
    const updated = editingId
      ? mathChannels.map((c) => c.id === editingId ? ch : c)
      : [...mathChannels, ch];
    setMathChannels(updated);
    saveMathChannels(updated);
    resetForm();
  }

  function remove(id: string) {
    const updated = mathChannels.filter((c) => c.id !== id);
    setMathChannels(updated);
    saveMathChannels(updated);
  }

  function edit(ch: MathChannel) {
    setEditingId(ch.id);
    setName(ch.name);
    setFormula(ch.formula);
    setUnit(ch.unit);
    setMin(ch.min);
    setMax(ch.max);
  }

  function resetForm() {
    setEditingId(null); setName(''); setFormula(''); setUnit(''); setMin(0); setMax(100); setPreviewValue(null);
  }

  const channelNames = Array.from(channels.keys());

  return (
    <Modal opened onClose={onClose} title="Custom Math Channels" size="lg" centered>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Create virtual channels from formulas. Use channel names directly: <code>RPM * TPS / 100</code>
        </Text>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 60, overflow: 'auto' }}>
          {channelNames.map((n) => (
            <span
              key={n}
              onClick={() => setFormula((f) => f + n)}
              style={{ background: '#1a1a24', border: '1px solid #333', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: '#74c0fc', cursor: 'pointer' }}
            >
              {n}
            </span>
          ))}
        </div>

        <Group grow>
          <TextInput label="Channel name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Power" />
          <TextInput label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. hp" />
        </Group>
        <TextInput
          label="Formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g. RPM * TPS / 100"
          rightSection={<IconCalculator size={14} />}
        />
        <Group grow>
          <NumberInput label="Min" value={min} onChange={(v) => setMin(Number(v))} />
          <NumberInput label="Max" value={max} onChange={(v) => setMax(Number(v))} />
        </Group>

        <Group>
          <Button size="xs" variant="subtle" onClick={preview}>Preview value</Button>
          {previewValue !== null && (
            <Text size="sm" c="green">→ {previewValue.toFixed(3)} {unit}</Text>
          )}
        </Group>

        <Group justify="flex-end">
          <Button variant="subtle" size="sm" onClick={resetForm}>Clear</Button>
          <Button size="sm" onClick={save} disabled={!name || !formula} leftSection={<IconPlus size={12} />}>
            {editingId ? 'Update' : 'Add channel'}
          </Button>
        </Group>

        {mathChannels.length > 0 && (
          <Stack gap={6} mt="sm">
            <Text size="xs" c="dimmed" fw={600}>ACTIVE MATH CHANNELS</Text>
            {mathChannels.map((ch) => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, padding: '6px 10px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{ch.name}</span>
                  <span style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>{ch.formula}</span>
                </div>
                <span style={{ color: '#74c0fc', fontSize: 12 }}>
                  {evaluateMathChannel(ch.formula, channels).toFixed(2)} {ch.unit}
                </span>
                <ActionIcon size="xs" variant="subtle" onClick={() => edit(ch)}><IconCalculator size={12} /></ActionIcon>
                <ActionIcon size="xs" color="red" variant="subtle" onClick={() => remove(ch.id)}><IconTrash size={12} /></ActionIcon>
              </div>
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
