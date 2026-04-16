# Smarter Investigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `skills/investigate/SKILL.md` to add domain classification from Q1, domain-specific adaptive Q2–Q5 question sets, gap-type confidence scoring, and a structured exit payload passed to spec-writer.

**Architecture:** Single markdown file rewrite. Q1 classifies the domain (7 types); Q2–Q5 load the matching question set; gap-type tracking (missing/ambiguous/conflicting) drives follow-up questions in criticality order; exit produces a structured context block for spec-writer.

**Tech Stack:** Markdown only. No code changes. Verification via grep + smoke test.

---

## File Map

| Action | Path | What changes |
|--------|------|-------------|
| Modify | `skills/investigate/SKILL.md` | Full rewrite in Simplified Chinese |

No other files change.

---

### Task 1: Rewrite `skills/investigate/SKILL.md`

**Files:**
- Modify: `skills/investigate/SKILL.md`

This is the only task. Replace the entire file with the new smarter investigation skill in Simplified Chinese. All prose, headings, bullets, and table content in Chinese. YAML frontmatter keys, code block content, command names, file paths, and tech identifiers stay in English.

- [ ] **Step 1: Create a new branch**

```bash
git checkout main
git checkout -b feature/smarter-investigation
```

- [ ] **Step 2: Verify the current file content**

```bash
cat skills/investigate/SKILL.md | head -20
```

Expected: frontmatter with `name: investigate`, followed by Chinese content from the translation pass.

- [ ] **Step 3: Write the new SKILL.md**

Replace the entire contents of `skills/investigate/SKILL.md` with:

```markdown
---
name: investigate
description: "Unicron 调查循环。对 Q1 答案进行领域分类，加载领域自适应问题集（Q2–Q5），通过间隙类型（缺失/模糊/冲突）对 6 个置信维度评分，所有维度达到 70% 后生成结构化退出载荷并移交 spec-writer。"
---

# Unicron 调查循环

你的任务是学习编写完整规格说明所需的一切信息。每次只提一个问题。每次回答后更新并显示实时上下文面板。

## 第一阶段：领域分类（Q1）

**始终先问 Q1：**
> "你在构建什么？请用 2–3 句话描述——它做什么、为谁而做。"

根据答案对领域进行分类（不向用户透露分类结果）：

| 领域 | 信号词 |
|------|--------|
| `mobile-app` | iOS、Android、Flutter、React Native、Swift、Kotlin、"移动端" |
| `web-app` | 仪表盘、门户、SPA、Next.js、React、Vue、"网页应用"、"网站" |
| `web-api` | API、REST、GraphQL、后端、服务、微服务、接口 |
| `internal-tool` | "内部"、"团队使用"、管理面板、运营工具、"只有我们用" |
| `data-pipeline` | ETL、管道、数据摄取、分析、Spark、Kafka、"处理数据" |
| `cli-tool` | CLI、终端、命令行、脚本、自动化 |
| `other` | 无明确匹配——退回通用 Q2–Q5 |

**多领域答案（如"带 REST API 的移动应用"）：** 选取主领域（`mobile-app`），将次领域作为已知集成面——将集成维度预置为 50% 置信度，间隙类型为 `ambiguous`。

**模糊答案处理：** 提取已知信息，内联说明假设（"我假设这是个人效率工具——如有误请纠正"），继续下一个问题，在置信面板中反映剩余不确定性。

---

## 第二阶段：自适应核心问题（Q2–Q5）

根据领域加载对应问题集，一次一个：

### `mobile-app`
- Q2："目标平台——仅 iOS、仅 Android，还是两者都有？是否有最低系统版本要求？"
- Q3："原生开发（Swift/Kotlin）还是跨平台（React Native、Flutter）？或无偏好？"
- Q4："硬性约束：App Store / Play Store 截止日期、是否需要离线支持、推送通知、设备硬件访问（相机、GPS、生物识别）？"
- Q5："3 个月后成功是什么样的？下载量、DAU、某个功能上线，还是其他指标？"

### `web-api`
- Q2："谁使用这个 API——你自己的前端、第三方开发者、内部服务，还是混合？"
- Q3："技术栈偏好：语言、框架、数据库？或'你来选'？"
- Q4："硬性约束：认证模型（OAuth、API 密钥、JWT）、限流要求、SLA、合规（GDPR、HIPAA、SOC2）？"
- Q5："3 个月后成功是什么样的？接口交付数量、延迟目标、集成上线？"

### `web-app`
- Q2："用户是谁，大约多少人——消费者、内部团队、企业客户？"
- Q3："技术栈偏好：前端框架、后端、数据库？或'你来选'？"
- Q4："硬性约束：截止日期、认证要求、合规、SEO 需求、无障碍（WCAG）？"
- Q5："3 个月后成功是什么样的？"

### `internal-tool`
- Q2："有多少人使用这个工具，他们的技术水平如何——工程师、运营、非技术人员？"
- Q3："技术栈偏好，或需要适配现有内部平台？"
- Q4："硬性约束：是否需要 SSO/LDAP、数据敏感性、必须本地部署还是云端可接受？"
- Q5："成功是什么样的——替代了某个流程、节省了多少小时、降低了错误率？"

### `data-pipeline`
- Q2："数据来源是什么——数据库、API、文件、流？目标是什么？"
- Q3："技术栈偏好：Python/Spark/Airflow/dbt，或'你来选'？批处理、流处理，还是两者？"
- Q4："硬性约束：数据量（GB/TB/PB）、延迟要求、SLA、合规、PII 处理？"
- Q5："成功是什么样的——管道运行正常、数据质量达标、下游系统完成对接？"

### `cli-tool`
- Q2："谁使用这个 CLI——开发者、运维、最终用户？在什么操作系统上？"
- Q3："CLI 语言偏好？（Go、Node、Python、Rust，或无偏好）"
- Q4："硬性约束：分发方式（brew、npm、二进制）、是否需要自动更新、凭证/配置管理？"
- Q5："3 个月后成功是什么样的？"

### `other`（通用退回）
- Q2："用户是谁？（如消费者、内部团队、开发者、企业）——大约多少人？"
- Q3："你的技术栈是什么，或有偏好吗？（如 React + Node、Python/Django、Swift、Flutter，或'你来选'）"
- Q4："硬性约束是什么？考虑：截止日期、预算、团队规模、合规要求（GDPR、HIPAA、SOC2）或规模目标。"
- Q5："3 个月后成功是什么样的？请具体说——一个数字、一个里程碑、一项能力。"

---

## 第三阶段：间隙驱动的追加问题

Q5 回答后，对 6 个维度评分并分类每个间隙。按关键性顺序生成追加问题，直到所有维度达到 ≥ 70%。

---

## 置信度模型

### 6 个维度

| 维度 | 衡量内容 |
|------|---------|
| 架构清晰度 | 系统结构是否清晰到足以选择模式？ |
| 数据模型清晰度 | 核心实体及其关系是否已知？ |
| 集成面 | 外部服务/API 是否已识别？ |
| 安全与合规 | 认证要求和合规约束是否已知？ |
| 规模要求 | 预期负载、用户数、数据量是否已知？ |
| 团队与部署 | 谁来构建、如何部署是否已知？ |

### 间隙类型

| 间隙类型 | 含义 | 分数上限 | 问题风格 |
|---------|------|---------|---------|
| `missing` | 该维度无任何信息 | 无上限 | 引导式："你的认证方案是什么？" |
| `ambiguous` | 有信息但含义不明确 | 60% | 界定式："'内部用户'——仅员工还是也包括承包商？" |
| `conflicting` | 两个回答相互矛盾 | 40% | 消歧式："你同时提到了 JWT 和会话——用哪个？" |
| `none` | 足够清晰 | 100% | 无需提问 |

维度只有在间隙类型为 `none` 时才能达到 ≥ 70%。

**追加问题关键性顺序：** 架构 → 数据模型 → 集成 → 安全 → 规模 → 团队/部署

### 实时上下文面板

每次回答后（包括 Q1–Q5 及所有追加问题）显示此面板：

```
📋 目前已知：
  项目：      [一行描述]
  用户：      [人群 + 数量]
  技术栈：    [技术]
  约束：      [截止日期 / 预算 / 合规]
  成功指标：  [3 个月目标]

  置信度：
    架构清晰度    [████████░░]  80%  ✓
    数据模型      [██████░░░░]  60%  ~ 模糊
    集成面        [████░░░░░░]  40%  ? 缺失
    安全/合规     [██████████] 100%  ✓
    规模要求      [███████░░░]  70%  ✓
    团队/部署     [████░░░░░░]  40%  ⚡ 冲突
```

间隙类型标识：`✓` 无 · `~` 模糊 · `?` 缺失 · `⚡` 冲突

---

## 偏好检测

每次回答后（Q1–Q5 及所有追加问题），扫描表达的偏好：

**检测信号：**
- "我总是用 X" / "我从不用 X"
- "我偏好 X" / "我喜欢 X"
- "我们总是做 X" / "我们不做 X"
- 对工具、模式或流程的强烈意见

**检测到时：**
静默调用 `memory-writer`，传入：
- `content`：一句话表达的偏好
- `event`：`preference-detected`

不中断调查流程，不向用户宣告。

**示例：**
- "我总是用 Tailwind 做样式" → 写入："用户总是使用 Tailwind CSS 做样式。"
- "我们不用 ORM，只用原生 SQL" → 写入："用户偏好原生 SQL 而非 ORM。"
- "我喜欢最少的审批门槛" → 写入："用户偏好最少审批门槛——跳过可选确认提示。"

---

## 调查退出

所有 6 个维度达到 ≥ 70% 后，向用户展示完整理解摘要：

> "我有足够信息来编写规格说明了。以下是我的完整理解：
>
> **项目：** [一行描述]
> **领域：** [分类领域]
> **用户：** [人群 + 数量]
> **技术栈：** [已确认技术]
> **架构方案：** [推荐模式及理由]
> **数据模型：** [核心实体及关键关系]
> **集成：** [外部服务/API]
> **约束：** [硬性约束]
> **成功指标：** [可衡量的 3 个月目标]
>
> **待解问题**（规格说明中将标注）：
> - [仍然模糊或明确未解决的事项]
>
> 这看起来对吗？在我编写规格说明之前，有什么需要纠正的吗？"

等待确认。用户请求修改时，更新理解并重新确认。确认后，调用 `spec-writer` 技能，传入结构化载荷：已确认事实、待解问题、推荐架构方案。

---

## 模式变体

如果从主 unicron 技能传入了模式上下文：
- **new-feature**：Q1 聚焦于具体功能，而非整个系统。询问它如何适配现有架构。
- **bug-fix**：用"描述 Bug"、"预期行为是什么？"、"实际行为是什么？"替换 Q1–Q3。跳过置信度评分——直接用 Bug 修复规格格式调用 spec-writer。
- **refactor**：聚焦于当前痛点、目标架构以及不能破坏的内容。
```

- [ ] **Step 4: Verify key sections exist**

```bash
grep -c "第一阶段" skills/investigate/SKILL.md
grep -c "第二阶段" skills/investigate/SKILL.md
grep -c "第三阶段" skills/investigate/SKILL.md
grep -c "mobile-app" skills/investigate/SKILL.md
grep -c "web-api" skills/investigate/SKILL.md
grep -c "data-pipeline" skills/investigate/SKILL.md
grep -c "cli-tool" skills/investigate/SKILL.md
grep -c "ambiguous" skills/investigate/SKILL.md
grep -c "conflicting" skills/investigate/SKILL.md
grep -c "待解问题" skills/investigate/SKILL.md
grep -c "memory-writer" skills/investigate/SKILL.md
```

Expected: each command prints `1` or higher (no zeroes).

- [ ] **Step 5: Verify gap-type caps are present**

```bash
grep "60%" skills/investigate/SKILL.md
grep "40%" skills/investigate/SKILL.md
```

Expected: both lines found — these are the ambiguous and conflicting caps from the confidence model table.

- [ ] **Step 6: Run smoke test**

```bash
node core/installer.js --home "$(mktemp -d)" 2>&1 | grep "claude-code done"
```

Expected output contains: `claude-code done`

Then verify the skill file is installed correctly by the installer:

```bash
TEMP="$(mktemp -d)"
node core/installer.js --home "$TEMP" 2>&1
grep -c "第一阶段" "$TEMP/.claude/skills/unicron/investigate/SKILL.md"
```

Expected: `1`

- [ ] **Step 7: Commit**

```bash
git add skills/investigate/SKILL.md
git commit -m "update: smarter investigation — domain classification, adaptive Q2–Q5, gap-type confidence, structured exit payload"
```

- [ ] **Step 8: Push branch**

```bash
git push -u origin feature/smarter-investigation
```

---

### Task 2: Merge to main

- [ ] **Step 1: Switch to main and merge**

```bash
git checkout main
git merge feature/smarter-investigation --no-ff -m "merge: smarter investigation skill"
```

- [ ] **Step 2: Run full smoke test on main**

```bash
bash tests/smoke.sh
```

Expected: `=== All smoke tests passed ===`

- [ ] **Step 3: Push main**

```bash
git push origin main
```

- [ ] **Step 4: Delete feature branch**

```bash
git branch -d feature/smarter-investigation
git push origin --delete feature/smarter-investigation
```
