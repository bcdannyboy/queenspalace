# Phase 03 - SRS Engine and Queue

## Phase goals
- Implement MVP SM-2 scheduler with learning steps and grade handling.
- Build deterministic due queue selection with daily caps.
- Record ReviewLog entries with error tagging.

## Phase deliverables (precise file/module list)
- `src/core/srs/sm2.ts`
  - SM-2 scheduling logic with learning steps.
- `src/core/srs/queue.ts`
  - Deterministic queue builder with caps.
- `src/core/srs/grades.ts`
  - Grade mapping (Again/Hard/Good/Easy) and time-based grading.
- `src/core/review/log.ts`
  - ReviewLog creation utilities.

## Contracts produced
- Implements [contracts/v1/srs.contract.md](/contracts/v1/srs.contract.md).\n- Implements SRSState and ReviewLog in [contracts/v1/domain.types.ts](/contracts/v1/domain.types.ts).

## Unit tests required (exact names + assertions)
- `srs_queue_under_cap.test.ts`
  - Asserts queue respects max reviews and max new caps.
  - Asserts queue ordering is deterministic given same inputs.

## Integration/contract tests required (exact names + fixtures)
- `import_to_training_items.test.ts`
  - Ensures training items can be scheduled without missing fields.

## Performance budgets
- Queue generation for 1,000 due items MUST complete within 50ms on desktop and 150ms on mobile.

## Known risks and mitigations
- Risk: nondeterministic ordering due to timestamps or RNG.
  - Mitigation: explicit stable sort and time rounding in scheduler inputs.
- Risk: time zone issues for due dates.
  - Mitigation: store all times in UTC and convert only in UI.

## Definition of Done (binary)
- [ ] SM-2 scheduler produces due dates for all grades.
- [ ] Learning steps are implemented and do not permanently penalize early failures.
- [ ] Queue respects caps and is deterministic.
- [ ] ReviewLog captures rating, answer, response time, and error type.

## Parallelization notes
- Work packages: WP-03A and WP-03B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
