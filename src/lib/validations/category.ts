import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  kind: z.enum(['income', 'expense', 'saving']),
  default_bucket: z.enum(['needs', 'wants', 'savings']).nullable().optional(),
}).refine((data) => {
  if (data.kind === 'income') return data.default_bucket === null || data.default_bucket === undefined;
  if (data.kind === 'expense') return data.default_bucket === 'needs' || data.default_bucket === 'wants';
  if (data.kind === 'saving') return data.default_bucket === 'savings';
  return true;
}, { message: 'Invalid default bucket for category kind' });

export const updateCategorySchema = z.object({
  id: z.string().uuid('Invalid category ID'),
  name: z.string().min(1).max(100).optional(),
  default_bucket: z.enum(['needs', 'wants', 'savings']).nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
