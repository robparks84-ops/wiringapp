import type { ChannelDefinition, SimulationConfig } from '../types';

export class SimulationEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;

  start(
    config: SimulationConfig,
    channels: ChannelDefinition[],
    onTick: (values: Record<string, number>) => void
  ): void {
    this.stop();
    this.startedAt = Date.now();
    const ms = Math.round(1000 / config.updateRateHz);

    this.intervalId = setInterval(() => {
      const t = (Date.now() - this.startedAt) / 1000;
      const values: Record<string, number> = {};
      for (const ch of channels) {
        values[ch.id] = this.sample(ch, t);
      }
      onTick(values);
    }, ms);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private sample(ch: ChannelDefinition, t: number): number {
    const range = ch.maxValue - ch.minValue;
    const period = ch.waveformPeriodMs / 1000;
    let raw: number;

    switch (ch.waveform) {
      case 'sine':
        raw = ch.minValue + (range / 2) * (1 + Math.sin((2 * Math.PI * t) / period));
        break;
      case 'ramp':
        raw = ch.minValue + range * ((t % period) / period);
        break;
      case 'step':
        raw = (Math.floor(t / (period / 2)) % 2 === 0) ? ch.minValue : ch.maxValue;
        break;
      case 'constant':
        raw = ch.defaultValue;
        break;
      case 'random-walk':
        // Delegated to store (needs previous value); return defaultValue as seed
        raw = ch.defaultValue;
        break;
      default:
        raw = ch.defaultValue;
    }

    // Add noise (not for random-walk, handled in store)
    if (ch.waveform !== 'random-walk') {
      raw += (Math.random() - 0.5) * 2 * ch.noiseAmplitude;
    }

    return Math.max(ch.minValue, Math.min(ch.maxValue, raw));
  }
}

// Singleton — created once outside React to avoid stale closures
export const simulationEngine = new SimulationEngine();
