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
  | 'linechart';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  channelName: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  zones: ColorZone[];
  // For G-force widget, second channel for the Y axis
  channelNameY?: string;
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
}

export interface Stream {
  device_serial: string;
  device_name: string;
  eventdevice_name: string;
  eventdevice_uri: string;
  device_uri: string;
  event_uri: string;
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
