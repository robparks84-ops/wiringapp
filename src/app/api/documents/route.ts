import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, createDocument } from '@/lib/documents';

const ANON_USER_ID = 'anonymous';

export async function GET() {
  return NextResponse.json({ documents: listDocuments(ANON_USER_ID) });
}

export async function POST(req: NextRequest) {
  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  const doc = createDocument(ANON_USER_ID, title.trim());
  return NextResponse.json({ document: doc }, { status: 201 });
}
