'use client';

import { Box, Button, ColorInput, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface PropertiesPanelProps {
  selected: { node?: Node; edge?: Edge } | null;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  onUpdateEdge: (id: string, data: Record<string, unknown>) => void;
  onDelete: () => void;
}

const WIRE_COLORS = [
  { label: 'Black', value: '#212529' },
  { label: 'Red', value: '#c92a2a' },
  { label: 'White', value: '#f8f9fa' },
  { label: 'Yellow', value: '#f59f00' },
  { label: 'Blue', value: '#1971c2' },
  { label: 'Green', value: '#2f9e44' },
  { label: 'Orange', value: '#e67700' },
  { label: 'Brown', value: '#7c4a03' },
  { label: 'Pink', value: '#e64980' },
  { label: 'Purple', value: '#862e9c' },
  { label: 'Gray', value: '#868e96' },
  { label: 'Lt Blue', value: '#74c0fc' },
];

const GAUGES = ['26 AWG', '24 AWG', '22 AWG', '20 AWG', '18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG', '8 AWG'];

export function PropertiesPanel({ selected, onUpdateNode, onUpdateEdge, onDelete }: PropertiesPanelProps) {
  const node = selected?.node;
  const edge = selected?.edge;

  const nodeForm = useForm({
    initialValues: { label: '', location: '', pins: 2, pinLabels: '' },
  });

  const edgeForm = useForm({
    initialValues: { color: '#212529', gauge: '20 AWG', label: '' },
  });

  useEffect(() => {
    if (node) {
      const d = node.data as Record<string, unknown>;
      nodeForm.setValues({
        label: (d.label as string) ?? '',
        location: (d.location as string) ?? '',
        pins: (d.pins as number) ?? 2,
        pinLabels: ((d.pinLabels as string[]) ?? []).join(', '),
      });
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
      <Box
        style={{
          width: 200,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          background: 'var(--mantine-color-gray-0)',
          padding: 16,
          flexShrink: 0,
        }}
      >
        <Text fz={12} c="dimmed" ta="center" mt={32}>
          Click a component or wire to edit its properties.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        width: 220,
        borderLeft: '1px solid var(--mantine-color-gray-3)',
        background: 'var(--mantine-color-gray-0)',
        padding: '12px 12px',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={10} style={{ letterSpacing: 1 }}>
        {node ? 'Component' : 'Wire'}
      </Text>

      {node && (
        <form
          onSubmit={nodeForm.onSubmit((values) => {
            const pinLabels = values.pinLabels
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            onUpdateNode(node.id, {
              ...node.data,
              label: values.label,
              location: values.location,
              pins: values.pins,
              pinLabels: pinLabels.length ? pinLabels : Array.from({ length: values.pins }, (_, i) => String(i + 1)),
            });
          })}
        >
          <Stack gap="xs">
            <TextInput label="Label" size="xs" {...nodeForm.getInputProps('label')} />
            <TextInput label="Location / note" size="xs" {...nodeForm.getInputProps('location')} placeholder="e.g. Firewall" />
            {(node.type === 'connector') && (
              <>
                <NumberInput label="Pin count" size="xs" min={1} max={48} {...nodeForm.getInputProps('pins')} />
                <TextInput
                  label="Pin labels"
                  size="xs"
                  placeholder="A1, A2, B1, B2 …"
                  description="Comma-separated"
                  {...nodeForm.getInputProps('pinLabels')}
                />
              </>
            )}
            <Button type="submit" size="xs" mt={4}>Apply</Button>
          </Stack>
        </form>
      )}

      {edge && (
        <form
          onSubmit={edgeForm.onSubmit((values) => {
            onUpdateEdge(edge.id, {
              ...(edge.data as object),
              color: values.color,
              gauge: values.gauge,
              label: values.label,
            });
          })}
        >
          <Stack gap="xs">
            <TextInput label="Circuit name" size="xs" placeholder="e.g. IGN_SW" {...edgeForm.getInputProps('label')} />
            <Select
              label="Wire gauge"
              size="xs"
              data={GAUGES}
              {...edgeForm.getInputProps('gauge')}
            />
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

      <Button
        color="red"
        variant="subtle"
        size="xs"
        fullWidth
        mt={12}
        onClick={onDelete}
      >
        Delete
      </Button>
    </Box>
  );
}
