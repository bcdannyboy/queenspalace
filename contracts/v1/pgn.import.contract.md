# PGN Import Contract v1

## Purpose
Define deterministic PGN import into a transposition-aware position graph.

## Inputs
- `pgnText: string` (required)
- `variant: "standard"` (required)
- `importOptions` (optional)
  - `includeVariations: boolean` (default true)
  - `maxPly: number` (optional)
  - `routeName: string` (optional)

## Outputs
- `repertoire: Repertoire`
- `positions: PositionNode[]`
- `moves: MoveEdge[]`
- `routes: Route[]`
- `routeSteps: RouteStep[]`
- `trainingItemSeeds: TrainingItem[]` (optional seed items, not scheduled)

## Deterministic ID rules
- PositionNode IDs MUST be derived deterministically from `(variant, fenKey)`.
- MoveEdge IDs MUST be derived deterministically from `(variant, fromPositionId, uci)`.
- Route IDs MAY be random, but RouteSteps MUST be deterministic for a given route.

## Canonicalization rules
- fenKey MUST be the first 4 FEN fields: piece placement, side to move, castling rights, en passant.
- Halfmove and fullmove counters are ignored for dedupe.

## Pipeline steps (must be followed in order)
1. Parse PGN with a variation-capable parser (cm-pgn).
2. For each SAN move, validate legality with chess.js in strict mode.
3. Convert each SAN to UCI and apply to a working game state to derive FEN.
4. Create or reuse PositionNode by `(variant, fenKey)`.
5. Create MoveEdge if `(variant, fromPositionId, uci)` does not exist.
6. Build RouteSteps for each parsed line in ply order.

## Edge cases
- Illegal SAN move: MUST return `PGN_ILLEGAL_MOVE` with ply index and SAN text.
- Ambiguous SAN due to missing disambiguation: MUST return `PGN_AMBIGUOUS_SAN`.
- Unsupported annotations/comments: MUST preserve comments when possible; otherwise ignore with warning.
- Variation depth limit: If `maxPly` is set, ignore deeper plies with `PGN_TRUNCATED` warning.

## Error semantics
- Errors are returned as structured objects:
  - `code: string`
  - `message: string`
  - `plyIndex?: number`
  - `san?: string`
  - `routeName?: string`
- Import MUST be atomic: either all entities are created or none.

## Example (transposition)
- If two lines reach the same fenKey, the pipeline MUST reuse the PositionNode and connect both routes to it.

