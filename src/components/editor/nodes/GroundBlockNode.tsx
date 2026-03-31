'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text } from '@mantine/core';
import type { Cavity } from '@/lib/nodeDefaults';

export interface GroundBlockNodeData {
  label: string;
  posts: 4 | 8;
  cavities: Cavity[];
  [key: string]: unknown;
}

export function GroundBlockNode({ data, selected }: NodeProps) {
  const d = data as GroundBlockNodeData;
  const cavities = d.cavities ?? [];

  return (
    <Box
      style={{
        border: `2px solid ${selected ? '#f08c00' : '#212529'}`,
        borderRadius: 8,
        background: '#212529',
        minWidth: 130,
        boxShadow: selected ? '0 0 0 2px #f08c00' : '0 2px 6px rgba(0,0,0,0.2)',
      }}
    >
      <Box style={{ padding: '4px 10px', borderBottom: '1px solid #495057' }}>
        <Text fz={10} fw={700} c="gray.5" tt="uppercase" style={{ letterSpacing: 1 }}>
          Ground Block
        </Text>
        <Text fz={12} fw={600} c="white">{d.label || `${d.posts}-Post GND`}</Text>
      </Box>
      <Box p={4}>
        {cavities.map((cav, i) => (
          <Box
            key={cav.id}
            style={{
              position: 'relative',
              height: 22,
              display: 'flex',
              alignItems: 'center',
              borderBottom: i < cavities.length - 1 ? '1px solid #343a40' : undefined,
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${cav.id}-target`}
              style={{ left: -10, top: '50%', transform: 'translateY(-50%)', background: '#868e96', width: 8, height: 8 }}
            />
            <Text fz={11} px={6} c="gray.3" style={{ userSelect: 'none' }}>{cav.label}</Text>
            <Handle
              type="source"
              position={Position.Right}
              id={`${cav.id}-source`}
              style={{ right: -10, top: '50%', transform: 'translateY(-50%)', background: '#868e96', width: 8, height: 8 }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
