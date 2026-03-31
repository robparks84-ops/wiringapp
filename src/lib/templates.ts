import type { Node, Edge } from '@xyflow/react';
import {
  MS3PRO_EVO_WHITE, MS3PRO_EVO_GRAY,
  AIM_PDM32_BLACK, AIM_PDM32_GRAY,
  groundBlockCavities, SENSOR_DEFAULTS, connectorCavities, type Cavity,
} from './nodeDefaults';

export interface Template {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

function fc(cavities: Cavity[]): Cavity[] {
  return cavities.map((c) => ({ ...c, id: Math.random().toString(36).slice(2) }));
}

function fcp(count: number): Cavity[] {
  return fc(connectorCavities(count));
}

function cavityNode(
  id: string, subtype: string, label: string, headerColor: string,
  cavities: Cavity[], pos: { x: number; y: number }, category: string,
  extra: Record<string, unknown> = {},
): Node {
  return {
    id, type: 'cavity', position: pos,
    data: { label, subtype, category, headerColor, cavities: fc(cavities), ...extra },
  };
}

function connNode(
  id: string, label: string, subtype: string, pinCount: number,
  connectorColor: 'black' | 'gray', gender: 'female' | 'male', sealed: boolean,
  pos: { x: number; y: number },
): Node {
  const headerColor = connectorColor === 'gray' ? '#868e96' : '#212529';
  return {
    id, type: 'cavity', position: pos,
    data: {
      label, subtype, category: 'connector', headerColor,
      cavities: fcp(pinCount), connectorColor, gender, sealed, notes: '',
    },
  };
}

function groundBlockNode(id: string, posts: number, label: string, pos: { x: number; y: number }): Node {
  return {
    id, type: 'groundBlock', position: pos,
    data: { label, posts, cavities: fc(groundBlockCavities(posts)), headerColor: '#212529' },
  };
}

function groundNode(id: string, label: string, location: string, pos: { x: number; y: number }): Node {
  return { id, type: 'ground', position: pos, data: { label, location } };
}

function spliceNode(id: string, label: string, pos: { x: number; y: number }): Node {
  return { id, type: 'splice', position: pos, data: { label } };
}

// Shared column X positions
const X = { ecu: 40, pdm: 300, conn: 620, sensor: 950, gnd: 1260 };

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty canvas — start from scratch.',
    nodes: [],
    edges: [],
  },

  // ─── 4-Cylinder ──────────────────────────────────────────────────────────────
  {
    id: 'efi-4cyl',
    name: '4-Cylinder EFI',
    description: 'MS3Pro Evo + AIM PDM32, individual connectors for every device.',
    nodes: [
      // ECU
      cavityNode('ecu-white', 'ECU-White', 'MS3Pro Evo White', '#1864ab', MS3PRO_EVO_WHITE, { x: X.ecu, y: 40 },  'ecu'),
      cavityNode('ecu-gray',  'ECU-Gray',  'MS3Pro Evo Gray',  '#495057', MS3PRO_EVO_GRAY,  { x: X.ecu, y: 960 }, 'ecu'),
      // PDM
      cavityNode('pdm-black', 'PDM32-Black', 'AIM PDM32 Black', '#212529', AIM_PDM32_BLACK, { x: X.pdm, y: 40  }, 'pdm'),
      cavityNode('pdm-gray',  'PDM32-Gray',  'AIM PDM32 Gray',  '#868e96', AIM_PDM32_GRAY,  { x: X.pdm, y: 1000 }, 'pdm'),
      // Injectors (DTM-2 Black Female Sealed)
      connNode('inj-1', 'Injector 1', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 40 }),
      connNode('inj-2', 'Injector 2', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 110 }),
      connNode('inj-3', 'Injector 3', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 180 }),
      connNode('inj-4', 'Injector 4', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 250 }),
      // Coils (DTM-2 Black Female Sealed)
      connNode('coil-1', 'Coil 1', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 340 }),
      connNode('coil-2', 'Coil 2', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 410 }),
      connNode('coil-3', 'Coil 3', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 480 }),
      connNode('coil-4', 'Coil 4', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 550 }),
      // Crank/Cam sensors (DTM-3 Black Female Sealed)
      connNode('crank-conn', 'Crank Sensor', 'DTM', 3, 'black', 'female', true, { x: X.conn, y: 640 }),
      connNode('cam-conn',   'Cam Sensor',   'DTM', 3, 'black', 'female', true, { x: X.conn, y: 710 }),
      // Temp sensors (DTM-2 Black Female Sealed)
      connNode('clt-conn', 'CLT Sensor', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 800 }),
      connNode('iat-conn', 'IAT Sensor', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 870 }),
      // Pressure / MAP sensors (DTM-3 Black Female Sealed)
      connNode('tps-conn', 'TPS',      'DTM', 3, 'black', 'female', true, { x: X.conn, y: 960 }),
      connNode('map-conn', 'MAP',      'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1030 }),
      connNode('oilp-conn','Oil Pressure', 'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1100 }),
      // Lambda (DTM-4 Black Female Sealed)
      connNode('wb-conn', 'Lambda / WBO2', 'DTM', 4, 'black', 'female', true, { x: X.conn, y: 1190 }),
      // Bulkhead (Gray Female Sealed)
      connNode('bulkhead', 'Bulkhead', 'Bulkhead', 8, 'gray', 'female', true, { x: X.conn, y: 1290 }),
      // Sensor nodes
      cavityNode('tps',   'TPS',         'TPS',         '#0c8599', SENSOR_DEFAULTS['TPS'],          { x: X.sensor, y: 40  }, 'sensor'),
      cavityNode('map',   'MAP',         'MAP',         '#0c8599', SENSOR_DEFAULTS['MAP'],          { x: X.sensor, y: 130 }, 'sensor'),
      cavityNode('clt',   'CLT',         'CLT',         '#0c8599', SENSOR_DEFAULTS['CLT'],          { x: X.sensor, y: 220 }, 'sensor'),
      cavityNode('iat',   'IAT',         'IAT',         '#0c8599', SENSOR_DEFAULTS['IAT'],          { x: X.sensor, y: 290 }, 'sensor'),
      cavityNode('crank', 'Crank Position', 'Crank',    '#0c8599', SENSOR_DEFAULTS['Crank Position'],{ x: X.sensor, y: 380 }, 'sensor'),
      cavityNode('cam',   'Cam Position',   'Cam',      '#0c8599', SENSOR_DEFAULTS['Cam Position'], { x: X.sensor, y: 450 }, 'sensor'),
      cavityNode('oilp',  'Oil Pressure',  'Oil Pressure','#0c8599', SENSOR_DEFAULTS['Oil Pressure'],{ x: X.sensor, y: 540 }, 'sensor'),
      cavityNode('lambda','Lambda / WBO2','Lambda',     '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'],{ x: X.sensor, y: 630 }, 'sensor'),
      // Ground
      groundBlockNode('gnd-sensor', 4, 'Sensor GND',   { x: X.gnd, y: 40  }),
      groundBlockNode('gnd-main',   8, 'Main GND',      { x: X.gnd, y: 260 }),
      groundNode('gnd-chassis', 'GND', 'Chassis',       { x: X.gnd, y: 600 }),
      spliceNode('sp-5v', '5V Ref', { x: X.sensor - 120, y: 40 }),
    ],
    edges: [],
  },

  // ─── 6-Cylinder ──────────────────────────────────────────────────────────────
  {
    id: 'efi-6cyl',
    name: '6-Cylinder EFI',
    description: 'MS3Pro Evo + AIM PDM32 for inline-6 or V6.',
    nodes: [
      cavityNode('ecu-white', 'ECU-White', 'MS3Pro Evo White', '#1864ab', MS3PRO_EVO_WHITE, { x: X.ecu, y: 40 },  'ecu'),
      cavityNode('ecu-gray',  'ECU-Gray',  'MS3Pro Evo Gray',  '#495057', MS3PRO_EVO_GRAY,  { x: X.ecu, y: 960 }, 'ecu'),
      cavityNode('pdm-black', 'PDM32-Black', 'AIM PDM32 Black', '#212529', AIM_PDM32_BLACK, { x: X.pdm, y: 40   }, 'pdm'),
      cavityNode('pdm-gray',  'PDM32-Gray',  'AIM PDM32 Gray',  '#868e96', AIM_PDM32_GRAY,  { x: X.pdm, y: 1000 }, 'pdm'),
      // Injectors
      connNode('inj-1', 'Injector 1', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 40  }),
      connNode('inj-2', 'Injector 2', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 110 }),
      connNode('inj-3', 'Injector 3', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 180 }),
      connNode('inj-4', 'Injector 4', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 250 }),
      connNode('inj-5', 'Injector 5', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 320 }),
      connNode('inj-6', 'Injector 6', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 390 }),
      // Coils
      connNode('coil-1', 'Coil 1', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 480 }),
      connNode('coil-2', 'Coil 2', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 550 }),
      connNode('coil-3', 'Coil 3', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 620 }),
      connNode('coil-4', 'Coil 4', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 690 }),
      connNode('coil-5', 'Coil 5', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 760 }),
      connNode('coil-6', 'Coil 6', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 830 }),
      // Sensors
      connNode('crank-conn', 'Crank Sensor', 'DTM', 3, 'black', 'female', true, { x: X.conn, y: 920  }),
      connNode('cam1-conn',  'Cam 1',        'DTM', 3, 'black', 'female', true, { x: X.conn, y: 990  }),
      connNode('cam2-conn',  'Cam 2',        'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1060 }),
      connNode('clt-conn',   'CLT Sensor',   'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1150 }),
      connNode('iat-conn',   'IAT Sensor',   'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1220 }),
      connNode('tps-conn',   'TPS',          'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1310 }),
      connNode('map-conn',   'MAP',          'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1380 }),
      connNode('oilp-conn',  'Oil Pressure', 'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1450 }),
      connNode('wb-conn',    'Lambda / WBO2','DTM', 4, 'black', 'female', true, { x: X.conn, y: 1540 }),
      connNode('bulkhead', 'Bulkhead', 'Bulkhead', 8, 'gray', 'female', true, { x: X.conn, y: 1640 }),
      cavityNode('tps',   'TPS',  'TPS',  '#0c8599', SENSOR_DEFAULTS['TPS'],           { x: X.sensor, y: 40  }, 'sensor'),
      cavityNode('map',   'MAP',  'MAP',  '#0c8599', SENSOR_DEFAULTS['MAP'],           { x: X.sensor, y: 130 }, 'sensor'),
      cavityNode('clt',   'CLT',  'CLT',  '#0c8599', SENSOR_DEFAULTS['CLT'],           { x: X.sensor, y: 220 }, 'sensor'),
      cavityNode('iat',   'IAT',  'IAT',  '#0c8599', SENSOR_DEFAULTS['IAT'],           { x: X.sensor, y: 290 }, 'sensor'),
      cavityNode('crank', 'Crank Position', 'Crank', '#0c8599', SENSOR_DEFAULTS['Crank Position'], { x: X.sensor, y: 380 }, 'sensor'),
      cavityNode('cam1',  'Cam Position', 'Cam 1',  '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: X.sensor, y: 450 }, 'sensor'),
      cavityNode('cam2',  'Cam Position', 'Cam 2',  '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: X.sensor, y: 520 }, 'sensor'),
      cavityNode('oilp',  'Oil Pressure', 'Oil Pressure', '#0c8599', SENSOR_DEFAULTS['Oil Pressure'], { x: X.sensor, y: 610 }, 'sensor'),
      cavityNode('lambda','Lambda / WBO2','Lambda', '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'],  { x: X.sensor, y: 700 }, 'sensor'),
      groundBlockNode('gnd-sensor', 4, 'Sensor GND', { x: X.gnd, y: 40  }),
      groundBlockNode('gnd-main',   8, 'Main GND',   { x: X.gnd, y: 260 }),
      groundNode('gnd-chassis', 'GND', 'Chassis',     { x: X.gnd, y: 600 }),
      spliceNode('sp-5v', '5V Ref', { x: X.sensor - 120, y: 40 }),
    ],
    edges: [],
  },

  // ─── 8-Cylinder ──────────────────────────────────────────────────────────────
  {
    id: 'efi-8cyl',
    name: '8-Cylinder EFI',
    description: 'MS3Pro Evo + AIM PDM32 for V8.',
    nodes: [
      cavityNode('ecu-white', 'ECU-White', 'MS3Pro Evo White', '#1864ab', MS3PRO_EVO_WHITE, { x: X.ecu, y: 40 },   'ecu'),
      cavityNode('ecu-gray',  'ECU-Gray',  'MS3Pro Evo Gray',  '#495057', MS3PRO_EVO_GRAY,  { x: X.ecu, y: 960 },  'ecu'),
      cavityNode('pdm-black', 'PDM32-Black', 'AIM PDM32 Black', '#212529', AIM_PDM32_BLACK, { x: X.pdm, y: 40   }, 'pdm'),
      cavityNode('pdm-gray',  'PDM32-Gray',  'AIM PDM32 Gray',  '#868e96', AIM_PDM32_GRAY,  { x: X.pdm, y: 1000 }, 'pdm'),
      // 8 Injectors
      connNode('inj-1', 'Injector 1', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 40  }),
      connNode('inj-2', 'Injector 2', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 110 }),
      connNode('inj-3', 'Injector 3', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 180 }),
      connNode('inj-4', 'Injector 4', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 250 }),
      connNode('inj-5', 'Injector 5', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 320 }),
      connNode('inj-6', 'Injector 6', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 390 }),
      connNode('inj-7', 'Injector 7', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 460 }),
      connNode('inj-8', 'Injector 8', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 530 }),
      // 8 Coils
      connNode('coil-1', 'Coil 1', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 620 }),
      connNode('coil-2', 'Coil 2', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 690 }),
      connNode('coil-3', 'Coil 3', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 760 }),
      connNode('coil-4', 'Coil 4', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 830 }),
      connNode('coil-5', 'Coil 5', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 900 }),
      connNode('coil-6', 'Coil 6', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 970 }),
      connNode('coil-7', 'Coil 7', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1040 }),
      connNode('coil-8', 'Coil 8', 'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1110 }),
      // Sensors
      connNode('crank-conn',  'Crank Sensor',  'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1200 }),
      connNode('cam1-conn',   'Cam 1 (Bnk 1)', 'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1270 }),
      connNode('cam2-conn',   'Cam 2 (Bnk 2)', 'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1340 }),
      connNode('clt-conn',    'CLT Sensor',    'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1430 }),
      connNode('iat-conn',    'IAT Sensor',    'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1500 }),
      connNode('tps-conn',    'TPS',           'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1590 }),
      connNode('map-conn',    'MAP',           'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1660 }),
      connNode('oilp-conn',   'Oil Pressure',  'DTM', 3, 'black', 'female', true, { x: X.conn, y: 1730 }),
      connNode('oilt-conn',   'Oil Temp',      'DTM', 2, 'black', 'female', true, { x: X.conn, y: 1800 }),
      connNode('wb1-conn', 'Lambda Bank 1', 'DTM', 4, 'black', 'female', true, { x: X.conn, y: 1890 }),
      connNode('wb2-conn', 'Lambda Bank 2', 'DTM', 4, 'black', 'female', true, { x: X.conn, y: 1960 }),
      connNode('bulkhead', 'Bulkhead', 'Bulkhead', 12, 'gray', 'female', true, { x: X.conn, y: 2050 }),
      // Sensor nodes
      cavityNode('tps',    'TPS',          'TPS',        '#0c8599', SENSOR_DEFAULTS['TPS'],           { x: X.sensor, y: 40  }, 'sensor'),
      cavityNode('map',    'MAP',          'MAP',        '#0c8599', SENSOR_DEFAULTS['MAP'],           { x: X.sensor, y: 130 }, 'sensor'),
      cavityNode('clt',    'CLT',          'CLT',        '#0c8599', SENSOR_DEFAULTS['CLT'],           { x: X.sensor, y: 220 }, 'sensor'),
      cavityNode('iat',    'IAT',          'IAT',        '#0c8599', SENSOR_DEFAULTS['IAT'],           { x: X.sensor, y: 290 }, 'sensor'),
      cavityNode('crank',  'Crank Position','Crank',     '#0c8599', SENSOR_DEFAULTS['Crank Position'],{ x: X.sensor, y: 380 }, 'sensor'),
      cavityNode('cam1',   'Cam Position', 'Cam 1',     '#0c8599', SENSOR_DEFAULTS['Cam Position'],  { x: X.sensor, y: 450 }, 'sensor'),
      cavityNode('cam2',   'Cam Position', 'Cam 2',     '#0c8599', SENSOR_DEFAULTS['Cam Position'],  { x: X.sensor, y: 520 }, 'sensor'),
      cavityNode('oilp',   'Oil Pressure', 'Oil Pressure','#0c8599',SENSOR_DEFAULTS['Oil Pressure'], { x: X.sensor, y: 610 }, 'sensor'),
      cavityNode('oilt',   'Oil Temp',     'Oil Temp',  '#0c8599', SENSOR_DEFAULTS['Oil Temp'],      { x: X.sensor, y: 680 }, 'sensor'),
      cavityNode('lambda1','Lambda / WBO2','Lambda B1', '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'], { x: X.sensor, y: 770 }, 'sensor'),
      cavityNode('lambda2','Lambda / WBO2','Lambda B2', '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'], { x: X.sensor, y: 860 }, 'sensor'),
      groundBlockNode('gnd-sensor', 4,  'Sensor GND', { x: X.gnd, y: 40  }),
      groundBlockNode('gnd-main',   8,  'Main GND',   { x: X.gnd, y: 260 }),
      groundNode('gnd-chassis', 'GND', 'Chassis',      { x: X.gnd, y: 600 }),
      spliceNode('sp-5v', '5V Ref', { x: X.sensor - 120, y: 40 }),
    ],
    edges: [],
  },
];
