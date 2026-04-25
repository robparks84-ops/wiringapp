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

function dedupCookies(cookies: string[]): string[] {
  const map = new Map<string, string>();
  for (const c of cookies) map.set(c.split('=')[0], c);
  return Array.from(map.values());
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

  // ── LOGIN FLOW ──────────────────────────────────────────────────────────────
  // Devise requires a CSRF token in the form body and a matching pre-session
  // cookie. We fetch the sign-in page first to obtain both, then post the
  // credentials. We manually follow the success redirect to collect the
  // authenticated session cookie at every hop.
  if (method === 'POST' && podiumPath === '/users/sign_in') {
    // Step 1: get CSRF token + anonymous session cookie
    const pageRes = await fetch(`${PODIUM_BASE}/users/sign_in`, {
      method: 'GET',
      headers: { Accept: 'text/html', 'User-Agent': headers['User-Agent'] },
      redirect: 'follow',
    });
    const pageHtml = await pageRes.text();
    const csrfMatch = pageHtml.match(/name="authenticity_token"[^>]*value="([^"]+)"/);
    const csrfToken = csrfMatch?.[1];
    const preCookies = getSetCookies(pageRes);

    if (preCookies.length > 0) headers['Cookie'] = preCookies.join('; ');
    if (csrfToken && body) body = body + '&authenticity_token=' + encodeURIComponent(csrfToken);

    console.log(`[podium login] csrf=${csrfToken ? 'found' : 'NOT FOUND'} pre-cookies=${preCookies.length}`);

    // Step 2: post credentials
    const loginRes = await fetch(url, { method: 'POST', headers, body, redirect: 'manual' });
    const allCookies = [...preCookies, ...getSetCookies(loginRes)];

    console.log(`[podium login] POST → ${loginRes.status}, new cookies: ${getSetCookies(loginRes).join(', ') || 'none'}`);

    // Step 3: follow the redirect to collect the authenticated session cookie
    let nextUrl = loginRes.headers.get('location');
    let hops = 0;
    while (nextUrl && loginRes.status >= 300 && hops < 5) {
      if (!nextUrl.startsWith('http')) nextUrl = `${PODIUM_BASE}${nextUrl}`;
      const cookieHeader = dedupCookies(allCookies).join('; ');
      const r = await fetch(nextUrl, {
        method: 'GET',
        headers: { Accept: 'text/html,application/json', 'User-Agent': headers['User-Agent'], Cookie: cookieHeader },
        redirect: 'manual',
      });
      const hopCookies = getSetCookies(r);
      allCookies.push(...hopCookies);
      console.log(`[podium login] follow → ${nextUrl} → ${r.status}, cookies: ${hopCookies.join(', ') || 'none'}`);
      nextUrl = r.headers.get('location');
      hops++;
    }

    const sessionValue = dedupCookies(allCookies).join('; ');
    console.log(`[podium login] final session: ${sessionValue}`);

    const responseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionValue) responseHeaders['x-podium-set-session'] = sessionValue;

    const status = loginRes.status >= 300 && loginRes.status < 400 ? 200 : loginRes.status;
    return new NextResponse('{}', { status, headers: responseHeaders });
  }

  // ── ALL OTHER REQUESTS ──────────────────────────────────────────────────────
  try {
    const res = await fetch(url, { method, headers, body, redirect: 'manual' });
    const text = await res.text();

    // If podium redirects to the login page, return 401 instead of HTML
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
