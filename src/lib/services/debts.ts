'use server';

import { createClient } from '@/lib/supabase/server';
import { parseDecimalToPoisha, formatPoishaToDecimal, formatPoishaToBDT } from '@/lib/money';
import {
  createDebtEntrySchema,
  updateDebtEntrySchema,
  CreateDebtEntryInput,
  UpdateDebtEntryInput,
} from '@/lib/validations/debt';
import type {
  DebtEntryType,
  DebtEntryDTO,
  DebtContactDTO,
  DebtSummaryDTO,
} from '@/types/debt.types';

export async function listDebtContacts(filters?: {
  status?: 'all' | 'paona' | 'dena' | 'settled';
  searchQuery?: string;
}): Promise<DebtContactDTO[]> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  let query = supabase
    .from('debt_contacts')
    .select(`
      *,
      debt_entries (*)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (filters?.searchQuery && filters.searchQuery.trim()) {
    query = query.ilike('name', `%${filters.searchQuery.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01' || error.message.includes('Could not find the table') || error.message.includes('relation "public.debt_contacts" does not exist')) {
      return [];
    }
    throw new Error(`Failed to list contacts: ${error.message}`);
  }

  const contacts = (data || []).map((row) => formatContactDTO(row));

  if (filters?.status && filters.status !== 'all') {
    return contacts.filter((c) => c.status === filters.status);
  }

  return contacts;
}

export async function listAllContacts(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('debt_contacts')
    .select('id, name')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    if (error.code === '42P01' || error.message.includes('Could not find the table')) {
      return [];
    }
    throw new Error(`Failed to list contacts: ${error.message}`);
  }

  return data || [];
}

export async function getContactLedger(contactId: string): Promise<DebtContactDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('debt_contacts')
    .select(`
      *,
      debt_entries (*)
    `)
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    handleDatabaseError(error, 'Contact not found');
  }

  return formatContactDTO(data, true);
}

export async function getDebtSummary(): Promise<DebtSummaryDTO> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('debt_contacts')
    .select(`
      *,
      debt_entries (*)
    `)
    .eq('user_id', userId);

  if (error) {
    if (error.code === '42P01' || error.message.includes('Could not find the table') || error.message.includes('relation "public.debt_contacts" does not exist')) {
      return {
        total_paona_poisha_str: '0',
        total_paona_bdt: '৳ 0.00',
        total_dena_poisha_str: '0',
        total_dena_bdt: '৳ 0.00',
        net_balance_poisha_str: '0',
        net_balance_bdt: '৳ 0.00',
        paona_contacts_count: 0,
        dena_contacts_count: 0,
        settled_contacts_count: 0,
        total_contacts_count: 0,
      };
    }
    throw new Error(`Failed to calculate summary: ${error.message}`);
  }

  let totalPaonaPoisha = 0n;
  let totalDenaPoisha = 0n;
  let paonaCount = 0;
  let denaCount = 0;
  let settledCount = 0;

  (data || []).forEach((row) => {
    const contact = formatContactDTO(row);
    const netPoisha = BigInt(contact.net_balance_poisha_str);

    if (netPoisha > 0n) {
      totalPaonaPoisha += netPoisha;
      paonaCount++;
    } else if (netPoisha < 0n) {
      totalDenaPoisha += -netPoisha;
      denaCount++;
    } else {
      settledCount++;
    }
  });

  const overallNetPoisha = totalPaonaPoisha - totalDenaPoisha;

  return {
    total_paona_poisha_str: totalPaonaPoisha.toString(),
    total_paona_bdt: formatPoishaToBDT(totalPaonaPoisha),
    total_dena_poisha_str: totalDenaPoisha.toString(),
    total_dena_bdt: formatPoishaToBDT(totalDenaPoisha),
    net_balance_poisha_str: overallNetPoisha.toString(),
    net_balance_bdt: formatPoishaToBDT(overallNetPoisha),
    paona_contacts_count: paonaCount,
    dena_contacts_count: denaCount,
    settled_contacts_count: settledCount,
    total_contacts_count: (data || []).length,
  };
}

export async function createDebtEntry(input: CreateDebtEntryInput): Promise<DebtEntryDTO> {
  const validated = createDebtEntrySchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  let targetContactId = validated.contact_id;

  // If no contact_id provided, find or create by name
  if (!targetContactId && validated.person_name) {
    const cleanName = validated.person_name.trim();

    // Check if contact already exists with same name (case-insensitive)
    const { data: existingContact } = await supabase
      .from('debt_contacts')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', cleanName)
      .maybeSingle();

    if (existingContact) {
      targetContactId = existingContact.id;
    } else {
      const { data: newContact, error: createContactError } = await supabase
        .from('debt_contacts')
        .insert({
          user_id: userId,
          name: cleanName,
        })
        .select('id')
        .single();

      if (createContactError || !newContact) {
        handleDatabaseError(createContactError, 'Failed to create person contact');
      }
      targetContactId = newContact.id;
    }
  }

  if (!targetContactId) {
    throw new Error('Contact ID could not be determined');
  }

  const poisha = parseDecimalToPoisha(validated.amount_decimal);

  const { data: entry, error: insertError } = await supabase
    .from('debt_entries')
    .insert({
      contact_id: targetContactId,
      user_id: userId,
      entry_type: validated.entry_type,
      amount_poisha: Number(poisha),
      entry_date: validated.entry_date,
      due_date: validated.due_date || null,
      notes: validated.notes || null,
    })
    .select()
    .single();

  if (insertError || !entry) {
    handleDatabaseError(insertError, 'Failed to record entry');
  }

  // Update contact's updated_at timestamp
  await supabase
    .from('debt_contacts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', targetContactId)
    .eq('user_id', userId);

  return {
    id: entry.id,
    contact_id: entry.contact_id,
    user_id: entry.user_id,
    entry_type: entry.entry_type as DebtEntryType,
    amount_poisha_str: entry.amount_poisha.toString(),
    amount_decimal: formatPoishaToDecimal(BigInt(entry.amount_poisha)),
    amount_bdt: formatPoishaToBDT(BigInt(entry.amount_poisha)),
    entry_date: entry.entry_date,
    due_date: entry.due_date,
    notes: entry.notes,
    created_at: entry.created_at,
  };
}

export async function updateDebtEntry(input: UpdateDebtEntryInput): Promise<DebtEntryDTO> {
  const validated = updateDebtEntrySchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const updatePayload: Record<string, unknown> = {};

  if (validated.entry_type) updatePayload.entry_type = validated.entry_type;
  if (validated.amount_decimal) {
    updatePayload.amount_poisha = Number(parseDecimalToPoisha(validated.amount_decimal));
  }
  if (validated.entry_date) updatePayload.entry_date = validated.entry_date;
  if (validated.due_date !== undefined) updatePayload.due_date = validated.due_date;
  if (validated.notes !== undefined) updatePayload.notes = validated.notes;

  const { data, error } = await supabase
    .from('debt_entries')
    .update(updatePayload)
    .eq('id', validated.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    handleDatabaseError(error, 'Failed to update entry');
  }

  // Update contact's updated_at
  await supabase
    .from('debt_contacts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', data.contact_id)
    .eq('user_id', userId);

  return {
    id: data.id,
    contact_id: data.contact_id,
    user_id: data.user_id,
    entry_type: data.entry_type as DebtEntryType,
    amount_poisha_str: data.amount_poisha.toString(),
    amount_decimal: formatPoishaToDecimal(BigInt(data.amount_poisha)),
    amount_bdt: formatPoishaToBDT(BigInt(data.amount_poisha)),
    entry_date: data.entry_date,
    due_date: data.due_date,
    notes: data.notes,
    created_at: data.created_at,
  };
}

export async function deleteDebtEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { data: entry } = await supabase
    .from('debt_entries')
    .select('contact_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  const { error } = await supabase.from('debt_entries').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    handleDatabaseError(error, 'Failed to delete entry');
  }

  if (entry?.contact_id) {
    await supabase
      .from('debt_contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', entry.contact_id)
      .eq('user_id', userId);
  }
}

export async function deleteDebtContact(contactId: string): Promise<void> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }
  const userId = userData.user.id;

  const { error } = await supabase
    .from('debt_contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', userId);

  if (error) {
    handleDatabaseError(error, 'Failed to delete contact');
  }
}

// Helper: Formats contact with accumulated ledger balances & running balance history
function formatContactDTO(
  row: {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    debt_entries?: Array<{
      id: string;
      contact_id: string;
      user_id: string;
      entry_type: string;
      amount_poisha: number;
      entry_date: string;
      due_date: string | null;
      notes: string | null;
      created_at: string;
    }>;
  },
  includeRunningBalances = false
): DebtContactDTO {
  const rawEntries = row.debt_entries || [];

  // Sort chronological for balance calculation (oldest first)
  const sortedAsc = [...rawEntries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime() || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let gavePoisha = 0n; // Paona given
  let receivedPoisha = 0n; // Paona repaid
  let tookPoisha = 0n; // Dena taken
  let paidPoisha = 0n; // Dena repaid

  let runningPoisha = 0n; // positive = paona, negative = dena

  const formattedEntries: DebtEntryDTO[] = sortedAsc.map((entry) => {
    const amount = BigInt(entry.amount_poisha);
    const type = entry.entry_type as DebtEntryType;

    if (type === 'gave') {
      gavePoisha += amount;
      runningPoisha += amount;
    } else if (type === 'received') {
      receivedPoisha += amount;
      runningPoisha -= amount;
    } else if (type === 'took') {
      tookPoisha += amount;
      runningPoisha -= amount;
    } else if (type === 'paid') {
      paidPoisha += amount;
      runningPoisha += amount;
    }

    const runningStatus: 'paona' | 'dena' | 'settled' =
      runningPoisha > 0n ? 'paona' : runningPoisha < 0n ? 'dena' : 'settled';

    return {
      id: entry.id,
      contact_id: entry.contact_id,
      user_id: entry.user_id,
      entry_type: type,
      amount_poisha_str: entry.amount_poisha.toString(),
      amount_decimal: formatPoishaToDecimal(amount),
      amount_bdt: formatPoishaToBDT(amount),
      entry_date: entry.entry_date,
      due_date: entry.due_date,
      notes: entry.notes,
      created_at: entry.created_at,
      running_balance_bdt: formatPoishaToBDT(runningPoisha < 0n ? -runningPoisha : runningPoisha),
      running_balance_status: runningStatus,
    };
  });

  // Net calculation: Paona remaining vs Dena remaining
  const netPoisha = (gavePoisha - receivedPoisha) - (tookPoisha - paidPoisha);

  const status: 'paona' | 'dena' | 'settled' =
    netPoisha > 0n ? 'paona' : netPoisha < 0n ? 'dena' : 'settled';

  const totalPaona = gavePoisha > receivedPoisha ? gavePoisha - receivedPoisha : 0n;
  const totalDena = tookPoisha > paidPoisha ? tookPoisha - paidPoisha : 0n;

  // Newest first for UI display
  const displayEntries = includeRunningBalances
    ? [...formattedEntries].reverse()
    : undefined;

  const lastActivityDate = sortedAsc.length > 0 ? sortedAsc[sortedAsc.length - 1].entry_date : null;

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    phone: row.phone,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    total_paona_poisha_str: totalPaona.toString(),
    total_paona_bdt: formatPoishaToBDT(totalPaona),
    total_dena_poisha_str: totalDena.toString(),
    total_dena_bdt: formatPoishaToBDT(totalDena),
    net_balance_poisha_str: netPoisha.toString(),
    net_balance_bdt: formatPoishaToBDT(netPoisha < 0n ? -netPoisha : netPoisha),
    status,
    entries_count: rawEntries.length,
    last_activity_date: lastActivityDate,
    entries: displayEntries,
  };
}

function handleDatabaseError(error: { code?: string; message?: string } | null, defaultMsg: string): never {
  const msg = error?.message || '';
  if (
    error?.code === '42P01' ||
    msg.includes('Could not find the table') ||
    msg.includes('relation "public.debt_contacts" does not exist') ||
    msg.includes('relation "public.debt_entries" does not exist')
  ) {
    throw new Error(
      'The "debt_contacts" and "debt_entries" tables have not been initialized in your Supabase database yet. Please run the SQL migration in your Supabase SQL Editor.'
    );
  }
  throw new Error(`${defaultMsg}: ${msg || 'Unknown error'}`);
}
