---
name: planner
description: "Reads the approved spec and decomposes it into a phased implementation plan with tasks, agent assignments, dependencies, and acceptance criteria. Gets user approval before dispatching."
---

# Unicron Planner

Read `docs/unicron/spec.md`. Decompose it into a phased implementation plan.

## Output File

Write to: `docs/unicron/plan.md`

## Decomposition Rules

| Rule | Detail |
|---|---|
| **Max task size** | One task fits in a single agent context window (~2000 lines of code max) |
| **Vertical slices** | Each task delivers a working, testable slice — not a horizontal layer |
| **Dependencies explicit** | Every task declares `depends_on: [task-id, ...]` |
| **Acceptance criteria** | Every task has ≥ 1 concrete, checkable done condition |
| **Agent assignment** | Every task names the specialist(s) from the registry |

## Phase Structure

Organize tasks into phases. Every project has at minimum:

- **Phase 1: Foundation** — scaffolding, database, CI, auth skeleton
- **Phase 2: Core Features** — the main functional requirements
- **Phase 3: Integration & Polish** — third-party integrations, UX refinement
- **Phase 4: Hardening** — security review, performance, test coverage, docs

## Plan Format

```markdown
# [Project Name] — Implementation Plan
_Spec: docs/unicron/spec.md | Generated: YYYY-MM-DD | Status: Active_

## Phase 1: Foundation

### Task 1.1 — [Title]
**Agents:** [agent names from registry]
**Depends on:** none
**Description:** [what this delivers]
**Steps:**
- [ ] [specific step]
**Acceptance criteria:**
- [ ] [testable condition]

## Phase 1 Gate
- [ ] All Phase 1 tasks complete
- [ ] Tests passing (`[test command]`)
- [ ] code-reviewer signed off
- [ ] security-engineer signed off (if auth/data in phase)
```

## Agent Selection Guide

| Task type | Agents to assign |
|---|---|
| New UI screen | ux-designer → frontend-dev → qa-engineer |
| New API endpoint | backend-dev + security-engineer → qa-engineer |
| Database schema | database-admin → backend-dev |
| Auth system | solutions-architect → backend-dev + security-engineer → qa-engineer |
| Deployment pipeline | devops-sre → security-engineer |
| New documentation | technical-writer |
| Any completed feature | code-reviewer (always last) |

## Review Gate

After writing the plan, say:

> "Plan written to `docs/unicron/plan.md`. Please review:
> - Are the phases in the right order?
> - Is any task too large (should be split)?
> - Are the agent assignments correct?
>
> Reply with changes, or say 'approved' to begin building."

On approval:
1. Commit: `git add docs/unicron/plan.md && git commit -m "add: unicron implementation plan"`
2. Invoke the `dispatcher` skill.
