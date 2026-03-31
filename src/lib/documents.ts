import type { Node, Edge } from '@xyflow/react';

export interface HarnessDocument {
  id: string;
  userId: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

const documents: HarnessDocument[] = [];

export function listDocuments(userId: string): HarnessDocument[] {
  return documents.filter((d) => d.userId === userId);
}

export function getDocument(id: string): HarnessDocument | undefined {
  return documents.find((d) => d.id === id);
}

export function createDocument(userId: string, title: string): HarnessDocument {
  const doc: HarnessDocument = {
    id: Math.random().toString(36).slice(2),
    userId,
    title,
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  documents.push(doc);
  return doc;
}

export function updateDocument(
  id: string,
  patch: Partial<Pick<HarnessDocument, 'title' | 'nodes' | 'edges'>>
): HarnessDocument | null {
  const doc = documents.find((d) => d.id === id);
  if (!doc) return null;
  Object.assign(doc, patch, { updatedAt: new Date().toISOString() });
  return doc;
}

export function deleteDocument(id: string): boolean {
  const idx = documents.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  documents.splice(idx, 1);
  return true;
}
