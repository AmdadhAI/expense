# Calculation Specification - Budget Tracker 2026

## 1. Monetary Units & Parsing
- All monetary amounts are processed as pure TypeScript `BigInt` minor units (poisha, where 1 BDT = 100 poisha).
- Decimal strings (e.g. `"100.50"`) are parsed safely into poisha using integer/string splitting (`parseDecimalToPoisha`) without invoking `parseFloat` or binary floating-point math.

## 2. Mathematical Formulas
```text
income_poisha = sum(income transactions)
needs_poisha = sum(expense transactions in Needs)
wants_poisha = sum(expense transactions in Wants)
expenses_poisha = needs_poisha + wants_poisha
savings_poisha = sum(saving transactions)
available_poisha = income_poisha - expenses_poisha - savings_poisha
```

## 3. Allocation Target & Remainder Balancing
- Target amounts in poisha are calculated using integer basis points:
```text
needs_target_poisha = (income_poisha * needs_bp + 5000n) / 10000n  [half-up integer rounding]
wants_target_poisha = (income_poisha * wants_bp + 5000n) / 10000n  [half-up integer rounding]
savings_target_poisha = income_poisha - needs_target_poisha - wants_target_poisha [exact remainder balancing]
```
This guarantees that `needs_target_poisha + wants_target_poisha + savings_target_poisha == income_poisha` for any income value.

## 4. Percentage & Ratio Calculations (Basis Points)
- **Actual Allocation % (in basis points)**:
  `actual_bp = (actual_bucket_poisha * 10000n + income_poisha / 2n) / income_poisha` (returns `0n` if income_poisha == 0n).
- **Budget Used % (in basis points)**:
  `budget_used_bp = (actual_bucket_poisha * 10000n + target_bucket_poisha / 2n) / target_bucket_poisha` (returns `0n` if target_bucket_poisha == 0n).
- **Savings Rate % (in basis points)**:
  `savings_rate_bp = (savings_poisha * 10000n + income_poisha / 2n) / income_poisha` (returns `0n` if income_poisha == 0n).
