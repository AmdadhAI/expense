export type DebtType = 'lent' | 'borrowed';
export type DebtStatus = 'active' | 'settled';

export interface DebtPaymentDTO {
  id: string;
  debt_id: string;
  user_id: string;
  amount_poisha_str: string;
  amount_decimal: string;
  amount_bdt: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface DebtDTO {
  id: string;
  user_id: string;
  type: DebtType;
  person_name: string;
  total_amount_poisha_str: string;
  total_amount_decimal: string;
  total_amount_bdt: string;
  repaid_amount_poisha_str: string;
  repaid_amount_decimal: string;
  repaid_amount_bdt: string;
  remaining_amount_poisha_str: string;
  remaining_amount_decimal: string;
  remaining_amount_bdt: string;
  repaid_percent: number;
  due_date: string | null;
  notes: string | null;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
  payments: DebtPaymentDTO[];
}

export interface DebtSummaryDTO {
  total_lent_poisha_str: string;
  total_lent_bdt: string;
  total_lent_repaid_bdt: string;
  total_lent_remaining_bdt: string;
  total_borrowed_poisha_str: string;
  total_borrowed_bdt: string;
  total_borrowed_repaid_bdt: string;
  total_borrowed_remaining_bdt: string;
  net_balance_poisha_str: string;
  net_balance_bdt: string;
  active_lent_count: number;
  active_borrowed_count: number;
  settled_count: number;
}
