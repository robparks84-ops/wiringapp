'use client';

import {
  ActionIcon, Box, Button, ColorInput, Divider,
  Group, ScrollArea, Select, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Cavity, CavityNodeData } from '@/lib/nodeDefaults';

interface PropertiesPanelProps {
  selected: { node?: Node; edge?: Edge } | null;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  onUpdateEdge: (id: string, data: Record<string, unknown>) => void;
  onDelete: () => void;
  onRemoveCavity: (nodeId: string, cavityId: string) => void;
}

const WIRE_COLORS = [
  { label: 'Black',   value: '#212529' },
  { label: 'Red',     value: '#c92a2a' },
  { label: 'White',   value: '#f8f9fa' },
  { label: 'Yellow',  value: '#f59f00' },
  { label: 'Blue',    value: '#1971c2' },
  { label: 'Green',   value: '#2f9e44' },
  { label: 'Orange',  value: '#e67700' },
  { label: 'Brown',   value: '#7c4a03' },
  { label: 'Pink',    value: '#e64980' },
  { label: 'Purple',  value: '#862e9c' },
  { label: 'Gray',    value: '#868e96' },
  { label: 'Lt Blue', value: '#74c0fc' },
  { label: 'Nat',     value: '#ffe8cc' },
];

const GAUGES = [
  '0 AWG', '2 AWG', '4 AWG', '6 AWG', '8 AWG',
  '10 AWG', '12 AWG', '14 AWG', '16 AWG',
  '18 AWG', '20 AWG', '22 AWG', '24 AWG', '26 AWG',
];

export function PropertiesPanel({
  selected, onUpdateNode, onUpdateEdge, onDelete, onRemoveCavity,
}: PropertiesPanelProps) {
  const node = selected?.node;
  const edge = selected?.edge;

  const nodeForm = useForm({ initialValues: { label: '' } });
  const edgeForm = useForm({ initialValues: { color: '#212529', gauge: '20 AWG', label: '' } });

  // Local editable copy of cavities
  const [cavities, setCavities] = useState<Cavity[]>([]);

  useEffect(() => {
    if (node) {
      const d = node.data as Record<string, unknown>;
      nodeForm.setValues({ label: (d.label as string) ?? '' });
      const raw = (d.cavities as Cavity[]) ?? [];
      setCavities(raw.map((c) => ({ ...c })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  useEffect(() => {
    if (edge) {
      const d = edge.data as Record<string, unknown> | undefined;
      edgeForm.setValues({
        color: (d?.color as string) ?? '#212529',
        gauge: (d?.gauge as string) ?? '20 AWG',
        label: (d?.label as string) ?? '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edge?.id]);

  if (!node && !edge) {
    return (
      <Box style={{ width: 220, borderLeft: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-gray-0)', padding: 16, flexShrink: 0 }}>
        <Text fz={12} c="dimmed" ta="center" mt={32}>
          Click a component or wire to edit.
        </Text>
      </Box>
    );
  }

  const isCavityNode = node && (
    node.type === 'cavity' || node.type === 'groundBlock'
  );

  function handleSaveLabel() {
    if (!node) return;
    onUpdateNode(node.id, { ...node.data, label: nodeForm.values.label });
  }

  function handleCavityLabelChange(idx: number, val: string) {
    const next = cavities.map((c, i) => i === idx ? { ...c, label: val } : c);
    setCavities(next);
  }

  function handleSaveCavities() {
    if (!node) return;
    onUpdateNode(node.id, { ...node.data, cavities });
  }

  function handleDeleteCavity(cavityId: string) {
    if (!node) return;
    setCavities((prev) => prev.filter((c) => c.id !== cavityId));
    onRemoveCavity(node.id, cavityId);
  }

  function handleAddCavity() {
    const newCav: Cavity = { id: Math.random().toString(36).slice(2), label: `Cav ${cavities.length + 1}` };
    const next = [...cavities, newCav];
    setCavities(next);
    if (node) onUpdateNode(node.id, { ...node.data, cavities: next });
  }

  return (
    <Box style={{ width: 230, borderLeft: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-gray-0)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Box p={10} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text fz={11} fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
          {node ? 'Component' : 'Wire'}
        </Text>
      </Box>

      <ScrollArea style={{ flex: 1 }}>
        <Box p={10}>
          {/* ── NODE ── */}
          {node && (
            <Stack gap="xs">
              <Group gap="xs">
                <TextInput
                  label="Label"
                  size="xs"
                  style={{ flex: 1 }}
                  {...nodeForm.getInputProps('label')}
                />
                <Button size="xs" mt={18} onClick={handleSaveLabel} variant="light">
                  Set
                </Button>
              </Group>

              {/* Cavities (cavity node and groundBlock) */}
              {isCavityNode && (
                <>
                  <Divider label="Cavities" labelPosition="left" fz={10} />
                  <Stack gap={2}>
                    {cavities.map((cav, idx) => (
                      <Group key={cav.id} gap={4}>
                        <TextInput
                          size="xs"
                          style={{ flex: 1 }}
                          value={cav.label}
                          onChange={(e) => handleCavityLabelChange(idx, e.currentTarget.value)}
                          onBlur={handleSaveCavities}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCavities()}
                        />
                        <Tooltip label="Delete cavity">
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteCavity(cav.id)}
                          >
                            <IconX size={11} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ))}
                  </Stack>
                  <Button
                    size="xs"
                    leftSection={<IconPlus size={12} />}
                    variant="light"
                    onClick={handleAddCavity}
                    fullWidth
                  >
                    Add cavity
                  </Button>
                </>
              )}

              {/* Ground / Splice nodes — just label */}
              {(node.type === 'ground' || node.type === 'splice') && (
                <TextInput
                  label="Location"
                  size="xs"
                  defaultValue={(node.data as Record<string, unknown>)?.location as string ?? ''}
                  onBlur={(e) =>
                    onUpdateNode(node.id, { ...node.data, location: e.currentTarget.value })
                  }
                />
              )}
            </Stack>
          )}

          {/* ── EDGE ── */}
          {edge && (
            <form onSubmit={edgeForm.onSubmit((v) => onUpdateEdge(edge.id, { ...(edge.data as object), ...v }))}>
              <Stack gap="xs">
                <TextInput label="Circuit name" size="xs" placeholder="e.g. IGN_SW" {...edgeForm.getInputProps('label')} />
                <Select label="Wire gauge" size="xs" data={GAUGES} {...edgeForm.getInputProps('gauge')} />
                <ColorInput
                  label="Wire color"
                  size="xs"
                  swatches={WIRE_COLORS.map((c) => c.value)}
                  {...edgeForm.getInputProps('color')}
                />
                <Button type="submit" size="xs" mt={4}>Apply</Button>
              </Stack>
            </form>
          )}

          <Button color="red" variant="subtle" size="xs" fullWidth mt={12} leftSection={<IconTrash size={13} />} onClick={onDelete}>
            Delete {node ? 'component' : 'wire'}
          </Button>
        </Box>
      </ScrollArea>
    </Box>
  );
}
