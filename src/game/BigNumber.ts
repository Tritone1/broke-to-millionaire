export type BigValue = string;

type Parts = { mantissa: number; exponent: number };

const ZERO: Parts = { mantissa: 0, exponent: 0 };

function normalize(mantissa: number, exponent: number): Parts {
  if (!Number.isFinite(mantissa) || Number.isNaN(exponent)) {
    return mantissa === 0 ? ZERO : { mantissa: Math.sign(mantissa) || 1, exponent: 9_999_999 };
  }
  if (mantissa === 0) return ZERO;
  const shift = Math.floor(Math.log10(Math.abs(mantissa)));
  const normalizedMantissa = mantissa / 10 ** shift;
  return { mantissa: normalizedMantissa, exponent: exponent + shift };
}

export function fromParts(mantissa: number, exponent: number): BigValue {
  const p = normalize(mantissa, exponent);
  return `${p.mantissa}|${p.exponent}`;
}

export function fromLog10(log: number): BigValue {
  if (log === -Infinity) return zero();
  const exponent = Math.floor(log);
  return fromParts(10 ** (log - exponent), exponent);
}

export function big(value: BigValue | number): BigValue {
  if (typeof value === 'number') {
    if (value === 0) return zero();
    return fromParts(value, 0);
  }
  if (value.includes('|')) {
    const [m = '0', e = '0'] = value.split('|');
    return fromParts(Number(m), Number(e));
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? zero() : big(parsed);
}

export function parts(value: BigValue | number): Parts {
  const encoded = big(value);
  const [m = '0', e = '0'] = encoded.split('|');
  return { mantissa: Number(m), exponent: Number(e) };
}

export function zero(): BigValue {
  return '0|0';
}

export function one(): BigValue {
  return '1|0';
}

export function add(a: BigValue | number, b: BigValue | number): BigValue {
  const x = parts(a);
  const y = parts(b);
  if (x.mantissa === 0) return big(b);
  if (y.mantissa === 0) return big(a);
  if (x.exponent - y.exponent > 16) return big(a);
  if (y.exponent - x.exponent > 16) return big(b);
  const exponent = Math.max(x.exponent, y.exponent);
  return fromParts(
    x.mantissa * 10 ** (x.exponent - exponent) + y.mantissa * 10 ** (y.exponent - exponent),
    exponent,
  );
}

export function subtract(a: BigValue | number, b: BigValue | number): BigValue {
  if (compare(a, b) <= 0) return zero();
  const x = parts(a);
  const y = parts(b);
  if (x.exponent - y.exponent > 16) return big(a);
  return fromParts(x.mantissa - y.mantissa * 10 ** (y.exponent - x.exponent), x.exponent);
}

export function multiply(a: BigValue | number, b: BigValue | number): BigValue {
  const x = parts(a);
  const y = parts(b);
  return fromParts(x.mantissa * y.mantissa, x.exponent + y.exponent);
}

export function divide(a: BigValue | number, b: BigValue | number): BigValue {
  const x = parts(a);
  const y = parts(b);
  if (y.mantissa === 0) return fromParts(1, 9_999_999);
  return fromParts(x.mantissa / y.mantissa, x.exponent - y.exponent);
}

export function pow(value: BigValue | number, power: number): BigValue {
  const p = parts(value);
  if (p.mantissa === 0) return zero();
  return fromLog10((Math.log10(Math.abs(p.mantissa)) + p.exponent) * power);
}

export function compare(a: BigValue | number, b: BigValue | number): number {
  const x = parts(a);
  const y = parts(b);
  if (x.exponent !== y.exponent) return x.exponent > y.exponent ? 1 : -1;
  if (x.mantissa === y.mantissa) return 0;
  return x.mantissa > y.mantissa ? 1 : -1;
}

export function toNumber(value: BigValue | number): number {
  const p = parts(value);
  if (p.exponent > 308) return Number.MAX_VALUE;
  if (p.exponent < -324) return 0;
  return p.mantissa * 10 ** p.exponent;
}

const STANDARD_SUFFIXES = ['', 'K', 'M', 'B', 'T'];

function alphabeticSuffix(index: number): string {
  let value = index;
  let result = '';
  do {
    result = String.fromCharCode(97 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return result.padStart(2, 'a');
}

export function formatBig(value: BigValue | number, digits = 1): string {
  const p = parts(value);
  if (p.mantissa === 0) return '0';
  if (p.exponent < 3) {
    const n = toNumber(value);
    const decimals = n < 10 ? Math.min(2, digits + 1) : n < 100 ? 1 : 0;
    return n.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9])0+$/g, '');
  }
  const group = Math.floor(p.exponent / 3);
  const scaled = p.mantissa * 10 ** (p.exponent % 3);
  const suffix = group < STANDARD_SUFFIXES.length ? STANDARD_SUFFIXES[group] : alphabeticSuffix(group - 5);
  return `${scaled.toFixed(digits).replace(/\.0+$/, '')}${suffix}`;
}

export function log10(value: BigValue | number): number {
  const p = parts(value);
  return p.mantissa === 0 ? -Infinity : Math.log10(Math.abs(p.mantissa)) + p.exponent;
}

export function formatCurrency(value: BigValue | number): string {
  const numeric = toNumber(value);
  const sign = numeric < 0 ? '-' : '';
  const absolute = Math.abs(numeric);
  if (absolute < 1_000) return `${sign}$${absolute.toFixed(2)}`;
  return `${sign}$${formatBig(absolute, 2)}`;
}
