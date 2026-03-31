'use client';

import {
  BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer, useReactFlow,
} from '@xyflow/react';
import { useCallback, useRef } from 'react';

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

/** Find which segment index a click point belongs to (returns index into wps for splice) */
function findWpsInsertIndex(allPoints: Point[], p: Point): number {
  let bestSegment = 0;
  let bestDist = Infinity;
  for (let i = 0; i < allPoints.length - 1; i++) {
    const a = allPoints[i];
    const b = allPoints[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const d = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
    if (d < bestDist) {
      bestDist = d;
      bestSegment = i; // new point goes between allPoints[i] and allPoints[i+1]
    }
  }
  // In wps array (no source/target): position = bestSegment
  return bestSegment;
}

/** Draggable waypoint handle — shows an X marker */
function WaypointHandle({ x, y, onMove }: { x: number; y: number; onMove: (p: Point) => void }) {
  const { screenToFlowPosition } = useReactFlow();
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragging.current = true;
    function onMM(ev: MouseEvent) {
      if (!dragging.current) return;
      onMove(screenToFlowPosition({ x: ev.clientX, y: ev.clientY }));
    }
    function onMU() {
      dragging.current = false;
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
    }
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
  }, [onMove, screenToFlowPosition]);

  return (
    <div
      className="nodrag nopan"
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        width: 14,
        height: 14,
        background: 'white',
        border: '2px solid #1971c2',
        borderRadius: 2,
        cursor: 'crosshair',
        pointerEvents: 'all',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={handleMouseDown}
      title="Drag to move • waypoint"
    >
      <svg width="8" height="8" viewBox="0 0 8 8">
        <line x1="1" y1="1" x2="7" y2="7" stroke="#1971c2" strokeWidth="1.5" />
        <line x1="7" y1="1" x2="1" y2="7" stroke="#1971c2" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/** Mid-segment "+" handle — drag to insert a new waypoint in that segment */
function AddSegmentHandle({ x, y, segIdx, edgeId }: { x: number; y: number; segIdx: number; edgeId: string }) {
  const { screenToFlowPosition, setEdges } = useReactFlow();
  const newIdx = useRef<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const fp = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    setEdges((eds) => eds.map((edge) => {
      if (edge.id !== edgeId) return edge;
      const wps: Point[] = [...((edge.data?.waypoints as Point[]) ?? [])];
      wps.splice(segIdx, 0, fp);
      newIdx.current = segIdx;
      return { ...edge, data: { ...edge.data, waypoints: wps } };
    }));

    function onMM(ev: MouseEvent) {
      const mp = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      setEdges((eds) => eds.map((edge) => {
        if (edge.id !== edgeId) return edge;
        const wps: Point[] = [...((edge.data?.waypoints as Point[]) ?? [])];
        if (newIdx.current !== null && newIdx.current < wps.length) {
          wps[newIdx.current] = mp;
        }
        return { ...edge, data: { ...edge.data, waypoints: wps } };
      }));
    }
    function onMU() {
      newIdx.current = null;
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
    }
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
  }, [edgeId, segIdx, screenToFlowPosition, setEdges]);

  return (
    <div
      className="nodrag nopan"
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        width: 14,
        height: 14,
        background: 'rgba(255,255,255,0.85)',
        border: '1.5px dashed #adb5bd',
        borderRadius: '50%',
        cursor: 'crosshair',
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
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
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data, selected, markerEnd,
}: EdgeProps) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const d = data as WireEdgeData | undefined;
  const wireColor = d?.color || '#ffffff';
  const stripeColor = d?.stripeColor || '';
  const gauge = d?.gauge || '';
  const label = d?.label || '';
  const waypoints: Point[] = (d?.waypoints as Point[]) ?? [];

  const allPoints: Point[] = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (waypoints.length > 0) {
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

  function updateWaypoint(index: number, p: Point) {
    setEdges((eds) => eds.map((e) => {
      if (e.id !== id) return e;
      const wps: Point[] = [...((e.data?.waypoints as Point[]) ?? [])];
      wps[index] = p;
      return { ...e, data: { ...e.data, waypoints: wps } };
    }));
  }

  // Double-click anywhere on the wire path → insert pivot at that position
  function handlePathDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const fp = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const segIdx = findWpsInsertIndex(allPoints, fp);
    setEdges((eds) => eds.map((edge) => {
      if (edge.id !== id) return edge;
      const wps: Point[] = [...((edge.data?.waypoints as Point[]) ?? [])];
      wps.splice(segIdx, 0, fp);
      return { ...edge, data: { ...edge.data, waypoints: wps } };
    }));
  }

  // Segment midpoints for "+" add-corner handles
  const segmentMids = allPoints.slice(0, -1).map((pt, i) => ({
    x: (pt.x + allPoints[i + 1].x) / 2,
    y: (pt.y + allPoints[i + 1].y) / 2,
    segIdx: i,
  }));

  // For white wires, use a dark border so label is visible
  const labelBorderColor = wireColor === '#ffffff' || wireColor === '#f8f9fa' ? '#adb5bd' : wireColor;

  return (
    <>
      {/* Shadow */}
      <BaseEdge
        id={`${id}-shadow`}
        path={edgePath}
        style={{ stroke: 'rgba(0,0,0,0.15)', strokeWidth: 5, fill: 'none' }}
      />
      {/* Main wire */}
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
      {/* For white wires, add a thin dark outline so they're visible on white bg */}
      {(wireColor === '#ffffff' || wireColor === '#f8f9fa') && (
        <BaseEdge
          id={`${id}-outline`}
          path={edgePath}
          style={{ stroke: '#adb5bd', strokeWidth: 1, fill: 'none', pointerEvents: 'none' }}
        />
      )}
      {stripeColor && (
        <BaseEdge
          id={`${id}-stripe`}
          path={edgePath}
          style={{ stroke: stripeColor, strokeWidth: 2, strokeDasharray: '6 6', fill: 'none', pointerEvents: 'none' }}
        />
      )}

      {/* Invisible wide path for double-click to add pivot */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onDoubleClick={handlePathDoubleClick}
      />

      {/* Edge label */}
      {(label || gauge) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'rgba(255,255,255,0.92)',
              border: `1px solid ${labelBorderColor}`,
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
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: stripeColor, marginRight: 4, verticalAlign: 'middle' }} />
            )}
            {[label, gauge].filter(Boolean).join(' · ')}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Waypoint handles + segment "+" handles (selected only) */}
      {selected && (
        <EdgeLabelRenderer>
          {/* Existing waypoints — draggable X handles */}
          {waypoints.map((wp, i) => (
            <WaypointHandle key={i} x={wp.x} y={wp.y} onMove={(p) => updateWaypoint(i, p)} />
          ))}
          {/* Per-segment "+" handles to add new waypoints */}
          {segmentMids.map((seg) => (
            <AddSegmentHandle key={`seg-${seg.segIdx}`} x={seg.x} y={seg.y} segIdx={seg.segIdx} edgeId={id} />
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  );
}
