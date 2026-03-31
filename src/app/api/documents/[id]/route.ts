import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDocument, updateDocument, deleteDocument } from '@/lib/documents';

function getUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || doc.userId !== user.id) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || doc.userId !== user.id) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const body = await req.json();
  const updated = updateDocument(id, {
    title: body.title,
    nodes: body.nodes,
    edges: body.edges,
  });
  return NextResponse.json({ document: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || doc.userId !== user.id) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  deleteDocument(id);
  return NextResponse.json({ success: true });
}
