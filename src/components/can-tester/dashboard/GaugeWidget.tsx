'use client';

import { Card, Text, RingProgress, Center, Stack } from '@mantine/core';
import { ChannelDefinition } from '@/lib/can-tester/types';

interface Props {
  channel: ChannelDefinition;
  value: number;
}

// Nice color based on value percentage
function progressColor(pct: number): string {
  if (pct > 90) return 'red';
  if (pct > 70) return 'orange';
  if (pct > 50) return 'yellow';
  return 'blue';
}

export function GaugeWidget({ channel, value }: Props) {
  const range = channel.maxValue - channel.minValue;
  const pct = range === 0 ? 0 : Math.max(0, Math.min(100, ((value - channel.minValue) / range) * 100));
  const color = progressColor(pct);

  const range2 = channel.maxValue - channel.minValue;
  const decimals = channel.unit === 'λ' || range2 < 10 ? 2 : 1;
  const display = value.toFixed(decimals);

  return (
    <Card withBorder padding="xs" style={{ textAlign: 'center' }}>
      <Text size="xs" fw={600} c="dimmed" mb={4} truncate>{channel.name}</Text>
      <Center>
        <RingProgress
          size={90}
          thickness={8}
          roundCaps
          sections={[{ value: pct, color }]}
          label={
            <Stack gap={0} align="center">
              <Text size="xs" fw={700} lh={1} style={{ fontFamily: 'monospace' }}>
                {display}
              </Text>
              {channel.unit && (
                <Text size="9px" c="dimmed">{channel.unit}</Text>
              )}
            </Stack>
          }
        />
      </Center>
    </Card>
  );
}
