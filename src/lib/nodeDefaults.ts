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

export const DT_2: Cavity[]  = Array.from({ length: 2  }, (_, i) => c(`Cav ${i + 1}`));
export const DT_3: Cavity[]  = Array.from({ length: 3  }, (_, i) => c(`Cav ${i + 1}`));
export const DT_4: Cavity[]  = Array.from({ length: 4  }, (_, i) => c(`Cav ${i + 1}`));
export const DT_6: Cavity[]  = Array.from({ length: 6  }, (_, i) => c(`Cav ${i + 1}`));
export const DT_8: Cavity[]  = Array.from({ length: 8  }, (_, i) => c(`Cav ${i + 1}`));
export const DT_12: Cavity[] = Array.from({ length: 12 }, (_, i) => c(`Cav ${i + 1}`));
export const DTM_2: Cavity[] = Array.from({ length: 2  }, (_, i) => c(`Cav ${i + 1}`));
export const DTM_3: Cavity[] = Array.from({ length: 3  }, (_, i) => c(`Cav ${i + 1}`));
export const DTM_4: Cavity[] = Array.from({ length: 4  }, (_, i) => c(`Cav ${i + 1}`));
export const DTM_6: Cavity[] = Array.from({ length: 6  }, (_, i) => c(`Cav ${i + 1}`));
export const DTP_2: Cavity[] = Array.from({ length: 2  }, (_, i) => c(`Cav ${i + 1}`));
export const DTP_4: Cavity[] = Array.from({ length: 4  }, (_, i) => c(`Cav ${i + 1}`));
export const BULKHEAD_8: Cavity[]  = ['A','B','C','D','E','F','G','H'].map((l) => c(l));
export const BULKHEAD_12: Cavity[] = ['A','B','C','D','E','F','G','H','J','K','L','M'].map((l) => c(l));
export const BULKHEAD_16: Cavity[] = Array.from({ length: 16 }, (_, i) => c(String.fromCharCode(65 + i)));

/** Generic cavity array of n pins */
export function connectorCavities(pinCount: number): Cavity[] {
  return Array.from({ length: pinCount }, (_, i) => c(`Cav ${i + 1}`));
}

// ─── MS3Pro Evo ──────────────────────────────────────────────────────────────
// White connector (35-pin)
export const MS3PRO_EVO_WHITE: Cavity[] = [
  c('1 – High current out 1'),  c('2 – High current out 2'),  c('3 – Injector out J'),
  c('4 – Injector out I'),      c('5 – High current out 3'),  c('6 – CKP+'),
  c('7 – Knock In 2'),          c('8 – 5V+ VREF out'),        c('9 – TPS in'),
  c('10 – MAT in'),             c('11 – CLT in'),             c('12 – Analog In 6'),
  c('13 – Logic Ground'),       c('14 – PWM / Idle Out 1'),   c('15 – CKP-'),
  c('16 – Ground'),             c('17 – Analog In 7'),        c('18 – Sensor return'),
  c('19 – Analog in 1'),        c('20 – Analog in 2'),        c('21 – Analog in 3'),
  c('22 – Analog In 4'),        c('23 – Analog In 5'),        c('24 – Tach out'),
  c('25 – O2 in'),              c('26 – CMP+'),               c('27 – CMP-'),
  c('28 – Fuel pump relay out'),c('29 – PWM out 2'),          c('30 – PWM out 3'),
  c('31 – Knock in 1'),         c('32 – Digital switched in 1'), c('33 – CAN L'),
  c('34 – CAN H'),              c('35 – 12V+ switched power in'),
];

// Gray connector (35-pin)
export const MS3PRO_EVO_GRAY: Cavity[] = [
  c('1 – Injector out A'),      c('2 – Injector out B'),      c('3 – Ground'),
  c('4 – Injector out C'),      c('5 – Ground'),              c('6 – Injector out D'),
  c('7 – Ground'),              c('8 – Injector out E'),      c('9 – Ground'),
  c('10 – Injector out F'),     c('11 – Injector out G'),     c('12 – Injector out H'),
  c('13 – Spark out G'),        c('14 – Spark out E'),        c('15 – Spark out C'),
  c('16 – Spark out H'),        c('17 – Digital frequency in 2'), c('18 – Ground'),
  c('19 – Digital switched 12V in'), c('20 – Digital switched in 2'), c('21 – Digital frequency in 3'),
  c('22 – Digital Freq in 3 VR+'), c('23 – Digital Freq In 3 VR-'), c('24 – Spark out F'),
  c('25 – Spark out B'),        c('26 – Spark out D'),        c('27 – Spark out A'),
  c('28 – Digital frequency in 1'), c('29 – Digital switched in 3'), c('30 – Stepper IAC out 1B'),
  c('31 – Stepper IAC out 1A'), c('32 – Stepper IAC out 2A'), c('33 – Stepper IAC out 2B'),
  c('34 – Digital Freq in 1 VR+'), c('35 – Digital Freq in 1 VR-'),
];

// Backward-compat aliases
export const MS3PRO_EVO_C1 = MS3PRO_EVO_WHITE;
export const MS3PRO_EVO_C2 = MS3PRO_EVO_GRAY;

// ─── AIM PDM32 ───────────────────────────────────────────────────────────────
// Black connector (35-pin)
export const AIM_PDM32_BLACK: Cavity[] = [
  c('1 – High power output 1 *'), c('2 – Mid power output 1'),   c('3 – Mid power output 2'),
  c('4 – Mid power output 3'),    c('5 – Mid power output 4'),   c('6 – Mid power output 5'),
  c('7 – Mid power output 6'),    c('8 – Mid power output 7'),   c('9 – Mid power output 8'),
  c('10 – GND'),                  c('11 – CAN AiM Low'),         c('12 – High power output 2'),
  c('13 – High power output 1 *'),c('14 – Low power output 1'),  c('15 – Low power output 2'),
  c('16 – Low power output 3'),   c('17 – Low power output 4'),  c('18 – Low power output 5'),
  c('19 – Low power output 6'),   c('20 – Low power output 7'),  c('21 – Low power output 8'),
  c('22 – CAN AiM High'),         c('23 – High power output 2'), c('24 – High power output 3'),
  c('25 – High power output 3'),  c('26 – Channel input 11'),    c('27 – Channel input 12'),
  c('28 – CAN2 High'),            c('29 – CAN2 Low'),            c('30 – CAN ECU High/RS232TX'),
  c('31 – CAN ECU Low/RS232RX'),  c('32 – +Vb ext CAN'),         c('33 – +Vb out CAN'),
  c('34 – High power output 4'),  c('35 – High power output 4'),
];

// Gray connector (35-pin)
export const AIM_PDM32_GRAY: Cavity[] = [
  c('1 – Half bridge power out 1'), c('2 – Half bridge power out 1'), c('3 – Low power output 9'),
  c('4 – Mid power output 9'),      c('5 – Mid power output 10'),     c('6 – Low power output 10'),
  c('7 – Low power output 11'),     c('8 – Mid power output 11'),     c('9 – Mid power output 12'),
  c('10 – Low power output 12'),    c('11 – Half bridge power out 2'),c('12 – Half bridge power out 2'),
  c('13 – P GND'),                  c('14 – P GND'),                  c('15 – LIN'),
  c('16 – +5V Analog Vreference'), c('17 – +Vb output'),              c('18 – GND'),
  c('19 – Speed 2 input'),          c('20 – Speed 1 input'),          c('21 – Channel input 9'),
  c('22 – Channel input 10'),       c('23 – Ignition'),               c('24 – Half bridge power out 3'),
  c('25 – Half bridge power out 3'),c('26 – Channel input 1'),        c('27 – Channel input 2'),
  c('28 – Channel input 3'),        c('29 – Channel input 4'),        c('30 – Channel input 5'),
  c('31 – Channel input 6'),        c('32 – Channel input 7'),        c('33 – Channel input 8'),
  c('34 – Half bridge power out 4'),c('35 – Half bridge power out 4'),
];

// Backward-compat alias
export const AIM_PDM32 = AIM_PDM32_BLACK;

// ─── Sensors ────────────────────────────────────────────────────────────────

export const SENSOR_DEFAULTS: Record<string, Cavity[]> = {
  TPS:              [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  MAP:              [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  MAF:              [c('Signal'), c('+12V'), c('GND')],
  CLT:              [c('Signal'), c('Sensor GND')],
  IAT:              [c('Signal'), c('Sensor GND')],
  'Oil Pressure':   [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  'Fuel Pressure':  [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  'Lambda / WBO2':  [c('Signal +'), c('Signal -'), c('Heater +'), c('Heater -')],
  'Cam Position':   [c('Signal'), c('+12V'), c('GND')],
  'Crank Position': [c('VR +'), c('VR -')],
  'Oil Temp':       [c('Signal'), c('Sensor GND')],
  'Diff Temp':      [c('Signal'), c('Sensor GND')],
  'Trans Temp':     [c('Signal'), c('Sensor GND')],
  'Front Brake Pressure': [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  'Rear Brake Pressure':  [c('Signal'), c('+5V Ref'), c('Sensor GND')],
  'Knock Sensor 1': [c('Signal'), c('Sensor GND')],
  'Knock Sensor 2': [c('Signal'), c('Sensor GND')],
  Custom:           [c('Signal'), c('+5V Ref'), c('Sensor GND')],
};

// ─── Devices ────────────────────────────────────────────────────────────────

export const DEVICE_DEFAULTS: Record<string, Cavity[]> = {
  'CAN Keypad':       [c('CAN H'), c('CAN L'), c('+12V'), c('GND')],
  'Battery':          [c('+12V'), c('GND')],
  'Coil Pack 1':      [c('Signal'), c('+12V'), c('GND')],
  'Coil Pack 2':      [c('Signal'), c('+12V'), c('GND')],
  'Coil Pack 3':      [c('Signal'), c('+12V'), c('GND')],
  'Coil Pack 4':      [c('Signal'), c('+12V'), c('GND')],
  'Fuel Pump':        [c('+12V'), c('GND'), c('Signal')],
  'Defroster':        [c('+12V'), c('GND')],
  'Vanos Solenoid':   [c('Pin 1'), c('Pin 2')],
  'Flagtronics':      [c('+12V'), c('GND'), c('CAN H'), c('CAN L')],
  'Cool Shirt':       [c('+12V In'), c('+12V Out'), c('GND')],
  'Battery Isolator': [c('+12V In'), c('+12V Out'), c('GND'), c('Remote Signal')],
  'TPMS Controller':  [c('+12V'), c('GND'), c('CAN H'), c('CAN L'), c('Antenna')],
  'Starter':          [c('+12V Main'), c('Trigger'), c('GND')],
  'Alternator':       [c('B+ Output'), c('Field'), c('Sense'), c('GND')],
  'Radiator Fan':     [c('+12V'), c('GND'), c('PWM Signal')],
  'Driver Fan':       [c('+12V'), c('GND')],
  'GoPro Camera':     [c('+5V'), c('GND'), c('Control'), c('Trigger')],
  'RaceCapture':      [c('+12V'), c('GND'), c('CAN H'), c('CAN L'), c('GPS Ant'), c('USB')],
  'WiFi Unit':        [c('+5V'), c('GND'), c('Serial TX'), c('Serial RX')],
  'Thin Client':      [c('+12V'), c('GND'), c('HDMI'), c('USB'), c('ETH')],
  'Injector 1':       [c('+12V'), c('Signal')],
  'Injector 2':       [c('+12V'), c('Signal')],
  'Injector 3':       [c('+12V'), c('Signal')],
  'Injector 4':       [c('+12V'), c('Signal')],
  'Injector 5':       [c('+12V'), c('Signal')],
  'Injector 6':       [c('+12V'), c('Signal')],
  'Injector 7':       [c('+12V'), c('Signal')],
  'Injector 8':       [c('+12V'), c('Signal')],
  'Quad Spark 1':     [c('Coil A Signal'), c('Coil B Signal'), c('+12V'), c('GND')],
  'Quad Spark 2':     [c('Coil C Signal'), c('Coil D Signal'), c('+12V'), c('GND')],
};

// ─── Ground Block ───────────────────────────────────────────────────────────

export function groundBlockCavities(posts: number): Cavity[] {
  return [
    c('Main Stud'),
    ...Array.from({ length: posts }, (_, i) => c(`Post ${i + 1}`)),
  ];
}

// ─── Header colors ──────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  DT:              '#1971c2',
  DTM:             '#2f9e44',
  DTP:             '#e67700',
  AT:              '#c92a2a',
  ATM:             '#862e9c',
  Bulkhead:        '#495057',
  'ECU-White':     '#1864ab',
  'ECU-Gray':      '#495057',
  // backward compat
  'ECU-C1':        '#1864ab',
  'ECU-C2':        '#495057',
  'PDM32-Black':   '#212529',
  'PDM32-Gray':    '#868e96',
  // backward compat
  'AIM PDM32':     '#212529',
  Sensor:          '#0c8599',
  Blank:           '#495057',
  GroundBlock:     '#212529',
  Device:          '#5f3dc4',
};
