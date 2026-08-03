import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { upsertMonthlyNoteSchema, UpsertMonthlyNoteInput } from '@/lib/validations/monthly-note';

export interface MonthlyNoteDTO {
  user_id: string;
  year: number;
  month: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export async function getMonthlyNote(year: number, month: number): Promise<MonthlyNoteDTO | null> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('monthly_notes')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (error) throw new Error(`Failed to read monthly note: ${error.message}`);
  if (!data) return null;

  return {
    user_id: data.user_id,
    year: data.year,
    month: data.month,
    note: data.note,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function upsertMonthlyNote(input: UpsertMonthlyNoteInput): Promise<MonthlyNoteDTO> {
  const validated = upsertMonthlyNoteSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('monthly_notes')
    .upsert({
      user_id: userId,
      year: validated.year,
      month: validated.month,
      note: validated.note,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert monthly note: ${error.message}`);

  return {
    user_id: data.user_id,
    year: data.year,
    month: data.month,
    note: data.note,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteMonthlyNote(year: number, month: number): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('monthly_notes')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('year', year)
    .eq('month', month);

  if (error) throw new Error(`Failed to delete monthly note: ${error.message}`);
  return { success: true };
}
