#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- helpers ---
pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; exit 1; }

# --- setup temp home ---
TEMP_HOME="$(mktemp -d)"
trap 'rm -rf "$TEMP_HOME"' EXIT

mkdir -p "$TEMP_HOME/.claude"

# --- run installer ---
OUTPUT="$(node "$REPO_ROOT/core/installer.js" --home "$TEMP_HOME" 2>&1)"

echo "--- installer output ---"
echo "$OUTPUT"
echo "------------------------"

# 1. "claude-code done" in output
echo "$OUTPUT" | grep -q "claude-code done" \
	&& pass "output contains 'claude-code done'" \
	|| fail "output missing 'claude-code done'"

# 2. CLAUDE.md exists
[ -f "$TEMP_HOME/.claude/CLAUDE.md" ] \
	&& pass "CLAUDE.md exists" \
	|| fail "CLAUDE.md not found at $TEMP_HOME/.claude/CLAUDE.md"

# 3. unicron-start marker in CLAUDE.md
grep -q "<!-- unicron-start -->" "$TEMP_HOME/.claude/CLAUDE.md" \
	&& pass "CLAUDE.md contains <!-- unicron-start -->" \
	|| fail "CLAUDE.md missing <!-- unicron-start --> marker"

# 4. memory/preferences/ directory exists
[ -d "$TEMP_HOME/.unicron/memory/preferences" ] \
	&& pass ".unicron/memory/preferences/ directory exists" \
	|| fail ".unicron/memory/preferences/ directory missing"

# 5. MEMORY.md file exists
[ -f "$TEMP_HOME/.unicron/memory/MEMORY.md" ] \
	&& pass ".unicron/memory/MEMORY.md exists" \
	|| fail ".unicron/memory/MEMORY.md missing"

# 6. skills/unicron/ directory exists
[ -d "$TEMP_HOME/.claude/skills/unicron" ] \
	&& pass "skills/unicron/ directory exists" \
	|| fail "skills/unicron/ directory not found"

# 7. each SKILL.md present
SKILLS=(unicron investigate spec-writer planner dispatcher gate-checker auditor)
for skill in "${SKILLS[@]}"; do
	[ -f "$TEMP_HOME/.claude/skills/unicron/$skill/SKILL.md" ] \
		&& pass "skills/unicron/$skill/SKILL.md exists" \
		|| fail "skills/unicron/$skill/SKILL.md not found"
done

# 8. each agent .md present
AGENTS=(
	cto
	solutions-architect
	ux-designer
	frontend-dev
	backend-dev
	mobile-dev
	database-admin
	qa-engineer
	security-engineer
	devops-sre
	technical-writer
	product-analyst
	code-reviewer
)
for agent in "${AGENTS[@]}"; do
	[ -f "$TEMP_HOME/.claude/agents/$agent.md" ] \
		&& pass "agents/$agent.md exists" \
		|| fail "agents/$agent.md not found"
done

echo ""
echo "=== All smoke tests passed ==="
