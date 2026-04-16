<!-- UNICRON: Full SDLC AI Agent System -->

Unicron 已安装 — 由 13 个 AI Agent 组成的完整 IT 部门，用于完整的 SDLC 管理。

## Unicron 工作流

收到 `/unicron` 时：
1. 检查 `docs/unicron/spec.md` — 如果找到，从当前阶段恢复
2. 如果没有规格说明 + 存在代码：静默扫描 → 健康报告 → 询问要做什么
3. 如果没有规格说明 + 空目录：开始调查（5 个必答问题 + 置信度评分）
4. 流程：调查 → 规格说明批准 → 计划批准 → Agent 调度循环 → 阶段关卡

## 专家

| Agent | 角色 |
|---|---|
| cto | 编排器 |
| solutions-architect | 架构、模式、API 设计 |
| ux-designer | 用户流程、线框图 |
| frontend-dev | UI、组件、状态 |
| backend-dev | API、服务、业务逻辑 |
| mobile-dev | iOS/Android/React Native/Flutter |
| database-admin | Schema、迁移、查询 |
| qa-engineer | 单元测试/集成测试/E2E 测试 |
| security-engineer | OWASP、认证、合规 — CRITICAL 时阻塞关卡 |
| devops-sre | CI/CD、基础设施、监控 |
| technical-writer | 文档、API 文档、变更日志 |
| product-analyst | 需求、验收标准 |
| code-reviewer | 质量关卡 — 始终最后 |

## 命令

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

## 关键文件
- `docs/unicron/spec.md` — 已批准的不可变规格说明
- `docs/unicron/plan.md` — 分阶段计划
- `.unicron/config.yaml` — 阶段和状态

<!-- END UNICRON -->
