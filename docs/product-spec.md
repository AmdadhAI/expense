# Product Specification - Budget Tracker 2026

## 1. Overview & MVP Boundary
The 2026 Budget Tracker is a private, mobile-first personal finance application designed for rapid transaction entry (<10 seconds) and clear monthly and yearly summaries.

### Core Non-Negotiable Invariants
- **No Dedicated Investment or Salary Payment**: The MVP contains no dedicated Investment or Salary Payment section, category, report, route, database field, or seeded data.
- **Savings is Not an Expense**: Transaction kinds are strictly `income`, `expense`, and `saving`. Recording savings does not inflate expense totals.
- **Buckets**:
  - `expense` transactions belong to `needs` or `wants`.
  - `saving` transactions belong to `savings`.
  - `income` transactions have `null` bucket.
- **Default Targets**: Needs 20% (2000 bp), Wants 10% (1000 bp), Savings 70% (7000 bp), totaling exactly 100% (10000 bp).
- **Currency & Timezone**: Currency is fixed to `BDT` and timezone to `Asia/Dhaka`.
- **Exact Money**: Stored as `amount_poisha bigint` (1 BDT = 100 poisha). No floating-point database types or binary floating-point calculations.
- **Derived Summaries**: Monthly and yearly summaries are calculated dynamically from dated transactions; no summary tables are created.
- **Private Single-User, Multi-User Ready**: Built for one private user initially, but all database entities and security policies strictly enforce multi-user isolation using `auth.uid()`.
- **Disabled Registration**: Public signup is disabled in configuration and UI. No `/signup` page or link exists.
