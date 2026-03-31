'use client';

import { Box, Button, Divider, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface ToolbarItem {
  type: string;
  subtype: string;
  label: string;
  color: string;
}

const GROUPS: { group: string; items: ToolbarItem[] }[] = [
  {
    group: 'ECU',
    items: [
      { type: 'cavity', subtype: 'ECU-White',    label: 'MS3Pro Evo White (35-pin)', color: '#1864ab' },
      { type: 'cavity', subtype: 'ECU-Gray',     label: 'MS3Pro Evo Gray (35-pin)',  color: '#495057' },
      { type: 'cavity', subtype: 'Quad Spark 1', label: 'Quad Spark 1',              color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Quad Spark 2', label: 'Quad Spark 2',              color: '#5f3dc4' },
    ],
  },
  {
    group: 'PDM',
    items: [
      { type: 'cavity', subtype: 'PDM32-Black', label: 'AIM PDM32 Black (35-pin)', color: '#212529' },
      { type: 'cavity', subtype: 'PDM32-Gray',  label: 'AIM PDM32 Gray (35-pin)',  color: '#868e96' },
    ],
  },
  {
    group: 'Sensors',
    items: [
      { type: 'cavity', subtype: 'Cam Position',         label: 'Cam Position',          color: '#0c8599' },
      { type: 'cavity', subtype: 'Crank Position',       label: 'Crank Position',         color: '#0c8599' },
      { type: 'cavity', subtype: 'TPS',                  label: 'TPS',                    color: '#0c8599' },
      { type: 'cavity', subtype: 'MAP',                  label: 'MAP',                    color: '#0c8599' },
      { type: 'cavity', subtype: 'MAF',                  label: 'MAF',                    color: '#0c8599' },
      { type: 'cavity', subtype: 'CLT',                  label: 'CLT',                    color: '#0c8599' },
      { type: 'cavity', subtype: 'IAT',                  label: 'IAT',                    color: '#0c8599' },
      { type: 'cavity', subtype: 'Oil Pressure',         label: 'Oil Pressure',           color: '#0c8599' },
      { type: 'cavity', subtype: 'Fuel Pressure',        label: 'Fuel Pressure',          color: '#0c8599' },
      { type: 'cavity', subtype: 'O2 Sensor',            label: 'O2 Sensor (LC-2)',       color: '#0c8599' },
      { type: 'cavity', subtype: 'Oil Temp',             label: 'Oil Temp',               color: '#0c8599' },
      { type: 'cavity', subtype: 'Diff Temp',            label: 'Diff Temp',              color: '#0c8599' },
      { type: 'cavity', subtype: 'Trans Temp',           label: 'Trans Temp',             color: '#0c8599' },
      { type: 'cavity', subtype: 'Front Brake Pressure', label: 'Front Brake Pressure',   color: '#0c8599' },
      { type: 'cavity', subtype: 'Rear Brake Pressure',  label: 'Rear Brake Pressure',    color: '#0c8599' },
      { type: 'cavity', subtype: 'Knock Sensor 1',       label: 'Knock Sensor 1',         color: '#0c8599' },
      { type: 'cavity', subtype: 'Knock Sensor 2',       label: 'Knock Sensor 2',         color: '#0c8599' },
      { type: 'cavity', subtype: 'Custom',               label: 'Custom Sensor',          color: '#0c8599' },
    ],
  },
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
    group: 'Devices',
    items: [
      { type: 'cavity', subtype: 'Battery',          label: 'Battery',          color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Starter',          label: 'Starter',          color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Alternator',       label: 'Alternator',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Battery Isolator', label: 'Battery Isolator', color: '#5f3dc4' },
      { type: 'cavity', subtype: 'CAN Keypad',       label: 'CAN Keypad',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 1',      label: 'Coil Pack 1',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 2',      label: 'Coil Pack 2',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 3',      label: 'Coil Pack 3',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 4',      label: 'Coil Pack 4',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 5',      label: 'Coil Pack 5',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 6',      label: 'Coil Pack 6',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 7',      label: 'Coil Pack 7',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Coil Pack 8',      label: 'Coil Pack 8',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Fuel Pump',        label: 'Fuel Pump',        color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Defroster',        label: 'Defroster',        color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Vanos Solenoid',   label: 'Vanos Solenoid',   color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Radiator Fan',     label: 'Radiator Fan',     color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Driver Fan',       label: 'Driver Fan',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Flagtronics',      label: 'Flagtronics',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Cool Shirt',       label: 'Cool Shirt',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'TPMS Controller',  label: 'TPMS Controller',  color: '#5f3dc4' },
      { type: 'cavity', subtype: 'RaceCapture',      label: 'RaceCapture',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'WiFi Unit',        label: 'WiFi Unit',        color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Thin Client',      label: 'Thin Client',      color: '#5f3dc4' },
      { type: 'cavity', subtype: 'GoPro Camera',     label: 'GoPro Camera',     color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 1',       label: 'Injector 1',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 2',       label: 'Injector 2',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 3',       label: 'Injector 3',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 4',       label: 'Injector 4',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 5',       label: 'Injector 5',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 6',       label: 'Injector 6',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 7',       label: 'Injector 7',       color: '#5f3dc4' },
      { type: 'cavity', subtype: 'Injector 8',       label: 'Injector 8',       color: '#5f3dc4' },
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
      { type: 'splice', subtype: 'Splice', label: 'Splice',       color: '#f59f00' },
      { type: 'cavity', subtype: 'Blank',  label: 'Blank Device', color: '#495057' },
    ],
  },
];

const STORAGE_KEY = 'toolbar-collapsed';

function loadCollapsed(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

interface ToolbarProps {
  onAdd: (type: string, subtype: string) => void;
}

export function Toolbar({ onAdd }: ToolbarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Load from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setCollapsed(loadCollapsed());
  }, []);

  function toggleGroup(group: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

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
      <Stack gap={6}>
        {GROUPS.map((group) => {
          const isCollapsed = !!collapsed[group.group];
          return (
            <Box key={group.group}>
              <UnstyledButton
                onClick={() => toggleGroup(group.group)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                <Text fz={10} fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                  {group.group}
                </Text>
                {isCollapsed
                  ? <IconChevronRight size={11} color="var(--mantine-color-dimmed)" />
                  : <IconChevronDown  size={11} color="var(--mantine-color-dimmed)" />
                }
              </UnstyledButton>

              {!isCollapsed && (
                <Stack gap={1} mt={2}>
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
              )}
              <Divider mt={6} />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
