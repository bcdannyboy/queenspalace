[![memorization - Opening tree graph - Chess Stack Exchange](https://tse4.mm.bing.net/th/id/OIP.RxPCvEIBfaNVjzL04SSqHAHaG-?pid=Api)](https://chess.stackexchange.com/questions/4136/opening-tree-graph?utm_source=chatgpt.com)

Below is a backend + data model proposal optimized for: **(a)** chess opening repertoire ingestion + storage, **(b)** **spaced repetition** scheduling with per-item history, **(c)** **custom image packs** with moderation metadata + per-user overrides, and **(d)** analytics events for mastery tracking. I’m assuming a modern web/mobile app with an API backend and background workers.

---

## Architecture overview

**Core services (logical, can start as a monolith):**

1. **API service** (REST/JSON)

* Auth/session, user prefs, training queue, logging, export
* Reads/writes to transactional DB

2. **Worker service** (async jobs)

* PGN import parsing + opening-graph build
* Image processing (re-encode, resize variants), hashing, moderation
* Aggregations (mastery rollups, analytics compaction)
* Runs off a queue (SQS/RabbitMQ/PubSub) and writes results to DB

3. **Storage/CDN**

* Object storage (S3/GCS) for originals + derived image variants
* CDN for cacheable asset delivery
* Signed upload URLs to avoid proxying large files through the API ([AWS Documentation][1])

4. **Datastores**

* **PostgreSQL** for transactional truth (users, opening graph, SRS state, review logs, moderation state)
* **Redis** for rate-limits, short-lived session caches, and queue fanout (optional)
* **Analytics warehouse** (optional later): ClickHouse/BigQuery/Snowflake; start with Postgres partitions and migrate when volume warrants

---

## Chess representation decisions

### Formats to support

* **PGN**: standard text format for games; includes tag pairs + movetext (SAN moves) ([Saremba][2])
* **FEN**: describes a *single* board position to restart a game from that position ([ChessBase Help][3])
* **SAN**: standard algebraic move notation used in PGN; official notation for human play and used by software inside PGN ([ChessProgramming][4])
* **UCI move notation**: coordinate move encoding like `e2e4`, promotions like `e7e8q` ([python-chess.readthedocs.io][5])

### Storage rule of thumb

* **Nodes (positions)**: store **FEN** (and a canonicalized key, described below)
* **Edges (moves)**: store **UCI** as canonical identity, **SAN** for display (SAN depends on position context; once tied to a `from_position_id`, it’s stable)
* **PGN** is an import/export boundary, not the internal graph primitive

---

## Explicit transposition handling (graph model)

A **transposition** is when different move orders reach the same position. In that case, the “tree” is really a **graph**. ([ChessProgramming][6])

### Canonicalization approach

**Key idea:** positions are deduped by a canonical “position key” derived from FEN.

FEN includes move counters (halfmove/fullmove) which can differ even when the board state is otherwise identical. For opening training and transpositions, you typically want a key based on:

* piece placement
* side to move
* castling rights
* en passant target square

So store:

* `fen_full` (all fields) for display/export
* `fen_key` = **first 4 FEN fields** (or equivalent normalized representation)

Optionally also store a **Zobrist hash** for faster fixed-size keys; Zobrist hashing is widely used to index positions for transposition tables. ([ChessProgramming][7])

### Data consequence

* Many edges may point to the **same** `position_node` as a destination.
* You can still present a “tree view” in the UI by choosing a preferred parent path, but your storage should allow multiple parents.

---

## Proposed relational schema (Postgres)

Below is a table-centric model. Column types are illustrative; use UUIDs for external IDs and BIGINT surrogate IDs where it helps performance.

### 1) Users and preferences

**users**

* `id (uuid pk)`
* `email (citext unique)` / `phone (optional unique)`
* `password_hash` (if not OAuth)
* `status` enum (`active`, `banned`, `deleted`)
* `created_at`, `updated_at`, `deleted_at`

**user_preferences** (1:1)

* `user_id (pk/fk users.id)`
* `image_style` (e.g., `classic`, `neo`, `pixel`, `custom_pack`)
* `content_rating_max` (e.g., `G`, `PG`, `PG-13`, `R`)
* `default_pack_id (fk image_packs.id)`
* `timezone`, `locale`
* `created_at`, `updated_at`

### 2) Image packs and user-custom images

**image_packs**

* `id (uuid pk)`
* `owner_user_id (nullable fk users.id)`

  * `NULL` => system pack
* `name`, `description`
* `visibility` enum (`private`, `unlisted`, `public`)
* `default_mapping_id (fk mappings.id)`
* `content_rating` (pack-level)
* `created_at`, `updated_at`

**mappings** (your “Mapping” core entity)

* `id (uuid pk)`
* `scope` enum (`system`, `pack`, `user`)
* `owner_user_id (nullable fk users.id)`
* `pack_id (nullable fk image_packs.id)`
* `version` int
* `mapping_json (jsonb)`
  Example shape:

  ```json
  {
    "pieces": {
      "wP": "asset_uuid",
      "wN": "asset_uuid",
      "bK": "asset_uuid"
    },
    "squares": {
      "light": "asset_uuid",
      "dark": "asset_uuid"
    },
    "overlays": {
      "lastMoveArrow": "asset_uuid"
    }
  }
  ```
* `created_at`

**image_assets**

* `id (uuid pk)`
* `owner_user_id (nullable fk users.id)` (uploader/creator)
* `pack_id (nullable fk image_packs.id)`
* `kind` enum (`piece`, `square`, `overlay`, `ui`, `misc`)
* `original_object_key` (string)
* `derivatives_json (jsonb)` (thumb/medium/webp/etc)
* `sha256` (bytea or hex string, indexed) for dedupe
* `phash` (optional) for near-duplicate detection / abuse
* `width`, `height`, `bytes`, `mime`
* **moderation fields**

  * `moderation_state` enum (`pending`, `approved`, `rejected`, `quarantined`)
  * `moderation_labels_json (jsonb)` (vendor outputs)
  * `content_rating` (derived)
  * `reviewed_by`, `reviewed_at`, `rejection_reason`
* `created_at`, `updated_at`

Why these moderation fields:

* Many pipelines mark uploads as pending, run automated checks, then approve/reject asynchronously (e.g., Cloudinary moderation add-ons follow this pattern). ([Cloudinary][8])
* Services like Amazon Rekognition can return moderation labels to help classify adult/offensive content. ([AWS Documentation][9])
* OpenAI’s Moderation API can also be used to assess images. ([OpenAI Developers][10])

**user_image_overrides**

* `user_id (fk users.id)`
* `slot_key` (e.g., `"wK"`, `"darkSquare"`, `"lastMoveArrow"`)
* `image_asset_id (fk image_assets.id)`
* `created_at`
* **PK** (`user_id`, `slot_key`)

Resolution order at runtime:

1. user override (slot_key)
2. user-selected pack mapping
3. system default pack mapping

### 3) Square/piece/move encodings and mappings

You don’t need DB tables for squares/pieces if you standardize encodings in code, but you *do* want consistent storage types.

Recommended encodings:

* `square` as **SMALLINT 0..63** using a1=0, b1=1 … h8=63 (bitboard-friendly)
* `piece` as **SMALLINT** with a compact enum (e.g., wP=1..6, bP=7..12)
* `move` as:

  * `from_sq smallint`
  * `to_sq smallint`
  * `promotion smallint null`
  * plus `uci` string for interoperability ([python-chess.readthedocs.io][5])

These encodings are used in:

* move edges (opening graph)
* review answers (what the user played)
* analytics events

### 4) Opening repertoire ingestion and opening-graph storage

**opening_trees**

* `id (uuid pk)`
* `owner_user_id (fk users.id)`
* `name`, `description`
* `variant` enum (`standard`, `chess960`, etc)
* `root_position_id (fk position_nodes.id)` (usually the starting position)
* `created_at`, `updated_at`

**position_nodes** (your “PositionNode” core entity)

* `id (bigserial pk)` (internal)
* `variant` enum
* `fen_full text`
* `fen_key text` (canonical; first 4 FEN fields)
* `zobrist bigint` (optional, indexed) ([ChessProgramming][7])
* `created_at`
* **unique** (`variant`, `fen_key`)

**move_edges** (global move edges between positions)

* `id (bigserial pk)`
* `variant`
* `from_position_id (fk position_nodes.id)`
* `to_position_id (fk position_nodes.id)`
* `uci varchar(10)` (canonical move identity) ([python-chess.readthedocs.io][5])
* `san varchar(32)` (display) ([ChessProgramming][4])
* `is_capture`, `is_check`, `is_mate` (optional derived flags)
* `created_at`
* **unique** (`variant`, `from_position_id`, `uci`)

**opening_tree_edges** (edges as included/annotated in a specific repertoire)

* `opening_tree_id (fk opening_trees.id)`
* `move_edge_id (fk move_edges.id)`
* `role` enum (`my_move`, `opponent_move`, `sideline`)
* `priority` int (main line vs alternatives)
* `weight` numeric (training weight)
* `comment text`
* `tags text[]` or `tags_json jsonb`
* `source` enum (`import_pgn`, `manual`, `engine`)
* `created_at`
* **PK** (`opening_tree_id`, `move_edge_id`)

Optionally, **opening_tree_nodes** if you want per-repertoire node annotations without duplicating global positions:

* (`opening_tree_id`, `position_id`, `note`, `tags`, `depth_min`)

### 5) PGN ingestion (imports)

PGN parsing libs you can use:

* **python-chess** has robust PGN parsing and board state computation. ([python-chess.readthedocs.io][11])
* **pgn-parser** (JS/NPM) explicitly parses PGN into a JS structure/JSON. ([GitHub][12])

Also note PGN structure: tag pairs + movetext, with SAN moves in movetext. ([Saremba][2])

**pgn_imports**

* `id (uuid pk)`
* `owner_user_id`
* `opening_tree_id (nullable)` (created after parse, or provided)
* `upload_object_key`
* `status` enum (`uploaded`, `parsing`, `building_graph`, `done`, `failed`)
* `error_message`
* `headers_json (jsonb)` (Seven Tag Roster, etc.)
* `created_at`, `updated_at`

**Import pipeline (worker)**

1. Fetch PGN from object storage
2. Parse game(s) and variations
3. Replay moves on a board to compute position after each ply
4. For each position:

   * compute `fen_full` and `fen_key` (first 4 fields)
   * UPSERT into `position_nodes`
5. For each move:

   * compute `uci` (coordinate move) ([python-chess.readthedocs.io][5])
   * compute `san` in context (board-dependent) ([Chess Stack Exchange][13])
   * UPSERT into `move_edges`
   * INSERT into `opening_tree_edges` (with role/priority heuristics or defaults)

This automatically merges transpositions because multiple sequences can resolve to the same `(variant, fen_key)`.

---

## Spaced repetition scheduling + per-item review history

### Scheduling model

Use a “note vs card” separation (content vs user scheduling):

* **Content**: position + expected move (or line)
* **User TrainingItem**: scheduler state for that content for a given user

This mirrors flashcard systems and makes it easy to share opening packs while tracking personalized progress.

### Tables

**training_items** (your “TrainingItem” core entity)

* `id (uuid pk)`
* `user_id (fk users.id)`
* `opening_tree_id (fk opening_trees.id)`
* `prompt_position_id (fk position_nodes.id)`
* `expected_move_edge_id (fk move_edges.id)` (or nullable if multi-answer)
* `item_type` enum (`next_move`, `line`, `name_that_opening`, etc.)
* `active bool`
* `created_at`

**training_item_srs_state**

* `training_item_id (pk/fk training_items.id)`
* `scheduler` enum (`sm2`, `fsrs`)
* `scheduler_version` int
* `state` enum (`new`, `learning`, `review`, `relearning`, `suspended`)
* `due_at timestamptz` (indexed with user_id)
* `interval_days int`
* `ease_factor numeric(4,2)` (SM-2 style)
* `repetitions int`
* `lapses int`
* `last_reviewed_at timestamptz`
* `last_rating smallint`
* `stability numeric` / `difficulty numeric` (FSRS-style optional) ([GitHub][14])
* `updated_at`

**review_logs** (your “ReviewLog” core entity)

* `id (uuid pk)`
* `training_item_id`
* `user_id`
* `reviewed_at timestamptz`
* `rating smallint` (0–5 for SM-2, or 1–4 Again/Hard/Good/Easy like Anki)
* `answer_uci varchar(10)` (what user played)
* `is_correct bool`
* `response_ms int`
* `prev_state jsonb` (optional snapshot)
* `new_state jsonb` (optional snapshot)
* `session_id uuid`
* `client_review_id uuid` (idempotency)
* index on (`user_id`, `reviewed_at`)

### SM‑2 (ease factor + interval) support

SM‑2 uses an **E-Factor (ease factor)** and intervals; canonical formula updates EF as:
`EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))` (clamped to minimum) ([super-memory.com][15])

It also defines classic starter intervals like `I(1)=1`, `I(2)=6`, and later `I(n)=I(n-1)*EF`. ([Anki Forums][16])

Anki’s scheduler is historically based on SM‑2 but with modifications. ([Anki FAQs][17])

### Where to compute intervals (server vs client)

**Recommendation: server-authoritative scheduling**

* Client submits `review_logs` (answer + rating + timings)
* Server computes next SRS state and returns updated `due_at/interval/EF/etc`
* Benefits: consistent behavior, easier anti-cheat, easier algorithm migrations

**Offline compromise**

* Client can store reviews locally with `client_review_id`
* On sync, server ingests logs idempotently and recomputes state (source of truth = review history)

### Capping daily workload / avoiding review explosion

Add **user_srs_settings**

* `user_id`
* `max_reviews_per_day int`
* `max_new_per_day int`
* `learning_steps_minutes int[]` (optional)
* `max_interval_days int`
* `target_retention numeric` (esp. for FSRS-style schedulers)

Queue construction strategy:

1. Pull due reviews: `due_at <= now`, ordered by `due_at`, then priority/weight
2. If due > max_reviews_per_day:

   * prioritize by “risk” (lowest ease / highest lapses / longest overdue)
   * **push overflow forward** by adjusting `due_at` with bounded jitter (load smoothing)
3. Introduce new items only up to `max_new_per_day`
4. Optional: “unlock depth gradually” so imports don’t create 10k new items on day 1

---

## Images: storage, resizing, CDN, caching, versioning, moderation

### Upload flow (recommended)

1. Client requests an **upload URL** from backend
2. Backend returns a **signed URL** for object storage (PUT) ([AWS Documentation][1])
3. Client uploads directly to storage
4. Client calls `/finalize` with the object key + metadata
5. Worker:

   * downloads the object
   * validates file type + size
   * **re-encodes** to safe formats, strips metadata (helps mitigate image parser exploits; common best practice in UGC pipelines)
   * generates variants (thumb/board-size/retina/webp)
   * computes `sha256` and optionally perceptual hash
   * runs moderation (automated + optional human review)

**Signed URL security notes**

* Signed URLs grant time-limited access; anyone with the URL can use it while valid. ([Google Cloud Documentation][18])
* Use guardrails: short expiry, restrict key, monitor usage (AWS prescriptive guidance). ([AWS Documentation][19])
* Prefer “ingest bucket” and only copy into “public bucket” after processing/moderation.

### Moderation metadata

Store:

* automated label outputs (e.g., Rekognition moderation labels) ([AWS Documentation][9])
* a computed content rating / risk score
* human review outcomes (who/when/why)
* status transitions (pending → approved/rejected)

If you use a service/pipeline like Cloudinary + WebPurify, they describe a pattern of “pending status” and asynchronous moderation callbacks. ([Cloudinary][8])

### CDN + caching + versioning

* Use immutable URLs (include `asset_id` + `version` or content hash in path)
* Set long cache TTL on CDN, because changes produce new URLs (cache busting by version)
* Keep `derivatives_json` with the current “active” variant URLs/keys

---

## API surface proposal

### Auth & sessions

* `POST /v1/auth/register`
* `POST /v1/auth/login`
* `POST /v1/auth/refresh`
* `POST /v1/auth/logout`
* `POST /v1/training/sessions` (start)
* `PATCH /v1/training/sessions/{id}` (end, summary)

**Session create response**

```json
{
  "sessionId": "uuid",
  "startedAt": "2026-01-28T12:00:00Z",
  "settings": { "maxItems": 40, "treeId": "uuid" }
}
```

### Users & preferences

* `GET /v1/users/me`
* `PATCH /v1/users/me`
* `GET /v1/users/me/preferences`
* `PUT /v1/users/me/preferences`

### Image packs & assets

* `GET /v1/image-packs?visibility=public`
* `POST /v1/image-packs`
* `GET /v1/image-packs/{packId}`
* `PUT /v1/image-packs/{packId}/mapping`
* `POST /v1/image-assets/upload-url`
* `POST /v1/image-assets/{assetId}/finalize`
* `PUT /v1/users/me/image-overrides`

**Request: create upload URL**

```json
{
  "kind": "piece",
  "mime": "image/png",
  "bytes": 183245,
  "packId": "uuid"
}
```

**Response**

```json
{
  "assetId": "uuid",
  "upload": {
    "method": "PUT",
    "url": "https://storage/signed-url",
    "headers": { "Content-Type": "image/png" },
    "expiresAt": "2026-01-28T12:05:00Z"
  }
}
```

### Opening repertoire (imports, trees, graph)

* `POST /v1/openings/imports/pgn` (returns signed upload URL)
* `POST /v1/openings/imports/{importId}/process`
* `GET /v1/openings/imports/{importId}`
* `GET /v1/opening-trees`
* `POST /v1/opening-trees`
* `GET /v1/opening-trees/{treeId}`
* `GET /v1/opening-trees/{treeId}/graph?depth=12`
* `POST /v1/opening-trees/{treeId}/export` (PGN export)
* `DELETE /v1/opening-trees/{treeId}`

### Training queue & review logging

* `GET /v1/training/queue?treeId=uuid&limit=40`
* `POST /v1/training/reviews:batch`

**Queue response**

```json
{
  "sessionId": "uuid",
  "items": [
    {
      "trainingItemId": "uuid",
      "prompt": {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "positionId": 12345
      },
      "expected": { "uci": "e2e4", "san": "e4" },
      "srs": { "dueAt": "2026-01-28T12:00:00Z", "state": "review" }
    }
  ]
}
```

**Batch review log**

```json
{
  "sessionId": "uuid",
  "reviews": [
    {
      "clientReviewId": "uuid",
      "trainingItemId": "uuid",
      "answerUci": "e2e4",
      "rating": 4,
      "responseMs": 2100,
      "reviewedAt": "2026-01-28T12:03:21Z"
    }
  ]
}
```

**Batch review response (updated schedule)**

```json
{
  "updated": [
    {
      "trainingItemId": "uuid",
      "newState": { "dueAt": "2026-02-03T12:00:00Z", "intervalDays": 6, "easeFactor": 2.45 }
    }
  ]
}
```

### Analytics events (mastery tracking)

* `POST /v1/analytics/events:batch`
* `GET /v1/analytics/mastery?treeId=uuid`
* `GET /v1/analytics/progress?range=30d`

Event payload pattern:

```json
{
  "events": [
    {
      "name": "review_answered",
      "occurredAt": "2026-01-28T12:03:21Z",
      "userId": "uuid",
      "sessionId": "uuid",
      "props": {
        "treeId": "uuid",
        "trainingItemId": "uuid",
        "rating": 4,
        "correct": true,
        "responseMs": 2100,
        "depth": 7
      }
    }
  ]
}
```

---

## Security, abuse prevention, and auditability

### Auth

* JWT access + refresh tokens, or managed identity provider (Auth0/Cognito)
* MFA optional for admins

### Rate limits

* Per-IP + per-user on:

  * upload-url endpoints
  * PGN import/process
  * review logging batch
* Implement in Redis token bucket

### Image abuse controls

* Per-user quotas (daily bytes, total assets)
* Virus/malware scanning in worker
* Re-encode images into safe formats; strip EXIF
* Keep uploads **private** until approved by moderation

### Audit logs

**audit_logs**

* `id`, `actor_user_id`, `action`, `target_type`, `target_id`, `ip`, `user_agent`, `created_at`

Record:

* login attempts
* role/admin actions
* moderation decisions
* exports/downloads of user data

---

## Data retention and privacy notes

1. **PII minimization**

* Keep user profile PII separate from chess/training data
* Use UUIDs and avoid embedding email in logs/events

2. **User deletion**

* Hard delete or anonymize:

  * users: mark `deleted_at`
  * review logs: either delete or keep anonymized aggregates
  * images: delete objects + metadata unless required for safety reasons (e.g., banned hash registry)

3. **Analytics retention**

* Raw event retention: 30–90 days (partitioned)
* Aggregates (daily mastery summaries): longer (e.g., 1–2 years)

4. **Moderation records**

* Retain moderation outcomes longer for abuse prevention, even if user deletes content (store hashes + decision metadata, not the image itself), depending on policy/legal needs.

---

## Risks and migration strategy

### Key risks

1. **Graph complexity (transpositions)**

* UI “tree view” needs a chosen parent; graph can have multiple parents
* Mitigation: store a `preferred_parent_edge_id` per repertoire-node for rendering, but keep full graph for correctness

2. **PGN edge cases**

* Variations, comments, NAGs, malformed PGNs
* Mitigation: use mature parsers (python-chess or a proven JS parser) ([python-chess.readthedocs.io][11]) and store import errors with line offsets

3. **Scheduler evolution**

* Switching SM‑2 → FSRS or changing parameters can invalidate due dates.
* Mitigation:

  * store `review_logs` as the canonical truth
  * keep `scheduler` + `scheduler_version` on state
  * provide a migration job to recompute state from logs (FSRS commonly recalculates stability/difficulty from review history) ([GitHub][14])

4. **Image storage cost**

* Derived variants multiply storage
* Mitigation: generate only necessary sizes; garbage collect unused/orphaned assets; dedupe by `sha256`

### Migration approach

* Start with:

  * `position_nodes`, `move_edges`, `opening_tree_edges`
  * `training_items`, `training_item_srs_state`, `review_logs`
* Add later (backfillable):

  * `zobrist` column (compute in background and populate)
  * mastery aggregates table
  * perceptual hash + duplicate detection
  * partitioning for high-volume tables (`review_logs`, `analytics_events`)

---

## Bibliography (links)

* PGN “complete” specification (Saremba mirror): [https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm](https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm) ([Saremba][2])
* Wikipedia summary of PGN format: [https://en.wikipedia.org/wiki/Portable_Game_Notation](https://en.wikipedia.org/wiki/Portable_Game_Notation) ([Wikipedia][20])
* python-chess PGN parsing docs: [https://python-chess.readthedocs.io/en/latest/pgn.html](https://python-chess.readthedocs.io/en/latest/pgn.html) ([python-chess.readthedocs.io][11])
* JS PGN → JSON library (pgn-parser): [https://github.com/mliebelt/pgn-parser](https://github.com/mliebelt/pgn-parser) ([GitHub][12])
* FEN format overview (ChessBase help): [https://help.chessbase.com/CBase/18/Eng/fen_format.htm](https://help.chessbase.com/CBase/18/Eng/fen_format.htm) ([ChessBase Help][3])
* SAN overview (ChessProgramming): [https://www.chessprogramming.org/Algebraic_Chess_Notation](https://www.chessprogramming.org/Algebraic_Chess_Notation) ([ChessProgramming][4])
* UCI move format example in python-chess: [https://python-chess.readthedocs.io/en/latest/core.html](https://python-chess.readthedocs.io/en/latest/core.html) ([python-chess.readthedocs.io][5])
* Transpositions definition (ChessProgramming): [https://www.chessprogramming.org/Transposition](https://www.chessprogramming.org/Transposition) ([ChessProgramming][6])
* Transposition tables concept (Wikipedia): [https://en.wikipedia.org/wiki/Transposition_table](https://en.wikipedia.org/wiki/Transposition_table) ([Wikipedia][21])
* Zobrist hashing (ChessProgramming): [https://www.chessprogramming.org/Zobrist_Hashing](https://www.chessprogramming.org/Zobrist_Hashing) ([ChessProgramming][7])
* SM‑2 algorithm definition + EF formula (SuperMemo): [https://super-memory.com/english/ol/sm2.htm](https://super-memory.com/english/ol/sm2.htm) ([super-memory.com][15])
* Anki FAQ on spaced repetition algorithm (SM‑2 & FSRS notes): [https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html) ([Anki FAQs][17])
* FSRS algorithm documentation (open-spaced-repetition): [https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) ([GitHub][14])
* AWS S3 presigned URLs doc: [https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) ([AWS Documentation][1])
* AWS presigned URL guardrails guidance (PDF): [https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/presigned-url-best-practices/presigned-url-best-practices.pdf](https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/presigned-url-best-practices/presigned-url-best-practices.pdf) ([AWS Documentation][19])
* Google Cloud Storage signed URLs overview: [https://docs.cloud.google.com/storage/docs/access-control/signed-urls](https://docs.cloud.google.com/storage/docs/access-control/signed-urls) ([Google Cloud Documentation][18])
* AWS Rekognition image moderation labels: [https://docs.aws.amazon.com/rekognition/latest/dg/procedure-moderate-images.html](https://docs.aws.amazon.com/rekognition/latest/dg/procedure-moderate-images.html) ([AWS Documentation][9])
* Cloudinary + WebPurify moderation workflow example: [https://cloudinary.com/documentation/webpurify_image_moderation_addon](https://cloudinary.com/documentation/webpurify_image_moderation_addon) ([Cloudinary][8])
* OpenAI Moderation API (image moderation example): [https://developers.openai.com/cookbook/examples/how_to_use_moderation](https://developers.openai.com/cookbook/examples/how_to_use_moderation) ([OpenAI Developers][10])

---

If you want, I can also provide:

* a **concrete Postgres DDL** (CREATE TABLE statements + indexes + partitions), and
* a suggested **query plan** for `GET /opening-trees/{id}/graph?depth=N` that returns a transposition-aware subgraph efficiently.

[1]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html?utm_source=chatgpt.com "Download and upload objects with presigned URLs"
[2]: https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm?utm_source=chatgpt.com "Standard: Portable Game Notation Specification and ..."
[3]: https://help.chessbase.com/CBase/18/Eng/fen_format.htm?utm_source=chatgpt.com "FEN Format"
[4]: https://www.chessprogramming.org/Algebraic_Chess_Notation?utm_source=chatgpt.com "Algebraic Chess Notation"
[5]: https://python-chess.readthedocs.io/en/latest/core.html?utm_source=chatgpt.com "Core — python-chess 1.11.2 documentation"
[6]: https://www.chessprogramming.org/Transposition?utm_source=chatgpt.com "Transposition"
[7]: https://www.chessprogramming.org/Zobrist_Hashing?utm_source=chatgpt.com "Zobrist Hashing"
[8]: https://cloudinary.com/documentation/webpurify_image_moderation_addon?utm_source=chatgpt.com "WebPurify Image Moderation Add-on | Documentation"
[9]: https://docs.aws.amazon.com/rekognition/latest/dg/procedure-moderate-images.html?utm_source=chatgpt.com "Detecting inappropriate images - Amazon Rekognition"
[10]: https://developers.openai.com/cookbook/examples/how_to_use_moderation?utm_source=chatgpt.com "How to use the moderation API"
[11]: https://python-chess.readthedocs.io/en/latest/pgn.html?utm_source=chatgpt.com "PGN parsing and writing - python-chess - Read the Docs"
[12]: https://github.com/mliebelt/pgn-parser?utm_source=chatgpt.com "mliebelt/pgn-parser"
[13]: https://chess.stackexchange.com/questions/36806/how-do-i-convert-a-move-from-coordinate-notation-to-algebraic-notation?utm_source=chatgpt.com "How do I convert a move from coordinate notation to ..."
[14]: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm?utm_source=chatgpt.com "The Algorithm · open-spaced-repetition/fsrs4anki Wiki"
[15]: https://super-memory.com/english/ol/sm2.htm?utm_source=chatgpt.com "SuperMemo 2: Algorithm"
[16]: https://forums.ankiweb.net/t/sm-2-algorithm-pseudo-code/8350?utm_source=chatgpt.com "SM-2 Algorithm Pseudo-code - Development - Anki Forums"
[17]: https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html?highlight=reset+all&utm_source=chatgpt.com "What spaced repetition algorithm does Anki use?"
[18]: https://docs.cloud.google.com/storage/docs/access-control/signed-urls?utm_source=chatgpt.com "Signed URLs | Cloud Storage"
[19]: https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/presigned-url-best-practices/presigned-url-best-practices.pdf?utm_source=chatgpt.com "presigned-url-best-practices.pdf - AWS Documentation"
[20]: https://en.wikipedia.org/wiki/Portable_Game_Notation?utm_source=chatgpt.com "Portable Game Notation"
[21]: https://en.wikipedia.org/wiki/Transposition_table?utm_source=chatgpt.com "Transposition table"
