import { describe, it, expect } from 'vitest';
import { parseDecimalToPoisha, formatPoishaToDecimal, formatPoishaToBDT } from '@/lib/money';
import { calculateSummaries, TransactionInput } from '@/lib/calculations';
import { createTransactionSchema } from '@/lib/validations/transaction';
import { createCategorySchema } from '@/lib/validations/category';
import { updateBudgetPlanSchema } from '@/lib/validations/budget-plan';
import { upsertMonthlyNoteSchema } from '@/lib/validations/monthly-note';

describe('Backend Services & Validations Unit/Integration Suite', () => {
  describe('Exact Money Parsing & Formatting', () => {
    it('parses valid decimal strings to BigInt poisha accurately', () => {
      expect(parseDecimalToPoisha('100000.00')).toBe(10000000n);
      expect(parseDecimalToPoisha('20000')).toBe(2000000n);
      expect(parseDecimalToPoisha('10.5')).toBe(1050n);
      expect(parseDecimalToPoisha('0.01')).toBe(1n);
    });

    it('rejects invalid, negative, or unsafe decimal formats', () => {
      expect(() => parseDecimalToPoisha('-100.00')).toThrow();
      expect(() => parseDecimalToPoisha('100.555')).toThrow();
      expect(() => parseDecimalToPoisha('abc')).toThrow();
      expect(() => parseDecimalToPoisha('100,000.00')).toThrow();
      expect(() => parseDecimalToPoisha('0')).toThrow();
    });

    it('formats poisha to standard decimal string and BDT currency', () => {
      expect(formatPoishaToDecimal(10000000n)).toBe('100000.00');
      expect(formatPoishaToDecimal(1050n)).toBe('10.50');
      expect(formatPoishaToBDT(10000000n)).toBe('৳ 100,000.00');
    });
  });

  describe('Canonical Financial Fixture (100k Income)', () => {
    it('produces exact numbers for 100k income, 20k needs, 10k wants, 70k savings', () => {
      const inputs: TransactionInput[] = [
        { kind: 'income', amount_poisha: 10000000n }, // 100,000 BDT
        { kind: 'expense', bucket: 'needs', amount_poisha: 2000000n }, // 20,000 BDT
        { kind: 'expense', bucket: 'wants', amount_poisha: 1000000n }, // 10,000 BDT
        { kind: 'saving', bucket: 'savings', amount_poisha: 7000000n }, // 70,000 BDT
      ];

      const res = calculateSummaries(inputs, { needs_bp: 2000, wants_bp: 1000, savings_bp: 7000 });

      expect(res.income_poisha).toBe(10000000n);
      expect(res.needs_poisha).toBe(2000000n);
      expect(res.wants_poisha).toBe(1000000n);
      expect(res.expenses_poisha).toBe(3000000n); // 30,000 BDT
      expect(res.savings_poisha).toBe(7000000n); // 70,000 BDT
      expect(res.available_poisha).toBe(0n); // 0 BDT

      expect(res.needs_target_poisha).toBe(2000000n);
      expect(res.wants_target_poisha).toBe(1000000n);
      expect(res.savings_target_poisha).toBe(7000000n);

      expect(res.needs_actual_bp).toBe(2000n); // 20%
      expect(res.wants_actual_bp).toBe(1000n); // 10%
      expect(res.savings_actual_bp).toBe(7000n); // 70%
      expect(res.savings_rate_bp).toBe(7000n); // 70%
    });

    it('handles target remainder balancing so targets sum to income exactly', () => {
      const inputs: TransactionInput[] = [
        { kind: 'income', amount_poisha: 10001n }, // 100.01 BDT
      ];

      const res = calculateSummaries(inputs, { needs_bp: 2000, wants_bp: 1000, savings_bp: 7000 });

      expect(res.needs_target_poisha + res.wants_target_poisha + res.savings_target_poisha).toBe(10001n);
    });

    it('safely returns 0n for zero denominator cases', () => {
      const res = calculateSummaries([]);

      expect(res.income_poisha).toBe(0n);
      expect(res.needs_actual_bp).toBe(0n);
      expect(res.savings_rate_bp).toBe(0n);
    });
  });

  describe('Zod Input Validation Contracts', () => {
    it('validates transaction creation input correctly', () => {
      const valid = createTransactionSchema.safeParse({
        kind: 'expense',
        amount_decimal: '150.00',
        description: 'Grocery shopping',
        transaction_date: '2026-08-03',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(valid.success).toBe(true);

      const invalidAmount = createTransactionSchema.safeParse({
        kind: 'expense',
        amount_decimal: '-50.00',
        description: 'Test',
        transaction_date: '2026-08-03',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(invalidAmount.success).toBe(false);
    });

    it('enforces category kind and bucket matching', () => {
      const invalidIncomeBucket = createCategorySchema.safeParse({
        name: 'Salary',
        kind: 'income',
        default_bucket: 'needs',
      });
      expect(invalidIncomeBucket.success).toBe(false);
    });

    it('enforces budget plan basis points sum to 10000', () => {
      const valid = updateBudgetPlanSchema.safeParse({
        year: 2026,
        needs_bp: 2000,
        wants_bp: 1000,
        savings_bp: 7000,
      });
      expect(valid.success).toBe(true);

      const invalidSum = updateBudgetPlanSchema.safeParse({
        year: 2026,
        needs_bp: 2000,
        wants_bp: 2000,
        savings_bp: 7000, // Sum = 11000
      });
      expect(invalidSum.success).toBe(false);
    });

    it('validates monthly note range', () => {
      const invalidMonth = upsertMonthlyNoteSchema.safeParse({
        year: 2026,
        month: 13,
        note: 'Invalid month',
      });
      expect(invalidMonth.success).toBe(false);
    });
  });
});
