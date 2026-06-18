'use client';

import {
  Modal, TextInput, NumberInput, Select, Button, Stack, Group, SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { ChannelDefinition, SimWaveform } from '@/lib/can-tester/types';

const WAVEFORMS: { value: SimWaveform; label: string }[] = [
  { value: 'constant',    label: 'Constant'     },
  { value: 'sine',        label: 'Sine wave'    },
  { value: 'ramp',        label: 'Ramp'         },
  { value: 'step',        label: 'Step'         },
  { value: 'random-walk', label: 'Random walk'  },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  initial?: Partial<ChannelDefinition>;
  onSubmit: (ch: ChannelDefinition) => void;
}

export function ChannelFormModal({ opened, onClose, initial, onSubmit }: Props) {
  const form = useForm<ChannelDefinition>({
    initialValues: {
      id: initial?.id ?? crypto.randomUUID(),
      name: initial?.name ?? '',
      unit: initial?.unit ?? '',
      minValue: initial?.minValue ?? 0,
      maxValue: initial?.maxValue ?? 100,
      defaultValue: initial?.defaultValue ?? 0,
      waveform: initial?.waveform ?? 'constant',
      waveformPeriodMs: initial?.waveformPeriodMs ?? 5000,
      noiseAmplitude: initial?.noiseAmplitude ?? 0,
    },
    validate: {
      name: (v) => v.trim() ? null : 'Name required',
      maxValue: (v, vals) => v > vals.minValue ? null : 'Max must be > min',
    },
  });

  function handleSubmit(values: ChannelDefinition) {
    onSubmit(values);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={initial?.id ? 'Edit Channel' : 'Add Channel'} size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <TextInput label="Channel Name" placeholder="RPM" {...form.getInputProps('name')} />
            <TextInput label="Unit" placeholder="RPM, °C, %, kPa…" {...form.getInputProps('unit')} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, xs: 3 }}>
            <NumberInput label="Min Value" {...form.getInputProps('minValue')} decimalScale={3} />
            <NumberInput label="Max Value" {...form.getInputProps('maxValue')} decimalScale={3} />
            <NumberInput label="Default Value" {...form.getInputProps('defaultValue')} decimalScale={3} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <Select
              label="Simulation Waveform"
              data={WAVEFORMS}
              {...form.getInputProps('waveform')}
            />
            <NumberInput
              label="Period (ms)"
              min={100}
              max={300000}
              {...form.getInputProps('waveformPeriodMs')}
            />
          </SimpleGrid>

          <NumberInput
            label="Noise Amplitude"
            description="±random noise added to waveform"
            min={0}
            {...form.getInputProps('noiseAmplitude')}
            decimalScale={3}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initial?.id ? 'Save' : 'Add'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
