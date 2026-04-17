# Living Spec Design

**Subsystem:** 2 of 6 — Living Spec
**Status:** Approved
**Date:** 2026-04-17

---

## Goal

Make the spec a living document that evolves safely during execution. When implementation reveals gaps, contradictions, outdated requirements, or ambiguities, a structured revision flow surfaces the finding, proposes a targeted diff, gets user approval, updates the spec, and flags downstream plan tasks affected by the change.

---

## Problem

The spec is currently write-once and treated as immutable. In practice, implementation always reveals things the spec didn't anticipate: a required capability with no spec section, a constraint that turns out to be impossible, a requirement that was valid at planning time but has since changed. Today these discoveries are either silently absorbed into agent output or escalated as blockers — neither path updates the spec. The result is spec drift: the code diverges from the stated requirements, and the spec stops being the source of truth.

---

## Architecture

Four moving parts.

### 1. `skills/spec-revisor/SKILL.md` (new)

Core revision skill. Receives a gap description, its source (agent, gate-checker, or user), optional task context, and current spec content. Classifies the gap, proposes a targeted diff, surfaces it to the user, applies on approval, then flags affected downstream tasks in `plan.md`.

### 2. `skills/dispatcher/SKILL.md` (updated)

Step 4b injection scan gains a `[SPEC_GAP: <description>]` trigger that routes to `spec-revisor`. Hard trigger — not optional. Processed before any `[INJECT: ...]` tags in the same output.

### 3. `skills/gate-checker/SKILL.md` (updated)

New spec health check added after `pattern-detector` completes and before the existing gate checklist. Checks completed task ACs against the spec for drift. Calls `spec-revisor` for each gap found. Advisory — dismissed revisions do not block gate advancement.

### 4. `skills/unicron/SKILL.md` (updated)

New `/unicron:revise-spec <description>` command for user-initiated revision at any time.

---

## `spec-revisor` Skill

### Inputs

```
source:          agent | gate-checker | user
gap_description: <free-text description of the gap or contradiction>
task_context:    <task ID, title, relevant AC — omit if source is user>
spec_content:    <full contents of docs/unicron/spec.md>
```

### Step 1 — Classify Gap Type

| Type | Description | Example |
|---|---|---|
| `gap` | Spec is silent on something implementation requires | Task needs rate-limiting but spec has no rate-limiting section |
| `contradiction` | Spec says X but implementation reveals X is wrong or impossible | Spec says "stateless API" but session storage is required |
| `outdated` | Spec requirement was valid when written but circumstances changed | Spec references v1 schema; task creates v2 schema |
| `ambiguity` | Spec is interpretable two valid ways; implementation chose one | "Support multi-tenancy" — per-row or per-schema? |

If the referenced spec section does not exist: classify as `gap`, propose adding a new section.

### Step 2 — Propose Targeted Diff

Show only the changed lines in context:

```
📋 规格说明修订提案
来源：[agent名称 / gate-checker / 用户] — 任务 [ID]
类型：[gap / contradiction / outdated / ambiguity]

修改章节：## [N]. [Section name]

- [原文，若为新增则省略此行]
+ [新文]

原因：[一句话说明为何需要此修改]
批准？（yes 应用 / no 跳过 / edit 手动修改）
```

### Step 3 — Handle User Response

| Response | Action |
|---|---|
| `yes` | Apply diff to `docs/unicron/spec.md`, proceed to Step 4 |
| `no` | Call `memory-writer` with `event: spec-revision-dismissed`, content: "dismissed: true. 已跳过修订：[类型] — [gap_description]，来源：[source]。" Return to caller. |
| `edit` | Display full current spec section. Wait for user to provide revised text. Apply it. Proceed to Step 4. |

### Step 4 — Flag Affected Tasks

Scan `docs/unicron/plan.md` for tasks that:
- Are not yet marked complete (`- [ ]` checkboxes remain)
- Reference the revised spec section by number (e.g., `## 5.`) or by keyword match with the revised content

For each matched task, prepend to its description block:
```
⚠ 规格说明已修订（[YYYY-MM-DD]）：[一句话说明变更] — 在调度前与用户确认。
```

If `source: user`, scan the full plan (all incomplete tasks). If `source: agent` or `gate-checker`, scan only tasks downstream of the triggering task.

Report to caller: "已修订规格说明第 [N] 节。标记了 [M] 个受影响任务。"

---

## Dispatcher `[SPEC_GAP: ...]` Trigger

New row added to the Step 4b injection scan table:

| Agent output signal | Routed to | Position |
|---|---|---|
| `[SPEC_GAP: <description>]` | `spec-revisor` | Immediately after current agent, before next agent |

**Processing rules:**
- Hard trigger — not optional, same as `[INJECT: ...]`
- When `[SPEC_GAP: ...]` and `[INJECT: ...]` both appear in the same output: `[SPEC_GAP: ...]` is processed first (spec must be stable before injecting new agents)
- Only active on the success path (Step 4b) — ignored on failure/retry path (Step 4)
- Multiple `[SPEC_GAP: ...]` tags in one output: each processed separately and sequentially

---

## Gate-Checker Spec Health Check

Added as a pre-gate check, running after `pattern-detector` completes and before the existing gate checklist:

1. Read `docs/unicron/spec.md`
2. For each completed task in the current phase, collect its acceptance criteria
3. Check each AC for references to capabilities, entities, or constraints not present anywhere in the spec
4. If gaps found: call `spec-revisor` with `source: gate-checker` for each gap — one at a time, sequential
5. If no gaps: silent pass, continue to gate checklist

**Authority:** Advisory to the gate. A dismissed revision does not block phase advancement. An approved revision does not force re-running the gate — execution continues forward.

---

## `/unicron:revise-spec` Command

**Invocation:** `/unicron:revise-spec <description>`

**Behavior:**
1. Call `spec-revisor` with `source: user`, user's description as `gap_description`, `task_context: none`
2. `spec-revisor` classifies, proposes diff, handles approval
3. Step 4 scans the full plan (all incomplete tasks, not just downstream)

**If invoked with no description:**
Output: `请提供修订说明。用法：/unicron:revise-spec <描述>`

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| `[SPEC_GAP: ...]` in agent output on failure/retry path | Ignored — spec-revisor only runs from Step 4b (success path) |
| Two agents in same task both emit `[SPEC_GAP: ...]` | Each processed sequentially; second proposal shows already-updated spec text |
| Revision approved, 0 affected tasks | Valid — spec updates, report says "0 tasks affected" |
| Revision approved, affected task already in progress | Flag prepended to task description; dispatcher surfaces it before next dispatch of that task |
| Referenced spec section doesn't exist | Classified as `gap`; `spec-revisor` proposes adding a new section |
| Gate-checker finds drift, all revisions dismissed | Gate advances normally |
| `/unicron:revise-spec` with no description | Output: usage message, no spec-revisor invocation |

---

## Files Changed

| File | Change |
|---|---|
| `skills/spec-revisor/SKILL.md` | Create — core revision skill |
| `skills/dispatcher/SKILL.md` | Add `[SPEC_GAP: ...]` row to Step 4b injection scan; processing order rule |
| `skills/gate-checker/SKILL.md` | Add spec health check after pattern-detector, before gate checklist |
| `skills/unicron/SKILL.md` | Add `/unicron:revise-spec <description>` command |

---

## Acceptance Criteria

1. `spec-revisor` skill exists with all 4 steps documented
2. All 4 gap types defined (gap, contradiction, outdated, ambiguity)
3. Revision proposal format matches template (📋 header, diff block, approve/skip/edit)
4. All 3 user responses handled: yes (apply), no (dismiss + memory-writer), edit (manual text + apply)
5. `memory-writer` called on dismissed revision with `event: spec-revision-dismissed`
6. Affected task flagging scans plan.md and prepends ⚠ marker to matched incomplete tasks
7. `source: user` path scans full plan; `source: agent/gate-checker` scans downstream only
8. `[SPEC_GAP: ...]` trigger added to dispatcher Step 4b injection scan table
9. `[SPEC_GAP: ...]` processed before `[INJECT: ...]` when both present in same output
10. `[SPEC_GAP: ...]` explicitly ignored on Step 4 (failure/retry) path
11. Gate-checker spec health check runs after pattern-detector, before gate checklist
12. Gate-checker spec check is advisory — dismissed revisions do not block gate
13. `/unicron:revise-spec <description>` command added to `skills/unicron/SKILL.md`
14. Missing spec section → classified as `gap`, propose new section
15. Multiple `[SPEC_GAP: ...]` tags processed sequentially, not in parallel
