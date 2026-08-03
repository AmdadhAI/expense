import { describe, it, expect } from 'vitest';
import {
  parseDecimalToPoisha,
  formatPoishaToDecimal,
  calculateSummaries,
  TransactionInput,
} from './calculations';

describe('Financial Calculations Module (BigInt Poisha)', () => {
  it('parses decimal strings into BigInt poisha safely without parseFloat', () => {
    expect(parseDecimalToPoisha('100000.00')).toBe(10000000n);
    expect(parseDecimalToPoisha('20000')).toBe(2000000n);
    expect(parseDecimalToPoisha('100.5')).toBe(10050n);
    expect(parseDecimalToPoisha('0.99')).toBe(99n);
    expect(() => parseDecimalToPoisha('abc')).toThrow();
  });

  it('formats BigInt poisha to standard decimal string', () => {
    expect(formatPoishaToDecimal(10000000n)).toBe('100000.00');
    expect(formatPoishaToDecimal(10050n)).toBe('100.50');
    expect(formatPoishaToDecimal(99n)).toBe('0.99');
  });

  it('calculates exact 100k income test scenario (Needs 20k, Wants 10k, Savings 70k)', () => {
    const transactions: TransactionInput[] = [
      { kind: 'income', amount_poisha: 10000000n }, // 100,000.00 BDT
      { kind: 'expense', bucket: 'needs', amount_poisha: 2000000n }, // 20,000.00 BDT
      { kind: 'expense', bucket: 'wants', amount_poisha: 1000000n }, // 10,000.00 BDT
      { kind: 'saving', bucket: 'savings', amount_poisha: 7000000n }, // 70,000.00 BDT
    ];

    const result = calculateSummaries(transactions);

    expect(result.income_poisha).toBe(10000000n);
    expect(result.needs_poisha).toBe(2000000n);
    expect(result.wants_poisha).toBe(1000000n);
    expect(result.expenses_poisha).toBe(3000000n); // 30,000.00 BDT
    expect(result.savings_poisha).toBe(7000000n); // 70,000.00 BDT
    expect(result.available_poisha).toBe(0n); // 0 BDT

    // Targets: Needs 20% (20k), Wants 10% (10k), Savings 70% (70k)
    expect(result.needs_target_poisha).toBe(2000000n);
    expect(result.wants_target_poisha).toBe(1000000n);
    expect(result.savings_target_poisha).toBe(7000000n);
    expect(result.needs_target_poisha + result.wants_target_poisha + result.savings_target_poisha).toBe(result.income_poisha);

    // Actual Ratios in basis points (10000 bp = 100%)
    expect(result.needs_actual_bp).toBe(2000n); // 20.00%
    expect(result.wants_actual_bp).toBe(1000n); // 10.00%
    expect(result.savings_actual_bp).toBe(7000n); // 70.00%
    expect(result.savings_rate_bp).toBe(7000n); // 70.00%
  });

  it('balances target rounding remainders so total targets equal income exactly', () => {
    // Odd income: 100.01 BDT (10,001n poisha)
    const transactions: TransactionInput[] = [
      { kind: 'income', amount_poisha: 10001n },
    ];

    const result = calculateSummaries(transactions);

    // Needs 20%: (10001 * 2000 + 5000) / 10000 = 2000.7 -> 2000n
    // Wants 10%: (10001 * 1000 + 5000) / 10000 = 1000.6 -> 1000n
    // Savings remainder: 10001 - 2000 - 1000 = 7001n
    expect(result.needs_target_poisha).toBe(2000n);
    expect(result.wants_target_poisha).toBe(1000n);
    expect(result.savings_target_poisha).toBe(7001n);
    expect(result.needs_target_poisha + result.wants_target_poisha + result.savings_target_poisha).toBe(10001n);
  });

  it('safely handles zero income and empty inputs without division by zero', () => {
    const result = calculateSummaries([]);

    expect(result.income_poisha).toBe(0n);
    expect(result.expenses_poisha).toBe(0n);
    expect(result.available_poisha).toBe(0n);
    expect(result.needs_actual_bp).toBe(0n);
    expect(result.wants_actual_bp).toBe(0n);
    expect(result.savings_actual_bp).toBe(0n);
    expect(result.savings_rate_bp).toBe(0n);
    expect(result.needs_budget_used_bp).toBe(0n);
  });
});
