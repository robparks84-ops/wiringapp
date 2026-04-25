import { NextRequest, NextResponse } from 'next/server';

const PODIUM_BASE = 'https://podium.live';

// Extract channel index→name mapping from eventdevice HTML page
function parseSensorList(html: string): Record<string, number | number[]> | null {
  // Find sensorList start
  const startMarker = "'sensorList':";
  const markerIdx = html.indexOf(startMarker);
  if (markerIdx < 0) return null;

  // Walk forward to find the opening brace
  let braceStart = html.indexOf('{', markerIdx + startMarker.length);
  if (braceStart < 0) return null;

  // Match balanced braces to find the end of the sensorList object
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

  const jsonStr = html.slice(braceStart, braceEnd + 1);
  try {
    const raw: Record<string, { index: number | number[]; units?: string; min?: number; max?: number }> = JSON.parse(jsonStr);
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

  const headers: Record<string, string> = {
    Accept: 'text/html',
    'User-Agent': 'Mozilla/5.0 (compatible; RaceCapture/1.0)',
  };
  if (session) headers['Cookie'] = session;

  // Try fetching the eventdevice HTML page
  const url = `${PODIUM_BASE}/eventdevices/${deviceId}`;
  try {
    const res = await fetch(url, { headers, redirect: 'follow' });
    const html = await res.text();

    const sensorMap = parseSensorList(html);
    if (!sensorMap) {
      return NextResponse.json({ error: 'sensorList not found in page' }, { status: 404 });
    }

    // Also extract eventDeviceId to confirm we got the right page
    const devIdMatch = html.match(/'eventDeviceId':\s*(\d+)/);

    return NextResponse.json({
      sensorMap,
      eventDeviceId: devIdMatch ? parseInt(devIdMatch[1], 10) : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
