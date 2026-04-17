---
name: registry-reader
description: "Read-only registry lookup skill. Given a list of task signals, reads registry.yaml, matches agent triggers, expands parallel groupings via works_with, and returns a resolved team. Called by CTO at the start of Pass 1."
---

# Unicron 注册表读取器

你被 CTO 在第一阶段（内容分析）开始时调用。给定任务信号列表，从注册表中解析出最佳团队。这是一个只读操作 — 不调用任何其他技能，不写入任何文件。

## 输入

你接收：
- `signals`：从任务内容中提取的信号列表（如 `[api-feature, new-model, auth-logic]`）

## 流程

### 步骤 1：读取注册表

读取 `registry.yaml`。如果文件不存在或无法读取：

```
⛔ registry-reader 错误：无法读取 registry.yaml。
   CTO 应回退至信号覆盖表，并在调度报告中记录警告。
```

立即退出，不返回任何 Agent 列表。

### 步骤 2：触发器匹配

对注册表中的每个 Agent，检查其 `triggers` 列表与输入 `signals` 的交集：
- 若交集非空 → 包含该 Agent，记录哪些触发器命中
- 若交集为空 → 跳过该 Agent

**始终从输出中排除以下 Agent**（无论触发器是否匹配）：
`cto`、`memory-writer`、`memory-reader`

### 步骤 3：并行展开

对每个已匹配的 Agent，检查其 `works_with` 列表：
- 若列出的伙伴 Agent 也在匹配集中 → 标记两者为并行
- 若列出的伙伴 Agent 不在匹配集中 → 忽略（不自动添加）

### 步骤 4：排序

按以下启发式规则排序已匹配的 Agent：
1. `solutions-architect` 排在所有实现者之前（若已匹配）
2. 实现者（`backend-dev`、`frontend-dev`、`mobile-dev`、`database-admin`、`security-engineer`）居中
3. `qa-engineer` 排在实现者之后（若已匹配）
4. `code-reviewer` 始终最后（若已匹配）
5. 其余 Agent 按注册表中的自然匹配顺序排列

### 步骤 5：输出

以以下格式返回结果：

```
已匹配 Agents：
  - [agent-name]   触发：[命中的触发器列表]   并行：[伙伴名称，或"—"]

未匹配信号：[未命中任何 Agent 触发器的信号列表，或"无"]
```

若无任何 Agent 匹配：

```
已匹配 Agents：（无）
未匹配信号：[全部输入信号]
```

## 规则

- **只读** — 不写入任何文件，不调用任何其他技能
- **不自动添加伙伴** — `works_with` 只影响并行标记，不扩展匹配集
- **registry.yaml 不可读时硬错误** — 不静默返回空列表
- **始终排除编排基础设施** — `cto`、`memory-writer`、`memory-reader` 永不出现在输出中
