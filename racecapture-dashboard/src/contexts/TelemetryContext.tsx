'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import type { Channel, ChannelHistory, Lap, Stream, PodiumEventDevice } from '@/lib/types';
import { getLivestreams, getLaps } from '@/lib/podiumClient';
import { updateStats, resetStats } from '@/lib/statsAccumulator';
import { loadMathChannels, evaluateMathChannel } from '@/lib/mathChannels';

const POLL_MS = 2000;
const HISTORY_SECONDS = 300;

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

/**
 * Convert a PodiumEventDevice from the API into our internal Stream type.
 */
function toStream(ed: PodiumEventDevice): Stream {
  return {
    eventdevice_id: ed.id,
    device_id: ed.device_id,
    device_name: ed.name ?? `Device ${ed.device_id}`,
    eventdevice_name: ed.name ?? '',
    eventdevice_uri: ed.URI,
    device_uri: ed.device_uri,
    event_uri: ed.event_uri,
    laps_uri: ed.laps_uri,
    channels: (ed.channels ?? []).map((ch) => ({
      name: ch.name,
      value: 0,
      unit: ch.units ?? '',       // API uses "units" (plural)
      min: ch.min ?? undefined,
      max: ch.max ?? undefined,
      precision: ch.precision ?? undefined,
    })),
  };
}

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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeDeviceIdRef = useRef<number | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const lapsLoadedRef = useRef(false);

  const handleSetActiveStream = useCallback((s: Stream | null) => {
    setActiveStream(s);
    activeDeviceIdRef.current = s?.device_id ?? null;
    setLaps([]);
    setSelectedLap(null);
    lapsLoadedRef.current = false;
    distanceRef.current = 0;
    setHistory(new Map());
    // Close existing SSE so a new one opens for the new device
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  const isLive = selectedLap === null;

  // ── SSE TELEMETRY STREAM ─────────────────────────────────────────────────
  // Opens an SSE connection to our /api/telemetry/stream proxy which connects
  // server-side to wss://telemetry.podium.live/[deviceId]
  const openSseStream = useCallback((deviceId: number, channelNames: string[]) => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const channelsParam = encodeURIComponent(JSON.stringify(channelNames));
    const url = `/api/telemetry/stream?deviceId=${deviceId}&channels=${channelsParam}`;

    console.log(`[telemetry] opening SSE: deviceId=${deviceId}, ${channelNames.length} channels`);
    const es = new EventSource(url);
    sseRef.current = es;

    es.addEventListener('status', (evt) => {
      try {
        const d = JSON.parse(evt.data);
        setConnected(!!d.connected);
        if (!d.connected) setLastError(`Telemetry disconnected (code ${d.code})`);
        else setLastError(null);
      } catch { /* ignore */ }
    });

    es.addEventListener('channels', (evt) => {
      try {
        const incoming: Record<string, number> = JSON.parse(evt.data);
        const now = Date.now();

        setChannels((prev) => {
          const next = new Map(prev);
          for (const [name, value] of Object.entries(incoming)) {
            const existing = next.get(name);
            next.set(name, { name, value, unit: existing?.unit ?? '' });
            updateStats(name, value);

            if (name === 'Speed' || name === 'speed') {
              distanceRef.current += (value * 100) / 3600;
            }
          }

          // Inject math channels
          const mathChannels = loadMathChannels();
          for (const mc of mathChannels) {
            try {
              const val = evaluateMathChannel(mc.formula, next);
              next.set(mc.name, { name: mc.name, value: val, unit: mc.unit });
              updateStats(mc.name, val);
            } catch { /* skip */ }
          }

          return next;
        });

        setHistory((prev) => {
          const next = new Map(prev);
          const cutoff = now - HISTORY_SECONDS * 1000;
          for (const [name, value] of Object.entries(incoming)) {
            const arr = next.get(name) ?? [];
            arr.push({ timestamp: now, distance: distanceRef.current, value });
            next.set(name, arr.filter((e) => e.timestamp >= cutoff));
          }
          return next;
        });

        setLastError(null);
      } catch { /* ignore */ }
    });

    es.addEventListener('raw', (evt) => {
      try {
        const d = JSON.parse(evt.data);
        console.log('[telemetry raw]', String(d.data).slice(0, 300));
      } catch { /* ignore */ }
    });

    es.addEventListener('error', (evt) => {
      const msg = (evt as MessageEvent).data
        ? JSON.parse((evt as MessageEvent).data)?.error
        : 'SSE error';
      console.log('[telemetry error]', msg);
      setLastError(String(msg));
    });

    es.onerror = () => {
      setConnected(false);
    };

    return es;
  }, []);

  // ── REST POLL (streams + laps) ────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getLivestreams(token);
      const rawDevices: PodiumEventDevice[] = data.eventdevices ?? [];
      const streamList: Stream[] = rawDevices.map(toStream);
      setStreams(streamList);

      // Pick the active stream (keep current selection if still present)
      const stream =
        (activeDeviceIdRef.current
          ? streamList.find((s) => s.device_id === activeDeviceIdRef.current)
          : null) ?? streamList[0] ?? null;

      if (!activeDeviceIdRef.current && stream) {
        activeDeviceIdRef.current = stream.device_id;
      }
      setActiveStream(stream);

      // Initialize channel metadata from the stream's channel definitions
      if (stream) {
        setChannels((prev) => {
          const next = new Map(prev);
          for (const ch of stream.channels) {
            if (!next.has(ch.name)) {
              next.set(ch.name, { name: ch.name, value: 0, unit: ch.unit });
            }
          }
          return next;
        });
      }

      // Open SSE if not already connected for this device
      if (stream && (!sseRef.current || sseRef.current.readyState === EventSource.CLOSED)) {
        const channelNames = stream.channels.map((ch) => ch.name);
        openSseStream(stream.device_id, channelNames);
      }

      // Load laps once per device
      if (stream?.laps_uri && !lapsLoadedRef.current) {
        lapsLoadedRef.current = true;
        try {
          const lapsData = await getLaps(token, stream.laps_uri);
          if (lapsData?.laps) {
            const mapped: Lap[] = lapsData.laps.map((l: any) => ({
              id: String(l.lap_number),
              lapNumber: l.lap_number,
              lapTime: l.lap_time ?? null,
              URI: l.URI,
              raw_data_uri: l.raw_data_uri,
              end_time: l.end_time,
              aggregates: l.aggregates,
            }));
            setLaps(mapped);
          }
        } catch (err) {
          console.log('[telemetry] laps fetch failed:', err);
        }
      }
    } catch (err) {
      setLastError(String(err));
      setConnected(false);
    }
  }, [token, openSseStream]);

  useEffect(() => {
    if (!token) return;
    poll();
    pollIntervalRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (sseRef.current) sseRef.current.close();
    };
  }, [token, poll]);

  // Re-open SSE when active device changes
  useEffect(() => {
    if (!token || !activeStream) return;
    const channelNames = activeStream.channels.map((ch) => ch.name);
    openSseStream(activeStream.device_id, channelNames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStream?.device_id]);

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
