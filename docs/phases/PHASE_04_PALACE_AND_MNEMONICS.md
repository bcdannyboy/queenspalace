# Phase 04 - Palace and Mnemonics

## Phase goals
- Implement palace and locus management.
- Implement deterministic mnemonic generation using encoding packs.
- Enforce tone tiers and local-only storage for explicit content.

## Phase deliverables (precise file/module list)
- `src/core/palace/palace.ts`
  - Palace and Locus CRUD logic.
- `src/core/mnemonic/encodingPack.ts`
  - Encoding pack definitions and overrides.
- `src/core/mnemonic/generator.ts`
  - Deterministic mnemonic generator (actor-verb-target + FX).
- `src/core/mnemonic/cards.ts`
  - MnemonicCard creation and update logic.

## Contracts produced
- Implements EncodingPack, Palace, Locus, MnemonicCard in [contracts/v1/domain.types.ts](/contracts/v1/domain.types.ts).\n- Enforces rules in [contracts/v1/moderation.contract.md](/contracts/v1/moderation.contract.md) for Tier 4 local-only content.

## Unit tests required (exact names + assertions)
- `mnemonic_fallback_no_llm.test.ts`
  - Asserts deterministic generator produces valid MnemonicCard when LLM is unavailable.
  - Asserts Tier 4 requests bypass LLM and remain local-only.

## Integration/contract tests required (exact names + fixtures)
- `contract_llm_schema_validation.test.ts`
  - Ensures deterministic output can be mapped into the LLM schema structure.

## Performance budgets
- Deterministic mnemonic generation MUST complete within 10ms per item on desktop and 30ms on mobile.

## Known risks and mitigations
- Risk: cue overload if imagery rules are inconsistent.
  - Mitigation: strict role grammar (squares=places, pieces=actors, moves=actions).
- Risk: user dissatisfaction with generated imagery.
  - Mitigation: allow edits and multiple template suggestions.

## Definition of Done (binary)
- [ ] Palace and Locus entities are persisted and ordered.
- [ ] Encoding packs include file/rank pegs and piece actors.
- [ ] Deterministic mnemonic generator produces stable, editable output.
- [ ] Tier rules are enforced locally and LLM bypass is tested.

## Parallelization notes
- Work packages: WP-04A and WP-04B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
