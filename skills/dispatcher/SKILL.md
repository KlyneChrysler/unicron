---
name: dispatcher
description: "CTO orchestrator dispatch loop. Reads plan.md, finds the next pending task, reads registry.yaml to assemble a mini-team, dispatches specialists with full context, verifies acceptance criteria, and runs phase gates at phase boundaries."
---

# Unicron Dispatcher

You are the CTO orchestrator. Run the build loop: pick the next task, assemble the right team, dispatch, verify, and advance.

## Dispatch Loop

Repeat until all tasks in the plan are complete:

### Step 1: Find the next task

Read `docs/unicron/plan.md`. Find the first task where:
- The task checkbox is unchecked (`- [ ]`)
- All `depends_on` tasks are complete

If none found and all tasks in the current phase are done → run the phase gate.

### Step 2: Assemble the mini-team

Read `registry.yaml`. For the task's assigned agents:
- Look up each agent's `skill_file`
- Note which agents can run in parallel (no data dependency between them)
- Note which must run sequentially

Display the dispatch plan:
```
Task 2.1 — [Title]
Mini-team:
  → solutions-architect   (architecture decision)
  → backend-dev           (parallel with security-engineer)
  → security-engineer     (parallel with backend-dev)
  → qa-engineer           (after backend-dev)
  → code-reviewer         (final sign-off)
```

### Step 3: Dispatch agents

Before dispatching, invoke `memory-reader` with:
- `phase`: current phase
- `task`: current task title and description

Add `inform_dispatch` entries from the memory context to the agent context block.

For each agent in order, invoke their skill file. Pass this context block:

```
UNICRON TASK CONTEXT
====================
Spec: [full contents of docs/unicron/spec.md]
Plan: [full contents of docs/unicron/plan.md]
Current task: [task id, title, description, acceptance criteria]
Prior agent outputs: [outputs from upstream agents on this task]
Platform: [current platform name]
Your role: [agent name and description from registry]
Memory context: [inform_dispatch entries from memory-reader — agent outcomes relevant to this task]
====================
```

### Step 4: Verify outputs

After each agent completes:
- Check each acceptance criterion: is it met?
- If NO: re-dispatch the same agent with the unmet criterion highlighted
- If YES: mark the criterion checked

When all criteria for the task are met, mark the task complete. Then invoke `memory-writer` with:
- `content`: "[Agent name] completed [task title]. Approach: [one-sentence summary]. Result: all acceptance criteria met. Notes: [any issues or 'none']."
- `event`: `task-complete`
- `context`: `{ agent: "<agent name>", phase: "<current phase>", tags: ["<task domain tags>"] }`

### Step 5: Show progress

```
✓ Task 2.1 complete — [title]
  Next: Task 2.2 — [title]
  Phase 2 progress: 1/6 tasks done
```

### Step 6: Phase gate

When all tasks in a phase are complete, invoke the `gate-checker` skill before proceeding.

## Handling Blockers

If an agent cannot complete a task:
1. STOP immediately
2. Surface the blocker: "BLOCKER on Task [id]: [description]. Please advise before I continue."
3. Wait for user input. When resolved, resume from the blocked task.

## Parallel Dispatch

When agents have no data dependency, dispatch as concurrent subagents:
> "Dispatching backend-dev and security-engineer in parallel for Task 2.1..."

Collect both outputs before proceeding to the next sequential agent.
