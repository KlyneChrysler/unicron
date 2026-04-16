# Unicron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Unicron — a cross-platform AI agent system for the full SDLC that installs via `npx unicron init`, works on Claude Code, Gemini CLI, Copilot, and Codex, and deploys a 13-agent IT department (CTO orchestrator + 12 specialists) to guide any project from investigation through deployment.

**Architecture:** Layered plugin architecture with a runtime agent registry. A thin installer detects platforms and generates adapter files. Seven canonical skill files drive the SDLC workflow. Thirteen agent markdown files define the specialist pool. The CTO orchestrator reads `registry.yaml` at runtime to assemble dynamic mini-teams per task.

**Tech Stack:** Node.js (installer + adapters), Markdown (skills + agents), YAML (registry + config), Shell (curl installer)

---

## File Map

### Foundation
- `package.json` — npm package, `bin.unicron = core/installer.js`
- `install.sh` — curl installer entry point
- `registry.yaml` — agent registry, source of truth for all 13 agents
- `.claude-plugin/plugin.json` — Claude Code plugin manifest
- `core/installer.js` — platform detection + adapter orchestration
- `core/installer.test.js` — unit tests for installer
- `jest.config.js` — test configuration

### Skills (7 files)
- `skills/unicron/SKILL.md` — main `/unicron` entry point
- `skills/investigate/SKILL.md` — investigation loop (5 required Q + confidence scoring)
- `skills/spec-writer/SKILL.md` — spec generation (14-section format)
- `skills/planner/SKILL.md` — plan decomposition (phases → tasks → steps)
- `skills/dispatcher/SKILL.md` — CTO agent dispatch logic
- `skills/gate-checker/SKILL.md` — phase gate evaluation
- `skills/auditor/SKILL.md` — codebase health scan

### Agents (13 files)
- `agents/cto.md` — orchestrator
- `agents/solutions-architect.md`
- `agents/ux-designer.md`
- `agents/frontend-dev.md`
- `agents/backend-dev.md`
- `agents/mobile-dev.md`
- `agents/database-admin.md`
- `agents/qa-engineer.md`
- `agents/security-engineer.md`
- `agents/devops-sre.md`
- `agents/technical-writer.md`
- `agents/product-analyst.md`
- `agents/code-reviewer.md`

### Adapters (4 platforms)
- `adapters/claude-code/generate.js` + `templates/claude-md-injection.md`
- `adapters/gemini/generate.js` + `templates/gemini-md-injection.md` + `templates/gemini-extension.json`
- `adapters/copilot/generate.js` + `templates/copilot-injection.md`
- `adapters/codex/generate.js` + `templates/agents-injection.md`

### Documentation
- `README.md`
- `tests/smoke.sh`

---

## Phase 1: Foundation

### Task 1: Package scaffolding + plugin manifest

**Files:**
- Create: `package.json`
- Create: `install.sh`
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "unicron",
  "version": "1.0.0",
  "description": "Full SDLC AI agent system — installs on Claude Code, Gemini CLI, Copilot, and Codex",
  "type": "module",
  "bin": { "unicron": "./core/installer.js" },
  "scripts": { "test": "node --experimental-vm-modules node_modules/.bin/jest" },
  "keywords": ["ai", "agents", "sdlc", "claude", "gemini"],
  "license": "MIT",
  "devDependencies": { "jest": "^29.0.0" }
}
```

- [ ] **Step 2: Create install.sh**

```bash
#!/usr/bin/env bash
set -e
echo "Installing Unicron..."
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required. Install from https://nodejs.org"
  exit 1
fi
UNICRON_DIR="${HOME}/.unicron-install"
if [ -d "$UNICRON_DIR" ]; then
  cd "$UNICRON_DIR" && git pull
else
  git clone https://github.com/your-org/unicron "$UNICRON_DIR"
fi
cd "$UNICRON_DIR" && node core/installer.js
echo "Unicron installed. Run /unicron to get started."
```

- [ ] **Step 3: Create .claude-plugin/plugin.json**

```json
{
  "name": "unicron",
  "description": "Full SDLC AI agent system: investigate → spec → plan → build with a 13-agent IT department",
  "version": "1.0.0",
  "license": "MIT",
  "keywords": ["sdlc", "agents", "architecture", "tdd", "full-stack"]
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json install.sh .claude-plugin/plugin.json
git commit -m "add: package scaffolding and plugin manifest"
```

---

### Task 2: Agent Registry

**Files:**
- Create: `registry.yaml`

- [ ] **Step 1: Write registry.yaml**

The registry declares all 13 agents. Each entry has: `description`, `capabilities[]`, `triggers[]`, `works_with[]`, `platforms[]`, `skill_file`.

Agents to declare (in this order): `cto`, `solutions-architect`, `ux-designer`, `frontend-dev`, `backend-dev`, `mobile-dev`, `database-admin`, `qa-engineer`, `security-engineer`, `devops-sre`, `technical-writer`, `product-analyst`, `code-reviewer`.

Example entry to follow for all 13:
```yaml
agents:
  cto:
    description: "Orchestrator. Reads spec + plan, assembles mini-teams, dispatches specialists, runs gate checks. Never writes code directly."
    capabilities: [orchestration, planning, delegation, gate-checks, progress-tracking]
    triggers: [any-task, phase-start, phase-end, blocker]
    works_with: [all]
    platforms: [claude-code, gemini, copilot, codex]
    skill_file: agents/cto.md

  solutions-architect:
    description: "System design, architecture decisions, pattern selection, API design, scalability planning."
    capabilities: [architecture, design-patterns, api-design, scalability, tech-selection]
    triggers: [new-project, major-feature, tech-decision, refactor]
    works_with: [cto, backend-dev, database-admin, devops-sre]
    platforms: [claude-code, gemini, copilot, codex]
    skill_file: agents/solutions-architect.md

  # ... continue pattern for all 13 agents
```

Full capability/trigger/works_with values for remaining agents:
- `ux-designer`: capabilities=[wireframes, user-flows, component-design, accessibility], triggers=[new-feature, ui-change], works_with=[frontend-dev, product-analyst]
- `frontend-dev`: capabilities=[components, styling, state-management, routing, a11y], triggers=[ui-feature, component, page], works_with=[ux-designer, backend-dev, qa-engineer]
- `backend-dev`: capabilities=[api, business-logic, services, middleware, integrations], triggers=[api-feature, service, backend-bug], works_with=[solutions-architect, database-admin, security-engineer]
- `mobile-dev`: capabilities=[ios, android, react-native, flutter, push-notifications], triggers=[mobile-feature, mobile-bug, app-release], works_with=[backend-dev, ux-designer, qa-engineer]
- `database-admin`: capabilities=[schema, migrations, query-optimization, indexing, data-modeling], triggers=[new-model, migration, slow-query], works_with=[backend-dev, solutions-architect, devops-sre]
- `qa-engineer`: capabilities=[unit-tests, integration-tests, e2e-tests, coverage], triggers=[any-feature, bug-fix, release], works_with=[frontend-dev, backend-dev, security-engineer]
- `security-engineer`: capabilities=[auth, owasp, vulnerability-scan, compliance, secrets], triggers=[auth-feature, data-handling, api-design, pre-release], works_with=[backend-dev, devops-sre]
- `devops-sre`: capabilities=[ci-cd, infrastructure, deployment, monitoring, containerization], triggers=[deployment, infra-change, release-pipeline], works_with=[backend-dev, security-engineer, database-admin]
- `technical-writer`: capabilities=[readme, api-docs, changelog, inline-docs, runbooks], triggers=[new-feature, api-change, release], works_with=[backend-dev, frontend-dev, devops-sre]
- `product-analyst`: capabilities=[requirements, metrics, acceptance-criteria, user-stories], triggers=[new-feature, spec-review, unclear-requirements], works_with=[cto, ux-designer, qa-engineer]
- `code-reviewer`: capabilities=[code-quality, patterns, consistency, complexity, maintainability], triggers=[post-implementation, pre-commit, phase-gate], works_with=[all]

- [ ] **Step 2: Verify agent count**

```bash
grep -c "skill_file:" registry.yaml
```

Expected output: `13`

- [ ] **Step 3: Commit**

```bash
git add registry.yaml
git commit -m "add: agent registry with 13 specialists"
```

---

### Task 3: Core Installer — platform detection

**Files:**
- Create: `core/installer.js`
- Create: `core/installer.test.js`
- Create: `jest.config.js`

- [ ] **Step 1: Create jest.config.js**

```js
export default {
  transform: {},
  testEnvironment: 'node',
};
```

- [ ] **Step 2: Write failing tests first (core/installer.test.js)**

```js
import { detectPlatforms, PLATFORMS } from './installer.js';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), 'unicron-test-'));
}

describe('detectPlatforms', () => {
  test('detects Claude Code when ~/.claude/ exists', () => {
    const home = makeTempDir();
    mkdirSync(join(home, '.claude'));
    expect(detectPlatforms(home)).toContain(PLATFORMS.CLAUDE_CODE);
  });

  test('detects Gemini when ~/.gemini/ exists', () => {
    const home = makeTempDir();
    mkdirSync(join(home, '.gemini'));
    expect(detectPlatforms(home)).toContain(PLATFORMS.GEMINI);
  });

  test('detects Copilot when .github/copilot-instructions.md exists', () => {
    const home = makeTempDir();
    mkdirSync(join(home, '.github'));
    writeFileSync(join(home, '.github', 'copilot-instructions.md'), '');
    expect(detectPlatforms(home)).toContain(PLATFORMS.COPILOT);
  });

  test('detects Codex when AGENTS.md exists in cwd', () => {
    const home = makeTempDir();
    writeFileSync(join(home, 'AGENTS.md'), '');
    expect(detectPlatforms(home)).toContain(PLATFORMS.CODEX);
  });

  test('detects multiple platforms simultaneously', () => {
    const home = makeTempDir();
    mkdirSync(join(home, '.claude'));
    mkdirSync(join(home, '.gemini'));
    const platforms = detectPlatforms(home);
    expect(platforms).toContain(PLATFORMS.CLAUDE_CODE);
    expect(platforms).toContain(PLATFORMS.GEMINI);
  });

  test('returns empty array when no platforms detected', () => {
    expect(detectPlatforms(makeTempDir())).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npm install && npm test
```

Expected: FAIL — `detectPlatforms` not defined

- [ ] **Step 4: Implement core/installer.js**

```js
#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export const PLATFORMS = {
  CLAUDE_CODE: 'claude-code',
  GEMINI: 'gemini',
  COPILOT: 'copilot',
  CODEX: 'codex',
};

export function detectPlatforms(baseDir = homedir()) {
  const detected = [];
  if (existsSync(join(baseDir, '.claude'))) detected.push(PLATFORMS.CLAUDE_CODE);
  if (existsSync(join(baseDir, '.gemini'))) detected.push(PLATFORMS.GEMINI);
  if (existsSync(join(baseDir, '.github', 'copilot-instructions.md'))) detected.push(PLATFORMS.COPILOT);
  if (existsSync(join(baseDir, 'AGENTS.md'))) detected.push(PLATFORMS.CODEX);
  return detected;
}

export function writeConfig(platforms, baseDir) {
  const configDir = join(baseDir, '.unicron');
  mkdirSync(configDir, { recursive: true });
  const lines = [
    `version: "1.0.0"`,
    `installed_platforms:`,
    ...platforms.map(p => `  - ${p}`),
    `project:`,
    `  spec: docs/unicron/spec.md`,
    `  plan: docs/unicron/plan.md`,
    `  current_phase: 0`,
    `  status: not-started`,
  ];
  writeFileSync(join(configDir, 'config.yaml'), lines.join('\n') + '\n');
}

async function runAdapter(platform, baseDir) {
  const adapterPath = join(ROOT, 'adapters', platform, 'generate.js');
  if (!existsSync(adapterPath)) {
    console.warn(`  Warning: No adapter found for ${platform}`);
    return;
  }
  const { generate } = await import(adapterPath);
  await generate(ROOT, baseDir);
}

// Parse --home flag for testing
const homeArgIndex = process.argv.indexOf('--home');
const homeOverride = homeArgIndex !== -1 ? process.argv[homeArgIndex + 1] : null;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const targetHome = homeOverride ?? homedir();
  const platforms = detectPlatforms(targetHome);

  if (platforms.length === 0) {
    console.log('No supported AI platforms detected.');
    console.log('Supported: Claude Code (~/.claude/), Gemini (~/.gemini/), Copilot, Codex (AGENTS.md)');
    process.exit(1);
  }

  console.log(`Detected platforms: ${platforms.join(', ')}`);
  for (const platform of platforms) {
    console.log(`\nInstalling ${platform} adapter...`);
    await runAdapter(platform, targetHome);
    console.log(`  ${platform} done.`);
  }

  writeConfig(platforms, targetHome);
  console.log('\nUnicron installed. Run /unicron to get started.');
}
```

- [ ] **Step 5: Add writeConfig test to installer.test.js**

Append to `core/installer.test.js`:
```js
import { writeConfig } from './installer.js';
import { readFileSync } from 'fs';

describe('writeConfig', () => {
  test('writes .unicron/config.yaml with detected platforms', () => {
    const home = makeTempDir();
    writeConfig(['claude-code', 'gemini'], home);
    const config = readFileSync(join(home, '.unicron', 'config.yaml'), 'utf8');
    expect(config).toContain('claude-code');
    expect(config).toContain('gemini');
    expect(config).toContain('status: not-started');
  });
});
```

- [ ] **Step 6: Run tests — verify all pass**

```bash
npm test
```

Expected: All 7 tests PASS

- [ ] **Step 7: Commit**

```bash
git add core/installer.js core/installer.test.js jest.config.js
git commit -m "add: core installer with platform detection and tests"
```

---

## Phase 2: Core Skills

### Task 4: Main entry skill

**Files:**
- Create: `skills/unicron/SKILL.md`

- [ ] **Step 1: Write skills/unicron/SKILL.md**

Frontmatter:
```
---
name: unicron
description: "TRIGGER on /unicron — Full SDLC orchestrator. Scans codebase or starts greenfield investigation. The single entry point for the entire Unicron workflow."
---
```

Content sections to include (write in full):
1. **On Invocation** — Check if `docs/unicron/spec.md` exists (resuming vs new). If resuming: read spec + `.unicron/config.yaml`, show status, ask "Resume from [phase] or start fresh?"
2. **Detect project type** — Look for source files (package.json, pyproject.toml, go.mod, Cargo.toml, src/, app/, lib/). If found → existing codebase mode → invoke `auditor`. If empty → greenfield mode → invoke `investigate`.
3. **Existing codebase mode** — After auditor health report, present numbered menu: [1] New feature [2] Bug fix [3] Refactor [4] Full audit only. Branch to investigate skill with mode context for [1][2][3].
4. **Greenfield mode** — Invoke `investigate` skill directly.
5. **Commands available at any time** — List all `/unicron:*` commands.
6. **Principles** — Never write code directly. Spec is immutable. Surface blockers immediately. Every dispatched task maps to plan.md.

- [ ] **Step 2: Verify frontmatter**

```bash
head -4 skills/unicron/SKILL.md
```

Expected: `---`, `name: unicron`, `description:`, (description value)

- [ ] **Step 3: Commit**

```bash
git add skills/unicron/SKILL.md
git commit -m "add: unicron main entry skill"
```

---

### Task 5: Investigation skill

**Files:**
- Create: `skills/investigate/SKILL.md`

- [ ] **Step 1: Write skills/investigate/SKILL.md**

Frontmatter: `name: investigate`

Content sections:

**Phase 1 — Required Questions (always ask all 5, one per message):**
- Q1: What are you building? (2-3 sentences, what + who)
- Q2: Who are the users? (type + rough count)
- Q3: Tech stack preference or "you choose"
- Q4: Hard constraints (deadline, budget, compliance, scale)
- Q5: What does success look like in 3 months? (specific metric)

**Phase 2 — Confidence Scoring:**
After Q5, score 0–100% across 6 dimensions:
- Architecture clarity (system structure + pattern choice)
- Data model clarity (core entities + relationships)
- Integration surface (external services/APIs)
- Security & compliance (auth + compliance requirements)
- Scale requirements (load, users, data volume)
- Team & deployment (who builds, how deployed)

Ask one targeted question per dimension below 70%. Stop when all ≥ 70%.

**Live Context Panel (show after EVERY answer):**
```
📋 What I know so far:
  Project:      [one-line]
  Users:        [who + count]
  Stack:        [technologies]
  Constraints:  [deadline/budget/compliance]
  Success:      [3-month metric]

  Confidence:
    Architecture      [████████░░]  80%
    Data model        [██████░░░░]  60%  ← asking next
    ...
```

**Exit condition:** All 6 dimensions ≥ 70% → present full understanding summary → ask for confirmation → on confirm, invoke `spec-writer`.

**Mode variants:** bug-fix skips confidence scoring; feature mode focuses on fit with existing architecture; refactor focuses on pain points and target state.

- [ ] **Step 2: Verify 5 required questions are present**

```bash
grep -c "^- Q[0-9]:" skills/investigate/SKILL.md
```

Expected: `5`

- [ ] **Step 3: Commit**

```bash
git add skills/investigate/SKILL.md
git commit -m "add: investigation skill with confidence scoring"
```

---

### Task 6: Spec-writer skill

**Files:**
- Create: `skills/spec-writer/SKILL.md`

- [ ] **Step 1: Write skills/spec-writer/SKILL.md**

Frontmatter: `name: spec-writer`

Content sections:

**Output:** Write to `docs/unicron/spec.md`. Create directory if needed.

**14 required sections:** Goals, Users & Personas, Functional Requirements, Non-Functional Requirements, Architecture, Design Patterns, Data Models, API Contracts, Folder Structure, Tech Stack, Integrations, Constraints & Risks, Acceptance Criteria, Out of Scope. No section may contain TBD/TODO/placeholder.

**Self-review checklist (run before showing to user):**
- Placeholder scan: any TBD/TODO? Fix inline.
- Consistency: architecture in §5 matches tech stack in §10, folder structure in §9 matches architecture in §5
- Completeness: all functional requirements in §3 traceable to acceptance criteria in §13
- Scope: §14 explicit enough for plan to be written

**Review gate:** After writing, present: "Spec written to docs/unicron/spec.md. Please review [§5 Architecture, §14 Out of Scope, §13 Acceptance Criteria]. Reply with changes or 'approved'."

**On approval:** `git add docs/unicron/spec.md && git commit -m "add: unicron project spec"`, then invoke `planner`.

- [ ] **Step 2: Commit**

```bash
git add skills/spec-writer/SKILL.md
git commit -m "add: spec-writer skill"
```

---

### Task 7: Planner skill

**Files:**
- Create: `skills/planner/SKILL.md`

- [ ] **Step 1: Write skills/planner/SKILL.md**

Frontmatter: `name: planner`

Content sections:

**Output:** Write to `docs/unicron/plan.md`.

**Decomposition rules table:**
- Max task size: fits one agent context window (~2000 lines max)
- Vertical slices: working + testable, not horizontal layers
- Dependencies explicit: `depends_on: [task-id]`
- Acceptance criteria: ≥1 concrete checkable done condition per task
- Agent assignment: every task names specialists from registry

**Phase structure:** Always minimum: Phase 1 Foundation, Phase 2 Core Features, Phase 3 Integration & Polish, Phase 4 Hardening.

**Plan format per task:** id, title, Agents, Depends on, Description, Steps (checkboxes), Acceptance criteria (checkboxes).

**Phase gate format:** At end of each phase — checklist: all tasks complete, tests passing (with exact command), code-reviewer signed off, security-engineer signed off (if auth/data in phase).

**Agent selection guide table:** ui-feature → ux-designer→frontend-dev→qa-engineer; api-endpoint → backend-dev+security-engineer→qa-engineer; database schema → database-admin→backend-dev; auth → solutions-architect→backend-dev+security-engineer→qa-engineer; deployment → devops-sre→security-engineer; any completed feature → always include code-reviewer last.

**Review gate:** After writing plan: "Plan written to docs/unicron/plan.md. Are phases in right order? Any task too large? Agent assignments correct? Reply or say 'approved'." On approval: commit, invoke `dispatcher`.

- [ ] **Step 2: Commit**

```bash
git add skills/planner/SKILL.md
git commit -m "add: planner skill"
```

---

### Task 8: Dispatcher skill

**Files:**
- Create: `skills/dispatcher/SKILL.md`

- [ ] **Step 1: Write skills/dispatcher/SKILL.md**

Frontmatter: `name: dispatcher`

Content: The CTO dispatch loop. Sections:

**Dispatch loop (repeat until all tasks complete):**
- Step 1: Find next task — first unchecked task in plan.md whose `depends_on` are all complete
- Step 2: Assemble mini-team — read registry.yaml, find each agent's skill_file, identify which agents can run in parallel (no data dependency) vs sequential
- Step 3: Announce dispatch plan — show task + mini-team with parallel/sequential notation
- Step 4: Dispatch agents — for each agent in order, invoke their skill with the standardized context block (spec content, plan content, task object, prior agent outputs, platform name, agent role)
- Step 5: Verify outputs — check each acceptance criterion; if unmet, re-dispatch same agent with unmet criterion highlighted; when all met, mark task complete
- Step 6: Show progress — "✓ Task X.Y complete — [title]. Next: Task X.Z. Phase N progress: M/T tasks done."
- Step 7: Phase gate — when all tasks in a phase complete, invoke `gate-checker` before next phase

**Handling blockers:** STOP, surface blocker to user: "BLOCKER on Task [id]: [what/why]. Please advise." Wait for resolution. Resume from blocked task.

**Parallel dispatch:** When agents have no data dependency, dispatch as concurrent subagents. Announce: "Dispatching [agent1] and [agent2] in parallel for Task X.Y..."

- [ ] **Step 2: Commit**

```bash
git add skills/dispatcher/SKILL.md
git commit -m "add: dispatcher skill"
```

---

### Task 9: Gate-checker skill

**Files:**
- Create: `skills/gate-checker/SKILL.md`

- [ ] **Step 1: Write skills/gate-checker/SKILL.md**

Frontmatter: `name: gate-checker`

Content: Phase gate evaluation. Sections:

**Gate checklist (run in order, block on first failure):**
- Check 1 — Task completion: every task in phase has all acceptance criteria checked. If any unchecked → report which task + criterion → BLOCKED.
- Check 2 — Test suite: ask user to run test suite and share output. If failing → dispatch `qa-engineer` to fix → re-run gate.
- Check 3 — Code reviewer sign-off: invoke `code-reviewer` with "Phase N gate review — review all code changed this phase." If CRITICAL or HIGH findings → dispatch specialist to fix → re-run. LOW/INFO → log, proceed.
- Check 4 — Security sign-off (required if phase includes auth/data/APIs): invoke `security-engineer` with "Phase N security gate — review new endpoints, auth, data handling." If CRITICAL → BLOCKED. If clean → proceed.

**Gate PASSED message:** "Phase N gate passed. All tasks complete, tests passing, reviewers signed off. Proceeding to Phase N+1." Then invoke `dispatcher` for Phase N+1.

**Gate BLOCKED message:** "Phase N gate BLOCKED. Reason: [specific failure]. Address this before I can proceed." Wait for user confirmation, then re-run gate.

- [ ] **Step 2: Commit**

```bash
git add skills/gate-checker/SKILL.md
git commit -m "add: gate-checker skill"
```

---

### Task 10: Auditor skill

**Files:**
- Create: `skills/auditor/SKILL.md`

- [ ] **Step 1: Write skills/auditor/SKILL.md**

Frontmatter: `name: auditor`

Content: Codebase health scan. Sections:

**Detection phase — scan for:**
- Tech stack: package.json (Node/JS/TS), pyproject.toml/requirements.txt (Python), go.mod (Go), Cargo.toml (Rust), pom.xml/build.gradle (Java/Kotlin), pubspec.yaml (Flutter), *.xcodeproj/Package.swift (Swift/iOS)
- Architecture patterns: src/, app/, lib/, internal/, pkg/ dirs; controllers/services/repositories/models (MVC); features/ or domain dirs (DDD); Dockerfile/docker-compose/k8s/ (containerized); *.tf/cdk.json/serverless.yml (IaC)
- Test coverage: look for __tests__/, tests/, spec/, *.test.*, *.spec.*; coverage config; coverage/lcov.info summary if present
- Security surface: .env files (never committed); auth middleware; raw SQL string concatenation; eval()/exec() patterns
- Dependency health: count deps in manifest; flag obviously outdated major versions

**Health report format:**
```
🔍 Unicron Health Report
========================
📦 Tech Stack: Runtime, Framework, Database, Testing
🏗️ Architecture: Pattern, Entry point, Key modules, ⚠️ Concerns (files >800 lines)
🧪 Test Coverage: Test file count, Coverage %, ⚠️ Gaps (dirs with no tests)
🔐 Security Surface: Auth detected, .env status, ⚠️ Risks
📚 Dependencies: Total count, ⚠️ Flags
Overall health: 🟢 Good / 🟡 Needs attention / 🔴 Critical issues found
```

After report: return control to main `unicron` skill to ask what user wants to work on.

- [ ] **Step 2: Commit**

```bash
git add skills/auditor/SKILL.md
git commit -m "add: auditor skill"
```

---

## Phase 3: Agent Files

### Task 11: CTO Orchestrator agent

**Files:**
- Create: `agents/cto.md`

- [ ] **Step 1: Write agents/cto.md**

Frontmatter: `name: cto`, `description: "Unicron CTO orchestrator. Reads spec + plan, assembles specialist mini-teams per task, dispatches in parallel where possible, runs phase gates, surfaces blockers. Never writes code directly."`

Content sections:
- **Operating Principles:** Never write code. Spec is law. Blockers surface immediately. Parallel > sequential. Acceptance criteria are binary.
- **Dispatch Decision Framework:** Table of conditions → which agents to add (data layer change → database-admin; new API → backend-dev + security-engineer; UI change → ux-designer then frontend-dev; deployment impact → devops-sre; first task of kind in phase → solutions-architect; last before gate → always code-reviewer)
- **Reporting Format:** After each task: Task [id], Status, Agents used, Criteria met N/M, Next task
- **On Completion:** Summary of what was built + suggested next steps (audit, plan review, v2 scoping)

- [ ] **Step 2: Commit**

```bash
git add agents/cto.md
git commit -m "add: CTO orchestrator agent"
```

---

### Task 12: Design + UI agents

**Files:**
- Create: `agents/solutions-architect.md`
- Create: `agents/ux-designer.md`
- Create: `agents/frontend-dev.md`

- [ ] **Step 1: Write agents/solutions-architect.md**

Frontmatter: `name: solutions-architect`

Sections:
- **Responsibilities:** Choose architecture pattern for the requirement; define service boundaries and interface contracts; select design patterns; write Architecture Decision Records (ADRs); review implementations for architectural drift
- **Output Format:** (1) Architecture overview with Mermaid diagram + rationale; (2) Interface contracts; (3) Design patterns table; (4) ADR for significant decisions
- **Constraints:** Prefer battle-tested patterns. Design for spec scale, not hypothetical. Optimize for developer understandability. Every interface must be implementable without further clarification.

- [ ] **Step 2: Write agents/ux-designer.md**

Sections:
- **Responsibilities:** Map user flows; define component states (empty/loading/error/success); specify accessibility (ARIA, keyboard nav, contrast); define information architecture; identify UX risks
- **Output Format:** (1) User flow as Mermaid flowchart; (2) Component inventory with states; (3) Interaction spec per component; (4) Accessibility notes; (5) Open questions
- **Constraints:** Describe behavior not visual style. Each component maps to single testable unit. Prefer progressive disclosure. Flag any flow > 3 steps.

- [ ] **Step 3: Write agents/frontend-dev.md**

Sections:
- **Responsibilities:** Implement components from ux-designer spec; state management; routing; accessibility; performance (bundle, render, lazy loading); component tests
- **Output Format:** (1) Component files — complete implementation; (2) Tests — render, interaction, accessibility; (3) Deviation notes
- **Constraints:** Follow exact folder structure from spec. Use specified state management library. Every component needs ≥1 test. No `any` in TypeScript. Semantic HTML. No inline styles.

- [ ] **Step 4: Commit**

```bash
git add agents/solutions-architect.md agents/ux-designer.md agents/frontend-dev.md
git commit -m "add: solutions-architect, ux-designer, frontend-dev agents"
```

---

### Task 13: Backend + Data agents

**Files:**
- Create: `agents/backend-dev.md`
- Create: `agents/mobile-dev.md`
- Create: `agents/database-admin.md`

- [ ] **Step 1: Write agents/backend-dev.md**

Sections:
- **Responsibilities:** Implement API endpoints per contracts in spec; service layer business logic; middleware (auth, rate limiting, logging, error handling); third-party integrations; unit + integration tests
- **Output Format:** (1) Route/handler files with input validation; (2) Service files; (3) Tests; (4) Migration flag to database-admin if schema change needed
- **Constraints:** Validate all input at boundary. No hardcoded secrets. Every endpoint needs a test. Errors return structured responses — never expose stack traces. Follow repository pattern. Log errors with context, never swallow silently.

- [ ] **Step 2: Write agents/mobile-dev.md**

Sections:
- **Responsibilities:** Implement screens per ux-designer specs; integrate with backend APIs; handle offline state + sync + local storage; push notifications; platform permissions; component + integration tests; app store prep
- **Constraints:** Follow platform HIG (Apple) / Material Design (Android). Test on both platforms if cross-platform. No sensitive data in plain text on device. Handle all network error states. Every screen handles loading/empty/error/success states.

- [ ] **Step 3: Write agents/database-admin.md**

Sections:
- **Responsibilities:** Design normalized schemas from data models in spec; write migration files (up + down) for all schema changes; add indexes for query patterns in spec; review slow queries; define constraints/foreign keys/cascades; advise on connection pooling + replication + backup
- **Output Format:** (1) Migration file — timestamped with up + down; (2) Index recommendations with query justification; (3) Integrity constraints; (4) Query examples for common access patterns
- **Constraints:** Always provide down migration. Never drop a column without confirming no code references it. Index every foreign key. Never SELECT * in production. Flag table locks on large tables for off-peak scheduling.

- [ ] **Step 4: Commit**

```bash
git add agents/backend-dev.md agents/mobile-dev.md agents/database-admin.md
git commit -m "add: backend-dev, mobile-dev, database-admin agents"
```

---

### Task 14: Quality + Security + Ops agents

**Files:**
- Create: `agents/qa-engineer.md`
- Create: `agents/security-engineer.md`
- Create: `agents/devops-sre.md`

- [ ] **Step 1: Write agents/qa-engineer.md**

Sections:
- **Responsibilities:** Unit tests for all business logic; integration tests for all API endpoints; E2E tests for critical user flows; fill test gaps; define 80% minimum coverage threshold; set up coverage reporting in CI
- **Output Format:** (1) Unit tests — happy path + edge cases + error cases per function; (2) Integration tests — valid/invalid/auth-fail/not-found per endpoint; (3) E2E tests — full user journey; (4) Coverage report after adding tests
- **Constraints:** Tests must be independent. Use factories for test data — never hardcode IDs. Mock external services at boundary. Every acceptance criterion maps to ≥1 test. Tests must run in under 60 seconds total — flag slow tests.

- [ ] **Step 2: Write agents/security-engineer.md**

Sections:
- **Responsibilities:** Review auth + authorization; OWASP Top 10 check on all new endpoints; verify no hardcoded secrets; review rate limiting; check encryption at rest + in transit; validate input sanitization; review new dependency CVEs
- **OWASP Top 10 Checklist** (10 items — write all 10 as checkboxes): Broken access control, Cryptographic failures, Injection, Insecure design, Security misconfiguration, Vulnerable components, Auth failures, Data integrity failures, Logging failures, SSRF
- **Output Format:** Findings table (Severity CRITICAL/HIGH/MEDIUM/LOW | Issue | Location | Fix) + explicit APPROVED or BLOCKED sign-off
- **Gate Authority:** CRITICAL finding → blocks gate. CTO cannot proceed until APPROVED issued.

- [ ] **Step 3: Write agents/devops-sre.md**

Sections:
- **Responsibilities:** CI/CD pipeline (GitHub Actions/GitLab CI/CircleCI — per spec); IaC (Terraform/CDK/Pulumi — per spec); containerization (Dockerfile/compose/K8s — per spec); monitoring + logging + alerting (Datadog/Grafana/CloudWatch — per spec); deployment strategy (blue-green/canary/rolling — per scale); environment management (dev/staging/prod); secret management
- **Output Format:** (1) Pipeline config file; (2) IaC files; (3) Runbook — deploy, rollback, debug; (4) Monitoring setup — dashboards, alert thresholds
- **Constraints:** All deployments automated — no manual prod pushes. Secrets in secret manager, never in config files. Every service needs a health check endpoint. Rollback achievable in < 5 minutes. Production logs must not contain PII.

- [ ] **Step 4: Commit**

```bash
git add agents/qa-engineer.md agents/security-engineer.md agents/devops-sre.md
git commit -m "add: qa-engineer, security-engineer, devops-sre agents"
```

---

### Task 15: Support agents

**Files:**
- Create: `agents/technical-writer.md`
- Create: `agents/product-analyst.md`
- Create: `agents/code-reviewer.md`

- [ ] **Step 1: Write agents/technical-writer.md**

Sections:
- **Responsibilities:** README.md with setup/usage/contribution guide; API docs from route definitions (OpenAPI format where applicable); inline docs for complex functions; changelogs from git history; onboarding guides; runbooks
- **Output Format:** (1) README; (2) API docs — per endpoint: description/request/response/auth/example; (3) Inline docs — JSDoc/docstring for public interfaces; (4) CHANGELOG.md grouped by version (Added/Changed/Fixed/Removed); (5) Runbook if devops work in phase
- **Constraints:** Check actual implementation, not just spec. Every code example must be runnable. README setup must work from clean environment. API docs must match actual behavior.

- [ ] **Step 2: Write agents/product-analyst.md**

Sections:
- **Responsibilities:** Refine vague requirements into concrete testable acceptance criteria; define success metrics per feature; decompose large user stories; identify requirement conflicts before implementation; define analytics events for measuring feature success
- **Output Format:** (1) Refined requirements — original → concrete testable version; (2) Acceptance criteria — numbered binary; (3) Success metrics — what to measure + baseline + target; (4) Analytics events — name/properties/trigger
- **Constraints:** Every AC testable by QA without interpretation. Success metrics measurable with existing tooling. Ambiguous requirements resolved before passing to engineering. Stories sliced to single task dispatch.

- [ ] **Step 3: Write agents/code-reviewer.md**

Sections:
- **Responsibilities:** Review all code changed in a task for quality/clarity/correctness; check pattern consistency with spec architecture; identify DRY violations; flag cyclomatic complexity > 10; ensure error handling complete; verify tests cover behavior not just lines; check naming consistency
- **Severity table:** CRITICAL (bug, security, data loss) → block; HIGH (arch drift, no error handling, no tests) → block; MEDIUM (DRY violation, complexity, naming) → fix if time, log as tech debt; LOW (style, minor clarity) → note only
- **Output Format:** Finding table (Severity | File:Line | Issue | Suggested fix) + APPROVED or BLOCKED sign-off
- **Gate Authority:** Signs off on every phase gate. CRITICAL or HIGH → gate BLOCKED. MEDIUM/LOW → logged but do not block.
- **Review Checklist:** every function < 50 lines; every file < 800 lines; no debug console.log; all error paths handled; no hardcoded values; tests exist for all new code; no TODO/FIXME uncommitted; imports organized

- [ ] **Step 4: Commit**

```bash
git add agents/technical-writer.md agents/product-analyst.md agents/code-reviewer.md
git commit -m "add: technical-writer, product-analyst, code-reviewer agents"
```

---

## Phase 4: Platform Adapters

### Task 16: Claude Code adapter

**Files:**
- Create: `adapters/claude-code/templates/claude-md-injection.md`
- Create: `adapters/claude-code/generate.js`

- [ ] **Step 1: Write claude-md-injection.md**

Content: A markdown section titled "## Unicron — Full SDLC AI Agent System" covering:
- One-line description of Unicron
- Commands table (all 8 `/unicron*` commands with descriptions)
- Available agents list (all 13 names)
- Skill invocation instructions: `Skill({ skill: "unicron" })` for main, `Skill({ skill: "unicron:investigate" })` etc. for sub-skills
- Note that skills auto-load from `~/.claude/skills/unicron/`

- [ ] **Step 2: Write adapters/claude-code/generate.js**

The `generate(unicronRoot, homeDir)` function must:
1. Create `~/.claude/skills/unicron/` and copy all files from `unicronRoot/skills/` recursively
2. Create `~/.claude/agents/` and copy all files from `unicronRoot/agents/` recursively
3. Read `adapters/claude-code/templates/claude-md-injection.md`
4. Read `~/.claude/CLAUDE.md` (create if absent)
5. If injection marker `<!-- unicron-start -->` already present: replace content between markers
6. If not present: append `\n\n<!-- unicron-start -->\n{injection}\n<!-- unicron-end -->\n`
7. Write updated CLAUDE.md
8. Log each step with `console.log`

Use only Node.js built-in `fs` module — no dependencies.

- [ ] **Step 3: Commit**

```bash
git add adapters/claude-code/
git commit -m "add: Claude Code platform adapter"
```

---

### Task 17: Gemini CLI adapter

**Files:**
- Create: `adapters/gemini/templates/gemini-extension.json`
- Create: `adapters/gemini/templates/gemini-md-injection.md`
- Create: `adapters/gemini/generate.js`

- [ ] **Step 1: Write gemini-extension.json**

```json
{
  "name": "unicron",
  "description": "Full SDLC AI agent system: investigate → spec → plan → build with a 13-agent IT department",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md"
}
```

- [ ] **Step 2: Write gemini-md-injection.md**

Content: Section "## Unicron — Full SDLC AI Agent System" covering:
- activate_skill invocations for each unicron skill (unicron, investigate, spec-writer, planner, dispatcher, auditor)
- Available agents list
- Natural language triggers ("Start unicron", "Run a unicron audit", "Investigate this project with unicron")

- [ ] **Step 3: Write adapters/gemini/generate.js**

`generate(unicronRoot, homeDir)` must:
1. Copy skills/ to `~/.gemini/skills/unicron/` recursively
2. Copy agents/ to `~/.gemini/agents/` recursively
3. Write `gemini-extension.json` to `~/.gemini/unicron-extension.json`
4. Read injection template, apply same marker-based injection/update logic to `~/.gemini/GEMINI.md`
5. Log each step

- [ ] **Step 4: Commit**

```bash
git add adapters/gemini/
git commit -m "add: Gemini CLI platform adapter"
```

---

### Task 18: Copilot + Codex adapters

**Files:**
- Create: `adapters/copilot/templates/copilot-injection.md`
- Create: `adapters/copilot/generate.js`
- Create: `adapters/codex/templates/agents-injection.md`
- Create: `adapters/codex/generate.js`

- [ ] **Step 1: Write copilot-injection.md**

Content (always-on context — no tool invocation): Full Unicron workflow description including:
- On `/unicron`: check spec.md → resume vs fresh; fresh+existing code → scan+report+ask; fresh+empty → investigate
- Investigation → Spec approval → Plan approval → Build loop
- Commands table
- Specialist roster (all 13 with one-line role descriptions)
- Key file paths: docs/unicron/spec.md, docs/unicron/plan.md, .unicron/config.yaml

Wrap in HTML comments: `<!-- UNICRON: Full SDLC AI Agent System -->` ... `<!-- END UNICRON -->`

- [ ] **Step 2: Write adapters/copilot/generate.js**

`generate(unicronRoot, baseDir)` must:
1. Ensure `.github/` exists
2. Apply marker-based injection to `.github/copilot-instructions.md` (create if absent)
3. Log completion

Note: Copilot is always-on context injection — no skill files are copied, just the instructions file is updated.

- [ ] **Step 3: Write agents-injection.md for Codex**

Same always-on context approach as Copilot. Compact version covering: workflow summary, specialist roster with one-line roles, key file paths. Wrap in HTML comments.

- [ ] **Step 4: Write adapters/codex/generate.js**

`generate(unicronRoot, baseDir)` must:
1. Apply marker-based injection to `AGENTS.md` in `baseDir` (create if absent)
2. Log completion

- [ ] **Step 5: Commit**

```bash
git add adapters/copilot/ adapters/codex/
git commit -m "add: Copilot and Codex platform adapters"
```

---

## Phase 5: Integration + Documentation

### Task 19: End-to-end smoke test

**Files:**
- Create: `tests/smoke.sh`

- [ ] **Step 1: Write tests/smoke.sh**

Bash script that:
1. Creates a temp home directory with `mktemp -d`
2. Creates `$TEMP_HOME/.claude/` to simulate Claude Code presence
3. Runs `node core/installer.js --home "$TEMP_HOME"` and captures output
4. Asserts: "claude-code done" in output
5. Asserts: `$TEMP_HOME/.claude/CLAUDE.md` exists
6. Asserts: `<!-- unicron-start -->` in CLAUDE.md content
7. Asserts: `$TEMP_HOME/.claude/skills/unicron/` directory exists
8. Loops through all 7 skills (unicron, investigate, spec-writer, planner, dispatcher, gate-checker, auditor) — asserts each SKILL.md present
9. Loops through all 13 agents — asserts each .md file present
10. Removes temp directory
11. Prints "=== All smoke tests passed ===" on success or exits 1 on failure

- [ ] **Step 2: Make executable**

```bash
chmod +x tests/smoke.sh
```

- [ ] **Step 3: Run smoke test**

```bash
bash tests/smoke.sh
```

Expected: All assertions pass, final line "=== All smoke tests passed ==="

- [ ] **Step 4: Run unit tests**

```bash
npm test
```

Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add tests/smoke.sh
git commit -m "add: end-to-end smoke test"
```

---

### Task 20: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

Sections:
1. **Header** — name + one-line description
2. **Install** — `npx unicron init` and `curl | sh` commands
3. **Usage** — what happens on greenfield vs existing codebase
4. **Commands table** — all 8 `/unicron*` commands
5. **The Agents table** — all 13 agents with role descriptions
6. **SDLC Flow** — ASCII flowchart: /unicron → Investigation → Spec approval → Plan approval → CTO dispatch loop (task → mini-team → parallel dispatch → verify criteria → phase gate) → Complete
7. **Supported Platforms table** — Claude Code / Gemini CLI / Copilot / Codex with how each works
8. **Adding a New Platform** — 3-step guide: create adapters/<platform>/generate.js, create templates/, re-run npx unicron init
9. **License** — MIT

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "add: README with install, usage, and platform docs"
```

---

## Self-Review

### Spec coverage

| Spec functional requirement | Task |
|---|---|
| Universal install with platform detection | Task 1, Task 3 |
| `/unicron` greenfield + existing codebase modes | Task 4 |
| Investigation loop: 5 required Q + confidence scoring | Task 5 |
| Live context panel after every answer | Task 5 |
| 14-section spec generation + review gate | Task 6 |
| Phased plan decomposition + review gate | Task 7 |
| CTO orchestrator dispatch loop | Task 8 |
| Phase gate evaluation | Task 9 |
| Codebase health scan / auditor | Task 10 |
| CTO agent (orchestrator) | Task 11 |
| solutions-architect, ux-designer, frontend-dev | Task 12 |
| backend-dev, mobile-dev, database-admin | Task 13 |
| qa-engineer, security-engineer, devops-sre | Task 14 |
| technical-writer, product-analyst, code-reviewer | Task 15 |
| Claude Code adapter | Task 16 |
| Gemini adapter | Task 17 |
| Copilot + Codex adapters | Task 18 |
| Agent registry (registry.yaml) | Task 2 |
| End-to-end installation verification | Task 19 |
| README documentation | Task 20 |

All 14 functional requirements covered. ✓

### Placeholder scan
No TBD, TODO, or placeholder steps. ✓

### Naming consistency
- `detectPlatforms(baseDir)` — used in installer.js and installer.test.js ✓
- `writeConfig(platforms, baseDir)` — exported from installer.js, tested in installer.test.js ✓
- `generate(unicronRoot, baseDir)` — same signature across all 4 adapter generators ✓
- `PLATFORMS` — exported constant, consumed in tests ✓
- `<!-- unicron-start -->` / `<!-- unicron-end -->` — same markers in all 4 adapter generators ✓
- Skill file names match directory names match frontmatter `name:` values ✓
- Agent filenames match `skill_file` values in registry.yaml ✓
