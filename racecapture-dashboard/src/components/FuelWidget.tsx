'use client';

import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';

interface Props {
  fuelChannelName?: string;
  tankSize?: number;
  targetLaps?: number;
}

export default function FuelWidget({
  fuelChannelName = 'FuelLevel',
  tankSize = 100,
  targetLaps = 0,
}: Props) {
  const { channels } = useTelemetry();
  const [lapFuelUsage, setLapFuelUsage] = useState<number[]>([]);
  const lapStartFuelRef = useRef<number | null>(null);
  const prevLapRef = useRef<number>(0);

  const fuelCh = channels.get(fuelChannelName);
  const fuel = fuelCh?.value ?? 0;
  const lapCount = channels.get('LapCount')?.value ?? 0;

  useEffect(() => {
    if (lapStartFuelRef.current === null) {
      lapStartFuelRef.current = fuel;
    }
    if (lapCount > prevLapRef.current && prevLapRef.current > 0) {
      const used = lapStartFuelRef.current! - fuel;
      if (used > 0) {
        setLapFuelUsage((prev) => [...prev.slice(-9), used]);
      }
      lapStartFuelRef.current = fuel;
      prevLapRef.current = lapCount;
    } else if (prevLapRef.current === 0 && lapCount > 0) {
      prevLapRef.current = lapCount;
    }
  }, [fuel, lapCount]);

  const avgPerLap = lapFuelUsage.length > 0 ? lapFuelUsage.reduce((a, b) => a + b, 0) / lapFuelUsage.length : null;
  const lapsRemaining = avgPerLap && avgPerLap > 0 ? fuel / avgPerLap : null;
  const pct = Math.max(0, Math.min(1, fuel / (tankSize || 100)));

  const fuelColor =
    pct < 0.1 ? '#e03131' : pct < 0.25 ? '#f76707' : pct < 0.4 ? '#f59f00' : '#2f9e44';

  return (
    <div
      style={{
        background: '#0e0e14',
        border: '1px solid #222',
        borderRadius: 12,
        padding: '10px 16px',
        display: 'flex',
        gap: 20,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>FUEL</div>
        <div style={{ color: fuelColor, fontSize: 22, fontFamily: 'monospace', fontWeight: 700 }}>
          {fuel.toFixed(1)}%
        </div>
        <div
          style={{
            width: 80,
            height: 6,
            background: '#1a1a24',
            borderRadius: 3,
            marginTop: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{ width: `${pct * 100}%`, height: '100%', background: fuelColor, borderRadius: 3, transition: 'width 0.3s' }}
          />
        </div>
      </div>

      {avgPerLap !== null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>PER LAP</div>
          <div style={{ color: '#aaa', fontSize: 18, fontFamily: 'monospace' }}>{avgPerLap.toFixed(1)}%</div>
        </div>
      )}

      {lapsRemaining !== null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>LAPS LEFT</div>
          <div
            style={{
              fontSize: 22,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: lapsRemaining < 3 ? '#e03131' : lapsRemaining < 6 ? '#f76707' : '#2f9e44',
            }}
          >
            {lapsRemaining.toFixed(1)}
          </div>
          {targetLaps > 0 && (
            <div style={{ color: '#555', fontSize: 11 }}>Target: {targetLaps}</div>
          )}
        </div>
      )}
    </div>
  );
}
