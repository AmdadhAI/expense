export interface TransactionInput {
  kind: 'income' | 'expense' | 'saving';
  bucket?: 'needs' | 'wants' | 'savings' | null;
  amount_poisha: bigint;
}

export interface BudgetTargetsInput {
  needs_bp: number; // e.g. 2000 for 20%
  wants_bp: number; // e.g. 1000 for 10%
  savings_bp: number; // e.g. 7000 for 70%
}

export interface SummaryResult {
  income_poisha: bigint;
  needs_poisha: bigint;
  wants_poisha: bigint;
  expenses_poisha: bigint;
  savings_poisha: bigint;
  available_poisha: bigint;
  needs_target_poisha: bigint;
  wants_target_poisha: bigint;
  savings_target_poisha: bigint;
  needs_actual_bp: bigint;
  wants_actual_bp: bigint;
  savings_actual_bp: bigint;
  needs_budget_used_bp: bigint;
  wants_budget_used_bp: bigint;
  savings_budget_used_bp: bigint;
  savings_rate_bp: bigint;
}

/**
 * Safely parses a decimal string (e.g. "100.50", "20", "0.99") into BigInt poisha (1 BDT = 100 poisha).
 * Does NOT use parseFloat or binary floating-point math.
 */
export function parseDecimalToPoisha(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) return 0n;

  // Regex to validate positive decimal with optional fractional part
  const match = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    throw new Error(`Invalid decimal amount format: "${input}"`);
  }

  const integerPart = match[1];
  let fractionPart = match[2] || '00';
  if (fractionPart.length === 1) {
    fractionPart += '0';
  }

  const combined = integerPart + fractionPart;
  return BigInt(combined);
}

/**
 * Formats BigInt poisha to a standard two-decimal string (e.g. 10050n -> "100.50").
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
 * Computes complete financial summary using pure BigInt arithmetic.
 */
export function calculateSummaries(
  transactions: TransactionInput[],
  targets: BudgetTargetsInput = { needs_bp: 2000, wants_bp: 1000, savings_bp: 7000 }
): SummaryResult {
  let income_poisha = 0n;
  let needs_poisha = 0n;
  let wants_poisha = 0n;
  let savings_poisha = 0n;

  for (const tx of transactions) {
    if (tx.kind === 'income') {
      income_poisha += tx.amount_poisha;
    } else if (tx.kind === 'expense') {
      if (tx.bucket === 'needs') {
        needs_poisha += tx.amount_poisha;
      } else if (tx.bucket === 'wants') {
        wants_poisha += tx.amount_poisha;
      }
    } else if (tx.kind === 'saving') {
      savings_poisha += tx.amount_poisha;
    }
  }

  const expenses_poisha = needs_poisha + wants_poisha;
  const available_poisha = income_poisha - expenses_poisha - savings_poisha;

  // Target calculations with half-up rounding for Needs & Wants, remainder to Savings
  const needs_bp = BigInt(targets.needs_bp);
  const wants_bp = BigInt(targets.wants_bp);

  const needs_target_poisha = (income_poisha * needs_bp + 5000n) / 10000n;
  const wants_target_poisha = (income_poisha * wants_bp + 5000n) / 10000n;
  // Ensure sum of targets equals income_poisha exactly
  const savings_target_poisha = income_poisha - needs_target_poisha - wants_target_poisha;

  // Helper for basis point ratios (safely returns 0n on zero denominator)
  const calcBpRatio = (numerator: bigint, denominator: bigint): bigint => {
    if (denominator === 0n) return 0n;
    return (numerator * 10000n + denominator / 2n) / denominator;
  };

  const needs_actual_bp = calcBpRatio(needs_poisha, income_poisha);
  const wants_actual_bp = calcBpRatio(wants_poisha, income_poisha);
  const savings_actual_bp = calcBpRatio(savings_poisha, income_poisha);

  const needs_budget_used_bp = calcBpRatio(needs_poisha, needs_target_poisha);
  const wants_budget_used_bp = calcBpRatio(wants_poisha, wants_target_poisha);
  const savings_budget_used_bp = calcBpRatio(savings_poisha, savings_target_poisha);

  const savings_rate_bp = calcBpRatio(savings_poisha, income_poisha);

  return {
    income_poisha,
    needs_poisha,
    wants_poisha,
    expenses_poisha,
    savings_poisha,
    available_poisha,
    needs_target_poisha,
    wants_target_poisha,
    savings_target_poisha,
    needs_actual_bp,
    wants_actual_bp,
    savings_actual_bp,
    needs_budget_used_bp,
    wants_budget_used_bp,
    savings_budget_used_bp,
    savings_rate_bp,
  };
}
