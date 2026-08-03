# Backend Handoff Contract - Budget Tracker 2026

This document defines the serializable DTO contracts, validation schemas, error formats, and service queries provided by the backend feature layer for consumption by the frontend.

## 1. Core Data Conventions & Units
- **Money Values**: All monetary amounts are stored as exact integers (`amount_poisha bigint`) in Postgres. In JSON DTOs, monetary values are serialized as `amount_poisha_str` (e.g. `"10000000"`) and `amount_decimal` (e.g. `"100000.00"`).
- **Percentages & Ratios**: Represented as basis points integers (`bp`), where `10000 bp = 100.00%`, `2000 bp = 20.00%`, `1000 bp = 10.00%`, `7000 bp = 70.00%`.
- **Dates & Timezone**: Dates are validated as `YYYY-MM-DD` strings. Timezone defaults to `Asia/Dhaka`.
- **Authentication**: Derived strictly on the server from verified JWT claims/tokens. The `user_id` is never accepted from client inputs.

## 2. Service Modules & Operations

### A. Transactions (`src/lib/services/transactions.ts`)
- `createTransaction(input: CreateTransactionInput): Promise<TransactionDTO>`
  - Inputs: `kind`, `amount_decimal`, `description`, `transaction_date`, `category_id`, `note?`, `request_id?`
  - Validates category ownership, category kind match, and derives bucket automatically.
- `getTransactionById(id: string): Promise<TransactionDTO>`
- `updateTransaction(input: UpdateTransactionInput): Promise<TransactionDTO>`
- `deleteTransaction(id: string): Promise<{ success: boolean }>`
- `listTransactionsByMonth(params: ListTransactionsParams): Promise<{ items: TransactionDTO[]; next_cursor: string | null }>`

### B. Categories (`src/lib/services/categories.ts`)
- `listCategories(): Promise<CategoryDTO[]>`
- `listCategoriesGroupedByKind(): Promise<Record<TransactionKind, CategoryDTO[]>>`
- `createCategory(input: CreateCategoryInput): Promise<CategoryDTO>`
- `updateCategory(input: UpdateCategoryInput): Promise<CategoryDTO>`
- `archiveCategory(id: string): Promise<CategoryDTO>`

### C. Budget Plans (`src/lib/services/budget-plans.ts`)
- `getBudgetPlanForYear(year: number): Promise<BudgetPlanDTO>`
- `updateBudgetPlan(input: UpdateBudgetPlanInput): Promise<BudgetPlanDTO>`
  - Enforces `needs_bp + wants_bp + savings_bp === 10000`.

### D. Monthly Notes (`src/lib/services/monthly-notes.ts`)
- `getMonthlyNote(year: number, month: number): Promise<MonthlyNoteDTO | null>`
- `upsertMonthlyNote(input: UpsertMonthlyNoteInput): Promise<MonthlyNoteDTO>`
- `deleteMonthlyNote(year: number, month: number): Promise<{ success: boolean }>`

### E. Financial Reports (`src/lib/services/reports.ts`)
- `getMonthlyReport(year: number, month: number): Promise<MonthlyReportDTO>`
  - Powers **Dashboard** and **Transactions** monthly view.
  - Returns total income, expenses, savings, available balance, Needs/Wants/Savings actual vs target amounts, actual %, budget used %, savings rate, recent transactions, category breakdown, largest expenses.
- `getYearlyReport(year: number): Promise<YearlyReportDTO>`
  - Powers **Yearly Review**.
  - Returns annual totals, yearly savings rate, 12 monthly overviews in calendar order, Needs/Wants/Savings target comparison, top 5 expense categories, highest-spending month, and best-saving month with deterministic tie-breaking.

## 3. Page Query Mapping Matrix
| Page | Backend Query / Command |
| :--- | :--- |
| **Dashboard** | `getMonthlyReport(year, month)` |
| **Transactions** | `listTransactionsByMonth(...)`, `createTransaction(...)`, `updateTransaction(...)`, `deleteTransaction(...)` |
| **Yearly Review** | `getYearlyReport(year)` |
| **Settings** | `getBudgetPlanForYear(year)`, `updateBudgetPlan(...)`, `listCategoriesGroupedByKind()`, `createCategory(...)`, `archiveCategory(...)` |
