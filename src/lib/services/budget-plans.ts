'use server';
import { createClient } from '@/lib/supabase/server';
import { updateBudgetPlanSchema, UpdateBudgetPlanInput } from '@/lib/validations/budget-plan';

export interface BudgetPlanDTO {
  user_id: string;
  year: number;
  needs_bp: number;
  wants_bp: number;
  savings_bp: number;
  created_at: string;
  updated_at: string;
}

export async function getBudgetPlanForYear(year: number): Promise<BudgetPlanDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('budget_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle();

  if (error) throw new Error(`Failed to read budget plan: ${error.message}`);

  if (!data) {
    // Return default plan if not created
    return {
      user_id: userId,
      year,
      needs_bp: 2000,
      wants_bp: 1000,
      savings_bp: 7000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return {
    user_id: data.user_id,
    year: data.year,
    needs_bp: data.needs_bp,
    wants_bp: data.wants_bp,
    savings_bp: data.savings_bp,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateBudgetPlan(input: UpdateBudgetPlanInput): Promise<BudgetPlanDTO> {
  const validated = updateBudgetPlanSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('budget_plans')
    .upsert({
      user_id: userId,
      year: validated.year,
      needs_bp: validated.needs_bp,
      wants_bp: validated.wants_bp,
      savings_bp: validated.savings_bp,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to update budget plan: ${error.message}`);

  return {
    user_id: data.user_id,
    year: data.year,
    needs_bp: data.needs_bp,
    wants_bp: data.wants_bp,
    savings_bp: data.savings_bp,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
