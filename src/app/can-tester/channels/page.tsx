'use client';

import { Stack, Title, Group, Text, Button, ActionIcon } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import { useRef } from 'react';
import { PresetSelector } from '@/components/can-tester/channels/PresetSelector';
import { ChannelTable } from '@/components/can-tester/channels/ChannelTable';
import { useCANStore } from '@/lib/can-tester/store';
import { ChannelDefinition } from '@/lib/can-tester/types';

export default function ChannelsPage() {
  const channels = useCANStore(s => s.channels);
  const addChannel = useCANStore(s => s.addChannel);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = JSON.stringify(channels, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'can-channels.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ChannelDefinition[];
        data.forEach(ch => addChannel(ch));
      } catch {
        // ignore parse errors
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Title order={3}>Channel Map</Title>
        <Group gap="xs">
          <Text size="sm" c="dimmed">{channels.length} channel{channels.length !== 1 ? 's' : ''}</Text>
          <ActionIcon variant="subtle" onClick={handleExport} title="Export JSON" disabled={channels.length === 0}>
            <IconDownload size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={() => fileRef.current?.click()} title="Import JSON">
            <IconUpload size={16} />
          </ActionIcon>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </Group>
      </Group>

      <PresetSelector />

      <ChannelTable />
    </Stack>
  );
}
