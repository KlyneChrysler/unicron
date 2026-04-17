# Richer Spec/Plan Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce mandatory section templates and targeted self-validation in `spec-writer` and `planner` so every spec and plan is consistently structured, traceable, and free of vague language.

**Architecture:** Two markdown skill file rewrites. `spec-writer` gains two new sections (Decisions & Rationale, Open Questions), a banned-phrases check, and a measurability check on acceptance criteria. `planner` gains a mandatory `Implements:` field per task, plus three self-validation checks (granularity, file paths, dependencies). Both use targeted correction (patch only failing content, max 2 rounds, `⚠` flag for unresolvable issues).

**Tech Stack:** Markdown only. Verification via grep + smoke test.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `skills/spec-writer/SKILL.md` |
| Modify | `skills/planner/SKILL.md` |

---

### Task 1: Update `skills/spec-writer/SKILL.md`

**Files:**
- Modify: `skills/spec-writer/SKILL.md`

- [ ] **Step 1: Read the current file to understand what's there**

```bash
cat skills/spec-writer/SKILL.md
```

Note the existing 14-section template and self-review block. You are ADDING to it, not replacing it.

- [ ] **Step 2: Write the updated SKILL.md**

Replace the entire contents of `skills/spec-writer/SKILL.md` with:

```markdown
---
name: spec-writer
description: "Generates a 16-section spec from investigation context. Enforces mandatory sections (including Decisions & Rationale and Open Questions), runs banned-phrase and measurability self-validation, gets user approval, commits to git, then invokes the planner skill."
---

# Unicron 规格说明编写器

你已完成调查。现在编写规格说明。

## 输出文件

写入：`docs/unicron/spec.md`

如果 `docs/unicron/` 目录不存在，则创建它。

## 规格说明格式

编写全部 16 个章节。任何章节都不得包含 "TBD"、"TODO" 或占位符文本。无内容的章节写 "无" 而非省略该章节。

```markdown
# [项目名称] — Unicron 规格说明
_生成日期：YYYY-MM-DD | 状态：草稿_

## 1. 目标
[1 段落：这是什么、面向谁、成功是什么样的]

## 2. 用户与用户画像
[项目符号列表：每个画像及其主要待完成工作]

## 3. 功能需求
[编号列表。每个需求是一个以动词开头的可测试陈述。]

## 4. 非功能需求
[性能、安全、合规、可扩展性 — 尽可能提供具体数字]

## 5. 架构
[模式名称、理由、ASCII 或 Mermaid 组件图]

## 6. 设计模式
[表格：模式 | 应用于 | 理由]

## 7. 数据模型
[核心实体、关系、关键字段。对于复杂的内容使用 Mermaid ERD]

## 8. API 契约
[关键端点，包含方法、路径、请求结构、响应结构]

## 9. 目录结构
[目录树，每个目录附一行注释]

## 10. 技术栈
[表格：层级 | 技术 | 理由]

## 11. 集成
[表格：集成 | 连接方式 | 认证方法。无集成时写"无"。]

## 12. 约束与风险
[表格：条目 | 详情 | 缓解措施]

## 13. 验收标准
[编号，可测试。每条映射到一个功能需求。每条必须包含以下至少一项：数字或阈值、HTTP 状态码、命名条件、具体可观察行为。]

## 14. v1 范围外
[明确列出本迭代中不会构建的内容]

## 15. 决策与依据
[每个主要决策 + 驱动该决策的调查发现。格式如下：
- **[决策]：** [做出了什么决定] — 依据：[导致此选择的调查发现]
示例：
- **认证方案：** 使用 24 小时有效期的 JWT — 依据：Q4：无会话存储需求，偏好无状态 API
- **数据库：** PostgreSQL — 依据：Q3：团队已有 Postgres 经验，确认关系型数据模型]

## 16. 待解问题
[调查中未解决的事项 — 明确标注，不做静默假设。无待解问题时写"无"。]
```

## 自我审查（展示给用户之前）

编写后按顺序运行以下检查。**只修改未通过检查的内容，不重写整个文档。最多执行两轮修正。**

### 检查 1：占位符扫描
是否有 "TBD"、"TODO"、"稍后填写"？修复它们。

### 检查 2：章节完整性
所有 16 个章节是否都存在？无内容的章节是否写了"无"而非省略？修复任何缺失章节。

### 检查 3：禁用短语扫描
以下短语出现在规格说明中的任何位置都必须替换为具体陈述：

禁用短语：
- "根据需要" / "视情况而定" / "酌情处理"
- "处理错误" / "处理边缘情况"
- "等等" / "诸如此类"
- "应该快速" / "高性能" / "可扩展"
- "最佳实践" / "适当的" / "合适的" / "正确的"

每次替换：用具体的、可测试的陈述替换模糊短语。

### 检查 4：验收标准可测量性
§13 中的每条验收标准必须包含以下至少一项：
- 数字或阈值（`< 200ms`、`≥ 99.9%`、`至少 3 个`）
- HTTP 状态码（`返回 422`、`响应 200`）
- 命名条件（`当用户未认证时`、`若文件超过 10MB`）
- 具体可观察行为（`按钮被禁用`、`向注册邮箱发送邮件`）

未通过此检查的标准：重写为具体的可验证形式。

### 检查 5：一致性
- §5 中的架构是否与 §10 中的技术栈匹配？
- §9 中的目录结构是否与 §5 中的架构匹配？
- §3 中的所有功能需求是否都可追溯到 §13 中的验收标准？

### 修正规则
- 仅修改未通过检查的句子/标准，不重写整个章节
- 最多两轮修正
- 若两轮后仍未通过：标注 `⚠ 实施前需澄清`

## 审查关卡

编写规格说明并通过自我审查后，说：

> "规格说明已写入 `docs/unicron/spec.md`。请审查它 — 特别检查：
> - §5（架构）是否符合你的愿景
> - §14（范围外）是否正确排除了你暂时不需要的内容
> - §13（验收标准）是否捕捉了你对"完成"的定义
> - §15（决策与依据）是否准确反映了你的选择
>
> 请告知任何更改，或说"已批准"以继续规划。"

等待明确批准。如有需要，应用更改并重新呈现。

## 批准后

1. 提交规格说明：
```bash
git add docs/unicron/spec.md
git commit -m "add: unicron project spec"
```

2. 将决策写入记忆。三次调用 `memory-writer`：

**技术栈决策：**
- `content`："为本项目选择了 [§10 中的技术栈]。理由：[§10 中的一句话]。"
- `event`：`spec-approved`
- `context`：`{ tags: ["tech-stack", "<主要语言>", "<框架>"] }`

**架构决策：**
- `content`："使用 [§5 中的模式] 架构。理由：[§5 中的一句话]。"
- `event`：`spec-approved`
- `context`：`{ tags: ["architecture", "<模式名称>"] }`

**关键约束：**
- `content`："本项目的硬性约束：[§4 中的列表]。"
- `event`：`spec-approved`
- `context`：`{ tags: ["constraints"] }`

3. 调用 `planner` 技能。
```

- [ ] **Step 3: Verify all 16 sections and validation blocks are present**

```bash
grep -c "## 15\. 决策与依据" skills/spec-writer/SKILL.md
grep -c "## 16\. 待解问题" skills/spec-writer/SKILL.md
grep -c "检查 3：禁用短语扫描" skills/spec-writer/SKILL.md
grep -c "检查 4：验收标准可测量性" skills/spec-writer/SKILL.md
grep -c "最多两轮修正" skills/spec-writer/SKILL.md
grep -c "⚠ 实施前需澄清" skills/spec-writer/SKILL.md
```

Expected: each returns `1`.

- [ ] **Step 4: Commit**

```bash
git add skills/spec-writer/SKILL.md
git commit -m "update: spec-writer — add decisions/rationale and open questions sections, banned-phrase and measurability validation"
```

---

### Task 2: Update `skills/planner/SKILL.md`

**Files:**
- Modify: `skills/planner/SKILL.md`

- [ ] **Step 1: Read the current file**

```bash
cat skills/planner/SKILL.md
```

Note the existing task format and phase structure. You are updating the task format and adding a self-validation section.

- [ ] **Step 2: Write the updated SKILL.md**

Replace the entire contents of `skills/planner/SKILL.md` with:

```markdown
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
```

- [ ] **Step 3: Verify mandatory task format and validation sections are present**

```bash
grep -c "实现：" skills/planner/SKILL.md
grep -c "依赖于：" skills/planner/SKILL.md
grep -c "检查 1：任务粒度" skills/planner/SKILL.md
grep -c "检查 2：文件路径完整性" skills/planner/SKILL.md
grep -c "检查 3：依赖一致性" skills/planner/SKILL.md
grep -c "⚠ 调度前请确认依赖关系" skills/planner/SKILL.md
```

Expected: each returns `1`.

- [ ] **Step 4: Commit**

```bash
git add skills/planner/SKILL.md
git commit -m "update: planner — mandatory task structure with Implements field, three self-validation checks"
```

---

### Task 3: Smoke test and push

**Files:** None modified.

- [ ] **Step 1: Run full smoke test**

```bash
bash tests/smoke.sh
```

Expected: `=== All smoke tests passed ===`

- [ ] **Step 2: Verify installed skill files contain the new sections**

```bash
TEMP="$(mktemp -d)"
node core/installer.js --home "$TEMP" 2>&1 | grep "claude-code done"
grep -c "决策与依据" "$TEMP/.claude/skills/unicron/spec-writer/SKILL.md"
grep -c "检查 1：任务粒度" "$TEMP/.claude/skills/unicron/planner/SKILL.md"
```

Expected: `claude-code done` in first output; `1` for each grep.

- [ ] **Step 3: Push to main**

```bash
git push origin main
```
