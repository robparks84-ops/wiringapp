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

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

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
      redirect: 'manual',
    });

    const text = await res.text();
    const responseHeaders: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    };

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const cookies = setCookie
        .split(/,\s*(?=[A-Za-z_][A-Za-z0-9_\-]*=)/)
        .map((c) => c.trim().split(';')[0].trim())
        .filter((c) => c.includes('='));
      if (cookies.length > 0) {
        responseHeaders['x-podium-set-session'] = cookies.join('; ');
      }
    }

    // Convert 3xx to 200 so the browser doesn't auto-follow the redirect and
    // drop our custom x-podium-set-session header before the client can read it.
    const status = res.status >= 300 && res.status < 400 ? 200 : res.status;

    return new NextResponse(text, {
      status,
      headers: responseHeaders,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
