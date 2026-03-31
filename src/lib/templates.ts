import type { Node, Edge } from '@xyflow/react';
import {
  MS3PRO_EVO_C1, MS3PRO_EVO_C2, AIM_PDM32, groundBlockCavities,
  SENSOR_DEFAULTS, type Cavity,
} from './nodeDefaults';

export interface Template {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

// Fresh IDs every time a template is used
function fc(cavities: Cavity[]): Cavity[] {
  return cavities.map((c) => ({ ...c, id: Math.random().toString(36).slice(2) }));
}

function cavityNode(id: string, subtype: string, label: string, color: string, cavities: Cavity[], pos: { x: number; y: number }, category: string): Node {
  return {
    id,
    type: 'cavity',
    position: pos,
    data: { label, subtype, category, headerColor: color, cavities: fc(cavities) },
  };
}

function groundBlockNode(id: string, posts: 4 | 8, label: string, pos: { x: number; y: number }): Node {
  return {
    id,
    type: 'groundBlock',
    position: pos,
    data: { label, posts, cavities: fc(groundBlockCavities(posts)), headerColor: '#212529' },
  };
}

function groundNode(id: string, label: string, location: string, pos: { x: number; y: number }): Node {
  return { id, type: 'ground', position: pos, data: { label, location } };
}

function spliceNode(id: string, label: string, pos: { x: number; y: number }): Node {
  return { id, type: 'splice', position: pos, data: { label } };
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
    name: '4-Cylinder EFI (MS3Pro + AIM PDM32)',
    description: 'MS3Pro Evo C1 & C2, AIM PDM32, common sensors, ground blocks.',
    nodes: [
      cavityNode('ecu-c1', 'ECU-C1', 'MS3Pro Evo C1', '#1864ab', MS3PRO_EVO_C1, { x: 40, y: 40 }, 'ecu'),
      cavityNode('ecu-c2', 'ECU-C2', 'MS3Pro Evo C2', '#1864ab', MS3PRO_EVO_C2, { x: 40, y: 900 }, 'ecu'),
      cavityNode('pdm',    'AIM PDM32', 'AIM PDM32',   '#5c2d91', AIM_PDM32,     { x: 500, y: 40 }, 'pdm'),
      cavityNode('tps',    'TPS',       'TPS',          '#0c8599', SENSOR_DEFAULTS['TPS'],    { x: 900, y: 40 },  'sensor'),
      cavityNode('map',    'MAP',       'MAP',          '#0c8599', SENSOR_DEFAULTS['MAP'],    { x: 900, y: 130 }, 'sensor'),
      cavityNode('clt',    'CLT',       'CLT',          '#0c8599', SENSOR_DEFAULTS['CLT'],    { x: 900, y: 220 }, 'sensor'),
      cavityNode('iat',    'IAT',       'IAT',          '#0c8599', SENSOR_DEFAULTS['IAT'],    { x: 900, y: 290 }, 'sensor'),
      cavityNode('crank',  'Crank Position', 'Crank Position', '#0c8599', SENSOR_DEFAULTS['Crank Position'], { x: 900, y: 380 }, 'sensor'),
      cavityNode('cam',    'Cam Position',   'Cam Position',   '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: 900, y: 470 }, 'sensor'),
      cavityNode('lambda', 'Lambda / WBO2',  'Lambda / WBO2',  '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'],  { x: 900, y: 560 }, 'sensor'),
      cavityNode('oilp',   'Oil Pressure',   'Oil Pressure',   '#0c8599', SENSOR_DEFAULTS['Oil Pressure'],   { x: 900, y: 670 }, 'sensor'),
      groundBlockNode('gnd-block-4', 4, 'Sensor GND Block', { x: 900, y: 780 }),
      groundBlockNode('gnd-block-8', 8, 'Main GND Block',   { x: 1100, y: 40 }),
      groundNode('gnd-chassis', 'GND', 'Chassis', { x: 1100, y: 500 }),
      spliceNode('sp-5v', '5V Ref', { x: 700, y: 40 }),
    ],
    edges: [],
  },
  {
    id: 'efi-6cyl',
    name: '6-Cylinder EFI (MS3Pro + AIM PDM32)',
    description: 'MS3Pro Evo C1 & C2, AIM PDM32, sensors for inline-6 or V6.',
    nodes: [
      cavityNode('ecu-c1', 'ECU-C1', 'MS3Pro Evo C1', '#1864ab', MS3PRO_EVO_C1, { x: 40, y: 40 }, 'ecu'),
      cavityNode('ecu-c2', 'ECU-C2', 'MS3Pro Evo C2', '#1864ab', MS3PRO_EVO_C2, { x: 40, y: 900 }, 'ecu'),
      cavityNode('pdm',    'AIM PDM32', 'AIM PDM32',   '#5c2d91', AIM_PDM32,     { x: 500, y: 40 }, 'pdm'),
      cavityNode('tps',    'TPS',       'TPS',          '#0c8599', SENSOR_DEFAULTS['TPS'],    { x: 900, y: 40 },  'sensor'),
      cavityNode('map',    'MAP',       'MAP',          '#0c8599', SENSOR_DEFAULTS['MAP'],    { x: 900, y: 130 }, 'sensor'),
      cavityNode('clt',    'CLT',       'CLT',          '#0c8599', SENSOR_DEFAULTS['CLT'],    { x: 900, y: 220 }, 'sensor'),
      cavityNode('iat',    'IAT',       'IAT',          '#0c8599', SENSOR_DEFAULTS['IAT'],    { x: 900, y: 290 }, 'sensor'),
      cavityNode('crank',  'Crank Position', 'Crank Position', '#0c8599', SENSOR_DEFAULTS['Crank Position'], { x: 900, y: 380 }, 'sensor'),
      cavityNode('cam1',   'Cam Position',   'Cam 1',          '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: 900, y: 470 }, 'sensor'),
      cavityNode('cam2',   'Cam Position',   'Cam 2',          '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: 900, y: 560 }, 'sensor'),
      cavityNode('lambda', 'Lambda / WBO2',  'Lambda / WBO2',  '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'],  { x: 900, y: 650 }, 'sensor'),
      cavityNode('oilp',   'Oil Pressure',   'Oil Pressure',   '#0c8599', SENSOR_DEFAULTS['Oil Pressure'],   { x: 900, y: 740 }, 'sensor'),
      groundBlockNode('gnd-block-4', 4, 'Sensor GND Block', { x: 900, y: 850 }),
      groundBlockNode('gnd-block-8', 8, 'Main GND Block',   { x: 1100, y: 40 }),
      groundNode('gnd-chassis', 'GND', 'Chassis', { x: 1100, y: 500 }),
      spliceNode('sp-5v', '5V Ref', { x: 700, y: 40 }),
    ],
    edges: [],
  },
  {
    id: 'efi-8cyl',
    name: '8-Cylinder EFI (MS3Pro + AIM PDM32)',
    description: 'MS3Pro Evo C1 & C2, AIM PDM32, sensors for V8.',
    nodes: [
      cavityNode('ecu-c1', 'ECU-C1', 'MS3Pro Evo C1', '#1864ab', MS3PRO_EVO_C1, { x: 40, y: 40 }, 'ecu'),
      cavityNode('ecu-c2', 'ECU-C2', 'MS3Pro Evo C2', '#1864ab', MS3PRO_EVO_C2, { x: 40, y: 900 }, 'ecu'),
      cavityNode('pdm',    'AIM PDM32', 'AIM PDM32',   '#5c2d91', AIM_PDM32,     { x: 500, y: 40 }, 'pdm'),
      cavityNode('tps',    'TPS',       'TPS',          '#0c8599', SENSOR_DEFAULTS['TPS'],    { x: 900, y: 40 },  'sensor'),
      cavityNode('map',    'MAP',       'MAP',          '#0c8599', SENSOR_DEFAULTS['MAP'],    { x: 900, y: 130 }, 'sensor'),
      cavityNode('clt',    'CLT',       'CLT',          '#0c8599', SENSOR_DEFAULTS['CLT'],    { x: 900, y: 220 }, 'sensor'),
      cavityNode('iat',    'IAT',       'IAT',          '#0c8599', SENSOR_DEFAULTS['IAT'],    { x: 900, y: 290 }, 'sensor'),
      cavityNode('crank',  'Crank Position', 'Crank Position', '#0c8599', SENSOR_DEFAULTS['Crank Position'], { x: 900, y: 380 }, 'sensor'),
      cavityNode('cam1',   'Cam Position',   'Cam 1 (Bank 1)', '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: 900, y: 470 }, 'sensor'),
      cavityNode('cam2',   'Cam Position',   'Cam 2 (Bank 2)', '#0c8599', SENSOR_DEFAULTS['Cam Position'],   { x: 900, y: 560 }, 'sensor'),
      cavityNode('lambda1','Lambda / WBO2',  'Lambda Bank 1',  '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'],  { x: 900, y: 650 }, 'sensor'),
      cavityNode('lambda2','Lambda / WBO2',  'Lambda Bank 2',  '#0c8599', SENSOR_DEFAULTS['Lambda / WBO2'],  { x: 1100, y: 40 }, 'sensor'),
      cavityNode('oilp',   'Oil Pressure',   'Oil Pressure',   '#0c8599', SENSOR_DEFAULTS['Oil Pressure'],   { x: 1100, y: 130 }, 'sensor'),
      cavityNode('oilt',   'Oil Temp',       'Oil Temp',       '#0c8599', SENSOR_DEFAULTS['Oil Temp'],       { x: 1100, y: 220 }, 'sensor'),
      groundBlockNode('gnd-block-4', 4, 'Sensor GND Block', { x: 1100, y: 320 }),
      groundBlockNode('gnd-block-8', 8, 'Main GND Block',   { x: 1100, y: 560 }),
      groundNode('gnd-chassis', 'GND', 'Chassis', { x: 1100, y: 850 }),
      spliceNode('sp-5v', '5V Ref', { x: 700, y: 40 }),
    ],
    edges: [],
  },
];
