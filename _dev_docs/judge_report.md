## A) Executive summary

We’re building a **local-first, web-based chess opening memory-palace trainer** that teaches users a repeatable mnemonic “visual grammar” and then applies it to real opening repertoires with **position-based active recall + spaced repetition**. Users can open the site and start immediately—**no account, no email, no setup friction**—by either training the core memory skills (levels) or pasting a PGN and training a “starter slice” of an opening.

**Who it’s for**

* Players who want to **memorize openings faster** and retain them longer (beginner → advanced).
* Learners who struggle with “I studied the line but can’t recall it in a real game.”

**Why it works**

* It teaches Method of Loci as a **workflow** (route → loci → vivid binding → retrieval walk) and then forces **retrieval practice** (position → move) under **spaced scheduling**, with a “repair loop” after mistakes.
* It avoids the classic opening-trainer trap: memorizing *lines* instead of *positions*. Internally we model openings as a **position graph** (transposition-aware), and training items are **position→move** decision points.
* It degrades gracefully: if the LLM is unavailable or content is blocked, the app still works using **deterministic mnemonic templates + editable user notes** (LLM enhances vividness/coaching, but isn’t a dependency for the core method).

---

## B) Level system

The levels are designed so that “mastered all levels” means: **you can take a new opening PGN, convert it into loci efficiently, and retain it via a proven retrieval+spacing loop—without relying on luck, a single gimmick, or a fragile memorized script.**

### Level 1 — Square fluency: the 8×8 peg grid

**Objective**
Instantly convert **any square ↔ a stable mental image** with minimal confusion.

**Items being learned**

* 8 **file pegs** + 8 **rank pegs** (compositional → 64 squares).
* A fixed compositional rule: **Square = file-object interacting with rank-prop**.
* Optional discriminators: light/dark overlays, quadrant cues (to reduce swaps).

**Drills**

* Recognition: square → choose correct composite image (4 options).
* Reverse recognition: image → choose coordinate.
* Active recall: image → type coordinate.
* Speed round: 60 seconds of random squares.
* “Confusable pairs” drill (e4/e5, g7/g8, mirrored squares).

**Mastery test (graduation)**

* Across **two sessions separated by ≥24h**:

  * ≥95% accuracy square↔image
  * Median response time ≤2.0s
  * Confusable-pairs accuracy ≥90%

**Typical failure modes**

* Rank/file swaps (e4 remembered as e5).
* Symmetry confusion (left/right mirroring).
* Pegs not distinctive enough (too many “animals doing generic things”).

---

### Level 2 — Pieces on squares: actor-on-prop binding

**Objective**
Instantly encode/decode **(color, piece type) on a square**.

**Items being learned**

* 6 **piece archetypes** (actor silhouettes) + a consistent **color modifier** (glow vs shadow).
* Binding rule: **Squares are places/props; pieces are actors** (role consistency prevents cue overload).

**Drills**

* Spot-check: show a position, ask “What’s on f6?”
* Reverse: show a scene (actor + square-prop) → pick the piece + square.
* Batch recall: show 8–12 pieces for 10s → reconstruct placement.
* Color discrimination mini-round (avoid white/black confusions).

**Mastery test**

* On two separate days:

  * Reconstruct ≥90% correct on 10-piece positions
  * Piece-square spot-check: ≥90% correct with median ≤3s per answer

**Typical failure modes**

* White/black confusion (modifier too subtle).
* Bishop/rook/queen silhouette confusion.
* Role collision (if squares are also “people,” everything collapses).

---

### Level 3 — Move grammar: actor–verb–target (+FX)

**Objective**
Encode and decode **single moves** reliably, including captures/check/mate/promotion/castling.

**Items being learned**

* **Actor** = moving piece
* **From-stage** = from-square prop under the actor
* **Target** = destination square prop
* **Verb** = movement type (leap/slide/step)
* **FX layer** = capture/check/mate/promo/castle/en passant

**Drills**

* Decode: show a scene → choose the correct move among close distractors.
* Encode: show a move (SAN/UCI) → user writes a 1–2 sentence scene script.
* Special move ladder: quiet → capture → check → castle/promo/ep.
* Error diagnosis: after a miss, user tags which token failed: **piece / from / to / special**.

**Mastery test**

* Decode: ≥90% accuracy on a mixed set (quiet/capture/check/castle/promo).
* Encode: generate valid scene scripts for 20 moves in ≤5s each (initially), trending down with practice.
* Must pass a “castle side” and “promotion” mini-check (these are high-confusion).

**Typical failure modes**

* From/to inversion.
* Capture vs non-capture not encoded strongly.
* O-O vs O-O-O confusion.
* Promotion forgotten or wrong promoted piece.

---

### Level 4 — Palace workflow: route + loci + retrieval walk

**Objective**
Build a palace route, place moves correctly, and retrieve by walking—without relying on the move list as a crutch.

**Items being learned**

* Palace route with distinct loci in a fixed order.
* Encoding rule for openings: **one locus per full move** (White on left, Black on right).
* A “palace entrance mascot” to prevent opening-to-opening interference.

**Drills**

* Loci builder: pick 10–15 loci and lock the order.
* Guided encoding workshop: place the first 6–10 plies into loci.
* Decode walk: walk the palace and answer “what move here?”
* Image strength coach: upgrade weak images (action/sensory/surprise).

**Mastery test**

* Create a palace with ≥10 loci.
* Recall a 12-ply sequence:

  * twice on separate days,
  * once forward,
  * once starting from a random locus (no move list shown).

**Typical failure modes**

* Loci too similar (“chair #1, chair #2”).
* Route order not stable.
* Images are funny but not decodable (“I remember the joke, not the move”).

---

### Level 5 — Opening seed + mainline: position → move SRS

**Objective**
Translate palace encoding into **game-usable recall**: given a position, produce the correct move.

**Items being learned**

* **Position→move** training items (the canonical unit).
* “Image-to-move” translation items (ensures mnemonic decodes).
* Short **chunk** items for fluency (secondary).

**Drills**

* Recognition → recall ladder:

  * MCQ move recognition (brief, early only)
  * Move recall (drag/drop or SAN entry)
  * Timed gentle set (10s/move)
* Image-to-move translation: show the mnemonic card → input move.
* Random restart: jump to midline positions.

**Mastery test**

* For a starter slice (e.g., 10–14 plies):

  * ≥90% accuracy on **position-only** prompts
  * Median response time ≤6s
  * Survive a cold test after ≥72h at ≥80% accuracy
  * All “key moves” have been successfully reviewed in spaced fashion (not just same-session wins)

**Typical failure modes**

* “Line recital” without position recognition.
* Over-reliance on sequential cueing.
* Panic when starting midline.

---

### Level 6 — Branch doors: deviations + discrimination (anti-interference)

**Objective**
Handle opponent deviations without mixing variations; build discrimination skill at branch points.

**Items being learned**

* **Branch decision items**: a position + 2–4 plausible continuations.
* “Door signposts”: branching mnemonic structure (mini-routes per branch).
* Confusion sets derived from your errors (A answered as B).

**Drills**

* Branch choice drill (opponent deviates → choose your correct response).
* Contrast micro-quizzes: after an error, you get A + top confusers interleaved.
* “Out of repertoire” recognition (optional): mark unknowns to avoid false confidence.

**Mastery test**

* At branch nodes: ≥90% accuracy across spaced sessions.
* Confusion rate for top confusable siblings drops below a threshold (e.g., <10% over last 20 branch decisions).

**Typical failure modes**

* Too many alternatives attached to one locus (cue overload).
* Similar branches share the same imagery (images don’t differentiate the decision).

---

### Level 7 — Transpositions + tabiya anchors: chunking and convergence

**Objective**
Stop duplicating memorization across move orders; anchor key positions (tabiyas) and treat them as convergence points.

**Items being learned**

* **Tabiya anchors**: a single strong chunk representation of a key resulting position (pawn structure + piece placements + plan cue).
* “Portal” links: alternate move orders point to the same anchor.
* Plan prompts (lightweight): “main pawn break / key maneuver” for a tabiya.

**Drills**

* Transposition injection: same FEN reached via different history.
* Tabiya chunk test: 5-second look → answer 3 prompts:

  * pawn structure label,
  * key piece placement,
  * main plan/pawn break (multiple choice or short text).
* “Blank board” mini: reconstruct just pawns (optional, advanced).

**Mastery test**

* Across mixed entry routes:

  * correct move choice from tabiya positions ≥85%
  * plan prompt correctness ≥80%
* “Duplicate detection” check: user recognizes two routes lead to the same anchor.

**Typical failure modes**

* Treating each move order as a separate palace (explodes workload).
* Knowing the move but not the idea (brittle recall).

---

### Level 8 — Graduation: game-ready recall + maintenance + “learn a new opening quickly”

**Objective**
Prove you can **memorize new openings efficiently** using the method, then maintain them with SRS under realistic constraints.

**Items being learned**

* Speed-ready decision items
* Interleaving rules (avoid blocked practice illusions)
* Repair loops (update imagery after errors)
* Audit reviews (cold tests to detect “good faith mastery”)

**Drills**

* Speed ladder (10s → 7s → 5s → 3s per move) after competence.
* Interleaved mixed review (across openings/branches).
* Play vs repertoire (V2) and post-game deviation repair (V2).
* **New-opening sprint challenge** (the defining graduation drill):

  * Import a fresh PGN slice
  * Auto-map to loci
  * Encode + immediately retrieve
  * Schedule follow-ups

**Graduation test (the “honest mastery” bar)**
A user “masters all levels” when they can:

1. **Rapid acquisition:** Take a new 10–14 ply slice and reach:

   * ≥90% accuracy position-only recall in-session after encoding
2. **Retention:** After ≥7 days, maintain ≥80% accuracy on the same slice without re-encoding everything
3. **Robustness:** Pass at least one transposition-injected test if applicable
4. **Efficiency:** Complete this without expanding the daily review load beyond their configured cap (i.e., they can *sustain* the method)

**Typical failure modes**

* Speed stress causes sloppy move encoding.
* Review backlog due to over-scoping repertoire.
* The palace becomes a crutch (can’t recall without imagining the route).

---

## C) Data model (entities + relationships)

This model is **local-first** (IndexedDB) but maps cleanly to a future Postgres backend.

### Core chess content

* **Repertoire**

  * id, name, side (White/Black), variant, rootPositionId
* **PositionNode**

  * id, variant, fenFull, **fenKey** (canonical first-4-fields key), createdAt
* **MoveEdge**

  * id, variant, fromPositionId → toPositionId, **uci**, san, flags (capture/check/mate/promo), createdAt
* **RepertoireEdge**

  * repertoireId + moveEdgeId, role (myMove/opponentMove/sideline), priority, weight, tags, comment

### Human-friendly “routes” (tree view on top of the graph)

* **Route**

  * id, repertoireId, name, description, rootPositionId
* **RouteStep**

  * routeId, plyIndex, moveEdgeId

### Training items (what gets scheduled)

* **TrainingItem**

  * id, repertoireId
  * promptPositionId
  * expectedMoveEdgeIds[] (supports multiple correct moves)
  * itemType: `squarePeg | pieceOnSquare | nextMove | branchDecision | chunk | plan`
  * difficultyTags[], confusionGroupId?
  * active: bool
* **SRSState**

  * trainingItemId
  * scheduler: `sm2` (MVP) | `fsrs` (V1+)
  * state: `new | learning | review | relearning | suspended`
  * dueAt, intervalDays, easeFactor (SM-2) OR stability/difficulty (FSRS)
  * lapses, repetitions, lastReviewedAt
* **ReviewLog**

  * id, trainingItemId, reviewedAt, rating (Again/Hard/Good/Easy)
  * answerUci / answerText, correct, responseMs
  * errorType (piece/from/to/special/branch), answeredAsTrainingItemId? (for confusion graph)

### Memory palace + mnemonics

* **Palace**

  * id, name, type (`starter | userRealPlace`), lociCount, createdAt
* **Locus**

  * id, palaceId, index, label, note
* **MnemonicCard**

  * id, trainingItemId or routeStepId, palaceId, locusId
  * title, imageDescription, story, anchors[] (step→hook), userEdits
  * toneProfile, strengthTags (action/sensory/surprise), updatedAt

### Imagery customization

* **EncodingPack**

  * id, name, defaultTone, filePegs[8], rankPegs[8], pieceActors[12]
  * verbsByPieceType, fxLibrary
  * safetyTier (G/PG/Mature/LocalOnlyExplicit)
* **UserOverrides**

  * packId, overrides (rename pegs/actors/verbs), optional local images (blob refs)

---

## D) Technical architecture

### Design principle

**Local-first training, server-assisted generation.** Everything needed to learn and review runs in the browser; the backend exists to safely call OpenAI and optionally collect privacy-preserving analytics.

### Frontend stack + chessboard library choice

**Chosen stack**

* **Next.js (React) + TypeScript** for product velocity and deployment simplicity.
* **IndexedDB (Dexie)** for local persistence of repertoires, SRS state, palaces, mnemonics.
* **State management:** Zustand (simple, minimal boilerplate).
* **Chessboard UI:** **cm-chessboard (MIT)** wrapped in React.

  * Rationale: permissive license, SVG board, responsive, and has extensions for arrows/markers/overlay patterns that map well to “drill overlays” (highlights, arrows, locus numbers). (Avoid GPL chessboards.)
* **PGN parsing:** **cm-pgn (MIT)** for variations/comments; chess.js can be fallback for simpler PGNs.

**Why not Chessground?**
Chessground is excellent UX, but GPL constraints are a product risk for a proprietary commercial web app (avoid licensing traps).

### Chess rules engine choice

* **chess.js (BSD-2-Clause)** as the single source of truth for:

  * legality checking,
  * SAN rendering,
  * FEN generation,
  * UCI conversion.
* Run chess.js **in the browser** for instant feedback; optionally duplicate on server later for authoritative validation (not critical with no accounts).

### Backend services (MVP → V2)

#### MVP backend (minimal)

A thin API (Next.js API routes or a tiny Node service) providing:

* `POST /api/mnemonic`

  * Calls OpenAI to generate structured mnemonic cards + coaching (text-only).
* `POST /api/moderate` (internal)

  * Runs pre/post moderation.
* `POST /api/analytics` (optional, consented)

  * Receives anonymized events.

**OpenAI API usage (MVP)**

* **Responses API** for text generation, including stateful interactions and structured outputs. ([OpenAI Platform][1])
* **Structured Outputs** via `json_schema` to guarantee stable rendering of mnemonic “cards.” ([OpenAI Platform][2])
* **Moderation** via `omni-moderation-latest` for both input and output checks. ([OpenAI Platform][3])

#### V1 backend (still small-team friendly)

* Add **Postgres** (optional) if/when you introduce accounts or cross-device sync.
* Add **Redis** for:

  * rate limiting,
  * exact-match caching,
  * abuse throttling.

#### V2 backend (scalable)

* Worker queue for async jobs:

  * PGN imports at scale,
  * bulk tagging,
  * image processing.
* Optional vector store for RAG if you want plan notes and “typical ideas” retrieval.

### Image storage

**MVP (no auth)**

* Ship built-in packs as static assets.
* Store any user-provided images **locally only** (IndexedDB blobs).
* Do not host user uploads in MVP (avoids moderation + legal exposure).

**V1+ (if you add sharing/sync)**

* Object storage (S3/GCS) with signed uploads and an “ingest bucket → processed bucket” workflow.
* Store derivatives + hashes; run moderation before anything becomes public.

### LLM service boundaries + caching

**Boundaries**

* LLM is allowed to generate:

  * mnemonic card text (story + anchors),
  * short coaching (“why it works,” a 30-second drill),
  * optional tags (“this is a branch point,” “castle,” etc).
* LLM is **never** the authority on:

  * legal moves,
  * PGN correctness,
  * your repertoire truth.

**Tone control = enum, not freeform prompt**

* The UI offers tone presets; the backend maps those presets to internal “style profiles.”
* Treat user text as data; no “system prompt add-ons” from users.

**Caching strategy**

* **OpenAI Prompt Caching**: keep your system/developer prefix stable; prompt caching works automatically and can reduce latency and input token cost significantly. ([OpenAI Platform][4])
* **Exact cache** (server): `(promptVersion, segmentHash, tone, packId)` → mnemonic JSON.
* **Graceful fallback**: if cache hit or LLM blocked, return deterministic template scenes.

### Moderation workflow (defense in depth)

1. Pre-moderate user-provided text (custom keywords, notes) with `omni-moderation-latest`. ([OpenAI Platform][3])
2. Generate with Responses API + strict JSON schema. ([OpenAI Platform][1])
3. Post-moderate generated text.
4. If flagged:

   * sanitize & regenerate (keep same anchors), else
   * downgrade tone, else
   * deterministic safe template.

### Optional: image generation (later, not MVP)

* If you later generate images, prefer the current GPT Image models; DALL·E 2/3 are documented as deprecated with a published support end date. ([OpenAI Platform][5])

---

## E) Content & safety policy

### Imagery tiers (explicit product rules)

**Tier 0: Family-friendly (default)**

* Non-graphic, non-sexual, no hate/harassment.
* LLM allowed.

**Tier 1: Absurd / Surreal**

* Cartoon weirdness, still non-graphic.
* LLM allowed (moderated).

**Tier 2: Cinematic**

* Intense/epic tone, still non-graphic.
* LLM allowed (moderated).

**Tier 3: Mature (non-graphic)**

* Mild adult themes allowed, but **no explicit sexual content** and **no graphic violence**.
* LLM allowed, but stricter moderation and more frequent “sanitize & regenerate.”

**Tier 4: Explicit/Graphic (allowed only as local-only user content)**

* This tier exists to satisfy “mature/graphic allowed” without turning your MVP into a moderation+liability product.
* Rules:

  * LLM generation is **disabled** for explicit/graphic requests.
  * Content is stored **only on-device** (not uploaded, not shared).
  * The app displays warnings and blocks sharing/export-by-link of Tier 4 assets.

### Age gating (no authentication)

* To enable Tier 3 or Tier 4:

  * show an “18+ confirmation” modal,
  * store the setting locally (no PII).
* Provide “panic switch”: revert to Tier 0 in one click.

### Moderation actions

* **Block**: disallowed content requests sent to LLM.
* **Downgrade**: if user selects a risky tone, silently fall back to a safer preset with explanation.
* **Sanitize & regenerate**: remove disallowed elements but preserve move anchors.
* **Quarantine (V1+)**: if you ever host uploads, keep them private until approved.

### User reporting

* Every generated mnemonic card has:

  * “Report” button
  * category selection (sexual content, gore, hate/harassment, etc.)
  * sends anonymized report payload (no account needed)

### Degrade gracefully when blocked/unavailable

* If LLM call fails or is blocked:

  * use deterministic template scenes based on the pack + move grammar,
  * prompt user to edit the scene text manually,
  * continue scheduling and drills normally (core method unaffected).

---

## F) MVP backlog (prioritized) + milestones

### MVP scope (prove the core method)

The MVP proves: **a user can import a line, encode it into loci using the app’s grammar, and then recall it from positions using spaced review.**

**P0 — Must ship**

1. **Local-first foundation**

   * Next.js app shell + Dexie schema
   * Local “profile” UUID (anonymous)
2. **Chess core**

   * chess.js integration
   * cm-chessboard integration (move intents → chess.js legality → update FEN)
3. **PGN paste import**

   * Parse PGN (mainline + basic variations)
   * Build position graph (FEN key merge for transpositions)
4. **Training item generation**

   * Create position→move cards for “my moves”
   * Create basic branch decision cards for 1–2 branch points (optional in MVP, but strongly recommended)
5. **SRS scheduling (SM-2 style for MVP)**

   * Learning steps + review intervals
   * Again/Hard/Good/Easy grading
   * Daily caps (max reviews, max new)
6. **Review session UX**

   * “Start 5-minute session”
   * Immediate feedback + short repair loop
7. **Memory palace builder (minimal)**

   * Starter palace route (prebuilt loci) + ability to rename loci
   * Map full moves to loci
8. **Deterministic mnemonic generator**

   * Use encoding pack rules to auto-create a scene description per move
   * Editable by user
9. **LLM augmentation (text-only)**

   * Optional “Generate stronger scene” button per locus
   * Structured JSON output + moderation pipeline

**Milestones**

* **M1: Train a single imported line end-to-end** (import → items → review loop)
* **M2: Complete Levels 1–4 inside the product** (square/piece/move/palace)
* **M3: “Seed slice mastery” dashboard** (shows progress and what’s due)
* **M4: LLM-assisted mnemonic cards with moderation + fallback**

### V1 scope (polish + scale without accounts)

* Multiple openings + interleaved review queue
* Confusion-aware contrast sets (from review logs)
* Transposition injection drills (same FEN, different route)
* Better palace tooling:

  * multiple palaces,
  * branch doors UI,
  * tabiya anchors as named loci
* Export/import backup (JSON) + shareable *non-sensitive* configuration
* PWA offline mode
* Analytics + A/B testing framework (consent)

### V2 scope (advanced features + deeper LLM)

* “Play vs repertoire” drill mode (opponent chooses deviations)
* Post-game PGN import → first deviation → repair workflow
* Frequency-weighted branch prioritization (by public stats and/or user games)
* LLM RAG for plan notes (“why this move” coaching) with caching
* Optional image generation (with strict gating and moderation)
* Optional accounts/sync (only if MVP proves value)

---

## G) Analytics & evaluation plan

### North-star learning outcome

**“Time-to-new-opening”**: how quickly a user can encode and retain a fresh opening slice.

### Core metrics

**Activation**

* Completed: first palace walk + first correct recall from position.
* Imported a PGN and finished a 5-minute review session.

**Retention**

* D1 / D7 / D30 returning users (anonymous cohorts).
* “Review adherence”: % of days user completes at least the minimum session.

**Learning outcomes**

* Position-only recall accuracy over time (by item type).
* Median response time (by item type).
* Cold-test performance (items not seen in ≥7 days).
* Branch discrimination accuracy (confusable siblings).

**SRS health**

* Due backlog size vs daily cap.
* Average “overdue days” for due items.
* Lapse rate (Again %) per opening slice.

**Mnemonic effectiveness**

* % of items where user requests LLM help.
* User edits after generation (proxy for “low quality”).
* “Repair loop” success: accuracy on the re-test after repair.

### A/B tests (high leverage, low risk)

* Error repair loop vs simple “show correct answer.”
* One locus per full move vs one locus per ply (efficiency vs interference).
* Recognition-first ladder vs immediate recall-only.
* Deterministic vs LLM-generated mnemonic suggestions (when available).
* Different defaults for daily caps (avoid review pile-ups).

### Evaluation cadence

* Internal test set of representative openings (varied styles, transpositions).
* “Graduation test” success rate for Level 8:

  * immediate recall and 7-day retention on a novel line.

---

## H) Risks & mitigations

### Decision log (conflicts resolved)

**1) Openings as tree vs graph**

* **Chosen:** position graph (DAG) with transposition merging.
* **Why:** avoids duplicated learning and false mastery; enables transposition drills.

**2) SRS algorithm: FSRS vs SM-2**

* **Chosen:** SM-2 style for MVP; FSRS-style retention-target scheduler in V1.
* **Why:** SM-2 is simpler to ship while still delivering spacing + retrieval; FSRS adds a powerful “desired retention” knob once you have real review history.

**3) Board UI library**

* **Chosen:** permissive license board (cm-chessboard) + chess.js rules engine.
* **Why:** avoids GPL licensing traps; still supports drill overlays and good mobile UX.

**4) “Graphic allowed” vs platform safety**

* **Chosen:** explicit/graphic allowed **only as local-only user content** (LLM off; not uploaded).
* **Why:** MVP has no accounts and should not become a hosted adult-UGC moderation product.

**5) LLM dependence**

* **Chosen:** LLM is optional enhancement only; deterministic template generator is always available.
* **Why:** ensures graceful degradation and keeps the core method teachable and reliable.

---

### Risk register (with mitigations + go/no-go gates)

**1) Licensing contamination (GPL)**

* *Risk:* pulling in GPL chess UI/rules libs forces open-sourcing.
* *Mitigation:* restrict dependencies to MIT/BSD/ISC; add OSS license scanning in CI.
* *Gate:* **No launch** until dependency audit is clean.

**2) Unsafe content / adult content liability**

* *Risk:* user-generated explicit content becomes hosted or shareable.
* *Mitigation:* MVP stores explicit content locally only; server features disabled for Tier 4; strong gating + warnings.
* *Gate:* **No public hosting of user uploads** until you have automated moderation + human review tooling.

**3) Prompt injection / misuse of LLM**

* *Risk:* users try to override prompts; RAG snippets become instructions.
* *Mitigation:* tone as enum; user text treated as data; structured outputs; pre/post moderation; never allow retrieved text to change policies.

**4) Cost runaway (OpenAI usage)**

* *Risk:* repeated generations and long prompts explode token costs.
* *Mitigation:* token caps; exact caching; rely on prompt caching by stable prefixes; rate limits per IP/session. ([OpenAI Platform][4])
* *Gate:* enforce per-day budget and alerting before scaling user acquisition.

**5) Data loss (local-only)**

* *Risk:* users lose progress clearing browser storage.
* *Mitigation:* explicit export/import backup; “remind me to export” after meaningful progress.

**6) Illusion of mastery**

* *Risk:* user succeeds in-app but fails OTB due to cueing.
* *Mitigation:* position-only prompts; random restarts; transposition injections; cold audit reviews; speed ladders only after competence.

**7) Performance on mobile**

* *Risk:* PGN parsing + graph building stutters UI.
* *Mitigation:* do heavy parsing in a Web Worker; incremental rendering; avoid rerender storms in board UI.

**8) Copyright/licensing of opening content**

* *Risk:* importing commercial course PGNs or redistributing them.
* *Mitigation:* MVP focuses on user-import; built-in library uses original/public content; avoid distributing third-party repertoire files.

---

## I) Open questions

1. **Square peg onboarding load:**
   Do typical chess learners accept learning 16 pegs (8+8) before openings feel easier? Prototype with 5-minute onboarding tests and measure drop-off.

2. **Best default “encoding pack”:**
   Which pack minimizes confusion (animals+props vs fantasy vs clean geometric)? Run small A/B tests on Level 1 confusion errors.

3. **Optimal locus granularity for chess users:**
   One full move per locus seems best, but does it confuse beginners? Validate with user tests.

4. **Branching UX:**
   “Door signposts + mini-routes” is mnemonic-friendly, but is it understandable in UI without feeling like a memory app? Prototype two branch UIs:

   * doors-in-palace vs separate “variation palaces.”

5. **Plan understanding depth:**
   How much “plan card” content improves transfer without overwhelming? Likely needs progressive disclosure and optionality.

6. **No-auth analytics consent:**
   What is the minimum privacy-respecting telemetry needed to validate efficacy, and how do we communicate it clearly?

7. **When to introduce accounts (if ever):**
   Only after MVP proves value; otherwise, keep local-first + export/import.

---

## Juror reports used

LLM integration juror report


Backend/data model juror report


Frontend/UI juror report


UX juror report


Spaced repetition juror report


Chess pedagogy juror report


Mnemonics juror report


[1]: https://platform.openai.com/docs/api-reference/responses?utm_source=chatgpt.com "Responses | OpenAI API Reference"
[2]: https://platform.openai.com/docs/guides/structured-outputs?utm_source=chatgpt.com "Structured model outputs | OpenAI API"
[3]: https://platform.openai.com/docs/guides/moderation?utm_source=chatgpt.com "Moderation | OpenAI API"
[4]: https://platform.openai.com/docs/guides/prompt-caching?utm_source=chatgpt.com "Prompt caching | OpenAI API"
[5]: https://platform.openai.com/docs/guides/image-generation?utm_source=chatgpt.com "Image generation | OpenAI API"
