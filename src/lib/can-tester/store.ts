'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CANFrame, CANSignal, ChannelDefinition, ChannelValue,
  SimulationConfig, LuaRuntimeState, CANPreset,
} from './types';
import { emptyFrame } from './can/frameUtils';
import { DEFAULT_LUA_SCRIPT } from './lua/apiStubs';

const DEFAULT_FRAME: CANFrame = {
  id: 0x0CE0,
  extended: false,
  data: emptyFrame(),
  signals: [],
  label: 'New Frame',
};

const DEFAULT_SIM: SimulationConfig = {
  running: false,
  updateRateHz: 10,
};

const DEFAULT_LUA: LuaRuntimeState = {
  running: false,
  tickRateHz: 10,
  consoleLines: [],
  lastError: null,
  scriptSource: DEFAULT_LUA_SCRIPT,
};

interface CANStore {
  // ── Channel Mapping ──────────────────────────────────────────────────────
  channels: ChannelDefinition[];
  addChannel: (ch: ChannelDefinition) => void;
  updateChannel: (id: string, patch: Partial<ChannelDefinition>) => void;
  removeChannel: (id: string) => void;
  loadPreset: (preset: CANPreset) => void;

  // ── CAN Frame Builder ────────────────────────────────────────────────────
  activeFrame: CANFrame;
  setFrameData: (data: number[]) => void;
  setFrameId: (id: number, extended: boolean) => void;
  setFrameLabel: (label: string) => void;
  addSignal: (sig: CANSignal) => void;
  updateSignal: (id: string, patch: Partial<CANSignal>) => void;
  removeSignal: (id: string) => void;
  loadFrameFromPreset: (frame: CANFrame) => void;

  // ── Simulation ───────────────────────────────────────────────────────────
  simConfig: SimulationConfig;
  channelValues: Record<string, ChannelValue>;
  setSimRunning: (running: boolean) => void;
  setSimUpdateRate: (hz: number) => void;
  updateChannelValues: (values: Record<string, number>) => void;
  setChannelValue: (name: string, value: number) => void;

  // ── Lua ──────────────────────────────────────────────────────────────────
  luaState: LuaRuntimeState;
  setLuaScript: (src: string) => void;
  appendConsole: (line: string) => void;
  clearConsole: () => void;
  setLuaError: (msg: string | null) => void;
  setLuaRunning: (running: boolean) => void;
  setLuaTickRate: (hz: number) => void;
  getChannelValue: (name: string) => number;
}

export const useCANStore = create<CANStore>()(
  persist(
    (set, get) => ({
      // ── Channels ──────────────────────────────────────────────────────────
      channels: [],
      addChannel: (ch) => set(s => ({ channels: [...s.channels, ch] })),
      updateChannel: (id, patch) => set(s => ({
        channels: s.channels.map(c => c.id === id ? { ...c, ...patch } : c),
      })),
      removeChannel: (id) => set(s => ({ channels: s.channels.filter(c => c.id !== id) })),
      loadPreset: (preset) => set(s => ({
        channels: preset.channels,
        activeFrame: preset.frames[0] ?? s.activeFrame,
      })),

      // ── Frame ─────────────────────────────────────────────────────────────
      activeFrame: DEFAULT_FRAME,
      setFrameData: (data) => set(s => ({ activeFrame: { ...s.activeFrame, data } })),
      setFrameId: (id, extended) => set(s => ({ activeFrame: { ...s.activeFrame, id, extended } })),
      setFrameLabel: (label) => set(s => ({ activeFrame: { ...s.activeFrame, label } })),
      addSignal: (sig) => set(s => ({ activeFrame: { ...s.activeFrame, signals: [...s.activeFrame.signals, sig] } })),
      updateSignal: (id, patch) => set(s => ({
        activeFrame: {
          ...s.activeFrame,
          signals: s.activeFrame.signals.map(sig => sig.id === id ? { ...sig, ...patch } : sig),
        },
      })),
      removeSignal: (id) => set(s => ({
        activeFrame: { ...s.activeFrame, signals: s.activeFrame.signals.filter(sig => sig.id !== id) },
      })),
      loadFrameFromPreset: (frame) => set({ activeFrame: { ...frame, data: [...frame.data] } }),

      // ── Simulation ────────────────────────────────────────────────────────
      simConfig: DEFAULT_SIM,
      channelValues: {},
      setSimRunning: (running) => set(s => ({ simConfig: { ...s.simConfig, running } })),
      setSimUpdateRate: (hz) => set(s => ({ simConfig: { ...s.simConfig, updateRateHz: hz } })),
      updateChannelValues: (values) => {
        const now = Date.now();
        const { channels, channelValues } = get();
        const updated = { ...channelValues };
        for (const ch of channels) {
          const raw = values[ch.id];
          if (raw === undefined) continue;
          let value = raw;
          // random-walk: nudge previous value
          if (ch.waveform === 'random-walk') {
            const prev = channelValues[ch.id]?.value ?? ch.defaultValue;
            const step = (ch.maxValue - ch.minValue) * 0.01;
            value = Math.max(ch.minValue, Math.min(ch.maxValue,
              prev + (Math.random() - 0.5) * 2 * step + (Math.random() - 0.5) * 2 * ch.noiseAmplitude
            ));
          }
          updated[ch.id] = { channelId: ch.id, value, timestamp: now };
        }
        set({ channelValues: updated });
      },
      setChannelValue: (name, value) => {
        const { channels, channelValues } = get();
        const ch = channels.find(c => c.name === name);
        if (!ch) return;
        set({ channelValues: {
          ...channelValues,
          [ch.id]: { channelId: ch.id, value, timestamp: Date.now() },
        }});
      },
      getChannelValue: (name) => {
        const { channels, channelValues } = get();
        const ch = channels.find(c => c.name === name);
        if (!ch) return 0;
        return channelValues[ch.id]?.value ?? ch.defaultValue;
      },

      // ── Lua ───────────────────────────────────────────────────────────────
      luaState: DEFAULT_LUA,
      setLuaScript: (src) => set(s => ({ luaState: { ...s.luaState, scriptSource: src } })),
      appendConsole: (line) => set(s => ({
        luaState: { ...s.luaState, consoleLines: [...s.luaState.consoleLines.slice(-199), line] },
      })),
      clearConsole: () => set(s => ({ luaState: { ...s.luaState, consoleLines: [], lastError: null } })),
      setLuaError: (msg) => set(s => ({ luaState: { ...s.luaState, lastError: msg } })),
      setLuaRunning: (running) => set(s => ({ luaState: { ...s.luaState, running } })),
      setLuaTickRate: (hz) => set(s => ({ luaState: { ...s.luaState, tickRateHz: hz } })),
    }),
    {
      name: 'can-tester-store',
      partialize: (s) => ({
        channels: s.channels,
        activeFrame: s.activeFrame,
        luaState: { scriptSource: s.luaState.scriptSource, tickRateHz: s.luaState.tickRateHz },
        simConfig: { updateRateHz: s.simConfig.updateRateHz },
      }),
    }
  )
);
