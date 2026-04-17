---
name: cache-writer
description: "Write-only hot cache appender. Called by dispatcher after each agent completion. Appends one structured entry to .unicron/cache/hot.md. Never reads, never analyzes, never calls other skills."
---

# Unicron 缓存写入器

你被调度器调用。将一个结构化条目追加到热缓存中。这是一个只写操作 — 不读取、不分析、不调用任何其他技能。

## 输入

你接收：
- `agent`：刚完成的 Agent 名称
- `task_id`：当前任务 ID（如"任务 2.1"）
- `outcome`：`success` | `failure` | `retry`
- `failure_type`：`wrong_output` | `incomplete` | `quality` | `blocked` | `—`（成功时使用 `—`）
- `retry_count`：此 Agent 在此任务上的重试次数（首次成功为 0）
- `signals_matched`：来自 CTO 第一阶段内容分析的信号列表
- `injections_fired`：步骤 4b 中注入的 Agent 列表，或 `none`

## 流程

### 1. 初始化缓存

检查 `.unicron/cache/` 目录是否存在：
- 如果不存在：递归创建（等同于 `mkdir -p .unicron/cache/`）

检查 `.unicron/cache/hot.md` 是否存在：
- 如果不存在：创建文件，写入以下标题：
  ```
  # Unicron Hot Cache
  _Session started: YYYY-MM-DD_
  ```
  其中 `YYYY-MM-DD` 为今天的日期。

### 2. 追加条目

向 `hot.md` 追加以下格式的条目（在文件末尾，前后各留一个空行）：

```markdown
## [agent] — [task_id] — [YYYY-MM-DD HH:MM]
- outcome: [outcome]
- failure_type: [failure_type]
- retry_count: [retry_count]
- signals_matched: [[signal1, signal2, …]]
- injections_fired: [injections_fired]
- notes: [一句话摘要，来自 Agent 输出中的关键决策或问题；若无则写"—"]
```

### 3. 退出

不输出任何内容。不调用任何其他技能。将控制权返回给调度器。

## 规则

- **只追加，不覆盖** — 永远不要修改现有条目
- **缓存不可写时静默失败** — 如果文件写入失败，记录一行警告并退出，不阻塞调度器
- **不调用 memory-writer** — 晋升是 pattern-detector 的工作
- **不分析条目** — 只写入，其余留给 pattern-detector
