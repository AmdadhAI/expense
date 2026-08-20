export type DebtEntryType = 'gave' | 'took' | 'received' | 'paid';

export interface DebtEntryDTO {
  id: string;
  contact_id: string;
  user_id: string;
  entry_type: DebtEntryType;
  amount_poisha_str: string;
  amount_decimal: string;
  amount_bdt: string;
  entry_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  running_balance_bdt?: string;
  running_balance_status?: 'paona' | 'dena' | 'settled';
}

export interface DebtContactDTO {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_paona_poisha_str: string;
  total_paona_bdt: string;
  total_dena_poisha_str: string;
  total_dena_bdt: string;
  net_balance_poisha_str: string;
  net_balance_bdt: string;
  status: 'paona' | 'dena' | 'settled';
  entries_count: number;
  last_activity_date: string | null;
  entries?: DebtEntryDTO[];
}

export interface DebtSummaryDTO {
  total_paona_poisha_str: string;
  total_paona_bdt: string;
  total_dena_poisha_str: string;
  total_dena_bdt: string;
  net_balance_poisha_str: string;
  net_balance_bdt: string;
  paona_contacts_count: number;
  dena_contacts_count: number;
  settled_contacts_count: number;
  total_contacts_count: number;
}
