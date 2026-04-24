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

  const token = req.headers.get('x-podium-token');
  const contentType = req.headers.get('content-type') ?? 'application/json';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': contentType,
  };

  // Pass auth header from client, or Bearer token from x-podium-token
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await req.text();
  }

  try {
    const res = await fetch(url, { method, headers, body });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
