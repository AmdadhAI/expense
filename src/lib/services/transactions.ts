'use server';
import { createClient } from '@/lib/supabase/server';
import { parseDecimalToPoisha, formatPoishaToDecimal } from '@/lib/money';
import { createTransactionSchema, updateTransactionSchema, CreateTransactionInput, UpdateTransactionInput } from '@/lib/validations/transaction';
import { TransactionKind, TransactionBucket } from '@/types/database.types';

export interface TransactionDTO {
  id: string;
  user_id: string;
  kind: TransactionKind;
  amount_poisha_str: string;
  amount_decimal: string;
  description: string;
  transaction_date: string;
  category_id: string;
  bucket: TransactionBucket;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionDTO> {
  const validated = createTransactionSchema.parse(input);
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  // 1. Fetch category & verify ownership and kind match
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, user_id, kind, default_bucket')
    .eq('id', validated.category_id)
    .eq('user_id', userId)
    .single();

  if (categoryError || !category) {
    throw new Error('Category not found or does not belong to user');
  }

  if (category.kind !== validated.kind) {
    throw new Error(`Category kind (${category.kind}) does not match transaction kind (${validated.kind})`);
  }

  // 2. Derive trusted bucket
  let derivedBucket: TransactionBucket = null;
  if (validated.kind === 'expense') {
    derivedBucket = category.default_bucket as 'needs' | 'wants';
    if (!derivedBucket || (derivedBucket !== 'needs' && derivedBucket !== 'wants')) {
      derivedBucket = 'needs'; // fallback default for expense
    }
  } else if (validated.kind === 'saving') {
    derivedBucket = 'savings';
  } else {
    derivedBucket = null;
  }

  // 3. Parse money integer
  const poisha = parseDecimalToPoisha(validated.amount_decimal);

  // 4. Handle idempotency via request_id if present
  if (validated.request_id) {
    const { data: existing } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('request_id', validated.request_id)
      .maybeSingle();

    if (existing) {
      return formatTransactionDTO(existing);
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      kind: validated.kind,
      amount_poisha: Number(poisha),
      description: validated.description,
      transaction_date: validated.transaction_date,
      category_id: validated.category_id,
      bucket: derivedBucket,
      note: validated.note || null,
      request_id: validated.request_id || null,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    throw new Error(`Failed to create transaction: ${insertError?.message}`);
  }

  return formatTransactionDTO(inserted);
}

export async function getTransactionById(id: string): Promise<TransactionDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userData.user.id)
    .single();

  if (error || !data) throw new Error('Transaction not found');
  return formatTransactionDTO(data);
}

export async function updateTransaction(input: UpdateTransactionInput): Promise<TransactionDTO> {
  const validated = updateTransactionSchema.parse(input);
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const updateData: Record<string, unknown> = {};

  if (validated.amount_decimal !== undefined) {
    updateData.amount_poisha = Number(parseDecimalToPoisha(validated.amount_decimal));
  }
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.transaction_date !== undefined) updateData.transaction_date = validated.transaction_date;
  if (validated.note !== undefined) updateData.note = validated.note;

  if (validated.category_id !== undefined) {
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id, user_id, kind, default_bucket')
      .eq('id', validated.category_id)
      .eq('user_id', userId)
      .single();

    if (catError || !category) throw new Error('Invalid category');
    updateData.category_id = category.id;
  }

  const { data: updated, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', validated.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !updated) throw new Error(`Failed to update transaction: ${error?.message}`);
  return formatTransactionDTO(updated);
}

export async function deleteTransaction(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id);

  if (error) throw new Error(`Failed to delete transaction: ${error.message}`);
  return { success: true };
}

export interface ListTransactionsParams {
  year: number;
  month: number;
  kind?: TransactionKind;
  category_id?: string;
  search_query?: string;
  limit?: number;
  cursor?: string;
}

export async function listTransactionsByMonth(params: ListTransactionsParams): Promise<{ items: TransactionDTO[]; next_cursor: string | null }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
  const nextMonthYear = params.month === 12 ? params.year + 1 : params.year;
  const nextMonthNum = params.month === 12 ? 1 : params.month + 1;
  const endDate = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01`;

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.kind) query = query.eq('kind', params.kind);
  if (params.category_id) query = query.eq('category_id', params.category_id);
  if (params.search_query) query = query.ilike('description', `%${params.search_query}%`);

  const limit = params.limit || 50;
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list transactions: ${error.message}`);

  let next_cursor: string | null = null;
  const items = data || [];
  if (items.length > limit) {
    const nextItem = items.pop()!;
    next_cursor = nextItem.id;
  }

  return {
    items: items.map(formatTransactionDTO),
    next_cursor,
  };
}

function formatTransactionDTO(row: Record<string, unknown>): TransactionDTO {
  const poishaNum = BigInt(row.amount_poisha as number);
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    kind: row.kind as TransactionKind,
    amount_poisha_str: poishaNum.toString(),
    amount_decimal: formatPoishaToDecimal(poishaNum),
    description: row.description as string,
    transaction_date: row.transaction_date as string,
    category_id: row.category_id as string,
    bucket: row.bucket as TransactionBucket,
    note: (row.note as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
