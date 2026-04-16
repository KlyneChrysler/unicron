---
name: investigate
description: "Investigation loop for Unicron. Asks 5 minimum required questions, tracks confidence scores across 6 dimensions, shows live context panel after each answer, exits when all dimensions ≥ 70% and user confirms."
---

# Unicron Investigation Loop

Your job is to learn everything needed to write a complete spec. Ask one question at a time. After every answer, update and display the live context panel.

## Phase 1: Required Questions (always ask all 5)

Ask these in order, one per message:

- Q1: "What are you building? Describe it in 2–3 sentences — what it does and who it's for."
- Q2: "Who are the users? (e.g. consumers, internal team, developers, businesses) — and roughly how many?"
- Q3: "What's your tech stack, or do you have preferences? (e.g. React + Node, Python/Django, Swift, Flutter, or 'you choose')"
- Q4: "What are your hard constraints? Think: deadline, budget, team size, compliance requirements (GDPR, HIPAA, SOC2), or scale targets."
- Q5: "What does success look like in 3 months? Be specific — a number, a milestone, a capability."

## Phase 2: Confidence Scoring (adaptive)

After Q5, compute a score (0–100%) for each of these 6 dimensions:

| Dimension | What you're measuring |
|---|---|
| Architecture clarity | Do you know the system's structure well enough to choose patterns? |
| Data model clarity | Do you know the core entities and their relationships? |
| Integration surface | Do you know what external services/APIs connect to this? |
| Security & compliance | Do you know auth requirements and any compliance constraints? |
| Scale requirements | Do you know expected load, users, data volume? |
| Team & deployment | Do you know who's building this and how it gets deployed? |

For any dimension below 70%, generate one targeted question and ask it. Continue until all dimensions ≥ 70%.

## Live Context Panel

After EVERY answer (including Q1–Q5), show this panel updated with what you know:

```
📋 What I know so far:
  Project:      [one-line description]
  Users:        [who + how many]
  Stack:        [technologies]
  Constraints:  [deadline / budget / compliance]
  Success:      [3-month success metric]

  Confidence:
    Architecture      [████████░░]  80%
    Data model        [██████░░░░]  60%  ← asking next
    Integrations      [████░░░░░░]  40%  ← need more
    Security/Compliance [██████████] 100%
    Scale             [███████░░░]  70%
    Team/Deployment   [██████░░░░]  60%  ← need more
```

## Investigation Exit

When all 6 dimensions reach 70%+, present a full understanding summary:

> "I think I have enough to write the spec. Here's my full understanding:
>
> **Project:** [description]
> **Users:** [users]
> **Stack:** [stack]
> **Architecture approach:** [your recommendation]
> **Key design patterns:** [patterns you'll use]
> **Data models:** [core entities]
> **Integrations:** [external services]
> **Constraints:** [hard constraints]
> **Success criteria:** [measurable goal]
>
> Does this look right? Any corrections before I write the spec?"

Wait for confirmation. If the user requests changes, update your understanding and re-confirm. When confirmed, invoke the `spec-writer` skill.

## Mode Variants

If called with mode context from the main unicron skill:
- **new-feature**: Focus Q1 on the specific feature, not the whole system. Ask about how it fits the existing architecture.
- **bug-fix**: Replace Q1–Q3 with: "Describe the bug", "What's the expected behavior?", "What's the actual behavior?". Skip confidence scoring — go straight to spec-writer with a bug-fix spec format.
- **refactor**: Focus on current pain points, target architecture, and what must not break.
