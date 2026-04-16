---
name: planner
description: "Reads the approved spec and decomposes it into a phased implementation plan with mandatory task structure (Implements, Depends on, Files, Agents, Acceptance criteria, Steps). Runs three self-validation checks (granularity, file paths, dependencies) before presenting for approval."
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
| **显式依赖关系** | 每个任务在 `依赖于` 字段中声明前置任务 ID |
| **验收标准** | 每个任务至少有 1 个具体、可检查的完成条件（直接来自规格说明） |
| **Agent 分配** | 每个任务命名注册表中的专家 |
| **文件路径精确** | 每个任务列出精确的文件路径 — 不允许模糊引用 |

## 阶段结构

将任务组织成阶段。每个项目至少包含：

- **阶段 1：基础** — 脚手架、数据库、CI、认证骨架
- **阶段 2：核心功能** — 主要功能需求
- **阶段 3：集成与打磨** — 第三方集成、UX 精化
- **阶段 4：加固** — 安全审查、性能、测试覆盖率、文档

## 任务格式（强制）

每个任务必须使用以下格式，所有字段均为必填：

```markdown
### 任务 N.M — [标题]

**实现：** [规格说明章节编号 + 需求编号，如"§3 需求 4"]
**依赖于：** [前置任务 ID，如"任务 1.2, 任务 1.3"，或"无"]
**文件：**
  - 创建：exact/path/to/file
  - 修改：exact/path/to/file（如已知，注明行号 N–M）
**Agents：** [注册表中的 Agent 名称]

**验收标准：**
- [ ] [直接从规格说明 §13 逐字复制]

**步骤：**
- [ ] [具体步骤]
- [ ] [具体步骤]
```

## 计划页眉

计划文件必须以以下页眉开始：

```markdown
# [项目名称] — 实施计划
_规格说明：docs/unicron/spec.md | 生成日期：YYYY-MM-DD | 状态：进行中_
```

## 阶段关卡格式

每个阶段结束时：

```markdown
## 阶段 N 关卡
- [ ] 阶段 N 所有任务完成
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

## 自我验证（展示给用户之前）

生成计划后，按顺序运行以下检查。**只修改未通过检查的任务，不重写整个计划。最多执行两轮修正。**

### 检查 1：任务粒度
任何步骤列表中包含多个独立交付物（新文件、新端点、新迁移）的任务必须拆分。
信号词：步骤之间出现"然后"、"同时还要"、"另外" = 拆分点。
修正：将违规任务拆分为多个独立任务，更新所有受影响的 `依赖于` 字段。

### 检查 2：文件路径完整性
以下模糊引用必须替换为精确路径：

禁用表达：
- "服务文件" / "组件文件" / "模型文件"
- "控制器" / "配置文件" / "相关文件"
- "现有文件" / "对应文件"

修正：将每个模糊引用替换为精确的文件路径（如 `src/services/auth.js`）。

### 检查 3：依赖一致性
对于每个使用其他任务文件中定义的类型、函数、Schema 或常量的任务，验证该定义任务是否出现在 `依赖于` 字段中。
修正：添加缺失的依赖关系。

### 修正规则
- 仅修改未通过检查的任务，不重写整个计划
- 最多两轮修正
- 若两轮后仍未解决：标注 `⚠ 调度前请确认依赖关系`

## 审查关卡

编写计划并通过自我验证后，说：

> "计划已写入 `docs/unicron/plan.md`。请审查：
> - 阶段顺序是否正确？
> - 是否有任务过大（需要拆分）？
> - Agent 分配是否正确？
>
> 请告知更改，或说"已批准"以开始构建。"

批准后：
1. 提交：`git add docs/unicron/plan.md && git commit -m "add: unicron implementation plan"`
2. 调用 `dispatcher` 技能。
