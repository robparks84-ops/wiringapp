import type { CANSignal } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert Motorola bit number to absolute bit position in byte array */
function motorolaBitToAbsolute(motorolaBit: number): number {
  const byteIndex = Math.floor(motorolaBit / 8);
  const bitInByte = 7 - (motorolaBit % 8);
  return byteIndex * 8 + bitInByte;
}

/** Walk Motorola bit numbering from MSB downward */
function nextMotorolaBit(current: number): number {
  return current % 8 === 0 ? current + 15 : current - 1;
}

// ── Decode ────────────────────────────────────────────────────────────────────

function decodeIntel(data: number[], signal: CANSignal): number {
  let raw = 0n;
  for (let i = 0; i < signal.bitLength; i++) {
    const absPos = signal.startBit + i;
    const byteIdx = Math.floor(absPos / 8);
    const bitIdx = absPos % 8;
    if (byteIdx < 8) {
      const bit = BigInt((data[byteIdx] >> bitIdx) & 1);
      raw |= bit << BigInt(i);
    }
  }
  if (signal.signed) {
    const signBit = 1n << BigInt(signal.bitLength - 1);
    if (raw & signBit) raw -= 1n << BigInt(signal.bitLength);
  }
  return Number(raw) * signal.scale + signal.offset;
}

function decodeMotorola(data: number[], signal: CANSignal): number {
  let raw = 0n;
  let current = signal.startBit;
  for (let i = 0; i < signal.bitLength; i++) {
    const absPos = motorolaBitToAbsolute(current);
    const byteIdx = Math.floor(absPos / 8);
    const bitIdx = absPos % 8;
    if (byteIdx < 8) {
      const bit = BigInt((data[byteIdx] >> bitIdx) & 1);
      raw |= bit << BigInt(signal.bitLength - 1 - i);
    }
    if (i < signal.bitLength - 1) current = nextMotorolaBit(current);
  }
  if (signal.signed) {
    const signBit = 1n << BigInt(signal.bitLength - 1);
    if (raw & signBit) raw -= 1n << BigInt(signal.bitLength);
  }
  return Number(raw) * signal.scale + signal.offset;
}

export function decodeSignal(data: number[], signal: CANSignal): number {
  return signal.byteOrder === 'intel'
    ? decodeIntel(data, signal)
    : decodeMotorola(data, signal);
}

// ── Encode ────────────────────────────────────────────────────────────────────

function encodeIntel(data: number[], signal: CANSignal, physical: number): number[] {
  const out = [...data];
  let raw = BigInt(Math.round((physical - signal.offset) / signal.scale));
  const mask = (1n << BigInt(signal.bitLength)) - 1n;
  raw = raw & mask;
  for (let i = 0; i < signal.bitLength; i++) {
    const absPos = signal.startBit + i;
    const byteIdx = Math.floor(absPos / 8);
    const bitIdx = absPos % 8;
    if (byteIdx < 8) {
      const bit = Number((raw >> BigInt(i)) & 1n);
      if (bit) out[byteIdx] |= 1 << bitIdx;
      else out[byteIdx] &= ~(1 << bitIdx);
    }
  }
  return out;
}

function encodeMotorola(data: number[], signal: CANSignal, physical: number): number[] {
  const out = [...data];
  let raw = BigInt(Math.round((physical - signal.offset) / signal.scale));
  const mask = (1n << BigInt(signal.bitLength)) - 1n;
  raw = raw & mask;
  let current = signal.startBit;
  for (let i = 0; i < signal.bitLength; i++) {
    const absPos = motorolaBitToAbsolute(current);
    const byteIdx = Math.floor(absPos / 8);
    const bitIdx = absPos % 8;
    if (byteIdx < 8) {
      const bit = Number((raw >> BigInt(signal.bitLength - 1 - i)) & 1n);
      if (bit) out[byteIdx] |= 1 << bitIdx;
      else out[byteIdx] &= ~(1 << bitIdx);
    }
    if (i < signal.bitLength - 1) current = nextMotorolaBit(current);
  }
  return out;
}

export function encodeSignal(data: number[], signal: CANSignal, physical: number): number[] {
  return signal.byteOrder === 'intel'
    ? encodeIntel(data, signal, physical)
    : encodeMotorola(data, signal, physical);
}

// ── Bit span (for ByteGrid coloring) ─────────────────────────────────────────

export function getSignalBitSpan(signal: CANSignal): Set<number> {
  const bits = new Set<number>();
  if (signal.byteOrder === 'intel') {
    for (let i = 0; i < signal.bitLength; i++) {
      const absPos = signal.startBit + i;
      if (absPos < 64) bits.add(absPos);
    }
  } else {
    let current = signal.startBit;
    for (let i = 0; i < signal.bitLength; i++) {
      const absPos = motorolaBitToAbsolute(current);
      if (absPos < 64) bits.add(absPos);
      if (i < signal.bitLength - 1) current = nextMotorolaBit(current);
    }
  }
  return bits;
}
