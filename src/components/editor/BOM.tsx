'use client';

import { Box, ScrollArea, Table, Text, Divider, Badge } from '@mantine/core';
import type { Node, Edge } from '@xyflow/react';

// Deutsch connector part numbers (plug + socket pairs)
const DEUTSCH_PARTS: Record<string, { plug: string; socket: string; terminal: string }> = {
  'DT-2': { plug: 'DT04-2P', socket: 'DT06-2S', terminal: '0462-201-16141' },
  'DT-4': { plug: 'DT04-4P', socket: 'DT06-4S', terminal: '0462-201-16141' },
  'DT-6': { plug: 'DT04-6P', socket: 'DT06-6S', terminal: '0462-201-16141' },
  'DT-8': { plug: 'DT04-8P', socket: 'DT06-8S', terminal: '0462-201-16141' },
  'DT-12': { plug: 'DT04-12P', socket: 'DT06-12S', terminal: '0462-201-16141' },
  'DTM-2': { plug: 'DTM04-2P', socket: 'DTM06-2S', terminal: '0462-209-16141' },
  'DTM-3': { plug: 'DTM04-3P', socket: 'DTM06-3S', terminal: '0462-209-16141' },
  'DTM-4': { plug: 'DTM04-4P', socket: 'DTM06-4S', terminal: '0462-209-16141' },
  'DTM-6': { plug: 'DTM04-6P', socket: 'DTM06-6S', terminal: '0462-209-16141' },
  'DTP-2': { plug: 'DTP04-2P', socket: 'DTP06-2S', terminal: '0460-202-12141' },
  'DTP-4': { plug: 'DTP04-4P', socket: 'DTP06-4S', terminal: '0460-202-12141' },
  'Bulkhead': { plug: 'DTB04-6P', socket: 'DTB06-6S', terminal: '0462-201-16141' },
};

interface BOMProps {
  nodes: Node[];
  edges: Edge[];
}

export function BOM({ nodes, edges }: BOMProps) {
  // Count connectors
  const connectors = nodes
    .filter((n) => n.type === 'connector')
    .map((n) => {
      const subtype = n.data?.subtype as string;
      const pins = (n.data?.pins as number) ?? 2;
      const key = `${subtype}-${pins}`;
      const parts = DEUTSCH_PARTS[key] ?? DEUTSCH_PARTS[subtype] ?? null;
      return { label: n.data?.label as string, subtype, pins, parts };
    });

  // Count devices
  const devices = nodes
    .filter((n) => n.type === 'device')
    .map((n) => ({ label: n.data?.label as string, subtype: n.data?.subtype as string }));

  const grounds = nodes.filter((n) => n.type === 'ground');
  const splices = nodes.filter((n) => n.type === 'splice');

  // Wire summary by gauge
  const wireByGauge: Record<string, number> = {};
  for (const e of edges) {
    const gauge = (e.data?.gauge as string) || 'Unknown';
    wireByGauge[gauge] = (wireByGauge[gauge] ?? 0) + 1;
  }

  return (
    <ScrollArea style={{ height: '100%' }} p="sm">
      <Box p="sm">

        {/* Connectors */}
        <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 1 }}>
          Connectors
        </Text>
        <Table fz="xs" striped mb="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Label</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Pins</Table.Th>
              <Table.Th>Plug P/N</Table.Th>
              <Table.Th>Socket P/N</Table.Th>
              <Table.Th>Terminal P/N</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {connectors.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" fz="xs">None</Text></Table.Td></Table.Tr>
            )}
            {connectors.map((c, i) => (
              <Table.Tr key={i}>
                <Table.Td fw={600}>{c.label}</Table.Td>
                <Table.Td><Badge size="xs" variant="light">{c.subtype}</Badge></Table.Td>
                <Table.Td>{c.pins}</Table.Td>
                <Table.Td style={{ fontFamily: 'monospace' }}>{c.parts?.plug ?? '—'}</Table.Td>
                <Table.Td style={{ fontFamily: 'monospace' }}>{c.parts?.socket ?? '—'}</Table.Td>
                <Table.Td style={{ fontFamily: 'monospace', fontSize: 10 }}>{c.parts?.terminal ?? '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Divider mb="md" />

        {/* Devices */}
        <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 1 }}>
          Devices
        </Text>
        <Table fz="xs" striped mb="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Label</Table.Th>
              <Table.Th>Type</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {devices.length === 0 && (
              <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" fz="xs">None</Text></Table.Td></Table.Tr>
            )}
            {devices.map((d, i) => (
              <Table.Tr key={i}>
                <Table.Td fw={600}>{d.label}</Table.Td>
                <Table.Td><Badge size="xs" variant="light">{d.subtype}</Badge></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Divider mb="md" />

        {/* Grounds & Splices */}
        <Box style={{ display: 'flex', gap: 32 }} mb="md">
          <Box>
            <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 1 }}>Grounds</Text>
            <Text fz="sm" fw={600}>{grounds.length}</Text>
          </Box>
          <Box>
            <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 1 }}>Splices</Text>
            <Text fz="sm" fw={600}>{splices.length}</Text>
          </Box>
          <Box>
            <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 1 }}>Total Wires</Text>
            <Text fz="sm" fw={600}>{edges.length}</Text>
          </Box>
        </Box>

        <Divider mb="md" />

        {/* Wire by gauge */}
        <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 1 }}>
          Wire Count by Gauge
        </Text>
        <Table fz="xs" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Gauge</Table.Th>
              <Table.Th>Circuits</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.keys(wireByGauge).length === 0 && (
              <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" fz="xs">None</Text></Table.Td></Table.Tr>
            )}
            {Object.entries(wireByGauge)
              .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
              .map(([gauge, count]) => (
                <Table.Tr key={gauge}>
                  <Table.Td fw={600}>{gauge}</Table.Td>
                  <Table.Td>{count}</Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>

      </Box>
    </ScrollArea>
  );
}
