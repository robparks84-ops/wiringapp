'use client';

import { Text, Tooltip } from '@mantine/core';
import { CANSignal } from '@/lib/can-tester/types';
import { getSignalBitSpan } from '@/lib/can-tester/can/encoding';

// Assign a color to each signal by index
const SIGNAL_COLORS = [
  '#4dabf7', '#74c0fc', '#a9e34b', '#ffd43b', '#ff922b',
  '#f783ac', '#da77f2', '#69db7c', '#ff6b6b', '#4ecdc4',
];

interface Props {
  data: number[];
  signals: CANSignal[];
  onToggleBit: (absPos: number) => void;
}

export function ByteGrid({ data, signals, onToggleBit }: Props) {
  // Map absPos → signal name + color
  const bitColors = new Map<number, { color: string; name: string }>();
  signals.forEach((sig, i) => {
    const span = getSignalBitSpan(sig);
    const color = SIGNAL_COLORS[i % SIGNAL_COLORS.length];
    span.forEach(pos => bitColors.set(pos, { color, name: sig.name }));
  });

  const cells: React.ReactNode[] = [];
  for (let byteIdx = 0; byteIdx < 8; byteIdx++) {
    for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
      // absolute position (bit 0 = byte0 bit0 = LSB of first byte)
      const absPos = byteIdx * 8 + bitIdx;
      const bitVal = (data[byteIdx] >> bitIdx) & 1;
      const sigInfo = bitColors.get(absPos);

      const cell = (
        <Tooltip
          key={absPos}
          label={sigInfo ? `${sigInfo.name} (bit ${absPos})` : `Bit ${absPos}`}
          withArrow
          openDelay={300}
        >
          <div
            onClick={() => onToggleBit(absPos)}
            style={{
              aspectRatio: '1',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'monospace',
              userSelect: 'none',
              background: sigInfo
                ? (bitVal ? sigInfo.color : `${sigInfo.color}44`)
                : (bitVal ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-default-border)'),
              color: bitVal ? (sigInfo ? '#000' : '#fff') : 'var(--mantine-color-dimmed)',
              border: sigInfo ? `1px solid ${sigInfo.color}` : '1px solid transparent',
              transition: 'background 0.1s',
            }}
          >
            {bitVal}
          </div>
        </Tooltip>
      );
      cells.push(cell);
    }
  }

  return (
    <div>
      {/* Bit position header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, marginBottom: 2 }}>
        {[7,6,5,4,3,2,1,0].map(b => (
          <Text key={b} size="9px" ta="center" c="dimmed" style={{ fontFamily: 'monospace' }}>{b}</Text>
        ))}
      </div>
      {/* 8 rows (bytes) × 8 cols (bits) */}
      {Array.from({ length: 8 }, (_, byteIdx) => (
        <div key={byteIdx} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
          <Text size="10px" c="dimmed" style={{ width: 20, textAlign: 'right', fontFamily: 'monospace', flexShrink: 0 }}>
            B{byteIdx}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, flex: 1 }}>
            {cells.slice(byteIdx * 8, byteIdx * 8 + 8)}
          </div>
          <Text size="10px" c="dimmed" style={{ width: 30, textAlign: 'left', fontFamily: 'monospace', flexShrink: 0 }}>
            {data[byteIdx].toString(16).padStart(2, '0').toUpperCase()}
          </Text>
        </div>
      ))}
    </div>
  );
}
