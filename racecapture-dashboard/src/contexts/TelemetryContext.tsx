'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import type { Channel, ChannelHistory, Lap, Stream } from '@/lib/types';
import { getLivestreams, getLaps, getDeviceLiveData } from '@/lib/podiumClient';
import { updateStats, resetStats } from '@/lib/statsAccumulator';
import { loadMathChannels, evaluateMathChannel } from '@/lib/mathChannels';

const POLL_MS = 500;
const HISTORY_SECONDS = 300; // 5 minutes of rolling history

interface TelemetryState {
  channels: Map<string, Channel>;
  history: Map<string, ChannelHistory[]>;
  streams: Stream[];
  activeStream: Stream | null;
  isLive: boolean;
  laps: Lap[];
  selectedLap: Lap | null;
  lapData: Map<string, ChannelHistory[]>;
  graphByDistance: boolean;
  setGraphByDistance: (v: boolean) => void;
  setSelectedLap: (lap: Lap | null) => void;
  setActiveStream: (stream: Stream | null) => void;
  resetSessionStats: () => void;
  connected: boolean;
  lastError: string | null;
}

const TelemetryContext = createContext<TelemetryState>({
  channels: new Map(),
  history: new Map(),
  streams: [],
  activeStream: null,
  isLive: true,
  laps: [],
  selectedLap: null,
  lapData: new Map(),
  graphByDistance: false,
  setGraphByDistance: () => {},
  setSelectedLap: () => {},
  setActiveStream: () => {},
  resetSessionStats: () => {},
  connected: false,
  lastError: null,
});

export function TelemetryProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const [channels, setChannels] = useState<Map<string, Channel>>(new Map());
  const [history, setHistory] = useState<Map<string, ChannelHistory[]>>(new Map());
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);
  const [lapData] = useState<Map<string, ChannelHistory[]>>(new Map());
  const [graphByDistance, setGraphByDistance] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const distanceRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeDeviceIdRef = useRef<string | null>(null);
  const debugFetchedRef = useRef<boolean>(false);

  const handleSetActiveStream = useCallback((s: Stream | null) => {
    setActiveStream(s);
    activeDeviceIdRef.current = s?.device_serial ?? null;
    // Reset history when switching devices
    setLaps([]);
    setSelectedLap(null);
    distanceRef.current = 0;
    setHistory(new Map());
  }, []);

  const isLive = selectedLap === null;

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getLivestreams(token);
      // API returns { total, eventdevices: [...] } — map to Stream shape
      const rawDevices: any[] = data.eventdevices ?? data.streams ?? [];
      const streamList: Stream[] = rawDevices.map((d: any) => ({
        device_serial: String(d.id ?? ''),
        device_name: d.name ?? '',
        eventdevice_name: d.name ?? '',
        eventdevice_uri: d.URI ?? d.uri ?? '',
        device_uri: d.device_uri ?? '',
        event_uri: d.event_uri ?? '',
        laps_uri: d.laps_uri ?? '',
        channels: (d.channels ?? []).map((ch: any) => ({
          name: ch.name,
          value: ch.value ?? 0,
          unit: ch.units ?? ch.unit ?? '',
        })),
      }));
      setStreams(streamList);
      setConnected(streamList.length > 0);
      setLastError(null);

      // Use the user-selected device, defaulting to the first one
      const stream =
        (activeDeviceIdRef.current
          ? streamList.find((s) => s.device_serial === activeDeviceIdRef.current)
          : null) ?? streamList[0] ?? null;

      if (!activeDeviceIdRef.current && stream) {
        activeDeviceIdRef.current = stream.device_serial;
      }
      setActiveStream(stream);

      const current = stream;
      if (!current?.channels?.length) return;

      // DEBUG: probe possible live-data endpoints
      if (current.eventdevice_uri && !debugFetchedRef.current) {
        debugFetchedRef.current = true;
        const base = current.eventdevice_uri.replace('https://podium.live', '');
        const probes = [
          base + '/data',
          base + '/current',
          base + '/samples?limit=1',
          base + '/live',
          '/api/v1/livestreams/' + current.device_serial,
        ];
        for (const p of probes) {
          getDeviceLiveData(token, 'https://podium.live' + p)
            .then((d) => console.log(`[probe ${p}]`, JSON.stringify(d).slice(0, 400)))
            .catch((e) => console.log(`[probe ${p} ERR]`, String(e)));
        }
      }

      const now = Date.now();
      const channelMap = new Map<string, Channel>();
      const newHistoryEntries: [string, ChannelHistory][] = [];

      for (const ch of current.channels) {
        channelMap.set(ch.name, ch);
        updateStats(ch.name, ch.value);

        // Accumulate distance using Speed channel if available
        if (ch.name === 'Speed' || ch.name === 'speed') {
          distanceRef.current += (ch.value * POLL_MS) / 3600; // speed km/h → km increment
        }

        newHistoryEntries.push([ch.name, { timestamp: now, distance: distanceRef.current, value: ch.value }]);
      }

      // Inject math channels into the channel map
      const mathChannels = loadMathChannels();
      for (const mc of mathChannels) {
        try {
          const val = evaluateMathChannel(mc.formula, channelMap);
          channelMap.set(mc.name, { name: mc.name, value: val, unit: mc.unit });
          updateStats(mc.name, val);
          newHistoryEntries.push([mc.name, { timestamp: now, distance: distanceRef.current, value: val }]);
        } catch {
          // skip invalid formulas
        }
      }

      setChannels(channelMap);
      setHistory((prev) => {
        const next = new Map(prev);
        const cutoff = now - HISTORY_SECONDS * 1000;
        for (const [name, entry] of newHistoryEntries) {
          const arr = next.get(name) ?? [];
          arr.push(entry);
          // Trim old entries
          const trimmed = arr.filter((e) => e.timestamp >= cutoff);
          next.set(name, trimmed);
        }
        return next;
      });

      // Load laps from the first stream if not already loaded
      const lapsUri = (stream as any)?.laps_uri ?? (stream?.eventdevice_uri ? `${stream.eventdevice_uri}/laps` : null);
      if (lapsUri && laps.length === 0) {
        try {
          const lapsData = await getLaps(token, lapsUri);
          if (lapsData?.laps) setLaps(lapsData.laps);
        } catch {
          // laps not available yet
        }
      }
    } catch (err) {
      setLastError(String(err));
      setConnected(false);
    }
  }, [token, laps.length]);

  useEffect(() => {
    if (!token) return;
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, poll]);

  const resetSessionStats = useCallback(() => {
    resetStats();
    distanceRef.current = 0;
    setHistory(new Map());
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        channels,
        history,
        streams,
        activeStream,
        isLive,
        laps,
        selectedLap,
        lapData,
        graphByDistance,
        setGraphByDistance,
        setSelectedLap,
        setActiveStream: handleSetActiveStream,
        resetSessionStats,
        connected,
        lastError,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  return useContext(TelemetryContext);
}
