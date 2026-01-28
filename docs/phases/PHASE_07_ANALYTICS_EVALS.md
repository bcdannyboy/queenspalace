# Phase 07 - Analytics and Evals

## Phase goals
- Implement consented, anonymous analytics for learning outcomes.
- Provide evaluation hooks for measuring time-to-new-opening and retention.

## Phase deliverables (precise file/module list)
- `src/core/analytics/events.ts`
  - Event schema and validators.
- `src/server/api/analytics.ts`
  - Optional ingestion endpoint.
- `src/core/analytics/metrics.ts`
  - Local aggregation for dashboards when offline.

## Contracts produced
- No new v1 contract. If analytics schema is formalized, it MUST be added under `/contracts/v2/` and referenced in [contracts/README.md](/contracts/README.md).

## Unit tests required (exact names + assertions)
- `contract_storage_schema_migration.test.ts`
  - Asserts analytics tables are optional and do not block core features.

## Integration/contract tests required (exact names + fixtures)
- `e2e_daily_review_session.spec.ts`
  - Asserts analytics are not required for session completion.

## Performance budgets
- Event logging MUST be non-blocking; event writes SHOULD complete within 10ms.

## Known risks and mitigations
- Risk: analytics capture reduces offline performance or breaks training.
  - Mitigation: make analytics optional and drop events when offline.
- Risk: privacy concerns without auth.
  - Mitigation: no PII, local consent flag, anonymized IDs.

## Definition of Done (binary)
- [ ] Analytics is opt-in and does not block training if disabled.
- [ ] Event schema is documented and validated.
- [ ] Metrics can be computed locally without server dependencies.

## Parallelization notes
- Work packages: WP-07A and WP-07B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
