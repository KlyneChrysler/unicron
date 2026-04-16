---
name: auditor
description: "Codebase health scan. Silently detects tech stack, assesses architecture, code quality, test coverage, and security posture. Produces a structured health report before asking the user anything."
---

# Unicron Auditor

Scan the current codebase and produce a health report. Run silently — do not ask the user anything until the report is ready.

## Detection Phase

Scan for the following:

**Tech stack:**
- `package.json` → Node.js / JS / TS project. Read `dependencies` and `devDependencies`.
- `pyproject.toml` / `requirements.txt` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pom.xml` / `build.gradle` → Java / Kotlin
- `pubspec.yaml` → Flutter / Dart
- `*.xcodeproj` / `Package.swift` → Swift / iOS

**Architecture patterns:**
- `src/`, `app/`, `lib/`, `internal/`, `pkg/` directories
- `controllers/`, `services/`, `repositories/`, `models/` → MVC / layered
- `features/` or domain-named directories → feature-sliced / DDD
- `Dockerfile`, `docker-compose.yml`, `k8s/` → containerized
- `*.tf`, `cdk.json`, `serverless.yml` → infrastructure as code

**Test coverage indicators:**
- `__tests__/`, `tests/`, `spec/`, `*.test.*`, `*.spec.*`
- Coverage config files (`jest.config.*`, `pytest.ini`, `.nycrc`)
- `coverage/lcov.info` summary if present

**Security surface:**
- `.env` files (flag if present — should not be committed)
- Auth middleware patterns in route files
- Raw SQL string concatenation (injection risk)
- Dynamic code execution patterns (e.g. `eval`, `exec`, `Function()`) — flag as high risk

**Dependency health:**
- Count total dependencies in manifest
- Note any obviously outdated major versions

## Health Report Format

Present the report in this exact format:

```
🔍 Unicron Health Report
========================

📦 Tech Stack
  Runtime:     [detected runtime + version if readable]
  Framework:   [detected framework]
  Database:    [detected ORM/DB client if any]
  Testing:     [test framework if detected]

🏗️ Architecture
  Pattern:     [MVC / layered / feature-sliced / microservices / unknown]
  Entry point: [main file if detectable]
  Key modules: [top-level directories with brief purpose]
  ⚠️  Concerns: [files >800 lines, deeply nested dirs, god objects]

🧪 Test Coverage
  Test files:  [count]
  Coverage:    [% if available, else "unknown — no coverage report found"]
  ⚠️  Gaps:    [directories with no test files]

🔐 Security Surface
  Auth:        [detected middleware or "none found"]
  .env files:  [present/absent — flag if committed to git]
  ⚠️  Risks:   [raw SQL, dynamic code execution, other injection surfaces]

📚 Dependencies
  Total:       [count]
  ⚠️  Flags:  [any obviously stale major versions]

Overall health: [🟢 Good / 🟡 Needs attention / 🔴 Critical issues found]
```

After presenting the report, return control to the main `unicron` skill to ask what the user wants to work on.
