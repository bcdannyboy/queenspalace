# Contracts Overview

Contracts are the only permitted dependency between phases. A phase MUST either produce a new contract or implement an earlier contract without changing it.

---

## Versioning rules
- Contract versions live under `contracts/vN/`.
- Any breaking change (field removal, invariant change, error semantics change) MUST create a new version directory (v2, v3, ...).
- Non-breaking additions (new optional fields) MAY be made within a version but MUST be documented in the decision log.

## Enforcement in CI
- Contract tests are required in CI:
  - `contract_domain_types_compile.test.ts`
  - `contract_llm_schema_validation.test.ts`
  - `contract_storage_schema_migration.test.ts`
- CI MUST fail if contract tests fail.

## Change process
1. Propose contract change in `docs/08_DECISION_LOG.md` with rationale.
2. Update contract file and add or update tests.
3. Update any dependent phase docs to reference the new version.

## Contract ownership
- Contracts are owned by the architecture baseline, not by implementation code.
- Implementation MUST conform to contract invariants and error semantics.

