# Phase 05 - Review UX and Levels

## Phase goals
- Implement review session UX with a 5-minute default session.
- Implement the 8-level ladder and mastery tests.
- Implement repair loops after mistakes.

## Phase deliverables (precise file/module list)
- `src/ui/review/SessionStart.tsx`
- `src/ui/review/ReviewItem.tsx`
- `src/ui/review/RepairLoop.tsx`
- `src/ui/levels/LevelMap.tsx`
- `src/core/levels/criteria.ts`
- `src/core/levels/progress.ts`

## Contracts produced
- Implements TrainingItem types and ReviewLog handling in [contracts/v1/domain.types.ts](/contracts/v1/domain.types.ts).\n- Implements SRS requirements from [contracts/v1/srs.contract.md](/contracts/v1/srs.contract.md).

## Unit tests required (exact names + assertions)
- `pgn_parse_smoke.test.ts`
  - Ensures level drills can load positions from imported data.

## Integration/contract tests required (exact names + fixtures)
- `e2e_onboarding_first_win.spec.ts`
  - Asserts user completes a micro-lesson and a recall check.
- `e2e_import_pgn_train_seed.spec.ts`
  - Asserts PGN paste -> seed slice -> first review session.
- `e2e_daily_review_session.spec.ts`
  - Asserts user can complete a 5-minute review session and view summary.

## Performance budgets
- Review item render SHOULD complete within 100ms on desktop and 200ms on mobile.
- Session start SHOULD complete within 1 second for up to 50 due items.

## Known risks and mitigations
- Risk: onboarding overload and dropout.
  - Mitigation: progressive disclosure and optional skip paths.
- Risk: mastery tests can be gamed via recognition.
  - Mitigation: enforce position-only prompts and spaced mastery checks across days.

## Definition of Done (binary)
- [ ] 5-minute session flow is implemented end-to-end.
- [ ] Level mastery gates exist for Levels 1-8 with cross-day requirements.
- [ ] Graduation test flow enforces the Level 8 retention check (>=7 days).
- [ ] Repair loop triggers on incorrect answers and re-tests after short delay.
- [ ] E2E tests for onboarding, import, and daily session pass.
- [ ] `./scripts/dev-setup.sh` starts the app and the PGN import → seed → review flow works at `http://localhost:3000`.

## Parallelization notes
- Work packages: WP-05A and WP-05B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
