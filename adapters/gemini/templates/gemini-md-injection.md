## Unicron — Full SDLC AI Agent System

Unicron is installed. Activate skills using `activate_skill`.

### Skill Activation (Gemini CLI)

```
activate_skill("unicron")           // main entry point
activate_skill("unicron:investigate")
activate_skill("unicron:spec-writer")
activate_skill("unicron:planner")
activate_skill("unicron:dispatcher")
activate_skill("unicron:auditor")
```

### Available Agents

cto, solutions-architect, ux-designer, frontend-dev, backend-dev, mobile-dev, database-admin, qa-engineer, security-engineer, devops-sre, technical-writer, product-analyst, code-reviewer

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

### Natural Language Triggers

- "Start unicron" → activates main unicron skill
- "Run a unicron audit" → activates auditor skill
- "Investigate this project with unicron" → activates investigate skill
- "Write a spec with unicron" → activates spec-writer skill
