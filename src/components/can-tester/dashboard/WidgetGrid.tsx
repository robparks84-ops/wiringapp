'use client';

import { SimpleGrid, Text, Paper } from '@mantine/core';
import { useEffect } from 'react';
import { useCANStore } from '@/lib/can-tester/store';
import { simulationEngine } from '@/lib/can-tester/simulation/engine';
import { GaugeWidget } from './GaugeWidget';

export function WidgetGrid() {
  const channels = useCANStore(s => s.channels);
  const simConfig = useCANStore(s => s.simConfig);
  const channelValues = useCANStore(s => s.channelValues);
  const updateChannelValues = useCANStore(s => s.updateChannelValues);

  // Manage simulation engine lifecycle
  useEffect(() => {
    if (simConfig.running) {
      simulationEngine.start(simConfig, channels, (values) => {
        updateChannelValues(values);
      });
    } else {
      simulationEngine.stop();
    }
    return () => simulationEngine.stop();
  }, [simConfig.running, simConfig.updateRateHz]);

  if (channels.length === 0) {
    return (
      <Paper withBorder p="xl" ta="center">
        <Text c="dimmed">No channels defined. Go to Channel Map and load a preset.</Text>
      </Paper>
    );
  }

  return (
    <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, lg: 5 }} spacing="sm">
      {channels.map(ch => {
        const val = channelValues[ch.id]?.value ?? ch.defaultValue;
        return <GaugeWidget key={ch.id} channel={ch} value={val} />;
      })}
    </SimpleGrid>
  );
}
