'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text } from '@mantine/core';

export interface GroundNodeData {
  label: string;
  location: string;
  [key: string]: unknown;
}

export function GroundNode({ data, selected }: NodeProps) {
  const d = data as GroundNodeData;
  return (
    <Box
      style={{
        border: `2px solid ${selected ? '#f08c00' : '#212529'}`,
        borderRadius: 8,
        background: '#212529',
        minWidth: 90,
        textAlign: 'center',
        padding: '6px 12px',
        boxShadow: selected ? '0 0 0 2px #f08c00' : '0 2px 6px rgba(0,0,0,0.2)',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#868e96' }} />
      <Text fz={18} fw={900} c="white" style={{ lineHeight: 1 }}>⏚</Text>
      <Text fz={11} fw={600} c="white">{d.label || 'GND'}</Text>
      {d.location && (
        <Text fz={10} c="gray.4">{d.location}</Text>
      )}
    </Box>
  );
}
