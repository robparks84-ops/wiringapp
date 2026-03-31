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
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { IconDeviceFloppy, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { ConnectorNode } from './nodes/ConnectorNode';
import { GroundNode } from './nodes/GroundNode';
import { SpliceNode } from './nodes/SpliceNode';
import { DeviceNode } from './nodes/DeviceNode';
import { WireEdge } from './edges/WireEdge';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';

const NODE_TYPES = {
  connector: ConnectorNode,
  ground: GroundNode,
  splice: SpliceNode,
  device: DeviceNode,
};

const EDGE_TYPES = {
  wire: WireEdge,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'ecu-1',
    type: 'device',
    position: { x: 80, y: 160 },
    data: {
      label: 'Haltech ECU',
      subtype: 'ECU',
      channels: ['IGN SW', 'INJ 1', 'INJ 2', 'CAN H', 'CAN L', 'GND'],
    },
  },
  {
    id: 'pdm-1',
    type: 'device',
    position: { x: 80, y: 440 },
    data: {
      label: 'AEM PDM',
      subtype: 'PDM',
      channels: ['Ch1 Fan', 'Ch2 Fuel Pump', 'Ch3 ECU', 'Ch4 Lights', 'GND'],
    },
  },
  {
    id: 'conn-1',
    type: 'connector',
    position: { x: 440, y: 160 },
    data: {
      label: 'Header Harness',
      subtype: 'DT',
      pins: 4,
      pinLabels: ['IGN', 'INJ1', 'INJ2', 'GND'],
    },
  },
  {
    id: 'gnd-1',
    type: 'ground',
    position: { x: 480, y: 480 },
    data: { label: 'GND-1', location: 'Chassis' },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1',
    source: 'ecu-1',
    sourceHandle: 'ch-0',
    target: 'conn-1',
    targetHandle: 'pin-0',
    type: 'wire',
    data: { color: '#c92a2a', gauge: '20 AWG', label: 'IGN_SW' },
  },
  {
    id: 'e2',
    source: 'pdm-1',
    sourceHandle: 'ch-4',
    target: 'gnd-1',
    type: 'wire',
    data: { color: '#212529', gauge: '14 AWG', label: 'PDM_GND' },
  },
];

interface SelectedItem {
  node?: Node;
  edge?: Edge;
}

let nodeCounter = 100;

export function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selected, setSelected] = useState<SelectedItem | null>(null);

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
      position: { x: 300 + Math.random() * 80, y: 200 + Math.random() * 80 },
      data: buildDefaultData(type, subtype),
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function buildDefaultData(type: string, subtype: string): Record<string, unknown> {
    if (type === 'connector') {
      return { label: `New ${subtype}`, subtype, pins: 4, pinLabels: ['1', '2', '3', '4'] };
    }
    if (type === 'device') {
      return { label: `New ${subtype}`, subtype, channels: ['Ch1', 'Ch2', 'Ch3'] };
    }
    if (type === 'ground') {
      return { label: 'GND', location: '' };
    }
    if (type === 'splice') {
      return { label: 'SP' };
    }
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

  function handleSave() {
    const data = { nodes, edges };
    localStorage.setItem('wiringapp_canvas', JSON.stringify(data));
    notifications.show({ message: 'Design saved to browser.', color: 'green' });
  }

  function handleClear() {
    if (confirm('Clear the entire canvas? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      setSelected(null);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <Toolbar onAdd={handleAdd} />

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
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

          <Panel position="top-right">
            <Group gap="xs">
              <Text fz={11} c="dimmed">Tip: drag from a pin handle to connect wires</Text>
              <Button
                size="xs"
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={handleSave}
                variant="light"
              >
                Save
              </Button>
              <Button
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={handleClear}
                variant="light"
                color="red"
              >
                Clear
              </Button>
            </Group>
          </Panel>
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
