'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text, Stack } from '@mantine/core';

export interface DeviceNodeData {
  label: string;
  subtype: 'ECU' | 'PDM' | 'Relay' | 'Fuse' | 'Switch';
  channels: string[];
  [key: string]: unknown;
}

const SUBTYPE_COLOR: Record<DeviceNodeData['subtype'], string> = {
  ECU: '#1864ab',
  PDM: '#5c2d91',
  Relay: '#c92a2a',
  Fuse: '#e67700',
  Switch: '#2b8a3e',
};

export function DeviceNode({ data, selected }: NodeProps) {
  const d = data as DeviceNodeData;
  const color = SUBTYPE_COLOR[d.subtype] ?? '#495057';
  const channels: string[] = d.channels ?? [];

  return (
    <Box
      style={{
        border: `2px solid ${selected ? '#f08c00' : color}`,
        borderRadius: 8,
        background: '#fff',
        minWidth: 150,
        boxShadow: selected ? '0 0 0 2px #f08c00' : '0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      <Box
        style={{
          background: color,
          borderRadius: '6px 6px 0 0',
          padding: '6px 12px',
        }}
      >
        <Text fz={10} fw={700} c="white" tt="uppercase" style={{ letterSpacing: 1 }}>
          {d.subtype}
        </Text>
        <Text fz={13} fw={700} c="white">
          {d.label}
        </Text>
      </Box>

      <Stack gap={0} p={6}>
        {channels.length === 0 && (
          <Box style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
            <Handle type="source" position={Position.Right} id="out" style={{ background: color }} />
            <Handle type="target" position={Position.Left} id="in" style={{ background: color }} />
            <Text fz={11} px={4} c="dimmed">No channels</Text>
          </Box>
        )}
        {channels.map((ch, i) => (
          <Box
            key={i}
            style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}
          >
            <Handle
              type="source"
              position={Position.Right}
              id={`ch-${i}`}
              style={{ right: -10, top: '50%', transform: 'translateY(-50%)', background: color }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id={`ch-${i}`}
              style={{ left: -10, top: '50%', transform: 'translateY(-50%)', background: color }}
            />
            <Text fz={11} px={4}>{ch}</Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
