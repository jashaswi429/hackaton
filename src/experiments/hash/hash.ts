/*
 * SHA-256 — a compact, dependency-free implementation in pure TypeScript.
 *
 * The Hash Lab is about the *mechanism*, so the digest is computed here rather
 * than delegated to the platform. Everything in this file is synchronous and
 * free of DOM/React, which keeps it testable in isolation (see the test script
 * in package.json). The implementation follows FIPS 180-4.
 */

/** First 32 bits of the fractional parts of the cube roots of the first 64 primes. */
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const H0 = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

/** Rotate a 32-bit word right by n bits. */
function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

export const DIGEST_BYTES = 32;
export const DIGEST_BITS = 256;

/** Shared encoder — reused so the miner's hot loop does not allocate one per call. */
const ENCODER = new TextEncoder();

/** Encode a string as UTF-8 bytes. */
export function utf8Bytes(text: string): Uint8Array {
  return ENCODER.encode(text);
}

/** Compute the SHA-256 digest of a byte array. Returns 32 bytes. */
export function sha256(message: Uint8Array): Uint8Array {
  const len = message.length;
  const bitLen = len * 8;
  // Message + 0x80 + padding + 8-byte length, rounded up to a 64-byte boundary.
  const total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(message);
  buf[len] = 0x80;

  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor(bitLen / 4294967296) >>> 0, false);
  dv.setUint32(total - 4, bitLen >>> 0, false);

  const H = H0.slice();
  const w = new Uint32Array(64);

  for (let off = 0; off < total; off += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(off + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const x = w[t - 15];
      const y = w[t - 2];
      const s0 = (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
      const s1 = (rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10)) >>> 0;
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let t = 0; t < 64; t++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  const out = new Uint8Array(DIGEST_BYTES);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, H[i], false);
  return out;
}

const HEX = '0123456789abcdef';

/** Lower-case hex of a byte array. */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 15];
  }
  return out;
}

/** SHA-256 of a string, as 64 lower-case hex characters. */
export function sha256Hex(text: string): string {
  return toHex(sha256(utf8Bytes(text)));
}

/** Expand bytes to one 0/1 value per bit (most-significant bit first). */
export function bytesToBits(bytes: Uint8Array): Uint8Array {
  const bits = new Uint8Array(bytes.length * 8);
  for (let i = 0; i < bytes.length; i++) {
    for (let k = 0; k < 8; k++) bits[i * 8 + k] = (bytes[i] >> (7 - k)) & 1;
  }
  return bits;
}

/** Count set bits in a byte array — used for the avalanche measurement. */
export function popcount(bytes: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < bytes.length; i++) {
    let v = bytes[i];
    while (v) {
      v &= v - 1;
      n++;
    }
  }
  return n;
}

/** Number of differing bits between two equal-length byte arrays. */
export function hammingDistance(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  let diff = 0;
  for (let i = 0; i < n; i++) {
    let v = a[i] ^ b[i];
    while (v) {
      v &= v - 1;
      diff++;
    }
  }
  return diff;
}

/** Per-bit difference map (1 where the two digests disagree). */
export function bitDiff(a: Uint8Array, b: Uint8Array): Uint8Array {
  const n = Math.min(a.length, b.length);
  const bits = new Uint8Array(n * 8);
  for (let i = 0; i < n; i++) {
    const v = a[i] ^ b[i];
    for (let k = 0; k < 8; k++) bits[i * 8 + k] = (v >> (7 - k)) & 1;
  }
  return bits;
}

/** Flip the bit at `bitIndex` (most-significant-bit-first) of a copy of `bytes`. */
export function flipBit(bytes: Uint8Array, bitIndex: number): Uint8Array {
  const out = bytes.slice();
  const byte = bitIndex >> 3;
  const bit = 7 - (bitIndex & 7);
  out[byte] ^= 1 << bit;
  return out;
}

/** Does the digest begin with `nibbles` zero hex digits? */
export function hasLeadingZeroNibbles(digest: Uint8Array, nibbles: number): boolean {
  const fullBytes = nibbles >> 1;
  for (let i = 0; i < fullBytes; i++) if (digest[i] !== 0) return false;
  if (nibbles & 1) return (digest[fullBytes] >> 4) === 0;
  return true;
}

/** Format a number with thin thousands separators for readouts. */
export function groupDigits(n: number): string {
  return n.toLocaleString('en-US');
}
