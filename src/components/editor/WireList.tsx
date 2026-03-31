'use client';

import { Box, ScrollArea, Table, Text, Badge, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface WireListProps {
  nodes: Node[];
  edges: Edge[];
}

function getNodeLabel(nodes: Node[], id: string): string {
  return (nodes.find((n) => n.id === id)?.data?.label as string) ?? id;
}

function getPinLabel(nodes: Node[], nodeId: string, handle: string | null | undefined): string {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !handle) return handle ?? '—';
  const pinLabels = node.data?.pinLabels as string[] | undefined;
  const channels = node.data?.channels as string[] | undefined;
  const match = handle.match(/\d+$/);
  const idx = match ? parseInt(match[0]) : -1;
  if (pinLabels && idx >= 0 && pinLabels[idx]) return pinLabels[idx];
  if (channels && idx >= 0 && channels[idx]) return channels[idx];
  return handle;
}

export function WireList({ nodes, edges }: WireListProps) {
  const [search, setSearch] = useState('');

  const rows = edges.map((e) => ({
    id: e.id,
    circuit: (e.data?.label as string) || '—',
    color: (e.data?.color as string) || '#212529',
    gauge: (e.data?.gauge as string) || '—',
    from: getNodeLabel(nodes, e.source),
    fromPin: getPinLabel(nodes, e.source, e.sourceHandle),
    to: getNodeLabel(nodes, e.target),
    toPin: getPinLabel(nodes, e.target, e.targetHandle),
  }));

  const filtered = rows.filter((r) =>
    [r.circuit, r.from, r.to, r.gauge].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <TextInput
          placeholder="Search circuits, connectors…"
          leftSection={<IconSearch size={14} />}
          size="xs"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Box>
      <ScrollArea style={{ flex: 1 }}>
        <Table striped highlightOnHover fz="xs" style={{ minWidth: 600 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Circuit</Table.Th>
              <Table.Th>Color</Table.Th>
              <Table.Th>Gauge</Table.Th>
              <Table.Th>From</Table.Th>
              <Table.Th>Pin</Table.Th>
              <Table.Th>To</Table.Th>
              <Table.Th>Pin</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" fz="xs" py="md">
                    No wires yet. Connect pins on the canvas to see them here.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {filtered.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td fw={600}>{row.circuit}</Table.Td>
                <Table.Td>
                  <Badge
                    size="xs"
                    style={{
                      background: row.color,
                      color: isLight(row.color) ? '#212529' : '#fff',
                      border: row.color === '#f8f9fa' ? '1px solid #ced4da' : undefined,
                    }}
                  >
                    {row.color}
                  </Badge>
                </Table.Td>
                <Table.Td>{row.gauge}</Table.Td>
                <Table.Td>{row.from}</Table.Td>
                <Table.Td c="dimmed">{row.fromPin}</Table.Td>
                <Table.Td>{row.to}</Table.Td>
                <Table.Td c="dimmed">{row.toPin}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Box px="sm" py={4} style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Text fz={10} c="dimmed">{filtered.length} wire{filtered.length !== 1 ? 's' : ''}</Text>
      </Box>
    </Box>
  );
}

function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}
