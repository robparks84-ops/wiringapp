export interface Channel {
  name: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  precision?: number;
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
  channelNameY?: string;
  channelNameZ?: string;
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
  lapTime: number | null;
  URI: string;
  raw_data_uri?: string;
  end_time?: string;
  aggregates?: LapAggregate[];
}

export interface LapAggregate {
  name: string;
  min?: number;
  max?: number;
  average?: number;
}

export interface SectorTime {
  sector: number;
  time: number;
  isBestOverall: boolean;
  isBestPersonal: boolean;
}

/** An eventdevice from the Podium API */
export interface PodiumEventDevice {
  id: number;
  URI: string;
  device_uri: string;
  device_id: number;
  event_uri: string;
  event_id: number;
  laps_uri: string;
  alertmessages_uri?: string;
  user_uri?: string;
  name: string;
  comp_number?: string | null;
  source?: string;
  source_ver?: string;
  private?: boolean;
  avatar_url?: string;
  user_avatar_url?: string;
  title?: string;
  lap_count?: number;
  channels: PodiumChannel[];
}

export interface PodiumChannel {
  name: string;
  units: string | null;
  min: number | null;
  max: number | null;
  precision: number | null;
}

export interface Stream {
  /** eventdevice id */
  eventdevice_id: number;
  /** device id (used for telemetry WS) */
  device_id: number;
  device_name: string;
  eventdevice_name: string;
  eventdevice_uri: string;
  device_uri: string;
  event_uri: string;
  laps_uri: string;
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
  formula: string;
  unit: string;
  min: number;
  max: number;
}

export interface LapNote {
  lapNumber: number;
  text: string;
  timestamp: number;
}

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
  eventUrl: string;
  myCarNumber: string;
  enabled: boolean;
}

export type FlagColor = 'green' | 'yellow' | 'red' | 'black' | 'white' | 'checkered' | 'unknown';
