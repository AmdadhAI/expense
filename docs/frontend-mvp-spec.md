# Frontend MVP Specification - Budget Tracker 2026

## 1. Page Hierarchy & Routing
- `/login`: Public email/password sign-in.
- `/dashboard`: Protected monthly financial dashboard (Monthly report DTO: Income, Expenses, Savings, Available, allocation progress, recent transactions, quick Add transaction action).
- `/transactions`: Protected monthly transaction list with date hierarchy, kind/category filters, text search, pagination cursor, and Edit/Delete controls.
- `/review/yearly`: Protected 2026 annual review with 12-month summary table, CSS-based income/expense/savings chart, and top expense categories.
- `/settings`: Protected configuration for annual basis-point targets (Needs/Wants/Savings) and Sign Out.
- `/` -> Redirects to `/dashboard`.

## 2. Navigation Architecture
- **Mobile (<768px)**: Fixed bottom navigation bar with 4 destinations + prominent center `+` button triggering the Add Transaction sheet.
- **Desktop (≥768px)**: Compact left sidebar with active link highlights and quick Add Transaction button.
- Responsive breakpoints tested: 375px (mobile), 768px (tablet), 1440px (desktop).

## 3. Design Tokens & Visual Hierarchy
- **Palette**:
  - Background: Neutral off-white (`#F8FAFC` / `bg-slate-50`)
  - Cards: White (`#FFFFFF`) with `border-slate-200`
  - Income: Blue (`#2563EB` / `text-blue-600`)
  - Expenses: Coral/Red (`#DC2626` / `text-rose-600`)
  - Savings: Emerald (`#059669` / `text-emerald-600`)
  - Available: Slate 900 (`#09090B`)
- **Typography**: Inter/System sans-font with `font-medium`, `font-semibold`, and `font-bold` headings.
- **Icons**: Lucide React icons (`LayoutDashboard`, `ReceiptText`, `Calendar`, `Settings`, `Plus`, `Pencil`, `Trash2`, `LogOut`, `Filter`, `Search`).

## 4. Transaction Form Behavior
- **Modal Surface**: Mobile bottom sheet / Desktop dialog.
- **Inputs**:
  - Kind: `Income`, `Expense`, `Saving` pill toggle.
  - Amount: BDT string input using `inputMode="decimal"` on mobile.
  - Category: Filtered dynamically by selected kind.
  - Description: Required text.
  - Date: Defaulting to today in `Asia/Dhaka` (`YYYY-MM-DD`).
  - Note: Optional text behind secondary toggle.
- **Submit**: Native `disabled` during submission; request deduplication using `request_id`.

## 5. Component States & Accessibility
- **States**: Skeleton loading, empty data, filter no-results, error alerts with retry, negative available balance highlighting.
- **Accessibility**: Semantic HTML5, WCAG AA contrast (≥4.5:1), visible focus rings (`focus:ring-2 focus:ring-slate-900`), native `disabled` attributes, and 44px+ touch targets.
