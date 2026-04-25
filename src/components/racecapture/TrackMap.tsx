'use client';

import { useEffect, useRef } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';

interface Point {
  lat: number;
  lon: number;
  speed: number;
}

const MAX_POINTS = 5000;

function latLonToXY(lat: number, lon: number, bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }, w: number, h: number) {
  const pad = 20;
  const x = pad + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1)) * (w - 2 * pad);
  const y = pad + (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * (h - 2 * pad);
  return { x, y };
}

function speedToColor(speed: number, maxSpeed: number): string {
  const pct = Math.min(1, speed / (maxSpeed || 1));
  const r = Math.round(pct * 220 + (1 - pct) * 30);
  const g = Math.round((1 - Math.abs(pct - 0.5) * 2) * 200);
  const b = Math.round((1 - pct) * 220);
  return `rgb(${r},${g},${b})`;
}

export default function TrackMap() {
  const { channels } = useTelemetry();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);

  const lat = channels.get('Latitude')?.value ?? channels.get('latitude')?.value ?? 0;
  const lon = channels.get('Longitude')?.value ?? channels.get('longitude')?.value ?? 0;
  const speed = channels.get('Speed')?.value ?? 0;

  useEffect(() => {
    if (!lat && !lon) return;
    pointsRef.current.push({ lat, lon, speed });
    if (pointsRef.current.length > MAX_POINTS) {
      pointsRef.current = pointsRef.current.slice(-MAX_POINTS);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = pointsRef.current;
    if (points.length < 2) return;

    const minLat = Math.min(...points.map((p) => p.lat));
    const maxLat = Math.max(...points.map((p) => p.lat));
    const minLon = Math.min(...points.map((p) => p.lon));
    const maxLon = Math.max(...points.map((p) => p.lon));
    const bounds = { minLat, maxLat, minLon, maxLon };
    const maxSpeed = Math.max(...points.map((p) => p.speed));

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    for (let i = 1; i < points.length; i++) {
      const from = latLonToXY(points[i - 1].lat, points[i - 1].lon, bounds, w, h);
      const to = latLonToXY(points[i].lat, points[i].lon, bounds, w, h);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = speedToColor(points[i].speed, maxSpeed);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    const cur = latLonToXY(lat, lon, bounds, w, h);
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e03131';
    ctx.fill();
  }, [lat, lon, speed]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0f', borderRadius: 12, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {!lat && !lon && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14 }}>
          Waiting for GPS data…
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#777' }}>
        <span>Slow</span>
        <div style={{ width: 60, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, rgb(30,200,220), rgb(200,150,0), rgb(220,30,30))' }} />
        <span>Fast</span>
      </div>
    </div>
  );
}
