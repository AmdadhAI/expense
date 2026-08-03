import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { calculateSummaries, TransactionInput } from '@/lib/calculations';
import { formatPoishaToDecimal, formatPoishaToBDT } from '@/lib/money';
import { getBudgetPlanForYear } from './budget-plans';
import { TransactionKind, TransactionBucket } from '@/types/database.types';

export interface CategorySummaryDTO {
  category_id: string;
  category_name: string;
  kind: TransactionKind;
  bucket: TransactionBucket;
  total_poisha_str: string;
  total_decimal: string;
  total_bdt: string;
}

export interface MonthlyReportDTO {
  year: number;
  month: number;
  income_poisha_str: string;
  income_decimal: string;
  income_bdt: string;
  needs_poisha_str: string;
  needs_decimal: string;
  needs_bdt: string;
  wants_poisha_str: string;
  wants_decimal: string;
  wants_bdt: string;
  expenses_poisha_str: string;
  expenses_decimal: string;
  expenses_bdt: string;
  savings_poisha_str: string;
  savings_decimal: string;
  savings_bdt: string;
  available_poisha_str: string;
  available_decimal: string;
  available_bdt: string;
  needs_target_poisha_str: string;
  needs_target_decimal: string;
  wants_target_poisha_str: string;
  wants_target_decimal: string;
  savings_target_poisha_str: string;
  savings_target_decimal: string;
  needs_actual_bp: number;
  wants_actual_bp: number;
  savings_actual_bp: number;
  needs_budget_used_bp: number;
  wants_budget_used_bp: number;
  savings_budget_used_bp: number;
  savings_rate_bp: number;
  recent_transactions: {
    id: string;
    description: string;
    kind: TransactionKind;
    amount_decimal: string;
    transaction_date: string;
  }[];
  category_breakdown: CategorySummaryDTO[];
  largest_expenses: {
    id: string;
    description: string;
    amount_decimal: string;
    transaction_date: string;
  }[];
}

export interface MonthlyOverviewDTO {
  month: number;
  month_name: string;
  income_poisha_str: string;
  income_decimal: string;
  expenses_poisha_str: string;
  expenses_decimal: string;
  savings_poisha_str: string;
  savings_decimal: string;
  available_poisha_str: string;
  available_decimal: string;
}

export interface YearlyReportDTO {
  year: number;
  total_income_poisha_str: string;
  total_income_decimal: string;
  total_income_bdt: string;
  total_expenses_poisha_str: string;
  total_expenses_decimal: string;
  total_expenses_bdt: string;
  total_savings_poisha_str: string;
  total_savings_decimal: string;
  total_savings_bdt: string;
  total_available_poisha_str: string;
  total_available_decimal: string;
  total_available_bdt: string;
  yearly_savings_rate_bp: number;
  monthly_overviews: MonthlyOverviewDTO[];
  top_expense_categories: CategorySummaryDTO[];
  highest_spending_month: { month: number; month_name: string; expenses_decimal: string } | null;
  best_saving_month: { month: number; month_name: string; savings_decimal: string } | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReportDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonthNum = month === 12 ? 1 : month + 1;
  const endDate = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01`;

  // Fetch transactions and budget plan concurrently
  const [txRes, plan, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endDate)
      .order('transaction_date', { ascending: false }),
    getBudgetPlanForYear(year),
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId),
  ]);

  if (txRes.error) throw new Error(`Failed to read transactions: ${txRes.error.message}`);
  const rawTx = txRes.data || [];

  const categoryMap = new Map<string, string>();
  (catRes.data || []).forEach((c) => categoryMap.set(c.id, c.name));

  const calcInputs: TransactionInput[] = rawTx.map((t) => ({
    kind: t.kind as TransactionKind,
    bucket: (t.bucket as TransactionBucket) || null,
    amount_poisha: BigInt(t.amount_poisha),
  }));

  const calcResult = calculateSummaries(calcInputs, {
    needs_bp: plan.needs_bp,
    wants_bp: plan.wants_bp,
    savings_bp: plan.savings_bp,
  });

  // Category breakdown & largest expenses
  const catTotals = new Map<string, { name: string; kind: TransactionKind; bucket: TransactionBucket; total: bigint }>();
  const expenseTx: { id: string; description: string; amount_poisha: bigint; transaction_date: string }[] = [];

  for (const t of rawTx) {
    const poisha = BigInt(t.amount_poisha);
    const catName = categoryMap.get(t.category_id) || 'Uncategorized';
    const key = t.category_id;

    if (!catTotals.has(key)) {
      catTotals.set(key, {
        name: catName,
        kind: t.kind as TransactionKind,
        bucket: (t.bucket as TransactionBucket) || null,
        total: 0n,
      });
    }
    catTotals.get(key)!.total += poisha;

    if (t.kind === 'expense') {
      expenseTx.push({
        id: t.id,
        description: t.description,
        amount_poisha: poisha,
        transaction_date: t.transaction_date,
      });
    }
  }

  const category_breakdown: CategorySummaryDTO[] = Array.from(catTotals.entries()).map(([catId, info]) => ({
    category_id: catId,
    category_name: info.name,
    kind: info.kind,
    bucket: info.bucket,
    total_poisha_str: info.total.toString(),
    total_decimal: formatPoishaToDecimal(info.total),
    total_bdt: formatPoishaToBDT(info.total),
  })).sort((a, b) => (BigInt(b.total_poisha_str) > BigInt(a.total_poisha_str) ? 1 : -1));

  expenseTx.sort((a, b) => (b.amount_poisha > a.amount_poisha ? 1 : -1));
  const largest_expenses = expenseTx.slice(0, 5).map((e) => ({
    id: e.id,
    description: e.description,
    amount_decimal: formatPoishaToDecimal(e.amount_poisha),
    transaction_date: e.transaction_date,
  }));

  const recent_transactions = rawTx.slice(0, 10).map((t) => ({
    id: t.id,
    description: t.description,
    kind: t.kind as TransactionKind,
    amount_decimal: formatPoishaToDecimal(BigInt(t.amount_poisha)),
    transaction_date: t.transaction_date,
  }));

  return {
    year,
    month,
    income_poisha_str: calcResult.income_poisha.toString(),
    income_decimal: formatPoishaToDecimal(calcResult.income_poisha),
    income_bdt: formatPoishaToBDT(calcResult.income_poisha),
    needs_poisha_str: calcResult.needs_poisha.toString(),
    needs_decimal: formatPoishaToDecimal(calcResult.needs_poisha),
    needs_bdt: formatPoishaToBDT(calcResult.needs_poisha),
    wants_poisha_str: calcResult.wants_poisha.toString(),
    wants_decimal: formatPoishaToDecimal(calcResult.wants_poisha),
    wants_bdt: formatPoishaToBDT(calcResult.wants_poisha),
    expenses_poisha_str: calcResult.expenses_poisha.toString(),
    expenses_decimal: formatPoishaToDecimal(calcResult.expenses_poisha),
    expenses_bdt: formatPoishaToBDT(calcResult.expenses_poisha),
    savings_poisha_str: calcResult.savings_poisha.toString(),
    savings_decimal: formatPoishaToDecimal(calcResult.savings_poisha),
    savings_bdt: formatPoishaToBDT(calcResult.savings_poisha),
    available_poisha_str: calcResult.available_poisha.toString(),
    available_decimal: formatPoishaToDecimal(calcResult.available_poisha),
    available_bdt: formatPoishaToBDT(calcResult.available_poisha),
    needs_target_poisha_str: calcResult.needs_target_poisha.toString(),
    needs_target_decimal: formatPoishaToDecimal(calcResult.needs_target_poisha),
    wants_target_poisha_str: calcResult.wants_target_poisha.toString(),
    wants_target_decimal: formatPoishaToDecimal(calcResult.wants_target_poisha),
    savings_target_poisha_str: calcResult.savings_target_poisha.toString(),
    savings_target_decimal: formatPoishaToDecimal(calcResult.savings_target_poisha),
    needs_actual_bp: Number(calcResult.needs_actual_bp),
    wants_actual_bp: Number(calcResult.wants_actual_bp),
    savings_actual_bp: Number(calcResult.savings_actual_bp),
    needs_budget_used_bp: Number(calcResult.needs_budget_used_bp),
    wants_budget_used_bp: Number(calcResult.wants_budget_used_bp),
    savings_budget_used_bp: Number(calcResult.savings_budget_used_bp),
    savings_rate_bp: Number(calcResult.savings_rate_bp),
    recent_transactions,
    category_breakdown,
    largest_expenses,
  };
}

export async function getYearlyReport(year: number): Promise<YearlyReportDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;

  const [txRes, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endDate),
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId),
  ]);

  if (txRes.error) throw new Error(`Failed to read transactions for year ${year}: ${txRes.error.message}`);
  const rawTx = txRes.data || [];

  const categoryMap = new Map<string, string>();
  (catRes.data || []).forEach((c) => categoryMap.set(c.id, c.name));

  // Initialize 12 monthly totals
  const monthlyTotals: { income: bigint; expenses: bigint; savings: bigint }[] = Array.from({ length: 12 }, () => ({
    income: 0n,
    expenses: 0n,
    savings: 0n,
  }));

  let total_income = 0n;
  let total_expenses = 0n;
  let total_savings = 0n;

  const categoryTotals = new Map<string, { name: string; kind: TransactionKind; bucket: TransactionBucket; total: bigint }>();

  for (const t of rawTx) {
    const poisha = BigInt(t.amount_poisha);
    const dateObj = new Date(t.transaction_date);
    const monthIdx = dateObj.getUTCMonth(); // 0 - 11

    if (t.kind === 'income') {
      total_income += poisha;
      monthlyTotals[monthIdx].income += poisha;
    } else if (t.kind === 'expense') {
      total_expenses += poisha;
      monthlyTotals[monthIdx].expenses += poisha;

      const catName = categoryMap.get(t.category_id) || 'Uncategorized';
      if (!categoryTotals.has(t.category_id)) {
        categoryTotals.set(t.category_id, {
          name: catName,
          kind: 'expense',
          bucket: (t.bucket as TransactionBucket) || null,
          total: 0n,
        });
      }
      categoryTotals.get(t.category_id)!.total += poisha;
    } else if (t.kind === 'saving') {
      total_savings += poisha;
      monthlyTotals[monthIdx].savings += poisha;
    }
  }

  const total_available = total_income - total_expenses - total_savings;
  const yearly_savings_rate_bp = total_income > 0n ? Number((total_savings * 10000n + total_income / 2n) / total_income) : 0;

  const monthly_overviews: MonthlyOverviewDTO[] = monthlyTotals.map((m, idx) => {
    const avail = m.income - m.expenses - m.savings;
    return {
      month: idx + 1,
      month_name: MONTH_NAMES[idx],
      income_poisha_str: m.income.toString(),
      income_decimal: formatPoishaToDecimal(m.income),
      expenses_poisha_str: m.expenses.toString(),
      expenses_decimal: formatPoishaToDecimal(m.expenses),
      savings_poisha_str: m.savings.toString(),
      savings_decimal: formatPoishaToDecimal(m.savings),
      available_poisha_str: avail.toString(),
      available_decimal: formatPoishaToDecimal(avail),
    };
  });

  // Highest spending & best saving months with deterministic tie-breaking (earliest month wins)
  let maxExpenses = -1n;
  let maxExpensesMonthIdx = -1;

  let maxSavings = -1n;
  let maxSavingsMonthIdx = -1;

  monthlyTotals.forEach((m, idx) => {
    if (m.expenses > maxExpenses && m.expenses > 0n) {
      maxExpenses = m.expenses;
      maxExpensesMonthIdx = idx;
    }
    if (m.savings > maxSavings && m.savings > 0n) {
      maxSavings = m.savings;
      maxSavingsMonthIdx = idx;
    }
  });

  const highest_spending_month = maxExpensesMonthIdx >= 0 ? {
    month: maxExpensesMonthIdx + 1,
    month_name: MONTH_NAMES[maxExpensesMonthIdx],
    expenses_decimal: formatPoishaToDecimal(maxExpenses),
  } : null;

  const best_saving_month = maxSavingsMonthIdx >= 0 ? {
    month: maxSavingsMonthIdx + 1,
    month_name: MONTH_NAMES[maxSavingsMonthIdx],
    savings_decimal: formatPoishaToDecimal(maxSavings),
  } : null;

  const top_expense_categories: CategorySummaryDTO[] = Array.from(categoryTotals.entries())
    .map(([catId, info]) => ({
      category_id: catId,
      category_name: info.name,
      kind: info.kind,
      bucket: info.bucket,
      total_poisha_str: info.total.toString(),
      total_decimal: formatPoishaToDecimal(info.total),
      total_bdt: formatPoishaToBDT(info.total),
    }))
    .sort((a, b) => (BigInt(b.total_poisha_str) > BigInt(a.total_poisha_str) ? 1 : -1))
    .slice(0, 5);

  return {
    year,
    total_income_poisha_str: total_income.toString(),
    total_income_decimal: formatPoishaToDecimal(total_income),
    total_income_bdt: formatPoishaToBDT(total_income),
    total_expenses_poisha_str: total_expenses.toString(),
    total_expenses_decimal: formatPoishaToDecimal(total_expenses),
    total_expenses_bdt: formatPoishaToBDT(total_expenses),
    total_savings_poisha_str: total_savings.toString(),
    total_savings_decimal: formatPoishaToDecimal(total_savings),
    total_savings_bdt: formatPoishaToBDT(total_savings),
    total_available_poisha_str: total_available.toString(),
    total_available_decimal: formatPoishaToDecimal(total_available),
    total_available_bdt: formatPoishaToBDT(total_available),
    yearly_savings_rate_bp,
    monthly_overviews,
    top_expense_categories,
    highest_spending_month,
    best_saving_month,
  };
}
