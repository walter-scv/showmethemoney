# Exploratory Testing Command

Interactive exploratory testing session using Playwright MCP.

---

## Usage

```
/explore [--url <url>] [--feature <feature-name>]
```

### Arguments

| Flag | Required | Example | Description |
|------|----------|---------|-------------|
| `--url` | No | `--url /login` | Specific path to explore (appended to base URL) |
| `--feature` | No | `--feature auth` | Feature area to focus on |

### Examples

```bash
# Explore the entire app starting from root
/explore

# Explore a specific feature
/explore --feature login

# Explore a specific URL
/explore --url /dashboard
```

---

## Base URL

```
https://sea-lion-app-7celq.ondigitalocean.app
```

---

## Workflow

### 1. Navigate & Discover

```
1. mcp__playwright__browser_navigate → base URL (or --url)
2. mcp__playwright__browser_wait_for → page fully loaded
3. mcp__playwright__browser_snapshot → capture full page structure
4. Analyze: title, navigation, key sections, forms, buttons
```

### 2. Map the App

For each page/section discovered:
```
□ What is the page purpose?
□ What are the main UI sections?
□ What forms/inputs exist?
□ What buttons/actions are available?
□ What navigation links exist?
□ Are there any error states or empty states?
□ Any authentication requirements?
```

### 3. Document Elements

For each meaningful element found:
- Note the best selector (data-testid > role > label > text)
- Note dynamic behaviors (modals, loading states, etc.)
- Note any bugs or unexpected behavior

### 4. Execute Flows

Test the main flows you discover:
- Happy path (valid data, expected actions)
- Error paths (invalid data, missing fields)
- Edge cases (empty states, boundary values)

### 5. Write Specs File (MANDATORY)

After exploration, **always** write a spec document to `docs/specs/`.

**File naming**: `docs/specs/<feature-or-page>.md`
Examples:
- `docs/specs/home.md`
- `docs/specs/portfolio.md`
- `docs/specs/login.md`

**File structure:**

```markdown
# [Feature / Page Name]

> Explored: YYYY-MM-DD
> URL: [page URL]

---

## Overview

[2-4 sentences describing what this feature does, who uses it, and why it exists]

---

## Use Cases

### UC-1: [Name]
**Actor**: [who]
**Goal**: [what they want to achieve]

**Main flow**:
1. [step]
2. [step]
3. [step]

**Expected result**: [what happens when everything goes right]

---

### UC-2: [Name]
...

---

## Edge Cases & Border Behaviors

- **[Condition]**: [what happens] — ✅ correct / ❌ bug / ⚠️ unclear
- **[Condition]**: [what happens]

Examples:
- Empty state (no data): [behavior]
- Maximum values: [behavior]
- Invalid input: [behavior]
- Network error: [behavior]

---

## Issues Found

| # | Severity | Description |
|---|----------|-------------|
| 1 | High/Medium/Low | [description] |

---

## Technical Notes (optional)

Elements and selectors discovered during exploration — useful for test automation.

| Element | Selector | Notes |
|---------|----------|-------|
| [name] | `getByRole(...)` | [notes] |
```

**Rules for writing specs:**
- One file per feature/page explored
- If file already exists → append new findings, don't overwrite
- Focus on BEHAVIOR, not implementation
- Document ALL edge cases observed, even if they work correctly
- Issues section only for bugs or unexpected behavior
- Technical Notes section is optional — only include if selectors were verified via MCP

---

## Rules

### DO
- Use Playwright MCP for all navigation (never guess URLs)
- Wait for page to fully load before snapshotting
- Test ALL visible flows (happy path, errors, edge cases)
- Document every meaningful element found
- Report ALL bugs/issues found (never omit)
- Verify field persistence: edit fields TWICE to catch state bugs
- Wait for confirmations after save/submit actions

### DON'T
- Invent URLs — only use what MCP shows exists
- Screenshot every single step (use snapshot instead)
- Skip flows because data is missing — note it as a finding
- Navigate away after save without confirming action completed

---

## Screenshots Policy

**ONLY take screenshots when:**
1. You suspect a visual bug — to capture evidence
2. A field has potential truncation/formatting issues

**DO NOT:**
- Screenshot every step
- Use screenshots for simple navigation verification (use `browser_snapshot`)

---

## SPA Considerations

This is a **Vue.js SPA**. Always:
- Wait for `networkidle` or specific text/elements before snapshotting
- Be aware initial HTML is minimal — content loads via JavaScript
- Use `browser_wait_for` for dynamically loaded content

---

## Progress Tracking

Use TodoWrite to track:
- [ ] Pages/routes discovered
- [ ] Flows tested
- [ ] Issues found
- [ ] Elements documented
