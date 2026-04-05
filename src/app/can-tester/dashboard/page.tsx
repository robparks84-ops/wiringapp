'use client';

import { Stack, Title, Alert, Table, ScrollArea, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useCallback } from 'react';
import { SimControls } from '@/components/can-tester/dashboard/SimControls';
import { WidgetGrid } from '@/components/can-tester/dashboard/WidgetGrid';
import { useCANStore } from '@/lib/can-tester/store';
import { simulationEngine } from '@/lib/can-tester/simulation/engine';

export default function DashboardPage() {
  const setSimRunning = useCANStore(s => s.setSimRunning);
  const simConfig = useCANStore(s => s.simConfig);
  const channels = useCANStore(s => s.channels);
  const channelValues = useCANStore(s => s.channelValues);

  const handleStart = useCallback(() => setSimRunning(true), [setSimRunning]);
  const handleStop = useCallback(() => {
    setSimRunning(false);
    simulationEngine.stop();
  }, [setSimRunning]);

  return (
    <Stack gap="md">
      <Title order={3}>Live Dashboard</Title>

      <SimControls onStart={handleStart} onStop={handleStop} />

      <WidgetGrid />

      {/* Data table for small values / precise reading */}
      {channels.length > 0 && (
        <ScrollArea>
          <Table withTableBorder withColumnBorders striped mt="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Channel</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Min</Table.Th>
                <Table.Th>Max</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {channels.map(ch => {
                const val = channelValues[ch.id]?.value ?? ch.defaultValue;
                const decimals = ch.unit === 'λ' || Math.abs(ch.maxValue - ch.minValue) < 10 ? 3 : 1;
                return (
                  <Table.Tr key={ch.id}>
                    <Table.Td fw={500}>{ch.name}</Table.Td>
                    <Table.Td style={{ fontFamily: 'monospace' }}>{val.toFixed(decimals)}</Table.Td>
                    <Table.Td c="dimmed">{ch.unit || '—'}</Table.Td>
                    <Table.Td c="dimmed">{ch.minValue}</Table.Td>
                    <Table.Td c="dimmed">{ch.maxValue}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}
