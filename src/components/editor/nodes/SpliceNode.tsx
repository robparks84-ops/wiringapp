'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text } from '@mantine/core';

export interface SpliceNodeData {
  label: string;
  [key: string]: unknown;
}

export function SpliceNode({ data, selected }: NodeProps) {
  const d = data as SpliceNodeData;
  return (
    <Box
      style={{
        border: `2px solid ${selected ? '#f08c00' : '#f59f00'}`,
        borderRadius: '50%',
        background: '#fff9db',
        width: 56,
        height: 56,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 0 0 2px #f08c00' : '0 2px 6px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#f59f00' }} />
      <Handle type="source" position={Position.Right} id="out1" style={{ top: '33%', background: '#f59f00' }} />
      <Handle type="source" position={Position.Right} id="out2" style={{ top: '66%', background: '#f59f00' }} />
      <Handle type="source" position={Position.Bottom} id="out3" style={{ background: '#f59f00' }} />
      <Text fz={10} fw={700} c="yellow.8" ta="center" style={{ lineHeight: 1.2 }}>
        {d.label || 'SP'}
      </Text>
    </Box>
  );
}
