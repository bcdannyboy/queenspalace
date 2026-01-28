**Juror 5 — Frontend Chess UI Engineer recommendation (commercial web app–safe)**

If you want the *best chessboard feel* (fast, mobile-first, arrows, highlights, premove, minimal DOM churn) you’d normally pick **Chessground**—but it’s **GPL-3.0** and its own README explicitly states that if you use it on your website, your combined work “may be distributed only under the GPL” and you “must release your source code” to your website’s users. ([GitHub][1])
So for a commercial web app where you want to keep your frontend proprietary, I recommend building around permissive-licensed chessboards and pairing them with **chess.js** (BSD-2-Clause) for rules/SAN/FEN/PGN handling. ([GitHub][2])

Below are **two viable implementation stacks** plus a comparison and an architecture that supports interactive training drills.

---

## 1) Chess UI choice: what to use and why

### Quick comparison (UI layer)

| UI library                             | License | Strengths for your requirements                                                                                                                                                                                                             | Tradeoffs / gotchas                                                                                                                         |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chessground** (lichess)              | GPL-3.0 | Extremely featureful: **SVG circles/arrows**, arrows snapping, mobile touch events, click-move + drag-drop, premove, animations, tiny footprint + custom DOM diff for speed. ([GitHub][1])                                                  | **Not “commercial-safe” for closed-source frontends**: GPL + explicit “release your source” note in README. ([GitHub][1])                   |
| **react-chessboard**                   | MIT     | React-native component, **drag/drop**, animation, event handling, **mobile support**, responsive, **accessible**, TS support. ([GitHub][3])                                                                                                 | React coupling; you’ll implement advanced drill overlays (arrows, custom callouts) via its API or your own overlay.                         |
| **cm-chessboard**                      | MIT     | Framework-agnostic, **SVG-rendered**, responsive, no dependencies; has an extension system including **arrows/markers**, **HTML layer** overlay, promotion dialog, and an **accessibility extension**; includes stress tests. ([Shaack][4]) | Imperative API (you wrap it in React/Vue); you’ll manage state syncing carefully to avoid redundant renders.                                |
| **chessboard.js**                      | MIT     | Classic “just a board” with a solid API; explicitly meant to be used with chess.js for apps like tactics. Depends on jQuery. ([GitHub][5])                                                                                                  | Older stack + jQuery dependency; maintainer says focus shifted to **chessboard2**. ([GitHub][5])                                            |
| **chessboard2**                        | ISC     | Successor direction from chessboard.js maintainer; permissive license. ([GitHub][5])                                                                                                                                                        | Evaluate maturity/API yourself (I’m not relying on undocumented claims here—just noting it’s the stated successor + license). ([GitHub][5]) |
| **chessboard-element** (web component) | MIT     | Web component fork of chessboard.js; works across frameworks; includes helpful FEN parsing helper `fenToObj`. ([Justin Fagnani][6])                                                                                                         | Likely needs extra work for arrows/advanced overlays (or add an overlay lib).                                                               |

### My practical recommendation for a commercial training app

* **Default pick (React product):** **react-chessboard** (MIT) for “it just works” React integration + mobile + accessibility. ([GitHub][3])
* **Default pick (framework-agnostic + drill overlays):** **cm-chessboard** (MIT) because it already has **arrows/markers** and an **HTML overlay layer** concept that maps nicely to “training prompts that reference squares/pieces.” ([Shaack][4])
* **Avoid for closed-source commercial frontend:** Chessground and anything derived/compatible that is GPL in your bundle (unless you’re prepared to comply by releasing source). ([GitHub][1])

---

## 2) Chess rules engine choice: chess.js frontend/backend/both + legality

### Use **chess.js** as your rules single source of truth

**chess.js** is a TypeScript chess library for move generation/validation and game end detection, and the repo is **BSD-2-Clause** (commercial friendly). ([GitHub][2])
Its docs include:

* Working with **FEN** (load/validate), ([GitHub][2])
* Loading/exporting **PGN** (including options), ([GitHub][2])
* Accepting **SAN** / move parsing with **strict vs permissive** parsing options (useful for keyboard SAN entry). ([GitHub][2])

### Frontend vs backend placement

* **Frontend (recommended for training UX):** run chess.js in the browser so drag/click/SAN entry validates instantly (no latency), and you can compute legal destinations for highlight previews.
* **Backend (recommended when cheating or authoritative state matters):** run the *same* chess.js logic server-side to validate submitted moves and prevent tampering. Since chess.js is BSD-2-Clause and runs in Node, sharing a common rules module is straightforward. ([GitHub][2])
* **Both (best overall):** frontend for responsiveness + backend as authority.

### How to avoid illegal-move bugs in the UI

Key rule: **never trust the board UI to define legality.** Treat it as an input device.

Recommended flow:

1. UI emits a *move intent* (`from`, `to`, optional `promotion`).
2. Only chess.js decides legality (attempt move; if rejected → revert UI).
3. For a smoother UX, compute **legal moves map** from chess.js and feed it to your board UI to restrict drags/click destinations (or visually indicate legal squares) before the user drops.

Also: store moves internally in a deterministic form like **UCI** (`e2e4`) plus derived SAN for display. That makes branching training lines easier and avoids SAN ambiguity edge cases.

### Why not chessops?

**chessops** is an excellent modern TypeScript rules toolkit, but it is **GPL-3.0**. ([GitHub][7])
For a closed-source commercial frontend, that’s typically a non-starter (same licensing problem as Chessground).

---

## 3) UI architecture: components + state + overlays for drills

### Component map (suggested)

**Page: `TrainerRoom`**

* `BoardArea`

  * `ChessboardView` (react-chessboard OR cm-chessboard wrapper)
  * `BoardOverlayLayer`

    * arrows, circles, square highlights, “tap targets”, hint badges, etc.
* `PromptPanel`

  * training text (“Play …”, “Find mate in 2”, “Click e4”)
  * step status + hints
* `NotationPanel`

  * move list (SAN) + variation tree UI (optional)
* `SANInput`

  * keyboard entry box with SAN parsing + autocomplete
* `ControlsBar`

  * undo/redo, reset, flip board, show hint, show solution
* `FeedbackToast`

  * correct/incorrect, explanation, next prompt CTA

### State model (the stuff you must track)

* **Game state**

  * `fen` (current)
  * `history[]` (uci, san, fenBefore, fenAfter, captured, promotion)
  * `plyIndex` (for navigation / takeback)
  * `turnColor`, `check`, `mate`, `draw` (derived)
* **UI input state**

  * `selectedSquare`
  * `legalMovesBySquare` (map: from → [to…])
  * drag state / pending promotion
* **Training state**

  * `trainingItemId`
  * `stepIndex`
  * `expectedMoveTree` (for branches)
  * `attempts`, `hintsUsed`, `lockedSquares` (for certain drill types)
  * `mode`: normal / multi-move / branch / blind recall

### Event flow diagram (text)

```
[TrainingEngine] --(initial FEN + expected move tree)--> [GameStore]
[GameStore] --(fen + annotations + legalMoves)--> [ChessboardView + Overlay]

User action:
  - drag-drop OR click-move OR keyboard SAN
        |
        v
   [MoveIntent {from,to,promotion? or sanText}]
        |
        v
   [Rules: chess.js]
      | legal? -> yes -------------------------------> update fen/history
      |         -> no  -------------------------------> reject + UI revert + feedback
      v
   [TrainingEngine.validate(move)]
      | correct -> advance step / branch resolution / next item
      | wrong   -> increment attempts, show hint highlight/arrow, maybe reset
```

---

## 4) Mobile UX: touch interactions + accessibility

### Touch & click-move behavior

* Use a board library with explicit mobile support:

  * Chessground explicitly lists full mobile touch event support. ([GitHub][1])
  * react-chessboard lists mobile support + responsive + accessible. ([GitHub][3])
  * cm-chessboard is designed to be responsive and SVG-rendered. ([Shaack][4])
* Implement **tap-to-select then tap-to-destination** as the “default” on phones, with drag-drop enabled but optional (dragging can fight scrolling).

### Premove (optional)

* If you’re doing *playing* (not just drills), premove is a nice-to-have.
* If you’re doing *training*, premove can confuse learners; consider disabling it except in “speed drills.”

### Accessibility

* react-chessboard explicitly calls out being **accessible**. ([GitHub][3])
* cm-chessboard lists an **“Accessibility extension.”** ([Shaack][4])
  Recommended:
* Keyboard focus ring on squares
* Arrow keys navigate squares
* Enter to “pick up” a piece, Enter to “drop”
* SR-friendly move announcements (“White: Knight to f3, check”)

---

## 5) Performance: keep it snappy on mobile

### UI performance principles

* Prefer a board implementation that doesn’t rerender the whole grid on every move.

  * Chessground explicitly optimizes DOM writes via a custom diff and has a tiny footprint. ([GitHub][1])
  * cm-chessboard is SVG-based, lightweight, and even includes stress-test examples (create/destroy many boards). ([Shaack][4])

### Rerender minimization (framework)

* Keep the **rules engine instance** (chess.js) in a stable ref/module and only publish minimal derived state to the UI.
* Update the board from **FEN only** (one string), not from a huge object tree.
* Virtualize or memoize the notation panel when PGNs get long.

### Cache and reuse piece assets

* Inline SVG pieces (or prefetch) so you avoid repeated network fetches.
* Reuse the same DOM/SVG nodes when possible; avoid forcing layout thrash.

### Heavy tasks in workers

* Big PGN parsing, variation tree building, or engine analysis should run in a Web Worker so touch interactions don’t stutter.

---

## 6) Extensibility: multi-move lines, branches, blind recall

This is where your “training prompt engine” matters more than the board library.

### Represent drills as a move tree, not a single line

Use **cm-pgn** (MIT) to parse PGN including **variations, NAGs, comments**, and it exposes a move structure including SAN, UCI, FEN-after-move, and variations lists. ([GitHub][8])
That maps perfectly to:

* **Multi-move sequences**: validate step-by-step down the mainline
* **Branch decisions**: allow multiple correct continuations (variations)
* **Explain mode**: show comments/NAGs as teaching text

### Blind recall mode

* Render pieces as hidden (or only show some pieces).
* Still validate via chess.js internally.
* Use overlays to prompt: “Find the square: e4” (highlight square only) or “Knight fork on f7” (arrow hint).

---

## Two viable implementation stacks

### Stack A — React-first (fastest path to production)

**React (Next.js or Vite) + react-chessboard + chess.js + cm-pgn**

* **Board UI:** `react-chessboard` (MIT). ([GitHub][3])
* **Rules:** `chess.js` (BSD-2-Clause) in frontend; optionally shared in backend. ([GitHub][2])
* **PGN w/ variations for lessons:** `cm-pgn` (MIT). ([GitHub][8])
* **State mgmt:** Zustand / Redux Toolkit (pick your team preference)
* **Overlays (arrows/highlights):**

  * Prefer the board’s own API if available,
  * Otherwise render a sibling SVG/canvas overlay positioned over the board.

Why this stack works:

* React component ergonomics, mobile support, accessibility baseline. ([GitHub][3])
* Permissive licensing end-to-end for commercial distribution. ([GitHub][3])

### Stack B — Framework-agnostic core (best for “drills + overlays”)

**Vue 3 + cm-chessboard + chess.js + cm-pgn**

* **Board UI:** `cm-chessboard` (MIT), SVG + responsive + extension system. ([Shaack][4])
* **Arrows & square markers:** built-in extension methods like `addArrow` / `addMarker`. ([Shaack][9])
* **Overlay layer:** use the `HTML Layer extension` to place interactive drill UI on top of squares (badges, numbers, etc.). ([Shaack][4])
* **Accessibility:** use its accessibility extension. ([Shaack][4])
* **Rules + SAN entry:** `chess.js` (BSD-2-Clause) with strict/permissive parsing per your UX. ([GitHub][2])
* **PGN parsing:** `cm-pgn` for full-featured training content (variations/comments/NAGs). ([GitHub][8])
* **State mgmt:** Pinia

Why this stack works:

* You get a board that’s naturally “overlay-friendly” for drills (arrows/markers/HTML layer) without GPL constraints. ([Shaack][4])

---

## Licensing notes for a commercial web app

### Permissive licenses (MIT / BSD / ISC)

* Generally allow commercial use, modification, and closed-source distribution, with requirements mainly around preserving copyright/license notices.

  * Examples here: react-chessboard (MIT), ([GitHub][3]) cm-chessboard (MIT), ([Shaack][4]) chessboard.js (MIT), ([GitHub][5]) chess.js (BSD-2-Clause), ([GitHub][2]) chessboard2 (ISC). ([Chessboard.js][10])

### Copyleft (GPL)

* GPL is typically **incompatible with closed-source frontend bundles**, because distributing the JS to users can trigger copyleft obligations.
* Chessground is GPL-3.0 and its README explicitly says you must release your source code to users of your website if you use it. ([GitHub][1])
* chessops is GPL-3.0 as well. ([GitHub][7])

*Not legal advice—have counsel review your exact distribution model—but from a product-engineering risk perspective, it’s safest to avoid GPL JS UI/libs in a proprietary web app.*

---

## Suggested libraries for PGN/FEN import/export

* **Rules + SAN + FEN + PGN basics:** `chess.js` (BSD-2-Clause). ([GitHub][2])
* **PGN with variations/comments/NAGs for lesson trees:** `cm-pgn` (MIT), provides SAN/UCI/FEN-after-move and variation pointers. ([GitHub][8])
* **Optional overlay arrows if your board lacks it:** `chessboard-arrows` (MIT) can extend “any chessboard library” to allow drawing arrows/circles. ([GitHub][11])
* **If using web components:** `chessboard-element` (MIT) includes `fenToObj` helper. ([Justin Fagnani][6])

---

## Risks & mitigations

1. **Licensing risk (GPL contamination)**

* Risk: including Chessground/chessops in your shipped bundle implies GPL obligations. ([GitHub][1])
* Mitigation: stick to MIT/BSD/ISC options above; run OSS compliance tooling in CI.

2. **Mobile drag/drop conflicts with scrolling**

* Risk: touch gestures fight the page; accidental drags.
* Mitigation: tap-to-move default, larger hit targets, disable scroll while dragging, test iOS Safari + Android Chrome early.

3. **Illegal move edge cases (promotion, castling, en passant)**

* Risk: UI accepts move that engine rejects → desync.
* Mitigation: chess.js as the single authority; board only emits intents; always reconcile from engine FEN.

4. **Accessibility gaps**

* Risk: “drag-only” UI is unusable for keyboard/SR users.
* Mitigation: use react-chessboard’s accessibility features or cm-chessboard accessibility extension; add keyboard SAN input as a parallel path. ([GitHub][3])

5. **Performance on low-end phones**

* Risk: overlay drawing + long move lists stutter.
* Mitigation: minimize rerenders, cache assets, move heavy parsing/analysis to a worker, virtualize notation.

---

## Bibliography (sources)

* lichess-org **Chessground** (features + GPL license note). ([GitHub][1])
* oakmac **chessboard.js** (MIT license, depends on jQuery, status focusing on chessboard2). ([GitHub][5])
* **chessboard2** download page (ISC license). ([Chessboard.js][10])
* Clariity **react-chessboard** (features + MIT license). ([GitHub][3])
* shaack **cm-chessboard** (MIT license; extensions incl arrows/HTML layer/accessibility; responsive SVG). ([Shaack][4])
* justinfagnani **chessboard-element** (MIT; fork of chessboard.js; `fenToObj`). ([Justin Fagnani][6])
* jhlywa **chess.js** (BSD-2-Clause; docs for SAN/FEN/PGN parsing/handling). ([GitHub][2])
* shaack **cm-pgn** (MIT; supports variations/comments/NAGs; exposes SAN/UCI/FEN + variations). ([GitHub][8])
* niklasf **chessops** (GPL-3.0 license). ([GitHub][7])
* mcba1n **chessboard-arrows** (MIT overlay arrows/circles for chessboards). ([GitHub][11])

---

If you tell me which framework you’re using today (React vs Vue vs “not decided”), I can turn the chosen stack into a concrete folder/module structure plus a minimal “Trainer drill loop” pseudo-implementation (move intent → chess.js validation → training engine step).

[1]: https://github.com/lichess-org/chessground "GitHub - lichess-org/chessground: Mobile/Web chess UI for lichess.org"
[2]: https://github.com/jhlywa/chess.js "GitHub - jhlywa/chess.js: A TypeScript chess library for chess move generation/validation, piece placement/movement, and check/checkmate/draw detection"
[3]: https://github.com/Clariity/react-chessboard "GitHub - Clariity/react-chessboard: A modern, responsive chessboard component for React applications."
[4]: https://shaack.com/projekte/cm-chessboard/ "cm-chessboard"
[5]: https://github.com/oakmac/chessboardjs "GitHub - oakmac/chessboardjs: JavaScript chessboard"
[6]: https://justinfagnani.github.io/chessboard-element/docs/?utm_source=chatgpt.com "chessboard-element »"
[7]: https://github.com/niklasf/chessops?utm_source=chatgpt.com "niklasf/chessops: Chess and chess variant rules and ..."
[8]: https://github.com/shaack/cm-pgn "GitHub - shaack/cm-pgn: Parse and create PGNs (Portable Game Notation for chess games)"
[9]: https://shaack.com/projekte/cm-chessboard/examples/extensions/arrows-extension.html?utm_source=chatgpt.com "cm-chessboard - shaack.com"
[10]: https://chessboardjs.com/v2/download "chessboardjs.com » Download"
[11]: https://github.com/mcba1n/chessboard-arrows?utm_source=chatgpt.com "mcba1n/chessboard-arrows: A library that extends ..."
