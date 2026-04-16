---
name: spec-writer
description: "Generates a 14-section spec from investigation context. Self-reviews for completeness, gets user approval, commits to git, then invokes the planner skill."
---

# Unicron Spec Writer

You have completed the investigation. Now write the spec.

## Output File

Write to: `docs/unicron/spec.md`

Create the `docs/unicron/` directory if it doesn't exist.

## Spec Format

Write ALL 14 sections. No section may contain "TBD", "TODO", or placeholder text.

```markdown
# [Project Name] — Unicron Spec
_Generated: YYYY-MM-DD | Status: Draft_

## 1. Goals
[1 paragraph: what this is, who it's for, what success looks like]

## 2. Users & Personas
[Bullet list: each persona with their primary job-to-be-done]

## 3. Functional Requirements
[Numbered list. Each requirement is a testable statement starting with a verb.]

## 4. Non-Functional Requirements
[Performance, security, compliance, scalability — explicit numbers where possible]

## 5. Architecture
[Pattern name, rationale, ASCII or Mermaid component diagram]

## 6. Design Patterns
[Table: Pattern | Applied To | Rationale]

## 7. Data Models
[Core entities, relationships, key fields. Mermaid ERD for anything non-trivial]

## 8. API Contracts
[Key endpoints with method, path, request shape, response shape]

## 9. Folder Structure
[Directory tree with one-line comment per directory]

## 10. Tech Stack
[Table: Layer | Technology | Rationale]

## 11. Integrations
[Table: Integration | How it connects | Auth method]

## 12. Constraints & Risks
[Table: Item | Detail | Mitigation]

## 13. Acceptance Criteria
[Numbered, testable. Each maps to a Functional Requirement]

## 14. Out of Scope (v1)
[Explicit list of what will NOT be built in this cycle]
```

## Self-Review (before showing to user)

After writing, check:
1. **Placeholder scan**: Any "TBD", "TODO", "fill in later"? Fix them.
2. **Consistency**: Does the architecture in §5 match the tech stack in §10? Does the folder structure in §9 match the architecture in §5?
3. **Completeness**: Are all functional requirements in §3 traceable to acceptance criteria in §13?
4. **Scope**: Is §14 explicit enough? The implementation plan cannot be written without knowing what's out of scope.

Fix issues inline. Then proceed.

## Review Gate

After writing the spec, say:

> "Spec written to `docs/unicron/spec.md`. Please review it — check especially:
> - Section 5 (Architecture) matches your vision
> - Section 14 (Out of Scope) correctly excludes what you don't need yet
> - Section 13 (Acceptance Criteria) captures what done means for you
>
> Reply with any changes, or say 'approved' to proceed to planning."

Wait for explicit approval. Apply any changes and re-present if requested.

## On Approval

1. Commit the spec:
```bash
git add docs/unicron/spec.md
git commit -m "add: unicron project spec"
```

2. Invoke the `planner` skill.
