---
name: memory-writer
description: "Classifies and writes persistent memory entries (decisions, outcomes, preferences) to the correct scope. Updates the MEMORY.md index. Called by other skills after key events and by /unicron:remember."
---

# Unicron Memory Writer

Write a persistent memory entry. Called after key events or by the user manually.

## When invoked

- `spec-writer` invokes this after spec approval (decisions)
- `dispatcher` invokes this after each task completes (outcomes)
- `gate-checker` invokes this after a phase gate passes (outcomes)
- `investigate` invokes this when the user expresses a preference
- `/unicron:remember <note>` (manual user write)

## Input

You receive:
- `content`: the information to remember
- `event`: what triggered this — one of: `spec-approved`, `task-complete`, `gate-passed`, `preference-detected`, `manual`
- `context` (optional): project name, phase number, agent name (for outcomes)

## Process

### 1. Classify

Determine the memory type from `content` and `event`:
- `preference` — how the user likes to work (verbosity, tool choices, approval style). Typical events: `preference-detected`, `manual` with personal preference language ("I always", "I prefer", "never use").
- `decision` — an explicit architectural or technical choice. Typical events: `spec-approved`, `manual` with decision language ("chose X", "using Y because").
- `outcome` — what an agent did, what worked, what didn't. Typical events: `task-complete`, `gate-passed`.

### 2. Pick scope

- `preference` → global: `~/.unicron/memory/preferences/`
- `decision` → per-project: `.unicron/memory/decisions/`
- `outcome` → per-project: `.unicron/memory/outcomes/`

Create the directory if it doesn't exist.

### 3. Generate filename

Derive a kebab-case filename (max 40 chars) from the topic in `content`.
For outcomes, append the date: `agent-qa-engineer-2026-04-17.md`
If the file already exists, append `-2`, `-3`, etc.

### 4. Write the memory file

```markdown
---
type: decision | outcome | preference
scope: global | project
agent: <name>   # outcomes only — omit for decision and preference
confidence: high | medium | low
date: YYYY-MM-DD
tags: [tag1, tag2, tag3]
---

<body>
```

**Body rules:**
- `preference`: 2–4 sentences in second person. "User prefers X because Y. Apply this by Z."
- `decision`: 2–4 sentences with rationale. "Chose X over Y because Z. This affects [areas]."
- `outcome`: 2–4 sentences on what happened and implication. "Agent X did Y. Result: Z. Watch for: W."

**Tags rules:**
- 2–5 specific lowercase keywords (e.g. `[database, postgresql, orm]`)
- Used by memory-reader to filter relevant entries — be specific

### 5. Update MEMORY.md index

At the scope root (`~/.unicron/memory/MEMORY.md` or `.unicron/memory/MEMORY.md`):
- Create the file with a header if it doesn't exist:
  ```
  # Unicron Memory Index
  ```
- Append one line:
  ```
  - [Title](relative/path/to/file.md) — one-line hook describing the memory
  ```
- Never duplicate an existing entry — check if the path already exists in the index first

### 6. Confirm (manual writes only)

For `event: manual`, output:
> "Saved to `.unicron/memory/decisions/auth-approach.md`"

For automatic writes, no output.

## Rules

- Never overwrite an existing entry body — create a new versioned file instead
- Tags must be specific enough to distinguish this memory from unrelated ones
- If classification is ambiguous, default to `decision` for project scope and `preference` for global scope
