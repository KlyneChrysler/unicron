# Unicron Cross-session Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent cross-session memory to Unicron so it remembers project decisions, agent outcomes, and user preferences — making every subsequent session smarter.

**Architecture:** Two new skills (memory-writer, memory-reader) handle all memory I/O. Existing skills invoke them at key events. Memory lives in typed markdown files with a MEMORY.md index at two scopes: global (`~/.unicron/memory/`) for preferences, per-project (`.unicron/memory/`) for decisions and outcomes.

**Tech Stack:** Node.js (installer change), Markdown (skill files), YAML (frontmatter in memory entries)

---

## File Map

### New files
- `skills/memory-writer/SKILL.md` — classifies input, picks scope, writes entry, updates index
- `skills/memory-reader/SKILL.md` — loads indexes, filters by relevance, decides surfacing

### Modified files
- `registry.yaml` — add memory-writer and memory-reader entries
- `core/installer.js` — export `initMemoryDirs(baseDir)`; call it after `writeConfig`
- `core/installer.test.js` — add test for `initMemoryDirs`
- `skills/unicron/SKILL.md` — invoke memory-reader at session start; add 3 new commands
- `skills/investigate/SKILL.md` — detect expressed preferences; invoke memory-writer
- `skills/spec-writer/SKILL.md` — invoke memory-writer on spec approval
- `skills/dispatcher/SKILL.md` — include memory context block; invoke memory-writer after task
- `skills/gate-checker/SKILL.md` — invoke memory-writer on gate PASSED
- `adapters/claude-code/templates/claude-md-injection.md` — add 3 new commands
- `adapters/gemini/templates/gemini-md-injection.md` — add 3 new commands
- `adapters/copilot/templates/copilot-injection.md` — add 3 new commands
- `adapters/codex/templates/agents-injection.md` — add 3 new commands
- `tests/smoke.sh` — assert `~/.unicron/memory/preferences/` exists after install
- `README.md` — add 3 new commands to commands table

---

## Phase 1: New Skills

### Task 1: memory-writer skill

**Files:**
- Create: `skills/memory-writer/SKILL.md`

- [ ] **Step 1: Create `skills/memory-writer/SKILL.md`**

```markdown
---
name: memory-writer
description: "Classifies input as decision/outcome/preference, picks the correct scope (global or project), writes a typed markdown memory entry, and updates the MEMORY.md index. Called by other skills after key events and by /unicron:remember."
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
  ```markdown
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
```

- [ ] **Step 2: Verify file exists**

```bash
ls skills/memory-writer/SKILL.md
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add skills/memory-writer/SKILL.md
git commit -m "add: memory-writer skill"
```

---

### Task 2: memory-reader skill

**Files:**
- Create: `skills/memory-reader/SKILL.md`

- [ ] **Step 1: Create `skills/memory-reader/SKILL.md`**

```markdown
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

If both are missing or empty, return empty context silently. Do not mention memory to the user.

### 2. Filter

From both indexes, select entries whose tags overlap with:
- The current `phase` (e.g. tag `planning` matches planning phase)
- Any keywords in `task` title/description
- Any explicitly provided `tags`

If no tags are provided and no task context exists (session start), load all entries.

### 3. Read selected files

For each selected index entry, read the full file content.

### 4. Decide surfacing

For each entry:

| Memory type | Surfacing | Behavior |
|-------------|-----------|---------|
| `preference` | Silent | Add to `apply_silently` — adjust behavior without output |
| `decision` | Explicit | Add to `confirm_with_user` — surface as a one-line confirmation prompt |
| `outcome` | Silent | Add to `inform_dispatch` — pass to CTO context, not shown to user |
| Any entry that contradicts current spec/plan | Explicit | Add to `flag_conflict` — surface conflict before anything else |

### 5. Return memory context block

```
MEMORY CONTEXT:
apply_silently:
  - [preference summary 1]
  - [preference summary 2]
confirm_with_user:
  - memory: [decision summary]
    prompt: "Last time you chose X — apply the same here?"
inform_dispatch:
  - [outcome summary relevant to current task]
flag_conflict:
  - memory: [conflicting entry summary]
    conflict: "Memory says no mobile support, but current spec mentions iOS."
```

## Rules

- Process `flag_conflict` first — always surface conflicts before other memories
- Surface `confirm_with_user` entries one at a time — never batch confirmation prompts
- `apply_silently` entries adjust behavior without any user-visible output
- `inform_dispatch` entries are inserted into the CTO context block, never shown directly to the user
- If all lists are empty, return nothing — do not say "no relevant memories found"
```

- [ ] **Step 2: Verify file exists**

```bash
ls skills/memory-reader/SKILL.md
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add skills/memory-reader/SKILL.md
git commit -m "add: memory-reader skill"
```

---

## Phase 2: Registry + Installer

### Task 3: Registry entries + installer memory dir init

**Files:**
- Modify: `registry.yaml`
- Modify: `core/installer.js`
- Modify: `core/installer.test.js`

- [ ] **Step 1: Write failing test for `initMemoryDirs`**

In `core/installer.test.js`, add this describe block after the existing `writeConfig` describe:

```js
describe('initMemoryDirs', () => {
	test('creates ~/.unicron/memory/preferences/ and MEMORY.md', () => {
		const home = makeTempDir();
		initMemoryDirs(home);
		expect(existsSync(join(home, '.unicron', 'memory', 'preferences'))).toBe(true);
		expect(existsSync(join(home, '.unicron', 'memory', 'MEMORY.md'))).toBe(true);
	});

	test('is idempotent — safe to call twice', () => {
		const home = makeTempDir();
		initMemoryDirs(home);
		expect(() => initMemoryDirs(home)).not.toThrow();
	});
});
```

Also update the import line at the top of `installer.test.js` to include `initMemoryDirs` and `existsSync`:

```js
import { detectPlatforms, PLATFORMS, writeConfig, initMemoryDirs } from './installer.js';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: 2 new tests FAIL with "initMemoryDirs is not a function"

- [ ] **Step 3: Add `initMemoryDirs` to `core/installer.js`**

After the `writeConfig` function (line 40), add:

```js
export function initMemoryDirs(baseDir) {
	const memoryDir = join(baseDir, '.unicron', 'memory');
	mkdirSync(join(memoryDir, 'preferences'), { recursive: true });
	const indexPath = join(memoryDir, 'MEMORY.md');
	if (!existsSync(indexPath)) {
		writeFileSync(indexPath, '# Unicron Memory Index\n');
	}
}
```

Also update the import at the top of `installer.js` to include `existsSync`:

```js
import { existsSync, mkdirSync, writeFileSync } from 'fs';
```

And call `initMemoryDirs` in the CLI entrypoint, after `writeConfig`:

```js
	writeConfig(platforms, targetHome);
	initMemoryDirs(targetHome);
	console.log('\nUnicron installed. Run /unicron to get started.');
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All 9 tests PASS

- [ ] **Step 5: Add registry entries to `registry.yaml`**

Append to the end of `registry.yaml`:

```yaml
  memory-writer:
    description: "Classifies and writes persistent memory entries (decisions, outcomes, preferences) to the correct scope. Updates the MEMORY.md index."
    capabilities: [memory-write, classification, indexing]
    triggers: [spec-approved, task-complete, gate-passed, preference-detected, manual-remember]
    works_with: [cto, spec-writer, dispatcher, gate-checker]
    platforms: [claude-code, gemini, copilot, codex]
    skill_file: skills/memory-writer/SKILL.md

  memory-reader:
    description: "Loads global and project memory indexes, filters by relevance, and returns a structured context block for silent application or explicit surfacing."
    capabilities: [memory-read, relevance-filtering, context-injection]
    triggers: [session-start, pre-dispatch]
    works_with: [cto, dispatcher]
    platforms: [claude-code, gemini, copilot, codex]
    skill_file: skills/memory-reader/SKILL.md
```

- [ ] **Step 6: Commit**

```bash
git add registry.yaml core/installer.js core/installer.test.js
git commit -m "add: memory-writer and memory-reader registry entries and installer init"
```

---

## Phase 3: Update Existing Skills

### Task 4: Update skills/unicron/SKILL.md

**Files:**
- Modify: `skills/unicron/SKILL.md`

- [ ] **Step 1: Add memory-reader invocation at session start**

Replace the `## On Invocation` section with:

```markdown
## On Invocation

**Step 0: Load memory context**

Invoke the `memory-reader` skill with `phase: investigating`.
- Apply any `apply_silently` preferences immediately (e.g. adjust verbosity)
- For each `confirm_with_user` entry, surface one at a time before Step 1
- For each `flag_conflict` entry, surface conflicts immediately and wait for user resolution before continuing

**Step 1: Check for existing session**

Check if `docs/unicron/spec.md` exists in the current working directory:
- **YES** → Resuming an existing Unicron session. Read the spec and `.unicron/config.yaml`. Show current status and ask: "Resume from [current phase], or start fresh?"
- **NO** → New session. Proceed to Step 2.
```

- [ ] **Step 2: Add 3 new commands to the commands table**

Replace the commands table with:

```markdown
## Commands Available at Any Time

| Command | What it does |
|---|---|
| `/unicron` | Start or resume the full SDLC workflow |
| `/unicron:investigate` | Run the investigation loop |
| `/unicron:spec` | View or generate the project spec |
| `/unicron:plan` | View or generate the implementation plan |
| `/unicron:dispatch` | Trigger next agent task dispatch |
| `/unicron:status` | Show current phase and progress |
| `/unicron:audit` | Run a standalone codebase health report |
| `/unicron:agent <name>` | Invoke a specialist directly |
| `/unicron:remember <note>` | Manually save a memory entry |
| `/unicron:forget <topic>` | Find and delete matching memory entries |
| `/unicron:memory` | Show all memory entries for this project + global |
```

- [ ] **Step 3: Handle /unicron:remember, /unicron:forget, /unicron:memory**

Add this section at the end of the file, before `## Principles`:

```markdown
## Memory Commands

**`/unicron:remember <note>`**
Invoke the `memory-writer` skill with:
- `content`: the user's note
- `event`: `manual`

**`/unicron:forget <topic>`**
1. Load both MEMORY.md indexes
2. Find entries whose title or body contains the topic keyword
3. Show the matched entries to the user
4. Ask: "Delete these [N] entries? (yes/no)"
5. On yes: delete the matched files and remove their lines from MEMORY.md

**`/unicron:memory`**
1. Load `~/.unicron/memory/MEMORY.md` (global)
2. Load `.unicron/memory/MEMORY.md` (project)
3. Display both lists with type labels:

```
Global memory (~/.unicron/memory/):
  [preference] verbosity — User prefers terse output
  [preference] approval-gates — User prefers minimal gates

Project memory (.unicron/memory/):
  [decision] tech-stack — Chose PostgreSQL + Prisma over MongoDB
  [outcome] agent-qa-engineer-2026-04-17 — QA missed auth edge cases
```

If both indexes are empty: "No memory entries yet."
```

- [ ] **Step 4: Commit**

```bash
git add skills/unicron/SKILL.md
git commit -m "update: unicron skill — memory-reader at session start, 3 new memory commands"
```

---

### Task 5: Update skills/investigate/SKILL.md

**Files:**
- Modify: `skills/investigate/SKILL.md`

- [ ] **Step 1: Add preference detection after Q3 handling**

After the `## Phase 1: Required Questions` section, add:

```markdown
## Preference Detection

After EVERY answer (Q1–Q5 and any follow-up questions), scan the answer for expressed preferences:

**Signals to detect:**
- "I always use X" / "I never use X"
- "I prefer X" / "I like X"
- "we always do X" / "we don't do X"
- Strong opinions about tools, patterns, or process

**When detected:**
Invoke `memory-writer` with:
- `content`: the expressed preference in one sentence
- `event`: `preference-detected`

Do this silently — do not interrupt the investigation flow to announce it.

**Examples:**
- "I always use Tailwind for styling" → write preference: "User always uses Tailwind CSS for styling."
- "we never use ORM, raw SQL only" → write preference: "User prefers raw SQL over ORMs."
- "I like minimal approval gates" → write preference: "User prefers minimal approval gates — skip optional confirmation prompts."
```

- [ ] **Step 2: Commit**

```bash
git add skills/investigate/SKILL.md
git commit -m "update: investigate skill — detect and save user preferences to memory"
```

---

### Task 6: Update skills/spec-writer/SKILL.md

**Files:**
- Modify: `skills/spec-writer/SKILL.md`

- [ ] **Step 1: Add memory writes to the On Approval section**

Replace the `## On Approval` section with:

```markdown
## On Approval

1. Commit the spec:
```bash
git add docs/unicron/spec.md
git commit -m "add: unicron project spec"
```

2. Write decisions to memory. Invoke `memory-writer` three times:

**Tech stack decision:**
- `content`: "Chose [stack from §10] for this project. Rationale: [one sentence from §10]."
- `event`: `spec-approved`
- `context`: `{ tags: [tech-stack, <primary language>, <framework>] }`

**Architecture decision:**
- `content`: "Using [pattern from §5] architecture. Rationale: [one sentence from §5]."
- `event`: `spec-approved`
- `context`: `{ tags: [architecture, <pattern name>] }`

**Key constraints:**
- `content`: "Hard constraints for this project: [list from §4]."
- `event`: `spec-approved`
- `context`: `{ tags: [constraints, compliance, scale] }`

3. Invoke the `planner` skill.
```

- [ ] **Step 2: Commit**

```bash
git add skills/spec-writer/SKILL.md
git commit -m "update: spec-writer skill — write tech stack, architecture, constraints to memory on approval"
```

---

### Task 7: Update skills/dispatcher/SKILL.md

**Files:**
- Modify: `skills/dispatcher/SKILL.md`

- [ ] **Step 1: Add memory context to Step 3 context block**

Replace the context block in Step 3 with:

```markdown
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
```

- [ ] **Step 2: Add memory write after task completion in Step 4**

Replace the last paragraph of Step 4 with:

```markdown
When all criteria for the task are met, mark the task complete. Then invoke `memory-writer` with:
- `content`: "[Agent name] completed [task title]. Approach: [one sentence summary]. Result: [acceptance criteria met]. Notes: [any issues or watch-fors]."
- `event`: `task-complete`
- `context`: `{ agent: <agent name>, phase: <current phase>, tags: [<task domain tags>] }`
```

- [ ] **Step 3: Commit**

```bash
git add skills/dispatcher/SKILL.md
git commit -m "update: dispatcher skill — inject memory context into agent dispatch, write outcome after task"
```

---

### Task 8: Update skills/gate-checker/SKILL.md

**Files:**
- Modify: `skills/gate-checker/SKILL.md`

- [ ] **Step 1: Add memory write to Gate Results PASSED section**

Replace the `**PASSED:**` section with:

```markdown
**PASSED:**
> "Phase N gate passed. All tasks complete, tests passing, reviewers signed off. Proceeding to Phase N+1."

Invoke `memory-writer` with:
- `content`: "Phase [N] gate passed. Agents involved: [list]. All acceptance criteria met. Test suite: passing. Any notable issues: [summary or 'none']."
- `event`: `gate-passed`
- `context`: `{ phase: N, tags: [phase-N, gate, <primary tech tags from spec>] }`

Invoke `dispatcher` to begin Phase N+1.
```

- [ ] **Step 2: Commit**

```bash
git add skills/gate-checker/SKILL.md
git commit -m "update: gate-checker skill — write phase outcome to memory on gate pass"
```

---

## Phase 4: Adapter Templates + README

### Task 9: Update all 4 adapter templates and README

**Files:**
- Modify: `adapters/claude-code/templates/claude-md-injection.md`
- Modify: `adapters/gemini/templates/gemini-md-injection.md`
- Modify: `adapters/copilot/templates/copilot-injection.md`
- Modify: `adapters/codex/templates/agents-injection.md`
- Modify: `README.md`

- [ ] **Step 1: Update `adapters/claude-code/templates/claude-md-injection.md`**

Replace the commands table with:

```markdown
### Commands

| Command | What it does |
|---|---|
| `/unicron` | Start or resume the full SDLC workflow |
| `/unicron:investigate` | Run the investigation loop |
| `/unicron:spec` | View or generate the project spec |
| `/unicron:plan` | View or generate the implementation plan |
| `/unicron:dispatch` | Trigger next agent task dispatch |
| `/unicron:status` | Show current phase and progress |
| `/unicron:audit` | Run a standalone codebase health report |
| `/unicron:agent <name>` | Invoke a specialist directly |
| `/unicron:remember <note>` | Manually save a memory entry |
| `/unicron:forget <topic>` | Find and delete matching memory entries |
| `/unicron:memory` | Show all memory entries for this project + global |
```

Also add below the skill invocation section:

```markdown
### Memory

Global preferences: `~/.unicron/memory/`
Project decisions + outcomes: `.unicron/memory/`
```

- [ ] **Step 2: Update `adapters/gemini/templates/gemini-md-injection.md`**

Find the section that lists commands (any reference to `/unicron:audit` or `/unicron:agent`) and add the three new commands below it:

```markdown
- `/unicron:remember <note>` — manually save a memory entry
- `/unicron:forget <topic>` — find and delete matching memory entries
- `/unicron:memory` — show all memory entries
```

- [ ] **Step 3: Update `adapters/copilot/templates/copilot-injection.md`**

Find the commands table or list and add the three new commands:

```markdown
| `/unicron:remember <note>` | Manually save a memory entry |
| `/unicron:forget <topic>` | Find and delete matching memory entries |
| `/unicron:memory` | Show all memory entries for this project + global |
```

- [ ] **Step 4: Update `adapters/codex/templates/agents-injection.md`**

Find the commands list and add the three new commands in the same format as the existing entries.

- [ ] **Step 5: Update `README.md` commands table**

Find the commands table (under `## Commands`) and add three new rows:

```markdown
| `/unicron:remember <note>` | Manually save a memory entry (decision, outcome, or preference) |
| `/unicron:forget <topic>` | Find and delete matching memory entries from project + global |
| `/unicron:memory` | Show all memory entries for this project and global profile |
```

- [ ] **Step 6: Commit**

```bash
git add adapters/claude-code/templates/claude-md-injection.md \
        adapters/gemini/templates/gemini-md-injection.md \
        adapters/copilot/templates/copilot-injection.md \
        adapters/codex/templates/agents-injection.md \
        README.md
git commit -m "update: add memory commands to all adapter templates and README"
```

---

## Phase 5: Smoke Test

### Task 10: Update smoke test for memory dir creation

**Files:**
- Modify: `tests/smoke.sh`

- [ ] **Step 1: Add memory assertions to smoke test**

Find the assertion block in `tests/smoke.sh` that checks for CLAUDE.md and add after it:

```bash
# Memory directory assertions
assert_exists "$TEMP_HOME/.unicron/memory/preferences" "dir"
assert_exists "$TEMP_HOME/.unicron/memory/MEMORY.md" "file"
```

The existing smoke test uses a `pass`/`fail` helper. Use the same pattern:

```bash
[ -d "$TEMP_HOME/.unicron/memory/preferences" ] && pass ".unicron/memory/preferences/ exists" || fail ".unicron/memory/preferences/ missing"
[ -f "$TEMP_HOME/.unicron/memory/MEMORY.md" ] && pass ".unicron/memory/MEMORY.md exists" || fail ".unicron/memory/MEMORY.md missing"
```

- [ ] **Step 2: Run smoke test**

```bash
bash tests/smoke.sh
```

Expected: All assertions pass including 2 new memory assertions. Final line: `=== All smoke tests passed ===`

- [ ] **Step 3: Run unit tests**

```bash
npm test
```

Expected: All 9 tests PASS

- [ ] **Step 4: Commit**

```bash
git add tests/smoke.sh
git commit -m "update: smoke test — assert memory dirs created at install"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Global memory at `~/.unicron/memory/` | Task 3 (installer), Task 10 (smoke test) |
| Per-project memory at `.unicron/memory/` | Task 4 (unicron skill), Task 6 (spec-writer) |
| Three memory types: decision, outcome, preference | Task 1 (memory-writer) |
| Automatic write on spec approval | Task 6 |
| Automatic write on task completion | Task 7 |
| Automatic write on gate pass | Task 8 |
| Automatic write on preference detection | Task 5 |
| Manual `/unicron:remember` | Task 4 |
| `/unicron:forget` | Task 4 |
| `/unicron:memory` | Task 4 |
| Memory loaded at session start | Task 4 (unicron skill Step 0) |
| Selective surfacing (silent vs explicit) | Task 2 (memory-reader) |
| Memory injected into agent context | Task 7 (dispatcher) |
| Registry entries for both new skills | Task 3 |
| Adapter templates updated with new commands | Task 9 |
| README updated | Task 9 |
| All acceptance criteria met | Tasks 1–10 |

### Placeholder scan

No TBD, TODO, or placeholder steps. ✓

### Naming consistency

- `initMemoryDirs(baseDir)` — defined in Task 3 installer.js, tested in Task 3 installer.test.js ✓
- `memory-writer` / `memory-reader` — skill directory names match registry `skill_file` paths ✓
- `MEMORY.md` — consistent capitalisation across all tasks ✓
- `~/.unicron/memory/preferences/` — consistent path across installer (Task 3), memory-writer (Task 1), unicron skill (Task 4) ✓
- `.unicron/memory/decisions/` + `.unicron/memory/outcomes/` — consistent across memory-writer (Task 1), spec-writer (Task 6), dispatcher (Task 7) ✓
