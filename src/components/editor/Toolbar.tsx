'use client';

import { Box, Button, Divider, Stack, Text, Tooltip } from '@mantine/core';

interface ToolbarItem {
  type: string;
  subtype: string;
  label: string;
  color: string;
}

const GROUPS: { group: string; items: ToolbarItem[] }[] = [
  {
    group: 'Deutsch Connectors',
    items: [
      { type: 'cavity', subtype: 'DT',       label: 'DT Connector',   color: '#1971c2' },
      { type: 'cavity', subtype: 'DTM',      label: 'DTM Connector',  color: '#2f9e44' },
      { type: 'cavity', subtype: 'DTP',      label: 'DTP Connector',  color: '#e67700' },
      { type: 'cavity', subtype: 'AT',       label: 'AT Connector',   color: '#c92a2a' },
      { type: 'cavity', subtype: 'ATM',      label: 'ATM Connector',  color: '#862e9c' },
      { type: 'cavity', subtype: 'Bulkhead', label: 'Bulkhead',       color: '#495057' },
    ],
  },
  {
    group: 'ECU',
    items: [
      { type: 'cavity', subtype: 'ECU-C1',   label: 'MS3Pro Evo C1 (34-pin)', color: '#1864ab' },
      { type: 'cavity', subtype: 'ECU-C2',   label: 'MS3Pro Evo C2 (40-pin)', color: '#1864ab' },
    ],
  },
  {
    group: 'PDM',
    items: [
      { type: 'cavity', subtype: 'AIM PDM32', label: 'AIM PDM32',    color: '#5c2d91' },
    ],
  },
  {
    group: 'Sensors',
    items: [
      { type: 'cavity', subtype: 'TPS',             label: 'TPS',              color: '#0c8599' },
      { type: 'cavity', subtype: 'MAP',             label: 'MAP',              color: '#0c8599' },
      { type: 'cavity', subtype: 'MAF',             label: 'MAF',              color: '#0c8599' },
      { type: 'cavity', subtype: 'CLT',             label: 'CLT (Coolant Temp)',color: '#0c8599' },
      { type: 'cavity', subtype: 'IAT',             label: 'IAT (Intake Temp)', color: '#0c8599' },
      { type: 'cavity', subtype: 'Oil Pressure',    label: 'Oil Pressure',     color: '#0c8599' },
      { type: 'cavity', subtype: 'Fuel Pressure',   label: 'Fuel Pressure',    color: '#0c8599' },
      { type: 'cavity', subtype: 'Lambda / WBO2',   label: 'Lambda / WBO2',    color: '#0c8599' },
      { type: 'cavity', subtype: 'Wheel Speed',     label: 'Wheel Speed',      color: '#0c8599' },
      { type: 'cavity', subtype: 'Cam Position',    label: 'Cam Position',     color: '#0c8599' },
      { type: 'cavity', subtype: 'Crank Position',  label: 'Crank Position',   color: '#0c8599' },
      { type: 'cavity', subtype: 'Oil Temp',        label: 'Oil Temp',         color: '#0c8599' },
      { type: 'cavity', subtype: 'Diff Temp',       label: 'Diff Temp',        color: '#0c8599' },
      { type: 'cavity', subtype: 'Trans Temp',      label: 'Trans Temp',       color: '#0c8599' },
      { type: 'cavity', subtype: 'Custom',          label: 'Custom Sensor',    color: '#0c8599' },
    ],
  },
  {
    group: 'Grounds',
    items: [
      { type: 'ground',      subtype: 'Ground',      label: 'Chassis Ground', color: '#212529' },
      { type: 'groundBlock', subtype: 'GroundBlock', label: 'Ground Block',   color: '#212529' },
    ],
  },
  {
    group: 'Other',
    items: [
      { type: 'splice', subtype: 'Splice', label: 'Splice',         color: '#f59f00' },
      { type: 'cavity', subtype: 'Blank',  label: 'Blank Device',   color: '#495057' },
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
        width: 190,
        borderRight: '1px solid var(--mantine-color-gray-3)',
        background: 'var(--mantine-color-gray-0)',
        overflowY: 'auto',
        flexShrink: 0,
        padding: '10px 6px',
      }}
    >
      <Text fz={11} fw={700} tt="uppercase" c="dimmed" mb={8} px={4} style={{ letterSpacing: 1 }}>
        Components
      </Text>
      <Stack gap={10}>
        {GROUPS.map((group) => (
          <Box key={group.group}>
            <Text fz={10} fw={600} c="dimmed" tt="uppercase" px={4} mb={3} style={{ letterSpacing: 0.5 }}>
              {group.group}
            </Text>
            <Stack gap={1}>
              {group.items.map((item) => (
                <Tooltip key={`${item.type}-${item.subtype}`} label={`Add ${item.label}`} position="right" withArrow>
                  <Button
                    variant="subtle"
                    size="xs"
                    justify="left"
                    leftSection={
                      <Box style={{ width: 9, height: 9, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    }
                    fullWidth
                    onClick={() => onAdd(item.type, item.subtype)}
                    styles={{ label: { fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
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
