# Smarter Investigation Design
_Generated: 2026-04-17 | Status: Draft_

---

## 1. Goal

Replace the current fixed 5-question investigation loop with a domain-aware, gap-driven investigation that adapts to what the user tells it, generates questions matched to the type of gap (missing / ambiguous / conflicting), and hands the spec-writer a structured payload instead of raw Q&A.

---

## 2. Current State

The existing `investigate` skill:
- Asks 5 fixed questions (Q1–Q5) in the same order for every project type
- Scores 6 dimensions (0–100%) with a 70% exit threshold
- Generates generic follow-up questions when a dimension is below 70%
- Exits with a plain-text confirmation summary
- Passes no structured context to spec-writer

---

## 3. Three-Stage Flow

### Stage 1 — Domain Classification (Q1)

Q1 is the same anchor question for every project:
> "What are you building? Describe it in 2–3 sentences — what it does and who it's for."

The answer classifies the domain. Classification is implicit — never announced to the user.

| Domain | Signals |
|--------|---------|
| `mobile-app` | iOS, Android, Flutter, React Native, Swift, Kotlin, "mobile" |
| `web-app` | dashboard, portal, SPA, Next.js, React, Vue, "web app", "website" |
| `web-api` | API, REST, GraphQL, backend, service, microservice, endpoints |
| `internal-tool` | "internal", "for our team", admin panel, ops tool, "only we use it" |
| `data-pipeline` | ETL, pipeline, ingestion, analytics, Spark, Kafka, "process data" |
| `cli-tool` | CLI, terminal, command-line, script, automation |
| `other` | no clear match — falls back to generic Q2–Q5 |

If the answer spans multiple domains (e.g., "a mobile app backed by a REST API"), the skill picks the **primary** domain and notes the secondary as a known integration surface — pre-populating the integrations dimension at 50% confidence with gap type `ambiguous`.

### Stage 2 — Adaptive Core Questions (Q2–Q5)

Q2–Q5 use domain-specific wording and ordering. Same 4 slots, adapted content.

#### `mobile-app`
- Q2: "What platform — iOS only, Android only, or both? And are you targeting a specific OS version floor?"
- Q3: "Native (Swift/Kotlin) or cross-platform (React Native, Flutter)? Or no preference?"
- Q4: "Hard constraints: App Store / Play Store deadlines, offline support required, push notifications, device hardware access (camera, GPS, biometrics)?"
- Q5: "What does success look like in 3 months? Downloads, DAU, a specific feature shipped, or something else?"

#### `web-api`
- Q2: "Who consumes this API — a frontend you own, third-party developers, internal services, or a mix?"
- Q3: "Stack preference: language, framework, database? Or 'you choose'?"
- Q4: "Hard constraints: auth model (OAuth, API keys, JWT), rate limiting requirements, SLA, compliance (GDPR, HIPAA, SOC2)?"
- Q5: "What does success look like in 3 months? Endpoints shipped, latency targets, integrations live?"

#### `web-app`
- Q2: "Who are the users and roughly how many — consumers, internal team, businesses?"
- Q3: "Stack preference: frontend framework, backend, database? Or 'you choose'?"
- Q4: "Hard constraints: deadline, auth requirements, compliance, SEO needs, accessibility (WCAG)?"
- Q5: "What does success look like in 3 months?"

#### `internal-tool`
- Q2: "How many people use this, and what's their technical level — engineers, ops, non-technical staff?"
- Q3: "Stack preference, or should it fit an existing internal platform?"
- Q4: "Hard constraints: SSO/LDAP required, data sensitivity, needs to run on-premise or is cloud fine?"
- Q5: "What does success look like — a process replaced, hours saved, an error rate reduced?"

#### `data-pipeline`
- Q2: "What's the data source — databases, APIs, files, streams? And what's the destination?"
- Q3: "Stack preference: Python/Spark/Airflow/dbt, or 'you choose'? Batch, streaming, or both?"
- Q4: "Hard constraints: data volume (GB/TB/PB), latency requirements, SLA, compliance, PII handling?"
- Q5: "What does success look like — pipeline running, data quality threshold met, downstream system fed?"

#### `cli-tool`
- Q2: "Who runs this — developers, ops, end users? And on what OS?"
- Q3: "Language preference for the CLI? (Go, Node, Python, Rust, or no preference)"
- Q4: "Hard constraints: distribution method (brew, npm, binary), auto-update required, credential/config management?"
- Q5: "What does success look like in 3 months?"

#### `other`
Falls back to generic Q2–Q5:
- Q2: "Who are the users? (e.g. consumers, internal team, developers, businesses) — and roughly how many?"
- Q3: "What's your tech stack, or do you have preferences? (e.g. React + Node, Python/Django, Swift, Flutter, or 'you choose')"
- Q4: "What are your hard constraints? Think: deadline, budget, team size, compliance requirements (GDPR, HIPAA, SOC2), or scale targets."
- Q5: "What does success look like in 3 months? Be specific — a number, a milestone, a capability."

### Stage 3 — Gap-Driven Follow-ups

After Q5, score all 6 dimensions and classify each gap. Generate follow-up questions in criticality order until all dimensions reach ≥ 70%.

---

## 4. Confidence Model

### Dimensions (unchanged)

| Dimension | What it measures |
|-----------|-----------------|
| Architecture clarity | System structure clear enough to choose patterns |
| Data model clarity | Core entities and relationships known |
| Integration surface | External services / APIs identified |
| Security & compliance | Auth requirements and compliance constraints known |
| Scale requirements | Expected load, users, data volume known |
| Team & deployment | Who's building this and how it deploys |

### Gap Types

| Gap type | Meaning | Score cap | Question style |
|----------|---------|-----------|----------------|
| `missing` | No information given | None | Elicitation: "What's your auth approach?" |
| `ambiguous` | Info given but unclear | 60% | Scoping: "By 'internal users' — employees only, or contractors too?" |
| `conflicting` | Two answers contradict | 40% | Disambiguation: "You mentioned both JWT and sessions — which?" |
| `none` | Sufficiently clear | 100% | No question needed |

A dimension can only reach ≥ 70% when gap type is `none`.

### Follow-up Criticality Order

Architecture → Data model → Integrations → Security → Scale → Team/Deployment

### Assumption Handling

When an answer is partial or vague, the skill:
1. Extracts what it can
2. States the assumption inline: "Assuming personal productivity — correct me if wrong"
3. Continues to the next question
4. Reflects remaining uncertainty in the confidence panel

### Live Context Panel

Updated after every answer (Q1–Q5 and all follow-ups):

```
📋 What I know so far:
  Project:      [one-line description]
  Users:        [who + how many]
  Stack:        [technologies]
  Constraints:  [deadline / budget / compliance]
  Success:      [3-month success metric]

  Confidence:
    Architecture      [████████░░]  80%  ✓
    Data model        [██████░░░░]  60%  ~ ambiguous
    Integrations      [████░░░░░░]  40%  ? missing
    Security          [██████████] 100%  ✓
    Scale             [███████░░░]  70%  ✓
    Team/Deployment   [████░░░░░░]  40%  ⚡ conflicting
```

Gap type indicators: `✓` none · `~` ambiguous · `?` missing · `⚡` conflicting

---

## 5. Exit Payload

When all 6 dimensions reach ≥ 70%, present the full understanding summary to the user:

> "I have what I need to write the spec. Here's my full understanding:
>
> **Project:** [one-line description]
> **Domain:** [classified domain]
> **Users:** [who + how many]
> **Stack:** [confirmed technologies]
> **Architecture approach:** [recommended pattern and why]
> **Data models:** [core entities and key relationships]
> **Integrations:** [external services/APIs]
> **Constraints:** [hard constraints]
> **Success criteria:** [measurable 3-month goal]
>
> **Open questions** *(spec will flag these)*:
> - [anything that stayed ambiguous or was explicitly unresolved]
>
> Does this look right? Any corrections before I write the spec?"

The spec-writer receives this as a structured context block. Open questions become a dedicated **"Open Questions / Assumptions"** section in the spec.

---

## 6. Preference Detection (unchanged)

After every answer, scan for expressed preferences and invoke `memory-writer` silently:
- "I always use X" / "I never use X"
- "I prefer X" / "I like X"
- Strong opinions about tools, patterns, or process

---

## 7. Mode Variants (unchanged)

- **new-feature**: Focus Q1 on the feature, not the whole system
- **bug-fix**: Replace Q1–Q3 with describe/expected/actual; skip confidence scoring
- **refactor**: Focus on current pain points, target architecture, what must not break

---

## 8. Files Changed

| File | Change |
|------|--------|
| `skills/investigate/SKILL.md` | Full rewrite — domain classification, adaptive Q2–Q5, gap-type confidence model, structured exit payload |

No other files change. The exit payload is passed to spec-writer as context — spec-writer skill requires no changes (it already accepts freeform context from the investigation summary).

---

## 9. Acceptance Criteria

1. Q1's answer classifies the domain and selects the appropriate Q2–Q5 question set
2. A mobile-app project gets mobile-specific questions; a web-api project gets API-specific questions; `other` falls back to generic
3. A vague answer states its assumption inline and continues — does not interrupt flow
4. Multi-domain answers (e.g., mobile + API) pre-populate the integrations dimension with medium confidence
5. Each below-threshold dimension shows its gap type (`?` / `~` / `⚡`) in the live context panel
6. A `conflicting` dimension never scores above 40% until resolved
7. An `ambiguous` dimension never scores above 60% until resolved
8. Follow-up questions fire in criticality order: architecture first, team/deployment last
9. Exit payload includes confirmed facts, open questions list, and recommended architecture approach
10. Open questions appear as a named section in the generated spec, not buried in the body
11. Preference detection continues to run silently throughout all stages
