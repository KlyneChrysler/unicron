# Unicron Cross-session Memory System
_Generated: 2026-04-17 | Status: Draft_

---

## 1. Goal

Give Unicron persistent memory across sessions so it remembers project decisions, agent outcomes, and user preferences — making every subsequent session smarter than the last.

---

## 2. Memory Scopes

Two scopes, same file format:

| Scope | Location | What it stores |
|-------|----------|---------------|
| **Global** | `~/.unicron/memory/` | User preferences that apply across all projects |
| **Per-project** | `<project>/.unicron/memory/` | Decisions and agent outcomes specific to this codebase |

---

## 3. Memory Structure

```
~/.unicron/memory/
  MEMORY.md                        ← one-line index of all global entries
  preferences/
    verbosity.md
    approval-gates.md
    <topic>.md

<project>/.unicron/memory/
  MEMORY.md                        ← one-line index of all project entries
  decisions/
    tech-stack.md
    architecture.md
    <topic>.md
  outcomes/
    agent-qa-engineer-2026-04-17.md
    <agent>-<date>.md
```

### Entry file format

Each memory file uses typed frontmatter:

```markdown
---
type: decision | outcome | preference
scope: global | project
agent: <name>          # outcomes only — omit for decisions and preferences
confidence: high | medium | low
date: YYYY-MM-DD
tags: string[]             # e.g. [tech-stack, database, auth] — used for relevance filtering
---

<human-readable body describing the memory>
```

### MEMORY.md index format

One line per entry, under 150 characters:

```
- [Title](relative/path.md) — one-line hook describing what this memory contains
```

Agents load the index first, then fetch only the files relevant to their current task. Memory that isn't relevant is never loaded.

---

## 4. Memory Types

| Type | Scope | Written when | Example |
|------|-------|-------------|---------|
| **decision** | per-project | Spec approved, explicit user choice | "Chose PostgreSQL + Prisma over MongoDB" |
| **outcome** | per-project | Agent completes task, phase gate passes | "QA engineer missed edge cases on auth flow — required fix" |
| **preference** | global | User expresses a working preference during investigation | "User prefers minimal approval gates" |

---

## 5. Write Triggers

### Automatic

| Event | What gets written | Where |
|-------|------------------|-------|
| Spec approved | Tech stack, architecture pattern, key constraints | `.unicron/memory/decisions/` |
| Phase gate passed | Which agents ran, what they produced, any issues | `.unicron/memory/outcomes/` |
| Agent completes task | Approach used, acceptance criteria met/missed | `.unicron/memory/outcomes/` |
| Investigation answer contains expressed preference | User preference detected | `~/.unicron/memory/preferences/` |

### Manual

`/unicron:remember <note>` — Unicron classifies the input (decision / outcome / preference), picks the correct scope (global vs project), writes the entry, updates the relevant MEMORY.md index, and confirms:

> "Saved to `.unicron/memory/decisions/auth-approach.md`"

### Forgetting

`/unicron:forget <topic>` — Unicron searches both MEMORY.md indexes for matching entries, shows what it found, asks for confirmation, then deletes the files and removes the index entries.

---

## 6. Read & Surface Behavior

At the start of every session, Unicron loads both MEMORY.md indexes. When a relevant memory exists, surfacing behavior depends on type:

| Memory type | Behavior | Example |
|-------------|----------|---------|
| **Preference** (clear, low-stakes) | Silent — applies automatically | Skips extra confirmation prompts because user prefers minimal gates |
| **Decision** (architecture, tech stack) | Explicit — surfaces and asks for confirmation | "Last time you chose PostgreSQL + Prisma — apply the same here?" |
| **Outcome** (agent performance) | Silent — informs CTO dispatch weighting | Avoids agent combos that failed on similar tasks |
| **Contradicts current context** | Explicit — flags the conflict | "Your memory says no mobile, but the spec mentions iOS — which is right?" |

The CTO reads both indexes, extracts only entries tagged relevant to the current phase and task, and passes those in the agent context block alongside the spec and plan. Irrelevant memory is never loaded into context.

---

## 7. New Commands

| Command | Behavior |
|---------|---------|
| `/unicron:remember <note>` | Manual memory write — Unicron classifies, scopes, and saves |
| `/unicron:forget <topic>` | Find + confirm + delete matching entries from both scopes |
| `/unicron:memory` | Show all current memory entries for this project + global profile |

---

## 8. Implementation — Files Changed

### New skill files

| File | Purpose |
|------|---------|
| `skills/memory-writer/SKILL.md` | Classifies input, picks scope, writes entry, updates MEMORY.md index |
| `skills/memory-reader/SKILL.md` | Loads both indexes, filters by relevance, decides silent vs explicit surfacing |

### Updated skill files

| File | Change |
|------|--------|
| `skills/unicron/SKILL.md` | On session start, invoke memory-reader before anything else |
| `skills/investigate/SKILL.md` | After each answer, check for expressed preference — invoke memory-writer if detected |
| `skills/spec-writer/SKILL.md` | On spec approval, invoke memory-writer for tech stack + architecture decisions |
| `skills/dispatcher/SKILL.md` | Pass relevant memory entries in agent context block; invoke memory-writer after each task completes |
| `skills/gate-checker/SKILL.md` | On phase gate pass, invoke memory-writer with agent outcomes |

### Registry additions

Two new entries in `registry.yaml`:
- `memory-writer` — triggered on spec approval, task completion, phase gate, investigation answers
- `memory-reader` — triggered at session start, before any agent dispatch

---

## 9. Acceptance Criteria

1. Running `/unicron` on a project with existing memory loads both MEMORY.md indexes and surfaces a relevant decision before the first question.
2. Approving a spec writes at least one decision entry to `.unicron/memory/decisions/` and updates MEMORY.md.
3. `/unicron:remember "always use Tailwind"` creates a preference entry in `~/.unicron/memory/preferences/` and confirms the path.
4. `/unicron:forget tech-stack` shows matched entries, waits for confirmation, then removes files and index lines.
5. `/unicron:memory` prints a formatted list of all project + global memory entries with their types.
6. An agent outcome from a failed QA task silently affects CTO dispatch on the next similar task (no re-dispatch of the same failing combo).
7. A memory entry that contradicts the current spec triggers an explicit conflict flag, not silent override.
8. Adding memory to a project does not affect any other project's `.unicron/memory/`.

---

## 10. Out of Scope (v1 memory)

- Memory search / semantic retrieval (entries are loaded by relevance tag, not vector similarity)
- Memory expiry / TTL (entries persist until explicitly forgotten)
- Team-shared global memory (global scope is per-user machine only)
- Memory export / import between machines
