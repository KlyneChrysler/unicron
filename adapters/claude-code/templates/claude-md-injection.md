## Unicron — Full SDLC AI Agent System

Unicron is installed. It provides a complete IT department of 13 AI agents for the full software development lifecycle.

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

### Available Agents

cto, solutions-architect, ux-designer, frontend-dev, backend-dev, mobile-dev, database-admin, qa-engineer, security-engineer, devops-sre, technical-writer, product-analyst, code-reviewer

### Skill Invocation (Claude Code)

```
Skill({ skill: "unicron" })                    // main entry point
Skill({ skill: "unicron:investigate" })         // investigation loop
Skill({ skill: "unicron:spec-writer" })         // spec generation
Skill({ skill: "unicron:planner" })             // plan decomposition
Skill({ skill: "unicron:dispatcher" })          // agent dispatch
Skill({ skill: "unicron:gate-checker" })        // phase gate
Skill({ skill: "unicron:auditor" })             // health scan
```

Skills are loaded from `~/.claude/skills/unicron/`. Agents are loaded from `~/.claude/agents/`.
