import { z } from 'zod';

export const createDebtEntrySchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID').optional().nullable(),
  person_name: z.string().trim().max(100).optional().nullable(),
  entry_type: z.enum(['gave', 'took', 'received', 'paid'], {
    message: 'Entry type must be "gave" (পাওনা), "received" (ফেরত), "took" (দেনা), or "paid" (পরিশোধ)',
  }),
  amount_decimal: z
    .string()
    .trim()
    .min(1, 'Amount cannot be empty')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with at most 2 decimal places'),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
}).refine((data) => data.contact_id || (data.person_name && data.person_name.trim().length > 0), {
  message: 'Either select an existing person or enter a person name',
  path: ['person_name'],
});

export const updateDebtEntrySchema = z.object({
  id: z.string().uuid('Invalid entry ID'),
  entry_type: z.enum(['gave', 'took', 'received', 'paid']).optional(),
  amount_decimal: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with at most 2 decimal places')
    .optional(),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createDebtContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Person name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  phone: z.string().trim().max(30).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateDebtEntryInput = z.infer<typeof createDebtEntrySchema>;
export type UpdateDebtEntryInput = z.infer<typeof updateDebtEntrySchema>;
export type CreateDebtContactInput = z.infer<typeof createDebtContactSchema>;
