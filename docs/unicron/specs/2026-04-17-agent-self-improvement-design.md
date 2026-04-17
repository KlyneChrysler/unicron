# Agent Self-Improvement Design
_Generated: 2026-04-17 | Status: Draft_

---

## 1. Goal

Add a two-component learning layer to Unicron: an always-on hot cache that captures granular per-agent signals during a session, and a dedicated pattern detector that reads the cache at phase gates, surfaces typed patterns, proposes concrete improvements to agent files, and promotes entries to persistent memory.

---

## 2. Current State

| Component | Gap |
|-----------|-----|
| `memory-writer` | Writes per-task outcomes — too coarse to detect per-agent patterns |
| `memory-reader` | Reads historical outcomes at dispatch time — no session-level accumulation |
| `gate-checker` | Runs gate checks — calls no analysis skills |
| `dispatcher` | Calls `memory-writer` at task completion — no per-agent write |

The existing memory loop is read-only at dispatch time. Per-agent signals (failure type, retry count, injections fired, signals matched) are never recorded. Patterns that span multiple tasks within a session are invisible.

---

## 3. Approach

**Two new dedicated skills. No agent files changed.**

- `cache-writer` — write-only hot cache appender, called by dispatcher after each agent completion
- `pattern-detector` — reads hot cache + historical outcomes, detects patterns, proposes agent file patches, promotes entries to persistent memory

Existing skills with minimal additions:
- `dispatcher` — one new call to `cache-writer` at the end of Step 4b
- `gate-checker` — one new call to `pattern-detector` before its gate check

---

## 4. Architecture

```
dispatcher
  └─ [after each agent] → cache-writer → .unicron/cache/hot.md
                                          (append-only, per-agent entries)

gate-checker
  └─ [at each phase gate] → pattern-detector
                              ├─ reads .unicron/cache/hot.md
                              ├─ reads .unicron/memory/outcomes/
                              ├─ detects patterns (failure / routing / quality)
                              ├─ presents improvement suggestions one at a time
                              └─ promotes hot entries → memory-writer → outcomes/
                                 then clears hot.md to header
```

**Hot cache file**: `.unicron/cache/hot.md` — append-only markdown. Phase-scoped: cleared after each gate promotion. More granular than `memory-writer` (per-agent, not per-task).

---

## 5. cache-writer Skill

**File:** `skills/cache-writer/SKILL.md`

**Called by:** `dispatcher` after each agent completion (success or failure)

**Job:** append one structured entry to `.unicron/cache/hot.md`. Write-only — never reads, never analyzes.

### Entry format

```markdown
## [agent-name] — [task-id] — [YYYY-MM-DD HH:MM]
- outcome: success | failure | retry
- failure_type: wrong_output | incomplete | quality | blocked | —
- retry_count: N
- signals_matched: [signal1, signal2, …]
- injections_fired: [agent-name, …] | none
- notes: [one sentence from agent output, or "—"]
```

`signals_matched` comes from the CTO's Pass 1 content analysis for the current task. `injections_fired` comes from Step 4b of the dispatcher.

### Initialization

If `.unicron/cache/` does not exist, create it (`mkdir -p`). If `hot.md` does not exist, create with header:

```markdown
# Unicron Hot Cache
_Session started: YYYY-MM-DD_
```

### Rules

- Never overwrite existing entries — append only
- Never call `memory-writer` — that is pattern-detector's job
- If the cache file is unwritable, log a warning and exit silently — do not block the dispatcher

---

## 6. pattern-detector Skill

**File:** `skills/pattern-detector/SKILL.md`

**Called by:** `gate-checker` at each phase boundary, before the gate check runs

**Job:** detect patterns across hot cache + historical outcomes, report with improvement suggestions, promote entries, clear hot cache.

### Stage 1 — Detection

Read all entries in `.unicron/cache/hot.md` and relevant files in `.unicron/memory/outcomes/`. Group by pattern type:

| Pattern type | Detection rule |
|---|---|
| `failure_pattern` | Same agent, same `failure_type`, ≥ 2 occurrences within the current phase |
| `routing_pattern` | Same agent injected (via Step 4b) ≥ 2 times on tasks sharing a common signal |
| `quality_pattern` | `retry_count > 0` for same agent across ≥ 2 tasks in the current phase |

Minimum threshold: 2 occurrences. Single incidents are noise and are not reported.

### Stage 2 — Report

Present the pattern report before the gate check:

```
🧠 Pattern Report — Phase N Gate
================================
[failure_pattern] qa-engineer × 2 quality failures on mobile tasks
  → Suggested fix: add "mobile testing checklist" note to agents/qa-engineer.md
  → Apply? (yes / skip / show diff)

[routing_pattern] security-engineer injected after backend-dev × 3
  → Suggested fix: promote backend-dev + security-engineer pairing for
    api-endpoint signal in agents/cto.md content analysis table
  → Apply? (yes / skip / show diff)
```

Rules for the report:
- Present one suggestion at a time — never batch multiple approvals
- "Show diff" displays the exact line change before the user decides
- Approved patches are applied to the agent `.md` file and committed immediately:
  `git add <file> && git commit -m "improve: <agent-name> — <one-line reason>"`
- Skipped patterns are written to `.unicron/memory/outcomes/` via `memory-writer` with a `dismissed: true` note in the content — so they survive the hot.md clear and are not re-surfaced at the next gate unless the pattern count grows
- Never auto-apply patches without explicit user approval

### Stage 3 — Promotion

After the report:
1. For each `success` and `failure` entry in `hot.md` not yet promoted, call `memory-writer` with:
   - `content`: `"[agent] completed/failed [task]. Signals: [signals_matched]. Outcome: [outcome]. Notes: [notes]."`
   - `event`: `task-complete`
   - `context`: `{ agent: "<agent>", phase: "<phase>", tags: ["<signals_matched>"] }`
2. Truncate `hot.md` back to its header line only
3. Return control to `gate-checker` to run its normal gate checks

### Rules

- If `hot.md` is missing or empty: skip detection and promotion silently, proceed to gate check
- If no patterns meet the threshold: print `🧠 No patterns detected this phase.` and proceed
- Never block the gate check — pattern detection is advisory, not a gate condition

---

## 7. Integration Changes

### dispatcher — Step 4b addition

At the end of Step 4b (after injection scan, before moving to next agent), add:

> "调用 `cache-writer`，传入当前 Agent 名称、任务 ID、outcome、failure_type（如有）、retry_count、signals_matched（来自第一阶段）、injections_fired（来自步骤 4b）。"

### gate-checker — pre-gate addition

Before running gate checks, add:

> "调用 `pattern-detector`，传入当前阶段编号。等待其完成（报告 + 晋升）后再运行关卡检查。"

---

## 8. Files Changed

| File | Change |
|------|--------|
| `skills/cache-writer/SKILL.md` | Create — hot cache write skill |
| `skills/pattern-detector/SKILL.md` | Create — pattern detection, reporting, promotion skill |
| `skills/dispatcher/SKILL.md` | Add `cache-writer` call at end of Step 4b |
| `skills/gate-checker/SKILL.md` | Add `pattern-detector` call before gate checks |

---

## 9. Acceptance Criteria

1. After each agent completion (success or failure), a structured entry appears in `.unicron/cache/hot.md` containing agent name, task id, outcome, failure_type, retry_count, signals_matched, and injections_fired
2. If `.unicron/cache/` does not exist, `cache-writer` creates it without error
3. `hot.md` is append-only — existing entries are never modified or overwritten
4. A failure_pattern is detected when the same agent produces the same failure_type on ≥ 2 tasks within a phase
5. A routing_pattern is detected when the same agent is injected ≥ 2 times on tasks sharing a common signal
6. A quality_pattern is detected when the same agent has retry_count > 0 on ≥ 2 tasks in a phase
7. Pattern report presents one suggestion at a time with "yes / skip / show diff" options
8. "Show diff" displays the exact line change before approval
9. Approved patches are applied to the agent `.md` file and committed with a structured commit message
10. Skipped patterns are written to `outcomes/` via `memory-writer` with a `dismissed: true` note — they survive the hot.md clear and are not re-surfaced unless the pattern count grows
11. After the report, all non-promoted entries in `hot.md` are promoted to `outcomes/` via `memory-writer`
12. `hot.md` is cleared to its header after promotion
13. If `hot.md` is missing or empty at gate time, `pattern-detector` exits silently without blocking the gate
14. Pattern detection is advisory — it never blocks the gate check
15. `gate-checker` calls `pattern-detector` before running its normal gate checks
