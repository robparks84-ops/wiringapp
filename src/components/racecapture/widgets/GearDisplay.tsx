'use client';

interface Props {
  gear: number;
  rpm?: number;
  rpmMax?: number;
  size?: number;
}

const GEAR_LABELS: Record<number, string> = { 0: 'N', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: 'R' };

function rpmColor(pct: number): string {
  if (pct < 0.7) return '#2f9e44';
  if (pct < 0.85) return '#f59f00';
  if (pct < 0.95) return '#f76707';
  return '#e03131';
}

export default function GearDisplay({ gear, rpm = 0, rpmMax = 8000, size = 200 }: Props) {
  const label = GEAR_LABELS[Math.round(gear)] ?? String(Math.round(gear));
  const rpmPct = Math.max(0, Math.min(1, rpm / rpmMax));
  const color = rpmColor(rpmPct);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      borderRadius: 12,
      gap: 8,
      padding: 8,
    }}>
      <div style={{
        fontSize: `clamp(60px, ${size * 0.55}px, 160px)`,
        fontFamily: 'monospace',
        fontWeight: 900,
        color,
        lineHeight: 1,
        textShadow: `0 0 40px ${color}66`,
        transition: 'color 0.1s ease',
      }}>
        {label}
      </div>

      {rpm > 0 && (
        <div style={{ width: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%',
            height: 10,
            background: '#1a1a24',
            borderRadius: 5,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${rpmPct * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, #2f9e44, ${color})`,
              borderRadius: 5,
              transition: 'width 0.05s ease',
            }} />
          </div>
          <div style={{ color: '#555', fontSize: 11, fontFamily: 'monospace' }}>
            {rpm >= 1000 ? `${(rpm / 1000).toFixed(1)}k` : rpm.toFixed(0)} RPM
          </div>
        </div>
      )}

      {rpm > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 8 }, (_, i) => {
            const threshold = 0.6 + i * 0.05;
            const lit = rpmPct >= threshold;
            const dotColor = i < 4 ? '#2f9e44' : i < 6 ? '#f59f00' : '#e03131';
            return (
              <div key={i} style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: lit ? dotColor : '#1a1a24',
                boxShadow: lit ? `0 0 8px ${dotColor}` : 'none',
                transition: 'background 0.05s',
              }} />
            );
          })}
        </div>
      )}

      <div style={{ color: '#444', fontSize: 10, letterSpacing: 1 }}>GEAR</div>
    </div>
  );
}
