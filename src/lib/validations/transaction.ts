import { z } from 'zod';
import { parseDecimalToPoisha } from '@/lib/money';

export const createTransactionSchema = z.object({
  kind: z.enum(['income', 'expense', 'saving']),
  amount_decimal: z.string().refine((val) => {
    try {
      parseDecimalToPoisha(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid decimal amount format' }),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category_id: z.string().uuid('Invalid category ID'),
  note: z.string().max(1000, 'Note too long').nullable().optional(),
  request_id: z.string().max(100).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().uuid('Invalid transaction ID'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
