'use client';

import {
  Stack, Title, Group, TextInput, Text, Select, Button, SimpleGrid, Paper,
  Divider, Badge, ActionIcon, Textarea, CopyButton, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCopy, IconCheck, IconPlus } from '@tabler/icons-react';
import { useCANStore } from '@/lib/can-tester/store';
import { ByteGrid } from '@/components/can-tester/builder/ByteGrid';
import { SignalDecodePanel } from '@/components/can-tester/builder/SignalDecodePanel';
import { SignalFormModal } from '@/components/can-tester/builder/SignalFormModal';
import { bytesToHex, hexToBytes, bytesToBinary } from '@/lib/can-tester/can/frameUtils';
import { ALL_PRESETS } from '@/lib/can-tester/can/presets';
import { CANSignal } from '@/lib/can-tester/types';

export default function BuilderPage() {
  const { activeFrame, setFrameData, setFrameId, setFrameLabel, addSignal, loadFrameFromPreset } = useCANStore();
  const [sigModalOpen, { open: openSig, close: closeSig }] = useDisclosure(false);

  function handleHexInput(value: string) {
    setFrameData(hexToBytes(value));
  }

  function handleToggleBit(absPos: number) {
    const newData = [...activeFrame.data];
    const byteIdx = Math.floor(absPos / 8);
    const bitIdx = absPos % 8;
    newData[byteIdx] ^= (1 << bitIdx);
    setFrameData(newData);
  }

  function handleAddSignal(sig: CANSignal) {
    addSignal(sig);
  }

  // Preset frame loader
  const allFrames = ALL_PRESETS.flatMap(p => p.frames.map(f => ({
    value: `${p.id}::${f.id}`,
    label: `[${p.name}] ${f.label ?? ('0x' + f.id.toString(16).toUpperCase())}`,
    frame: f,
  })));

  function handlePresetFrame(value: string | null) {
    if (!value) return;
    const found = allFrames.find(f => f.value === value);
    if (found) loadFrameFromPreset(found.frame);
  }

  const luaTable = `-- CAN frame data for Builder tab\nlocal data = {${activeFrame.data.map(b => `0x${b.toString(16).padStart(2,'0').toUpperCase()}`).join(', ')}}`;

  return (
    <Stack gap="md">
      <Title order={3}>Message Builder</Title>

      {/* Preset frame selector */}
      <Select
        placeholder="Load a preset frame…"
        data={allFrames.map(f => ({ value: f.value, label: f.label }))}
        onChange={handlePresetFrame}
        clearable
        searchable
      />

      {/* Frame header */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
        <TextInput
          label="CAN ID (hex)"
          value={activeFrame.id.toString(16).toUpperCase()}
          onChange={e => {
            const n = parseInt(e.target.value, 16);
            if (!isNaN(n)) setFrameId(n, activeFrame.extended);
          }}
          leftSection={<Text size="xs" c="dimmed">0x</Text>}
        />
        <Select
          label="Frame Type"
          value={activeFrame.extended ? 'extended' : 'standard'}
          onChange={v => setFrameId(activeFrame.id, v === 'extended')}
          data={[
            { value: 'standard', label: 'Standard (11-bit)' },
            { value: 'extended', label: 'Extended (29-bit)' },
          ]}
        />
        <TextInput
          label="Label"
          value={activeFrame.label ?? ''}
          onChange={e => setFrameLabel(e.target.value)}
          placeholder="Frame description"
        />
      </SimpleGrid>

      {/* Hex input */}
      <TextInput
        label="Hex Data (8 bytes)"
        value={bytesToHex(activeFrame.data)}
        onChange={e => handleHexInput(e.target.value)}
        placeholder="00 00 00 00 00 00 00 00"
        style={{ fontFamily: 'monospace' }}
        description="Edit hex directly — space-separated bytes"
      />

      {/* Binary view */}
      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {bytesToBinary(activeFrame.data)}
      </Text>

      <Divider label="Bit Grid (click to toggle bits)" labelPosition="left" />

      {/* Visual byte grid */}
      <Paper withBorder p="sm">
        <ByteGrid
          data={activeFrame.data}
          signals={activeFrame.signals}
          onToggleBit={handleToggleBit}
        />
      </Paper>

      <Divider label="Signals" labelPosition="left" />

      {/* Signal decode panel */}
      <SignalDecodePanel signals={activeFrame.signals} data={activeFrame.data} />

      <Button
        leftSection={<IconPlus size={14} />}
        variant="outline"
        size="sm"
        onClick={openSig}
      >
        Add Signal
      </Button>

      {/* Copy as Lua */}
      <CopyButton value={luaTable} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy frame as Lua table'}>
            <Button
              leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              variant="subtle"
              size="xs"
              color={copied ? 'teal' : 'gray'}
              onClick={copy}
            >
              Copy as Lua
            </Button>
          </Tooltip>
        )}
      </CopyButton>

      <SignalFormModal opened={sigModalOpen} onClose={closeSig} onSubmit={handleAddSignal} />
    </Stack>
  );
}
