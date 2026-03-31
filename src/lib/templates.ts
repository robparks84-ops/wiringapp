import type { Node, Edge } from '@xyflow/react';

export interface Template {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty canvas — start from scratch.',
    nodes: [],
    edges: [],
  },
  {
    id: 'efi-4cyl',
    name: '4-Cylinder EFI',
    description: 'ECU, PDM, 4 injectors, coils, sensors, grounds.',
    nodes: [
      { id: 'ecu', type: 'device', position: { x: 60, y: 180 }, data: { label: 'ECU', subtype: 'ECU', channels: ['INJ 1','INJ 2','INJ 3','INJ 4','IGN 1','IGN 2','IGN 3','IGN 4','TPS','MAP','CLT','IAT','CAN H','CAN L','GND'] } },
      { id: 'pdm', type: 'device', position: { x: 60, y: 520 }, data: { label: 'PDM', subtype: 'PDM', channels: ['Ch1 Fuel Pump','Ch2 Fan','Ch3 ECU','Ch4 Dash','Ch5 Spare','12V In','GND'] } },
      { id: 'inj-bank', type: 'connector', position: { x: 480, y: 80 }, data: { label: 'Injector Bank', subtype: 'DTM', pins: 4, pinLabels: ['INJ1','INJ2','INJ3','INJ4'] } },
      { id: 'coil-bank', type: 'connector', position: { x: 480, y: 220 }, data: { label: 'Coil Pack', subtype: 'DT', pins: 4, pinLabels: ['IGN1','IGN2','IGN3','IGN4'] } },
      { id: 'sensor-conn', type: 'connector', position: { x: 480, y: 360 }, data: { label: 'Sensor Loom', subtype: 'DT', pins: 4, pinLabels: ['TPS','MAP','CLT','IAT'] } },
      { id: 'bulkhead', type: 'connector', position: { x: 280, y: 300 }, data: { label: 'Bulkhead', subtype: 'Bulkhead', pins: 8, pinLabels: ['A','B','C','D','E','F','G','H'] } },
      { id: 'gnd-1', type: 'ground', position: { x: 500, y: 540 }, data: { label: 'GND-1', location: 'Block' } },
      { id: 'gnd-2', type: 'ground', position: { x: 600, y: 540 }, data: { label: 'GND-2', location: 'Chassis' } },
      { id: 'splice-gnd', type: 'splice', position: { x: 380, y: 490 }, data: { label: 'SP-GND' } },
    ],
    edges: [],
  },
  {
    id: 'pdm-power',
    name: 'PDM Power Distribution',
    description: 'PDM with fused outputs, battery, main relay.',
    nodes: [
      { id: 'pdm', type: 'device', position: { x: 200, y: 200 }, data: { label: 'PDM', subtype: 'PDM', channels: ['Ch1 Starter','Ch2 Fuel Pump','Ch3 Fan','Ch4 ECU','Ch5 Dash','Ch6 Lights','Batt +','GND'] } },
      { id: 'batt-conn', type: 'connector', position: { x: 560, y: 100 }, data: { label: 'Battery +', subtype: 'DTP', pins: 2, pinLabels: ['B+','—'] } },
      { id: 'starter-conn', type: 'connector', position: { x: 560, y: 220 }, data: { label: 'Starter', subtype: 'DT', pins: 2, pinLabels: ['IGN','GND'] } },
      { id: 'fuel-conn', type: 'connector', position: { x: 560, y: 320 }, data: { label: 'Fuel Pump', subtype: 'DTM', pins: 2, pinLabels: ['+12V','GND'] } },
      { id: 'gnd-main', type: 'ground', position: { x: 560, y: 440 }, data: { label: 'GND-MAIN', location: 'Chassis' } },
    ],
    edges: [],
  },
  {
    id: 'dash-loom',
    name: 'Dash Loom',
    description: 'Dash connector, CAN bus, switches, warning lights.',
    nodes: [
      { id: 'dash-conn', type: 'connector', position: { x: 120, y: 200 }, data: { label: 'Dash Main', subtype: 'DT', pins: 8, pinLabels: ['CAN H','CAN L','IGN SW','12V','GND','OIL WRN','TEMP WRN','SPARE'] } },
      { id: 'ecu', type: 'device', position: { x: 460, y: 120 }, data: { label: 'ECU', subtype: 'ECU', channels: ['CAN H','CAN L','12V','GND'] } },
      { id: 'sw-ign', type: 'connector', position: { x: 460, y: 300 }, data: { label: 'Ignition Switch', subtype: 'DTM', pins: 2, pinLabels: ['IGN_IN','IGN_OUT'] } },
      { id: 'splice-can', type: 'splice', position: { x: 320, y: 160 }, data: { label: 'CAN' } },
      { id: 'gnd-dash', type: 'ground', position: { x: 460, y: 460 }, data: { label: 'GND-DASH', location: 'Dash bar' } },
    ],
    edges: [],
  },
];
