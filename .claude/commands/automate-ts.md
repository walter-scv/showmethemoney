# Automate E2E Test Creation

You are the **Orchestrator** of a multi-agent system for autonomous Playwright TypeScript test automation.

## Command Format

```
/automate e2e "<description>" [--url <target_url>]
```

## Task Types

- `e2e` — Create E2E UI tests with Playwright + TypeScript

---

## E2E TEST WORKFLOW

Execute these gates sequentially. Each gate has max 3 iterations before escalating to user.

### GATE 1: SCENARIO PLANNING

**Agent**: Planner

1. Read user's description
2. Search existing tests: `Grep` for related test files in `tests/`
3. Search existing Page Objects: `Glob` for `pages/*.ts`
4. Generate test scenarios with:
   - Scenario name and description
   - Tags (smoke, p0, p1, feature tag)
   - Preconditions
   - Steps in business language
   - Expected outcomes
   - Numbered test steps (1-, 2-, 3-)

Read `.claude/agents/planner.md` and pass to Task agent.

**Output**: List of scenarios to implement

---

### GATE 1B: UI REALITY CHECK

**Agent**: YOU directly (with MCP)

**Purpose**: Validate what ACTUALLY exists in the app before writing tests.

1. `mcp__playwright__browser_navigate` → target URL
2. `mcp__playwright__browser_wait_for` → page loaded
3. `mcp__playwright__browser_snapshot` → capture UI

**Discovery Checklist:**
```
□ What UI sections/areas exist?
□ What forms and inputs are available?
□ What buttons/actions are present?
□ Are there elements NOT mentioned in description?
□ Are there described elements that DON'T exist?
```

4. Document discrepancies between description and reality
5. Update scenarios if needed

**CRITICAL RULE**: UI Reality takes precedence over description.

---

### GATE 2: ELEMENT EXPLORATION

**Agent**: YOU directly (with MCP)

1. `mcp__playwright__browser_navigate` → target URL
2. `mcp__playwright__browser_snapshot` → accessibility tree
3. For each UI element needed:
   - Find data-testid first
   - If none, use role-based selector
   - Verify selector is unique
4. Document any dynamic behavior

**Output**: Element map with verified selectors

---

### GATE 3: PAGE OBJECT CREATION

**Agent**: Builder

Read `.claude/agents/builder.md` and pass to Task agent with:
```
artifact_type: page_object
context: [scenarios from Gate 1, selectors from Gate 2]
```

**Review Criteria:**
- [ ] TypeScript class with proper exports
- [ ] All locators as `readonly` properties in constructor
- [ ] Selector priority followed (data-testid > role > label > text)
- [ ] No `waitForTimeout()`
- [ ] Data extraction logic in page object methods

**Output**: Page Object TypeScript code

---

### GATE 4: TEST CREATION

**Agent**: Builder

```
artifact_type: e2e_test
context: [scenarios from Gate 1, page object from Gate 3]
```

**Pattern:**
```typescript
import { test, expect } from '@playwright/test';
import { FeaturePage } from '../pages/FeaturePage';

test.describe('Feature Name @feature', () => {

  test('scenario description @smoke @p0', async ({ page }) => {
    // ARRANGE
    const featurePage = new FeaturePage(page);
    await featurePage.navigate();

    // ACT
    await featurePage.performAction();

    // ASSERT
    await expect(featurePage.successElement).toBeVisible();
  });

});
```

**Review Criteria:**
- [ ] AAA pattern (Arrange, Act, Assert)
- [ ] Tags in test title (@smoke, @p0, @feature)
- [ ] NO LOGIC IN TESTS (no parsing, loops, conditionals)
- [ ] Uses Page Object methods (not raw locators)
- [ ] Self-contained tests

**DO NOT write files yet** — pass code to Review Gates first.

---

### GATE 4B: PARALLEL CODE REVIEW (3 Specialized Reviewers)

Launch 3 review skills IN PARALLEL:

```
Skill(skill="review-pom", args=".claude/temp/pending_page_object.ts .claude/temp/selectors.json")
Skill(skill="review-test", args=".claude/temp/pending_test.spec.ts")
Skill(skill="review-plan", args=".claude/temp/plan.json")
```

Save temp files first:
```
Write(.claude/temp/pending_page_object.ts, [PO code])
Write(.claude/temp/pending_test.spec.ts, [Test code])
Write(.claude/temp/plan.json, [scenarios from Gate 1])
```

**Decision:**
- ALL `APPROVED` → Proceed to Gate 4C
- ANY `REJECTED` → Fix and re-run Gates 3/4 (max 2 iterations)

---

### GATE 4C: SELECTOR VALIDATION

**Agent**: YOU directly

Compare selectors in generated code against MCP-verified selectors from Gate 2.

| Selector in Code | MCP Verified? | Status |
|------------------|---------------|--------|
| `getByRole('button', { name: 'Login' })` | ✅ | PASS |
| `getByTestId('unknown-id')` | ❌ | FAIL |

**If PASS**: Write files → proceed to Gate 5
**If FAIL**: Return to Builder with list of invalid selectors

---

### GATE 5: TEST EXECUTION

Run the tests:
```bash
npx playwright test tests/path/to/new.spec.ts --project=chromium
```

- **PASS**: Workflow complete
- **FAIL**: Enter fixing loop (max 3 iterations)

**Fixing Loop:**
```
FAIL → Analyze error → Reproduce with MCP → Propose fix → Re-run
```

**CRITICAL RULES:**
- NEVER mark failing test as OK
- NEVER comment out assertions
- NEVER add try/catch to swallow errors
- After 3 failures → ESCALATE TO USER

---

## ESCALATION FORMAT

```
## Escalation Required

**Gate**: [gate name]
**Iteration**: 3 (max reached)

### What I Tried
1. [action] → [result]
2. [action] → [result]
3. [action] → [result]

### Current Error
[error message]

### Options
1. Provide guidance
2. Confirm external issue
3. Abort

What would you like me to do?
```

---

## EXAMPLE USAGE

```bash
# Create tests for the login feature
/automate e2e "Create tests for user login" --url https://sea-lion-app-7celq.ondigitalocean.app

# Create tests for a specific flow
/automate e2e "Create tests for the registration form" --url https://sea-lion-app-7celq.ondigitalocean.app/register
```

---

## KEY RULES

- Gates 1B, 2, 4C: YOU directly with MCP
- Gates 3, 4: Builder agent
- Gate 4B: 3 review skills IN PARALLEL (single message)
- Gate 5: Run actual `npx playwright test` (not dry-run)
- **DO NOT write files until ALL reviews pass**
- UI Reality takes precedence over description
