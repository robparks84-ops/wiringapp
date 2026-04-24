'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Alert,
  Anchor,
  Collapse,
  Paper,
} from '@mantine/core';
import { IconAlertCircle, IconChevronDown } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { login as podiumLogin } from '@/lib/podiumClient';

export default function LoginPage() {
  const router = useRouter();
  const { token, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !clientSecret) {
      setError('Client ID and Client Secret are required. See the advanced section below.');
      setShowAdvanced(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const accessToken = await podiumLogin(username, password, clientId, clientSecret);
      login(accessToken, clientId, clientSecret);
      router.replace('/dashboard');
    } catch (err) {
      setError(String(err));
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
        style={{ width: '100%', maxWidth: 420, background: '#12121a', border: '1px solid #222' }}
      >
        <Stack gap="md">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: -1 }}>
              RaceCapture
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Live Telemetry Dashboard</div>
          </div>

          <form onSubmit={handleLogin}>
            <Stack gap="sm">
              <TextInput
                label="podium.live username"
                placeholder="your@email.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Anchor
                size="sm"
                c="dimmed"
                onClick={() => setShowAdvanced((s) => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              >
                API credentials
                <IconChevronDown
                  size={14}
                  style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                />
              </Anchor>

              <Collapse in={showAdvanced}>
                <Stack gap="sm">
                  <Alert color="blue" variant="light" style={{ fontSize: 12 }}>
                    Register an API application at{' '}
                    <Anchor href="https://podium.live" target="_blank" size="xs">
                      podium.live
                    </Anchor>{' '}
                    to obtain a Client ID and Client Secret.
                  </Alert>
                  <TextInput
                    label="Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="your-client-id"
                  />
                  <PasswordInput
                    label="Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="your-client-secret"
                  />
                </Stack>
              </Collapse>

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={loading} fullWidth mt="xs">
                Sign in
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Your credentials are stored locally and never sent anywhere except podium.live.
          </Text>
        </Stack>
      </Paper>
    </div>
  );
}
