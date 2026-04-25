'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Paper,
  Text,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { login as podiumLogin } from '@/lib/podiumClient';

export default function LoginPage() {
  const router = useRouter();
  const { token, savedEmail, login, saveEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (savedEmail) setEmail(savedEmail);
  }, [savedEmail]);

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const accessToken = await podiumLogin(email, password);
      login(accessToken);
      saveEmail(email);
      router.replace('/dashboard');
    } catch (err) {
      setError(String(err).replace('Error: ', ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        padding: 24,
      }}
    >
      <Paper
        shadow="lg"
        p="xl"
        radius="md"
        style={{ width: '100%', maxWidth: 380, background: '#12121a', border: '1px solid #222' }}
      >
        <Stack gap="md">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: -1 }}>
              RaceCapture
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>Live Telemetry Dashboard</div>
          </div>

          <form onSubmit={handleLogin}>
            <Stack gap="sm">
              <TextInput
                label="podium.live email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus={!!email}
                autoComplete="current-password"
              />

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={loading} fullWidth mt={4}>
                Sign in
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Uses your podium.live account — no extra setup needed.
          </Text>
        </Stack>
      </Paper>
    </div>
  );
}
