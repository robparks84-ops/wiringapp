'use client';

import { Stack, Card, Group, Text, Badge, ActionIcon, NumberInput, Button } from '@mantine/core';
import { useState } from 'react';
import { IconTrash, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { decodeSignal, encodeSignal } from '@/lib/can-tester/can/encoding';
import { useCANStore } from '@/lib/can-tester/store';
import { CANSignal } from '@/lib/can-tester/types';

interface Props {
  signals: CANSignal[];
  data: number[];
}

export function SignalDecodePanel({ signals, data }: Props) {
  const removeSignal = useCANStore(s => s.removeSignal);
  const setFrameData = useCANStore(s => s.setFrameData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  function startEdit(sig: CANSignal) {
    setEditingId(sig.id);
    setEditValue(decodeSignal(data, sig));
  }

  function applyEdit(sig: CANSignal) {
    const newData = encodeSignal(data, sig, editValue);
    setFrameData(newData);
    setEditingId(null);
  }

  if (signals.length === 0) {
    return <Text c="dimmed" size="sm">No signals defined on this frame.</Text>;
  }

  return (
    <Stack gap="xs">
      {signals.map(sig => {
        const decoded = decodeSignal(data, sig);
        const isEditing = editingId === sig.id;
        return (
          <Card key={sig.id} withBorder padding="xs">
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <div style={{ minWidth: 0 }}>
                <Group gap={6}>
                  <Text fw={600} size="sm" truncate>{sig.name}</Text>
                  <Badge size="xs" variant="outline">{sig.byteOrder === 'intel' ? 'LE' : 'BE'}</Badge>
                  {sig.signed && <Badge size="xs" variant="outline" color="orange">signed</Badge>}
                </Group>
                <Text size="xs" c="dimmed">
                  bit {sig.startBit}, {sig.bitLength}b · ×{sig.scale}{sig.offset !== 0 ? ` +${sig.offset}` : ''} {sig.unit}
                </Text>
              </div>

              {isEditing ? (
                <Group gap={4} wrap="nowrap">
                  <NumberInput
                    value={editValue}
                    onChange={v => setEditValue(Number(v))}
                    size="xs"
                    style={{ width: 90 }}
                    decimalScale={4}
                  />
                  <ActionIcon size="sm" color="green" onClick={() => applyEdit(sig)}>
                    <IconCheck size={12} />
                  </ActionIcon>
                  <ActionIcon size="sm" color="gray" onClick={() => setEditingId(null)}>
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              ) : (
                <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Text fw={700} size="sm" style={{ fontFamily: 'monospace' }}>
                    {decoded.toFixed(sig.scale < 1 ? Math.ceil(-Math.log10(sig.scale)) : 0)} {sig.unit}
                  </Text>
                  <ActionIcon size="sm" variant="subtle" onClick={() => startEdit(sig)}>
                    <IconEdit size={12} />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={() => removeSignal(sig.id)}>
                    <IconTrash size={12} />
                  </ActionIcon>
                </Group>
              )}
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
