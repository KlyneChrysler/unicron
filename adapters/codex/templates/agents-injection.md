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

## Key Files
- `docs/unicron/spec.md` — immutable approved spec
- `docs/unicron/plan.md` — phased plan
- `.unicron/config.yaml` — phase and status

<!-- END UNICRON -->
