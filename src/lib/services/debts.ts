'use server';

import { createClient } from '@/lib/supabase/server';
import { parseDecimalToPoisha, formatPoishaToDecimal, formatPoishaToBDT } from '@/lib/money';
import {
  createDebtSchema,
  updateDebtSchema,
  createDebtPaymentSchema,
  CreateDebtInput,
  UpdateDebtInput,
  CreateDebtPaymentInput,
} from '@/lib/validations/debt';
import type {
  DebtType,
  DebtStatus,
  DebtDTO,
  DebtPaymentDTO,
  DebtSummaryDTO,
} from '@/types/debt.types';

export async function listDebts(filters?: {
  type?: DebtType | 'all';
  status?: DebtStatus | 'all';
  searchQuery?: string;
}): Promise<DebtDTO[]> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  let query = supabase
    .from('debts')
    .select(`
      *,
      debt_payments (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.searchQuery && filters.searchQuery.trim()) {
    query = query.ilike('person_name', `%${filters.searchQuery.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list debts: ${error.message}`);
  }

  return (data || []).map((row) => formatDebtDTO(row));
}

export async function getDebtSummary(): Promise<DebtSummaryDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      debt_payments (*)
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to calculate debt summary: ${error.message}`);
  }

  let totalLentPoisha = 0n;
  let totalLentRepaidPoisha = 0n;
  let totalBorrowedPoisha = 0n;
  let totalBorrowedRepaidPoisha = 0n;

  let activeLentCount = 0;
  let activeBorrowedCount = 0;
  let settledCount = 0;

  (data || []).forEach((row) => {
    const totalAmount = BigInt(row.amount_poisha);
    let repaid = 0n;
    if (Array.isArray(row.debt_payments)) {
      row.debt_payments.forEach((p: { amount_poisha: number }) => {
        repaid += BigInt(p.amount_poisha);
      });
    }

    if (row.status === 'settled') {
      settledCount++;
    } else {
      if (row.type === 'lent') {
        activeLentCount++;
      } else {
        activeBorrowedCount++;
      }
    }

    if (row.type === 'lent') {
      totalLentPoisha += totalAmount;
      totalLentRepaidPoisha += repaid;
    } else if (row.type === 'borrowed') {
      totalBorrowedPoisha += totalAmount;
      totalBorrowedRepaidPoisha += repaid;
    }
  });

  const totalLentRemaining = totalLentPoisha > totalLentRepaidPoisha ? totalLentPoisha - totalLentRepaidPoisha : 0n;
  const totalBorrowedRemaining =
    totalBorrowedPoisha > totalBorrowedRepaidPoisha ? totalBorrowedPoisha - totalBorrowedRepaidPoisha : 0n;

  // Net position = Total Lent Remaining (Owed to me, positive asset) - Total Borrowed Remaining (I owe, liability)
  const netBalancePoisha = totalLentRemaining - totalBorrowedRemaining;

  return {
    total_lent_poisha_str: totalLentPoisha.toString(),
    total_lent_bdt: formatPoishaToBDT(totalLentPoisha),
    total_lent_repaid_bdt: formatPoishaToBDT(totalLentRepaidPoisha),
    total_lent_remaining_bdt: formatPoishaToBDT(totalLentRemaining),
    total_borrowed_poisha_str: totalBorrowedPoisha.toString(),
    total_borrowed_bdt: formatPoishaToBDT(totalBorrowedPoisha),
    total_borrowed_repaid_bdt: formatPoishaToBDT(totalBorrowedRepaidPoisha),
    total_borrowed_remaining_bdt: formatPoishaToBDT(totalBorrowedRemaining),
    net_balance_poisha_str: netBalancePoisha.toString(),
    net_balance_bdt: formatPoishaToBDT(netBalancePoisha),
    active_lent_count: activeLentCount,
    active_borrowed_count: activeBorrowedCount,
    settled_count: settledCount,
  };
}

export async function createDebt(input: CreateDebtInput): Promise<DebtDTO> {
  const validated = createDebtSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const poisha = parseDecimalToPoisha(validated.amount_decimal);

  const { data, error } = await supabase
    .from('debts')
    .insert({
      user_id: userId,
      type: validated.type,
      person_name: validated.person_name,
      amount_poisha: Number(poisha),
      due_date: validated.due_date || null,
      notes: validated.notes || null,
      status: 'active',
    })
    .select(`
      *,
      debt_payments (*)
    `)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create debt record: ${error?.message}`);
  }

  return formatDebtDTO(data);
}

export async function updateDebt(input: UpdateDebtInput): Promise<DebtDTO> {
  const validated = updateDebtSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validated.type) updatePayload.type = validated.type;
  if (validated.person_name) updatePayload.person_name = validated.person_name;
  if (validated.amount_decimal) {
    updatePayload.amount_poisha = Number(parseDecimalToPoisha(validated.amount_decimal));
  }
  if (validated.due_date !== undefined) updatePayload.due_date = validated.due_date;
  if (validated.notes !== undefined) updatePayload.notes = validated.notes;
  if (validated.status) updatePayload.status = validated.status;

  const { data, error } = await supabase
    .from('debts')
    .update(updatePayload)
    .eq('id', validated.id)
    .eq('user_id', userId)
    .select(`
      *,
      debt_payments (*)
    `)
    .single();

  if (error || !data) {
    throw new Error(`Failed to update debt record: ${error?.message}`);
  }

  return formatDebtDTO(data);
}

export async function deleteDebt(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete debt record: ${error.message}`);
  }
}

export async function recordDebtPayment(input: CreateDebtPaymentInput): Promise<DebtPaymentDTO> {
  const validated = createDebtPaymentSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  // 1. Fetch debt record to verify ownership and balance
  const { data: debt, error: debtError } = await supabase
    .from('debts')
    .select(`
      *,
      debt_payments (*)
    `)
    .eq('id', validated.debt_id)
    .eq('user_id', userId)
    .single();

  if (debtError || !debt) {
    throw new Error('Debt record not found');
  }

  const paymentPoisha = parseDecimalToPoisha(validated.amount_decimal);
  const totalDebtPoisha = BigInt(debt.amount_poisha);
  let currentRepaid = 0n;
  if (Array.isArray(debt.debt_payments)) {
    debt.debt_payments.forEach((p: { amount_poisha: number }) => {
      currentRepaid += BigInt(p.amount_poisha);
    });
  }

  const remainingBefore = totalDebtPoisha > currentRepaid ? totalDebtPoisha - currentRepaid : 0n;

  if (paymentPoisha > remainingBefore) {
    throw new Error(
      `Payment amount (৳${validated.amount_decimal}) exceeds the remaining balance of ${formatPoishaToBDT(remainingBefore)}`
    );
  }

  // 2. Insert payment record
  const { data: payment, error: insertError } = await supabase
    .from('debt_payments')
    .insert({
      debt_id: validated.debt_id,
      user_id: userId,
      amount_poisha: Number(paymentPoisha),
      payment_date: validated.payment_date,
      notes: validated.notes || null,
    })
    .select()
    .single();

  if (insertError || !payment) {
    throw new Error(`Failed to record payment: ${insertError?.message}`);
  }

  // 3. Auto-update status to 'settled' if remaining balance becomes 0
  const newTotalRepaid = currentRepaid + paymentPoisha;
  if (newTotalRepaid >= totalDebtPoisha) {
    await supabase
      .from('debts')
      .update({ status: 'settled', updated_at: new Date().toISOString() })
      .eq('id', validated.debt_id)
      .eq('user_id', userId);
  }

  return {
    id: payment.id,
    debt_id: payment.debt_id,
    user_id: payment.user_id,
    amount_poisha_str: payment.amount_poisha.toString(),
    amount_decimal: formatPoishaToDecimal(BigInt(payment.amount_poisha)),
    amount_bdt: formatPoishaToBDT(BigInt(payment.amount_poisha)),
    payment_date: payment.payment_date,
    notes: payment.notes,
    created_at: payment.created_at,
  };
}

export async function deleteDebtPayment(paymentId: string): Promise<void> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  // 1. Fetch payment to know which debt it belonged to
  const { data: payment, error: fetchError } = await supabase
    .from('debt_payments')
    .select('debt_id')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !payment) {
    throw new Error('Payment record not found');
  }

  // 2. Delete payment
  const { error: deleteError } = await supabase
    .from('debt_payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to delete payment: ${deleteError.message}`);
  }

  // 3. Check remaining balance and re-open debt to 'active' if needed
  const { data: debt } = await supabase
    .from('debts')
    .select(`
      *,
      debt_payments (*)
    `)
    .eq('id', payment.debt_id)
    .eq('user_id', userId)
    .single();

  if (debt) {
    let repaid = 0n;
    if (Array.isArray(debt.debt_payments)) {
      debt.debt_payments.forEach((p: { amount_poisha: number }) => {
        repaid += BigInt(p.amount_poisha);
      });
    }
    const total = BigInt(debt.amount_poisha);
    if (repaid < total && debt.status === 'settled') {
      await supabase
        .from('debts')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', payment.debt_id)
        .eq('user_id', userId);
    }
  }
}

// Helper formatting function
function formatDebtDTO(row: {
  id: string;
  user_id: string;
  type: string;
  person_name: string;
  amount_poisha: number;
  due_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  debt_payments?: Array<{
    id: string;
    debt_id: string;
    user_id: string;
    amount_poisha: number;
    payment_date: string;
    notes: string | null;
    created_at: string;
  }>;
}): DebtDTO {
  const totalPoisha = BigInt(row.amount_poisha);
  let repaidPoisha = 0n;

  const payments: DebtPaymentDTO[] = (row.debt_payments || [])
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .map((p) => {
      const pPoisha = BigInt(p.amount_poisha);
      repaidPoisha += pPoisha;
      return {
        id: p.id,
        debt_id: p.debt_id,
        user_id: p.user_id,
        amount_poisha_str: p.amount_poisha.toString(),
        amount_decimal: formatPoishaToDecimal(pPoisha),
        amount_bdt: formatPoishaToBDT(pPoisha),
        payment_date: p.payment_date,
        notes: p.notes,
        created_at: p.created_at,
      };
    });

  const remainingPoisha = totalPoisha > repaidPoisha ? totalPoisha - repaidPoisha : 0n;
  const percent = totalPoisha > 0n ? Number((repaidPoisha * 100n) / totalPoisha) : 0;

  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as DebtType,
    person_name: row.person_name,
    total_amount_poisha_str: totalPoisha.toString(),
    total_amount_decimal: formatPoishaToDecimal(totalPoisha),
    total_amount_bdt: formatPoishaToBDT(totalPoisha),
    repaid_amount_poisha_str: repaidPoisha.toString(),
    repaid_amount_decimal: formatPoishaToDecimal(repaidPoisha),
    repaid_amount_bdt: formatPoishaToBDT(repaidPoisha),
    remaining_amount_poisha_str: remainingPoisha.toString(),
    remaining_amount_decimal: formatPoishaToDecimal(remainingPoisha),
    remaining_amount_bdt: formatPoishaToBDT(remainingPoisha),
    repaid_percent: Math.min(Math.max(percent, 0), 100),
    due_date: row.due_date,
    notes: row.notes,
    status: row.status as DebtStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
    payments,
  };
}
