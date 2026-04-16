# Unicron

Full SDLC AI agent system — installs on Claude Code, Gemini CLI, GitHub Copilot, and OpenAI Codex in one command.

![Claude Code](https://img.shields.io/badge/Claude%20Code-supported-blue)
![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-supported-blue)
![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-supported-blue)
![OpenAI Codex](https://img.shields.io/badge/OpenAI%20Codex-supported-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Install

**Via npx (recommended):**

```bash
npx unicron init
```

**Via install script:**

```bash
curl -fsSL https://unicron.sh/install | sh
```

Unicron auto-detects which AI platforms are present on your machine and installs the appropriate adapters. No configuration required.

---

## Usage

**Greenfield project** — run `/unicron` in a new, empty repository. Unicron launches an investigation loop, drafts a spec, generates a full implementation plan, and begins dispatching tasks to specialist agents.

**Existing codebase** — run `/unicron` inside an existing repo. Unicron audits the codebase, identifies gaps, and resumes or begins the SDLC at the appropriate phase.

**Standard loop** after installation:

1. `/unicron:investigate` — gather requirements, constraints, and unknowns
2. `/unicron:spec` — review or regenerate the product spec
3. `/unicron:plan` — review or regenerate the implementation plan
4. `/unicron:dispatch` — dispatch the next task to the right specialist agent

---

## Commands

| Command | Description |
|---------|-------------|
| `/unicron` | Start or resume the full SDLC from current project state |
| `/unicron:investigate` | Launch the investigation loop to gather requirements and unknowns |
| `/unicron:spec` | View or generate the product spec (`docs/unicron/spec.md`) |
| `/unicron:plan` | View or generate the implementation plan (`docs/unicron/plan.md`) |
| `/unicron:dispatch` | Dispatch the next task (or a specified task) to specialist agents |
| `/unicron:status` | Show current phase, active agents, progress, and blockers |
| `/unicron:audit` | Generate a codebase health report |
| `/unicron:agent <name>` | Invoke a named specialist agent directly |

---

## The Agents

| Agent | Role |
|-------|------|
| `cto` | Orchestrator — drives the SDLC, routes tasks, resolves blockers |
| `solutions-architect` | System design, architecture decisions, and tech stack selection |
| `ux-designer` | User experience, wireframes, and interaction design |
| `frontend-dev` | UI implementation, components, and client-side logic |
| `backend-dev` | APIs, business logic, and server-side implementation |
| `mobile-dev` | iOS, Android, and cross-platform mobile development |
| `database-admin` | Schema design, migrations, queries, and data modeling |
| `qa-engineer` | Test plans, test implementation, and quality gates |
| `security-engineer` | Threat modeling, vulnerability review, and secure coding |
| `devops-sre` | CI/CD pipelines, infrastructure, and reliability |
| `technical-writer` | Documentation, changelogs, and API reference |
| `product-analyst` | Requirements analysis, metrics, and product decisions |
| `code-reviewer` | Code review, refactoring suggestions, and standards enforcement |

---

## SDLC Flow

```
/unicron
    |
    v
Investigation
(gather requirements, unknowns, constraints)
    |
    v
Spec review
(docs/unicron/spec.md)
    |
    v
Plan review
(docs/unicron/plan.md)
    |
    v
+----------------------------------+
|        CTO dispatch loop         |
|                                  |
|  next task                       |
|    |                             |
|    v                             |
|  mini-team assembled             |
|    |                             |
|    v                             |
|  parallel specialist agents      |
|    |                             |
|    v                             |
|  verify acceptance criteria      |
|    |                             |
|    v                             |
|  phase gate check                |
|    |                             |
|    +-- more tasks? loop ---------+
|
    |
    v
Complete
```

---

## Supported Platforms

| Platform | Detection | Integration |
|----------|-----------|-------------|
| Claude Code | `~/.claude/` exists | Copies skills + agents to `~/.claude/`; injects unicron context block into `CLAUDE.md` |
| Gemini CLI | `~/.gemini/` exists | Copies skills + agents to `~/.gemini/`; injects context into Gemini system prompt config |
| GitHub Copilot | `.github/copilot-instructions.md` exists | Appends unicron agent instructions to `copilot-instructions.md` |
| OpenAI Codex | `AGENTS.md` exists in home | Appends unicron agent manifest to `AGENTS.md` |

---

## Adding a New Platform

1. **Create the adapter** at `adapters/<platform>/generate.js`. Export a single `generate(unicronRoot, homeDir)` async function that copies the relevant skills/agents and injects the unicron context into the platform's config file.

2. **Add templates** under `adapters/<platform>/templates/`. Place any static injection snippets (e.g., `<platform>-injection.md`) here so `generate.js` can read them at install time.

3. **Re-run the installer** to apply the new adapter:

	```bash
	npx unicron init
	```

	Unicron will detect the platform and invoke your new adapter automatically.

---

## License

MIT
