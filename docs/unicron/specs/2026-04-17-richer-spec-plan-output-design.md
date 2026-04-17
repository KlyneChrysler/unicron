# Richer Spec/Plan Output Design
_Generated: 2026-04-17 | Status: Draft_

---

## 1. Goal

Make `spec-writer` and `planner` produce consistently structured, verifiable output by enforcing mandatory section templates and targeted self-validation — eliminating missing sections, vague acceptance criteria, and orphaned tasks.

---

## 2. Current State

| Skill | Problem |
|-------|---------|
| `spec-writer` | Missing sections (architecture, security), vague acceptance criteria, no traceability to investigation |
| `planner` | Coarse tasks, missing file paths, no dependency mapping |

Both skills rely entirely on LLM judgment for structure and specificity. This produces inconsistent output across sessions.

---

## 3. Approach

**Mandatory template + targeted self-correction** for both skills:

1. The skill defines the exact sections/fields the LLM must produce
2. After generating, the skill validates its own output against explicit rules
3. Only failing sentences/criteria/tasks are rewritten — not the whole document
4. Maximum two correction rounds
5. Unresolvable issues are flagged with `⚠` rather than silently passed

---

## 4. Spec-Writer Changes

### 4.1 Mandatory Template

Every spec must contain exactly these sections in this order:

| Section | Required content |
|---------|-----------------|
| **Overview** | One paragraph: what the system does, who it's for, why it's being built |
| **Users** | Named user types, estimated counts, technical level |
| **Tech Stack** | Confirmed technologies with justification for each choice |
| **Architecture** | Chosen pattern, key components, data flow narrative |
| **Data Models** | Core entities, key fields, relationships |
| **Integrations** | Every external service, what it's used for, auth method |
| **Security & Compliance** | Auth approach, compliance requirements, sensitive data handling |
| **Acceptance Criteria** | Numbered list — every item verifiable as pass/fail |
| **Decisions & Rationale** | Each major decision + the investigation finding that drove it |
| **Open Questions** | Unresolved items from investigation — flagged, not silently assumed |

Sections with nothing to say appear with "None identified" — never omitted.

### 4.2 Self-Validation

**Check 1: Banned phrases**

These phrases anywhere in the spec trigger a rewrite of the containing sentence:

```
"as needed", "as appropriate", "handle errors", "handle edge cases",
"etc.", "and so on", "should be fast", "performant", "scalable",
"best practices", "appropriate", "suitable", "proper"
```

Each rewrite replaces the vague phrase with a specific, concrete statement.

**Check 2: Acceptance criteria measurability**

Every acceptance criterion must contain at least one of:
- A number or threshold (`< 200ms`, `≥ 99.9%`, `at least 3`)
- An HTTP status code (`returns 422`, `responds with 200`)
- A named condition (`when the user is unauthenticated`, `if the file exceeds 10MB`)
- A specific observable behavior (`the button is disabled`, `an email is sent to the registered address`)

**Correction rule:** Patch only failing sentences/criteria. Maximum two rounds. If still failing after two rounds: `⚠ Needs clarification before implementation`.

### 4.3 Decisions & Rationale Section Format

```
## Decisions & Rationale

- **[Decision]:** [What was decided] — driven by [investigation finding that led to this choice]
- **[Decision]:** [What was decided] — driven by [investigation finding that led to this choice]
```

Example:
```
- **Auth approach:** JWT with 24h expiry — driven by Q4: no session storage requirement, stateless API preferred
- **Database:** PostgreSQL — driven by Q3: team has existing Postgres expertise, relational data model confirmed
```

---

## 5. Planner Changes

### 5.1 Mandatory Task Structure

Every task in `plan.md` must use this format:

```
### Task N.M — [Title]

**Implements:** [spec section + requirement number]
**Depends on:** [Task IDs, or "none"]
**Files:**
  - Create: exact/path/to/file
  - Modify: exact/path/to/file (lines N–M if known)
**Agents:** [specialist(s) to dispatch]

**Acceptance criteria:**
- [ ] [copied verbatim from spec]

**Steps:**
- [ ] [discrete step]
- [ ] [discrete step]
```

### 5.2 Self-Validation

**Check 1: Task granularity**

Any task whose Steps contain more than one distinct deliverable (new file, new endpoint, new migration) is split. Signal words: "then", "also", "additionally" between deliverables = split point.

**Check 2: File path completeness**

Banned vague references — must be replaced with exact paths:
```
"the service", "the component", "the model", "the controller",
"the config file", "the relevant file", "the existing file"
```

**Check 3: Dependency consistency**

Every task that uses a type, function, schema, or constant defined in another task must list that task in `Depends on`. Cross-reference by scanning step content against other tasks' file lists.

**Correction rule:** Patch only the failing task. Maximum two rounds. Unresolvable: `⚠ Dependency unclear — confirm before dispatch`.

---

## 6. Files Changed

| File | Change |
|------|--------|
| `skills/spec-writer/SKILL.md` | Add mandatory template, self-validation checks, Decisions & Rationale format |
| `skills/planner/SKILL.md` | Add mandatory task structure, self-validation checks |

---

## 7. Acceptance Criteria

1. Every spec produced by `spec-writer` contains all 10 required sections — including sections with "None identified" when empty
2. No spec acceptance criterion passes validation containing only vague language — each must have a number, HTTP status, named condition, or observable behavior
3. Every spec contains a Decisions & Rationale section linking each major decision to the investigation finding that drove it
4. No spec contains banned phrases (`as needed`, `best practices`, etc.) in its final output
5. Every plan task contains: `Implements`, `Depends on`, `Files`, `Agents`, `Acceptance criteria`, `Steps`
6. No plan task contains vague file references — all paths are exact
7. Every plan task that depends on output from another task lists that task ID in `Depends on`
8. Tasks coarser than one deliverable are split during self-validation
9. Issues unfixable within two correction rounds are flagged with `⚠` rather than silently passed
10. Both skills produce compliant output on the first invocation without user correction
