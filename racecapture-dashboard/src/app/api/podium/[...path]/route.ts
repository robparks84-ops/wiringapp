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
    // First request — manual redirect so we can collect cookies at each hop
    const res = await fetch(url, { method, headers, body, redirect: 'manual' });

    const allCookies: string[] = [];

    function collectCookies(r: Response) {
      // getSetCookie() returns each Set-Cookie header as a separate string
      const raw: string[] = typeof (r.headers as any).getSetCookie === 'function'
        ? (r.headers as any).getSetCookie()
        : (r.headers.get('set-cookie') ?? '').split(/,\s*(?=[A-Za-z_][A-Za-z0-9_\-]*=)/).filter(Boolean);
      for (const c of raw) {
        const val = c.trim().split(';')[0].trim();
        if (val.includes('=')) allCookies.push(val);
      }
    }

    collectCookies(res);

    let finalRes = res;

    // Follow up to 5 redirects manually so we capture cookies at every hop
    let nextUrl = res.headers.get('location');
    let hops = 0;
    while (nextUrl && res.status >= 300 && res.status < 400 && hops < 5) {
      if (!nextUrl.startsWith('http')) nextUrl = `${PODIUM_BASE}${nextUrl}`;
      const r = await fetch(nextUrl, { method: 'GET', headers, redirect: 'manual' });
      collectCookies(r);
      nextUrl = r.headers.get('location');
      finalRes = r;
      hops++;
    }

    const text = await finalRes.text();
    const responseHeaders: Record<string, string> = {
      'Content-Type': finalRes.headers.get('content-type') ?? 'application/json',
    };

    if (allCookies.length > 0) {
      responseHeaders['x-podium-set-session'] = allCookies.join('; ');
    }

    return new NextResponse(text, {
      status: finalRes.status >= 300 && finalRes.status < 400 ? 200 : finalRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
