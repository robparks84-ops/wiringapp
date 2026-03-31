'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text, Stack } from '@mantine/core';

export interface ConnectorNodeData {
  label: string;
  subtype: 'DT' | 'DTM' | 'DTP' | 'AT' | 'ATM' | 'Bulkhead';
  pins: number;
  pinLabels: string[];
  [key: string]: unknown;
}

const SUBTYPE_COLOR: Record<ConnectorNodeData['subtype'], string> = {
  DT: '#1971c2',
  DTM: '#2f9e44',
  DTP: '#e67700',
  AT: '#c92a2a',
  ATM: '#862e9c',
  Bulkhead: '#495057',
};

export function ConnectorNode({ data, selected }: NodeProps) {
  const d = data as ConnectorNodeData;
  const color = SUBTYPE_COLOR[d.subtype] ?? '#495057';
  const pinLabels: string[] = d.pinLabels ?? Array.from({ length: d.pins ?? 2 }, (_, i) => String(i + 1));

  return (
    <Box
      style={{
        border: `2px solid ${selected ? '#f08c00' : color}`,
        borderRadius: 8,
        background: '#fff',
        minWidth: 120,
        boxShadow: selected ? `0 0 0 2px #f08c00` : '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <Box
        style={{
          background: color,
          borderRadius: '6px 6px 0 0',
          padding: '4px 10px',
        }}
      >
        <Text fz={10} fw={700} c="white" tt="uppercase" style={{ letterSpacing: 1 }}>
          {d.subtype}
        </Text>
        <Text fz={12} fw={600} c="white" lineClamp={1}>
          {d.label}
        </Text>
      </Box>

      {/* Pins */}
      <Stack gap={0} p={6}>
        {pinLabels.map((pin, i) => (
          <Box
            key={i}
            style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}
          >
            <Handle
              type="source"
              position={Position.Right}
              id={`pin-${i}`}
              style={{ right: -10, top: '50%', transform: 'translateY(-50%)', background: color }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id={`pin-${i}`}
              style={{ left: -10, top: '50%', transform: 'translateY(-50%)', background: color }}
            />
            <Text fz={11} px={4} style={{ zIndex: 1 }}>
              {pin || `Pin ${i + 1}`}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
