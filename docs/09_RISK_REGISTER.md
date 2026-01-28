# Risk Register

Each risk includes severity, likelihood, mitigation, monitoring signal, and gate if applicable.

---

## RISK-001 - GPL licensing contamination
- Severity: Critical
- Likelihood: Medium
- Mitigation: Enforce licensing policy; avoid GPL chess libraries; review dependencies.
- Monitoring signal: CI license checks, dependency audit log.
- Go/No-Go gate: No public MVP release if any GPL dependency exists.

## RISK-002 - Unsafe explicit content hosted
- Severity: Critical
- Likelihood: Low
- Mitigation: Tier 4 content local-only; LLM disabled; no uploads in MVP.
- Monitoring signal: App telemetry showing Tier 4 usage and LLM bypass logs.
- Go/No-Go gate: No server-side upload for Tier 4 until moderation tooling exists.

## RISK-003 - Prompt injection or unsafe LLM output
- Severity: High
- Likelihood: Medium
- Mitigation: Tone enum only, pre/post moderation, structured outputs.
- Monitoring signal: Moderation flag rate; user reports of unsafe output.
- Go/No-Go gate: LLM features remain optional; disable on high flag rate.

## RISK-004 - Illusion of mastery
- Severity: High
- Likelihood: Medium
- Mitigation: position-only prompts, random start points, transposition injections, cold tests.
- Monitoring signal: Drop in cold-test accuracy; high error on random-start drills.
- Go/No-Go gate: Level 8 graduation requires cross-day tests and cold retention.

## RISK-005 - Data loss (local-only storage)
- Severity: High
- Likelihood: Medium
- Mitigation: export/import backup and reminders (V1).
- Monitoring signal: User feedback about lost progress.
- Go/No-Go gate: Must provide export/import before large public rollout.

## RISK-006 - Mobile performance degradation
- Severity: High
- Likelihood: Medium
- Mitigation: Web Worker for PGN parsing; lightweight board updates.
- Monitoring signal: Long task warnings, UI frame drops.
- Go/No-Go gate: PGN import budgets must be met on mid-tier mobile.

## RISK-007 - Review overload and churn
- Severity: Medium
- Likelihood: Medium
- Mitigation: daily caps, key-move mode (V1), gradual expansion.
- Monitoring signal: Due backlog growth, session completion rate.
- Go/No-Go gate: Daily cap enforcement must pass integration tests.

## RISK-008 - LLM cost runaway
- Severity: Medium
- Likelihood: Medium
- Mitigation: prompt caching, exact cache, rate limits, deterministic fallback.
- Monitoring signal: Token usage per user per day.
- Go/No-Go gate: Enforce per-day budget before scaling acquisition.

## RISK-009 - Copyrighted opening content misuse
- Severity: Medium
- Likelihood: Low
- Mitigation: user-import only for proprietary PGNs; use public domain for built-in examples.
- Monitoring signal: Upload size and source patterns; user reports.
- Go/No-Go gate: Do not distribute third-party repertoire files without rights.

