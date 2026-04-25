import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

function sse(event: string, data: string): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
}

/**
 * Build a lookup from array index → channel name.
 * channelNames is the ordered list of channel names from the eventdevice.
 */
function buildIndexMap(channelNames: string[]): Map<number, string> {
  const map = new Map<number, string>();
  for (let i = 0; i < channelNames.length; i++) {
    map.set(i, channelNames[i]);
  }
  return map;
}

/**
 * Decode a telemetry frame from the WebSocket.
 * RaceCapture sends JSON like: {"s":{"d":[...]}} or {"d":[...]} or a plain array.
 * The array values correspond to the channel list order from the eventdevice.
 */
function decodeFrame(raw: string, indexMap: Map<number, string>): Record<string, number> | null {
  try {
    const parsed = JSON.parse(raw);
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
  const channelsParam = searchParams.get('channels'); // JSON array of channel names

  if (!deviceId) {
    return new Response('deviceId required', { status: 400 });
  }

  let indexMap = new Map<number, string>();
  if (channelsParam) {
    try {
      const channelNames: string[] = JSON.parse(channelsParam);
      indexMap = buildIndexMap(channelNames);
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

      // telemetry.podium.live WebSocket — publicly accessible, no auth needed
      const wsUrl = `wss://telemetry.podium.live/${deviceId}`;
      console.log(`[telemetry] connecting to ${wsUrl} (${indexMap.size} channels mapped)`);

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        controller.enqueue(sse('error', JSON.stringify({ error: String(err) })));
        close();
        return;
      }

      ws.addEventListener('open', () => {
        console.log(`[telemetry] connected to ${wsUrl}`);
        if (!closed) controller.enqueue(sse('status', JSON.stringify({ connected: true })));
      });

      ws.addEventListener('message', (evt: MessageEvent) => {
        if (closed) return;
        const raw = typeof evt.data === 'string' ? evt.data : '';

        // Always forward the raw frame for debugging
        controller.enqueue(sse('raw', JSON.stringify({ data: raw })));

        if (indexMap.size > 0) {
          const channels = decodeFrame(raw, indexMap);
          if (channels) {
            controller.enqueue(sse('channels', JSON.stringify(channels)));
          }
        }
      });

      ws.addEventListener('error', () => {
        console.log(`[telemetry] ws error for ${deviceId}`);
        if (!closed) controller.enqueue(sse('error', JSON.stringify({ error: 'WebSocket error', url: wsUrl })));
      });

      ws.addEventListener('close', (evt: CloseEvent) => {
        console.log(`[telemetry] ws closed for ${deviceId}: ${evt.code} ${evt.reason}`);
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
