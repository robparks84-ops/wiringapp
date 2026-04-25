import type { MathChannel, Channel } from './types';

// Safe expression evaluator — only allows math operations and channel name substitutions.
// Channel names are substituted as numeric variables before eval.
export function evaluateMathChannel(formula: string, channels: Map<string, Channel>): number {
  let expr = formula;

  // Replace channel names (longest first to avoid partial replacement)
  const names = Array.from(channels.keys()).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const val = channels.get(name)!.value;
    // Replace bare channel names that aren't inside other words
    expr = expr.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), String(val));
  }

  // Strip anything that isn't a number, operator, parenthesis, dot, or whitespace
  expr = expr.replace(/[^0-9+\-*/().,\s]/g, '');

  try {
    // Use Function constructor in a controlled way — only math operators remain after sanitization
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
