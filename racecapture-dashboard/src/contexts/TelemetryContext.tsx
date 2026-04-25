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
import { getLivestreams, getLaps, getSensorMap } from '@/lib/podiumClient';
import { updateStats, resetStats } from '@/lib/statsAccumulator';
import { loadMathChannels, evaluateMathChannel } from '@/lib/mathChannels';

const POLL_MS = 2000; // REST poll for stream list / laps (not channel values)
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
  const activeDeviceIdRef = useRef<string | null>(null);
  // sensorMap from the eventdevice page: { channelName: index }
  const sensorMapRef = useRef<Record<string, number | number[]>>({});
  // Channel metadata from REST API: name → { unit, min, max }
  const channelMetaRef = useRef<Map<string, { unit: string }>>(new Map());
  // SSE EventSource for live telemetry
  const sseRef = useRef<EventSource | null>(null);

  const handleSetActiveStream = useCallback((s: Stream | null) => {
    setActiveStream(s);
    activeDeviceIdRef.current = s?.device_serial ?? null;
    setLaps([]);
    setSelectedLap(null);
    distanceRef.current = 0;
    setHistory(new Map());
  }, []);

  const isLive = selectedLap === null;

  // ── SSE TELEMETRY STREAM ─────────────────────────────────────────────────────
  // Opens an SSE connection to our /api/telemetry/stream proxy which connects
  // server-side to wss://telemetry.podium.live/[deviceId]
  const openSseStream = useCallback((deviceId: string, session: string, sensorMap: Record<string, number | number[]>) => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const sensorsParam = encodeURIComponent(JSON.stringify(sensorMap));
    const sessionParam = encodeURIComponent(session);
    const url = `/api/telemetry/stream?deviceId=${deviceId}&session=${sessionParam}&sensors=${sensorsParam}`;

    const es = new EventSource(url);
    sseRef.current = es;

    es.addEventListener('status', (evt) => {
      try {
        const d = JSON.parse(evt.data);
        setConnected(!!d.connected);
        if (!d.connected) setLastError(`Telemetry disconnected (code ${d.code})`);
      } catch { /* ignore */ }
    });

    es.addEventListener('channels', (evt) => {
      try {
        const incoming: Record<string, number> = JSON.parse(evt.data);
        const now = Date.now();

        setChannels((prev) => {
          const next = new Map(prev);
          for (const [name, value] of Object.entries(incoming)) {
            const meta = channelMetaRef.current.get(name);
            next.set(name, { name, value, unit: meta?.unit ?? '' });
            updateStats(name, value);

            if (name === 'Speed' || name === 'speed') {
              // Speed in mph; increment distance accordingly
              distanceRef.current += (value * 100) / 3600; // 100ms per SSE chunk ≈ approximation
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

  // ── REST POLL (streams + laps) ────────────────────────────────────────────────
  // Only fetches device list and laps; channel values come from SSE stream above
  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getLivestreams(token);
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
          value: 0,
          unit: ch.units ?? ch.unit ?? '',
        })),
      }));
      setStreams(streamList);

      // Update channel metadata map (unit info) from REST API channel definitions
      for (const s of streamList) {
        for (const ch of s.channels) {
          channelMetaRef.current.set(ch.name, { unit: ch.unit });
        }
      }

      const stream =
        (activeDeviceIdRef.current
          ? streamList.find((s) => s.device_serial === activeDeviceIdRef.current)
          : null) ?? streamList[0] ?? null;

      if (!activeDeviceIdRef.current && stream) {
        activeDeviceIdRef.current = stream.device_serial;
      }
      setActiveStream(stream);

      // Fetch sensor map + open SSE when we have a device (done once per device change)
      if (stream && (!sseRef.current || sseRef.current.readyState === EventSource.CLOSED)) {
        const deviceId = stream.device_serial;
        getSensorMap(token, deviceId)
          .then((sensorMap) => {
            sensorMapRef.current = sensorMap;
            console.log(`[telemetry] sensorMap loaded (${Object.keys(sensorMap).length} channels)`);
            openSseStream(deviceId, token, sensorMap);
          })
          .catch((err) => {
            // Still try to open the stream without a sensor map (will log raw frames)
            console.log('[telemetry] sensorMap fetch failed:', err, '— opening without decode map');
            openSseStream(deviceId, token, {});
          });
      }

      // Load laps
      const lapsUri = (stream as any)?.laps_uri ?? (stream?.eventdevice_uri ? `${stream.eventdevice_uri}/laps` : null);
      if (lapsUri && laps.length === 0) {
        try {
          const lapsData = await getLaps(token, lapsUri);
          if (lapsData?.laps) setLaps(lapsData.laps);
        } catch { /* laps not available yet */ }
      }
    } catch (err) {
      setLastError(String(err));
      setConnected(false);
    }
  }, [token, laps.length, openSseStream]);

  useEffect(() => {
    if (!token) return;
    poll();
    pollIntervalRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (sseRef.current) sseRef.current.close();
    };
  }, [token, poll]);

  // Re-open SSE when active device changes (via handleSetActiveStream)
  useEffect(() => {
    if (!token || !activeDeviceIdRef.current) return;
    const deviceId = activeDeviceIdRef.current;
    getSensorMap(token, deviceId)
      .then((sensorMap) => {
        sensorMapRef.current = sensorMap;
        openSseStream(deviceId, token, sensorMap);
      })
      .catch(() => openSseStream(deviceId, token, {}));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStream?.device_serial]);

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
