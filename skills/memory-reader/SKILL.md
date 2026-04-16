---
name: memory-reader
description: "Loads global and project MEMORY.md indexes, filters entries by relevance to the current phase/task, and returns a structured context block indicating which memories to apply silently vs surface explicitly. Called at session start and before agent dispatch."
---

# Unicron Memory Reader

Load and surface relevant memory. Called at session start and before any agent dispatch.

## When invoked

- `unicron` skill at session start (before any check or investigation)
- `dispatcher` before assembling a mini-team for a task

## Input

You receive:
- `phase`: current SDLC phase — one of: `investigating`, `speccing`, `planning`, `building`, `complete`
- `task` (optional): current task title and description — provided before dispatch
- `tags` (optional): specific tags to filter by

## Process

### 1. Load indexes

Read `~/.unicron/memory/MEMORY.md` (global) — if it exists.
Read `.unicron/memory/MEMORY.md` (project) — if it exists.

Resolve `.unicron/memory/MEMORY.md` by:
1. Check if the current working directory contains `.unicron/memory/MEMORY.md`
2. If not, search parent directories up to the git root
3. If no project root is found, skip the project index — do not error

If both indexes are missing or empty, return empty context silently. Do not mention memory to the user.

### 2. Filter

From both indexes, select entries whose tags overlap with:
- The current `phase` value (e.g. tag `planning` matches planning phase)
- Any keywords from `task` title/description (word-level match)
- Any explicitly provided `tags`

If no `tags` are provided and no `task` context exists (session start with no task), load all entries from both indexes.

### 3. Read selected files

For each selected index entry, resolve the file path relative to the directory containing the MEMORY.md file (e.g. `decisions/auth-approach.md` resolves to `.unicron/memory/decisions/auth-approach.md`).

Read the full file content of each selected entry.

### 4. Decide surfacing

For each entry, check its `type` field in the frontmatter:

| type | surfacing | action |
|------|-----------|--------|
| `preference` | Silent | Add summary to `apply_silently` |
| `decision` | Explicit | Add to `confirm_with_user` with a one-line prompt |
| `outcome` | Silent | Add summary to `inform_dispatch` |

Additionally: if any entry's content contradicts the current spec or plan (a direct conflict), add it to `flag_conflict` regardless of type.

Set `confidence` level for conflict detection:
- Flag a conflict only when the contradiction is clear and direct, not speculative
- Example of clear conflict: memory says "no mobile support" + current spec has iOS section
- Example of non-conflict: memory says "prefer Postgres" + current spec doesn't mention a database yet

### 5. Return memory context block

Output exactly this structure (omit empty lists):

```
MEMORY CONTEXT:
apply_silently:
  - [preference summary — one sentence]
confirm_with_user:
  - memory: [decision summary — one sentence]
    prompt: "Last time you chose X — apply the same here?"
inform_dispatch:
  - [outcome summary — one sentence relevant to current task]
flag_conflict:
  - memory: [conflicting entry summary]
    conflict: "[what contradicts what]"
```

If all lists are empty: return nothing. Do not output "no relevant memories found" or any acknowledgment.

## Rules

- Process `flag_conflict` entries first — surface conflicts before all other memory
- Surface `confirm_with_user` entries one at a time — never batch multiple confirmation prompts
- `apply_silently` entries adjust behavior with no user-visible output
- `inform_dispatch` entries go into the CTO context block, not shown directly to the user
- If both indexes are empty or missing: return nothing silently
- If a file referenced in the index does not exist on disk: skip it silently, do not error
