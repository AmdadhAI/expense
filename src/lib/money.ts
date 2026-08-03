/**
 * Safe Exact Integer Money Utilities (Poisha: 1 BDT = 100 Poisha)
 * Absolutely NO parseFloat, binary floating-point money math, or unsafe range operations.
 */

export const MAX_SAFE_POISHA = 999_999_999_999_99n; // 999,999,999,999.99 BDT

/**
 * Validates and converts a user-entered decimal string (e.g. "100000.00", "20.5", "0.99") into BigInt poisha.
 * Throws explicit error if invalid format, negative, >2 decimal places, or unsafe range.
 */
export function parseDecimalToPoisha(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Amount cannot be empty');
  }

  // Reject negative sign, commas, scientific notation, spaces, special chars
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid monetary amount format: "${input}". Must be a positive decimal string (e.g. "100.50").`);
  }

  const parts = trimmed.split('.');
  const integerPart = parts[0];
  const fractionPart = parts[1] || '';

  if (fractionPart.length > 2) {
    throw new Error('Monetary amount cannot have more than 2 decimal places');
  }

  const paddedFraction = fractionPart.padEnd(2, '0');
  const combined = integerPart + paddedFraction;
  const poisha = BigInt(combined);

  if (poisha <= 0n) {
    throw new Error('Monetary amount must be greater than zero');
  }

  if (poisha > MAX_SAFE_POISHA) {
    throw new Error('Monetary amount exceeds database maximum limit');
  }

  return poisha;
}

/**
 * Formats a BigInt poisha value to a canonical two-decimal string (e.g. 10050n -> "100.50").
 */
export function formatPoishaToDecimal(poisha: bigint): string {
  const isNegative = poisha < 0n;
  const abs = isNegative ? -poisha : poisha;
  const str = abs.toString().padStart(3, '0');
  const intPart = str.slice(0, -2);
  const fracPart = str.slice(-2);
  return `${isNegative ? '-' : ''}${intPart}.${fracPart}`;
}

/**
 * Formats a BigInt poisha value to BDT display format with Bangladeshi grouping where supported.
 */
export function formatPoishaToBDT(poisha: bigint): string {
  const decimalStr = formatPoishaToDecimal(poisha);
  const [intStr, fracStr] = decimalStr.split('.');

  // Format integer part with standard grouping
  const numInt = BigInt(intStr);
  const formattedInt = new Intl.NumberFormat('en-BD').format(numInt);
  return `৳ ${formattedInt}.${fracStr}`;
}
