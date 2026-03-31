import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument, deleteDocument } from '@/lib/documents';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const body = await req.json();
  const updated = updateDocument(id, { title: body.title, nodes: body.nodes, edges: body.edges });
  return NextResponse.json({ document: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  deleteDocument(id);
  return NextResponse.json({ success: true });
}
