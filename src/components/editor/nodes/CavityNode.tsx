'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text } from '@mantine/core';
import type { CavityNodeData } from '@/lib/nodeDefaults';

export function CavityNode({ data, selected }: NodeProps) {
  const d = data as CavityNodeData;
  const color = d.headerColor ?? '#495057';
  const cavities = d.cavities ?? [];

  return (
    <Box
      style={{
        border: `2px solid ${selected ? '#f08c00' : color}`,
        borderRadius: 8,
        background: '#fff',
        minWidth: 170,
        boxShadow: selected ? '0 0 0 2px #f08c00' : '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <Box style={{ background: color, borderRadius: '6px 6px 0 0', padding: '4px 10px' }}>
        <Text fz={10} fw={700} c="white" tt="uppercase" style={{ letterSpacing: 1 }}>
          {d.subtype}
        </Text>
        <Text fz={12} fw={600} c="white" lineClamp={1}>{d.label}</Text>
      </Box>

      {/* Cavities */}
      <Box p={4}>
        {cavities.length === 0 && (
          <Text fz={10} c="dimmed" px={4} py={2}>No cavities</Text>
        )}
        {cavities.map((cav, i) => (
          <Box
            key={cav.id}
            style={{
              position: 'relative',
              height: 22,
              display: 'flex',
              alignItems: 'center',
              borderBottom: i < cavities.length - 1 ? '1px solid #f1f3f5' : undefined,
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${cav.id}-target`}
              style={{ left: -10, top: '50%', transform: 'translateY(-50%)', background: color, width: 8, height: 8 }}
            />
            <Text fz={11} px={6} style={{ userSelect: 'none', whiteSpace: 'nowrap' }}>
              {cav.label}
            </Text>
            <Handle
              type="source"
              position={Position.Right}
              id={`${cav.id}-source`}
              style={{ right: -10, top: '50%', transform: 'translateY(-50%)', background: color, width: 8, height: 8 }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
