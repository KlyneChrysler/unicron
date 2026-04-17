# Registry Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `registry.yaml` the authoritative source of truth for CTO Pass 1 team assembly, replacing the static signal table with a live registry lookup plus a minimal override layer.

**Architecture:** New `registry-reader` skill handles the registry lookup and parallel-grouping logic. `agents/cto.md` Pass 1 calls `registry-reader` first, then applies a 5-row override table for nuanced pairings. `/unicron:registry` command added for introspection. No changes to `registry.yaml` schema.

**Tech Stack:** Markdown behavioral specs, YAML registry, bash for verification.

---

### Task 1: Create `skills/registry-reader/SKILL.md`

**Files:**
- Create: `skills/registry-reader/SKILL.md`

- [ ] **Step 1: Create the skill directory and file**

```bash
mkdir -p skills/registry-reader
```

- [ ] **Step 2: Write the skill file**

Create `skills/registry-reader/SKILL.md` with this exact content:

```markdown
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

​```
⛔ registry-reader 错误：无法读取 registry.yaml。
   CTO 应回退至信号覆盖表，并在调度报告中记录警告。
​```

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

​```
已匹配 Agents：
  - [agent-name]   触发：[命中的触发器列表]   并行：[伙伴名称，或"—"]

未匹配信号：[未命中任何 Agent 触发器的信号列表，或"无"]
​```

若无任何 Agent 匹配：

​```
已匹配 Agents：（无）
未匹配信号：[全部输入信号]
​```

## 规则

- **只读** — 不写入任何文件，不调用任何其他技能
- **不自动添加伙伴** — `works_with` 只影响并行标记，不扩展匹配集
- **registry.yaml 不可读时硬错误** — 不静默返回空列表
- **始终排除编排基础设施** — `cto`、`memory-writer`、`memory-reader` 永不出现在输出中
```

- [ ] **Step 3: Verify the file exists and has correct frontmatter**

Run:
```bash
head -5 skills/registry-reader/SKILL.md
```
Expected:
```
---
name: registry-reader
description: "Read-only registry lookup skill...
```

- [ ] **Step 4: Commit**

```bash
git add skills/registry-reader/SKILL.md
git commit -m "add: registry-reader skill — read-only registry lookup for CTO Pass 1"
```

---

### Task 2: Update `agents/cto.md` Pass 1 algorithm

**Files:**
- Modify: `agents/cto.md` (lines 25–39, Pass 1 section only)

- [ ] **Step 1: Read the current Pass 1 section**

Run:
```bash
sed -n '25,40p' agents/cto.md
```
Expected: the static signal table (7 rows: 认证、Schema、UI、API 端点、Docker、第一个任务、已完成任务).

- [ ] **Step 2: Replace the Pass 1 section**

Replace the entire `### 第一阶段：内容分析` section (from the heading through "无论计划的 `Agents:` 字段列出了什么。") with:

```markdown
### 第一阶段：内容分析

读取任务的标题、描述、验收标准和文件列表。提取任务信号（如 `api-feature`、`new-model`、`auth-logic`、`ui-change`）。

**步骤 1：调用注册表读取器**

以提取的信号列表调用 `registry-reader`：
- 返回已匹配 Agent 列表，含并行标记
- 若返回错误（`registry.yaml` 不可读）→ 跳至步骤 2，完全使用覆盖表
- 将 `未匹配信号` 列表记录在调度报告中

**步骤 2：应用覆盖表**

在注册表匹配结果之上叠加以下覆盖规则。覆盖规则优先于注册表匹配：

| 信号 | 覆盖规则 | 原因 |
|---|---|---|
| `api-endpoint` | 强制同时包含 `backend-dev` + `security-engineer`（并行） | 两者始终一起出现，注册表触发器无法单独表达此配对 |
| `pii-data` | 立即强制注入 `security-engineer`（位于当前 Agent 之后） | 排序约束，不仅是包含关系 |
| `new-schema` | 强制同时包含 `database-admin` + `backend-dev`（并行） | Schema 工作同时需要两者 |
| `pre-release` | 强制在最后添加 `code-reviewer`（若尚未包含） | 即使注册表未匹配也须包含 |
| `unclear-requirements` | 强制在所有实现者之前添加 `product-analyst` | 需求澄清先于实现 |

表格符号：`+` 表示并行调度；`→` 表示顺序（前者完成后调度后者）。

**步骤 3：输出最终团队**

合并注册表匹配结果与覆盖调整，输出有序团队列表（含并行标记），传入调度报告格式。若 `registry-reader` 返回了 `未匹配信号`，在调度报告中列出。
```

- [ ] **Step 3: Verify the signal table is gone and override table has exactly 5 rows**

Run:
```bash
grep -c "^|" agents/cto.md
```
Count the table rows across all tables in the file. The Pass 1 table should now have 5 data rows (down from 7).

Also verify the registry-reader call is present:
```bash
grep "registry-reader" agents/cto.md
```
Expected: at least one match in the Pass 1 section.

- [ ] **Step 4: Commit**

```bash
git add agents/cto.md
git commit -m "update: cto Pass 1 — registry-reader primary lookup, 5-row override table"
```

---

### Task 3: Add `/unicron:registry` command to `skills/unicron/SKILL.md`

**Files:**
- Modify: `skills/unicron/SKILL.md`

- [ ] **Step 1: Add the command to the commands table**

Find the commands table in `skills/unicron/SKILL.md`. Add one row after `/unicron:memory`:

```markdown
| `/unicron:registry [agent?]` | 显示注册表中所有 Agent 的触发器、能力和协作关系；可传入 Agent 名称以过滤单条 |
```

- [ ] **Step 2: Add the implementation section**

After the existing `/unicron:memory` implementation section, add:

```markdown
**`/unicron:registry [agent-name?]`**

1. 读取 `registry.yaml`
2. 若未传入参数：以以下格式打印所有 Agent 条目：

```
Registry — [N] agents

[agent-name]
  Description: [description]
  Capabilities: [capabilities, comma-separated]
  Triggers: [triggers, comma-separated]
  Works with: [works_with, comma-separated]
```

3. 若传入 Agent 名称（如 `/unicron:registry backend-dev`）：仅打印该 Agent 的条目。若 Agent 不在注册表中：输出 `未找到 Agent：[name]`。
```

- [ ] **Step 3: Verify both additions**

Run:
```bash
grep "unicron:registry" skills/unicron/SKILL.md
```
Expected: at least 2 matches (one in the table, one in the implementation section).

- [ ] **Step 4: Commit**

```bash
git add skills/unicron/SKILL.md
git commit -m "add: /unicron:registry introspection command"
```

---

### Task 4: Smoke verification

**Files:** None — verification only.

- [ ] **Step 1: Verify registry-reader skill exists and has all required sections**

Run:
```bash
grep -E "^(## |### )" skills/registry-reader/SKILL.md
```
Expected output must include:
```
## 输入
## 流程
### 步骤 1：读取注册表
### 步骤 2：触发器匹配
### 步骤 3：并行展开
### 步骤 4：排序
### 步骤 5：输出
## 规则
```

- [ ] **Step 2: Verify cto.md Pass 1 calls registry-reader**

Run:
```bash
grep -n "registry-reader\|覆盖表\|覆盖规则" agents/cto.md
```
Expected: lines referencing `registry-reader` (call), `覆盖表` (override table name), `覆盖规则` (override rules).

- [ ] **Step 3: Verify override table has exactly 5 rows**

Run:
```bash
awk '/应用覆盖表/,/步骤 3/' agents/cto.md | grep "^| \`" | wc -l
```
Expected: `5`

- [ ] **Step 4: Verify exclusions list in registry-reader**

Run:
```bash
grep "memory-writer\|memory-reader" skills/registry-reader/SKILL.md
```
Expected: both names appear in the exclusions section.

- [ ] **Step 5: Verify /unicron:registry appears in unicron skill**

Run:
```bash
grep "unicron:registry" skills/unicron/SKILL.md | wc -l
```
Expected: `2` (table row + implementation section).

- [ ] **Step 6: Acceptance criteria check**

Verify each of the 12 AC items from the spec against the implemented files:

| AC | Check |
|---|---|
| 1. registry-reader matches team from signals | Confirmed by Step 2 section presence |
| 2. Parallel groupings marked | Confirmed by 步骤 3 section in registry-reader |
| 3. cto/memory-* excluded | Confirmed by Step 4 above |
| 4. CTO Pass 1 calls registry-reader | Confirmed by Step 2 above |
| 5. Override table takes precedence | Confirmed by "覆盖规则优先于注册表匹配" text |
| 6. Force-pair produces both agents | Confirmed by override table rows |
| 7. Missing registry.yaml → hard error | Confirmed by 步骤 1 error block in registry-reader |
| 8. CTO fallback to override table | Confirmed by Pass 1 步骤 1 fallback instruction |
| 9. /unicron:registry prints all entries | Confirmed by Step 5 above |
| 10. /unicron:registry \<name\> filters | Confirmed by implementation section |
| 11. 未匹配信号 block present | Confirmed by registry-reader 步骤 5 output format |
| 12. Signal table ≤ 6 override rows | Confirmed by Step 3 above (5 rows) |

- [ ] **Step 7: Final commit**

```bash
git add -p  # confirm nothing unstaged
git log --oneline -5
```
Expected: last 3 commits are the 3 from Tasks 1–3.
