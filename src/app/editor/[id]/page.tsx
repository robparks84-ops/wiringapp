'use client';

import { AppShell, Group, Text, ActionIcon, Tabs, Box, Button, TextInput } from '@mantine/core';
import {
  IconWifi, IconArrowLeft, IconDeviceFloppy, IconPrinter,
  IconList, IconPackage, IconSearch, IconX, IconUpload,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Canvas } from '@/components/editor/Canvas';
import { WireList } from '@/components/editor/WireList';
import { BOM } from '@/components/editor/BOM';
import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import type { Node, Edge } from '@xyflow/react';
import { TEMPLATES } from '@/lib/templates';

interface Doc {
  id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [docLoading, setDocLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bottomTab, setBottomTab] = useState<string | null>(null);
  const [wireSearch, setWireSearch] = useState('');
  const [canvasKey, setCanvasKey] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.document) {
          const d = data.document;
          setDoc(d);
          setTitle(d.title);
          const templateId = searchParams.get('template');
          if (d.nodes.length === 0 && templateId) {
            const tpl = TEMPLATES.find((t) => t.id === templateId);
            if (tpl) {
              setNodes(tpl.nodes as Node[]);
              setEdges(tpl.edges as Edge[]);
              return;
            }
          }
          setNodes(d.nodes);
          setEdges(d.edges);
        }
      })
      .finally(() => setDocLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = useCallback(
    async (nodesToSave: Node[], edgesToSave: Edge[]) => {
      setSaving(true);
      try {
        await fetch(`/api/documents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, nodes: nodesToSave, edges: edgesToSave }),
        });
        notifications.show({ message: 'Saved.', color: 'green', autoClose: 1500 });
      } catch {
        notifications.show({ message: 'Save failed.', color: 'red' });
      } finally {
        setSaving(false);
      }
    },
    [id, title]
  );

  async function handleTitleSave() {
    setEditingTitle(false);
    if (!title.trim()) { setTitle(doc?.title ?? 'Untitled'); return; }
    await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), nodes, edges }),
    });
  }

  function handleImportClick() {
    importRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const importedNodes: Node[] = Array.isArray(json.nodes) ? json.nodes : [];
        const importedEdges: Edge[] = Array.isArray(json.edges) ? json.edges : [];
        setNodes(importedNodes);
        setEdges(importedEdges);
        setCanvasKey((k) => k + 1); // force Canvas remount with new data
        notifications.show({ message: `Imported ${importedNodes.length} components, ${importedEdges.length} wires.`, color: 'blue' });
      } catch {
        notifications.show({ message: 'Invalid JSON file.', color: 'red' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  if (docLoading) return null;

  const bottomHeight = bottomTab ? 260 : 36;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-canvas { page-break-inside: avoid; }
        }
      `}</style>

      {/* Hidden file input for JSON import */}
      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      <AppShell header={{ height: 50 }} style={{ height: '100vh' }}>
        <AppShell.Header p={0} className="no-print">
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <ActionIcon component={Link} href="/dashboard" variant="subtle" color="gray" size="sm">
                <IconArrowLeft size={16} />
              </ActionIcon>
              <IconWifi size={20} color="var(--mantine-color-blue-6)" />
              <Text fw={700} fz="sm">WiringApp</Text>
              <Text c="dimmed" fz="sm">/</Text>
              {editingTitle ? (
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.currentTarget.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  size="xs"
                  autoFocus
                  style={{ width: 200 }}
                />
              ) : (
                <Text
                  fz="sm"
                  fw={500}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setEditingTitle(true)}
                  title="Click to rename"
                >
                  {title}
                </Text>
              )}
            </Group>
            <Group gap="xs">
              <Button size="xs" leftSection={<IconUpload size={14} />} variant="light" onClick={handleImportClick}>
                Import JSON
              </Button>
              <Button size="xs" leftSection={<IconPrinter size={14} />} variant="light" onClick={() => window.print()}>
                Print
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main style={{ height: 'calc(100vh - 50px)', padding: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Canvas area */}
          <Box style={{ flex: 1, minHeight: 0 }} className="print-canvas">
            <Canvas
              key={canvasKey}
              initialNodes={nodes}
              initialEdges={edges}
              onSave={handleSave}
              saving={saving}
              wireSearch={wireSearch}
            />
          </Box>

          {/* Bottom panel */}
          <Box
            className="no-print"
            style={{
              height: bottomHeight,
              borderTop: '1px solid var(--mantine-color-gray-3)',
              background: 'var(--mantine-color-body)',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Tabs
              value={bottomTab}
              onChange={setBottomTab}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <Tabs.List style={{ flexShrink: 0 }}>
                <Tabs.Tab value="wires" leftSection={<IconList size={13} />} fz="xs">
                  Wire List ({edges.length})
                </Tabs.Tab>
                <Tabs.Tab value="bom" leftSection={<IconPackage size={13} />} fz="xs">
                  BOM
                </Tabs.Tab>
                <Tabs.Tab value="search" leftSection={<IconSearch size={13} />} fz="xs">
                  Find Wire
                </Tabs.Tab>
                <Box style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, paddingRight: 8 }}>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconDeviceFloppy size={13} />}
                    loading={saving}
                    onClick={() => handleSave(nodes, edges)}
                  >
                    Save
                  </Button>
                  {bottomTab && (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => setBottomTab(null)}
                      title="Close panel"
                    >
                      <IconX size={13} />
                    </ActionIcon>
                  )}
                </Box>
              </Tabs.List>

              {bottomTab && (
                <Box style={{ flex: 1, overflow: 'hidden' }}>
                  <Tabs.Panel value="wires" style={{ height: '100%' }}>
                    <WireList nodes={nodes} edges={edges} />
                  </Tabs.Panel>
                  <Tabs.Panel value="bom" style={{ height: '100%' }}>
                    <BOM nodes={nodes} edges={edges} />
                  </Tabs.Panel>
                  <Tabs.Panel value="search" style={{ height: '100%', padding: 12 }}>
                    <Group gap="sm">
                      <TextInput
                        placeholder="Type a circuit name to highlight it on the canvas…"
                        leftSection={<IconSearch size={14} />}
                        value={wireSearch}
                        onChange={(e) => setWireSearch(e.currentTarget.value)}
                        style={{ width: 340 }}
                        size="sm"
                      />
                      {wireSearch && (
                        <Button size="sm" variant="subtle" onClick={() => setWireSearch('')}>Clear</Button>
                      )}
                    </Group>
                    <Text fz="xs" c="dimmed" mt={8}>
                      Matching wires will be highlighted on the canvas above.
                    </Text>
                  </Tabs.Panel>
                </Box>
              )}
            </Tabs>
          </Box>
        </AppShell.Main>
      </AppShell>
    </>
  );
}
