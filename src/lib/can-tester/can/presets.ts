import { CANPreset } from '../types';

let _id = 0;
const uid = () => `preset-sig-${++_id}`;

// ── SIGNAL COLORS (for UI display) ────────────────────────────────────────────
// Colors assigned per preset channel for dashboard consistency

// ── MS3Pro Evo ────────────────────────────────────────────────────────────────
// CAN broadcast stream compatible with AIM/RaceCapture.
// Base ID 0x0CE0 — set in TunerStudio → CAN/Serial Settings.
// All signals big-endian (Motorola byte order), 16-bit unsigned unless noted.
export const MS3PRO_EVO_PRESET: CANPreset = {
  id: 'ms3pro-evo',
  name: 'MS3Pro Evo',
  description: 'MegaSquirt 3 Pro Evo — AIM/RaceCapture CAN stream (base 0x0CE0). Configure matching base ID in TunerStudio.',
  baud: '1 Mbit/s',
  channels: [
    { id: 'ms3-rpm',      name: 'RPM',       unit: 'RPM', minValue: 0,    maxValue: 8000, defaultValue: 2500, waveform: 'sine',         waveformPeriodMs: 4000, noiseAmplitude: 50,  canFrameId: 0x0CE0, canSignalId: 'ms3-sig-rpm'  },
    { id: 'ms3-tps',      name: 'TPS',       unit: '%',   minValue: 0,    maxValue: 100,  defaultValue: 20,   waveform: 'ramp',         waveformPeriodMs: 5000, noiseAmplitude: 0.5, canFrameId: 0x0CE0, canSignalId: 'ms3-sig-tps'  },
    { id: 'ms3-map',      name: 'MAP',       unit: 'kPa', minValue: 10,   maxValue: 250,  defaultValue: 100,  waveform: 'sine',         waveformPeriodMs: 4000, noiseAmplitude: 1,   canFrameId: 0x0CE0, canSignalId: 'ms3-sig-map'  },
    { id: 'ms3-clt',      name: 'Coolant',   unit: '°C',  minValue: -40,  maxValue: 130,  defaultValue: 85,   waveform: 'constant',     waveformPeriodMs: 10000, noiseAmplitude: 0.5, canFrameId: 0x0CE0, canSignalId: 'ms3-sig-clt'  },
    { id: 'ms3-iat',      name: 'IAT',       unit: '°C',  minValue: -40,  maxValue: 80,   defaultValue: 30,   waveform: 'constant',     waveformPeriodMs: 10000, noiseAmplitude: 0.2, canFrameId: 0x0CE1, canSignalId: 'ms3-sig-iat'  },
    { id: 'ms3-afr',      name: 'AFR',       unit: 'λ',   minValue: 0.7,  maxValue: 1.5,  defaultValue: 1.0,  waveform: 'sine',         waveformPeriodMs: 2000, noiseAmplitude: 0.01, canFrameId: 0x0CE1, canSignalId: 'ms3-sig-afr'  },
    { id: 'ms3-batt',     name: 'Battery',   unit: 'V',   minValue: 10,   maxValue: 15,   defaultValue: 13.8, waveform: 'constant',     waveformPeriodMs: 5000, noiseAmplitude: 0.1, canFrameId: 0x0CE1, canSignalId: 'ms3-sig-batt' },
    { id: 'ms3-fp',       name: 'Fuel Pres', unit: 'kPa', minValue: 0,    maxValue: 500,  defaultValue: 300,  waveform: 'constant',     waveformPeriodMs: 5000, noiseAmplitude: 5,   canFrameId: 0x0CE1, canSignalId: 'ms3-sig-fp'   },
    { id: 'ms3-ign',      name: 'Ignition',  unit: '°',   minValue: -10,  maxValue: 50,   defaultValue: 25,   waveform: 'sine',         waveformPeriodMs: 3000, noiseAmplitude: 0.5, canFrameId: 0x0CE2, canSignalId: 'ms3-sig-ign'  },
    { id: 'ms3-speed',    name: 'Speed',     unit: 'km/h',minValue: 0,    maxValue: 250,  defaultValue: 80,   waveform: 'ramp',         waveformPeriodMs: 8000, noiseAmplitude: 1,   canFrameId: 0x0CE2, canSignalId: 'ms3-sig-speed'},
    { id: 'ms3-op',       name: 'Oil Pres',  unit: 'kPa', minValue: 0,    maxValue: 700,  defaultValue: 400,  waveform: 'constant',     waveformPeriodMs: 5000, noiseAmplitude: 10,  canFrameId: 0x0CE2, canSignalId: 'ms3-sig-op'   },
    { id: 'ms3-gear',     name: 'Gear',      unit: '',    minValue: 0,    maxValue: 6,    defaultValue: 3,    waveform: 'step',         waveformPeriodMs: 6000, noiseAmplitude: 0,   canFrameId: 0x0CE2, canSignalId: 'ms3-sig-gear' },
  ],
  frames: [
    {
      id: 0x0CE0, extended: false, data: [0,0,0,0,0,0,0,0], label: 'MS3 Frame 0 — RPM/TPS/MAP/CLT',
      signals: [
        { id: 'ms3-sig-rpm',   name: 'RPM',      startBit: 7,  bitLength: 16, byteOrder: 'motorola', signed: false, scale: 1,     offset: 0,   unit: 'RPM', minValue: 0,   maxValue: 8000 },
        { id: 'ms3-sig-tps',   name: 'TPS',      startBit: 23, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.1,   offset: 0,   unit: '%',   minValue: 0,   maxValue: 100  },
        { id: 'ms3-sig-map',   name: 'MAP',      startBit: 39, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.1,   offset: 0,   unit: 'kPa', minValue: 10,  maxValue: 250  },
        { id: 'ms3-sig-clt',   name: 'Coolant',  startBit: 55, bitLength: 16, byteOrder: 'motorola', signed: true,  scale: 0.1,   offset: 0,   unit: '°C',  minValue: -40, maxValue: 130  },
      ],
    },
    {
      id: 0x0CE1, extended: false, data: [0,0,0,0,0,0,0,0], label: 'MS3 Frame 1 — IAT/AFR/Battery/FuelPres',
      signals: [
        { id: 'ms3-sig-iat',   name: 'IAT',      startBit: 7,  bitLength: 16, byteOrder: 'motorola', signed: true,  scale: 0.1,   offset: 0,   unit: '°C',  minValue: -40, maxValue: 80   },
        { id: 'ms3-sig-afr',   name: 'AFR',      startBit: 23, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.001, offset: 0,   unit: 'λ',   minValue: 0.7, maxValue: 1.5  },
        { id: 'ms3-sig-batt',  name: 'Battery',  startBit: 39, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.01,  offset: 0,   unit: 'V',   minValue: 10,  maxValue: 15   },
        { id: 'ms3-sig-fp',    name: 'Fuel Pres',startBit: 55, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.1,   offset: 0,   unit: 'kPa', minValue: 0,   maxValue: 500  },
      ],
    },
    {
      id: 0x0CE2, extended: false, data: [0,0,0,0,0,0,0,0], label: 'MS3 Frame 2 — Ignition/Speed/OilPres/Gear',
      signals: [
        { id: 'ms3-sig-ign',   name: 'Ignition', startBit: 7,  bitLength: 16, byteOrder: 'motorola', signed: true,  scale: 0.1,   offset: 0,   unit: '°',   minValue: -10, maxValue: 50   },
        { id: 'ms3-sig-speed', name: 'Speed',    startBit: 23, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.1,   offset: 0,   unit: 'km/h',minValue: 0,   maxValue: 250  },
        { id: 'ms3-sig-op',    name: 'Oil Pres', startBit: 39, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.1,   offset: 0,   unit: 'kPa', minValue: 0,   maxValue: 700  },
        { id: 'ms3-sig-gear',  name: 'Gear',     startBit: 55, bitLength: 8,  byteOrder: 'motorola', signed: false, scale: 1,     offset: 0,   unit: '',    minValue: 0,   maxValue: 6    },
      ],
    },
  ],
};

// ── AIM PDM32 ─────────────────────────────────────────────────────────────────
// AIM proprietary CAN protocol. IDs are representative of AIM RS3/PDM32
// serial communication. Confirm against Race Studio configuration.
export const AIM_PDM32_PRESET: CANPreset = {
  id: 'aim-pdm32',
  name: 'AIM PDM32',
  description: 'AIM PDM32 power distribution module — output status & current broadcast. Verify IDs against Race Studio config.',
  baud: '1 Mbit/s',
  channels: [
    { id: 'pdm-out-status',  name: 'Out Status 1-8',  unit: 'bits', minValue: 0, maxValue: 255, defaultValue: 0xFF, waveform: 'constant', waveformPeriodMs: 1000, noiseAmplitude: 0 },
    { id: 'pdm-total-amps',  name: 'Total Current',   unit: 'A',    minValue: 0, maxValue: 100, defaultValue: 15,   waveform: 'sine',     waveformPeriodMs: 5000, noiseAmplitude: 0.5 },
    { id: 'pdm-out1-amps',   name: 'Output 1 Amps',   unit: 'A',    minValue: 0, maxValue: 30,  defaultValue: 5,    waveform: 'constant', waveformPeriodMs: 5000, noiseAmplitude: 0.2 },
    { id: 'pdm-out2-amps',   name: 'Output 2 Amps',   unit: 'A',    minValue: 0, maxValue: 30,  defaultValue: 3,    waveform: 'constant', waveformPeriodMs: 5000, noiseAmplitude: 0.1 },
    { id: 'pdm-out3-amps',   name: 'Output 3 Amps',   unit: 'A',    minValue: 0, maxValue: 30,  defaultValue: 2,    waveform: 'constant', waveformPeriodMs: 5000, noiseAmplitude: 0.1 },
    { id: 'pdm-out4-amps',   name: 'Output 4 Amps',   unit: 'A',    minValue: 0, maxValue: 30,  defaultValue: 1,    waveform: 'constant', waveformPeriodMs: 5000, noiseAmplitude: 0.1 },
  ],
  frames: [
    {
      id: 0x0064, extended: false, data: [0xFF, 0xFF, 0, 150, 0, 0, 0, 0], label: 'PDM32 — Output Status & Total Current',
      signals: [
        { id: uid(), name: 'Output Status 1-8',  startBit: 0,  bitLength: 8,  byteOrder: 'intel', signed: false, scale: 1,   offset: 0, unit: 'bits' },
        { id: uid(), name: 'Output Status 9-16', startBit: 8,  bitLength: 8,  byteOrder: 'intel', signed: false, scale: 1,   offset: 0, unit: 'bits' },
        { id: uid(), name: 'Total Current',      startBit: 16, bitLength: 16, byteOrder: 'intel', signed: false, scale: 0.1, offset: 0, unit: 'A' },
      ],
    },
    {
      id: 0x0065, extended: false, data: [0,0,0,0,0,0,0,0], label: 'PDM32 — Output Currents 1-4',
      signals: [
        { id: uid(), name: 'Output 1 Current', startBit: 0,  bitLength: 16, byteOrder: 'intel', signed: false, scale: 0.01, offset: 0, unit: 'A' },
        { id: uid(), name: 'Output 2 Current', startBit: 16, bitLength: 16, byteOrder: 'intel', signed: false, scale: 0.01, offset: 0, unit: 'A' },
        { id: uid(), name: 'Output 3 Current', startBit: 32, bitLength: 16, byteOrder: 'intel', signed: false, scale: 0.01, offset: 0, unit: 'A' },
        { id: uid(), name: 'Output 4 Current', startBit: 48, bitLength: 16, byteOrder: 'intel', signed: false, scale: 0.01, offset: 0, unit: 'A' },
      ],
    },
    {
      id: 0x0066, extended: false, data: [0xFF, 0xFF, 0, 0, 0, 0, 0, 0], label: 'PDM32 — Output Enable Command (Rx)',
      signals: [
        { id: uid(), name: 'Enable 1-8',  startBit: 0, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
        { id: uid(), name: 'Enable 9-16', startBit: 8, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
      ],
    },
  ],
};

// ── Flagtronics FT200 ─────────────────────────────────────────────────────────
// Wireless flag status receiver. Broadcasts flag color + sector data.
export const FLAGTRONICS_FT200_PRESET: CANPreset = {
  id: 'flagtronics-ft200',
  name: 'Flagtronics FT200',
  description: 'Flagtronics FT200 wireless flag receiver — CAN flag status broadcast.',
  baud: '500 kbit/s',
  channels: [
    { id: 'flag-color',    name: 'Flag Color',      unit: '',  minValue: 0, maxValue: 7,   defaultValue: 0, waveform: 'step',     waveformPeriodMs: 8000, noiseAmplitude: 0 },
    { id: 'flag-sector',   name: 'Sector',          unit: '',  minValue: 0, maxValue: 255, defaultValue: 1, waveform: 'step',     waveformPeriodMs: 10000, noiseAmplitude: 0 },
    { id: 'flag-rssi',     name: 'Signal Strength', unit: '%', minValue: 0, maxValue: 100, defaultValue: 85, waveform: 'constant', waveformPeriodMs: 5000, noiseAmplitude: 3 },
    { id: 'flag-batt',     name: 'Battery',         unit: '%', minValue: 0, maxValue: 100, defaultValue: 90, waveform: 'ramp',    waveformPeriodMs: 60000, noiseAmplitude: 0 },
  ],
  frames: [
    {
      id: 0x00FF, extended: false, data: [0, 1, 85, 90, 0, 0, 0, 0], label: 'FT200 — Flag Status',
      signals: [
        { id: uid(), name: 'Flag Color',      startBit: 0,  bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: '',
          // 0=none 1=green 2=yellow 3=red 4=blue 5=white 6=checkered 7=SC
        },
        { id: uid(), name: 'Sector',          startBit: 8,  bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: '' },
        { id: uid(), name: 'Signal Strength', startBit: 16, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: '%' },
        { id: uid(), name: 'Battery Level',   startBit: 24, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: '%' },
      ],
    },
  ],
};

// ── Blink Marine PKP-2600-SI ──────────────────────────────────────────────────
// 12-button CANopen keypad. Default node ID = 1.
// TPDO1 = 0x180 + nodeID, RPDO1 = 0x200 + nodeID
export const BLINK_MARINE_KEYPAD_PRESET: CANPreset = {
  id: 'blink-marine-pkp2600',
  name: 'Blink Marine PKP-2600-SI',
  description: '12-button CANopen keypad. Default node ID=1. TPDO1=0x181 (button states), RPDO1=0x201 (LED control).',
  baud: '250 kbit/s',
  channels: [
    { id: 'bm-btn-1-8',  name: 'Buttons 1-8',    unit: 'bits', minValue: 0, maxValue: 255, defaultValue: 0, waveform: 'constant', waveformPeriodMs: 1000, noiseAmplitude: 0 },
    { id: 'bm-btn-9-12', name: 'Buttons 9-12',   unit: 'bits', minValue: 0, maxValue: 15,  defaultValue: 0, waveform: 'constant', waveformPeriodMs: 1000, noiseAmplitude: 0 },
    { id: 'bm-led-1-8',  name: 'LED State 1-8',  unit: 'bits', minValue: 0, maxValue: 255, defaultValue: 0, waveform: 'constant', waveformPeriodMs: 1000, noiseAmplitude: 0 },
  ],
  frames: [
    {
      id: 0x181, extended: false, data: [0, 0, 0, 0, 0, 0, 0, 0x05], label: 'PKP-2600 TPDO1 — Button States (Tx)',
      signals: [
        { id: uid(), name: 'Buttons 1-8',   startBit: 0,  bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
        { id: uid(), name: 'Buttons 9-12',  startBit: 8,  bitLength: 4, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
        { id: uid(), name: 'LED State 1-8', startBit: 16, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
        { id: uid(), name: 'LED State 9-12',startBit: 24, bitLength: 4, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
      ],
    },
    {
      id: 0x201, extended: false, data: [0, 0, 100, 0, 0, 0, 0, 0], label: 'PKP-2600 RPDO1 — LED Control (Rx)',
      signals: [
        { id: uid(), name: 'LED Control 1-8',  startBit: 0,  bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
        { id: uid(), name: 'LED Control 9-12', startBit: 8,  bitLength: 4, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: 'bits' },
        { id: uid(), name: 'Brightness',       startBit: 16, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: '%' },
      ],
    },
    {
      id: 0x701, extended: false, data: [0x05, 0, 0, 0, 0, 0, 0, 0], label: 'PKP-2600 Heartbeat (Tx)',
      signals: [
        { id: uid(), name: 'Node State', startBit: 0, bitLength: 8, byteOrder: 'intel', signed: false, scale: 1, offset: 0, unit: '',
          // 0x00=bootup, 0x04=stopped, 0x05=operational, 0x7F=pre-operational
        },
      ],
    },
  ],
};

// ── OBD-II Mode 01 ────────────────────────────────────────────────────────────
// Standard OBD-II PID responses on CAN. Request: 0x7DF, Response: 0x7E8.
// Formula per PID baked into scale/offset.
export const OBDII_PRESET: CANPreset = {
  id: 'obdii',
  name: 'OBD-II Mode 01',
  description: 'Standard OBD-II PID response frames. Request ID 0x7DF, Response 0x7E8. Bytes 0-1 are length/mode, signal starts at byte 2.',
  baud: '500 kbit/s',
  channels: [
    { id: 'obd-rpm',     name: 'Engine RPM',   unit: 'RPM',  minValue: 0,   maxValue: 8000, defaultValue: 2000, waveform: 'sine',     waveformPeriodMs: 4000, noiseAmplitude: 30  },
    { id: 'obd-speed',   name: 'Vehicle Speed',unit: 'km/h', minValue: 0,   maxValue: 200,  defaultValue: 80,   waveform: 'ramp',     waveformPeriodMs: 8000, noiseAmplitude: 0   },
    { id: 'obd-clt',     name: 'Coolant Temp', unit: '°C',   minValue: -40, maxValue: 215,  defaultValue: 90,   waveform: 'constant', waveformPeriodMs: 10000, noiseAmplitude: 1  },
    { id: 'obd-tps',     name: 'Throttle Pos', unit: '%',    minValue: 0,   maxValue: 100,  defaultValue: 15,   waveform: 'ramp',     waveformPeriodMs: 5000, noiseAmplitude: 0.5 },
  ],
  frames: [
    {
      id: 0x7DF, extended: false, data: [0x02, 0x01, 0x0C, 0, 0, 0, 0, 0], label: 'OBD-II Request — RPM (PID 0x0C)',
      signals: [],
    },
    {
      id: 0x7E8, extended: false, data: [0x04, 0x41, 0x0C, 0x1A, 0xF8, 0, 0, 0], label: 'OBD-II Response — RPM (PID 0x0C, ~1726 RPM)',
      signals: [
        // RPM = ((A*256)+B)/4 where A=byte2, B=byte3
        // As Intel 16-bit at byte 2 with scale=0.25: raw=(A<<8|B) but OBD is big-endian
        { id: uid(), name: 'Engine RPM', startBit: 23, bitLength: 16, byteOrder: 'motorola', signed: false, scale: 0.25, offset: 0, unit: 'RPM', minValue: 0, maxValue: 16383.75 },
      ],
    },
    {
      id: 0x7E8, extended: false, data: [0x03, 0x41, 0x0D, 0x50, 0, 0, 0, 0], label: 'OBD-II Response — Speed (PID 0x0D, 80 km/h)',
      signals: [
        { id: uid(), name: 'Vehicle Speed', startBit: 23, bitLength: 8, byteOrder: 'motorola', signed: false, scale: 1, offset: 0, unit: 'km/h', minValue: 0, maxValue: 255 },
      ],
    },
  ],
};

// ── All presets ───────────────────────────────────────────────────────────────

export const ALL_PRESETS: CANPreset[] = [
  MS3PRO_EVO_PRESET,
  AIM_PDM32_PRESET,
  FLAGTRONICS_FT200_PRESET,
  BLINK_MARINE_KEYPAD_PRESET,
  OBDII_PRESET,
];
