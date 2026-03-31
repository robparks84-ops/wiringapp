'use client';

import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

export interface WireEdgeData {
  color: string;
  gauge: string;
  label: string;
  [key: string]: unknown;
}

export function WireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const d = data as WireEdgeData | undefined;
  const wireColor = d?.color || '#212529';
  const gauge = d?.gauge || '';
  const label = d?.label || '';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* Shadow/outline for contrast on light backgrounds */}
      <BaseEdge
        id={`${id}-shadow`}
        path={edgePath}
        style={{ stroke: 'rgba(0,0,0,0.15)', strokeWidth: 5, fill: 'none' }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: wireColor,
          strokeWidth: 3,
          fill: 'none',
          filter: selected ? 'drop-shadow(0 0 4px #f08c00)' : undefined,
        }}
      />
      {(label || gauge) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'rgba(255,255,255,0.92)',
              border: `1px solid ${wireColor}`,
              borderRadius: 4,
              padding: '1px 6px',
              fontSize: 10,
              fontWeight: 600,
              color: '#212529',
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
            }}
          >
            {[label, gauge].filter(Boolean).join(' · ')}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
