# Multi-Agent E2E Test Automation

You are the **Orchestrator**. Spawn agents via `Task(subagent_type="general-purpose")` with rules from `.claude/agents/*.md`, and invoke reviewer skills via `Skill()`.

## Command Format

```
/automate-multi e2e "<description>" --url <target_url>
```

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                         │
│  Agents: .claude/agents/*.md → Task(general-purpose)    │
│  Reviews: .claude/skills/review-* → Skill()             │
└─────────────────────────────────────────────────────────┘
                            │
════════════════════════════════════════════════
                  PHASE 1: DISCOVERY
════════════════════════════════════════════════
                            │
                  ┌──────────────┐
                  │ 1.1 Search   │  ← ORCHESTRATOR DIRECT (Glob + Grep)
                  └──────┬───────┘
                         │
                  ┌──────────────┐
                  │ 1.2 Config   │  → review-config skill (always)
                  └──────┬───────┘
                         │
════════════════════════════════════════════════
                  PHASE 2: PLANNING
════════════════════════════════════════════════
                         │
                  ┌──────────────┐
                  │ 2.1 Planner  │  → planner.md (sonnet)
                  └──────┬───────┘
                         │
                  ┌──────────────┐
                  │ 2.1b Review  │  → review-plan skill (BLOCKING)
                  └──────┬───────┘
                         │
                  ┌──────────────┐
                  │ 2.2 MCP      │  ← ORCHESTRATOR DIRECT (selectors)
                  └──────┬───────┘
                         │
════════════════════════════════════════════════
                  PHASE 3: BUILDING
════════════════════════════════════════════════
                         │
                  ┌──────────────┐
                  │ 3.1 Builder  │  → builder.md (sonnet)
                  └──────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        /review-pom /review-test /review-plan (PARALLEL)
              └──────────┼──────────┘
                         │
                  ┌──────────────┐
                  │ 3.3 Writer   │  → writer-tests.md (🚨 ONLY writes *.spec.ts)
                  └──────┬───────┘
                         │
════════════════════════════════════════════════
                  PHASE 4: VALIDATION
════════════════════════════════════════════════
                         │
                  ┌──────────────┐
                  │ 4.1 Run tests│  npx playwright test
                  └──────┬───────┘
                         │
                  ┌──────────────┐
                  │ 4.2 Docs     │  Update docs/specs/<feature>.md
                  └──────┬───────┘
                         │
                  ┌──────────────┐
                  │ 4.3 Cleanup  │  → cleanup.md (haiku)
                  └──────────────┘
```

---

## EXECUTION STEPS

### Initialize

Extract: `task_type`, `description`, `url` from command arguments.

### MANDATORY: Create TodoList

**BEFORE starting**, create full TodoList with `TaskCreate`:

```
#1  Phase 1.1: Search codebase + verify BasePage/BaseTest exist
#2  Phase 1.2: review-config skill                             (blockedBy: #1)
#3  Phase 2.1: Plan scenarios                                  (blockedBy: #2)
#4  Phase 2.1b: Review plan (BLOCKING GATE)                   (blockedBy: #3)
#5  Phase 2.2: MCP selector discovery                         (blockedBy: #4)
#6  Phase 3.1: Build page object + test code                  (blockedBy: #5)
#7  Phase 3.2: Run parallel reviews                           (blockedBy: #6)
#8  Phase 3.3: Writer writes test files                       (blockedBy: #7)
#9  Phase 4.1: Run playwright tests                           (blockedBy: #8)
#10 Phase 4.2: Update docs                                    (blockedBy: #9)
#11 Phase 4.3: Cleanup temp files                             (blockedBy: #10)
```

---

## PHASE 1: DISCOVERY

### 1.1 Direct Search + Scaffolding Check (Orchestrator)

```
Glob("tests/**/*{keyword}*.spec.ts")   → existing test files
Glob("pages/**/*{keyword}*.ts")        → existing page objects
```

**MANDATORY scaffolding check — before any generation:**

```
Glob("pages/BasePage.ts")     → MUST exist — if missing, create it first
Glob("tests/base-test.ts")    → MUST exist — if missing, create it first
```

If either is missing, create it now before proceeding to Phase 1.2:

**`pages/BasePage.ts`** must export `BasePage` (abstract class with `page`, `url`, `navigate()`) and `TIMEOUTS` constants (`short`, `standard`, `long`).

**`tests/base-test.ts`** must re-export `test` (extended from `@playwright/test`) and `expect`.

---

### 1.2 Config Review (Orchestrator calls Skill — always)

```
Read(.claude/skills/review-config/SKILL.md)
Skill(skill="review-config", args="playwright.config.ts")
```

The skill handles the conditional logic internally — if everything is already configured it returns `SKIPPED` immediately with no changes.

**Decision:**
- `SKIPPED` or `APPROVED_WITH_FIXES` → proceed to Phase 2
- `REJECTED` → escalate to user before continuing

---

## PHASE 2: PLANNING

### 2.1 Planner

```
Read(.claude/agents/planner.md)
Task(subagent_type="general-purpose", model="sonnet",
  prompt="[planner.md]\n\n## Task: [description]\n## Existing tests: [1.1 results]")
```

### 2.1b Plan Review (BLOCKING GATE)

Save plan and invoke skill:
```
Write(.claude/temp/plan.json, [planner output])
Skill(skill="review-plan", args=".claude/temp/plan.json")
```

**Decision:**
- `APPROVED` → Save to `.claude/approved-plan.json`, continue
- `REJECTED` → Back to 2.1 (max 3 iterations)

### 2.2 MCP Selector Discovery (Orchestrator)

1. `mcp__playwright__browser_navigate` → target URL
2. `mcp__playwright__browser_wait_for` → loaded
3. `mcp__playwright__browser_snapshot` → capture UI
4. Extract verified selectors (condensed ~200 tokens)
5. `mcp__playwright__browser_close`

Save: `Write(.claude/temp/selectors.json, [verified_selectors])`

---

## PHASE 3: BUILDING

### 3.1 Builder

```
Read(.claude/agents/builder.md)
Task(subagent_type="general-purpose", model="sonnet",
  prompt="[builder.md]\n\n## Scenarios: [from 2.1]\n## Selectors: [from 2.2]")
```

Save output:
```
Write(.claude/temp/pending_page_object.ts, [PO code])
Write(.claude/temp/pending_test.spec.ts, [Test code])
```

### 3.2 Parallel Reviews (3 Skills)

Launch IN PARALLEL in a SINGLE message:
```
Skill(skill="review-pom", args=".claude/temp/pending_page_object.ts .claude/temp/selectors.json")
Skill(skill="review-test", args=".claude/temp/pending_test.spec.ts")
Skill(skill="review-plan", args=".claude/temp/plan.json")
```

**Decision:**
- ALL `APPROVED` → Proceed to 3.3
- ANY `REJECTED` → Fix and re-run Builder (max 2 iterations)

### 3.3 Writer Agent (🚨 PHYSICAL SEPARATION)

**RESTRICTION**: Orchestrator CANNOT write `*.spec.ts` files directly.

```
Read(.claude/agents/writer-tests.md)
Task(subagent_type="general-purpose", model="sonnet",
  prompt="[writer-tests.md]\n\n## Approved Plan: .claude/approved-plan.json\n## Pending: .claude/temp/")
```

Writer validates ALL smoke/p0 tests are present → writes final files.

**Page Objects**: Orchestrator CAN write `.ts` page objects directly.

---

## PHASE 4: VALIDATION

### 4.1 Test Execution (BLOCKING)

```bash
npx playwright test tests/path/to/new.spec.ts --project=chromium
```

- `PASS` → Mark completed, proceed to 4.2
- `FAIL` → Fix and re-run (max 3 iterations) → Escalate if still failing
- **`--list` is NOT execution. Must run actual tests.**

After tests pass, verify both reports were generated:
```bash
ls playwright-report/index.html
ls allure-results/
```

### 4.2 Documentation Update (MANDATORY — blockedBy 4.1)

Update or create `docs/specs/<feature>.md` with:
- Overview of the feature tested
- List of test scenarios added (id, name, tags, expected outcome)
- Any bugs or edge cases documented during testing

### 4.3 Cleanup (MANDATORY — blockedBy 4.2)

```
Read(.claude/agents/cleanup.md)
Task(subagent_type="general-purpose", model="haiku",
  prompt="[cleanup.md]\n\n## Workflow Status: [SUCCESS|FAILED|ESCALATED]")
```

---

## KEY RULES

- **1.1**: Orchestrator direct — Glob + Grep + **BasePage/BaseTest scaffolding check**
- **1.2**: `review-config` skill — **always called** (returns SKIPPED if nothing to do)
- **2.1**: planner.md agent
- **2.1b**: review-plan skill — **BLOCKING GATE**
- **2.2**: Orchestrator direct with MCP
- **3.1**: builder.md agent — page objects extend BasePage, tests import base-test
- **3.2**: 3 review skills IN PARALLEL (single message) — review-pom enforces BasePage/TIMEOUTS, review-test enforces base-test import
- **3.3**: writer-tests.md — **🚨 ONLY agent that writes *.spec.ts**
- **4.1**: Actual `npx playwright test` run + verify `playwright-report/index.html` AND `allure-results/` generated
- **4.2**: Update `docs/specs/<feature>.md`
- **4.3**: cleanup.md (haiku)

**DO NOT write test files until ALL reviews pass.**
