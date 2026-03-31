'use client';

import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Menu,
  Modal,
  Radio,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconDots,
  IconLayoutDashboard,
  IconLogout,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUser,
  IconWifi,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { TEMPLATES } from '@/lib/templates';

interface HarnessDoc {
  id: string;
  title: string;
  updatedAt: string;
  nodes: unknown[];
  edges: unknown[];
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<HarnessDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/documents')
      .then((r) => r.json())
      .then((data) => setDocs(data.documents ?? []))
      .finally(() => setDocsLoading(false));
  }, [user]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), templateId: selectedTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/editor/${data.document.id}?template=${selectedTemplate}`);
    } catch (err: unknown) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to create.', color: 'red' });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocs((prev) => prev.filter((d) => d.id !== id));
    notifications.show({ message: `"${title}" deleted.`, color: 'red' });
  }

  function openModal() {
    setNewTitle('');
    setSelectedTemplate('blank');
    setModalOpen(true);
  }

  if (loading || !user) return null;

  return (
    <>
      <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
        <AppShell.Header p="xs">
          <Group h="100%" px="md" justify="space-between">
            <Group gap="xs">
              <IconWifi size={24} color="var(--mantine-color-blue-6)" />
              <Text fw={700} fz="lg">WiringApp</Text>
            </Group>
            <Group gap="xs">
              <Badge color={user.plan === 'pro' ? 'yellow' : 'gray'} variant="light">{user.plan}</Badge>
              <Menu shadow="md" width={180}>
                <Menu.Target>
                  <Tooltip label={user.name}>
                    <ActionIcon variant="default" radius="xl" size="lg">
                      <IconUser size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{user.email}</Menu.Label>
                  <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={logout}>Sign out</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Stack gap="xs">
            <Button leftSection={<IconLayoutDashboard size={16} />} variant="light" justify="left" fullWidth>
              My Designs
            </Button>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Group justify="space-between" mb="lg">
            <Box>
              <Title order={2} fz="xl">My Harness Designs</Title>
              <Text c="dimmed" fz="sm">{user.name} — {user.email}</Text>
            </Box>
            <Button leftSection={<IconPlus size={16} />} onClick={openModal}>New design</Button>
          </Group>

          {docsLoading ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {[1, 2, 3].map((i) => <Skeleton key={i} h={140} radius="md" />)}
            </SimpleGrid>
          ) : docs.length === 0 ? (
            <Card withBorder radius="md" p="xl" ta="center">
              <IconWifi size={48} color="var(--mantine-color-gray-4)" />
              <Text mt="sm" c="dimmed">No designs yet. Create your first wire harness.</Text>
              <Button mt="md" leftSection={<IconPlus size={16} />} onClick={openModal}>New design</Button>
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {docs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </SimpleGrid>
          )}
        </AppShell.Main>
      </AppShell>

      {/* New design modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="New Harness Design" size="md">
        <Stack gap="md">
          <TextInput
            label="Design name"
            placeholder="e.g. Race Car Main Harness"
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <Box>
            <Text fz="sm" fw={500} mb={8}>Start from a template</Text>
            <Stack gap="xs">
              {TEMPLATES.map((t) => (
                <Radio
                  key={t.id}
                  value={t.id}
                  checked={selectedTemplate === t.id}
                  onChange={() => setSelectedTemplate(t.id)}
                  label={
                    <Box>
                      <Text fz="sm" fw={600}>{t.name}</Text>
                      <Text fz="xs" c="dimmed">{t.description}</Text>
                    </Box>
                  }
                />
              ))}
            </Stack>
          </Box>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newTitle.trim()}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

function DocumentCard({ doc, onDelete }: { doc: HarnessDoc; onDelete: (id: string, title: string) => void }) {
  const updated = new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <Card withBorder radius="md" p="md" component={Link} href={`/editor/${doc.id}`} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
      <Group justify="space-between" mb="xs">
        <Text fw={600} fz="sm" lineClamp={1}>{doc.title}</Text>
        <Menu shadow="sm" width={140}>
          <Menu.Target>
            <ActionIcon variant="subtle" size="sm" color="gray" onClick={(e) => e.preventDefault()}>
              <IconDots size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPencil size={14} />} component={Link} href={`/editor/${doc.id}`}>
              Open
            </Menu.Item>
            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={(e) => { e.preventDefault(); onDelete(doc.id, doc.title); }}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Group gap="md" mb="sm">
        <Stack gap={0}>
          <Text fz="xs" c="dimmed">Components</Text>
          <Text fz="sm" fw={500}>{doc.nodes.length}</Text>
        </Stack>
        <Stack gap={0}>
          <Text fz="xs" c="dimmed">Wires</Text>
          <Text fz="sm" fw={500}>{doc.edges.length}</Text>
        </Stack>
      </Group>
      <Text fz="xs" c="dimmed">Updated {updated}</Text>
    </Card>
  );
}
