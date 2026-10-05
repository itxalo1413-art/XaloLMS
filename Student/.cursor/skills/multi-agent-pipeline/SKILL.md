---
name: multi-agent-pipeline
description: >-
  Runs a 5-role multi-agent work pipeline (Analyze → Implement → Test → Fix →
  Report) with structured handoff briefs via Cursor Task subagents. Use when
  the user says "chạy pipeline", "multi-agent", "chia agent", "phân tích rồi
  xử lý", or asks to split a large feature/bug across analyze/implement/test/
  fix/report agents.
---

# Multi-agent pipeline

Parent chat = **Analyze + Orchestrator**. Spawn Task subagents for Implement / Test / Fix / Report. Do **not** use this for 1–2 file edits or quick Q&A.

## Pipeline

```
Analyze → Implement → Test → (Fix ↔ Test)* → Report → Analyze (next / done)
```

Max Fix↔Test loops: **2**. After that, Report with blockers and stop.

| Role | Who | Does | Must not |
|------|-----|------|----------|
| Analyze | Parent | Scope, files, risks, acceptance checks | Edit production code |
| Implement | Task | Code only per brief | Expand scope, skip tests plan |
| Test | Task | Run checks, collect evidence | “Fix to make green” |
| Fix | Task | Fix failures only | Broad refactor |
| Report | Task or parent | Verdict + leftovers | New features |

Prefer `subagent_type: generalPurpose` (or `explore` for Analyze-only digs). Run Implement then Test **sequentially** (Test needs the diff). Independent explores may run in parallel during Analyze.

## Handoff brief (required between every role)

Every agent final response **must** end with this block (fill all fields):

```markdown
### PIPELINE_BRIEF
- Role: Analyze | Implement | Test | Fix | Report
- Goal:
- Scope (in):
- Scope (out):
- Files:
- Done:
- Evidence: (commands, pass/fail, screenshots paths)
- Risks / blockers:
- Next role: Implement | Test | Fix | Report | Analyze | Done
- Next prompt: (one paragraph the orchestrator can paste into Task)
```

Orchestrator copies `Next prompt` + prior `PIPELINE_BRIEF` into the next Task `prompt`. Subagents have **no** parent chat history — put all needed context in the prompt.

## Analyze (parent)

1. Restate user goal in 1–2 sentences.
2. Locate relevant files (Grep/Glob/explore Task if wide).
3. Write acceptance checks the Test role will run.
4. Emit `PIPELINE_BRIEF` with `Next role: Implement`.
5. Spawn Implement Task with full brief.

## Implement (Task)

- Follow Scope (in) only; list every file touched in `Done`.
- No drive-by refactors, no unsolicited docs/commits.
- Emit brief → `Next role: Test`.

## Test (Task)

- Run the acceptance checks from Analyze (unit/typecheck/smoke as applicable).
- Prefer repo scripts (`npx tsc`, targeted tests, curl/API smoke).
- If all pass → `Next role: Report`.
- If fail → `Next role: Fix` with failing evidence + suspected files.

## Fix (Task)

- Fix **only** failures listed by Test.
- Emit brief → `Next role: Test` (re-verify).

## Report (Task or parent)

Summarize for the user (and Analyze):

```markdown
### PIPELINE_REPORT
- Status: Done | Blocked | Partial
- What changed:
- Verification:
- Leftovers / next Analyze items:
```

Then Analyze either starts the next scoped slice or stops.

## Triggers

- User: `chạy pipeline`, `multi-agent`, `chia agent`, `pipeline: <task>`
- Auto: large multi-layer work (API + FE + roles/permissions) or hard bugs needing isolate diagnose/fix/verify

## Anti-patterns

- Spawning all 5 agents in parallel for the same change
- Implement without Analyze brief
- Fix rewriting unrelated modules
- Silent scope creep between roles
- Using pipeline for typo/copy/one-liner changes
