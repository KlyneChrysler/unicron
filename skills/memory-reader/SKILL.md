---
name: memory-reader
description: "Loads global and project MEMORY.md indexes, filters entries by relevance to the current phase/task, and returns a structured context block indicating which memories to apply silently vs surface explicitly. Called at session start and before agent dispatch."
---

# Unicron 记忆读取器

加载并呈现相关记忆。在会话开始时和任何 Agent 调度之前调用。

## 调用时机

- 会话开始时调用 `unicron` 技能（在任何检查或调查之前）
- `dispatcher` 在为任务组建迷你团队之前

## 输入

你接收：
- `phase`：当前 SDLC 阶段 — 以下之一：`investigating`、`speccing`、`planning`、`building`、`complete`
- `task`（可选）：当前任务标题和描述 — 在调度前提供
- `tags`（可选）：用于过滤的特定标签

## 流程

### 1. 加载索引

读取 `~/.unicron/memory/MEMORY.md`（全局）— 如果存在。
读取 `.unicron/memory/MEMORY.md`（项目）— 如果存在。

通过以下方式解析 `.unicron/memory/MEMORY.md`：
1. 检查当前工作目录是否包含 `.unicron/memory/MEMORY.md`
2. 如果没有，向上搜索父目录直到 git 根目录
3. 如果找不到项目根目录，跳过项目索引 — 不报错

如果两个索引都缺失或为空，静默返回空上下文。不要向用户提及记忆。

### 2. 过滤

从两个索引中，选择标签与以下内容重叠的条目：
- 当前 `phase` 值（例如标签 `planning` 匹配规划阶段）
- `task` 标题/描述中的任何关键词（词级匹配）
- 任何明确提供的 `tags`

如果未提供 `tags` 且不存在 `task` 上下文（没有任务的会话开始），则从两个索引加载所有条目。

### 3. 读取选中的文件

对于每个选中的索引条目，相对于包含 MEMORY.md 文件的目录解析文件路径（例如 `decisions/auth-approach.md` 解析为 `.unicron/memory/decisions/auth-approach.md`）。

读取每个选中条目的完整文件内容。

### 4. 决定呈现方式

对于每个条目，检查其前置数据中的 `type` 字段：

| 类型 | 呈现方式 | 操作 |
|------|-----------|--------|
| `preference` | 静默 | 添加摘要到 `apply_silently` |
| `decision` | 明确 | 添加到 `confirm_with_user`，附一行提示 |
| `outcome` | 静默 | 添加摘要到 `inform_dispatch` |

此外：如果任何条目的内容与当前规格说明或计划相矛盾（直接冲突），无论类型如何，都将其添加到 `flag_conflict`。

为冲突检测设置 `confidence` 级别：
- 仅在矛盾清晰且直接时标记冲突，而非推测性的
- 明确冲突示例：记忆说"不支持移动端" + 当前规格说明有 iOS 章节
- 非冲突示例：记忆说"偏好 Postgres" + 当前规格说明尚未提到数据库

### 5. 返回记忆上下文块

精确输出以下结构（省略空列表）：

```
MEMORY CONTEXT:
apply_silently:
  - [偏好摘要 — 一句话]
confirm_with_user:
  - memory: [决策摘要 — 一句话]
    prompt: "上次你选择了 X — 在这里也应用同样的选择吗？"
inform_dispatch:
  - [与当前任务相关的结果摘要 — 一句话]
flag_conflict:
  - memory: [冲突条目摘要]
    conflict: "[什么与什么相矛盾]"
```

如果所有列表都为空：不返回任何内容。不要输出"未找到相关记忆"或任何确认信息。

## 规则

- 优先处理 `flag_conflict` 条目 — 在所有其他记忆之前呈现冲突
- 一次呈现一个 `confirm_with_user` 条目 — 永远不要批量显示多个确认提示
- `apply_silently` 条目调整行为，不向用户显示任何输出
- `inform_dispatch` 条目进入 CTO 上下文块，不直接向用户显示
- 如果两个索引都为空或缺失：静默返回空内容
- 如果索引中引用的文件在磁盘上不存在：静默跳过它，不报错
