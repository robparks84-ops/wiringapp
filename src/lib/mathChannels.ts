import type { MathChannel, Channel } from './racecaptureTypes';

export function evaluateMathChannel(formula: string, channels: Map<string, Channel>): number {
  let expr = formula;

  const names = Array.from(channels.keys()).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const val = channels.get(name)!.value;
    expr = expr.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), String(val));
  }

  expr = expr.replace(/[^0-9+\-*/().,\s]/g, '');

  try {
    const result = Function(`"use strict"; return (${expr})`)() as number;
    return isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

const STORAGE_KEY = 'rc_math_channels';

export function loadMathChannels(): MathChannel[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveMathChannels(channels: MathChannel[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
}
