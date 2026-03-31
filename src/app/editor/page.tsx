'use client';

import { AppShell, Group, Text, ActionIcon, Menu, Badge } from '@mantine/core';
import { IconWifi, IconUser, IconLogout, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Canvas } from '@/components/editor/Canvas';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditorPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <AppShell header={{ height: 50 }} style={{ height: '100vh' }}>
      <AppShell.Header p={0}>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <ActionIcon component={Link} href="/dashboard" variant="subtle" color="gray" size="sm">
              <IconArrowLeft size={16} />
            </ActionIcon>
            <IconWifi size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={700} fz="sm">WiringApp</Text>
            <Text c="dimmed" fz="sm">/ Racecar Harness</Text>
          </Group>
          <Group gap="xs">
            <Badge color={user.plan === 'pro' ? 'yellow' : 'gray'} variant="light" size="sm">
              {user.plan}
            </Badge>
            <Menu shadow="md" width={160}>
              <Menu.Target>
                <ActionIcon variant="default" radius="xl" size="md">
                  <IconUser size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={logout}>
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ height: 'calc(100vh - 50px)', padding: 0, display: 'flex' }}>
        <Canvas />
      </AppShell.Main>
    </AppShell>
  );
}
