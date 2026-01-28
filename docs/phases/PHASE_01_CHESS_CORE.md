# Phase 01 - Chess Core

## Phase goals
- Establish the chess rules authority and move legality pipeline.
- Implement a board UI wrapper that emits move intents without owning legality.
- Produce deterministic FEN, SAN, and UCI generation.

## Phase deliverables (precise file/module list)
- `src/core/chess/engine.ts`
  - chess.js wrapper for legality, SAN, FEN, UCI conversions.
- `src/core/chess/intent.ts`
  - MoveIntent type and validation helpers.
- `src/ui/board/BoardWrapper.tsx`
  - cm-chessboard wrapper with overlays and intent emission.
- `src/core/chess/fen.ts`
  - fenKey canonicalization utilities.

## Contracts produced
- Implements [contracts/v1/domain.types.ts](/contracts/v1/domain.types.ts) for PositionNode and MoveEdge.\n- Implements fenKey rules from [contracts/v1/pgn.import.contract.md](/contracts/v1/pgn.import.contract.md).

## Unit tests required (exact names + assertions)
- `move_legality_chessjs.test.ts`
  - Asserts illegal move intents are rejected.
  - Asserts special moves (castling, en passant, promotion) are accepted when legal.
- `fen_key_canonicalization.test.ts`
  - Asserts halfmove and fullmove counters are ignored in fenKey.
  - Asserts en passant and castling rights are preserved in fenKey.

## Integration/contract tests required (exact names + fixtures)
- `pgn_parse_smoke.test.ts`
  - Uses a minimal PGN fixture to ensure chess.js SAN parsing is stable.

## Performance budgets
- Move legality validation MUST complete within 10ms on desktop and 30ms on mid-tier mobile for a single move intent.
- Board updates SHOULD render within 50ms for a typical move.

## Known risks and mitigations
- Risk: Board UI emits invalid promotions or illegal target squares.
  - Mitigation: precompute legal moves from chess.js and constrain UI inputs.
- Risk: FEN canonicalization inconsistencies lead to duplicate nodes.
  - Mitigation: unit tests and a single canonicalization function used everywhere.

## Definition of Done (binary)
- [ ] chess.js wrapper exposes legal move checks and SAN/UCI/FEN conversion.
- [ ] Board wrapper emits MoveIntent and never bypasses legality checks.
- [ ] fenKey canonicalization function is implemented and covered by tests.
- [ ] Unit tests for legality and fenKey pass.

## Parallelization notes
- Work packages: WP-01A and WP-01B.\n- Orchestration details: `docs/12_PARALLEL_EXECUTION_PLAN.md`.
