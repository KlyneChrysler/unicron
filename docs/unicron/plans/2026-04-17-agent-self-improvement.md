# Agent Self-Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hot cache layer and pattern detector to Unicron so per-agent signals accumulate during a session and are analyzed at phase gates to surface typed improvement suggestions for agent files.

**Architecture:** Two new skill files (`cache-writer`, `pattern-detector`) plug into the existing pipeline. `dispatcher` calls `cache-writer` after each agent completion. `gate-checker` calls `pattern-detector` before running gate checks. No agent `.md` files are modified.

**Tech Stack:** Markdown instruction files (Simplified Chinese body, English frontmatter/code/paths). All files follow the existing Unicron skill format.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `skills/cache-writer/SKILL.md` | Create | Append-only hot cache writer, called per agent completion |
| `skills/pattern-detector/SKILL.md` | Create | Pattern detection, suggestion reporting, cache promotion + clear |
| `skills/dispatcher/SKILL.md` | Modify (end of Step 4b) | Add one call to `cache-writer` |
| `skills/gate-checker/SKILL.md` | Modify (before gate checks) | Add one call to `pattern-detector` |

---

### Task 1: Create `skills/cache-writer/SKILL.md`

**Files:**
- Create: `skills/cache-writer/SKILL.md`

- [ ] **Step 1: Verify the file does not yet exist**

```bash
ls /Users/CK/Desktop/P\ NO.16/unicron/skills/cache-writer/SKILL.md 2>&1
```

Expected: `No such file or directory`

- [ ] **Step 2: Create the directory**

```bash
mkdir -p "/Users/CK/Desktop/P NO.16/unicron/skills/cache-writer"
```

Expected: no output (directory created)

- [ ] **Step 3: Write the file**

Write the following content exactly to `skills/cache-writer/SKILL.md`:

```markdown
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
```

- [ ] **Step 4: Verify key sections exist**

```bash
grep -c "只追加，不覆盖" "/Users/CK/Desktop/P NO.16/unicron/skills/cache-writer/SKILL.md"
grep -c "signals_matched" "/Users/CK/Desktop/P NO.16/unicron/skills/cache-writer/SKILL.md"
grep -c "injections_fired" "/Users/CK/Desktop/P NO.16/unicron/skills/cache-writer/SKILL.md"
grep -c "静默失败" "/Users/CK/Desktop/P NO.16/unicron/skills/cache-writer/SKILL.md"
```

Expected: each command prints `1`

- [ ] **Step 5: Commit**

```bash
cd "/Users/CK/Desktop/P NO.16/unicron" && git add skills/cache-writer/SKILL.md && git commit -m "add: cache-writer skill — hot cache appender"
```

Expected: `[main ...] add: cache-writer skill — hot cache appender`

---

### Task 2: Create `skills/pattern-detector/SKILL.md`

**Files:**
- Create: `skills/pattern-detector/SKILL.md`

- [ ] **Step 1: Verify the file does not yet exist**

```bash
ls "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md" 2>&1
```

Expected: `No such file or directory`

- [ ] **Step 2: Create the directory**

```bash
mkdir -p "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector"
```

Expected: no output

- [ ] **Step 3: Write the file**

Write the following content exactly to `skills/pattern-detector/SKILL.md`:

```markdown
---
name: pattern-detector
description: "Phase gate pattern analysis. Reads hot cache and historical outcomes, detects failure/routing/quality patterns (threshold ≥ 2), presents improvement suggestions one at a time with user approval, promotes entries to persistent memory via memory-writer, then clears hot cache."
---

# Unicron 模式检测器

你在每个阶段关卡由 gate-checker 调用。检测当前阶段的 Agent 行为模式，逐一呈现改进建议，晋升缓存条目到持久化记忆，然后清除热缓存。将控制权返回给 gate-checker 继续执行正常关卡检查。

## 输入

你接收：
- `phase`：当前阶段编号（如 `2`）

## 流程

### 1. 加载数据

读取 `.unicron/cache/hot.md`：
- 如果文件不存在，或仅包含标题行（无 `##` 条目）：跳至步骤 5，退出后将控制权返回给 gate-checker。不报错。

读取 `.unicron/memory/outcomes/` 中标签包含当前阶段或 `pattern-dismissed` 的文件（如有）。

### 2. 检测模式

解析 `hot.md` 中的所有条目。按以下规则检测模式：

| 模式类型 | 检测规则 |
|---|---|
| `failure_pattern` | 同一 Agent、同一 `failure_type`，当前阶段内出现 ≥ 2 次 |
| `routing_pattern` | 同一 Agent 在共享某个共同信号的任务上被注入（`injections_fired` 中出现）≥ 2 次 |
| `quality_pattern` | 同一 Agent 在当前阶段的 ≥ 2 个任务上 `retry_count > 0` |

**最低阈值：2 次出现。** 单次事件不报告。

同时检查历史 `outcomes/` 文件中是否存在被标记为 `dismissed: true` 的相同模式 — 若历史中已 dismissed 且当前阶段计数未超过历史 dismissed 时的计数，则跳过该模式。

### 3. 呈现报告与建议

**若未发现任何模式：**

```
🧠 No patterns detected this phase.
```

跳至步骤 4。

**若发现模式，** 输出标题：

```
🧠 Pattern Report — Phase [N] Gate
================================
```

然后**逐一**呈现每个模式（等待用户响应后再显示下一个）：

```
[failure_pattern] [agent] × [count] [failure_type] failures on [signal] tasks
  → Suggested fix: [具体的一行建议 — 引用受影响的 agent .md 文件和章节]
  → Apply? (yes / skip / show diff)
```

**用户响应处理：**

- **yes** → 应用补丁（见补丁规则），提交，然后呈现下一个模式
- **skip** → 调用 `memory-writer` 记录已跳过的模式：
  - `content`："已跳过模式：[模式类型] — [agent] × [count] 次，阶段 [N]。dismissed: true。"
  - `event`：`task-complete`
  - `context`：`{ agent: "<agent>", phase: "<N>", tags: ["pattern-dismissed", "<signal>"] }`
  然后呈现下一个模式
- **show diff** → 显示精确的行级变更，然后重新显示 `Apply? (yes / skip)`

**补丁规则：**
- 补丁必须是对 Agent `.md` 文件的最小精确修改 — 不重写整个章节
- 仅修改确实需要变更的行
- 应用后立即提交：
  ```bash
  git add <agent-file> && git commit -m "improve: <agent-name> — <一行原因>"
  ```
- 如果补丁应用失败：向用户报告具体错误，跳过此建议，继续下一个

### 4. 晋升缓存条目

对于 `hot.md` 中每个 `outcome` 为 `success` 或 `failure` 的条目，调用 `memory-writer`：
- `content`："[agent] 在 [task_id] 上[完成/失败]。信号：[signals_matched]。结果：[outcome]。注入：[injections_fired]。备注：[notes]。"
- `event`：`task-complete`
- `context`：`{ agent: "<agent>", phase: "<N>", tags: [<signals_matched 中的每个信号>] }`

`outcome: retry` 的条目不晋升（仅晋升最终结果）。

### 5. 清除热缓存

将 `.unicron/cache/hot.md` 截断为仅保留标题行，保留原始会话日期：

```markdown
# Unicron Hot Cache
_Session started: [原始日期]_
```

### 6. 返回

将控制权返回给 gate-checker，继续执行正常关卡检查。

## 规则

- **从不阻塞关卡** — 模式检测是建议性的，不是关卡条件
- **从不自动应用补丁** — 每个补丁都需要明确的用户 `yes` 响应
- **逐一呈现建议** — 等待用户响应后再显示下一个，绝不批量显示
- **`retry` 条目不晋升** — 只晋升最终 `success` 或 `failure` 结果
- **若 hot.md 为空或缺失** — 静默跳过检测和晋升，直接将控制权返回给 gate-checker
```

- [ ] **Step 4: Verify key sections exist**

```bash
grep -c "failure_pattern" "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md"
grep -c "routing_pattern" "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md"
grep -c "quality_pattern" "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md"
grep -c "从不阻塞关卡" "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md"
grep -c "dismissed" "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md"
```

Expected: each command prints `1` or higher

- [ ] **Step 5: Commit**

```bash
cd "/Users/CK/Desktop/P NO.16/unicron" && git add skills/pattern-detector/SKILL.md && git commit -m "add: pattern-detector skill — phase gate pattern analysis and cache promotion"
```

Expected: `[main ...] add: pattern-detector skill — phase gate pattern analysis and cache promotion`

---

### Task 3: Update `skills/dispatcher/SKILL.md` — add cache-writer call

**Files:**
- Modify: `skills/dispatcher/SKILL.md` (end of Step 4b)

Context: Step 4b currently ends with the line `` `[INJECT: ...]` 标记为硬注入 — 不可选。继续执行更新后的团队。 `` followed by `### 步骤 5`. We need to add one paragraph between Step 4b and Step 5 instructing the dispatcher to call `cache-writer`.

- [ ] **Step 1: Verify the current end of Step 4b**

```bash
grep -n "硬注入" "/Users/CK/Desktop/P NO.16/unicron/skills/dispatcher/SKILL.md"
```

Expected: a line number followed by `` `[INJECT: ...]` 标记为硬注入 — 不可选。继续执行更新后的团队。 ``

- [ ] **Step 2: Add the cache-writer call after Step 4b**

Find the exact line:
```
`[INJECT: ...]` 标记为硬注入 — 不可选。继续执行更新后的团队。
```

Insert the following block immediately after it (before `### 步骤 5`):

```markdown

每个 Agent 完成后（注入扫描结束后），调用 `cache-writer`，传入：
- `agent`：当前 Agent 名称
- `task_id`：当前任务 ID
- `outcome`：`success`（标准已满足）| `failure`（分类失败）| `retry`（重试中）
- `failure_type`：失败类型，或 `—`（成功时）
- `retry_count`：当前重试次数
- `signals_matched`：步骤 2 第一阶段匹配的信号列表
- `injections_fired`：本次注入扫描触发的 Agent 列表，或 `none`
```

- [ ] **Step 3: Verify the addition**

```bash
grep -c "cache-writer" "/Users/CK/Desktop/P NO.16/unicron/skills/dispatcher/SKILL.md"
```

Expected: `1`

```bash
grep -c "signals_matched" "/Users/CK/Desktop/P NO.16/unicron/skills/dispatcher/SKILL.md"
```

Expected: `1`

- [ ] **Step 4: Commit**

```bash
cd "/Users/CK/Desktop/P NO.16/unicron" && git add skills/dispatcher/SKILL.md && git commit -m "update: dispatcher — call cache-writer after each agent completion"
```

Expected: `[main ...] update: dispatcher — call cache-writer after each agent completion`

---

### Task 4: Update `skills/gate-checker/SKILL.md` — add pattern-detector call

**Files:**
- Modify: `skills/gate-checker/SKILL.md` (before 关卡检查清单)

Context: `gate-checker` currently opens with the 关卡检查清单 heading and jumps straight into 检查 1. We need to add a pre-gate step that calls `pattern-detector` before any checks run.

- [ ] **Step 1: Verify the current opening of the gate checklist**

```bash
grep -n "关卡检查清单" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
```

Expected: a line number followed by `## 关卡检查清单`

- [ ] **Step 2: Insert the pattern-detector call before the checklist**

Find the exact line:
```
## 关卡检查清单
```

Insert the following block immediately before it:

```markdown
## 预关卡：模式分析

在运行关卡检查之前，调用 `pattern-detector`，传入 `phase`（当前阶段编号）。

等待 `pattern-detector` 完成（报告 + 晋升 + 清除热缓存）后再继续关卡检查。模式检测是建议性的 — 即使 `pattern-detector` 未发现任何模式，关卡检查也必须继续运行。

```

- [ ] **Step 3: Verify the addition**

```bash
grep -c "pattern-detector" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
```

Expected: `1`

```bash
grep -c "预关卡" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
```

Expected: `1`

- [ ] **Step 4: Verify gate-checker still contains all original checks**

```bash
grep -c "检查 1" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
grep -c "检查 2" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
grep -c "检查 3" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
grep -c "检查 4" "/Users/CK/Desktop/P NO.16/unicron/skills/gate-checker/SKILL.md"
```

Expected: each prints `1`

- [ ] **Step 5: Commit**

```bash
cd "/Users/CK/Desktop/P NO.16/unicron" && git add skills/gate-checker/SKILL.md && git commit -m "update: gate-checker — call pattern-detector before gate checks"
```

Expected: `[main ...] update: gate-checker — call pattern-detector before gate checks`

---

### Task 5: Smoke test and push

**Files:** none created/modified

- [ ] **Step 1: Run the smoke test suite**

```bash
cd "/Users/CK/Desktop/P NO.16/unicron" && bash tests/smoke.sh 2>&1
```

Expected: `=== All smoke tests passed ===`

If any test fails: read the failure output, fix the file that's missing or malformed, re-run.

Note: the smoke test checks that installed skill files exist at install-time paths. The two new skills (`cache-writer`, `pattern-detector`) will appear in the smoke output only if `tests/smoke.sh` includes checks for them. If the test suite does not yet include checks for the new skills, verify their presence manually:

```bash
ls "/Users/CK/Desktop/P NO.16/unicron/skills/cache-writer/SKILL.md"
ls "/Users/CK/Desktop/P NO.16/unicron/skills/pattern-detector/SKILL.md"
```

Expected: both paths print without error.

- [ ] **Step 2: Verify registry if present**

```bash
cat "/Users/CK/Desktop/P NO.16/unicron/registry.yaml" 2>/dev/null | grep -E "cache-writer|pattern-detector" || echo "registry check skipped — no registry or skills not registered (expected for instruction-only skills)"
```

`cache-writer` and `pattern-detector` are instruction skills called by other skills — they do not need to be in `registry.yaml`. The output "registry check skipped" is the expected result.

- [ ] **Step 3: Push to main**

```bash
cd "/Users/CK/Desktop/P NO.16/unicron" && git push origin main 2>&1
```

Expected: `main -> main` with a commit range.
