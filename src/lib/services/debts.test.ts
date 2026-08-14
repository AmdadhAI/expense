import { describe, it, expect } from 'vitest';
import { createDebtSchema, updateDebtSchema, createDebtPaymentSchema } from '@/lib/validations/debt';
import { parseDecimalToPoisha, formatPoishaToDecimal, formatPoishaToBDT } from '@/lib/money';

describe('Debt & Loan Validations and Calculations', () => {
  describe('Validation Schemas', () => {
    it('validates a valid lent debt input', () => {
      const input = {
        type: 'lent' as const,
        person_name: 'Rahim',
        amount_decimal: '5000.00',
        due_date: '2026-09-01',
        notes: 'For semester tuition fee',
      };
      const parsed = createDebtSchema.parse(input);
      expect(parsed.person_name).toBe('Rahim');
      expect(parsed.type).toBe('lent');
    });

    it('validates a valid borrowed debt input', () => {
      const input = {
        type: 'borrowed' as const,
        person_name: 'City Bank Card',
        amount_decimal: '12500.50',
      };
      const parsed = createDebtSchema.parse(input);
      expect(parsed.type).toBe('borrowed');
      expect(parsed.amount_decimal).toBe('12500.50');
    });

    it('rejects negative or invalid amount format', () => {
      expect(() =>
        createDebtSchema.parse({
          type: 'lent',
          person_name: 'Test',
          amount_decimal: '-500',
        })
      ).toThrow();

      expect(() =>
        createDebtSchema.parse({
          type: 'lent',
          person_name: 'Test',
          amount_decimal: '100.555',
        })
      ).toThrow();
    });

    it('validates debt payment schema', () => {
      const payment = {
        debt_id: '123e4567-e89b-12d3-a456-426614174000',
        amount_decimal: '2000.00',
        payment_date: '2026-08-14',
        notes: 'Partial cash return',
      };
      const parsed = createDebtPaymentSchema.parse(payment);
      expect(parsed.amount_decimal).toBe('2000.00');
    });
  });

  describe('Money and Balance Mathematics', () => {
    it('accurately computes remaining balance and repayment percentage without float errors', () => {
      const totalPoisha = parseDecimalToPoisha('5000.00'); // 500000n
      const payment1Poisha = parseDecimalToPoisha('2000.00'); // 200000n
      const payment2Poisha = parseDecimalToPoisha('1500.00'); // 150000n

      const repaidPoisha = payment1Poisha + payment2Poisha; // 350000n
      const remainingPoisha = totalPoisha - repaidPoisha; // 150000n

      expect(formatPoishaToDecimal(repaidPoisha)).toBe('3500.00');
      expect(formatPoishaToDecimal(remainingPoisha)).toBe('1500.00');
      expect(formatPoishaToBDT(remainingPoisha)).toBe('৳ 1,500.00');

      const percent = Number((repaidPoisha * 100n) / totalPoisha);
      expect(percent).toBe(70);
    });

    it('computes net position correctly (Lent - Borrowed)', () => {
      // User lent ৳5,000 (remaining: ৳1,500)
      const lentRemaining = parseDecimalToPoisha('1500.00');
      // User borrowed ৳3,000 (remaining: ৳1,000)
      const borrowedRemaining = parseDecimalToPoisha('1000.00');

      // Net balance is +500.00 BDT
      const netPoisha = lentRemaining - borrowedRemaining;
      expect(formatPoishaToDecimal(netPoisha)).toBe('500.00');
      expect(formatPoishaToBDT(netPoisha)).toBe('৳ 500.00');
    });

    it('computes negative net position when user owes more than they are owed', () => {
      const lentRemaining = parseDecimalToPoisha('500.00');
      const borrowedRemaining = parseDecimalToPoisha('2500.00');

      const netPoisha = lentRemaining - borrowedRemaining; // -200000n
      expect(formatPoishaToDecimal(netPoisha)).toBe('-2000.00');
      expect(formatPoishaToBDT(netPoisha)).toBe('৳ -2,000.00');
    });
  });
});
