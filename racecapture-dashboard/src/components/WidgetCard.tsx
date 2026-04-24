'use client';

import { useState } from 'react';
import { IconSettings, IconX, IconGripVertical } from '@tabler/icons-react';
import type { WidgetConfig } from '@/lib/types';
import { useTelemetry } from '@/contexts/TelemetryContext';
import { getStats, getAvg } from '@/lib/statsAccumulator';
import DialGauge from './widgets/DialGauge';
import GForceGauge from './widgets/GForceGauge';
import DigitalDisplay from './widgets/DigitalDisplay';
import HorizontalBar from './widgets/HorizontalBar';
import VerticalBar from './widgets/VerticalBar';
import LineChart from './widgets/LineChart';
import WidgetConfigModal from './WidgetConfigModal';

interface Props {
  config: WidgetConfig;
  onUpdate: (config: WidgetConfig) => void;
  onRemove: () => void;
}

export default function WidgetCard({ config, onUpdate, onRemove }: Props) {
  const [configOpen, setConfigOpen] = useState(false);
  const { channels, history, graphByDistance, selectedLap, lapData } = useTelemetry();

  const ch = channels.get(config.channelName);
  const value = ch?.value ?? 0;
  const channelHistory = history.get(config.channelName) ?? [];
  const lapHistory = selectedLap ? lapData.get(config.channelName) : undefined;
  const stats = getStats(config.channelName);

  function renderWidget() {
    switch (config.type) {
      case 'dial':
        return (
          <DialGauge
            value={value}
            min={config.min}
            max={config.max}
            label={config.label}
            unit={config.unit}
            zones={config.zones}
          />
        );
      case 'gforce': {
        const chY = channels.get(config.channelNameY ?? '');
        return (
          <GForceGauge
            lateralG={value}
            longitudinalG={chY?.value ?? 0}
          />
        );
      }
      case 'digital':
        return (
          <DigitalDisplay
            value={value}
            label={config.label}
            unit={config.unit}
            zones={config.zones}
            stats={stats}
          />
        );
      case 'hbar':
        return (
          <HorizontalBar
            value={value}
            min={config.min}
            max={config.max}
            label={config.label}
            unit={config.unit}
            zones={config.zones}
            stats={stats}
          />
        );
      case 'vbar':
        return (
          <VerticalBar
            value={value}
            min={config.min}
            max={config.max}
            label={config.label}
            unit={config.unit}
            zones={config.zones}
            stats={stats}
          />
        );
      case 'linechart':
        return (
          <LineChart
            history={channelHistory}
            lapHistory={lapHistory}
            label={config.label}
            unit={config.unit}
            min={config.min}
            max={config.max}
            zones={config.zones}
            graphByDistance={graphByDistance}
            showLapOverlay={!!lapHistory}
          />
        );
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        background: '#12121a',
        borderRadius: 12,
        border: '1px solid #222',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Control bar */}
      <div
        className="widget-controls"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          display: 'flex',
          gap: 4,
          zIndex: 10,
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      >
        <button
          onClick={() => setConfigOpen(true)}
          style={iconBtnStyle}
          title="Configure widget"
        >
          <IconSettings size={14} />
        </button>
        <button onClick={onRemove} style={{ ...iconBtnStyle, color: '#f03e3e' }} title="Remove widget">
          <IconX size={14} />
        </button>
      </div>

      {/* Drag handle */}
      <div
        className="drag-handle"
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          color: '#444',
          cursor: 'grab',
          zIndex: 10,
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      >
        <IconGripVertical size={14} />
      </div>

      {/* Widget content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        {renderWidget()}
      </div>

      {configOpen && (
        <WidgetConfigModal
          config={config}
          onSave={(updated) => { onUpdate(updated); setConfigOpen(false); }}
          onClose={() => setConfigOpen(false)}
        />
      )}

      <style>{`
        div:hover > .widget-controls,
        div:hover > .drag-handle { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#aaa',
  cursor: 'pointer',
  padding: '3px 4px',
  display: 'flex',
  alignItems: 'center',
};
