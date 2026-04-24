import { NextRequest, NextResponse } from 'next/server';

const MYLAPS_BASE = 'https://api2.mylaps.com';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = '/' + path.join('/');
  const search = req.nextUrl.search;
  const url = `${MYLAPS_BASE}${apiPath}${search}`;

  const token = req.headers.get('x-mylaps-token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'RaceCapture-Dashboard/1.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
