# Registry Intelligence Design

**Subsystem:** 1 of 6 — Registry Intelligence
**Status:** Approved
**Date:** 2026-04-17

---

## Goal

Make `registry.yaml` the authoritative source of truth for CTO team assembly. Replace the static inline signal table with a live registry lookup, reducing duplication and ensuring agent capability changes propagate automatically to dispatch decisions.

---

## Problem

`agents/cto.md` contains a static signal table (~20 rows) that maps task signals to agents. `registry.yaml` already defines the same information via `triggers` and `works_with` per agent — but the CTO never reads it. The two sources drift independently. Adding or updating an agent requires editing both files, and there is no guarantee they stay in sync.

---

## Architecture

Three moving parts. No schema changes to `registry.yaml` — `triggers` and `works_with` already carry everything needed.

### 1. `registry-reader` skill (new)

A read-only skill called by the CTO at the start of Pass 1. Receives a list of task signals, reads `registry.yaml`, and returns a resolved team with parallel groupings. Never calls other skills. Never auto-adds agents not triggered by the task.

### 2. `agents/cto.md` Pass 1 algorithm (updated)

Pass 1 changes from "consult inline signal table" to:
1. Call `registry-reader` with detected signals
2. Receive base team
3. Apply signal table as override layer (force-pair, force-sequence, suppress)

The signal table shrinks from ~20 rows to ~6 override entries covering pairings that registry trigger matching alone cannot express.

### 3. `/unicron:registry` command (new)

Added to `skills/unicron/SKILL.md`. Reads `registry.yaml` and prints a formatted table of all agents with their triggers, capabilities, and `works_with` groupings. Supports optional single-agent filter: `/unicron:registry backend-dev`.

---

## Pass 1 Resolution Algorithm

**Step 1 — Signal extraction** (unchanged)
CTO reads task title, description, acceptance criteria, and file list. Identifies signals.

**Step 2 — Registry lookup**
Call `registry-reader` with detected signals. An agent is included if `triggers` ∩ `signals` is non-empty. Record which triggers fired for each matched agent.

**Step 3 — Parallel expansion**
For each included agent, check `works_with`. If the listed partner is also in the matched set, mark both parallel. Partners not in the matched set are ignored — never auto-included.

**Step 4 — Signal table override**
Apply override entries:

| Signal | Override | Reason |
|---|---|---|
| `api-endpoint` | Force-pair `backend-dev` + `security-engineer` | Always together, not independently triggered |
| `pii-data` | Force-inject `security-engineer` immediately | Ordering constraint, not just inclusion |
| `new-schema` | Force-pair `database-admin` + `backend-dev` | Schema work needs both |
| `pre-release` | Force-add `code-reviewer` last | Even if registry doesn't match |
| `unclear-requirements` | Force-add `product-analyst` first | Before any implementers |

**Step 5 — Output**
Final ordered team with parallel markers, passed to the dispatch report.

---

## `registry-reader` Skill Specification

**Input**
```
signals: [signal1, signal2, ...]
```

**Output**
```
已匹配 Agents：
  - backend-dev       触发：[api-feature, integration]     并行：security-engineer
  - security-engineer 触发：[api-design]                   并行：backend-dev
  - database-admin    触发：[new-model]                    顺序：在 backend-dev 之后
  - qa-engineer       触发：[any-feature]                  顺序：在 backend-dev 之后
  - code-reviewer     触发：[post-implementation]          顺序：最后

未匹配信号：[signals that hit no agent triggers]
```

**Ordering heuristic**
- `code-reviewer` always last
- `qa-engineer` after implementers
- `solutions-architect` before implementers
- Everything else: natural registry match order

**Exclusions**
`cto`, `memory-writer`, `memory-reader` are always excluded from output — they are orchestration infrastructure, not dispatch candidates.

**Error behavior**
If `registry.yaml` is missing or unreadable: return a hard error block. Do not return empty. CTO falls back to signal table and logs a warning in the dispatch report.

---

## Signal Table Evolution

Before: ~20 rows, full dispatch logic inline in `agents/cto.md`.
After: ~5 override rows, nuanced pairings only. All other rows retire — registry handles them.

Long-term: as `registry.yaml` trigger granularity increases, override rows retire one by one. The signal table may eventually be eliminated entirely.

---

## `/unicron:registry` Command

**Invocation:** `/unicron:registry [agent-name?]`

**Behavior:**
- No argument: print full registry table (all agents, triggers, capabilities, works_with)
- With argument: print single agent entry

**Output format:**
```
Registry — 15 agents

backend-dev
  Description: APIs, business logic, services, middleware, integrations.
  Capabilities: api, business-logic, services, middleware, integrations, caching, queues
  Triggers: api-feature, service, backend-bug, integration, data-processing
  Works with: solutions-architect, database-admin, security-engineer, frontend-dev
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Signal matches no agent triggers | Listed in `未匹配信号`; CTO checks signal table override; if still no match, team assembles without that coverage, gap noted in dispatch report |
| `registry.yaml` missing | Hard error from `registry-reader`; CTO falls back entirely to signal table; warning logged in dispatch report |
| `works_with` partner not in matched set | Silently ignored — partner not auto-included |
| Circular `works_with` (A↔B↔A) | Treated as parallel group — no infinite loop |
| Agent in registry but no `triggers` field | Agent never matched by registry; only reachable via signal table override |

---

## Files Changed

| File | Change |
|---|---|
| `skills/registry-reader/SKILL.md` | Create — read-only registry lookup skill |
| `agents/cto.md` | Update Pass 1 algorithm; shrink signal table to override-only |
| `skills/unicron/SKILL.md` | Add `/unicron:registry` command |

---

## Acceptance Criteria

1. `registry-reader` reads `registry.yaml` and returns a correctly matched team for a given signal list
2. Parallel groupings derived from `works_with` are correctly marked in output
3. `cto`, `memory-writer`, `memory-reader` never appear in `registry-reader` output
4. CTO Pass 1 calls `registry-reader` before consulting signal table
5. Signal table overrides take precedence over registry matches
6. Force-pair overrides produce both agents in the correct order
7. Missing `registry.yaml` produces a hard error from `registry-reader`, not silent empty output
8. CTO falls back to signal table when registry is unavailable
9. `/unicron:registry` with no argument prints all 15 registry entries
10. `/unicron:registry <agent-name>` prints that agent's entry only
11. `未匹配信号` block lists any signals that hit no registry triggers
12. Signal table shrinks to ≤6 override entries after implementation
