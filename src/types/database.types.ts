export type TransactionKind = 'income' | 'expense' | 'saving';
export type ExpenseBucket = 'needs' | 'wants';
export type SavingBucket = 'savings';
export type TransactionBucket = ExpenseBucket | SavingBucket | null;

export type DebtType = 'lent' | 'borrowed';
export type DebtStatus = 'active' | 'settled';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      budget_plans: {
        Row: {
          created_at: string
          needs_bp: number
          savings_bp: number
          updated_at: string
          user_id: string
          wants_bp: number
          year: number
        }
        Insert: {
          created_at?: string
          needs_bp: number
          savings_bp: number
          updated_at?: string
          user_id: string
          wants_bp: number
          year: number
        }
        Update: {
          created_at?: string
          needs_bp?: number
          savings_bp?: number
          updated_at?: string
          user_id?: string
          wants_bp?: number
          year?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          default_bucket: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_bucket?: string | null
          id?: string
          is_active?: boolean
          kind: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_bucket?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          amount_poisha: number
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          person_name: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_poisha: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          person_name: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_poisha?: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          person_name?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount_poisha: number
          created_at: string
          debt_id: string
          id: string
          notes: string | null
          payment_date: string
          user_id: string
        }
        Insert: {
          amount_poisha: number
          created_at?: string
          debt_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          user_id: string
        }
        Update: {
          amount_poisha?: number
          created_at?: string
          debt_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          }
        ]
      }
      monthly_notes: {
        Row: {
          created_at: string
          month: number
          note: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          month: number
          note?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          month?: number
          note?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_poisha: number
          bucket: string | null
          category_id: string
          created_at: string
          description: string
          id: string
          kind: string
          note: string | null
          request_id: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_poisha: number
          bucket?: string | null
          category_id: string
          created_at?: string
          description: string
          id?: string
          kind: string
          note?: string | null
          request_id?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_poisha?: number
          bucket?: string | null
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          note?: string | null
          request_id?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_composite_fk"
            columns: ["category_id", "user_id", "kind"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id", "kind"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      onboard_user: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
