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

  const sessionCookie = req.headers.get('x-podium-session');
  const bearerToken = req.headers.get('x-podium-token');
  const contentType = req.headers.get('content-type') ?? 'application/json';

  const headers: Record<string, string> = {
    Accept: 'application/json, text/html',
    'Content-Type': contentType,
    'User-Agent': 'RaceCapture-Dashboard/1.0',
  };

  // Session cookie auth (no client credentials needed)
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  // OAuth Bearer token auth (fallback)
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  // Pass through explicit Authorization header (e.g. Basic for OAuth token exchange)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await req.text();
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      redirect: 'manual', // capture Set-Cookie before any redirect
    });

    const text = await res.text();
    const responseHeaders: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    };

    // On login success, forward the session cookie so the client can store it
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Extract the session token value — podium.live uses _podium_live_session or similar
      const sessionMatch = setCookie.match(/([a-zA-Z0-9_]+session[a-zA-Z0-9_]*)=([^;]+)/i);
      if (sessionMatch) {
        responseHeaders['x-podium-set-session'] = `${sessionMatch[1]}=${sessionMatch[2]}`;
      }
    }

    return new NextResponse(text, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
