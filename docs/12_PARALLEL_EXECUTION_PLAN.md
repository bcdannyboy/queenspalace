# Parallel Execution Plan

This document defines how to execute the phases in parallel with up to 7 Codex agents. It is designed so a subsequent agent can orchestrate worktrees, sequencing, and merges without ambiguity.

---

## Global constraints
- Maximum concurrent agents: 7.
- No phase MAY depend on implementation code from a later phase.
- Contracts are the only allowed dependencies between phases.
- All local-first, no-auth, and safety constraints in `docs/02_REQUIREMENTS.md` are binding.

---

## Work package index

Each work package (WP) is a concrete slice of implementation that can be owned by one agent. WPs define deliverables, dependencies, tests, and primary files. A WP MUST NOT modify files owned by another WP unless explicitly noted.

### WP-01A — Chess engine wrapper
- Phase: 01
- Deliverables:
  - `src/core/chess/engine.ts`
  - `src/core/chess/intent.ts`
  - `src/core/chess/fen.ts`
- Dependencies: contracts v1 domain types and PGN import contract
- Tests to implement:
  - `tests/unit/move_legality_chessjs.test.ts`
  - `tests/unit/fen_key_canonicalization.test.ts`
- File ownership: `src/core/chess/*`

### WP-01B — Board UI wrapper
- Phase: 01
- Deliverables:
  - `src/ui/board/BoardWrapper.tsx`
- Dependencies: WP-01A interface definitions
- Tests to implement: none in Phase 01 (UI tests are Phase 05)
- File ownership: `src/ui/board/*`

### WP-02A — PGN parsing
- Phase: 02
- Deliverables:
  - `src/core/pgn/parse.ts`
- Dependencies: WP-01A (chess.js legality and SAN parsing)
- Tests to implement:
  - `tests/unit/pgn_parse_smoke.test.ts`
- File ownership: `src/core/pgn/*`

### WP-02B — Graph builder + deterministic IDs
- Phase: 02
- Deliverables:
  - `src/core/graph/builder.ts`
  - `src/core/graph/ids.ts`
  - `src/core/routes/routes.ts`
  - `src/core/training/itemSeed.ts`
- Dependencies: WP-02A parse output + WP-01A fenKey
- Tests to implement:
  - `tests/integration/import_to_training_items.test.ts`
- File ownership: `src/core/graph/*`, `src/core/routes/*`, `src/core/training/*`

### WP-03A — SM-2 scheduler
- Phase: 03
- Deliverables:
  - `src/core/srs/sm2.ts`
  - `src/core/srs/grades.ts`
- Dependencies: contracts v1 srs contract
- Tests to implement: none directly (covered by WP-03B integration test)
- File ownership: `src/core/srs/*`

### WP-03B — Queue builder
- Phase: 03
- Deliverables:
  - `src/core/srs/queue.ts`
- Dependencies: WP-03A for state updates
- Tests to implement:
  - `tests/integration/srs_queue_under_cap.test.ts`
- File ownership: `src/core/srs/*`

### WP-04A — Palace/locus CRUD
- Phase: 04
- Deliverables:
  - `src/core/palace/palace.ts`
- Dependencies: contracts v1 domain types
- Tests to implement: none directly (covered by WP-04B integration)
- File ownership: `src/core/palace/*`

### WP-04B — Encoding packs + deterministic mnemonics
- Phase: 04
- Deliverables:
  - `src/core/mnemonic/encodingPack.ts`
  - `src/core/mnemonic/generator.ts`
  - `src/core/mnemonic/cards.ts`
- Dependencies: WP-04A palace models and moderation contract
- Tests to implement:
  - `tests/integration/mnemonic_fallback_no_llm.test.ts`
- File ownership: `src/core/mnemonic/*`

### WP-05A — Level system logic
- Phase: 05
- Deliverables:
  - `src/core/levels/criteria.ts`
  - `src/core/levels/progress.ts`
- Dependencies: WP-03A/B and contracts for TrainingItem/SRSState
- Tests to implement: none directly (covered by E2E)
- File ownership: `src/core/levels/*`

### WP-05B — Review session UI
- Phase: 05
- Deliverables:
  - `src/ui/review/SessionStart.tsx`
  - `src/ui/review/ReviewItem.tsx`
  - `src/ui/review/RepairLoop.tsx`
  - `src/ui/levels/LevelMap.tsx`
- Dependencies: WP-05A + WP-03A/B + WP-04A/B + WP-02B
- Tests to implement:
  - `tests/e2e/e2e_onboarding_first_win.spec.ts`
  - `tests/e2e/e2e_import_pgn_train_seed.spec.ts`
  - `tests/e2e/e2e_daily_review_session.spec.ts`
- File ownership: `src/ui/review/*`, `src/ui/levels/*`

### WP-05C — Local dev setup script
- Phase: 05
- Deliverables:
  - `scripts/dev-setup.sh`
  - Update `README.md` with localhost quickstart
- Dependencies: WP-05B (end-to-end flow exists)
- Tests to implement: none (covered by E2E flows)
- File ownership: `scripts/*`, `README.md`

### WP-06A — LLM API routes + schema validation
- Phase: 06
- Deliverables:
  - `src/server/api/mnemonic.ts`
  - `src/server/llm/schema.ts`
- Dependencies: LLM schema contract and moderation contract
- Tests to implement:
  - `tests/contract/contract_llm_schema_validation.test.ts`
- File ownership: `src/server/api/*`, `src/server/llm/*`

### WP-06B — Moderation + fallback
- Phase: 06
- Deliverables:
  - `src/server/api/moderate.ts`
  - `src/server/llm/fallback.ts`
- Dependencies: moderation contract
- Tests to implement:
  - `tests/integration/mnemonic_fallback_no_llm.test.ts` (shared with WP-04B)
- File ownership: `src/server/llm/*`

### WP-07A — Analytics events
- Phase: 07
- Deliverables:
  - `src/core/analytics/events.ts`
  - `src/core/analytics/metrics.ts`
- Dependencies: none (opt-in only)
- Tests to implement: none mandatory in MVP
- File ownership: `src/core/analytics/*`

### WP-07B — Analytics endpoint
- Phase: 07
- Deliverables:
  - `src/server/api/analytics.ts`
- Dependencies: WP-07A event schema
- Tests to implement: optional (post-Phase 07)
- File ownership: `src/server/api/*`

---

## Parallelization waves (max 7 agents)

### Wave 1 (parallel, 4 agents)
- WP-01A (Chess engine wrapper)
- WP-03A (SM-2 scheduler)
- WP-04A (Palace/locus CRUD)
- WP-06A (LLM API routes + schema validation)

### Wave 2 (parallel, up to 7 agents)
- WP-01B (Board UI wrapper) — depends on WP-01A
- WP-03B (Queue builder) — depends on WP-03A
- WP-04B (Encoding packs + mnemonics) — depends on WP-04A
- WP-06B (Moderation + fallback) — depends on WP-06A

### Wave 3 (parallel, 2 agents)
- WP-02A (PGN parsing) — depends on WP-01A
- WP-02B (Graph builder + IDs) — depends on WP-02A

### Wave 4 (parallel, 2 agents)
- WP-05A (Level system logic) — depends on WP-03A/B
- WP-05B (Review session UI) — depends on WP-05A, WP-02B, WP-04A/B
- WP-05C (Local dev setup script) — depends on WP-05B

### Wave 5 (parallel, optional)
- WP-07A (Analytics events)
- WP-07B (Analytics endpoint) — depends on WP-07A

---

## Worktree strategy (recommended)

Naming convention: `wt/<phase>-<wp>`

Example commands (not executed here):
```
git worktree add ../queenspalace-wt-01A -b wt/phase01-wp01A
```

Rules:
- Each WP MUST operate in its own worktree.
- A WP MUST NOT modify files owned by another WP.
- Shared files (e.g., `package.json`, `tsconfig.json`) are controlled by the orchestrator only.

---

## Merge order and gates

### Mandatory merge order
1. WP-01A
2. WP-03A + WP-04A + WP-06A (order irrelevant)
3. WP-01B + WP-03B + WP-04B + WP-06B
4. WP-02A → WP-02B
5. WP-05A → WP-05B
6. WP-07A → WP-07B

### Merge gates (must be green)
- Contract tests: `tests/contract/*`
- Unit tests for the WP’s phase
- Integration tests relevant to the WP’s deliverables

---

## Cross-WP integration points

- WP-01A → WP-02A: SAN parsing and fenKey canonicalization are required before PGN import logic.
- WP-02B → WP-05B: TrainingItem seeds drive review UI.
- WP-03A/B → WP-05A/B: SRS state and queue drive levels and review sessions.
- WP-04B → WP-05B: Mnemonic cards are displayed and repaired during review.
- WP-06A/B → WP-04B: Optional LLM output can override deterministic mnemonic generation.

---

## Conflict avoidance matrix

| Area | Owner WP | Notes |
| --- | --- | --- |
| `src/core/chess/*` | WP-01A | No other WP edits allowed |
| `src/ui/board/*` | WP-01B | UI only |
| `src/core/pgn/*` | WP-02A | Parser only |
| `src/core/graph/*` | WP-02B | Graph and IDs |
| `src/core/srs/*` | WP-03A/B | Shared; WP-03B must not change scheduling formulas |
| `src/core/palace/*` | WP-04A | Palace only |
| `src/core/mnemonic/*` | WP-04B | Mnemonic generation |
| `src/core/levels/*` | WP-05A | Level logic |
| `src/ui/review/*` | WP-05B | Review UI |
| `src/ui/levels/*` | WP-05B | Level UI |
| `scripts/*` | WP-05C | Local dev setup script |
| `README.md` | WP-05C | Quickstart updates |
| `src/server/llm/*` | WP-06A/B | LLM schema + fallback |
| `src/server/api/*` | WP-06A/B/WP-07B | Must coordinate endpoints |
| `src/core/analytics/*` | WP-07A | Analytics schema |

---

## Orchestration checklist

- [ ] Confirm maximum concurrent agents (<=7).
- [ ] Create worktrees for each active WP.
- [ ] Assign WPs and publish a dependency map.
- [ ] Enforce file ownership rules before coding.
- [ ] Merge in prescribed order with required tests green.
- [ ] Update `docs/08_DECISION_LOG.md` for any contract changes.
