import { z } from 'zod';

export const upsertMonthlyNoteSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  note: z.string().max(2000, 'Note text cannot exceed 2000 characters'),
});

export type UpsertMonthlyNoteInput = z.infer<typeof upsertMonthlyNoteSchema>;
