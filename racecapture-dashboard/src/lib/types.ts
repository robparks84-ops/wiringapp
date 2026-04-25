export interface Channel {
  name: string;
  value: number;
  unit: string;
}

export interface ChannelHistory {
  timestamp: number;
  distance: number;
  value: number;
}

export interface ColorZone {
  upTo: number;
  color: string;
}

export type WidgetType =
  | 'dial'
  | 'gforce'
  | 'digital'
  | 'hbar'
  | 'vbar'
  | 'linechart'
  | 'gear'
  | 'inputtrace';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  channelName: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  zones: ColorZone[];
  channelNameY?: string; // second axis for gforce / inputtrace
  channelNameZ?: string; // third axis for inputtrace (steering)
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  gridLayout: GridItem[];
}

export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface ChannelStats {
  min: number;
  max: number;
  sum: number;
  count: number;
}

export interface Lap {
  id: string;
  lapNumber: number;
  lapTime: number;
  startTime: string;
  endTime: string;
  uri: string;
  sectors?: SectorTime[];
  flagged?: boolean;
}

export interface SectorTime {
  sector: number;
  time: number;
  isBestOverall: boolean;
  isBestPersonal: boolean;
}

export interface Stream {
  device_serial: string;
  device_name: string;
  eventdevice_name: string;
  eventdevice_uri: string;
  device_uri: string;
  event_uri: string;
  laps_uri?: string;
  channels: Channel[];
}

export interface AlarmRule {
  id: string;
  channelName: string;
  condition: 'above' | 'below';
  threshold: number;
  severity: 'warning' | 'danger';
  message: string;
  latched: boolean;
}

export interface AlarmEvent {
  id: string;
  ruleId: string;
  channelName: string;
  value: number;
  severity: 'warning' | 'danger';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface MathChannel {
  id: string;
  name: string;
  formula: string; // e.g. "RPM * TPS / 100" — channel names reference live values
  unit: string;
  min: number;
  max: number;
}

export interface LapNote {
  lapNumber: number;
  text: string;
  timestamp: number;
}

// Champcar / live timing
export interface TimingEntry {
  position: number;
  carNumber: string;
  driverName: string;
  className: string;
  totalTime: string;
  lapCount: number;
  bestLap: string;
  lastLap: string;
  gap: string;
  gapToNext: string;
  onTrack: boolean;
}

export interface ChampcarConfig {
  eventUrl: string;        // Speedhive or Race Monitor event URL
  myCarNumber: string;     // to highlight own car
  enabled: boolean;
}

export type FlagColor = 'green' | 'yellow' | 'red' | 'black' | 'white' | 'checkered' | 'unknown';
