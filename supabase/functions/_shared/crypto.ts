const encoder = new TextEncoder();

function base64UrlBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function derInteger(bytes: Uint8Array, offset: number): { value: Uint8Array; next: number } {
  if (bytes[offset] !== 0x02) throw new Error('Invalid DER integer.');
  const length = bytes[offset + 1];
  if (length === undefined || length > 33) throw new Error('Invalid DER integer length.');
  const start = offset + 2;
  const end = start + length;
  if (end > bytes.length) throw new Error('Truncated DER signature.');
  let value = bytes.slice(start, end);
  if (value[0] === 0) value = value.slice(1);
  if (value.length > 32) throw new Error('DER integer is too large.');
  const padded = new Uint8Array(32);
  padded.set(value, 32 - value.length);
  return { value: padded, next: end };
}

function derEcdsaToRaw(signature: Uint8Array): Uint8Array {
  if (signature[0] !== 0x30) throw new Error('Invalid DER sequence.');
  const sequenceLength = signature[1];
  if (sequenceLength === undefined || sequenceLength + 2 !== signature.length) {
    throw new Error('Invalid DER sequence length.');
  }
  const r = derInteger(signature, 2);
  const s = derInteger(signature, r.next);
  if (s.next !== signature.length) throw new Error('Unexpected DER signature bytes.');
  const raw = new Uint8Array(64);
  raw.set(r.value, 0);
  raw.set(s.value, 32);
  return raw;
}

function pemToSpki(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
}

export async function verifyAdMobSignature(input: {
  content: string;
  signature: string;
  keyPem: string;
}): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'spki',
    pemToSpki(input.keyPem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  const derSignature = base64UrlBytes(input.signature);
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    derEcdsaToRaw(derSignature),
    encoder.encode(input.content),
  );
}
