'use client';

import { AppShell, Burger, Group, Text, NavLink, Box, UnstyledButton, Stack, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconWaveSine,
  IconCode,
  IconLayoutDashboard,
  IconCpu,
  IconBinaryTree,
} from '@tabler/icons-react';

const NAV_ITEMS = [
  { label: 'Channels',  href: '/can-tester/channels',  icon: IconWaveSine       },
  { label: 'Builder',   href: '/can-tester/builder',   icon: IconBinaryTree     },
  { label: 'Lua',       href: '/can-tester/lua',       icon: IconCode           },
  { label: 'Dashboard', href: '/can-tester/dashboard', icon: IconLayoutDashboard },
];

export default function CANTesterLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = NAV_ITEMS.map((item) => (
    <NavLink
      key={item.href}
      label={item.label}
      leftSection={<item.icon size={18} />}
      active={pathname.startsWith(item.href)}
      onClick={() => { router.push(item.href); close(); }}
      style={{ borderRadius: 6 }}
    />
  ));

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <IconCpu size={22} />
            <Text fw={700} size="md">CAN Tester</Text>
          </Group>
          {/* Mobile tab row (shown when navbar is collapsed) */}
          <Group gap={4} visibleFrom="xs" hiddenFrom="sm">
            {NAV_ITEMS.map((item) => (
              <UnstyledButton
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: 6,
                  color: pathname.startsWith(item.href) ? 'var(--mantine-color-blue-6)' : undefined,
                  fontWeight: pathname.startsWith(item.href) ? 700 : 400,
                  fontSize: rem(11),
                  gap: 2,
                }}
              >
                <item.icon size={18} />
                {item.label}
              </UnstyledButton>
            ))}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap={4}>
          {navLinks}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Bottom tab bar for small phones */}
        <Box
          hiddenFrom="xs"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--mantine-color-body)',
            borderTop: '1px solid var(--mantine-color-default-border)',
            display: 'flex',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <UnstyledButton
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 4px',
                color: pathname.startsWith(item.href) ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-dimmed)',
                fontWeight: pathname.startsWith(item.href) ? 700 : 400,
                fontSize: rem(10),
                gap: 3,
              }}
            >
              <item.icon size={20} />
              {item.label}
            </UnstyledButton>
          ))}
        </Box>

        {/* Extra bottom padding on small phones to clear tab bar */}
        <Box pb={{ base: 64, xs: 0 }}>
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
