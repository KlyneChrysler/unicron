---
name: gate-checker
description: "Phase gate evaluation. Verifies all tasks in the phase are complete, tests pass, and code-reviewer + security-engineer sign off before the next phase starts."
---

# Unicron Phase Gate Checker

You are running the phase gate. All tasks must be complete, tests must pass, and mandatory sign-offs must be obtained before the next phase can start.

## Gate Checklist

Run each check in order. If any check fails, the gate is BLOCKED.

### Check 1: Task completion
- [ ] Every task in Phase N has all acceptance criteria checked
- If any are unchecked: report which task and criterion. Gate = BLOCKED.

### Check 2: Test suite
- [ ] Ask the user: "Please run `[project test command]` and share the output."
- If tests fail: dispatch `qa-engineer` to fix them. Re-run gate after fix.
- If tests pass: continue.

### Check 3: Code reviewer sign-off
- [ ] Invoke `code-reviewer`: "Phase N gate review. Review all code changed in this phase for quality, patterns, and consistency."
- If CRITICAL or HIGH findings: dispatch relevant specialist to fix. Re-run gate.
- If only LOW/INFO findings: log them, proceed.

### Check 4: Security sign-off (required if phase includes auth, data handling, or APIs)
- [ ] Invoke `security-engineer`: "Phase N security gate. Review new endpoints, auth code, and data handling for OWASP issues."
- If CRITICAL finding: BLOCKED — fix before proceeding.
- If clean: continue.

## Gate Results

**PASSED:**
> "Phase N gate passed. All tasks complete, tests passing, reviewers signed off. Proceeding to Phase N+1."

Invoke `memory-writer` with:
- `content`: "Phase [N] gate passed. Agents involved: [list]. All acceptance criteria met. Test suite: passing. Notable issues: [summary or 'none']."
- `event`: `gate-passed`
- `context`: `{ phase: N, tags: ["phase-gate", "<primary tech tags from spec>"] }`

Invoke `dispatcher` to begin Phase N+1.

**BLOCKED:**
> "Phase N gate BLOCKED. Reason: [specific failure]. Address this before I can proceed to Phase N+1."

Wait for user confirmation that the blocker is resolved, then re-run the gate.
