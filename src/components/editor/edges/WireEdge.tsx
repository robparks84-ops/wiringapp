'use client';

import {
  BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer, useReactFlow,
} from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';

export interface WireEdgeData {
  color: string;
  stripeColor: string;
  gauge: string;
  label: string;
  waypoints?: { x: number; y: number }[];
  [key: string]: unknown;
}

interface Point { x: number; y: number; }

function buildPolyPath(points: Point[]): string {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/** A draggable circular handle rendered in flow-coordinate space via EdgeLabelRenderer */
function WaypointHandle({
  x, y, onMove,
}: {
  x: number;
  y: number;
  onMove: (p: Point) => void;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragging.current = true;

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return;
      const fp = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      onMove(fp);
    }
    function onMouseUp() {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onMove, screenToFlowPosition]);

  return (
    <div
      className="nodrag nopan"
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        width: 12,
        height: 12,
        background: 'white',
        border: '2px solid #1971c2',
        borderRadius: '50%',
        cursor: 'crosshair',
        pointerEvents: 'all',
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
    />
  );
}

/** A faint "+" handle shown at edge midpoint to add the first waypoint */
function AddWaypointHandle({
  x, y, onAdd,
}: {
  x: number;
  y: number;
  onAdd: (p: Point) => void;
}) {
  const { screenToFlowPosition } = useReactFlow();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const startFP = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    onAdd(startFP);

    function onMouseMove(ev: MouseEvent) {
      const fp = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      onAdd(fp);
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onAdd, screenToFlowPosition]);

  return (
    <div
      className="nodrag nopan"
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        width: 14,
        height: 14,
        background: 'rgba(255,255,255,0.8)',
        border: '1.5px dashed #adb5bd',
        borderRadius: '50%',
        cursor: 'crosshair',
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: '#adb5bd',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      title="Drag to add corner"
    >
      +
    </div>
  );
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
  const { setEdges } = useReactFlow();
  const d = data as WireEdgeData | undefined;
  const wireColor = d?.color || '#212529';
  const stripeColor = d?.stripeColor || '';
  const gauge = d?.gauge || '';
  const label = d?.label || '';
  const waypoints: Point[] = (d?.waypoints as Point[]) ?? [];

  // Build the edge path
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (waypoints.length > 0) {
    const allPoints: Point[] = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    edgePath = buildPolyPath(allPoints);
    const mid = allPoints[Math.floor(allPoints.length / 2)];
    labelX = mid.x;
    labelY = mid.y;
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 0,
    });
  }

  // Midpoint for the "add corner" handle
  const midX = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)].x
    : (sourceX + targetX) / 2;
  const midY = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)].y
    : (sourceY + targetY) / 2;

  function updateWaypoint(index: number, p: Point) {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== id) return e;
        const wps: Point[] = [...((e.data?.waypoints as Point[]) ?? [])];
        wps[index] = p;
        return { ...e, data: { ...e.data, waypoints: wps } };
      })
    );
  }

  function addWaypoint(p: Point) {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== id) return e;
        const wps: Point[] = (e.data?.waypoints as Point[]) ?? [];
        // Replace last temp waypoint if it was just added (within this drag)
        return { ...e, data: { ...e.data, waypoints: [p] } };
      })
    );
  }

  return (
    <>
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
      {stripeColor && (
        <BaseEdge
          id={`${id}-stripe`}
          path={edgePath}
          style={{
            stroke: stripeColor,
            strokeWidth: 2,
            strokeDasharray: '6 6',
            fill: 'none',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Edge label */}
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
            {stripeColor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: stripeColor,
                  marginRight: 4,
                  verticalAlign: 'middle',
                }}
              />
            )}
            {[label, gauge].filter(Boolean).join(' · ')}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Waypoint handles (only when selected) */}
      {selected && (
        <EdgeLabelRenderer>
          {/* Existing waypoints — each draggable */}
          {waypoints.map((wp, i) => (
            <WaypointHandle
              key={i}
              x={wp.x}
              y={wp.y}
              onMove={(p) => updateWaypoint(i, p)}
            />
          ))}
          {/* Mid-edge add-corner handle */}
          <AddWaypointHandle
            x={midX}
            y={midY}
            onAdd={addWaypoint}
          />
        </EdgeLabelRenderer>
      )}
    </>
  );
}
