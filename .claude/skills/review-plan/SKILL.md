---
name: review-plan
description: Review test plans for feature coverage completeness. Returns APPROVED/REJECTED verdict.
argument-hint: "<plan_file>"
context: fork
agent: general-purpose
---

# Review Test Plan

## Invocation Rules

**Only invoked by:**
- `/automate-multi` workflow (phase 2.1b)
- `/automate` workflow (plan review gate)

---

## Arguments

```
/review-plan $0
             └── Plan file path (.claude/temp/plan.json)
```

---

## Purpose

Validate that test plans correctly cover the described features. Quality gate between Planning and Building.

> **A feature named "CREATE X" MUST have a test that CREATES X and VERIFIES IT WAS CREATED.**

---

## Validation Rules

### Rule 1: Main Flow Coverage

| Feature Contains | Test MUST | Verify |
|-----------------|-----------|--------|
| "View", "List", "Display" | Navigate + See content | Content is visible |
| "Create", "Add", "Register" | Complete creation flow | Entity appears/confirmed |
| "Edit", "Update" | Complete edit flow | Changes are saved |
| "Delete", "Remove" | Complete deletion flow | Entity is gone |
| "Login", "Auth" | Enter credentials + submit | Redirect/session confirmed |
| "Search", "Filter" | Apply search/filter | Results match criteria |

### Rule 2: Operation Completion

```
❌ INCOMPLETE (REJECT):
test_login:
  1. Navigate to login page
  2. Fill email
  3. Verify email field is filled
  # MISSING: Click login button
  # MISSING: Verify redirect

✅ COMPLETE (APPROVE):
test_login:
  1. Navigate to login page
  2. Fill credentials
  3. Click login button        ← EXECUTES the operation
  4. Verify redirect to dashboard  ← VERIFIES result
```

### Rule 3: Priority Assignment

| Test Type | Required Tag |
|-----------|-------------|
| Main Flow (happy path) | `smoke`, `p0` |
| Negative / validation | `p1` |
| Visual / UI elements | `p2` |

---

## Output Format

```json
{
  "reviewer": "review-plan",
  "verdict": "APPROVED | REJECTED",
  "validation_summary": {
    "scenarios_reviewed": 3,
    "complete_operations": 3,
    "correct_priorities": 3
  },
  "scenario_coverage": [
    {
      "scenario_id": "S1",
      "name": "test_login_valid_credentials",
      "operation": "AUTH",
      "completes_operation": true,
      "verifies_result": true,
      "priority_correct": true,
      "status": "PASS"
    }
  ],
  "violations": [],
  "recommendations": []
}
```

---

## Decision Logic

- Any scenario missing a main flow test → **REJECTED**
- Any CREATE/UPDATE/DELETE that doesn't execute the operation → **REJECTED**
- Any CREATE/UPDATE/DELETE that doesn't verify the result → **REJECTED**
- Any main flow test not tagged smoke/p0 → **REJECTED**
- No violations → **APPROVED**

---

## Red Flags (Auto-Reject)

| Red Flag | Why |
|----------|-----|
| Test name says "login" but steps don't submit | Name promises what test doesn't deliver |
| "Verify button is enabled" as final step | UI validation, not operation |
| No step clicking submit/login/create button | Operation never executed |
| No step verifying result after operation | Result never confirmed |
| Main flow test tagged p2 | Wrong priority |
