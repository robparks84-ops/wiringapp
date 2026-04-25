import { NextRequest, NextResponse } from 'next/server';

const PODIUM_BASE = 'https://podium.live';

function parseSensorList(html: string): Record<string, number | number[]> | null {
  const startMarker = "'sensorList':";
  const markerIdx = html.indexOf(startMarker);
  if (markerIdx < 0) return null;

  let braceStart = html.indexOf('{', markerIdx + startMarker.length);
  if (braceStart < 0) return null;

  let depth = 0;
  let braceEnd = -1;
  let inString = false;
  let escape = false;
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) { braceEnd = i; break; }
    }
  }
  if (braceEnd < 0) return null;

  try {
    const raw: Record<string, { index: number | number[] }> = JSON.parse(html.slice(braceStart, braceEnd + 1));
    const result: Record<string, number | number[]> = {};
    for (const [name, meta] of Object.entries(raw)) {
      if (meta.index !== undefined) result[name] = meta.index;
    }
    return result;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const session = req.headers.get('x-podium-session') ?? '';

  const ua = 'Mozilla/5.0 (compatible; RaceCapture/1.0)';

  // ── Step 1: fetch the eventdevice REST API to get event slug + device name ──
  let eventSlug: string | null = null;
  let deviceName: string | null = null;

  try {
    const apiRes = await fetch(`${PODIUM_BASE}/api/v1/eventdevices/${deviceId}?expand=true`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': ua,
        ...(session ? { Cookie: session } : {}),
      },
      redirect: 'follow',
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      // Podium API embeds event info; try several field paths
      eventSlug = json?.event?.slug ?? json?.event_slug ?? null;
      deviceName = json?.name ?? null;
      console.log(`[sensors] REST API → slug=${eventSlug} name=${deviceName}`);
    }
  } catch { /* fall through */ }

  // ── Step 2: fetch HTML page (publicly accessible) ─────────────────────────
  // URL format: /events/[slug]/device/[name-lowercase]
  if (eventSlug && deviceName) {
    const pageUrl = `${PODIUM_BASE}/events/${eventSlug}/device/${deviceName.toLowerCase()}`;
    console.log(`[sensors] fetching ${pageUrl}`);
    try {
      const res = await fetch(pageUrl, {
        headers: { Accept: 'text/html', 'User-Agent': ua },
        redirect: 'follow',
      });
      const html = await res.text();
      const sensorMap = parseSensorList(html);
      if (sensorMap) {
        const devIdMatch = html.match(/'eventDeviceId':\s*(\d+)/);
        return NextResponse.json({
          sensorMap,
          eventDeviceId: devIdMatch ? parseInt(devIdMatch[1], 10) : null,
        });
      }
    } catch { /* fall through */ }
  }

  // ── Fallback: try with session cookie on various URL patterns ─────────────
  const urlsToTry = [
    `${PODIUM_BASE}/eventdevices/${deviceId}`,
    `${PODIUM_BASE}/api/v1/eventdevices/${deviceId}`,
  ];
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': ua,
          ...(session ? { Cookie: session } : {}),
        },
        redirect: 'follow',
      });
      const html = await res.text();
      const sensorMap = parseSensorList(html);
      if (sensorMap) {
        return NextResponse.json({ sensorMap });
      }
    } catch { /* try next */ }
  }

  return NextResponse.json({ error: 'Could not find sensorList for device ' + deviceId }, { status: 404 });
}
