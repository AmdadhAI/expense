export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TransactionKind = 'income' | 'expense' | 'saving';
export type ExpenseBucket = 'needs' | 'wants';
export type SavingBucket = 'savings';
export type TransactionBucket = ExpenseBucket | SavingBucket | null;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          kind: TransactionKind
          default_bucket: TransactionBucket
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          kind: TransactionKind
          default_bucket?: TransactionBucket
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          kind?: TransactionKind
          default_bucket?: TransactionBucket
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          kind: TransactionKind
          amount_poisha: number | bigint
          description: string
          transaction_date: string
          category_id: string
          bucket: TransactionBucket
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: TransactionKind
          amount_poisha: number | bigint
          description: string
          transaction_date: string
          category_id: string
          bucket?: TransactionBucket
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: TransactionKind
          amount_poisha?: number | bigint
          description?: string
          transaction_date?: string
          category_id?: string
          bucket?: TransactionBucket
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_composite_fk"
            columns: ["category_id", "user_id", "kind"]
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id", "kind"]
          }
        ]
      }
      budget_plans: {
        Row: {
          user_id: string
          year: number
          needs_bp: number
          wants_bp: number
          savings_bp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          year: number
          needs_bp?: number
          wants_bp?: number
          savings_bp?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          year?: number
          needs_bp?: number
          wants_bp?: number
          savings_bp?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_notes: {
        Row: {
          user_id: string
          year: number
          month: number
          note: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          year: number
          month: number
          note?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          year?: number
          month?: number
          note?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      onboard_user: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
