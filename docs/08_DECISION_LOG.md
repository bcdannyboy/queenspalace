# Decision Log

This log records decisions made while converting juror inputs into a unified plan. Each entry includes options, chosen decision, rationale, risks, and rollback plan.

---

## DEC-001 - No-auth local-first MVP
- Options considered:
  - A) Require accounts from day one
  - B) No auth, local-only storage (chosen)
- Decision: B
- Rationale: Judge report mandates no-auth and local-first; reduces friction and risk.
- Conflict noted: Juror 6 proposes account-centric backend storage; judge overrides to no-auth MVP.
- Risks: Loss of data if browser storage is cleared.
- Rollback plan: Introduce opt-in export/import and later optional accounts (V1+).

## DEC-002 - Position graph with fenKey transposition merging
- Options considered:
  - A) Line-based tree (simpler)
  - B) Position DAG with fenKey merge (chosen)
- Decision: B
- Rationale: Judge report and jurors stress transpositions and position-based mastery.
- Risks: More complex import and ID determinism.
- Rollback plan: Provide route views and keep tree UI, but retain DAG storage.

## DEC-003 - Board UI library
- Options considered:
  - A) Chessground (GPL)
  - B) cm-chessboard (MIT) (chosen)
  - C) react-chessboard (MIT)
- Decision: B
- Rationale: Judge selected cm-chessboard; avoids GPL licensing risk.
- Conflict noted: Juror 5 allows react-chessboard; judge decision is cm-chessboard.
- Risks: Imperative API complexity.
- Rollback plan: Switch to react-chessboard if wrapper becomes fragile.

## DEC-004 - SRS algorithm for MVP
- Options considered:
  - A) SM-2 (chosen)
  - B) FSRS (juror preference)
- Decision: A
- Rationale: Judge mandates SM-2 for MVP; FSRS deferred to V1.
- Conflict noted: Juror 3 recommends FSRS as primary; judge overrides for MVP.
- Risks: Less adaptive scheduling early on.
- Rollback plan: Implement FSRS in V1 with migration path.

## DEC-005 - LLM optional enhancement
- Options considered:
  - A) LLM required for mnemonics
  - B) Deterministic templates with optional LLM (chosen)
- Decision: B
- Rationale: Judge mandates graceful degradation and offline capability.
- Risks: Lower perceived creativity without LLM.
- Rollback plan: Add richer deterministic packs and user editing tools.

## DEC-006 - Explicit/graphic content handling
- Options considered:
  - A) Allow explicit LLM generation
  - B) Allow explicit content only locally, LLM disabled (chosen)
- Decision: B
- Rationale: Judge mandates Tier 4 local-only; reduces legal and moderation risk.
- Conflict noted: Juror 4 only specifies family/absurd/mature tiers; judge adds explicit local-only tier.
- Risks: Some users may want LLM help for explicit tier.
- Rollback plan: Revisit only if compliance and moderation tooling exist.

## DEC-007 - PGN parsing library
- Options considered:
  - A) chess.js PGN only
  - B) cm-pgn + chess.js validation (chosen)
- Decision: B
- Rationale: Judge selected cm-pgn for variations; chess.js used for legality.
- Risks: Parser mismatches or edge cases.
- Rollback plan: Add a fallback parser mode and error surfacing.

## DEC-008 - Analytics scope
- Options considered:
  - A) Always-on analytics
  - B) Optional, consented analytics (chosen)
- Decision: B
- Rationale: Judge requires no-auth and privacy preservation.
- Risks: Limited visibility into learning outcomes.
- Rollback plan: Offer opt-in analytics with clear value explanation.

## DEC-009 - Licensing policy enforcement
- Options considered:
  - A) No explicit policy
  - B) Explicit licensing policy and CI gate (chosen)
- Decision: B
- Rationale: Judge emphasizes GPL avoidance; juror warns about Chessground.
- Risks: Slower dependency additions.
- Rollback plan: None; licensing is a hard requirement.
