# Adversarial Intelligence Design

**Subsystem:** 3 of 6 — Adversarial Intelligence
**Status:** Approved
**Date:** 2026-04-17

---

## Goal

Add a pre-dispatch adversarial pass to the Unicron dispatch loop. Before agents execute a task, a challenger skill stress-tests the plan: probing for missing acceptance criteria, wrong team composition, unvalidated assumptions, dependency gaps, and uncovered risk surface. Critical findings pause dispatch and surface to the user; warnings are injected as context into the agent team.

---

## Problem

Current Unicron dispatch is "yes-and" — it accepts the task as defined and executes. There is no challenge phase. Teams have been assembled with missing agents (AC-completeness gaps), tasks have executed against unvalidated assumptions (scope drift), and irreversible operations (migrations, auth changes) have proceeded without a rollback strategy being defined. The adversarial pass adds a structured "no, wait" moment before every high-risk dispatch.

---

## Architecture

Four moving parts. The adversarial pass is a pre-dispatch skill, not a team member.

### 1. `skills/adversarial-pass/SKILL.md` (new)

The core skill. Receives task context (title, description, acceptance criteria, assembled mini-team, relevant spec excerpt). Runs all 5 challenge types in sequence. Produces a structured challenge report. If any Critical issues exist, surfaces them to the user and pauses dispatch. Advisory-only reports are logged silently.

### 2. `skills/dispatcher/SKILL.md` (updated)

New **Step 2b** inserted between team assembly and dispatch. On risk signals: calls `adversarial-pass`, handles the report (Critical → pause + user, Warning → inject into agent context, Advisory → silent). Records `challenges_fired` in Step 2b; the value is forwarded to the existing Step 4b `cache-writer` call.

### 3. `skills/cache-writer/SKILL.md` (updated)

One new input field: `challenges_fired` — list of challenge type IDs that fired, or `none`. Written to `hot.md` alongside existing fields. Enables pattern-detector to correlate challenge patterns with agent outcomes over time.

### 4. `skills/unicron/SKILL.md` (updated)

New `/unicron:challenge <task-id>` command for on-demand adversarial pass invocation. Always shows full report including Advisory findings. Never blocks dispatch state — informational only.

---

## The 5 Challenge Types

| ID | Name | Question asked |
|---|---|---|
| `ac-completeness` | AC Completeness | Are there missing edge cases, ambiguous criteria, or criteria that cannot be verified? |
| `team-composition` | Team Composition | Is the assembled team missing critical coverage given the task signals? |
| `scope-assumption` | Scope Assumptions | What is this task taking for granted that has not been stated or validated? |
| `dependency-gap` | Dependency Gaps | Does this task depend on output from a task that has not completed yet? |
| `risk-surface` | Risk Surface | What could go wrong — security, data integrity, performance, rollback — that no agent on the team covers? |

All 5 challenges run on every adversarial-pass invocation regardless of which risk signals triggered it.

### Severity Levels

| Level | Meaning | Dispatcher action |
|---|---|---|
| **Critical** | If unaddressed, task will likely produce wrong or harmful output | Pause dispatch, surface to user |
| **Warning** | Real risk worth noting; doesn't block | Inject into agent context block |
| **Advisory** | Observation that improves quality | Log silently, never shown to user |

---

## Challenge Report Format

```
⚔ Adversarial Pass — Task [ID]: [Title]
================================
[ac-completeness]  Advisory  — AC #2 uses "properly" with no measurable definition
[team-composition] Warning   — database-admin not on team; task creates a new index
[risk-surface]     Critical  — no rollback strategy defined for the migration

⛔ 1 Critical issue. Resolve before dispatching:
   → risk-surface: no rollback strategy defined for the migration
   Dismiss? (yes to proceed / no to address first)
```

If no issues are found:
```
⚔ Adversarial Pass — Task [ID]: [Title]
================================
✓ No issues found.
```

Advisory-only reports are never shown to the user. The dispatcher proceeds silently and logs `challenges_fired` to cache.

---

## Risk Signals (Auto-Trigger Conditions)

The adversarial pass runs automatically when any of these are present:

| Signal | Reason |
|---|---|
| First task in a phase | High uncertainty; assumptions haven't been validated yet |
| Team includes `security-engineer`, `database-admin`, or `devops-sre` | Irreversible or high-impact operations |
| Task has > 3 acceptance criteria | Complexity increases blind spot risk |
| Task description contains: `migrate`, `delete`, `overwrite`, `replace`, `auth`, `payment` | Destructive or sensitive operations |
| Task has no `depends_on` but references outputs of other tasks in its description | Dependency gap risk |

If none of these signals fire and `/unicron:challenge` was not invoked: Step 2b is skipped entirely. `challenges_fired: none` is written to cache.

---

## Dispatcher Step 2b

Inserted between Step 2 (team assembly) and Step 3 (agent dispatch):

```
Step 2b: Adversarial Pass (conditional)

If risk signals present OR manually invoked via /unicron:challenge:
  → Call adversarial-pass with:
      - task_id, title, description, acceptance criteria
      - assembled mini-team (from Step 2)
      - relevant spec excerpt (from docs/unicron/spec.md)
  → Receive challenge report

  If report contains Critical issues:
    → Display full challenge report to user
    → Pause: "⛔ Task [ID] — [N] Critical issue(s). Resolve before I dispatch."
    → Wait for user response:
        - User addresses issue → update task/AC/team, re-run adversarial-pass (once)
        - User dismisses → proceed, note dismissal in dispatch context

  If report contains only Warnings/Advisory:
    → Do NOT display to user
    → Append warning summary to UNICRON 任务上下文 block passed to agents:
        对抗性检查警告：
          - [challenge-id] [finding]
    → Proceed to Step 3

  Record challenges_fired: [list of fired challenge IDs] — passed to the existing Step 4b cache-writer call

If no risk signals and not manually invoked:
  → Proceed directly to Step 3
  → Step 4b cache-writer call uses challenges_fired: none
```

**Re-run limit:** The adversarial pass re-runs at most once after user action. If Critical issues persist after re-run, the dispatcher escalates to the user with a full block: the task cannot proceed until the plan is updated.

---

## `/unicron:challenge` Command

**Invocation:** `/unicron:challenge <task-id>`

**Behavior:**
1. Read `docs/unicron/plan.md` — find task matching `<task-id>`
2. Read `docs/unicron/spec.md` — extract relevant section as context
3. Call `adversarial-pass` with full task context; if team has already been assembled, include it — otherwise pass `team: not yet assembled`
4. Display the full challenge report including Advisory findings (unlike auto-invocation, which suppresses Advisory-only)
5. Do not modify dispatch state — purely informational

**If task-id not found:**
Output: `未找到任务：[task-id]。请检查 docs/unicron/plan.md 中的任务 ID。`

---

## `challenges_fired` Field in `cache-writer`

New 8th input field added to the cache-writer spec:

```
challenges_fired: [ac-completeness, risk-surface] | none
```

Written to `hot.md` entry alongside existing 7 fields. Set to `none` on:
- The failure/retry path (Step 4) — adversarial pass does not re-run on retries
- Any task where no risk signals fired and `/unicron:challenge` was not invoked

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Adversarial pass invoked on a task with no acceptance criteria | `ac-completeness` fires Critical: "Task has no acceptance criteria — cannot verify completion" |
| User dismisses a Critical issue | Proceed; note dismissal as `dismissed: true` in dispatch context block; log in cache |
| Adversarial pass re-runs after user action and still finds Critical issues | Full block: "Task [ID] still has unresolved Critical issues after correction. Update the plan before proceeding." No further re-runs. |
| `/unicron:challenge` called during active dispatch | Report is informational only; does not interrupt or modify the running dispatch |
| All 5 challenges produce no findings | Report shows "✓ No issues found." and dispatcher proceeds silently |

---

## Files Changed

| File | Change |
|---|---|
| `skills/adversarial-pass/SKILL.md` | Create — core adversarial challenge skill |
| `skills/dispatcher/SKILL.md` | Add Step 2b (adversarial pass conditional); add `challenges_fired` to cache-writer call |
| `skills/cache-writer/SKILL.md` | Add `challenges_fired` as 8th input field |
| `skills/unicron/SKILL.md` | Add `/unicron:challenge <task-id>` command |

---

## Acceptance Criteria

1. `adversarial-pass` skill exists with all 5 challenge types documented
2. Each challenge type has a defined severity level and dispatcher action
3. Challenge report format matches the specified template (⚔ header, per-finding rows, ⛔ Critical block)
4. All 5 risk signals documented in dispatcher Step 2b
5. Step 2b is positioned between Step 2 (team assembly) and Step 3 (dispatch) in dispatcher
6. Critical findings pause dispatch and display to user
7. Warning findings are injected into agent context block, not shown to user
8. Advisory findings are logged silently, never shown to user
9. Re-run limit: adversarial pass re-runs at most once after user action
10. Full block triggers if Critical issues persist after re-run
11. `cache-writer` accepts `challenges_fired` as 8th input field
12. `challenges_fired: none` written on failure/retry path and when no signals fired
13. `/unicron:challenge <task-id>` command added to `skills/unicron/SKILL.md`
14. On-demand invocation always shows full report including Advisory findings
15. On-demand invocation never modifies dispatch state
