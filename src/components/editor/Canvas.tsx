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

import { CavityNode } from './nodes/CavityNode';
import { GroundBlockNode } from './nodes/GroundBlockNode';
import { GroundNode } from './nodes/GroundNode';
import { SpliceNode } from './nodes/SpliceNode';
import { WireEdge } from './edges/WireEdge';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { useState } from 'react';
import {
  DT_4, DTM_4, DTP_4, BULKHEAD_8,
  MS3PRO_EVO_C1, MS3PRO_EVO_C2, AIM_PDM32,
  SENSOR_DEFAULTS, groundBlockCavities, CATEGORY_COLORS,
  type Cavity,
} from '@/lib/nodeDefaults';

const NODE_TYPES = {
  cavity: CavityNode,
  groundBlock: GroundBlockNode,
  ground: GroundNode,
  splice: SpliceNode,
};

const EDGE_TYPES = {
  wire: WireEdge,
};

interface SelectedItem {
  node?: Node;
  edge?: Edge;
}

let nodeCounter = 100;

function freshCavities(cavities: Cavity[]): Cavity[] {
  return cavities.map((c) => ({ ...c, id: Math.random().toString(36).slice(2) }));
}

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
    const color = CATEGORY_COLORS[subtype] ?? '#495057';

    if (type === 'ground') return { label: 'GND', location: '' };
    if (type === 'splice') return { label: 'SP', subtype: 'Splice' };

    if (type === 'groundBlock') {
      const posts = 4;
      return {
        label: '4-Post GND',
        posts,
        cavities: freshCavities(groundBlockCavities(posts)),
        headerColor: CATEGORY_COLORS['GroundBlock'] ?? '#212529',
      };
    }

    // cavity type — all connectors, ECU, PDM, sensors, blank
    if (type === 'cavity') {
      const base = { subtype, headerColor: color };
      const connBase = { ...base, category: 'connector', connectorColor: 'black', gender: 'female', sealed: true, notes: '' };

      switch (subtype) {
        case 'DT':        return { ...connBase, label: 'DT Connector',   cavities: freshCavities(DT_4) };
        case 'DTM':       return { ...connBase, label: 'DTM Connector',  cavities: freshCavities(DTM_4) };
        case 'DTP':       return { ...connBase, label: 'DTP Connector',  cavities: freshCavities(DTP_4) };
        case 'AT':        return { ...connBase, label: 'AT Connector',   cavities: freshCavities(DT_4) };
        case 'ATM':       return { ...connBase, label: 'ATM Connector',  cavities: freshCavities(DTM_4) };
        case 'Bulkhead':  return { ...connBase, label: 'Bulkhead', connectorColor: 'gray', cavities: freshCavities(BULKHEAD_8) };
        case 'ECU-C1':    return { ...base, label: 'MS3Pro Evo C1',  category: 'ecu',       cavities: freshCavities(MS3PRO_EVO_C1) };
        case 'ECU-C2':    return { ...base, label: 'MS3Pro Evo C2',  category: 'ecu',       cavities: freshCavities(MS3PRO_EVO_C2) };
        case 'AIM PDM32': return { ...base, label: 'AIM PDM32',      category: 'pdm',       cavities: freshCavities(AIM_PDM32) };
        case 'Blank':     return { ...base, label: 'Custom Device',  category: 'blank',     cavities: [{ id: Math.random().toString(36).slice(2), label: 'Pin 1' }, { id: Math.random().toString(36).slice(2), label: 'Pin 2' }] };
        default: {
          const sensorCavities = SENSOR_DEFAULTS[subtype];
          if (sensorCavities) {
            return { ...base, label: subtype, category: 'sensor', cavities: freshCavities(sensorCavities), headerColor: CATEGORY_COLORS['Sensor'] ?? color };
          }
          return { ...base, label: subtype, category: 'blank', cavities: [] };
        }
      }
    }

    return { label: subtype };
  }

  function handleUpdateNode(id: string, data: Record<string, unknown>) {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
    // Keep selected in sync
    setSelected((sel) => sel?.node?.id === id ? { node: { ...sel.node, data } } : sel);
  }

  function handleUpdateEdge(id: string, data: Record<string, unknown>) {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data } : e)));
  }

  function handleRemoveCavity(nodeId: string, cavityId: string) {
    // Remove the cavity from node data
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const d = n.data as Record<string, unknown>;
        const cavities = (d.cavities as Cavity[]) ?? [];
        return { ...n, data: { ...d, cavities: cavities.filter((c) => c.id !== cavityId) } };
      })
    );
    // Remove any edges connected to that cavity's handles
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !(e.sourceHandle?.includes(cavityId) || e.targetHandle?.includes(cavityId))
      )
    );
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
        onRemoveCavity={handleRemoveCavity}
      />
    </div>
  );
}
