# Architecture

This architecture is aligned with the judge report. It is local-first, no-auth, and treats LLM services as optional enhancements. All core training flows MUST function offline.

---

## Architecture overview

### Logical modules (frontend)
- App shell (Next.js + React)
- Chess rules module (chess.js wrapper)
- Board UI wrapper (cm-chessboard + overlays)
- PGN import pipeline (cm-pgn + normalization)
- Position graph store (DAG with fenKey merge)
- Training item generator (position->move, branch decision, etc.)
- SRS engine (SM-2 MVP, FSRS V1)
- Palace & mnemonic engine (deterministic templates + user edits)
- Review session orchestrator (queue, timers, repair loop)
- Local persistence (IndexedDB via Dexie)

### Optional backend services
- LLM mnemonic generation (structured outputs) with moderation
- Analytics ingestion (consented, anonymous)

### Why this architecture
- Local-first with IndexedDB ensures offline training and no-auth UX.
- Position graph prevents duplicated learning across transpositions.
- Deterministic mnemonic generation ensures training is never blocked by LLM unavailability.
- Optional backend provides quality enhancements without creating a dependency for core learning.

---

## Module boundaries and responsibilities

### 1) Chess Core
- Inputs: move intents (from, to, promotion?) or SAN
- Outputs: legality decision, UCI, SAN, FEN
- Invariants: legality is decided only by chess.js

### 2) PGN Import Pipeline
- Inputs: PGN text
- Outputs: Route set + Position DAG + MoveEdges
- Invariants: fenKey canonicalization merges transpositions; routes are stable

### 3) Position Graph Store
- Inputs: PositionNodes, MoveEdges, RepertoireEdges
- Outputs: lookup by fenKey, route views, training item candidates
- Invariants: unique PositionNode per fenKey

### 4) Training Item Generator
- Inputs: Position DAG + RepertoireEdge metadata + user settings
- Outputs: TrainingItem records
- Invariants: position->move items are the canonical unit

### 5) SRS Engine
- Inputs: TrainingItem + SRSState + ReviewLog
- Outputs: due queue + updated SRSState
- Invariants: deterministic scheduling given same inputs

### 6) Palace & Mnemonics
- Inputs: RouteStep + EncodingPack + Tone settings
- Outputs: MnemonicCard + anchors
- Invariants: deterministic templates when LLM is unavailable

### 7) Review Session Orchestrator
- Inputs: due queue + UI settings + timing
- Outputs: ReviewLog entries, repair loop actions
- Invariants: no-auth, offline-first, always recoverable

---

## Data flow diagrams (ASCII)

### PGN import to training items

```
[PGN Text]
    |
    v
[PGN Parser (cm-pgn)]
    |
    v
[Move Tree] -> [Normalize: chess.js legality]
    |
    v
[Position DAG (fenKey merge)]
    |
    v
[Routes + RepertoireEdges]
    |
    v
[Training Item Generator]
    |
    v
[IndexedDB]
```

### Review session loop

```
[IndexedDB]
   |  (TrainingItem + SRSState)
   v
[SRS Engine] -> [Due Queue]
   |
   v
[Review UI]
   |
   v
[ReviewLog + SRSState updates]
   |
   v
[IndexedDB]
```

### Optional LLM flow (graceful degradation)

```
[Mnemonic Request]
   |
   v
[Pre-moderation] --flag--> [Fallback deterministic template]
   |
   v
[LLM (Responses API)]
   |
   v
[Post-moderation] --flag--> [Sanitize/downgrade/template]
   |
   v
[MnemonicCard JSON]
```

---

## Local-first storage approach
- IndexedDB (Dexie) is the single source of truth for all training data.
- The app MUST be fully usable offline, including SRS scheduling.
- Local backups are supported via export/import (V1).
- Any user images or explicit content remain local-only.

---

## Optional backend boundaries

### LLM Services
- Boundary: `/api/mnemonic` and `/api/moderate` with strict JSON schemas.
- Failure mode: return deterministic template and allow manual edits.
- LLM is never the authority on legal moves or PGN correctness.

### Analytics
- Boundary: `/api/analytics` accepts anonymous events.
- Failure mode: if offline or blocked, analytics are dropped without affecting training.

---

## Alternatives considered and rejected

### A) Line-based opening trees
- Rejected because line-based storage duplicates positions and fails transposition handling.

### B) Backend-first with accounts
- Rejected because no-auth, offline-first is a hard constraint.

### C) LLM-mandatory mnemonic generation
- Rejected because it would break offline training and adds cost/availability risk.

### D) GPL chessboard libraries (Chessground)
- Rejected due to licensing risk for a proprietary commercial app.

