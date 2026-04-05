export function bytesToHex(data: number[]): string {
  return data.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/\s/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < Math.min(clean.length, 16); i += 2) {
    const byte = parseInt(clean.slice(i, i + 2), 16);
    bytes.push(isNaN(byte) ? 0 : byte & 0xFF);
  }
  while (bytes.length < 8) bytes.push(0);
  return bytes.slice(0, 8);
}

export function emptyFrame(): number[] {
  return [0, 0, 0, 0, 0, 0, 0, 0];
}

export function bytesToBinary(data: number[]): string {
  return data.map(b => b.toString(2).padStart(8, '0')).join(' ');
}
