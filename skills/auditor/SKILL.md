---
name: auditor
description: "Codebase health scan. Silently detects tech stack, assesses architecture, code quality, test coverage, and security posture. Produces a structured health report before asking the user anything."
---

# Unicron 审计员

扫描当前代码库并生成健康报告。静默运行 — 报告准备好之前不要询问用户任何事情。

## 检测阶段

扫描以下内容：

**技术栈：**
- `package.json` → Node.js / JS / TS 项目。读取 `dependencies` 和 `devDependencies`。
- `pyproject.toml` / `requirements.txt` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pom.xml` / `build.gradle` → Java / Kotlin
- `pubspec.yaml` → Flutter / Dart
- `*.xcodeproj` / `Package.swift` → Swift / iOS

**架构模式：**
- `src/`、`app/`、`lib/`、`internal/`、`pkg/` 目录
- `controllers/`、`services/`、`repositories/`、`models/` → MVC / 分层架构
- `features/` 或领域命名目录 → 功能切片 / DDD
- `Dockerfile`、`docker-compose.yml`、`k8s/` → 容器化
- `*.tf`、`cdk.json`、`serverless.yml` → 基础设施即代码

**测试覆盖率指标：**
- `__tests__/`、`tests/`、`spec/`、`*.test.*`、`*.spec.*`
- 覆盖率配置文件（`jest.config.*`、`pytest.ini`、`.nycrc`）
- 如有则读取 `coverage/lcov.info` 摘要

**安全面：**
- `.env` 文件（如果存在则标记 — 不应提交）
- 路由文件中的认证中间件模式
- 原始 SQL 字符串拼接（注入风险）
- 动态代码执行模式（例如 `eval`、`exec`、`Function()`）— 标记为高风险

**依赖健康度：**
- 统计清单中的依赖总数
- 注意任何明显过时的主要版本

## 健康报告格式

以以下确切格式呈现报告：

```
🔍 Unicron 健康报告
========================

📦 技术栈
  运行时：     [检测到的运行时 + 版本（如可读取）]
  框架：       [检测到的框架]
  数据库：     [检测到的 ORM/DB 客户端（如有）]
  测试：       [检测到的测试框架（如有）]

🏗️ 架构
  模式：       [MVC / 分层 / 功能切片 / 微服务 / 未知]
  入口点：     [主文件（如可检测）]
  关键模块：   [顶级目录及简要说明]
  ⚠️  关注点：  [超过 800 行的文件、深度嵌套的目录、上帝对象]

🧪 测试覆盖率
  测试文件：   [数量]
  覆盖率：     [如有则显示百分比，否则显示"未知 — 未找到覆盖率报告"]
  ⚠️  缺口：   [没有测试文件的目录]

🔐 安全面
  认证：       [检测到的中间件或"未找到"]
  .env 文件：  [存在/不存在 — 如已提交到 git 则标记]
  ⚠️  风险：   [原始 SQL、动态代码执行、其他注入面]

📚 依赖
  总数：       [数量]
  ⚠️  标记：  [任何明显陈旧的主要版本]

总体健康度：[🟢 良好 / 🟡 需要关注 / 🔴 发现严重问题]
```

呈现报告后，将控制权返回给主 `unicron` 技能，询问用户想做什么。
