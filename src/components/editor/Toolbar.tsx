'use client';

import { Box, Button, Divider, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconCircuitGround,
  IconCpu,
  IconPlug,
  IconShare,
  IconSwitchHorizontal,
} from '@tabler/icons-react';

const COMPONENTS = [
  {
    group: 'Deutsch Connectors',
    items: [
      { type: 'connector', subtype: 'DT', label: 'DT Connector', icon: <IconPlug size={14} />, color: '#1971c2' },
      { type: 'connector', subtype: 'DTM', label: 'DTM Connector', icon: <IconPlug size={14} />, color: '#2f9e44' },
      { type: 'connector', subtype: 'DTP', label: 'DTP Connector', icon: <IconPlug size={14} />, color: '#e67700' },
      { type: 'connector', subtype: 'AT', label: 'AT Connector', icon: <IconPlug size={14} />, color: '#c92a2a' },
      { type: 'connector', subtype: 'ATM', label: 'ATM Connector', icon: <IconPlug size={14} />, color: '#862e9c' },
      { type: 'connector', subtype: 'Bulkhead', label: 'Bulkhead', icon: <IconPlug size={14} />, color: '#495057' },
    ],
  },
  {
    group: 'Devices',
    items: [
      { type: 'device', subtype: 'ECU', label: 'ECU', icon: <IconCpu size={14} />, color: '#1864ab' },
      { type: 'device', subtype: 'PDM', label: 'PDM', icon: <IconSwitchHorizontal size={14} />, color: '#5c2d91' },
      { type: 'device', subtype: 'Relay', label: 'Relay', icon: <IconSwitchHorizontal size={14} />, color: '#c92a2a' },
      { type: 'device', subtype: 'Fuse', label: 'Fuse', icon: <IconSwitchHorizontal size={14} />, color: '#e67700' },
    ],
  },
  {
    group: 'Other',
    items: [
      { type: 'splice', subtype: 'Splice', label: 'Splice', icon: <IconShare size={14} />, color: '#f59f00' },
      { type: 'ground', subtype: 'Ground', label: 'Ground Point', icon: <IconCircuitGround size={14} />, color: '#212529' },
    ],
  },
];

interface ToolbarProps {
  onAdd: (type: string, subtype: string) => void;
}

export function Toolbar({ onAdd }: ToolbarProps) {
  return (
    <Box
      style={{
        width: 180,
        borderRight: '1px solid var(--mantine-color-gray-3)',
        background: 'var(--mantine-color-gray-0)',
        overflowY: 'auto',
        flexShrink: 0,
        padding: '12px 8px',
      }}
    >
      <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={8} px={4} style={{ letterSpacing: 1 }}>
        Components
      </Text>
      <Stack gap={12}>
        {COMPONENTS.map((group) => (
          <Box key={group.group}>
            <Text fz={10} fw={600} c="dimmed" tt="uppercase" px={4} mb={4} style={{ letterSpacing: 0.5 }}>
              {group.group}
            </Text>
            <Stack gap={2}>
              {group.items.map((item) => (
                <Tooltip key={item.subtype} label={`Add ${item.label}`} position="right" withArrow>
                  <Button
                    variant="subtle"
                    size="xs"
                    justify="left"
                    leftSection={
                      <Box
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                    }
                    fullWidth
                    onClick={() => onAdd(item.type, item.subtype)}
                    styles={{ inner: { fontSize: 12 } }}
                  >
                    {item.label}
                  </Button>
                </Tooltip>
              ))}
            </Stack>
            <Divider mt={8} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
