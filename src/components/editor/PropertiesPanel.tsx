'use client';

import {
  ActionIcon, Box, Button, ColorInput, Divider,
  Group, NumberInput, ScrollArea, SegmentedControl, Select,
  Stack, Switch, Text, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Cavity, CavityNodeData } from '@/lib/nodeDefaults';
import { groundBlockCavities } from '@/lib/nodeDefaults';

interface PropertiesPanelProps {
  selected: { node?: Node; edge?: Edge } | null;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  onUpdateEdge: (id: string, data: Record<string, unknown>) => void;
  onDelete: () => void;
  onRemoveCavity: (nodeId: string, cavityId: string) => void;
}

const WIRE_COLORS = [
  { label: 'Black',   value: '#212529' },
  { label: 'Red',     value: '#c92a2a' },
  { label: 'White',   value: '#f8f9fa' },
  { label: 'Yellow',  value: '#f59f00' },
  { label: 'Blue',    value: '#1971c2' },
  { label: 'Green',   value: '#2f9e44' },
  { label: 'Orange',  value: '#e67700' },
  { label: 'Brown',   value: '#7c4a03' },
  { label: 'Pink',    value: '#e64980' },
  { label: 'Purple',  value: '#862e9c' },
  { label: 'Gray',    value: '#868e96' },
  { label: 'Lt Blue', value: '#74c0fc' },
  { label: 'Nat',     value: '#ffe8cc' },
];

const GAUGES = [
  '0 AWG', '2 AWG', '4 AWG', '6 AWG', '8 AWG',
  '10 AWG', '12 AWG', '14 AWG', '16 AWG',
  '18 AWG', '20 AWG', '22 AWG', '24 AWG', '26 AWG',
];

export function PropertiesPanel({
  selected, onUpdateNode, onUpdateEdge, onDelete, onRemoveCavity,
}: PropertiesPanelProps) {
  const node = selected?.node;
  const edge = selected?.edge;

  const nodeForm = useForm({ initialValues: { label: '' } });
  const edgeForm = useForm({ initialValues: { color: '#ffffff', stripeColor: '', gauge: '20 AWG', label: '', hideGauge: false } });

  // Node header color (for all cavity/groundBlock nodes)
  const [nodeColor, setNodeColor] = useState<string>('#495057');

  // Local editable copy of cavities
  const [cavities, setCavities] = useState<Cavity[]>([]);

  // Connector-specific fields
  const [connColor, setConnColor]   = useState<string>('black');
  const [gender, setGender]         = useState<string>('female');
  const [sealed, setSealed]         = useState<boolean>(true);
  const [notes, setNotes]           = useState<string>('');

  // Ground block posts
  const [posts, setPosts]           = useState<number>(4);

  useEffect(() => {
    if (node) {
      const d = node.data as Record<string, unknown>;
      nodeForm.setValues({ label: (d.label as string) ?? '' });
      const raw = (d.cavities as Cavity[]) ?? [];
      setCavities(raw.map((c) => ({ ...c })));

      // connector fields
      setConnColor((d.connectorColor as string) ?? 'black');
      setGender((d.gender as string) ?? 'female');
      setSealed(typeof d.sealed === 'boolean' ? d.sealed : true);
      setNotes((d.notes as string) ?? '');

      // ground block
      setPosts(typeof d.posts === 'number' ? d.posts : 4);

      // node color
      setNodeColor((d.headerColor as string) ?? '#495057');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  useEffect(() => {
    if (edge) {
      const d = edge.data as Record<string, unknown> | undefined;
      edgeForm.setValues({
        color: (d?.color as string) ?? '#ffffff',
        stripeColor: (d?.stripeColor as string) ?? '',
        gauge: (d?.gauge as string) ?? '20 AWG',
        label: (d?.label as string) ?? '',
        hideGauge: (d?.hideGauge as boolean) ?? false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edge?.id]);

  if (!node && !edge) {
    return (
      <Box style={{ width: 220, borderLeft: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-gray-0)', padding: 16, flexShrink: 0 }}>
        <Text fz={12} c="dimmed" ta="center" mt={32}>
          Click a component or wire to edit.
        </Text>
      </Box>
    );
  }

  const isCavityNode = node && (node.type === 'cavity' || node.type === 'groundBlock');
  const isConnector  = node?.type === 'cavity' && (node.data as CavityNodeData).category === 'connector';
  const isGroundBlock = node?.type === 'groundBlock';

  function handleSaveLabel() {
    if (!node) return;
    onUpdateNode(node.id, { ...node.data, label: nodeForm.values.label });
  }

  function handleCavityLabelChange(idx: number, val: string) {
    const next = cavities.map((c, i) => i === idx ? { ...c, label: val } : c);
    setCavities(next);
  }

  function handleSaveCavities() {
    if (!node) return;
    onUpdateNode(node.id, { ...node.data, cavities });
  }

  function handleDeleteCavity(cavityId: string) {
    if (!node) return;
    setCavities((prev) => prev.filter((c) => c.id !== cavityId));
    onRemoveCavity(node.id, cavityId);
  }

  function handleAddCavity() {
    const newCav: Cavity = { id: Math.random().toString(36).slice(2), label: `Cav ${cavities.length + 1}` };
    const next = [...cavities, newCav];
    setCavities(next);
    if (node) onUpdateNode(node.id, { ...node.data, cavities: next });
  }

  function handleNodeColorChange(val: string) {
    setNodeColor(val);
    if (node) onUpdateNode(node.id, { ...node.data, headerColor: val });
  }

  function handleConnectorColorChange(val: string) {
    setConnColor(val);
    if (!node) return;
    const headerColor = val === 'gray' ? '#868e96' : '#212529';
    setNodeColor(headerColor);
    onUpdateNode(node.id, { ...node.data, connectorColor: val, headerColor });
  }

  function handleGenderChange(val: string) {
    setGender(val);
    if (node) onUpdateNode(node.id, { ...node.data, gender: val });
  }

  function handleSealedChange(val: boolean) {
    setSealed(val);
    if (node) onUpdateNode(node.id, { ...node.data, sealed: val });
  }

  function handleNotesBlur(val: string) {
    setNotes(val);
    if (node) onUpdateNode(node.id, { ...node.data, notes: val });
  }

  function handlePostsChange(val: number | string) {
    const n = typeof val === 'number' ? val : parseInt(val as string, 10);
    if (!n || n < 1 || !node) return;
    setPosts(n);
    // Rebuild cavities: keep Main Stud + existing post labels up to n, fill new ones
    const existing = cavities.slice(1); // skip Main Stud
    const newPosts = Array.from({ length: n }, (_, i) => {
      return existing[i] ?? { id: Math.random().toString(36).slice(2), label: `Post ${i + 1}` };
    });
    const mainStud = cavities[0] ?? { id: Math.random().toString(36).slice(2), label: 'Main Stud' };
    const next = [mainStud, ...newPosts];
    setCavities(next);
    onUpdateNode(node.id, { ...node.data, posts: n, cavities: next });
  }

  return (
    <Box style={{ width: 240, borderLeft: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-gray-0)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Box p={10} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text fz={11} fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
          {node ? 'Component' : 'Wire'}
        </Text>
      </Box>

      <ScrollArea style={{ flex: 1 }}>
        <Box p={10}>
          {/* ── NODE ── */}
          {node && (
            <Stack gap="xs">
              <Group gap="xs">
                <TextInput
                  label="Label"
                  size="xs"
                  style={{ flex: 1 }}
                  {...nodeForm.getInputProps('label')}
                />
                <Button size="xs" mt={18} onClick={handleSaveLabel} variant="light">
                  Set
                </Button>
              </Group>

              {/* Node color — available for all cavity and groundBlock nodes */}
              {isCavityNode && (
                <ColorInput
                  label="Node color"
                  size="xs"
                  value={nodeColor}
                  onChange={handleNodeColorChange}
                  swatches={['#212529','#868e96','#f8f9fa','#1864ab','#1971c2','#2f9e44','#c92a2a','#e67700','#862e9c','#0c8599','#495057','#5c2d91','#e64980','#f59f00','#74c0fc']}
                />
              )}

              {/* Ground block: posts control */}
              {isGroundBlock && (
                <>
                  <Divider label="Ground Block" labelPosition="left" fz={10} />
                  <NumberInput
                    label="Posts"
                    size="xs"
                    min={1}
                    max={20}
                    value={posts}
                    onChange={handlePostsChange}
                  />
                </>
              )}

              {/* Connector properties */}
              {isConnector && (
                <>
                  <Divider label="Connector" labelPosition="left" fz={10} />
                  <Text fz={11} fw={500} c="dimmed">Color</Text>
                  <SegmentedControl
                    size="xs"
                    value={connColor}
                    onChange={handleConnectorColorChange}
                    data={[
                      { label: 'Black', value: 'black' },
                      { label: 'Gray',  value: 'gray'  },
                    ]}
                  />
                  <Text fz={11} fw={500} c="dimmed">Gender</Text>
                  <SegmentedControl
                    size="xs"
                    value={gender}
                    onChange={handleGenderChange}
                    data={[
                      { label: 'Female', value: 'female' },
                      { label: 'Male',   value: 'male'   },
                    ]}
                  />
                  <Switch
                    label="Sealed / Weatherproof"
                    size="xs"
                    checked={sealed}
                    onChange={(e) => handleSealedChange(e.currentTarget.checked)}
                  />
                  <Textarea
                    label="Notes"
                    size="xs"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.currentTarget.value)}
                    onBlur={(e) => handleNotesBlur(e.currentTarget.value)}
                    placeholder="e.g. route through firewall grommet"
                  />
                </>
              )}

              {/* Cavities (cavity node and groundBlock) */}
              {isCavityNode && (
                <>
                  <Divider label="Cavities" labelPosition="left" fz={10} />
                  <Stack gap={2}>
                    {cavities.map((cav, idx) => (
                      <Group key={cav.id} gap={4}>
                        <TextInput
                          size="xs"
                          style={{ flex: 1 }}
                          value={cav.label}
                          onChange={(e) => handleCavityLabelChange(idx, e.currentTarget.value)}
                          onBlur={handleSaveCavities}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCavities()}
                        />
                        <Tooltip label="Delete cavity">
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteCavity(cav.id)}
                          >
                            <IconX size={11} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ))}
                  </Stack>
                  <Button
                    size="xs"
                    leftSection={<IconPlus size={12} />}
                    variant="light"
                    onClick={handleAddCavity}
                    fullWidth
                  >
                    Add cavity
                  </Button>
                </>
              )}

              {/* Ground / Splice nodes */}
              {(node.type === 'ground' || node.type === 'splice') && (
                <TextInput
                  label="Location"
                  size="xs"
                  defaultValue={(node.data as Record<string, unknown>)?.location as string ?? ''}
                  onBlur={(e) =>
                    onUpdateNode(node.id, { ...node.data, location: e.currentTarget.value })
                  }
                />
              )}
            </Stack>
          )}

          {/* ── EDGE ── */}
          {edge && (
            <form onSubmit={edgeForm.onSubmit((v) => onUpdateEdge(edge.id, { ...(edge.data as object), ...v }))}>
              <Stack gap="xs">
                <TextInput label="Circuit name" size="xs" placeholder="e.g. IGN_SW" {...edgeForm.getInputProps('label')} />
                <Select label="Wire gauge" size="xs" data={GAUGES} {...edgeForm.getInputProps('gauge')} />
                <Switch
                  label="Hide gauge tag on wire"
                  size="xs"
                  checked={edgeForm.values.hideGauge}
                  onChange={(e) => edgeForm.setFieldValue('hideGauge', e.currentTarget.checked)}
                />
                <ColorInput
                  label="Wire color (base)"
                  size="xs"
                  swatches={WIRE_COLORS.map((c) => c.value)}
                  {...edgeForm.getInputProps('color')}
                />
                <ColorInput
                  label="Stripe color (optional)"
                  size="xs"
                  swatches={WIRE_COLORS.map((c) => c.value)}
                  {...edgeForm.getInputProps('stripeColor')}
                />
                <Button type="submit" size="xs" mt={4}>Apply</Button>
              </Stack>
            </form>
          )}

          <Button color="red" variant="subtle" size="xs" fullWidth mt={12} leftSection={<IconTrash size={13} />} onClick={onDelete}>
            Delete {node ? 'component' : 'wire'}
          </Button>
        </Box>
      </ScrollArea>
    </Box>
  );
}
