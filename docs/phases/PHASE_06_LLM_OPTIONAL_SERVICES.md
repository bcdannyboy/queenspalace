# Phase 06 - LLM Optional Services

## Phase goals
- Provide optional LLM mnemonic generation with strict schema enforcement.
- Implement moderation pre/post checks and fallback ladder.
- Ensure all LLM features degrade gracefully offline or when blocked.

## Phase deliverables (precise file/module list)
- `src/server/api/mnemonic.ts`
  - LLM request handler with schema validation.
- `src/server/api/moderate.ts`
  - Moderation endpoint wrapper.
- `src/server/llm/schema.ts`
  - JSON schema validation utilities.
- `src/server/llm/fallback.ts`
  - Deterministic fallback and downgrade logic.

## Contracts produced
- Implements [contracts/v1/api.llm.endpoints.md](/contracts/v1/api.llm.endpoints.md).\n- Implements [contracts/v1/llm.mnemonic_card.schema.json](/contracts/v1/llm.mnemonic_card.schema.json).\n- Enforces [contracts/v1/moderation.contract.md](/contracts/v1/moderation.contract.md).

## Unit tests required (exact names + assertions)
- `contract_llm_schema_validation.test.ts`
  - Asserts that generated JSON conforms to the schema.
- `mnemonic_fallback_no_llm.test.ts`
  - Asserts fallback behavior on LLM failures.

## Integration/contract tests required (exact names + fixtures)
- `contract_llm_schema_validation.test.ts` using a sample mnemonic JSON fixture.

## Performance budgets
- LLM calls SHOULD timeout gracefully within 10 seconds and return deterministic fallback.

## Known risks and mitigations
- Risk: prompt injection or unsafe content leakage.
  - Mitigation: pre/post moderation, tone enums, structured outputs.
- Risk: LLM unavailability blocks training.
  - Mitigation: deterministic fallback and local edits.

## Definition of Done (binary)
- [ ] LLM endpoints conform to schema and moderation contracts.
- [ ] LLM failures or blocks do not interrupt training flows.
- [ ] Tier 4 explicit requests never call LLM.

## Parallelization notes
- Work packages: WP-06A and WP-06B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
