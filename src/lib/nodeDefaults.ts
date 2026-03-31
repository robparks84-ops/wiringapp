// Default cavity data for all node types

export interface Cavity {
  id: string;
  label: string;
}

export interface CavityNodeData {
  label: string;
  subtype: string;
  category: 'connector' | 'ecu' | 'pdm' | 'sensor' | 'blank' | 'groundBlock';
  cavities: Cavity[];
  headerColor: string;
  [key: string]: unknown;
}

function c(label: string): Cavity {
  return { id: Math.random().toString(36).slice(2), label };
}

// ─── Deutsch Connectors ────────────────────────────────────────────────────

export const DT_4: Cavity[] = [c('Cav 1'), c('Cav 2'), c('Cav 3'), c('Cav 4')];
export const DT_6: Cavity[] = Array.from({ length: 6 }, (_, i) => c(`Cav ${i + 1}`));
export const DT_8: Cavity[] = Array.from({ length: 8 }, (_, i) => c(`Cav ${i + 1}`));
export const DT_12: Cavity[] = Array.from({ length: 12 }, (_, i) => c(`Cav ${i + 1}`));
export const DTM_4: Cavity[] = Array.from({ length: 4 }, (_, i) => c(`Cav ${i + 1}`));
export const DTM_6: Cavity[] = Array.from({ length: 6 }, (_, i) => c(`Cav ${i + 1}`));
export const DTP_4: Cavity[] = Array.from({ length: 4 }, (_, i) => c(`Cav ${i + 1}`));
export const BULKHEAD_8: Cavity[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((l) => c(l));

// ─── MS3Pro Evo ─────────────────────────────────────────────────────────────

export const MS3PRO_EVO_C1: Cavity[] = [
  c('1 – GND'), c('2 – GND'), c('3 – BATT +12V'), c('4 – IGN +12V'), c('5 – IGN +12V'),
  c('6 – Tach Out'), c('7 – Idle (IAC)'), c('8 – Fuel Pump'), c('9 – Fan Relay'),
  c('10 – A/C Relay'), c('11 – CEL'), c('12 – Boost Ctrl'), c('13 – VVT 1'),
  c('14 – VVT 2'), c('15 – PWM 3'), c('16 – Crank+ (VR1+)'), c('17 – Crank- (VR1-)'),
  c('18 – Cam+ (VR2+)'), c('19 – Cam- (VR2-)'), c('20 – Cam2+ (VR3+)'), c('21 – Cam2- (VR3-)'),
  c('22 – Dig Freq 1'), c('23 – Dig Freq 2'), c('24 – Dig Freq 3'),
  c('25 – INJ 1'), c('26 – INJ 2'), c('27 – INJ 3'), c('28 – INJ 4'),
  c('29 – INJ 5'), c('30 – INJ 6'), c('31 – INJ 7'), c('32 – INJ 8'),
  c('33 – IGN 1'), c('34 – IGN 2'),
];

export const MS3PRO_EVO_C2: Cavity[] = [
  c('1 – IGN 3'), c('2 – IGN 4'), c('3 – IGN 5'), c('4 – IGN 6'),
  c('5 – IGN 7'), c('6 – IGN 8'),
  c('7 – TPS'), c('8 – MAP'), c('9 – CLT'), c('10 – IAT'),
  c('11 – O2 / Lambda'), c('12 – Knock 1'), c('13 – Knock 2'),
  c('14 – EGT 1'), c('15 – EGT 2'),
  c('16 – Analog 3'), c('17 – Analog 4'), c('18 – Analog 5'), c('19 – Analog 6'),
  c('20 – Analog 7'), c('21 – Analog 8'), c('22 – Analog 9'), c('23 – Analog 10'),
  c('24 – Batt Voltage'), c('25 – CAN H'), c('26 – CAN L'),
  c('27 – USB D+'), c('28 – USB D-'),
  c('29 – +5V Ref 1'), c('30 – +5V Ref 2'),
  c('31 – Sensor GND 1'), c('32 – Sensor GND 2'), c('33 – Sensor GND 3'), c('34 – Sensor GND 4'),
  c('35 – Dig Switch 1'), c('36 – Dig Switch 2'), c('37 – Dig Switch 3'), c('38 – Dig Switch 4'),
  c('39 – Step 1A'), c('40 – Step 1B'),
];

// ─── AIM PDM32 ──────────────────────────────────────────────────────────────

export const AIM_PDM32: Cavity[] = [
  // Power / signal
  c('BATT + (1)'), c('BATT + (2)'), c('GND (1)'), c('GND (2)'),
  c('Key Switch +'), c('CAN H'), c('CAN L'),
  // High-current outputs 1–16 (25 A max)
  ...Array.from({ length: 16 }, (_, i) => c(`OUT ${i + 1} (H)`)),
  // Low-current outputs 17–32 (10 A max)
  ...Array.from({ length: 16 }, (_, i) => c(`OUT ${i + 17} (L)`)),
];

// ─── Sensors ────────────────────────────────────────────────────────────────

export const SENSOR_DEFAULTS: Record<string, Cavity[]> = {
  TPS:         [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  MAP:         [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  MAF:         [c('Signal'), c('+12V'), c('GND')],
  CLT:         [c('Signal'), c('Sensor GND')],
  IAT:         [c('Signal'), c('Sensor GND')],
  'Oil Pressure':  [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  'Fuel Pressure': [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  'Lambda / WBO2': [c('Signal +'), c('Signal -'), c('Heater +'), c('Heater -')],
  'Wheel Speed':   [c('Signal +'), c('Signal -')],
  'Cam Position':  [c('Signal'), c('+12V'), c('GND')],
  'Crank Position':[c('VR +'), c('VR -')],
  'Oil Temp':      [c('Signal'), c('Sensor GND')],
  'Diff Temp':     [c('Signal'), c('Sensor GND')],
  'Trans Temp':    [c('Signal'), c('Sensor GND')],
  Custom:      [c('Signal'), c('+5V Ref'), c('Sensor GND')],
};

// ─── Ground Block ───────────────────────────────────────────────────────────

export function groundBlockCavities(posts: 4 | 8): Cavity[] {
  return [
    c('Main Stud'),
    ...Array.from({ length: posts }, (_, i) => c(`Post ${i + 1}`)),
  ];
}

// ─── Header colors ──────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  DT:            '#1971c2',
  DTM:           '#2f9e44',
  DTP:           '#e67700',
  AT:            '#c92a2a',
  ATM:           '#862e9c',
  Bulkhead:      '#495057',
  'ECU-C1':      '#1864ab',
  'ECU-C2':      '#1864ab',
  'AIM PDM32':   '#5c2d91',
  Sensor:        '#0c8599',
  Blank:         '#495057',
  GroundBlock:   '#212529',
};
