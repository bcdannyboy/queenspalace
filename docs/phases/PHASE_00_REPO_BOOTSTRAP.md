# Phase 00 - Repo Bootstrap

## Phase goals
- Establish documentation and contracts that define all cross-phase boundaries.
- Provide test scaffolding and CI so later phases are gated by explicit tests.
- Ensure licensing and safety policies are documented before implementation.

## Phase deliverables (precise file/module list)
- Documentation set under `docs/`:
  - `docs/00_INDEX.md`
  - `docs/01_SOURCE_DIGEST.md`
  - `docs/02_REQUIREMENTS.md`
  - `docs/03_ARCHITECTURE.md`
  - `docs/04_DATA_MODEL.md`
  - `docs/05_PHASE_PLAN.md`
  - `docs/06_CONTRACTS_OVERVIEW.md`
  - `docs/07_TEST_STRATEGY.md`
  - `docs/08_DECISION_LOG.md`
  - `docs/09_RISK_REGISTER.md`
  - `docs/10_BACKLOG.md`
  - `docs/11_OPEN_QUESTIONS.md`
  - Phase docs under `docs/phases/`
- Contracts under `contracts/v1/`:
  - `contracts/v1/domain.types.ts`
  - `contracts/v1/storage.indexeddb.schema.md`
  - `contracts/v1/pgn.import.contract.md`
  - `contracts/v1/srs.contract.md`
  - `contracts/v1/llm.mnemonic_card.schema.json`
  - `contracts/v1/api.llm.endpoints.md`
  - `contracts/v1/moderation.contract.md`
  - `contracts/v1/licensing.policy.md`
  - `contracts/README.md`
- Tooling and tests:
  - `package.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
  - `tests/unit/*`, `tests/contract/*`, `tests/integration/*`, `tests/e2e/*`
  - `tests/fixtures/*` PGN fixtures
- CI workflow: `.github/workflows/ci.yml`

## Contracts produced
- [contracts/v1/domain.types.ts](/contracts/v1/domain.types.ts)\n- [contracts/v1/storage.indexeddb.schema.md](/contracts/v1/storage.indexeddb.schema.md)\n- [contracts/v1/pgn.import.contract.md](/contracts/v1/pgn.import.contract.md)\n- [contracts/v1/srs.contract.md](/contracts/v1/srs.contract.md)\n- [contracts/v1/llm.mnemonic_card.schema.json](/contracts/v1/llm.mnemonic_card.schema.json)\n- [contracts/v1/api.llm.endpoints.md](/contracts/v1/api.llm.endpoints.md)\n- [contracts/v1/moderation.contract.md](/contracts/v1/moderation.contract.md)\n- [contracts/v1/licensing.policy.md](/contracts/v1/licensing.policy.md)

## Unit tests required (exact names + assertions)
- `contract_domain_types_compile.test.ts`
  - Asserts TypeScript types compile without errors.
  - Asserts invariants are documented in doc comments.
- `contract_llm_schema_validation.test.ts`
  - Asserts sample mnemonic JSON validates against `llm.mnemonic_card.schema.json`.
- `contract_storage_schema_migration.test.ts`
  - Asserts schema versioning rules exist and are unambiguous.

## Integration/contract tests required (exact names + fixtures)
- `contract_llm_schema_validation.test.ts` using a fixture JSON payload.
- `contract_storage_schema_migration.test.ts` using a migration scenario description.

## Performance budgets
- None for this phase.

## Known risks and mitigations
- Risk: Contracts are underspecified or ambiguous.
  - Mitigation: Include explicit inputs/outputs, error semantics, and examples in each contract.
- Risk: Docs drift from contracts.
  - Mitigation: Contracts are referenced in phase docs and test strategy; change requires decision log entry.

## Definition of Done (binary)
- [ ] All required docs exist and are linked from `docs/00_INDEX.md`.
- [ ] All contracts exist under `contracts/v1/` and are referenced by phase docs.
- [ ] Test scaffolding exists with placeholder tests that enumerate required gates.
- [ ] CI workflow runs lint, typecheck, unit, and contract tests.
- [ ] No GPL dependencies are introduced.
