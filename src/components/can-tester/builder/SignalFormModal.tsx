'use client';

import {
  Modal, TextInput, NumberInput, Select, Switch, Button, Stack, Group, SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { CANSignal, ByteOrder } from '@/lib/can-tester/types';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (sig: CANSignal) => void;
}

export function SignalFormModal({ opened, onClose, onSubmit }: Props) {
  const form = useForm<CANSignal>({
    initialValues: {
      id: crypto.randomUUID(),
      name: '',
      startBit: 0,
      bitLength: 8,
      byteOrder: 'intel',
      signed: false,
      scale: 1,
      offset: 0,
      unit: '',
    },
    validate: {
      name: v => v.trim() ? null : 'Name required',
      bitLength: v => (v >= 1 && v <= 64) ? null : '1–64 bits',
      startBit: v => (v >= 0 && v <= 63) ? null : '0–63',
    },
  });

  function handleSubmit(values: CANSignal) {
    onSubmit({ ...values, id: crypto.randomUUID() });
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add Signal" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <TextInput label="Signal Name" placeholder="RPM" {...form.getInputProps('name')} />
            <TextInput label="Unit" placeholder="RPM, %, kPa…" {...form.getInputProps('unit')} />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <NumberInput label="Start Bit" min={0} max={63} {...form.getInputProps('startBit')} />
            <NumberInput label="Bit Length" min={1} max={64} {...form.getInputProps('bitLength')} />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <Select
              label="Byte Order"
              data={[
                { value: 'intel', label: 'Intel (little-endian)' },
                { value: 'motorola', label: 'Motorola (big-endian)' },
              ]}
              {...form.getInputProps('byteOrder')}
            />
            <Switch
              label="Signed"
              mt="xl"
              {...form.getInputProps('signed', { type: 'checkbox' })}
            />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <NumberInput label="Scale (multiplier)" decimalScale={6} {...form.getInputProps('scale')} />
            <NumberInput label="Offset" decimalScale={3} {...form.getInputProps('offset')} />
          </SimpleGrid>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Signal</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
