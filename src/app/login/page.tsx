'use client';

import {
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email.'),
      password: (v) => (v.length > 0 ? null : 'Password is required.'),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (err: unknown) {
      notifications.show({
        title: 'Login failed',
        message: err instanceof Error ? err.message : 'Something went wrong.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center mih="100vh" bg="var(--mantine-color-gray-0)">
      <Container size={420} w="100%">
        <Stack gap="sm" mb="xl" ta="center">
          <Title order={1} fw={700} fz={28}>
            WiringApp
          </Title>
          <Text c="dimmed" fz="sm">
            Wire harness design &amp; documentation
          </Text>
        </Stack>

        <Paper radius="md" p="xl" withBorder shadow="sm">
          <Title order={2} fz="lg" mb="md">
            Sign in
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                {...form.getInputProps('email')}
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                {...form.getInputProps('password')}
                autoComplete="current-password"
              />
              <Button type="submit" loading={loading} fullWidth mt="xs">
                Sign in
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Text fz="sm" c="dimmed">
              Don&apos;t have an account?{' '}
              <Anchor component={Link} href="/register" fz="sm">
                Create one
              </Anchor>
            </Text>
          </Group>
        </Paper>
      </Container>
    </Center>
  );
}
