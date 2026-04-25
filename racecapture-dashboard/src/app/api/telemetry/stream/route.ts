import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

function sse(event: string, data: string): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
}

// Build index→name lookup from sensor map { ChannelName: index | [lat,lon] }
function buildIndexMap(sensorMap: Record<string, number | number[]>): Map<number, string> {
  const map = new Map<number, string>();
  for (const [name, idx] of Object.entries(sensorMap)) {
    if (typeof idx === 'number') {
      map.set(idx, name);
    } else if (Array.isArray(idx) && idx.length >= 1) {
      // Position = [latIdx, lonIdx] — map both to Lat/Lon sub-channels
      map.set(idx[0], `${name}Lat`);
      if (idx[1] !== undefined) map.set(idx[1], `${name}Lon`);
    }
  }
  return map;
}

function decodeFrame(raw: string, indexMap: Map<number, string>): Record<string, number> | null {
  try {
    const parsed = JSON.parse(raw);
    // RaceCapture format: {"s":{"d":[...]}} or {"d":[...]} or plain array
    const arr: unknown = parsed?.s?.d ?? parsed?.d ?? (Array.isArray(parsed) ? parsed : null);
    if (!Array.isArray(arr)) return null;
    const channels: Record<string, number> = {};
    for (const [idx, name] of indexMap) {
      if (idx < arr.length && typeof arr[idx] === 'number') {
        channels[name] = arr[idx] as number;
      }
    }
    return Object.keys(channels).length > 0 ? channels : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const deviceId = searchParams.get('deviceId');
  const session = searchParams.get('session') ?? '';
  const sensorsParam = searchParams.get('sensors');

  if (!deviceId) {
    return new Response('deviceId required', { status: 400 });
  }

  let indexMap = new Map<number, string>();
  if (sensorsParam) {
    try {
      const sensorMap: Record<string, number | number[]> = JSON.parse(sensorsParam);
      indexMap = buildIndexMap(sensorMap);
    } catch { /* bad JSON, proceed without map */ }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const abort = req.signal;
      let closed = false;

      const close = () => {
        if (!closed) {
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
        }
      };

      abort.addEventListener('abort', close);

      // Try connecting to telemetry.podium.live with the session cookie for auth
      const wsUrl = `wss://telemetry.podium.live/${deviceId}`;
      console.log(`[telemetry] connecting to ${wsUrl}`);

      // telemetry.podium.live is publicly accessible — no auth headers needed.
      // WHATWG WebSocket (Node.js 22 native) does not support custom headers
      // in the constructor; the stream is unauthenticated at the WS level.
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        controller.enqueue(sse('error', JSON.stringify({ error: String(err) })));
        close();
        return;
      }

      ws.addEventListener('open', () => {
        console.log(`[telemetry] connected`);
        if (!closed) controller.enqueue(sse('status', JSON.stringify({ connected: true })));
      });

      ws.addEventListener('message', (evt: MessageEvent) => {
        if (closed) return;
        const raw = typeof evt.data === 'string' ? evt.data : '';
        console.log(`[telemetry] raw:`, raw.slice(0, 300));

        // Always forward the raw frame so the client can see it
        controller.enqueue(sse('raw', JSON.stringify({ data: raw })));

        if (indexMap.size > 0) {
          const channels = decodeFrame(raw, indexMap);
          if (channels) {
            controller.enqueue(sse('channels', JSON.stringify(channels)));
          }
        }
      });

      ws.addEventListener('error', () => {
        console.log(`[telemetry] ws error`);
        if (!closed) controller.enqueue(sse('error', JSON.stringify({ error: 'WebSocket error', url: wsUrl })));
      });

      ws.addEventListener('close', (evt: CloseEvent) => {
        console.log(`[telemetry] ws closed: ${evt.code} ${evt.reason}`);
        if (!closed) controller.enqueue(sse('status', JSON.stringify({ connected: false, code: evt.code })));
        close();
      });

      abort.addEventListener('abort', () => ws.close());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
