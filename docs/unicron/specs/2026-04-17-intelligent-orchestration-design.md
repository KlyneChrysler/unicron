# Intelligent Orchestration Design
_Generated: 2026-04-17 | Status: Draft_

---

## 1. Goal

Replace the CTO's static pattern-matching table with task-content reasoning and memory-informed team assembly, and give the dispatcher failure classification, retry routing, and dynamic agent injection — making orchestration decisions responsive to what's actually in the task and what agents actually produce.

---

## 2. Current State

| Component | Problem |
|-----------|---------|
| `agents/cto.md` | Static decision table — only one pattern fires per condition; multi-domain tasks get incomplete teams |
| `skills/dispatcher/SKILL.md` | Re-dispatches failed agents without classifying why they failed; no dynamic injection |

---

## 3. Approach

**Split: CTO owns reasoning, dispatcher owns execution.**

- CTO agent defines *what* to do and *why*: two-pass team assembly (content analysis + memory adjustment), failure classification taxonomy, injection trigger definitions
- Dispatcher skill handles *how*: execution loop, applies failure classification, executes injection, routes retries

---

## 4. CTO Agent Changes

### 4.1 Two-Pass Team Assembly

Replace the static decision table with a two-pass process run before each task dispatch.

**Pass 1 — Content analysis**

Read the task's title, description, acceptance criteria, and file list. Apply all matching signals independently:

| Signal in task content | Agent implied |
|------------------------|---------------|
| Auth, login, JWT, session, OAuth, permissions | `security-engineer` |
| Schema, migration, model, table, index, query | `database-admin` |
| UI, component, page, form, layout, CSS | `ux-designer` → `frontend-dev` |
| API endpoint, route, REST, GraphQL, webhook | `backend-dev` + `security-engineer` |
| Docker, CI, deployment, pipeline, infra, env | `devops-sre` |
| First task in a phase, or architecture pattern change | `solutions-architect` |
| Any completed task | `code-reviewer` (always last) |

Multiple signals fire independently. A task with both auth and schema signals gets both `security-engineer` and `database-admin`, regardless of what the plan's `Agents:` field says.

The plan's `Agents:` field is a suggestion, not a constraint.

**Pass 2 — Memory adjustment**

After assembling the team from Pass 1, query memory for outcomes tagged to the same domain:
- Past outcome shows agent X failed on a similar task → add a review agent after X; note the prior failure in X's context block
- Past outcome shows agent combo Y+Z conflicted → reorder or separate them

The adjusted team is dispatched. Memory adjustments are logged in the task report.

### 4.2 Updated Dispatch Decision Framework

Remove the static table. Replace with:

> "Before dispatching any task: read the task content, apply all matching signals from the content analysis table, query memory for domain-relevant outcomes, adjust the team accordingly. The plan's agent list is a starting point."

### 4.3 Failure Classification Taxonomy

The CTO defines four failure types for the dispatcher to apply:

| Failure type | Signals | Dispatcher response |
|---|---|---|
| **Wrong output** | Doesn't address task; wrong approach; misunderstood requirements | Re-dispatch same agent with explicit correction: quote unmet criterion, state what was wrong, give concrete direction |
| **Incomplete output** | Partially correct but cut off; missing sections; deferred work | Split into completed + remaining subtasks; re-dispatch remaining only |
| **Quality failure** | On-target but bugs, security issues, or failing tests | Re-dispatch with specific failure evidence: test output, error message, reviewer finding |
| **Blocked** | Cannot proceed without missing info, external service, or another task's output | Stop. Surface to user immediately. Do not retry. |

Retry cap: maximum 2 retries per failure type per task. After 2 failed retries: escalate to user as blocked.

### 4.4 Injection Trigger Definitions

The CTO defines the triggers the dispatcher watches for:

| Signal in agent output | Agent injected | Position |
|------------------------|----------------|----------|
| PII, personal data, user credentials, GDPR, HIPAA | `security-engineer` | Immediately after current agent |
| Auth logic, token, session, permission check | `security-engineer` | Immediately after current agent |
| New schema change, migration, index | `database-admin` | Immediately after current agent |
| Performance concern, N+1 query, slow query | `database-admin` | Immediately after current agent |
| "This should be reviewed", "I'm not sure about X" | `code-reviewer` | Immediately after current agent |
| Explicit flag: `[INJECT: <agent-name>]` | Named agent | Immediately after current agent |

Explicit `[INJECT: ...]` flags from agents are hard injections — not optional.

---

## 5. Dispatcher Skill Changes

### 5.1 Step 2 — Team Assembly (updated)

Replace "read registry.yaml, assemble from plan's Agents field" with:

> "Invoke the CTO's two-pass assembly: content analysis → memory adjustment. Display the assembled team with reasoning for any additions beyond the plan's Agents field."

### 5.2 Step 4 — Failure Classification (new)

After each agent output, before checking acceptance criteria:

1. Check acceptance criteria — all met? → mark complete, proceed
2. If unmet: classify the failure (wrong output / incomplete / quality failure / blocked)
3. Apply the response for that failure type
4. Log: failure type, response taken, retry count

### 5.3 Step 4b — Dynamic Injection Scan (new)

After each agent completes successfully (criteria met), scan output for injection triggers before moving to the next agent:

1. Check all trigger signals against agent output
2. If trigger fires: inject the named agent immediately after the current position
3. Announce injection:
```
⚡ Injecting security-engineer — PII detected in backend-dev output (payment data handling)
  Updated team: backend-dev → [security-engineer] → qa-engineer → code-reviewer
```
4. Continue execution with the updated team

### 5.4 Retry Cap Enforcement

Track retry count per agent per task. After 2 failed retries of any type:
```
⛔ Task [ID] escalated — [agent] failed 3 times ([failure type]).
   Resolve before I continue: [specific unmet criterion]
```
Do not retry further. Wait for user resolution.

---

## 6. Files Changed

| File | Change |
|------|--------|
| `agents/cto.md` | Replace static table with two-pass assembly description, add failure classification taxonomy, add injection trigger definitions |
| `skills/dispatcher/SKILL.md` | Update Step 2 (team assembly), add Step 4 failure classification, add Step 4b injection scan, add retry cap enforcement |

---

## 7. Acceptance Criteria

1. A task with both auth and schema signals in its content gets both `security-engineer` and `database-admin` assembled — even if the plan's `Agents:` field only listed one
2. Memory outcomes tagged to the same domain are applied to team assembly — a previously failed agent combo is reordered or noted in context
3. A wrong-output failure is re-dispatched with an explicit correction, not a generic "try again"
4. An incomplete-output failure splits the task and re-dispatches only the remaining portion
5. A blocked failure surfaces to the user immediately with no retry
6. After 2 failed retries of any type, the task is escalated to the user — never silently loops
7. A `[INJECT: security-engineer]` flag in any agent output causes security-engineer to be injected before the next agent runs
8. PII or auth signals in agent output trigger a proactive security-engineer injection without an explicit flag
9. Every injection is announced with the trigger reason and updated team order
10. The plan's `Agents:` field is treated as a suggestion — the CTO can add agents the plan didn't list
