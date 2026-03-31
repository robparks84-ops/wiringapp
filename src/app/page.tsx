'use client';

import { Button, Center, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconWifi } from '@tabler/icons-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Center mih="100vh">
      <Container size="sm" ta="center">
        <Stack align="center" gap="md">
          <IconWifi size={56} color="var(--mantine-color-blue-6)" />
          <Title order={1} fz={42} fw={800}>
            WiringApp
          </Title>
          <Text fz="lg" c="dimmed" maw={480}>
            Design, document, and share wire harness assemblies. The modern tool
            for electrical engineers and harness builders.
          </Text>
          <Group mt="md">
            <Button
              component={Link}
              href="/register"
              size="md"
              rightSection={<IconArrowRight size={16} />}
            >
              Get started free
            </Button>
            <Button component={Link} href="/login" size="md" variant="default">
              Sign in
            </Button>
          </Group>
        </Stack>
      </Container>
    </Center>
  );
}
