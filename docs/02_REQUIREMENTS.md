# Requirements

This document is the single source of truth for product requirements. Each requirement includes an ID, priority, acceptance criteria, and traceability to source documents.

Priority scale:
- P0: MVP blocking, must be delivered before any public MVP release.
- P1: V1 target, required for a credible V1.
- P2: V2 or later, optional or experimental.

---

## Functional requirements

### REQ-FUNC-001 - No-auth immediate start
- Priority: P0
- Requirement: The app MUST allow a user to open the web app and begin training immediately without authentication, email, or PII collection.
- Acceptance criteria:
  - A new user can start a training session without creating an account.
  - No login or email capture is required for core flows.
- Traceability: `_dev_docs/judge_report.md`

### REQ-FUNC-002 - Local-first offline training
- Priority: P0
- Requirement: All core training (levels, review sessions, SRS) MUST function offline with local storage only.
- Acceptance criteria:
  - With network disabled, the user can review due items and complete sessions.
  - Local storage holds all required data for review and progress.
- Traceability: `_dev_docs/judge_report.md`

### REQ-FUNC-003 - PGN paste import with variations
- Priority: P0
- Requirement: The app MUST ingest pasted PGN with mainline and basic variations and convert it into the internal graph.
- Acceptance criteria:
  - A PGN with variations parses without data loss of moves, comments, and variation boundaries.
  - The import returns a deterministic graph and route set.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_2.md`

### REQ-FUNC-004 - Position graph with transposition merging
- Priority: P0
- Requirement: Openings MUST be represented as a position DAG with transposition merging based on a canonical fenKey.
- Acceptance criteria:
  - Positions with identical board state, side to move, castling rights, and en passant target share a single PositionNode.
  - Move order differences map to multiple routes pointing to shared nodes.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_2.md`, `_dev_docs/chess_juror_6.md`

### REQ-FUNC-005 - Route view on top of graph
- Priority: P0
- Requirement: The system MUST preserve human-readable route views (ordered plies) for each imported line.
- Acceptance criteria:
  - A route can be reconstructed as an ordered sequence of MoveEdges.
  - A route remains stable after transposition merge.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_2.md`

### REQ-FUNC-006 - Position-first training items
- Priority: P0
- Requirement: The canonical training item for openings MUST be position -> move (FEN prompt, UCI/SAN answer).
- Acceptance criteria:
  - Training items store promptPositionId and expectedMoveEdgeIds.
  - Review prompts show position only by default.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_2.md`

### REQ-FUNC-007 - Branch decision items
- Priority: P0
- Requirement: The system MUST support branch decision items for deviation handling at key nodes.
- Acceptance criteria:
  - A branch item presents 2-4 plausible candidate moves and one correct response.
  - Confusable siblings can be marked for contrastive review.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_1.md`, `_dev_docs/chess_juror_3.md`

### REQ-FUNC-008 - SRS scheduler (SM-2 for MVP)
- Priority: P0
- Requirement: MVP MUST implement an SM-2 style scheduler with learning steps and Again/Hard/Good/Easy grading.
- Acceptance criteria:
  - Items move through learning -> review states with expanding intervals.
  - Again/Hard/Good/Easy grades are recorded and update scheduling deterministically.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_3.md`

### REQ-FUNC-009 - Daily caps and deterministic queue
- Priority: P0
- Requirement: The review queue MUST respect daily caps (max reviews and max new) and be deterministic given identical inputs.
- Acceptance criteria:
  - Given the same history and cap settings, queue order and composition are identical.
  - Caps are enforced even when due items exceed capacity.
- Traceability: `_dev_docs/judge_report.md`

### REQ-FUNC-010 - Memory palace builder
- Priority: P0
- Requirement: The app MUST allow creation of a palace and ordered loci, and map one full move per locus (White left, Black right).
- Acceptance criteria:
  - Users can create or select a palace, define loci order, and edit labels.
  - Route steps map to locus indices in a stable, ordered mapping.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_1.md`

### REQ-FUNC-011 - Deterministic mnemonic generator
- Priority: P0
- Requirement: The app MUST generate deterministic mnemonic text from encoding packs and allow user edits.
- Acceptance criteria:
  - Given a move and encoding pack, the generator produces stable output.
  - Users can override any generated text and persist edits locally.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_1.md`

### REQ-FUNC-012 - Optional LLM mnemonic enhancement
- Priority: P0
- Requirement: LLM mnemonic generation MUST be optional and MUST degrade gracefully to deterministic templates when unavailable or blocked.
- Acceptance criteria:
  - If LLM calls fail or are blocked, deterministic templates are used without breaking training.
  - LLM output adheres to a fixed JSON schema.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_7.md`

### REQ-FUNC-013 - Chess legality authority
- Priority: P0
- Requirement: chess.js MUST be the single source of truth for legality, SAN rendering, and FEN generation.
- Acceptance criteria:
  - Board UI only emits move intents; legality is validated by chess.js.
  - Invalid moves are rejected and logged with error type.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_5.md`

### REQ-FUNC-014 - Level system with mastery tests
- Priority: P0
- Requirement: The app MUST implement the 8-level ladder with mastery tests that require spaced success across days.
- Acceptance criteria:
  - Each level has explicit mastery criteria and requires success on at least two separate days.
  - Level completion gates progress to higher levels where specified.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_4.md`

### REQ-FUNC-015 - Review session UX
- Priority: P0
- Requirement: The app MUST provide a guided review session flow (5-minute session) with immediate feedback and repair loops.
- Acceptance criteria:
  - A user can start a 5-minute session and complete due items.
  - Incorrect answers trigger a repair loop and re-test.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_4.md`

### REQ-FUNC-021 - Graduation test proves real-world mastery
- Priority: P0
- Requirement: Level 8 graduation MUST demonstrate the user can memorize a new opening slice using the memory palace workflow and retain it over time.
- Acceptance criteria:
  - User can import a new 10-14 ply slice, encode it, and reach >=90% position-only recall in-session.
  - After >=7 days, user maintains >=80% accuracy on the same slice without re-encoding.
  - Daily review cap is respected during the graduation test.
- Traceability: `_dev_docs/judge_report.md`

### REQ-FUNC-016 - Transposition-aware training (V1)
- Priority: P1
- Requirement: The app SHOULD inject transposition prompts so the same position is tested across alternate routes.
- Acceptance criteria:
  - At least one transposition drill exists for any node with multiple parents.
  - Training records track distinct route entry points.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_2.md`

### REQ-FUNC-017 - Plan/chunk items (V1)
- Priority: P1
- Requirement: The system SHOULD support plan/chunk training items for tabiya anchors.
- Acceptance criteria:
  - Plan items store a pawn-structure label and a plan prompt.
  - Users can answer plan prompts independently of move recall.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_2.md`

### REQ-FUNC-018 - Export/import backup (V1)
- Priority: P1
- Requirement: The app SHOULD allow local export/import backup of all user data without accounts.
- Acceptance criteria:
  - Export produces a single JSON file including repertoires, SRS state, palaces, and mnemonics.
  - Import restores the data and preserves IDs.
- Traceability: `_dev_docs/judge_report.md`

### REQ-FUNC-019 - Optional analytics events (V1)
- Priority: P1
- Requirement: If analytics are enabled, event capture MUST be consented, anonymous, and not required for training.
- Acceptance criteria:
  - A user can disable analytics and still access all core features.
  - Analytics payloads exclude PII.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_7.md`

### REQ-FUNC-020 - Post-game deviation loop (V2)
- Priority: P2
- Requirement: The app MAY offer a workflow to import a played game and identify the first deviation from repertoire.
- Acceptance criteria:
  - The system locates the first out-of-repertoire move and offers a repair option.
- Traceability: `_dev_docs/chess_juror_2.md`, `_dev_docs/chess_juror_4.md`

---

## Non-functional requirements

### REQ-NF-001 - Mobile performance
- Priority: P0
- Requirement: Core training interactions MUST remain responsive on mobile devices.
- Acceptance criteria:
  - Drag/tap interactions do not block input for more than 100ms in typical usage.
  - PGN import and graph build for 1,000 plies completes within 2 seconds on modern desktop and within 5 seconds on mid-tier mobile.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_5.md`

### REQ-NF-002 - Deterministic IDs
- Priority: P0
- Requirement: Import pipelines MUST produce deterministic IDs when given the same PGN and configuration.
- Acceptance criteria:
  - Given the same PGN input and fenKey rules, PositionNode and MoveEdge IDs are stable.
- Traceability: `_dev_docs/judge_report.md`

### REQ-NF-003 - Accessibility baseline
- Priority: P1
- Requirement: The chessboard and training flows SHOULD be keyboard accessible with screen-reader friendly feedback.
- Acceptance criteria:
  - Users can complete a review item using keyboard-only controls.
  - Move feedback is announced in text.
- Traceability: `_dev_docs/chess_juror_5.md`

### REQ-NF-004 - Local data integrity
- Priority: P0
- Requirement: Local data writes MUST be atomic and recoverable across reloads.
- Acceptance criteria:
  - Partial writes do not corrupt IndexedDB; versioned migrations are defined.
  - The app can resume a session after refresh without losing progress.
- Traceability: `_dev_docs/judge_report.md`

### REQ-NF-005 - Deterministic scheduling
- Priority: P0
- Requirement: Given the same history, time, and parameters, the scheduler MUST produce the same next due date and queue ordering.
- Acceptance criteria:
  - Re-running scheduling logic with identical inputs yields identical outputs.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_3.md`

### REQ-NF-006 - Local setup script and localhost end-to-end run
- Priority: P0
- Requirement: By completion of all phases, the repo MUST include a single easy setup script that enables a user to run the full training tool locally and access it via a localhost URL.
- Acceptance criteria:
  - Running `./scripts/dev-setup.sh` completes dependency installation and starts the dev server.
  - The app is reachable at `http://localhost:3000` after the script completes.
  - A user can complete the end-to-end flow: paste PGN → generate seed slice → complete a review session without authentication.
- Traceability: `_dev_docs/judge_report.md`

---

## Safety and content policy requirements

### REQ-SAFE-001 - Tone tiers and defaults
- Priority: P0
- Requirement: The app MUST implement tone tiers with Family-friendly as default and explicit user selection for other tiers.
- Acceptance criteria:
  - Family-friendly content is used unless the user explicitly changes tier.
  - Tone tier is stored locally without PII.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_4.md`

### REQ-SAFE-002 - Explicit content local-only
- Priority: P0
- Requirement: Explicit/graphic content MUST be local-only and MUST disable LLM generation.
- Acceptance criteria:
  - Tier 4 content is stored only in IndexedDB.
  - LLM endpoints are not called when Tier 4 is active.
- Traceability: `_dev_docs/judge_report.md`

### REQ-SAFE-003 - Moderation ladder
- Priority: P0
- Requirement: LLM content MUST pass pre- and post-moderation with a defined fallback ladder (sanitize, downgrade, deterministic).
- Acceptance criteria:
  - Moderation is called before and after generation for Tier 0-3.
  - If flagged, the fallback path is applied and logged.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_7.md`

### REQ-SAFE-004 - Age gating without auth
- Priority: P0
- Requirement: Access to mature tiers (Tier 3 and Tier 4) MUST require a local 18+ confirmation.
- Acceptance criteria:
  - The 18+ confirmation is required before enabling Tier 3/4.
  - The setting is stored locally only.
- Traceability: `_dev_docs/judge_report.md`

### REQ-SAFE-005 - Prompt injection resistance
- Priority: P0
- Requirement: User text MUST be treated as data and MUST NOT alter system or safety prompts.
- Acceptance criteria:
  - Tone selection is a fixed enum, not raw user prompt injection.
  - Input is separated from system instructions in LLM requests.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_7.md`

---

## Licensing constraints

### REQ-LIC-001 - GPL avoidance
- Priority: P0
- Requirement: The codebase MUST avoid GPL-licensed dependencies unless explicitly approved in writing.
- Acceptance criteria:
  - No GPL libraries are present in dependencies (including chessboard UI and chess rules engine).
  - A licensing policy contract exists and is referenced in CI checks.
- Traceability: `_dev_docs/judge_report.md`, `_dev_docs/chess_juror_5.md`

### REQ-LIC-002 - Dependency review checklist
- Priority: P0
- Requirement: A license review checklist MUST be defined and followed before adding new dependencies.
- Acceptance criteria:
  - The checklist exists in contracts and is linked from the architecture and CI notes.
  - New dependencies list license metadata in the decision log.
- Traceability: `_dev_docs/judge_report.md`
