'use client';

interface Props {
  lateralG: number;
  longitudinalG: number;
  maxG?: number;
  size?: number;
}

export default function GForceGauge({ lateralG, longitudinalG, maxG = 2, size = 200 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  const dotX = cx + (lateralG / maxG) * r;
  const dotY = cy - (longitudinalG / maxG) * r;

  const angle = Math.atan2(-longitudinalG, lateralG);
  const tipX = cx + Math.cos(angle) * r * 0.6;
  const tipY = cy + Math.sin(angle) * r * 0.6;
  const b1X = cx + Math.cos(angle + 2.5) * r * 0.15;
  const b1Y = cy + Math.sin(angle + 2.5) * r * 0.15;
  const b2X = cx + Math.cos(angle - 2.5) * r * 0.15;
  const b2Y = cy + Math.sin(angle - 2.5) * r * 0.15;

  return (
    <svg
      width={size}
      height={size + size * 0.18}
      viewBox={`0 0 ${size} ${size + size * 0.18}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      <circle cx={cx} cy={cy} r={r + size * 0.04} fill="#111" />
      <circle cx={cx} cy={cy} r={r} fill="#0a0a0a" />
      <circle cx={cx} cy={cy} r={r / 2} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />

      <text x={cx + r * 0.5 + 4} y={cy - 4} fill="white" fontSize={size * 0.07} fontFamily="sans-serif">1G</text>
      <text x={cx - r * 0.05} y={cy - r - 4} fill="white" fontSize={size * 0.07} fontFamily="sans-serif" textAnchor="middle">+{maxG}G</text>
      <text x={cx - r - 4} y={cy + 4} fill="white" fontSize={size * 0.07} fontFamily="sans-serif" textAnchor="end">{maxG}G</text>

      {(Math.abs(lateralG) > 0.05 || Math.abs(longitudinalG) > 0.05) && (
        <polygon
          points={`${tipX},${tipY} ${b1X},${b1Y} ${b2X},${b2Y}`}
          fill="white"
          opacity={0.85}
        />
      )}

      <circle
        cx={Math.max(cx - r, Math.min(cx + r, dotX))}
        cy={Math.max(cy - r, Math.min(cy + r, dotY))}
        r={size * 0.045}
        fill="#e03131"
      />

      <text x={cx} y={size + size * 0.10} textAnchor="middle" fill="white" fontSize={size * 0.09} fontFamily="sans-serif">
        G-Force
      </text>
      <text x={cx} y={size + size * 0.165} textAnchor="middle" fill="#aaa" fontSize={size * 0.07} fontFamily="monospace">
        {lateralG.toFixed(2)}G / {longitudinalG.toFixed(2)}G
      </text>
    </svg>
  );
}
