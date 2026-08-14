import { z } from 'zod';

export const createDebtSchema = z.object({
  type: z.enum(['lent', 'borrowed'], {
    message: 'Type must be either "lent" (they owe you) or "borrowed" (you owe them)',
  }),
  person_name: z
    .string()
    .trim()
    .min(1, 'Person or entity name is required')
    .max(100, 'Person name cannot exceed 100 characters'),
  amount_decimal: z
    .string()
    .trim()
    .min(1, 'Amount cannot be empty')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with at most 2 decimal places'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

export const updateDebtSchema = z.object({
  id: z.string().uuid('Invalid debt record ID'),
  type: z.enum(['lent', 'borrowed']).optional(),
  person_name: z.string().trim().min(1).max(100).optional(),
  amount_decimal: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with at most 2 decimal places')
    .optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'settled']).optional(),
});

export const createDebtPaymentSchema = z.object({
  debt_id: z.string().uuid('Invalid debt record ID'),
  amount_decimal: z
    .string()
    .trim()
    .min(1, 'Payment amount cannot be empty')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with at most 2 decimal places'),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be in YYYY-MM-DD format'),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentSchema>;
