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

export default function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : 'Name is required.'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email.'),
      password: (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters.'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match.'),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      await register(values.name, values.email, values.password);
    } catch (err: unknown) {
      notifications.show({
        title: 'Registration failed',
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
            Create account
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Full name"
                placeholder="Jane Smith"
                {...form.getInputProps('name')}
                autoComplete="name"
              />
              <TextInput
                label="Email"
                placeholder="you@example.com"
                {...form.getInputProps('email')}
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                {...form.getInputProps('password')}
                autoComplete="new-password"
              />
              <PasswordInput
                label="Confirm password"
                placeholder="Repeat your password"
                {...form.getInputProps('confirmPassword')}
                autoComplete="new-password"
              />
              <Button type="submit" loading={loading} fullWidth mt="xs">
                Create account
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Text fz="sm" c="dimmed">
              Already have an account?{' '}
              <Anchor component={Link} href="/login" fz="sm">
                Sign in
              </Anchor>
            </Text>
          </Group>
        </Paper>
      </Container>
    </Center>
  );
}
