---
name: planner
description: "Reads the approved spec and decomposes it into a phased implementation plan with tasks, agent assignments, dependencies, and acceptance criteria. Gets user approval before dispatching."
---

# Unicron 规划器

读取 `docs/unicron/spec.md`。将其分解为分阶段的实施计划。

## 输出文件

写入：`docs/unicron/plan.md`

## 分解规则

| 规则 | 详情 |
|---|---|
| **最大任务规模** | 一个任务适合单个 Agent 上下文窗口（最多约 2000 行代码） |
| **垂直切片** | 每个任务交付一个可工作、可测试的切片 — 而非水平层 |
| **显式依赖关系** | 每个任务声明 `depends_on: [task-id, ...]` |
| **验收标准** | 每个任务至少有 1 个具体、可检查的完成条件 |
| **Agent 分配** | 每个任务命名注册表中的专家 |

## 阶段结构

将任务组织成阶段。每个项目至少包含：

- **阶段 1：基础** — 脚手架、数据库、CI、认证骨架
- **阶段 2：核心功能** — 主要功能需求
- **阶段 3：集成与打磨** — 第三方集成、UX 精化
- **阶段 4：加固** — 安全审查、性能、测试覆盖率、文档

## 计划格式

```markdown
# [项目名称] — 实施计划
_规格说明：docs/unicron/spec.md | 生成日期：YYYY-MM-DD | 状态：进行中_

## 阶段 1：基础

### 任务 1.1 — [标题]
**Agents：** [注册表中的 Agent 名称]
**依赖于：** 无
**描述：** [此任务交付什么]
**步骤：**
- [ ] [具体步骤]
**验收标准：**
- [ ] [可测试条件]

## 阶段 1 关卡
- [ ] 阶段 1 所有任务完成
- [ ] 测试通过（`[测试命令]`）
- [ ] code-reviewer 签署确认
- [ ] security-engineer 签署确认（如果阶段包含认证/数据）
```

## Agent 选择指南

| 任务类型 | 分配的 Agents |
|---|---|
| 新 UI 页面 | ux-designer → frontend-dev → qa-engineer |
| 新 API 端点 | backend-dev + security-engineer → qa-engineer |
| 数据库 Schema | database-admin → backend-dev |
| 认证系统 | solutions-architect → backend-dev + security-engineer → qa-engineer |
| 部署流水线 | devops-sre → security-engineer |
| 新文档 | technical-writer |
| 任何已完成的功能 | code-reviewer（始终最后） |

## 审查关卡

编写计划后，说：

> "计划已写入 `docs/unicron/plan.md`。请审查：
> - 阶段顺序是否正确？
> - 是否有任务过大（需要拆分）？
> - Agent 分配是否正确？
>
> 请告知更改，或说"已批准"以开始构建。"

批准后：
1. 提交：`git add docs/unicron/plan.md && git commit -m "add: unicron implementation plan"`
2. 调用 `dispatcher` 技能。
