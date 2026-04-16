## Unicron — 完整 SDLC AI Agent 系统

Unicron 已安装。使用 `activate_skill` 激活技能。

### 技能激活（Gemini CLI）

```
activate_skill("unicron")           // 主入口点
activate_skill("unicron:investigate")
activate_skill("unicron:spec-writer")
activate_skill("unicron:planner")
activate_skill("unicron:dispatcher")
activate_skill("unicron:auditor")
```

### 可用 Agents

cto, solutions-architect, ux-designer, frontend-dev, backend-dev, mobile-dev, database-admin, qa-engineer, security-engineer, devops-sre, technical-writer, product-analyst, code-reviewer

### 命令

| 命令 | 功能 |
|---|---|
| `/unicron` | 开始或恢复完整的 SDLC 工作流 |
| `/unicron:investigate` | 运行调查循环 |
| `/unicron:spec` | 查看或生成项目规格说明 |
| `/unicron:plan` | 查看或生成实施计划 |
| `/unicron:dispatch` | 触发下一个 Agent 任务调度 |
| `/unicron:status` | 显示当前阶段和进度 |
| `/unicron:audit` | 运行独立的代码库健康报告 |
| `/unicron:agent <name>` | 直接调用专家 |
| `/unicron:remember <note>` | 手动保存记忆条目 |
| `/unicron:forget <topic>` | 查找并删除匹配的记忆条目 |
| `/unicron:memory` | 显示该项目及全局的所有记忆条目 |

### 自然语言触发器

- "启动 unicron" → 激活主 unicron 技能
- "运行 unicron 审计" → 激活 auditor 技能
- "用 unicron 调查这个项目" → 激活 investigate 技能
- "用 unicron 编写规格说明" → 激活 spec-writer 技能
