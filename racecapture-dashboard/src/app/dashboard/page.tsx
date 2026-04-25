'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Group,
  Badge,
  Menu,
  ActionIcon,
  Tooltip,
  Switch,
  Collapse,
} from '@mantine/core';
import {
  IconPlus,
  IconLogout,
  IconRefresh,
  IconMap,
  IconDownload,
  IconSettings,
  IconCalculator,
  IconChevronDown,
  IconChevronUp,
  IconFlag,
  IconClock,
  IconTrophy,
  IconBug,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { TelemetryProvider, useTelemetry } from '@/contexts/TelemetryContext';
import type { WidgetConfig, GridItem, AlarmRule, DashboardLayout } from '@/lib/types';
import DashboardGrid from '@/components/DashboardGrid';
import ChannelPicker from '@/components/ChannelPicker';
import DeltaTimer from '@/components/DeltaTimer';
import TrackMap from '@/components/TrackMap';
import AlarmBanner from '@/components/AlarmBanner';
import FuelWidget from '@/components/FuelWidget';
import LapSelector from '@/components/LapSelector';
import CriticalAlertOverlay from '@/components/CriticalAlertOverlay';
import StintPanel from '@/components/StintPanel';
import FlagDisplay from '@/components/FlagDisplay';
import ChampcarMap from '@/components/ChampcarMap';
import SpeedhivePanel from '@/components/SpeedhivePanel';
import MathChannelEditor from '@/components/MathChannelEditor';
import SystemStatus from '@/components/SystemStatus';

const STORAGE_KEY = 'rc_dashboard_layouts';
const DEFAULT_LAYOUT_ID = 'default';

function loadLayouts(): DashboardLayout[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveLayouts(layouts: DashboardLayout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}

function Section({
  label,
  icon,
  children,
  defaultOpen = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid #1e1e2e' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: 'transparent',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {icon}
        <span>{label}</span>
        <span style={{ marginLeft: 'auto' }}>{open ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}</span>
      </button>
      <Collapse in={open}>
        <div style={{ padding: '0 16px 10px' }}>{children}</div>
      </Collapse>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { token, logout } = useAuth() as { token: string | null; logout: () => void };
  const { connected, lastError, graphByDistance, setGraphByDistance, resetSessionStats } = useTelemetry();

  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState(DEFAULT_LAYOUT_ID);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [gridLayout, setGridLayout] = useState<GridItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);
  const [alarmRules] = useState<AlarmRule[]>([]);
  const [myCarNumber] = useState('');

  useEffect(() => {
    if (!token) { router.replace('/'); return; }
    const stored = loadLayouts();
    if (stored.length === 0) {
      const defaultLayout: DashboardLayout = { id: DEFAULT_LAYOUT_ID, name: 'Default', widgets: [], gridLayout: [] };
      setLayouts([defaultLayout]);
    } else {
      setLayouts(stored);
      const active = stored.find((l) => l.id === DEFAULT_LAYOUT_ID) ?? stored[0];
      setWidgets(active.widgets);
      setGridLayout(active.gridLayout);
      setActiveLayoutId(active.id);
    }
  }, [token, router]);

  const persist = useCallback(
    (newWidgets: WidgetConfig[], newGrid: GridItem[]) => {
      setLayouts((prev) => {
        const updated = prev.map((l) =>
          l.id === activeLayoutId ? { ...l, widgets: newWidgets, gridLayout: newGrid } : l,
        );
        saveLayouts(updated);
        return updated;
      });
    },
    [activeLayoutId],
  );

  function handleWidgetsChange(w: WidgetConfig[]) { setWidgets(w); persist(w, gridLayout); }
  function handleLayoutChange(g: GridItem[]) { setGridLayout(g); persist(widgets, g); }

  function handleAddWidget(config: WidgetConfig) {
    const col = (widgets.length * 3) % 12;
    const row = Math.floor(widgets.length / 4) * 3;
    const newGrid: GridItem = { i: config.id, x: col, y: row, w: 3, h: 3 };
    const w = [...widgets, config];
    const g = [...gridLayout, newGrid];
    setWidgets(w); setGridLayout(g); persist(w, g);
  }

  function switchLayout(id: string) {
    const l = layouts.find((x) => x.id === id);
    if (!l) return;
    setActiveLayoutId(id); setWidgets(l.widgets); setGridLayout(l.gridLayout);
  }

  function newLayout() {
    const id = `layout-${Date.now()}`;
    const layout: DashboardLayout = { id, name: `Layout ${layouts.length + 1}`, widgets: [], gridLayout: [] };
    const updated = [...layouts, layout];
    setLayouts(updated); saveLayouts(updated); switchLayout(id);
  }

  function exportCSV() {
    const headers = ['timestamp', ...widgets.map((w) => w.channelName)];
    const blob = new Blob([headers.join(',') + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `rc-${Date.now()}.csv` }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f', overflow: 'hidden' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px', background: '#0e0e14', borderBottom: '1px solid #1e1e2e', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: -0.5 }}>RaceCapture</div>
        <Badge color={connected ? 'green' : 'red'} variant="dot" size="sm">
          {connected ? 'LIVE' : lastError ? 'ERROR' : 'WAITING'}
        </Badge>
        <FlagDisplay />
        <LapSelector />
        <div style={{ flex: 1 }} />
        <Group gap={6}>
          <Switch
            size="xs"
            label={<span style={{ fontSize: 11, color: '#aaa' }}>By distance</span>}
            checked={graphByDistance}
            onChange={(e) => setGraphByDistance(e.currentTarget.checked)}
          />
          <Tooltip label="Track map">
            <ActionIcon variant={showMap ? 'filled' : 'subtle'} size="sm" onClick={() => setShowMap((s) => !s)} color="teal">
              <IconMap size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Math channels">
            <ActionIcon variant="subtle" size="sm" onClick={() => setMathOpen(true)} color="violet">
              <IconCalculator size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset stats">
            <ActionIcon variant="subtle" size="sm" onClick={resetSessionStats}><IconRefresh size={14} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Export CSV">
            <ActionIcon variant="subtle" size="sm" onClick={exportCSV}><IconDownload size={14} /></ActionIcon>
          </Tooltip>
          <Button size="xs" leftSection={<IconPlus size={12} />} onClick={() => setPickerOpen(true)}>
            Add Widget
          </Button>
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm"><IconSettings size={14} /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Layouts</Menu.Label>
              {layouts.map((l) => (
                <Menu.Item key={l.id} fw={l.id === activeLayoutId ? 700 : 400} onClick={() => switchLayout(l.id)}>
                  {l.name}
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item leftSection={<IconPlus size={12} />} onClick={newLayout}>New layout</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={12} />} onClick={() => { logout(); router.replace('/'); }}>
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>

      {/* ── Stint / session bar ── */}
      <div style={{ padding: '4px 16px', flexShrink: 0, background: '#0e0e14', borderBottom: '1px solid #1a1a28' }}>
        <StintPanel />
      </div>

      {/* ── Delta timer ── */}
      <div style={{ padding: '4px 16px', flexShrink: 0 }}>
        <DeltaTimer />
      </div>

      {/* ── Main scrollable area ── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {showMap && (
          <div style={{ height: 260, margin: '0 16px 10px', borderRadius: 12, overflow: 'hidden', border: '1px solid #222', flexShrink: 0 }}>
            <TrackMap />
          </div>
        )}

        {/* Widget grid */}
        <div style={{ padding: '0 16px 8px', flex: 1 }}>
          <DashboardGrid widgets={widgets} layout={gridLayout} onWidgetsChange={handleWidgetsChange} onLayoutChange={handleLayoutChange} />
          {widgets.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 12 }}>
              <div style={{ fontSize: 48 }}>📡</div>
              <div style={{ fontSize: 18, color: '#555' }}>No widgets yet</div>
              <div style={{ fontSize: 13, color: '#444' }}>
                {connected ? 'Click "Add Widget" to build your dashboard' : 'Start your RaceCapture session, then add widgets'}
              </div>
              <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => setPickerOpen(true)} variant="subtle">
                Add your first widget
              </Button>
            </div>
          )}
        </div>

        {/* ── Collapsible info panels ── */}
        <Section label="Champcar Marching Ants" icon={<IconFlag size={12} />}>
          <ChampcarMap myCarNumber={myCarNumber} />
        </Section>

        <Section label="Speedhive Live Timing" icon={<IconTrophy size={12} />}>
          <SpeedhivePanel myCarNumber={myCarNumber} />
        </Section>

        <Section label="System Status" icon={<IconBug size={12} />}>
          <SystemStatus />
        </Section>

        {/* ── Fuel bar ── */}
        <div style={{ padding: '6px 16px', borderTop: '1px solid #1e1e2e', flexShrink: 0 }}>
          <FuelWidget />
        </div>
      </div>

      {pickerOpen && <ChannelPicker onAdd={handleAddWidget} onClose={() => setPickerOpen(false)} />}
      {mathOpen && <MathChannelEditor onClose={() => setMathOpen(false)} />}
      <AlarmBanner rules={alarmRules} />
      <CriticalAlertOverlay widgets={widgets} />
    </div>
  );
}

export default function DashboardPage() {
  const { token } = useAuth();
  return (
    <TelemetryProvider token={token}>
      <DashboardContent />
    </TelemetryProvider>
  );
}
