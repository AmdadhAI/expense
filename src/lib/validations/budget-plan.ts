import { z } from 'zod';

export const updateBudgetPlanSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  needs_bp: z.number().int().min(0).max(10000),
  wants_bp: z.number().int().min(0).max(10000),
  savings_bp: z.number().int().min(0).max(10000),
}).refine((data) => data.needs_bp + data.wants_bp + data.savings_bp === 10000, {
  message: 'Target basis points must sum to exactly 10000 (100%)',
});

export type UpdateBudgetPlanInput = z.infer<typeof updateBudgetPlanSchema>;
