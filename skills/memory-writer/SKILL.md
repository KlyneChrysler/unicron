---
name: memory-writer
description: "Classifies and writes persistent memory entries (decisions, outcomes, preferences) to the correct scope. Updates the MEMORY.md index. Called by other skills after key events and by /unicron:remember."
---

# Unicron 记忆写入器

写入持久化记忆条目。在关键事件后由其他技能调用，或由用户手动调用。

## 调用时机

- `spec-writer` 在规格说明批准后调用（决策）
- `dispatcher` 在每个任务完成后调用（结果）
- `gate-checker` 在阶段关卡通过后调用（结果）
- `investigate` 在用户表达偏好时调用
- `/unicron:remember <note>`（用户手动写入）

## 输入

你接收：
- `content`：需要记住的信息
- `event`：触发此操作的事件 — 以下之一：`spec-approved`、`task-complete`、`gate-passed`、`preference-detected`、`manual`
  如果 `event` 不在允许值中，报错：'未知事件类型：[event]。允许的值：spec-approved, task-complete, gate-passed, preference-detected, manual。'
- `context`（可选）：项目名称、阶段编号、Agent 名称（用于结果）

## 流程

### 1. 分类

根据 `content` 和 `event` 确定记忆类型：
- `preference` — 用户的工作偏好（详细程度、工具选择、审批风格）。典型事件：`preference-detected`、带有个人偏好语言的 `manual`（"我总是"、"我偏好"、"从不使用"）。
- `decision` — 明确的架构或技术选择。典型事件：`spec-approved`、带有决策语言的 `manual`（"选择了 X"、"使用 Y 因为"）。
- `outcome` — Agent 做了什么、什么有效、什么无效。典型事件：`task-complete`、`gate-passed`。

### 2. 选择范围

- `preference` → 全局：`~/.unicron/memory/preferences/`
- `decision` → 项目级：`.unicron/memory/decisions/`
- `outcome` → 项目级：`.unicron/memory/outcomes/`

如果父目录不存在，递归创建所有父目录（等同于 `mkdir -p`）。

对于项目范围的条目，通过以下方式解析 `.unicron/memory/`：
1. 检查当前工作目录是否包含 `.unicron/memory/`
2. 如果没有，向上搜索父目录直到 git 根目录
3. 如果找不到项目根目录，报错："无法确定项目根目录。请在项目目录内运行。"

### 3. 生成文件名

从 `content` 中的主题派生一个短横线命名的文件名（最多 40 个字符）。
对于结果，附加日期：`agent-qa-engineer-2026-04-17.md`
如果文件已存在，附加 `-2`、`-3` 等，递增直到找到不存在的文件名。最多 99 个版本；如果超过，报错：'此条目的版本过多。请使用更具体的文件名。'

### 4. 写入记忆文件

```markdown
---
type: decision | outcome | preference
scope: global | project
agent: <name>   # 仅用于结果 — 决策和偏好中省略
confidence: high | medium | low
date: YYYY-MM-DD
tags: [tag1, tag2, tag3]
---

<正文>
```

根据信息的确定性设置 `confidence`：如果明确/直接（用户明确表达），则为 `high`；如果从上下文推断，则为 `medium`；如果是推测性的，则为 `low`。

**正文规则：**
- `preference`：2–4 句第二人称。"用户偏好 X 因为 Y。通过 Z 来应用这一点。"
- `decision`：2–4 句带理由。"选择 X 而非 Y 因为 Z。这影响[相关领域]。"
- `outcome`：2–4 句描述发生了什么及其影响。"Agent X 做了 Y。结果：Z。注意：W。"

**标签规则：**
- 2–5 个具体的小写关键词（例如 `[database, postgresql, orm]`）
- 由 memory-reader 用于过滤相关条目 — 要具体
- 好的标签：`[authentication, oauth2, jwt]`。差的标签：`[project, important, general]`。

### 5. 更新 MEMORY.md 索引

在范围根目录（`~/.unicron/memory/MEMORY.md` 或 `.unicron/memory/MEMORY.md`）：
- 如果文件不存在，则创建带有标题的文件：
  ```
  # Unicron Memory Index
  ```
- 追加一行：
  ```
  - [标题](relative/path/to/file.md) — 描述该记忆的一行钩子
  ```
- 不要重复已有条目 — 如果该路径已出现在索引中，跳过添加并成功退出

### 6. 确认（仅手动写入）

对于 `event: manual`，输出：
> "已保存至 `.unicron/memory/decisions/auth-approach.md`"

对于自动写入，不输出任何内容。

## 规则

- 永远不要覆盖现有条目正文 — 改为创建新的版本化文件
- 标签必须足够具体，以便将此记忆与无关记忆区分开来
- 如果分类不明确，对项目范围默认为 `decision`，对全局范围默认为 `preference`
