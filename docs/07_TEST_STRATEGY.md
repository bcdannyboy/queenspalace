# Test Strategy

This strategy defines unit, contract, integration, and E2E tests. Tests are organized to gate phases and to prove requirements are met. Placeholder tests exist as `describe.todo` until implementation.

---

## Test categories

### Unit tests (pure functions)
- Validate deterministic logic in isolation (fenKey, SM-2 updates, parsing helpers).

### Contract tests (schema conformance)
- Validate contracts under `contracts/v1/` are consistent and parseable.
- Validate JSON schemas and migration rules.

### Integration tests (module interactions)
- Validate module boundaries: PGN import -> graph -> training items -> SRS.
- Each integration test MUST validate at least one contract boundary.

### E2E tests (user flows)
- Validate onboarding, import, and daily review flows.

---

## Required test list (names)

### Unit
- `pgn_parse_smoke.test.ts`
- `fen_key_canonicalization.test.ts`
- `move_legality_chessjs.test.ts`

### Contract
- `contract_domain_types_compile.test.ts`
- `contract_llm_schema_validation.test.ts`
- `contract_storage_schema_migration.test.ts`

### Integration
- `import_to_training_items.test.ts`
- `srs_queue_under_cap.test.ts`
- `mnemonic_fallback_no_llm.test.ts`

### E2E
- `e2e_onboarding_first_win.spec.ts`
- `e2e_import_pgn_train_seed.spec.ts`
- `e2e_daily_review_session.spec.ts`

---

## Test matrix (requirements x tests)

Columns: U = Unit, C = Contract, I = Integration, E = E2E

| Requirement ID | U | C | I | E |
| --- | --- | --- | --- | --- |
| REQ-FUNC-001 |  |  |  | e2e_onboarding_first_win.spec.ts |
| REQ-FUNC-002 |  |  | mnemonic_fallback_no_llm.test.ts | e2e_daily_review_session.spec.ts |
| REQ-FUNC-003 | pgn_parse_smoke.test.ts |  | import_to_training_items.test.ts | e2e_import_pgn_train_seed.spec.ts |
| REQ-FUNC-004 | fen_key_canonicalization.test.ts |  | import_to_training_items.test.ts |  |
| REQ-FUNC-005 |  |  | import_to_training_items.test.ts |  |
| REQ-FUNC-006 |  | contract_domain_types_compile.test.ts | import_to_training_items.test.ts | e2e_import_pgn_train_seed.spec.ts |
| REQ-FUNC-007 |  | contract_domain_types_compile.test.ts | import_to_training_items.test.ts |  |
| REQ-FUNC-008 |  | contract_domain_types_compile.test.ts | srs_queue_under_cap.test.ts |  |
| REQ-FUNC-009 |  |  | srs_queue_under_cap.test.ts |  |
| REQ-FUNC-010 |  | contract_domain_types_compile.test.ts | mnemonic_fallback_no_llm.test.ts |  |
| REQ-FUNC-011 |  | contract_llm_schema_validation.test.ts | mnemonic_fallback_no_llm.test.ts |  |
| REQ-FUNC-012 |  | contract_llm_schema_validation.test.ts | mnemonic_fallback_no_llm.test.ts |  |
| REQ-FUNC-013 | move_legality_chessjs.test.ts |  |  |  |
| REQ-FUNC-014 |  |  |  | e2e_daily_review_session.spec.ts |
| REQ-FUNC-015 |  |  |  | e2e_daily_review_session.spec.ts |
| REQ-FUNC-021 |  |  |  | e2e_import_pgn_train_seed.spec.ts |
| REQ-FUNC-016 | fen_key_canonicalization.test.ts |  | import_to_training_items.test.ts |  |
| REQ-FUNC-017 |  | contract_domain_types_compile.test.ts | import_to_training_items.test.ts |  |
| REQ-FUNC-018 |  | contract_storage_schema_migration.test.ts |  |  |
| REQ-FUNC-019 |  | contract_storage_schema_migration.test.ts |  |  |
| REQ-FUNC-020 |  |  |  |  |
| REQ-NF-001 |  |  |  | e2e_daily_review_session.spec.ts |
| REQ-NF-002 | fen_key_canonicalization.test.ts |  | import_to_training_items.test.ts |  |
| REQ-NF-003 |  |  |  | e2e_onboarding_first_win.spec.ts |
| REQ-NF-004 |  | contract_storage_schema_migration.test.ts |  |  |
| REQ-NF-005 |  |  | srs_queue_under_cap.test.ts |  |
| REQ-NF-006 |  |  |  | e2e_import_pgn_train_seed.spec.ts |
| REQ-SAFE-001 |  | contract_llm_schema_validation.test.ts | mnemonic_fallback_no_llm.test.ts | e2e_onboarding_first_win.spec.ts |
| REQ-SAFE-002 |  | contract_llm_schema_validation.test.ts | mnemonic_fallback_no_llm.test.ts |  |
| REQ-SAFE-003 |  | contract_llm_schema_validation.test.ts | mnemonic_fallback_no_llm.test.ts |  |
| REQ-SAFE-004 |  |  |  | e2e_onboarding_first_win.spec.ts |
| REQ-SAFE-005 |  | contract_llm_schema_validation.test.ts |  |  |
| REQ-LIC-001 |  | contract_storage_schema_migration.test.ts |  |  |
| REQ-LIC-002 |  | contract_storage_schema_migration.test.ts |  |  |

Notes:
- Some requirements (REQ-FUNC-020) are V2 and have no tests in MVP; they will gain tests when implemented.
- E2E tests become required once the related phase is complete.
