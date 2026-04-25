import type { ChannelStats } from './racecaptureTypes';

const stats = new Map<string, ChannelStats>();

export function updateStats(name: string, value: number): ChannelStats {
  const existing = stats.get(name);
  if (!existing) {
    const s = { min: value, max: value, sum: value, count: 1 };
    stats.set(name, s);
    return s;
  }
  existing.min = Math.min(existing.min, value);
  existing.max = Math.max(existing.max, value);
  existing.sum += value;
  existing.count += 1;
  return existing;
}

export function getStats(name: string): ChannelStats | undefined {
  return stats.get(name);
}

export function getAvg(name: string): number {
  const s = stats.get(name);
  return s ? s.sum / s.count : 0;
}

export function resetStats(): void {
  stats.clear();
}

export function resetChannel(name: string): void {
  stats.delete(name);
}
