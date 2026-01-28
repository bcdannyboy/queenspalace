# Data Model

This is the canonical data model for Queen's Palace. All entities, relationships, and invariants here must be mirrored in contracts and storage schema.

---

## Core entities and relationships

### Repertoire and graph
- Repertoire
  - id, name, side (White/Black), variant, rootPositionId
- PositionNode
  - id, variant, fenFull, fenKey, createdAt
- MoveEdge
  - id, variant, fromPositionId, toPositionId, uci, san, flags, createdAt
- RepertoireEdge
  - repertoireId, moveEdgeId, role (myMove/opponentMove/sideline), priority, weight, tags

**Relationships**
```
Repertoire -> PositionNode (root)
PositionNode --(MoveEdge)--> PositionNode
RepertoireEdge links Repertoire <-> MoveEdge
```

**Invariants**
- fenKey MUST be derived from the first 4 fields of FEN (piece placement, side to move, castling rights, en passant).
- PositionNode is unique per (variant, fenKey).
- MoveEdge is unique per (variant, fromPositionId, uci).

### Routes (human-readable paths)
- Route
  - id, repertoireId, name, description, rootPositionId
- RouteStep
  - routeId, plyIndex, moveEdgeId

**Invariants**
- RouteStep.plyIndex is 1-based and strictly increasing for a route.
- A route is a view over the graph, not the storage truth.

### Training items and SRS
- TrainingItem
  - id, repertoireId, promptPositionId, expectedMoveEdgeIds[], itemType, difficultyTags[], confusionGroupId?, active
- SRSState
  - trainingItemId, scheduler, state, dueAt, intervalDays, easeFactor OR stability/difficulty, lapses, repetitions, lastReviewedAt
- ReviewLog
  - id, trainingItemId, reviewedAt, rating, answerUci/answerText, correct, responseMs, errorType, answeredAsTrainingItemId?

**Invariants**
- TrainingItem.promptPositionId MUST reference a PositionNode.
- expectedMoveEdgeIds MUST reference MoveEdges from promptPositionId.
- SRSState.scheduler is SM-2 for MVP, FSRS for V1+.

### Memory palace and mnemonics
- Palace
  - id, name, type (starter|userRealPlace), lociCount, createdAt
- Locus
  - id, palaceId, index, label, note
- MnemonicCard
  - id, trainingItemId or routeStepId, palaceId, locusId, title, imageDescription, story, anchors[], userEdits, toneProfile, strengthTags, updatedAt

**Invariants**
- Locus.index is 1-based and unique per palace.
- One full move is mapped to one locus (White left, Black right sub-loci).

### Encoding packs and user overrides
- EncodingPack
  - id, name, defaultTone, filePegs[8], rankPegs[8], pieceActors[12], verbsByPieceType, fxLibrary, safetyTier
- UserOverrides
  - id, packId, overrides (rename pegs/actors/verbs), localImageRefs (blob keys)

**Invariants**
- filePegs and rankPegs MUST each be length 8.
- pieceActors MUST include 6 piece types * 2 colors.
- safetyTier MUST be one of: G, PG, Cinematic, Mature, LocalOnlyExplicit.
- UserOverrides MUST be stored locally only and MUST NOT be uploaded in MVP.

---

## Position graph model (transposition-aware)

### Canonicalization rule
- fenKey MUST be computed as the first 4 fields of FEN, ignoring halfmove and fullmove counters.
- All PositionNodes with the same fenKey represent the same position for training.

### Example: fenKey vs full FEN
- Full FEN: `r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3`
- fenKey: `r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -`

**Behavior**
- Two move orders that reach the same board state will share the same PositionNode.
- Routes preserve the distinct move histories for UI and mnemonic mapping.

---

## Training item taxonomy

### MVP item types
- squarePeg
- pieceOnSquare
- nextMove (position->move)
- branchDecision
- imageToMove

### V1+ item types
- chunk
- plan
- tabiyaAnchor

---

## Example: PGN -> nodes/edges -> training items

### PGN (simple mainline)
```
1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
```

### Nodes and edges (illustrative)
- Node A: start position (fenKey A)
- Edge A1: e2e4 (SAN: e4) from A -> Node B
- Edge B1: e7e5 (SAN: e5) from B -> Node C
- Edge C1: g1f3 (SAN: Nf3) from C -> Node D
- Edge D1: b8c6 (SAN: Nc6) from D -> Node E
- Edge E1: f1c4 (SAN: Bc4) from E -> Node F
- Edge F1: f8c5 (SAN: Bc5) from F -> Node G

### Training items (MVP)
- Item 1: promptPositionId = Node A, expectedMoveEdgeIds = [Edge A1], itemType = nextMove
- Item 2: promptPositionId = Node C, expectedMoveEdgeIds = [Edge C1], itemType = nextMove
- Branch items generated where multiple opponent moves exist from a node.

---

## Example: mnemonic card structure

```json
{
  "id": "mnemo_001",
  "trainingItemId": "item_123",
  "palaceId": "palace_starter",
  "locusId": "locus_03",
  "title": "White Knight leaps to f3",
  "imageDescription": "White Ninja leaps from Gorilla Doormat to Fox Table",
  "story": "A glowing Ninja springs off the gorilla's doormat and lands on a fox's table.",
  "anchors": [
    {"token": "from", "value": "g1"},
    {"token": "to", "value": "f3"},
    {"token": "piece", "value": "N"},
    {"token": "fx", "value": "quiet"}
  ],
  "toneProfile": "family_friendly",
  "strengthTags": ["action", "surprise"],
  "userEdits": false
}
```

---

## Data integrity rules (global)
- IDs MUST be stable, deterministic where specified (import pipeline).
- All training operations MUST be possible without network access.
- Tier 4 explicit content MUST never leave local storage or invoke LLM services.
