import { NextRequest, NextResponse } from 'next/server';

const PODIUM_BASE = 'https://podium.live';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'POST');
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'DELETE');
}

async function proxy(
  req: NextRequest,
  params: { path: string[] },
  method: string,
): Promise<NextResponse> {
  const podiumPath = '/' + params.path.join('/');
  const search = req.nextUrl.search;
  const url = `${PODIUM_BASE}${podiumPath}${search}`;

  // Forward the Authorization header (Bearer token) from the client
  const authHeader = req.headers.get('authorization');
  const contentType = req.headers.get('content-type') ?? 'application/json';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': contentType,
    'User-Agent': 'Mozilla/5.0 (compatible; RaceCapture/1.0)',
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await req.text();
  }

  // ── OAUTH TOKEN REQUEST ───────────────────────────────────────────────────
  // /oauth/token uses form-urlencoded and doesn't need Bearer auth
  if (method === 'POST' && podiumPath === '/oauth/token') {
    try {
      const res = await fetch(`${PODIUM_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          Accept: 'application/json',
          'User-Agent': headers['User-Agent'],
        },
        body,
      });
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }

  // ── ALL OTHER REQUESTS ────────────────────────────────────────────────────
  try {
    const res = await fetch(url, { method, headers, body, redirect: 'manual' });
    const text = await res.text();

    // If podium redirects to the login page, return 401
    const location = res.headers.get('location') ?? '';
    if (res.status >= 300 && res.status < 400 && location.includes('sign_in')) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    };

    const status = res.status >= 300 && res.status < 400 ? 200 : res.status;
    return new NextResponse(text, { status, headers: responseHeaders });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
