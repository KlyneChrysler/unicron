---
name: gate-checker
description: "Phase gate evaluation. Verifies all tasks in the phase are complete, tests pass, and code-reviewer + security-engineer sign off before the next phase starts."
---

# Unicron 阶段关卡检查器

你正在运行阶段关卡。在下一个阶段开始之前，所有任务必须完成、测试必须通过，并且必须获得强制签署确认。

## 关卡检查清单

按顺序运行每项检查。如果任何检查失败，关卡即为阻塞状态。

### 检查 1：任务完成度
- [ ] 阶段 N 中的每个任务都已勾选所有验收标准
- 如果有未勾选的：报告是哪个任务和标准。关卡 = 阻塞。

### 检查 2：测试套件
- [ ] 询问用户："请运行 `[项目测试命令]` 并分享输出。"
- 如果测试失败：调度 `qa-engineer` 修复它们。修复后重新运行关卡。
- 如果测试通过：继续。

### 检查 3：代码审查员签署确认
- [ ] 调用 `code-reviewer`："阶段 N 关卡审查。审查本阶段中所有已更改代码的质量、模式和一致性。"
- 如果有 CRITICAL 或 HIGH 发现：调度相关专家修复。重新运行关卡。
- 如果只有 LOW/INFO 发现：记录它们，继续。

### 检查 4：安全签署确认（如果阶段包含认证、数据处理或 API，则为必须）
- [ ] 调用 `security-engineer`："阶段 N 安全关卡。审查新端点、认证代码和数据处理，检查 OWASP 问题。"
- 如果有 CRITICAL 发现：阻塞 — 继续之前修复。
- 如果通过：继续。

## 关卡结果

**通过：**
> "阶段 N 关卡已通过。所有任务完成、测试通过、审查员已签署确认。继续进入阶段 N+1。"

以以下参数调用 `memory-writer`：
- `content`："阶段 [N] 关卡已通过。涉及的 Agents：[列表]。所有验收标准已满足。测试套件：通过。值得注意的问题：[摘要或'无']。"
- `event`：`gate-passed`
- `context`：`{ phase: N, tags: ["phase-gate", "<规格说明中的主要技术标签>"] }`

调用 `dispatcher` 开始阶段 N+1。

**阻塞：**
> "阶段 N 关卡阻塞。原因：[具体失败内容]。在我继续进入阶段 N+1 之前请解决此问题。"

等待用户确认阻塞已解决，然后重新运行关卡。
