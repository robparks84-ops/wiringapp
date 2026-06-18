'use client';

import {
  Table, ScrollArea, ActionIcon, Badge, Text, Stack, Card, Group,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useCANStore } from '@/lib/can-tester/store';
import { ChannelDefinition } from '@/lib/can-tester/types';
import { ChannelFormModal } from './ChannelFormModal';

export function ChannelTable() {
  const channels = useCANStore(s => s.channels);
  const addChannel = useCANStore(s => s.addChannel);
  const updateChannel = useCANStore(s => s.updateChannel);
  const removeChannel = useCANStore(s => s.removeChannel);

  const [editing, setEditing] = useState<ChannelDefinition | null>(null);
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);

  function handleSubmit(ch: ChannelDefinition) {
    if (channels.find(c => c.id === ch.id)) {
      updateChannel(ch.id, ch);
    } else {
      addChannel(ch);
    }
    setEditing(null);
  }

  if (channels.length === 0) {
    return (
      <>
        <Text c="dimmed" ta="center" py="xl">No channels defined. Load a preset or add a channel.</Text>
        <Group justify="center">
          <Button onClick={openAdd}>Add Channel</Button>
        </Group>
        <ChannelFormModal opened={addOpened} onClose={closeAdd} onSubmit={handleSubmit} />
      </>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <ScrollArea visibleFrom="xs">
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Min</Table.Th>
              <Table.Th>Max</Table.Th>
              <Table.Th>Default</Table.Th>
              <Table.Th>Waveform</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th w={80}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {channels.map(ch => (
              <Table.Tr key={ch.id}>
                <Table.Td fw={500}>{ch.name}</Table.Td>
                <Table.Td>{ch.unit || '—'}</Table.Td>
                <Table.Td>{ch.minValue}</Table.Td>
                <Table.Td>{ch.maxValue}</Table.Td>
                <Table.Td>{ch.defaultValue}</Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">{ch.waveform}</Badge>
                </Table.Td>
                <Table.Td>{(ch.waveformPeriodMs / 1000).toFixed(1)}s</Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => setEditing(ch)}
                      aria-label="Edit channel"
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeChannel(ch.id)}
                      aria-label="Remove channel"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Mobile card list */}
      <Stack gap="sm" hiddenFrom="xs">
        {channels.map(ch => (
          <Card key={ch.id} withBorder padding="sm">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text fw={600}>{ch.name} <Text span c="dimmed" size="sm">{ch.unit}</Text></Text>
                <Text size="xs" c="dimmed">
                  {ch.minValue} – {ch.maxValue} · default {ch.defaultValue}
                </Text>
                <Badge variant="light" size="xs" mt={4}>{ch.waveform}</Badge>
              </div>
              <Group gap={4}>
                <ActionIcon variant="subtle" size="sm" onClick={() => setEditing(ch)}>
                  <IconEdit size={14} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeChannel(ch.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>

      <Group justify="flex-end" mt="sm">
        <Button size="sm" onClick={openAdd}>+ Add Channel</Button>
      </Group>

      {/* Add modal */}
      <ChannelFormModal opened={addOpened} onClose={closeAdd} onSubmit={handleSubmit} />

      {/* Edit modal */}
      {editing && (
        <ChannelFormModal
          opened={!!editing}
          onClose={() => setEditing(null)}
          initial={editing}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
