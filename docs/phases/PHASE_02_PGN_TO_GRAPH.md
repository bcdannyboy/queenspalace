# Phase 02 - PGN to Graph

## Phase goals
- Parse PGN into a normalized move tree with legality checks.
- Convert the move tree into a position DAG with transposition merging.
- Generate deterministic route views for UI and mnemonic mapping.

## Phase deliverables (precise file/module list)
- `src/core/pgn/parse.ts`
  - PGN parsing (cm-pgn) and basic validation.
- `src/core/graph/builder.ts`
  - Tree-to-DAG conversion with fenKey merge.
- `src/core/graph/ids.ts`
  - Deterministic ID generation for nodes and edges.
- `src/core/routes/routes.ts`
  - Route and RouteStep generation.
- `src/core/training/itemSeed.ts`
  - Generates initial TrainingItem stubs from graph.

## Contracts produced
- Implements [contracts/v1/pgn.import.contract.md](/contracts/v1/pgn.import.contract.md).\n- Implements PositionNode and MoveEdge rules from [contracts/v1/domain.types.ts](/contracts/v1/domain.types.ts).

## Unit tests required (exact names + assertions)
- `pgn_parse_smoke.test.ts`
  - Asserts that PGN mainline and variations parse deterministically.
  - Asserts SAN is preserved and UCI is derived correctly.
- `fen_key_canonicalization.test.ts`
  - Asserts transposed routes merge into the same PositionNode.

## Integration/contract tests required (exact names + fixtures)
- `import_to_training_items.test.ts`
  - Uses `tests/fixtures/simple_mainline.pgn` and `tests/fixtures/transposition_example.pgn`.
  - Asserts stable IDs, correct expectedMoveEdgeIds, and correct route lengths.

## Performance budgets
- PGN parse + graph build for 1,000 plies MUST complete within:
  - 2 seconds on modern desktop
  - 5 seconds on mid-tier mobile
- Heavy parsing MUST be designed for a Web Worker in future implementation.

## Known risks and mitigations
- Risk: PGN variations and annotations cause parser ambiguity.
  - Mitigation: strict parse mode with explicit error reporting and fallback to minimal parse.
- Risk: Non-deterministic IDs break SRS continuity.
  - Mitigation: deterministic ID scheme and test fixtures.

## Definition of Done (binary)
- [ ] PGN parser produces a normalized move tree with legality validation.
- [ ] Graph builder merges transpositions via fenKey and yields a DAG.
- [ ] Routes are generated with stable, ordered RouteSteps.
- [ ] Import integration test passes for both fixtures.

## Parallelization notes
- Work packages: WP-02A and WP-02B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
