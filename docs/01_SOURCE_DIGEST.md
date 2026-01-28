# Source Digest

This digest is the authoritative summary of all files in `_dev_docs/`. Each entry includes a compact summary, extracted decisions, risks/unknowns, and direct implementation implications.

---

## File: `_dev_docs/judge_report.md`

### Summary (10-20 bullets)
- Defines the product as a local-first, web-based opening trainer using memory palaces, retrieval practice, and SRS.
- Establishes a strict no-auth, no-email, immediate start requirement.
- Emphasizes position-based recall and a transposition-aware position graph instead of line memorization.
- Specifies 8 training levels from square fluency to opening mastery with measurable mastery tests.
- Defines core entities (Repertoire, PositionNode, MoveEdge, Route, TrainingItem, SRSState, ReviewLog, Palace, Locus, MnemonicCard, EncodingPack).
- Chooses Next.js + TypeScript, IndexedDB via Dexie, Zustand, chess.js, cm-chessboard, and cm-pgn.
- Requires LLM augmentation to be optional, with deterministic fallback and editable user notes.
- Specifies moderation flow with pre/post checks and fallback ladder; LLM is never authority on legality or PGN correctness.
- Defines imagery tiers including explicit/graphic as local-only, LLM-disabled, non-uploadable content.
- Sets MVP scope and milestones, with SM-2 scheduler in MVP and FSRS in V1.

### Key decisions extracted
- Local-first, offline-capable training with no authentication.
- Position graph with fenKey dedupe; transposition-aware.
- Stack: Next.js + TS + Dexie + Zustand + chess.js + cm-chessboard + cm-pgn.
- LLM optional enhancement only; deterministic template fallback required.
- Imagery tiering with explicit/graphic allowed only locally; LLM disabled for Tier 4.
- MVP uses SM-2 scheduler; V1 upgrades to FSRS.

### Risks / unknowns
- User retention and ability to pass mastery tests with the cognitive load of square/piece/move encoding.
- Performance risk on mobile for PGN parsing and graph building.
- Risk of illusory mastery if prompts are not position-only or if sessions are over-sequenced.
- Legal/safety risk if explicit content is ever uploaded or shared.

### Direct implementation implications
- IndexedDB schema must support all core entities and be offline-first.
- Position canonicalization must merge transpositions (fenKey based on first 4 FEN fields).
- Training items must be position->move, not line-based; prompts are position-only by default.
- LLM endpoints must be optional and fail-safe; local deterministic generator must exist.
- Content policy enforcement must exist in UI and backend contracts.

---

## File: `_dev_docs/chess_juror_1.md`

### Summary (10-20 bullets)
- Reviews memory palace research and the importance of distinct cues to avoid interference.
- Recommends a hybrid square system: file pegs + rank pegs composing 64 squares.
- Enforces strict visual grammar: squares as places, pieces as actors, moves as actions + FX.
- Supports explicit from-square encoding using stage/target rule.
- Suggests one locus per full move (White left, Black right).
- Recommends branch doors and mini-routes to avoid cue overload at variations.
- Emphasizes tabiya anchors and portals to handle transpositions.
- Provides safe vividness guidance (absurdity, motion, surprise, no graphic content).
- Defines drill ladders and mastery thresholds aligned with retrieval practice and spacing.
- Includes sample pegs, actors, and move scenes for deterministic templates.

### Key decisions extracted
- Hybrid file/rank pegs for square encoding to reduce confusion.
- One locus per full move with left/right sub-loci.
- Branch doors with limited options to prevent cue overload.
- Tabiya anchors for transposition convergence.

### Risks / unknowns
- User confusion if role consistency is violated (square as person, piece as place).
- Cue overload at branch nodes if too many variations are attached.
- Potential decoding delay if from-square encoding is too complex.

### Direct implementation implications
- Encoding pack contract must include file pegs, rank pegs, piece actors, verbs, and FX library.
- Deterministic mnemonic generator must follow the actor-verb-target grammar.
- UI drills must include error-type tagging (piece/from/to/special).
- Branch UI must limit alternatives per locus and allow split routes.

---

## File: `_dev_docs/chess_juror_2.md`

### Summary (10-20 bullets)
- Surveys modern opening trainers and emphasizes move-based SRS over line-based study.
- Argues for a position DAG with transposition merging and route views for humans.
- Recommends position-only prompts and transposition-injected tests for mastery.
- Suggests frequency-weighted coverage and key-moves-only modes (V1+).
- Defines mastery as a multi-layer stack: move accuracy, opponent coverage, transposition robustness, plan understanding.
- Proposes plan cards and concept tags for chunking and understanding.
- Recommends a repertoire growth loop from game deviations (V1+).
- Encourages mixed training modes: next-move, play vs book, rebuild from memory, blank-board recall.
- Provides mastery thresholds for move-, line-, and opening-level mastery.
- Highlights risks of review overload and rote pattern dependence.

### Key decisions extracted
- Position DAG as canonical storage model.
- Position-only prompts are the default for mastery.
- Key-move coverage and frequency weighting are desirable but can be deferred.

### Risks / unknowns
- Review overload if coverage expands without caps or key-move controls.
- Users may game recognition prompts if recall-only is not enforced.

### Direct implementation implications
- Training item types must include plan/chunk items (V1+).
- Data model MUST allow multiple opening names/ECO per node.
- SRS queue MUST be deterministic and position-first.

---

## File: `_dev_docs/chess_juror_3.md`

### Summary (10-20 bullets)
- Focuses on spacing, retrieval practice, and interleaving as core learning science.
- Recommends FSRS-style scheduler with desired retention target as a control knob.
- Defines SRS unit taxonomy: square-image, piece-square, position->move, branch decision, and chunk items.
- Specifies a 4-button grade scale (Again/Hard/Good/Easy) with time-based grading.
- Emphasizes learning steps vs long-term scheduling and separate retention targets per item type.
- Promotes contrastive retrieval sets for confusion reduction.
- Warns against serial review because it inflates retention by hinting.
- Provides FSRS formulas and pseudocode for future implementation.
- Suggests audit reviews to test true mastery under low retrievability.
- Defines interference modeling via confusion graphs.

### Key decisions extracted
- FSRS is preferable long-term; SM-2 is simpler but less adaptive.
- Interleaving and contrastive review MUST be built into queue design.

### Risks / unknowns
- FSRS parameter fitting requires enough user data; early accuracy may be unstable.
- Aggressive interleaving can overwhelm beginners without guardrails.

### Direct implementation implications
- SRS contract must define grade scale and learning steps.
- Confusion logging must capture answered-as IDs and error types.
- V1 MUST include a migration path from SM-2 to FSRS.

---

## File: `_dev_docs/chess_juror_4.md`

### Summary (10-20 bullets)
- Frames Method of Loci as a workflow requiring guided practice and repair loops.
- Recommends progressive disclosure and micro-lessons to reduce cognitive load.
- Provides three end-to-end UX flows: onboarding, first PGN import, daily review.
- Specifies tone presets and image-strength coaching (action, sensory, surprise).
- Suggests a dual skill-tree model: Memory Craft and Opening Mastery.
- Defines drill library with recognition->recall->speed ladders and error repair.
- Emphasizes feedback loops after mistakes to improve retrieval strength.
- Highlights habit formation and autonomy-supporting gamification.
- Recommends hiding advanced settings until needed.
- Calls for daily session UX with clear wins and lightweight analytics.

### Key decisions extracted
- Progressive disclosure for complexity management.
- Error repair loops are mandatory after mistakes.
- Tone presets must be explicit with previews and constraints.

### Risks / unknowns
- Onboarding may be too long if micro-lessons are not kept minimal.
- Image strength coaching could feel intrusive without good UX.

### Direct implementation implications
- Phase 05 must implement a guided drill ladder and repair loop.
- Tone presets and preview logic must map to content policy tiers.
- UI MUST use small-session defaults (2/5/10 minutes).

---

## File: `_dev_docs/chess_juror_5.md`

### Summary (10-20 bullets)
- Warns against GPL chess UI libraries for a commercial closed-source app.
- Recommends cm-chessboard or react-chessboard (MIT) with chess.js rules engine.
- Defines a clean move intent flow where chess.js is the legality authority.
- Encourages storing UCI as canonical move ID, SAN for display.
- Proposes a board UI architecture with overlays for drills.
- Highlights mobile-friendly interactions and accessibility needs.
- Advises moving heavy PGN parsing to Web Workers for performance.
- Notes performance optimizations to avoid DOM churn.
- Suggests keyboard SAN input for accessibility and speed.
- Describes a state model for training interactions.

### Key decisions extracted
- Avoid GPL; use cm-chessboard + chess.js.
- Move intents must be validated by chess.js (board UI is input only).

### Risks / unknowns
- Imperative board APIs require careful React wrappers to avoid state bugs.
- Overlay complexity may introduce performance issues on mobile.

### Direct implementation implications
- Contracts must specify move intent inputs and legality errors.
- Chessboard wrapper module must be isolated and tested.
- Performance budgets need a Web Worker plan for PGN parsing.

---

## File: `_dev_docs/chess_juror_6.md`

### Summary (10-20 bullets)
- Proposes a backend-centric architecture with Postgres, workers, and object storage.
- Defines a transposition-aware graph using fenKey canonicalization.
- Recommends storing UCI as canonical move identity and SAN for display.
- Suggests asset moderation metadata for user-uploaded images.
- Provides relational schemas for users, packs, and assets.
- Emphasizes moderation pipelines for uploaded images.
- Highlights optional Redis and analytics warehouse scaling paths.
- Mentions Zobrist hashing as a position key alternative.
- Focuses on server-side persistence and user accounts.
- Includes schema for user overrides and pack mapping.

### Key decisions extracted
- Canonical fenKey for transposition merging.
- UCI as canonical move identity.

### Risks / unknowns
- The proposed backend assumes user accounts, which conflicts with no-auth MVP.
- Hosting user uploads increases moderation and legal burden.

### Direct implementation implications
- For MVP, restrict to local-only storage and no user uploads.
- Keep data model compatible with a future Postgres schema without relying on it.

---

## File: `_dev_docs/chess_juror_7.md`

### Summary (10-20 bullets)
- Defines an LLM architecture using OpenAI Responses API with structured outputs.
- Emphasizes pre/post moderation with omni-moderation-latest.
- Recommends strict JSON schemas for mnemonic cards and coaching.
- Proposes caching layers: OpenAI prompt caching, exact cache, semantic cache.
- Suggests tiered model selection for cost control.
- Describes optional RAG for plan notes and mnemonic reuse.
- Details async batch processing for non-urgent tasks.
- Reiterates that LLM is optional and must be guarded against prompt injection.
- Mentions image generation as a later, tightly moderated feature.
- Includes evaluation harnesses and trace grading ideas.

### Key decisions extracted
- Use structured outputs for mnemonic cards.
- Moderation pre/post is mandatory for LLM output.
- LLM services are optional and must degrade gracefully.

### Risks / unknowns
- LLM costs and latency variability.
- Prompt injection and unsafe content leakage.

### Direct implementation implications
- Contract must define LLM JSON schema and endpoint behavior.
- Caching and rate limiting must be planned even if minimal in MVP.
- Tier 4 explicit content must bypass LLM generation.
