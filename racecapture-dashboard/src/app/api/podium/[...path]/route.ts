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

function getSetCookies(r: Response): string[] {
  const raw: string[] =
    typeof (r.headers as any).getSetCookie === 'function'
      ? (r.headers as any).getSetCookie()
      : (r.headers.get('set-cookie') ?? '')
          .split(/,\s*(?=[A-Za-z_][A-Za-z0-9_\-]*=)/)
          .filter(Boolean);
  return raw.map((c) => c.trim().split(';')[0].trim()).filter((c) => c.includes('='));
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
    Accept: 'text/html,application/json',
    'Content-Type': contentType,
    'User-Agent': 'Mozilla/5.0 (compatible; RaceCapture/1.0)',
  };

  if (sessionCookie) headers['Cookie'] = sessionCookie;
  if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;

  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await req.text();
  }

  // For login: pre-fetch the sign-in page to get CSRF token + pre-session cookie,
  // then inject both into the credential POST so Devise sets the session cookie.
  if (method === 'POST' && podiumPath === '/users/sign_in') {
    const pageRes = await fetch(`${PODIUM_BASE}/users/sign_in`, {
      method: 'GET',
      headers: { Accept: 'text/html', 'User-Agent': headers['User-Agent'] },
      redirect: 'follow',
    });
    const pageHtml = await pageRes.text();

    const csrfMatch = pageHtml.match(/name="authenticity_token"[^>]*value="([^"]+)"/);
    const csrfToken = csrfMatch?.[1];

    const preCookies = getSetCookies(pageRes);
    if (preCookies.length > 0) {
      headers['Cookie'] = preCookies.join('; ');
    }

    if (csrfToken && body) {
      body = body + '&authenticity_token=' + encodeURIComponent(csrfToken);
    }

    console.log(`[podium login] csrf=${csrfToken ? 'found' : 'NOT FOUND'} pre-cookies=${preCookies.join(', ') || 'none'}`);
  }

  try {
    const res = await fetch(url, { method, headers, body, redirect: 'manual' });

    const allCookies = getSetCookies(res);

    // Follow redirects manually to collect cookies at every hop
    let finalRes = res;
    let nextUrl = res.headers.get('location');
    let hops = 0;
    while (nextUrl && finalRes.status >= 300 && finalRes.status < 400 && hops < 5) {
      if (!nextUrl.startsWith('http')) nextUrl = `${PODIUM_BASE}${nextUrl}`;
      const cookieHeader = allCookies.join('; ');
      const r = await fetch(nextUrl, {
        method: 'GET',
        headers: { ...headers, ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
        redirect: 'manual',
      });
      allCookies.push(...getSetCookies(r));
      nextUrl = r.headers.get('location');
      finalRes = r;
      hops++;
    }

    console.log(`[podium proxy] ${method} ${podiumPath} → ${res.status}, cookies: ${allCookies.join(', ') || 'none'}`);

    const text = await finalRes.text();
    const responseHeaders: Record<string, string> = {
      'Content-Type': finalRes.headers.get('content-type') ?? 'application/json',
    };

    if (allCookies.length > 0) {
      responseHeaders['x-podium-set-session'] = allCookies.join('; ');
    }

    const status = finalRes.status >= 300 && finalRes.status < 400 ? 200 : finalRes.status;
    return new NextResponse(text, { status, headers: responseHeaders });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
