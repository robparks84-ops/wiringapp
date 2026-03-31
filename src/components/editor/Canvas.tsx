'use client';

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect } from 'react';

import { ConnectorNode } from './nodes/ConnectorNode';
import { GroundNode } from './nodes/GroundNode';
import { SpliceNode } from './nodes/SpliceNode';
import { DeviceNode } from './nodes/DeviceNode';
import { WireEdge } from './edges/WireEdge';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { useState } from 'react';

const NODE_TYPES = {
  connector: ConnectorNode,
  ground: GroundNode,
  splice: SpliceNode,
  device: DeviceNode,
};

const EDGE_TYPES = {
  wire: WireEdge,
};

interface SelectedItem {
  node?: Node;
  edge?: Edge;
}

let nodeCounter = 100;

interface CanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  saving?: boolean;
  wireSearch?: string;
}

export function Canvas({ initialNodes = [], initialEdges = [], onSave, wireSearch = '' }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  // Sync when parent loads doc data
  useEffect(() => {
    if (initialNodes.length > 0 || initialEdges.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight wires matching search
  const displayEdges = edges.map((e) => {
    if (!wireSearch) return e;
    const label = (e.data?.label as string) ?? '';
    const matched = label.toLowerCase().includes(wireSearch.toLowerCase());
    return {
      ...e,
      style: matched
        ? { stroke: e.data?.color as string, strokeWidth: 5, filter: 'drop-shadow(0 0 6px #f08c00)' }
        : { opacity: 0.2 },
    };
  });

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          { ...connection, type: 'wire', data: { color: '#212529', gauge: '20 AWG', label: '' } },
          eds
        )
      ),
    [setEdges]
  );

  function handleAdd(type: string, subtype: string) {
    nodeCounter++;
    const id = `${type}-${nodeCounter}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 200 + Math.random() * 120, y: 200 + Math.random() * 120 },
      data: buildDefaultData(type, subtype),
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function buildDefaultData(type: string, subtype: string): Record<string, unknown> {
    if (type === 'connector') return { label: `New ${subtype}`, subtype, pins: 4, pinLabels: ['1', '2', '3', '4'] };
    if (type === 'device') return { label: `New ${subtype}`, subtype, channels: ['Ch1', 'Ch2', 'Ch3'] };
    if (type === 'ground') return { label: 'GND', location: '' };
    if (type === 'splice') return { label: 'SP' };
    return { label: subtype };
  }

  function handleUpdateNode(id: string, data: Record<string, unknown>) {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
  }

  function handleUpdateEdge(id: string, data: Record<string, unknown>) {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data } : e)));
  }

  function handleDelete() {
    if (selected?.node) {
      setNodes((nds) => nds.filter((n) => n.id !== selected.node!.id));
      setEdges((eds) => eds.filter((e) => e.source !== selected.node!.id && e.target !== selected.node!.id));
    }
    if (selected?.edge) {
      setEdges((eds) => eds.filter((e) => e.id !== selected.edge!.id));
    }
    setSelected(null);
  }

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.(nodes, edges);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nodes, edges, onSave]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <Toolbar onAdd={handleAdd} />

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          onNodeClick={(_, node) => setSelected({ node })}
          onEdgeClick={(_, edge) => setSelected({ edge })}
          onPaneClick={() => setSelected(null)}
          deleteKeyCode={null}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ced4da" />
          <Controls />
          <MiniMap zoomable pannable nodeStrokeWidth={3} />
        </ReactFlow>
      </div>

      <PropertiesPanel
        selected={selected}
        onUpdateNode={handleUpdateNode}
        onUpdateEdge={handleUpdateEdge}
        onDelete={handleDelete}
      />
    </div>
  );
}
