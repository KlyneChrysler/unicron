# Adversarial Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pre-dispatch adversarial pass that stress-tests tasks before agents execute them — challenging AC completeness, team composition, scope assumptions, dependency gaps, and risk surface.

**Architecture:** New `adversarial-pass` skill called conditionally in dispatcher Step 2b. `challenges_fired` field added to cache-writer. `/unicron:challenge` command added for on-demand invocation. No changes to agents or registry.

**Tech Stack:** Markdown behavioral specs, bash for verification.

---

### Task 1: Create `skills/adversarial-pass/SKILL.md`

**Files:**
- Create: `skills/adversarial-pass/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p /Users/CK/Desktop/P\ NO.16/unicron/skills/adversarial-pass
```

- [ ] **Step 2: Write the skill file**

Create `skills/adversarial-pass/SKILL.md` with this exact content:

````markdown
---
name: adversarial-pass
description: "Pre-dispatch adversarial challenge skill. Receives task context and assembled team, runs 5 challenge types (AC completeness, team composition, scope assumptions, dependency gaps, risk surface), and returns a structured challenge report with per-finding severity levels."
---

# Unicron 对抗性检查

你在调度器 Step 2b 中被调用。在 Agent 团队执行任务之前，对任务进行全面的挑战性分析，识别盲点、假设、风险和遗漏。这是一个只读操作 — 不调用任何其他技能，不写入任何文件。

## 输入

你接收：
- `task_id`：任务 ID（如 `任务 2.1`）
- `title`：任务标题
- `description`：任务描述
- `acceptance_criteria`：验收标准列表
- `assembled_team`：已组建的 Agent 列表（如 `[backend-dev, security-engineer, qa-engineer]`）
- `spec_excerpt`：来自 `docs/unicron/spec.md` 的相关章节内容

## 严重级别

| 级别 | 含义 | 调度器处理方式 |
|---|---|---|
| **Critical** | 若不解决，任务很可能产生错误或有害输出 | 暂停调度，向用户展示 |
| **Warning** | 真实风险，值得注意，但不阻塞 | 注入 Agent 上下文块 |
| **Advisory** | 可改善质量的观察 | 静默记录，不向用户展示 |

## 流程

对以下 5 项挑战逐一执行检查。每项挑战独立运行，不因前一项发现问题而跳过后续检查。

### 挑战 1：验收标准完整性（ac-completeness）

检查 `acceptance_criteria` 是否存在以下问题：

**触发 Critical（若满足任意一条）：**
- 验收标准列表为空或不存在

**触发 Warning（若满足任意一条）：**
- 任意 AC 包含模糊语言：`"正常工作"`、`"正确"`、`"适当"`、`"应该"`、`"应能"`、`"符合预期"` 或等价的英文（`"properly"`, `"correctly"`, `"as expected"`, `"should work"`, `"appropriate"`）
- 任务涉及错误处理，但无任何 AC 覆盖错误场景
- 任务涉及用户输入，但无任何 AC 覆盖空值或非法输入

**触发 Advisory（若满足任意一条）：**
- AC 数量 < 3 且任务描述包含多个独立功能点
- 无 AC 覆盖并发或竞态场景（仅在任务描述涉及队列、锁、事务时检查）

### 挑战 2：团队组成（team-composition）

将 `assembled_team` 与任务信号进行交叉核验：

**触发 Warning（若满足任意一条）：**
- 描述或 AC 包含 `schema`、`migration`、`index`、`表`、`迁移`，但 `database-admin` 不在团队中
- 描述或 AC 包含 `API`、`endpoint`、`路由`、`webhook`，但 `security-engineer` 不在团队中
- 描述或 AC 包含 `auth`、`token`、`session`、`OAuth`、`权限`、`认证`，但 `security-engineer` 不在团队中
- 描述或 AC 包含 `UI`、`页面`、`组件`、`表单`，但 `frontend-dev` 和 `ux-designer` 均不在团队中
- 描述或 AC 包含 `deploy`、`pipeline`、`CI`、`infrastructure`、`部署`，但 `devops-sre` 不在团队中

**触发 Advisory（若满足任意一条）：**
- 任务是阶段中的第一个任务，但 `solutions-architect` 不在团队中

### 挑战 3：范围假设（scope-assumption）

检查任务是否依赖未明确声明的假设：

**触发 Warning（若满足任意一条）：**
- 描述包含 `"现有"`、`"当前"`、`"已有"`、`"existing"`、`"current"` 等词，但未说明现有内容的具体形态
- 描述引用外部 API 或第三方服务，但未说明该服务的可用性或接口版本
- 描述包含用户行为假设（如 `"用户会"`、`"用户已"`），但无 AC 验证该假设
- 任务修改现有数据结构，但未说明对现有数据的迁移策略

**触发 Advisory（若满足任意一条）：**
- 描述使用 `"类似于"`、`"参考"` 等措辞，暗示与其他任务的隐式耦合

### 挑战 4：依赖缺口（dependency-gap）

检查任务是否依赖尚未完成的工作：

**触发 Critical（若满足任意一条）：**
- 描述明确引用另一任务的输出（如 `"使用任务 X 创建的 Schema"`、`"调用任务 Y 的 API"`），但该任务的 `depends_on` 字段未包含对应任务

**触发 Warning（若满足任意一条）：**
- 描述隐式引用尚未在计划中出现的功能或组件，且任务无 `depends_on` 字段

### 挑战 5：风险面（risk-surface）

评估任务中未被 Agent 团队覆盖的风险：

**触发 Critical（若满足任意一条）：**
- 描述或 AC 包含不可逆操作（`delete`、`migrate`、`overwrite`、`replace`、`删除`、`迁移`、`覆盖`），但无任何 AC 定义回滚策略或验证回滚能力

**触发 Warning（若满足任意一条）：**
- 描述涉及 PII、个人数据、`payment`、`支付`、`用户数据`，但 `security-engineer` 不在团队中
- 描述涉及高频查询或大数据量操作，但无任何 AC 覆盖性能基准
- 描述涉及认证或权限变更，但无任何 AC 验证权限边界

## 报告格式

收集所有挑战的发现后，按以下格式组装报告：

```
⚔ 对抗性检查 — 任务 [task_id]：[title]
================================
[challenge-id]  [Severity]  — [一句话描述具体发现]
[challenge-id]  [Severity]  — [一句话描述具体发现]

⛔ [N] 个 Critical 问题。在调度前解决：
   → [challenge-id]：[具体发现]
   是否跳过？（yes 继续 / no 先解决）
```

若无任何发现：

```
⚔ 对抗性检查 — 任务 [task_id]：[title]
================================
✓ 未发现问题。
```

若仅有 Advisory 发现（无 Critical 或 Warning）：

```
⚔ 对抗性检查 — 任务 [task_id]：[title]
================================
✓ 未发现 Critical 或 Warning 问题。
```

（Advisory 发现不列入报告正文，仅记录在 challenges_fired 中）

## 返回

将完整报告返回给调度器。不输出其他内容。不调用任何其他技能。

## 规则

- **只读** — 不写入任何文件，不调用任何其他技能
- **全量运行** — 5 项挑战全部执行，不因前序发现而跳过
- **精确描述发现** — 每条发现引用具体文本证据（AC 编号、描述中的关键词），不泛泛而谈
- **不误报** — 仅在明确符合触发条件时报告，不猜测或推断
````

- [ ] **Step 3: Verify frontmatter and section structure**

```bash
head -5 /Users/CK/Desktop/P\ NO.16/unicron/skills/adversarial-pass/SKILL.md
```
Expected: frontmatter starting with `---` and `name: adversarial-pass`.

```bash
grep -E "^### 挑战" /Users/CK/Desktop/P\ NO.16/unicron/skills/adversarial-pass/SKILL.md
```
Expected: 5 lines, one per challenge type.

- [ ] **Step 4: Commit**

```bash
cd /Users/CK/Desktop/P\ NO.16/unicron && git add skills/adversarial-pass/SKILL.md && git commit -m "add: adversarial-pass skill — pre-dispatch challenge skill with 5 challenge types"
```

---

### Task 2: Update `skills/dispatcher/SKILL.md` — add Step 2b

**Files:**
- Modify: `skills/dispatcher/SKILL.md`

- [ ] **Step 1: Read the current file to locate Step 2 and Step 3**

Read `skills/dispatcher/SKILL.md`. Confirm Step 2 ends with the dispatch plan display block and Step 3 begins with "按顺序为每个 Agent 调用其技能文件".

- [ ] **Step 2: Insert Step 2b between Step 2 and Step 3**

Find the line:
```
### 步骤 3：调度 Agents
```

Insert the following block immediately before that line (with a blank line before and after):

```markdown
### 步骤 2b：对抗性检查（条件触发）

**触发条件（满足任意一条时执行）：**
- 当前阶段的第一个任务
- 已组建团队包含 `security-engineer`、`database-admin` 或 `devops-sre`
- 任务验收标准数量 > 3
- 任务描述包含以下任意词汇：`migrate`、`delete`、`overwrite`、`replace`、`auth`、`payment`、`迁移`、`删除`、`覆盖`、`认证`、`支付`
- 任务无 `depends_on` 但描述引用其他任务的输出

若无触发条件且未通过 `/unicron:challenge` 手动调用：跳过本步骤，`challenges_fired` 记为 `none`，继续步骤 3。

**若触发条件满足：**

调用 `adversarial-pass`，传入：
- `task_id`：当前任务 ID
- `title`：当前任务标题
- `description`：当前任务描述
- `acceptance_criteria`：当前任务验收标准
- `assembled_team`：步骤 2 组建的 Agent 列表
- `spec_excerpt`：`docs/unicron/spec.md` 中与当前任务相关的章节

收到挑战报告后，按以下规则处理：

**若报告包含 Critical 问题：**
向用户展示完整报告，暂停调度：
```
⛔ 任务 [ID] — 发现 [N] 个 Critical 问题，在继续之前请解决：
[完整挑战报告]
```
等待用户响应：
- 用户解决问题 → 更新任务/AC/团队后，重新调用 `adversarial-pass` 一次
  - 若重新检查仍有 Critical 问题：完全阻塞，"任务 [ID] 在修正后仍存在未解决的 Critical 问题，请更新计划后再继续。"不再重试
  - 若重新检查无 Critical 问题：继续步骤 3
- 用户选择跳过 → 在步骤 3 的上下文块中记录 `dismissed: true`，继续步骤 3

**若报告仅包含 Warning 或 Advisory：**
不向用户展示。将 Warning 摘要追加至步骤 3 传递给 Agent 的 `UNICRON 任务上下文` 块：
```
对抗性检查警告：
  - [challenge-id] [具体发现]
```
Advisory 发现静默忽略。继续步骤 3。

记录 `challenges_fired`：本次检查中触发的挑战类型 ID 列表（含 Advisory）。此值在步骤 4b 调用 `cache-writer` 时传入。
```

- [ ] **Step 3: Update the Step 4b cache-writer call to include challenges_fired**

Find the existing `cache-writer` call in Step 4b. It currently ends with:
```
- `injections_fired`：本次注入扫描触发的 Agent 列表，或 `none`
```

Add one line after it:
```
- `challenges_fired`：步骤 2b 记录的挑战类型 ID 列表，或 `none`（未触发对抗性检查时）
```

- [ ] **Step 4: Update the Step 4 (failure path) cache-writer call to include challenges_fired**

Find the existing `cache-writer` call in Step 4 (failure/retry path). It currently ends with:
```
`injections_fired: none`（失败路径不经过注入扫描）
```

Add `, challenges_fired: none` at the end of that parameter list (failure path never runs adversarial pass on retries).

- [ ] **Step 5: Verify**

```bash
grep -n "adversarial-pass\|步骤 2b\|challenges_fired" /Users/CK/Desktop/P\ NO.16/unicron/skills/dispatcher/SKILL.md
```
Expected: matches for `adversarial-pass` (Step 2b call), `步骤 2b` (heading), and `challenges_fired` (Step 4, Step 4b).

- [ ] **Step 6: Commit**

```bash
cd /Users/CK/Desktop/P\ NO.16/unicron && git add skills/dispatcher/SKILL.md && git commit -m "update: dispatcher — add Step 2b adversarial pass, challenges_fired in cache calls"
```

---

### Task 3: Update `skills/cache-writer/SKILL.md` — add `challenges_fired` field

**Files:**
- Modify: `skills/cache-writer/SKILL.md`

- [ ] **Step 1: Add challenges_fired to the ## 输入 section**

Find the inputs list in `## 输入`. It currently ends with:
```
- `injections_fired`：步骤 4b 中注入的 Agent 列表，或 `none`
```

Add one line after it:
```
- `challenges_fired`：步骤 2b 中触发的挑战类型 ID 列表（如 `[ac-completeness, risk-surface]`），或 `none`（如未提供则写 `none`）
```

- [ ] **Step 2: Add challenges_fired to the hot.md entry template in ## 流程 Step 2**

Find the append template in Step 2. It currently ends with:
```
- injections_fired: [injections_fired]
- notes: [一句话摘要，来自 Agent 输出中的关键决策或问题；若无则写"—"]
```

Add one line between `injections_fired` and `notes`:
```
- challenges_fired: [challenges_fired]
```

- [ ] **Step 3: Verify both additions**

```bash
grep -n "challenges_fired" /Users/CK/Desktop/P\ NO.16/unicron/skills/cache-writer/SKILL.md
```
Expected: 2 matches (one in ## 输入, one in the template).

- [ ] **Step 4: Commit**

```bash
cd /Users/CK/Desktop/P\ NO.16/unicron && git add skills/cache-writer/SKILL.md && git commit -m "update: cache-writer — add challenges_fired as 8th input field"
```

---

### Task 4: Update `skills/unicron/SKILL.md` — add `/unicron:challenge` command

**Files:**
- Modify: `skills/unicron/SKILL.md`

- [ ] **Step 1: Add the command to the commands table**

Find the commands table. Add one row after `/unicron:registry [agent?]`:

```markdown
| `/unicron:challenge <task-id>` | 对指定任务运行对抗性检查，展示完整报告（含 Advisory 发现）；不影响调度状态 |
```

- [ ] **Step 2: Add the implementation section**

After the existing `/unicron:registry` implementation section, add:

```markdown
**`/unicron:challenge <task-id>`**

1. 读取 `docs/unicron/plan.md`，找到匹配 `<task-id>` 的任务。若未找到：输出 `未找到任务：[task-id]。请检查 docs/unicron/plan.md 中的任务 ID。`，停止执行。
2. 读取 `docs/unicron/spec.md`，提取与该任务相关的章节作为 `spec_excerpt`。
3. 调用 `adversarial-pass`，传入完整任务上下文。若团队已组建则包含；否则传入 `assembled_team: not yet assembled`。
4. 向用户展示完整挑战报告，**包含 Advisory 发现**（与自动触发路径不同，后者静默忽略 Advisory）。
5. 不修改调度状态，不暂停或阻塞任何进行中的调度。
```

- [ ] **Step 3: Verify both additions**

```bash
grep -n "unicron:challenge" /Users/CK/Desktop/P\ NO.16/unicron/skills/unicron/SKILL.md
```
Expected: at least 2 matches (table row + implementation section).

- [ ] **Step 4: Commit**

```bash
cd /Users/CK/Desktop/P\ NO.16/unicron && git add skills/unicron/SKILL.md && git commit -m "add: /unicron:challenge command for on-demand adversarial pass"
```

---

### Task 5: Smoke verification

**Files:** None — verification only.

- [ ] **Step 1: Verify adversarial-pass skill structure**

```bash
grep -E "^(## |### 挑战)" /Users/CK/Desktop/P\ NO.16/unicron/skills/adversarial-pass/SKILL.md
```
Expected: `## 输入`, `## 严重级别`, `## 流程`, 5 × `### 挑战 N：`, `## 报告格式`, `## 返回`, `## 规则`

- [ ] **Step 2: Verify all 4 rules in adversarial-pass**

```bash
grep "^- \*\*" /Users/CK/Desktop/P\ NO.16/unicron/skills/adversarial-pass/SKILL.md
```
Expected: 4 lines (只读, 全量运行, 精确描述发现, 不误报)

- [ ] **Step 3: Verify dispatcher Step 2b is present and positioned correctly**

```bash
grep -n "步骤 2b\|步骤 3：调度" /Users/CK/Desktop/P\ NO.16/unicron/skills/dispatcher/SKILL.md
```
Expected: 步骤 2b appears before 步骤 3.

- [ ] **Step 4: Verify challenges_fired in all 3 files**

```bash
grep -l "challenges_fired" /Users/CK/Desktop/P\ NO.16/unicron/skills/dispatcher/SKILL.md /Users/CK/Desktop/P\ NO.16/unicron/skills/cache-writer/SKILL.md
```
Expected: both files listed.

- [ ] **Step 5: Verify /unicron:challenge in unicron skill**

```bash
grep "unicron:challenge" /Users/CK/Desktop/P\ NO.16/unicron/skills/unicron/SKILL.md | wc -l
```
Expected: 2 or more.

- [ ] **Step 6: Acceptance criteria check**

| AC | Verification |
|---|---|
| 1. adversarial-pass skill with 5 challenge types | Step 1 confirms 5 挑战 headings |
| 2. Each challenge has severity + dispatcher action | Step 1 confirms 严重级别 section + per-challenge severity rules |
| 3. Report format matches template | grep "⚔" in adversarial-pass |
| 4. All 5 risk signals in dispatcher Step 2b | Step 3 confirms Step 2b heading present |
| 5. Step 2b between Step 2 and Step 3 | Step 3 confirms ordering |
| 6. Critical findings pause dispatch | grep "暂停调度" in dispatcher |
| 7. Warning injected into context, not shown | grep "对抗性检查警告" in dispatcher |
| 8. Advisory findings silent | grep "静默忽略" in dispatcher |
| 9. Re-run limit: once after user action | grep "重新调用.*一次" in dispatcher |
| 10. Full block if Critical persists after re-run | grep "完全阻塞" in dispatcher |
| 11. cache-writer accepts challenges_fired | Step 4 confirms |
| 12. challenges_fired: none on failure/retry | grep in dispatcher Step 4 |
| 13. /unicron:challenge command added | Step 5 confirms |
| 14. On-demand shows Advisory findings | grep "包含 Advisory 发现" in unicron |
| 15. On-demand never modifies dispatch state | grep "不修改调度状态" in unicron |

- [ ] **Step 7: Final git log check**

```bash
cd /Users/CK/Desktop/P\ NO.16/unicron && git log --oneline -5
```
Expected: last 4 commits cover Tasks 1–4.
