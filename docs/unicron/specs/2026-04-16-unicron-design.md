# Unicron — Full SDLC AI Agent System
_Generated: 2026-04-16 | Status: Draft_

---

## 1. Goals

Unicron is a cross-platform AI agent system that guides any software project through the complete Software Development Lifecycle — from first idea to deployed, production-ready code. It installs in seconds on Claude Code, Gemini CLI, Copilot, and Codex via a single universal installer. Once installed, a system of 13 agents operates like a full IT department: 1 CTO orchestrator who reads a shared spec and plan, assembles the right mini-team per task, dispatches agents in parallel where possible, and gates progress at each phase — backed by 12 on-demand specialists covering every engineering discipline. Success means any developer — solo or team — can run `/unicron` and have a full engineering organization working on their behalf, end-to-end.

---

## 2. Users & Personas

- **Solo developer** — wants to ship production-quality software without the overhead of an entire team; Unicron acts as every role they can't fill alone
- **Small startup team** — wants consistent engineering practices, a shared spec/plan, and automated quality gates without hiring specialists
- **Agency developer** — runs multiple client projects; Unicron provides a repeatable, high-quality SDLC for each one
- **Open source maintainer** — wants architecture review, security auditing, and doc generation without manual effort
- **Enterprise engineer** — needs a compliant, auditable SDLC with explicit design pattern decisions and gate checks between phases

---

## 3. Functional Requirements

1. A single install command (`npx unicron init` or `curl -fsSL https://unicron.sh/install | sh`) detects all present AI platforms and installs the appropriate adapters for each.
2. `/unicron` on a greenfield project starts the investigation loop; on an existing codebase it runs a silent scan and presents a health report first.
3. The investigation loop asks a minimum of 5 required questions, then uses confidence scoring across 6 dimensions to determine if follow-up questions are needed before writing the spec.
4. After every investigation answer, Unicron displays a live context panel showing its current understanding and identified gaps.
5. Unicron generates a full spec (`docs/unicron/spec.md`) covering goals, personas, functional/non-functional requirements, architecture, design patterns, data models, API contracts, folder structure, tech stack, integrations, constraints, acceptance criteria, and out-of-scope items.
6. The spec is reviewed by the user before any planning begins; Unicron waits for explicit approval.
7. Unicron generates a phased implementation plan (`docs/unicron/plan.md`) with tasks decomposed into context-window-sized units, each with explicit agent assignments, dependencies, and acceptance criteria.
8. The CTO orchestrator reads the registry and assembles a dynamic mini-team of specialists per task, dispatching in parallel where dependencies allow.
9. Phase gates enforce that all tasks in a phase pass, tests pass, and the code-reviewer and security-engineer sign off before the next phase begins.
10. All 13 agents (CTO + 12 specialists) are invokable directly via `/unicron:agent <name>`.
11. `/unicron:status` shows current SDLC phase, active agents, task completion progress, and any blockers.
12. `/unicron:audit` runs a standalone codebase health report (architecture, code quality, security, test coverage) without starting a full SDLC cycle.
13. The Agent Registry (`registry.yaml`) is the single source of truth for all agent capabilities, triggers, and platform compatibility.
14. Adding a new platform adapter requires only a new `adapters/<platform>/` directory — zero changes to canonical skills or agents.

---

## 4. Non-Functional Requirements

- **Cross-platform:** Works on Claude Code, Gemini CLI, GitHub Copilot, and OpenAI Codex from day one.
- **Installable in < 60 seconds:** The installer is idempotent and safe to re-run.
- **Context-efficient:** Skills are loaded on-demand, not injected wholesale into every conversation. Always-on platforms (Copilot, Codex) receive a compact system context, not full skill content.
- **Offline-capable:** All skills and agents are local files after install. No network calls required at runtime.
- **Extensible:** New agents and skills follow the same file + registry pattern. Community contributions are drop-in.
- **Auditable:** Spec and plan are committed to git. Every agent action is traceable to a task in the plan.

---

## 5. Architecture

**Pattern: Layered Plugin Architecture with Runtime Registry**

Unicron is organized into four layers:

```
┌─────────────────────────────────────────────────────┐
│  Entry Layer       /unicron commands, platform hooks │
├─────────────────────────────────────────────────────┤
│  Orchestration     CTO agent + registry.yaml         │
├─────────────────────────────────────────────────────┤
│  Specialist Pool   13 agent skill files              │
├─────────────────────────────────────────────────────┤
│  Adapter Layer     Claude Code / Gemini / Copilot / Codex │
└─────────────────────────────────────────────────────┘
```

The entry layer receives user commands and routes to the orchestration layer. The CTO orchestrator consults the registry to select and dispatch specialists. Specialists operate on the shared spec/plan context. The adapter layer handles platform-specific installation and invocation — it never affects the layers above it.

---

## 6. Design Patterns

| Pattern | Applied To | Rationale |
|---|---|---|
| **Registry Pattern** | Agent discovery and dispatch | Decouples orchestrator from hardcoded agent list; new agents are registered, not wired |
| **Strategy Pattern** | Platform adapters | Each platform is a strategy implementing the same adapter interface |
| **Chain of Responsibility** | SDLC phases and gate checks | Each phase gate decides to pass or block before the next phase starts |
| **Observer Pattern** | Task completion and phase transitions | CTO watches task state; triggers gate checks and next-phase dispatch automatically |
| **Template Method** | Investigation loop | Fixed skeleton (5 required questions) with adaptive extension (confidence scoring) |
| **Facade Pattern** | `/unicron` entry point | Hides the complexity of orchestration, registry lookup, and dispatch behind a single command |
| **Specification Pattern** | Acceptance criteria | Each task's done condition is a testable specification agents evaluate against |

---

## 7. Data Models

### Spec (`docs/unicron/spec.md`)
Human-readable markdown. Sections are machine-parseable by agents via heading anchors. Immutable once approved — agents treat it as read-only truth.

### Plan (`docs/unicron/plan.md`)
Structured markdown. Phases → Tasks → Steps. Each task includes: `id`, `phase`, `title`, `description`, `agents[]`, `depends_on[]`, `acceptance_criteria[]`, `status`.

### Agent Registry (`registry.yaml`)

```yaml
agents:
  <name>:
    description: string
    capabilities: string[]
    triggers: string[]        # conditions that make this agent relevant
    works_with: string[]      # agents commonly dispatched alongside this one
    platforms: string[]       # supported platforms
    skill_file: string        # path to agent's SKILL.md
```

### Unicron Config (`.unicron/config.yaml`)

```yaml
version: string
installed_platforms: string[]
project:
  spec: docs/unicron/spec.md
  plan: docs/unicron/plan.md
  current_phase: number
  status: investigating | speccing | planning | building | complete
```

---

## 8. API Contracts

### Command Interface (all platforms)

| Command | Input | Output |
|---|---|---|
| `/unicron` | none | Health report (existing) or investigation start (greenfield) |
| `/unicron:investigate` | none | Investigation loop |
| `/unicron:spec` | none | Current spec content or spec generation trigger |
| `/unicron:plan` | none | Current plan content or plan generation trigger |
| `/unicron:dispatch` | task id (optional) | Agent dispatch for next/specified task |
| `/unicron:status` | none | Phase, active agents, task progress, blockers |
| `/unicron:audit` | none | Codebase health report |
| `/unicron:agent <name>` | agent name | Direct invocation of named specialist |

### Agent Dispatch Contract

Every agent receives a standardized context object:
```
{
  spec: <full spec content>,
  plan: <full plan content>,
  task: <current task object>,
  prior_outputs: <outputs from upstream agents on this task>,
  platform: <current platform name>
}
```

---

## 9. Folder Structure

```
unicron/
├── package.json                  # npx unicron init entry point
├── install.sh                    # curl installer
├── registry.yaml                 # Agent registry — source of truth
├── README.md
│
├── core/
│   └── installer.js              # Platform detection + adapter generation
│
├── skills/
│   ├── unicron/
│   │   └── SKILL.md              # Main entry point skill
│   ├── investigate/
│   │   └── SKILL.md              # Investigation loop
│   ├── spec-writer/
│   │   └── SKILL.md              # Spec generation
│   ├── planner/
│   │   └── SKILL.md              # Plan decomposition
│   ├── dispatcher/
│   │   └── SKILL.md              # Agent dispatch logic
│   ├── gate-checker/
│   │   └── SKILL.md              # Phase gate evaluation
│   └── auditor/
│       └── SKILL.md              # Codebase health scan
│
├── agents/
│   ├── cto.md
│   ├── solutions-architect.md
│   ├── ux-designer.md
│   ├── frontend-dev.md
│   ├── backend-dev.md
│   ├── mobile-dev.md
│   ├── database-admin.md
│   ├── qa-engineer.md
│   ├── security-engineer.md
│   ├── devops-sre.md
│   ├── technical-writer.md
│   ├── product-analyst.md
│   └── code-reviewer.md
│
├── adapters/
│   ├── claude-code/
│   │   ├── generate.js           # Generates Claude Code adapter files
│   │   └── templates/
│   ├── gemini/
│   │   ├── generate.js
│   │   └── templates/
│   ├── copilot/
│   │   ├── generate.js
│   │   └── templates/
│   └── codex/
│       ├── generate.js
│       └── templates/
│
└── docs/
    └── unicron/
        └── specs/
            └── 2026-04-16-unicron-design.md
```

---

## 10. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Installer / CLI | Node.js + vanilla JS | Zero dependencies; `npx` runs it natively; no build step |
| Skill files | Markdown | Universal format all AI platforms parse natively |
| Agent files | Markdown | Same — consistent with skill format |
| Registry | YAML | Human-readable, widely supported, easy to diff in git |
| Config state | YAML | Same |
| Platform adapters | Node.js (generate.js) | Runs at install time only; generates static files |
| Spec / Plan output | Markdown | Git-friendly, human-readable, AI-parseable |

---

## 11. Integrations

| Integration | How |
|---|---|
| Claude Code | `Skill` tool invocation + `CLAUDE.md` injection + subagent dispatch |
| Gemini CLI | `GEMINI.md` injection + `gemini-extension.json` + `activate_skill` |
| GitHub Copilot | `.github/copilot-instructions.md` injection (always-on context) |
| OpenAI Codex | `AGENTS.md` injection (always-on context) |
| Git | Spec and plan committed at generation; phase gates check git state |

---

## 12. Constraints & Risks

| Item | Detail |
|---|---|
| **Platform API drift** | Copilot and Codex instruction formats may change; adapters must be versioned independently |
| **Context window limits** | Always-on platforms (Copilot, Codex) receive compact system context — full skills cannot be injected; some capability is reduced vs. tool-invocation platforms |
| **Registry staleness** | If an agent skill file is updated but the registry isn't, the CTO may dispatch incorrectly — registry must be the source of truth, validated at install time |
| **Spec lock** | Spec is immutable once approved; mid-project changes require explicit `/unicron:spec revise` workflow (out of scope for v1 — spec revision is a known future need) |
| **Parallel agent conflicts** | Two agents modifying the same file in parallel can create conflicts; dispatcher must enforce file-level locking per task |

---

## 13. Acceptance Criteria

1. `npx unicron init` on a machine with Claude Code installed completes in under 60 seconds and `/unicron` is available as a working command.
2. `npx unicron init` on a machine with Gemini CLI installed correctly injects Unicron context into `GEMINI.md`.
3. Running `/unicron` on a greenfield project starts the investigation loop with the first required question.
4. Running `/unicron` on an existing codebase produces a health report before asking anything.
5. The investigation loop correctly identifies low-confidence dimensions and asks targeted follow-up questions.
6. The spec is written to `docs/unicron/spec.md` with all 14 required sections populated (no TBDs or placeholders).
7. Unicron waits for explicit user spec approval before generating the plan.
8. The plan decomposes work into tasks that each have: title, assigned agents, dependencies, and acceptance criteria.
9. The CTO dispatches at least 2 agents in parallel for a task where dependencies allow.
10. A phase gate blocks Phase 2 from starting if any Phase 1 task's acceptance criteria are unmet.
11. `/unicron:agent security-engineer` invokes the security specialist directly without going through the full orchestration loop.
12. Adding a new platform adapter requires zero changes to `skills/`, `agents/`, or `registry.yaml`.

---

## 14. Out of Scope (v1)

- Spec revision workflow after approval (`/unicron:spec revise`)
- Multi-repo / monorepo orchestration
- Unicron Cloud — remote agent execution or hosted dashboard
- Custom agent creation UI
- Real-time collaboration between human developers and Unicron agents
- Billing / usage tracking
- Cursor, Windsurf, or other IDE adapter support (architecture supports it; not built in v1)
