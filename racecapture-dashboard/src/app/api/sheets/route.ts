import { NextRequest, NextResponse } from 'next/server';

// Proxy for Google Sheets CSV exports — avoids CORS restrictions in the browser.
// Usage: GET /api/sheets?sheetId=<id>&gid=<gid>
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sheetId = searchParams.get('sheetId');
  const gid = searchParams.get('gid') ?? '0';

  if (!sheetId) {
    return NextResponse.json({ error: 'sheetId required' }, { status: 400 });
  }

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(gid)}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RaceCapture-Dashboard/1.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
