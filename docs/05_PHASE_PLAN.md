# Phase Plan

This roadmap decomposes the project into phases with explicit contracts, deliverables, dependencies, and gate tests. Phases are ordered and MUST only depend on contracts produced by earlier phases.

MVP scope: Phases 00 through 06 (LLM optional). V1 extends Phase 03 (FSRS) and Phase 05 (transposition drills) and adds Phase 07 analytics. V2 adds game-feedback loops and optional image generation.

Parallel execution details are defined in `docs/12_PARALLEL_EXECUTION_PLAN.md` and are mandatory for multi-agent orchestration.

---

## Phase 00 - Repo Bootstrap
- Objective: establish repo scaffolding, documentation, and contract v1.
- Scope: docs, contracts, test scaffolding, CI.
- Non-goals: product UI or runtime code.
- Deliverables: `docs/*`, `contracts/v1/*`, toolchain files, CI workflow.
- Dependencies: none.
- Exit criteria: all docs exist and are internally linked; contracts v1 exist; CI passes.
- Go/No-Go tests:
  - `contract_domain_types_compile.test.ts`
  - `contract_llm_schema_validation.test.ts`
  - `contract_storage_schema_migration.test.ts`

Link: [Phase 00 details](phases/PHASE_00_REPO_BOOTSTRAP.md)

---

## Phase 01 - Chess Core
- Objective: implement chess rules wrapper and board UI wrapper with legality flow.
- Scope: chess.js integration, board interactions, move intent validation.
- Non-goals: PGN import, SRS, palaces.
- Deliverables: chess core module, board wrapper module, move intent contract tests.
- Dependencies: contracts v1 domain types.
- Exit criteria: legal/illegal moves handled deterministically; UCI/SAN generated.
- Go/No-Go tests:
  - `move_legality_chessjs.test.ts`
  - `fen_key_canonicalization.test.ts`

Link: [Phase 01 details](phases/PHASE_01_CHESS_CORE.md)

---

## Phase 02 - PGN to Graph
- Objective: parse PGN and build transposition-aware graph with routes.
- Scope: PGN parser, graph builder, deterministic IDs, fixtures.
- Non-goals: SRS or review UX.
- Deliverables: import pipeline module, graph store module.
- Dependencies: Phase 01 chess core + contracts v1 pgn.import.
- Exit criteria: given fixtures, graph builds with correct node/edge counts and stable IDs.
- Go/No-Go tests:
  - `pgn_parse_smoke.test.ts`
  - `import_to_training_items.test.ts`

Link: [Phase 02 details](phases/PHASE_02_PGN_TO_GRAPH.md)

---

## Phase 03 - SRS Engine and Queue
- Objective: implement SM-2 scheduler and deterministic due queue with caps.
- Scope: SRS state model, learning steps, grading, queueing.
- Non-goals: FSRS (V1), analytics.
- Deliverables: SRS engine module and queue selector.
- Dependencies: contracts v1 srs.contract.
- Exit criteria: queue respects caps and is deterministic; SRS state updates correctly.
- Go/No-Go tests:
  - `srs_queue_under_cap.test.ts`

Link: [Phase 03 details](phases/PHASE_03_SRS_ENGINE_AND_QUEUE.md)

---

## Phase 04 - Palace and Mnemonics
- Objective: implement palace/locus model and deterministic mnemonic generator.
- Scope: Encoding packs, loci mapping, mnemonic cards.
- Non-goals: LLM generation (Phase 06).
- Deliverables: mnemonic engine, palace manager, mapping UI primitives.
- Dependencies: contracts v1 domain types + moderation contract (for tier rules).
- Exit criteria: deterministic mnemonic cards created and editable; tier rules enforced locally.
- Go/No-Go tests:
  - `mnemonic_fallback_no_llm.test.ts`

Link: [Phase 04 details](phases/PHASE_04_PALACE_AND_MNEMONICS.md)

---

## Phase 05 - Review UX and Levels
- Objective: implement review session UI, level system, and repair loops.
- Scope: drill ladder, 5-minute session, level mastery gates.
- Non-goals: analytics, game import.
- Deliverables: review UI, level progression logic.
- Dependencies: Phase 03 SRS engine + Phase 04 palace/mnemonics.
- Exit criteria: level ladder 1-8 is implemented with graduation test logic (including 7-day retention check scheduling).
- Exit criteria: `./scripts/dev-setup.sh` starts the app and a user can complete the PGN import → seed → review flow at `http://localhost:3000`.
- Go/No-Go tests:
  - `e2e_onboarding_first_win.spec.ts`
  - `e2e_import_pgn_train_seed.spec.ts`
  - `e2e_daily_review_session.spec.ts`

Link: [Phase 05 details](phases/PHASE_05_REVIEW_UX_AND_LEVELS.md)

---

## Phase 06 - LLM Optional Services
- Objective: implement optional LLM mnemonic generation with moderation and schema validation.
- Scope: API routes, JSON schema validation, caching stubs, fallback.
- Non-goals: image generation (V2).
- Deliverables: LLM endpoints, moderation pipeline.
- Dependencies: contracts v1 api.llm.endpoints, llm schema, moderation contract.
- Exit criteria: LLM outputs conform to schema; failures fall back to deterministic templates.
- Go/No-Go tests:
  - `contract_llm_schema_validation.test.ts`
  - `mnemonic_fallback_no_llm.test.ts`

Link: [Phase 06 details](phases/PHASE_06_LLM_OPTIONAL_SERVICES.md)

---

## Phase 07 - Analytics and Evals
- Objective: implement consented, anonymous analytics and evaluation hooks.
- Scope: event logging, cohort metrics, evaluation reports.
- Non-goals: growth marketing.
- Deliverables: analytics event schema, ingestion endpoint.
- Dependencies: contracts v1 domain types + analytics events contract (added in v2 if needed).
- Exit criteria: analytics are optional and do not block offline training.
- Go/No-Go tests:
  - `contract_storage_schema_migration.test.ts` (ensure analytics tables are optional)

Link: [Phase 07 details](phases/PHASE_07_ANALYTICS_EVALS.md)
