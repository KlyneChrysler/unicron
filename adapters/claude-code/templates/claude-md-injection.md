## Unicron — 完整 SDLC AI Agent 系统

Unicron 已安装。它为完整的软件开发生命周期提供由 13 个 AI Agent 组成的完整 IT 部门。

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

### 记忆

全局偏好：`~/.unicron/memory/`
项目决策 + 结果：`.unicron/memory/`

### 可用 Agents

cto, solutions-architect, ux-designer, frontend-dev, backend-dev, mobile-dev, database-admin, qa-engineer, security-engineer, devops-sre, technical-writer, product-analyst, code-reviewer

### 技能调用（Claude Code）

```
Skill({ skill: "unicron" })                    // 主入口点
Skill({ skill: "unicron:investigate" })         // 调查循环
Skill({ skill: "unicron:spec-writer" })         // 规格说明生成
Skill({ skill: "unicron:planner" })             // 计划分解
Skill({ skill: "unicron:dispatcher" })          // Agent 调度
Skill({ skill: "unicron:gate-checker" })        // 阶段关卡
Skill({ skill: "unicron:auditor" })             // 健康扫描
```

技能从 `~/.claude/skills/unicron/` 加载。Agents 从 `~/.claude/agents/` 加载。
