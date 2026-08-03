# Test Plan - Budget Tracker 2026

## 1. Automated Unit Tests (Vitest)
- **Calculation Suite (`src/lib/calculations.test.ts`)**:
  - Test 1: Scenario Income 100,000.00 BDT (10,000,000n poisha), Needs 20,000.00 BDT, Wants 10,000.00 BDT, Savings 70,000.00 BDT.
    - Verified Expenses: 30,000.00 BDT.
    - Verified Available Balance: 0 BDT.
    - Verified Targets: Needs 20,000.00 BDT, Wants 10,000.00 BDT, Savings 70,000.00 BDT (sum = income).
    - Verified Ratios: Needs 20.00% (2000 bp), Wants 10.00% (1000 bp), Savings 70.00% (7000 bp).
  - Test 2: Target Remainder Balancing on odd income (e.g. 100.01 BDT / 10,001n poisha).
  - Test 3: Zero-income denominator tests proving return value is `0n` (no division by zero).
  - Test 4: Decimal string to BigInt poisha parsing tests (`parseDecimalToPoisha`).

## 2. RLS Two-User Isolation Verification Script (`npm run test:rls`)
- Automated verification script checking against local Supabase runtime:
  - User A can CRUD User A's rows.
  - User A cannot SELECT, INSERT, UPDATE, or DELETE User B's rows.
  - User A cannot mutate `user_id` to User B's ID during UPDATE.
  - Anonymous user receives 0 rows / access denied.
  - `/login` route is accessible without redirect loops.
  - Public signup attempt is rejected (`enable_signup = false`).

## 3. Code Hygiene & Secret Scanning
- `npm run lint` for ESLint rules.
- `npx tsc --noEmit` for TypeScript typechecking.
- Secret scanning on git repository files to ensure zero exposed credentials or service-role keys.
