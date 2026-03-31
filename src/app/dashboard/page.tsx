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
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconDots,
  IconLayoutDashboard,
  IconLogout,
  IconPlus,
  IconUser,
  IconWifi,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

interface HarnessDoc {
  id: string;
  title: string;
  updatedAt: string;
  connectorCount: number;
  wireCount: number;
}

const DEMO_DOCS: HarnessDoc[] = [
  { id: '1', title: 'Engine Bay Harness', updatedAt: '2026-03-29T14:00:00Z', connectorCount: 12, wireCount: 48 },
  { id: '2', title: 'Dashboard Assembly', updatedAt: '2026-03-28T09:30:00Z', connectorCount: 8, wireCount: 32 },
  { id: '3', title: 'Tail Light Loom', updatedAt: '2026-03-25T16:15:00Z', connectorCount: 4, wireCount: 14 },
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<HarnessDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Simulate fetching documents
    const timer = setTimeout(() => {
      setDocs(DEMO_DOCS);
      setDocsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  function handleNewDocument() {
    notifications.show({
      title: 'Coming soon',
      message: 'The harness editor will be available in the next release.',
      color: 'blue',
    });
  }

  if (loading || !user) return null;

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header p="xs">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconWifi size={24} color="var(--mantine-color-blue-6)" />
            <Text fw={700} fz="lg">
              WiringApp
            </Text>
          </Group>
          <Group gap="xs">
            <Badge color={user.plan === 'pro' ? 'yellow' : 'gray'} variant="light">
              {user.plan}
            </Badge>
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
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={logout}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Button
            leftSection={<IconLayoutDashboard size={16} />}
            variant="light"
            justify="left"
            fullWidth
          >
            My Documents
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={2} fz="xl">
              My Harness Designs
            </Title>
            <Text c="dimmed" fz="sm">
              {user.name} &mdash; {user.email}
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />} onClick={handleNewDocument}>
            New design
          </Button>
        </Group>

        {docsLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} h={140} radius="md" />
            ))}
          </SimpleGrid>
        ) : docs.length === 0 ? (
          <Card withBorder radius="md" p="xl" ta="center">
            <IconWifi size={48} color="var(--mantine-color-gray-4)" />
            <Text mt="sm" c="dimmed">
              No designs yet. Create your first wire harness.
            </Text>
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={handleNewDocument}>
              New design
            </Button>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </SimpleGrid>
        )}
      </AppShell.Main>
    </AppShell>
  );
}

function DocumentCard({ doc }: { doc: HarnessDoc }) {
  const updated = new Date(doc.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card withBorder radius="md" p="md" style={{ cursor: 'pointer' }}>
      <Group justify="space-between" mb="xs">
        <Text fw={600} fz="sm" lineClamp={1}>
          {doc.title}
        </Text>
        <ActionIcon variant="subtle" size="sm" color="gray">
          <IconDots size={14} />
        </ActionIcon>
      </Group>
      <Group gap="md" mb="sm">
        <Stack gap={0}>
          <Text fz="xs" c="dimmed">Connectors</Text>
          <Text fz="sm" fw={500}>{doc.connectorCount}</Text>
        </Stack>
        <Stack gap={0}>
          <Text fz="xs" c="dimmed">Wires</Text>
          <Text fz="sm" fw={500}>{doc.wireCount}</Text>
        </Stack>
      </Group>
      <Text fz="xs" c="dimmed">
        Updated {updated}
      </Text>
    </Card>
  );
}
