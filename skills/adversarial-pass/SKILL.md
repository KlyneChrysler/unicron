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
