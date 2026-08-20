import { describe, it, expect } from 'vitest';
import { createDebtEntrySchema, updateDebtEntrySchema, createDebtContactSchema } from '@/lib/validations/debt';
import { parseDecimalToPoisha, formatPoishaToDecimal, formatPoishaToBDT } from '@/lib/money';

describe('Person-Centric Dena-Paona Ledger Logic', () => {
  describe('Validation Schemas', () => {
    it('validates a gave (Paona) entry with person name', () => {
      const input = {
        person_name: 'Rahim',
        entry_type: 'gave' as const,
        amount_decimal: '100.00',
        entry_date: '2026-08-20',
        due_date: '2026-09-01',
        notes: 'Lunch money loan',
      };
      const parsed = createDebtEntrySchema.parse(input);
      expect(parsed.person_name).toBe('Rahim');
      expect(parsed.entry_type).toBe('gave');
      expect(parsed.amount_decimal).toBe('100.00');
    });

    it('validates a received payment (Deduction) entry with contact_id', () => {
      const input = {
        contact_id: '123e4567-e89b-12d3-a456-426614174000',
        entry_type: 'received' as const,
        amount_decimal: '50.00',
        entry_date: '2026-08-20',
        notes: 'Bkash partial return',
      };
      const parsed = createDebtEntrySchema.parse(input);
      expect(parsed.contact_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(parsed.entry_type).toBe('received');
      expect(parsed.amount_decimal).toBe('50.00');
    });

    it('rejects an entry with neither contact_id nor person_name', () => {
      expect(() =>
        createDebtEntrySchema.parse({
          entry_type: 'gave',
          amount_decimal: '100.00',
          entry_date: '2026-08-20',
        })
      ).toThrow();
    });

    it('validates create contact schema', () => {
      const parsed = createDebtContactSchema.parse({
        name: 'Abir Hasan',
        phone: '01700000000',
        notes: 'Office colleague',
      });
      expect(parsed.name).toBe('Abir Hasan');
    });
  });

  describe('Dena-Paona Deduction & Running Balance Mathematics', () => {
    it('accurately deducts repayment from main amount (Gave 100, Received 50 -> Remaining 50 Paona)', () => {
      const gavePoisha = parseDecimalToPoisha('100.00'); // 10000n
      const receivedPoisha = parseDecimalToPoisha('50.00'); // 5000n

      const remainingPoisha = gavePoisha - receivedPoisha; // 5000n
      expect(formatPoishaToDecimal(remainingPoisha)).toBe('50.00');
      expect(formatPoishaToBDT(remainingPoisha)).toBe('৳ 50.00');
    });

    it('accumulates multiple loans and multiple repayments for same person', () => {
      // 1. Gave 100
      let balance = parseDecimalToPoisha('100.00');
      // 2. Received 50 (deduction)
      balance -= parseDecimalToPoisha('50.00');
      expect(formatPoishaToDecimal(balance)).toBe('50.00');

      // 3. Gave another 200 (accumulates)
      balance += parseDecimalToPoisha('200.00');
      expect(formatPoishaToDecimal(balance)).toBe('250.00');
      expect(formatPoishaToBDT(balance)).toBe('৳ 250.00');
    });

    it('calculates Dena borrowing and repayment accurately', () => {
      // 1. Took (Dena) 500
      let tookPoisha = parseDecimalToPoisha('500.00');
      // 2. Paid (Repayment) 300
      let paidPoisha = parseDecimalToPoisha('300.00');

      let remainingDena = tookPoisha - paidPoisha;
      expect(formatPoishaToDecimal(remainingDena)).toBe('200.00');
      expect(formatPoishaToBDT(remainingDena)).toBe('৳ 200.00');

      // 3. Paid remaining 200 -> Settled (0 balance)
      paidPoisha += parseDecimalToPoisha('200.00');
      remainingDena = tookPoisha - paidPoisha;
      expect(remainingDena).toBe(0n);
    });

    it('computes overall Net Balance across all contacts', () => {
      // Contact 1 (Rahim): Paona ৳250
      const rahimPaona = parseDecimalToPoisha('250.00');
      // Contact 2 (Abir): Dena ৳100
      const abirDena = parseDecimalToPoisha('100.00');

      const netBalance = rahimPaona - abirDena; // +150.00
      expect(formatPoishaToDecimal(netBalance)).toBe('150.00');
      expect(formatPoishaToBDT(netBalance)).toBe('৳ 150.00');
    });
  });
});
