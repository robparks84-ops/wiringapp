// ── CAN Signal & Frame ───────────────────────────────────────────────────────

export type ByteOrder = 'intel' | 'motorola';

export interface CANSignal {
  id: string;
  name: string;
  startBit: number;
  bitLength: number;
  byteOrder: ByteOrder;
  signed: boolean;
  scale: number;
  offset: number;
  unit: string;
  minValue?: number;
  maxValue?: number;
  channelRef?: string;
}

export interface CANFrame {
  id: number;
  extended: boolean;
  data: number[]; // 8 bytes (plain array for JSON-safe persistence)
  signals: CANSignal[];
  label?: string;
}

// ── Channel / Simulation ─────────────────────────────────────────────────────

export type SimWaveform = 'sine' | 'ramp' | 'random-walk' | 'constant' | 'step';

export interface ChannelDefinition {
  id: string;
  name: string;
  unit: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  waveform: SimWaveform;
  waveformPeriodMs: number;
  noiseAmplitude: number;
  canFrameId?: number;
  canSignalId?: string;
}

export interface ChannelValue {
  channelId: string;
  value: number;
  timestamp: number;
}

export interface SimulationConfig {
  running: boolean;
  updateRateHz: number;
}

// ── Presets ──────────────────────────────────────────────────────────────────

export interface CANPreset {
  id: string;
  name: string;
  description: string;
  baud: string;
  channels: ChannelDefinition[];
  frames: CANFrame[];
}

// ── Lua ──────────────────────────────────────────────────────────────────────

export interface LuaRuntimeState {
  running: boolean;
  tickRateHz: number;
  consoleLines: string[];
  lastError: string | null;
  scriptSource: string;
}
