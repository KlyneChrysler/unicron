<!-- UNICRON: Full SDLC AI Agent System -->

Unicron is installed — a full IT department of 13 AI agents for complete SDLC management.

## Unicron Workflow

On `/unicron`:
1. Check for `docs/unicron/spec.md` — if found, resume from current phase
2. If no spec + existing code: scan silently → health report → ask what to work on
3. If no spec + empty directory: begin investigation (5 required questions + confidence scoring)
4. Flow: Investigation → Spec approval → Plan approval → Agent dispatch loop → Phase gates

## Specialists

| Agent | Role |
|---|---|
| cto | Orchestrator |
| solutions-architect | Architecture, patterns, API design |
| ux-designer | User flows, wireframes |
| frontend-dev | UI, components, state |
| backend-dev | APIs, services, business logic |
| mobile-dev | iOS/Android/React Native/Flutter |
| database-admin | Schema, migrations, queries |
| qa-engineer | Unit/integration/E2E tests |
| security-engineer | OWASP, auth, compliance — gates on CRITICAL |
| devops-sre | CI/CD, infra, monitoring |
| technical-writer | Docs, API docs, changelogs |
| product-analyst | Requirements, acceptance criteria |
| code-reviewer | Quality gate — always last |

## Commands

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

## Key Files
- `docs/unicron/spec.md` — immutable approved spec
- `docs/unicron/plan.md` — phased plan
- `.unicron/config.yaml` — phase and status

<!-- END UNICRON -->
