Below is what I’d recommend as a pedagogy-first opening-training design, informed by how modern platforms actually train openings today (spaced repetition, position-centric prompts, transposition handling, and game-feedback loops), plus cognitive-science findings on durable recall and chess expertise.

---

## What modern opening trainers implicitly “teach” about memorization

### 1) Spaced repetition is the default—but implementations differ in a crucial way

Most modern trainers use spaced repetition to schedule reviews; what varies is the “atom” being scheduled:

* **Per-move timers (fine-grained)**: Chess.com/Chessable’s MoveTrainer uses spaced repetition with increasing intervals (e.g., hours → days → months) and explicitly notes that **each move in a variation has its own timer**, so a single weak move can be re-tested more often without re-drilling everything. ([Chess.com Help Center][1])
* **Move-as-card / Leitner-style**: Listudy describes each move as a “card” and uses a Leitner-like promotion/reset mechanic so you see weaknesses more frequently while strong positions fade out. ([Listudy][2])
* **Moves-not-lines (transposition-friendly)**: Chessbook’s founders explicitly frame the difference: treating repertoires as *lines* is limiting (especially for transpositions), so they schedule **moves** and mix move-orders to force **position recognition rather than sequence recognition**. ([saychess.substack.com][3])

**Pedagogical implication:** Your app should schedule *positions/moves*, not “lines”, because chess memory is position-anchored and transpositions are position-identical.

---

### 2) The best trainers connect “what you memorize” to what you actually face

Two modern trends:

* **Frequency-weighting with real-game stats**:

  * Openingtrainer simulates opponent choices using **Lichess statistics**, sampling moves according to observed frequencies (e.g., 68% → 68% chance). ([openingtrainer.com][4])
  * Chessbook was motivated by the problem of wasting time on lines “never played”, and builds/prunes based on large online-game stats. ([saychess.substack.com][3])
* **Feedback loop from your own games**:

  * Chesstempo’s opening trainer integrates with its “play chess online” to show **where you deviated** and lets you **extend repertoire** to cover opponent lines that appeared. ([Chess Tempo][5])
  * Chessbook similarly emphasizes monitoring online games to show where you went wrong and help update repertoire. ([saychess.substack.com][3])

**Pedagogical implication:** “Mainline vs sideline” should be driven by (a) population frequency at your rating/time control and (b) *your personal* frequency + error rate.

---

### 3) Transpositions are the decisive UX/pedagogy differentiator

If you store openings as linear PGN lines, transpositions become duplicated work and false “mastery”.

* Chess Position Trainer explicitly stores **positions and candidate moves** (not games) to **spot transpositions automatically**. ([chesspositiontrainer.com][6])
* Chesstempo’s manual explains “related openings” and that opening explorer stats **account for transpositions** (positions reachable via multiple routes).
* The fact that users still complain elsewhere about trainers not merging transpositions underscores this as a real-world failure mode. ([lichess.org][7])

**Pedagogical implication:** Your internal model should be a **position graph (DAG)**, not a move tree.

---

## Cognitive science: what matters for “good faith mastery”

### Spacing + retrieval practice are the backbone

* **Spacing effect / distributed practice** improves retention compared to massed repetition across many tasks. ([Psychnet][8])
* **Retrieval practice (“testing effect”)**: being forced to *recall* (not just re-read) produces stronger long-term retention. ([ResearchGate][9])

**Design implication:** training should be *active recall* from FEN prompts; avoid recognition-heavy multiple-choice as the primary mode.

### Chess expertise relies on chunking/patterns, not raw sequences

Classic work on chess memory shows experts remember meaningful chess positions far better than random ones—evidence of **chunking / structured pattern memory**. ([PubMed][10])

**Design implication:** “opening mastery” cannot be only move-order. It must include:

* recognizing the **resulting pawn structure / piece placement** (the “chunk”), and
* knowing the **plans** that make the moves make sense.

---

## Key design question 1: What should “mastery” mean for an opening line?

### Recommendation: treat mastery as a 4-layer stack

1. **Move-order mastery (your side)**

   * From the position, you can play your repertoire move quickly and accurately.

2. **Opponent-response mastery (coverage)**

   * You can respond to the *common opponent moves* (by frequency + danger), not just the main line.

3. **Transposition mastery (position identity)**

   * You can find the right move even if the position is reached by a different move order.
   * Chessbook explicitly mixes order to train this. ([saychess.substack.com][3])

4. **Plan mastery (conceptual anchors)**

   * You can state (or select) the key plan/pawn break/piece placement idea for the resulting structure.
   * Strong-player pedagogy increasingly emphasizes: don’t add lines you don’t understand. ([lichess.org][11])

### “Good faith mastery” tests (anti-gaming)

To ensure the user isn’t just pattern-matching the *preceding moves*:

* **Position-only prompts**: show the board (FEN), not the move list.
* **Random start points**: jump in at move 7–12 sometimes (but ensure conceptual support; see “cognitive overload” risks).
* **Transposition injections**: same FEN, different move history.
* **Occasional “colors reversed” drills** (advanced): ask the user to play the *other side* for a subset of lines to reveal rote memorization (this is commonly recommended in position-based trainers because it exposes understanding gaps). ([lichess.org][12])

---

## Key design question 2: How should openings be represented in the app?

### Recommendation: Position graph + candidate moves (DAG), not a pure PGN tree

**Core object model**

* **Node = canonical position** (FEN + side to move + castling rights + en passant; halfmove clock can be ignored for openings).
* **Edges = moves** with metadata:

  * repertoire status: main / secondary / informational
  * frequency stats (population + personal)
  * evaluation/volatility (optional)
  * tags: ECO, opening name(s), pawn-structure label
  * annotations: plans, motifs, “why” note

This mirrors what transposition-aware tools do:

* CPT stores positions/candidate moves to spot transpositions automatically. ([chesspositiontrainer.com][6])
* Chesstempo explicitly models transposition-aware opening exploration.

### PGN import → normalize → graph

* Parse PGN variations into a preliminary tree.
* Convert to DAG by merging identical positions.
* Preserve original move-order paths as **named “routes”** for human readability.

### ECO tagging and naming

* Important nuance: **ECO codes classify move orders, not positions.**
* So in a transposition-aware app:

  * allow a node to have **multiple opening names/ECO codes** depending on route (like Chesstempo “related openings” concept).
  * show “You are in a position that can arise from X/Y/Z openings.”

### Position prompts vs move-list prompts

* Default training prompt should be **position-based**.
* Still keep **move-list prompts** as a beginner-friendly scaffolding mode (recognition → recall progression).

---

## Key design question 3: How should the app prioritize what to memorize?

### Recommendation: “Essential lines” = frequency-weighted coverage with a danger modifier

Borrow the strongest idea from Chessbook + Openingtrainer: *don’t memorize what you won’t see*. ([saychess.substack.com][3])

**For each position where it’s opponent to move:**

1. Rank opponent options by:

   * **Population frequency** at user rating/time-control band
   * **Personal frequency** from imported games (if available)
   * **Danger** (how bad is your likely natural response / eval swing / tactical trap rate)
2. Add opponent moves until you hit a **coverage threshold**, e.g.:

   * Club player: cover 80–90% frequency
   * Tournament improver: 90–95%
   * Titled/deep prep: 95–99% + novelty depth

**Depth control:** mimic Chessable’s “depth” concept (learn only first N moves of a line) but do it *positionally*, so you don’t end up learning 10 moves of a sideline you’ll never face. ([Chess.com][13])

**Key Moves mode:** also mirror “Key Moves vs All Moves” settings so users can opt into learning only decision points first. ([Chess.com Help Center][14])

---

## Key design question 4: What should the app do when the user deviates?

### Recommendation: treat deviations as either “error”, “alternative”, or “new branch”

**Immediate behavior**

* If move is *outside repertoire*:

  1. Show the repertoire move(s) and a short explanation (from annotations).
  2. Show whether the user’s move is “playable but different plan” vs “tactical error.”

**Branch creation workflow**

* Offer: “Add this sideline?” with options:

  * “Add opponent move only” (so you’ll be prompted next time)
  * “Add full response line to depth X”
  * “Mark as ignore (rare)” (keeps training lean)

**Game-based reinforcement loop**

* After imported/connected games: automatically identify the **first divergence** (“one-move rule” style) and suggest adding only what mattered. ([lichess.org][11])
* This keeps repertoire growth relevant and manageable (strong-player practice). ([lichess.org][11])

---

## Key design question 5: Memory-palace imagery without turning it into pure rote

### Recommendation: Hybrid encoding = mnemonic for sequence + concept anchors for positions

Memory palaces (method of loci) can be great for *ordered sequences*, but chess recall should ultimately be *position/plan-driven*. ([Wikipedia][15])

**Practical hybrid design**

* Allow optional **mnemonic hooks** only at:

  * branch points (where move order matters),
  * tactical “trap” moments,
  * awkward-to-remember forced sequences.
* Require every mnemonic to attach to a **concept tag**:

  * pawn break (…c5, …e5, f4-f5),
  * “good/bad bishop” idea,
  * typical maneuver (Nd2-f1-g3),
  * king safety theme, etc.

**Training integration**

* After the user plays the correct move:

  * show the mnemonic (if present) *and* the plan note.
* After a mistake:

  * ask a quick “why” prompt (“What is Black’s main pawn break here?”) to shift from rote to meaning.

This aligns with the “ask WHY” coaching approach and the general admonition to avoid adding lines you don’t understand. ([Next Level Chess By GM Noël Studer][16])

---

## Proposed content pipeline: source → normalize → tree → training items

### 1) Source ingestion

* **PGN import** (user repertoire, coach file, exported Lichess Study, etc.)
* Optional: import from “routes” (e.g., separate PGNs for different defenses)

### 2) Normalize & validate

* Parse SAN → legal move sequence
* Compute canonical **FEN per ply**
* Identify duplicates and merge into a **position DAG**
* Preserve:

  * comments/annotations
  * route names (“Najdorf mainline”, “Anti-Sicilian 2.c3”, etc.)
  * example games links (not trained by default)

(TreeVis explicitly distinguishes example moves vs “training” export—good idea to copy. ([TreeVis][17]))

### 3) Enrich nodes/edges

* Attach:

  * ECO/opening names per route
  * transposition labels (“also arises from…”) (Chesstempo “related openings” is the right mental model).
  * frequency stats (population + personal)
  * plan annotations and pawn-structure tags

### 4) Generate training items

Create multiple “cards” per node depending on the learning objective:

* **Move card**: (FEN, side-to-move) → “play your move”
* **Opponent-coverage card**: choose response vs top opponent move
* **Transposition card**: same FEN but reached via alternate route
* **Plan card**: “what is the main plan/pawn break here?”
* **Checkpoint card**: “rebuild from starting position to reach this structure”

### 5) Schedule & adapt

* Per-move/per-position spaced repetition like MoveTrainer (each move has its own timer). ([Chess.com Help Center][1])
* Adjustable difficulty (standard/hard/extra-hard style) and “key moves only” option. ([Chess.com Help Center][14])

### 6) Close the loop from games

* Import games, detect first divergence, propose micro-updates (“one move rule”). ([lichess.org][11])

---

## Recommended training modes

### Mode A: Next Move (core SRS)

* Prompt: position only (FEN)
* Task: play best repertoire move(s)
* Feedback: show line continuation + plan note

(Aligns with MoveTrainer scheduling and Listudy’s move-as-card approach. ([Chess.com Help Center][1]))

### Mode B: Play vs Book (realistic opponent)

* Start from initial position *or* any node
* Opponent move selection:

  * frequency-weighted (like Openingtrainer) ([openingtrainer.com][4])
  * optionally filtered by rating band/time control
* Stop condition: first out-of-repertoire move → show recap + add-branch option

### Mode C: Rebuild from Memory (line reconstruction)

* “From start, play until you reach X checkpoint”
* This is harder but is the best “cold test” for line integrity.

### Mode D: Blank-board recall (structure imprinting)

* Show final FEN after a line and ask:

  * “Where are the pawns?” (drag/drop), or
  * “Which minor piece belongs on which square?”
* Goal: build **chunk-based memory** of typical setups. ([PubMed][10])

---

## Mastery rubric with measurable thresholds

You want mastery that is measurable, transposition-safe, and resistant to “rote gaming.”

### Move-level mastery (single decision point)

A move is “mastered” when all are true:

* **Accuracy:** ≥ 90% over last 20 attempts
* **Speed:** median response time ≤ 5s (or user-configurable)
* **Retention:** survives a “cold interval” (e.g., ≥ 14 days) with ≥ 80% accuracy
* **Context robustness:** correct from ≥ 2 different entry routes (transposition test)

(The schedule concept can mimic MoveTrainer’s long intervals up to months for high mastery. ([Chess.com Help Center][1]))

### Line-level mastery (a named route / variation)

A line is “mastered” when:

* All **key moves** in the line reach move-level mastery (above), and
* The user can “rebuild from memory” end-to-end with ≤ 1 mistake, twice, on separate days.

(“Key moves only” is important to prevent bloat. ([Chess.com Help Center][14]))

### Opening-level mastery (entire repertoire section)

An opening is “mastered” when:

* **Coverage:** you can respond correctly to opponent moves totaling ≥ X% frequency at your rating band
* **Transposition:** all major transposition nodes are merged and tested as one
* **Applied performance:** in your last N games reaching this opening, you stayed in-repertoire through move M at least Y% of the time (personal metric)

---

## Feature recommendations to borrow/adapt

### From Chessable / MoveTrainer (via Chess.com Help)

* Per-move spaced repetition intervals and “each move has its own timer.” ([Chess.com Help Center][1])
* User-configurable:

  * key moves vs all moves
  * review ordering (random vs fixed)
  * difficulty settings (standard/hard/extra-hard) ([Chess.com Help Center][14])
* Custom schedules / cyclical review concepts (useful for cramming before tournaments, but risky long-term). ([Chessable Support][18])

### From Chesstempo

* Integrated “play → feedback on deviation → extend repertoire” loop. ([Chess Tempo][5])
* Transposition-aware opening exploration / related openings framing.

### From Chessbook

* Don’t waste time on ultra-rare lines; drive priorities by what you’ll see. ([saychess.substack.com][3])
* Mix move-orders to train position recognition (transposition robustness). ([saychess.substack.com][3])

### From Listudy

* “Play against repertoire” as a hands-on learning flow + Leitner style. ([Listudy][2])

### From Chess Position Trainer

* Position/candidate-move storage model that naturally handles transpositions. ([chesspositiontrainer.com][6])

### From Openingtrainer

* Frequency-sampled opponents from Lichess stats
* Mistake handling that forces analysis rather than spoon-feeding ([openingtrainer.com][4])

---

## Risks and mitigations

### Risk 1: Overfitting to rote lines

**Symptom:** user “knows” the sequence but collapses after deviation.
**Mitigation:** position-only prompts + plan cards + transposition injections + occasional reverse-side drills. ([ResearchGate][9])

### Risk 2: Transposition errors / duplicated learning

**Symptom:** same position drilled twice under different move orders.
**Mitigation:** canonical-position DAG; merge nodes; test via alternate routes. ([chesspositiontrainer.com][6])

### Risk 3: Cognitive overload and review pile-up

**Symptom:** thousands of due reviews; user quits.
**Mitigation:** essential-lines coverage thresholds + “key moves only” + game-driven growth (“one move rule”). ([Chess.com Help Center][14])

### Risk 4: Illusion of competence from recognition prompts

**Symptom:** user succeeds when shown the move-history but fails OTB.
**Mitigation:** retrieval practice design (free recall from FEN), spacing, and “cold tests.” ([ResearchGate][9])

---

## Bibliography

### Opening trainers / platforms

* Chess.com Help Center (MoveTrainer spaced repetition intervals; per-move timers). ([Chess.com Help Center][1])
* Chess.com Help Center (course settings: key moves vs all moves; review difficulty). ([Chess.com Help Center][14])
* Chessable Support (schedule setting: default/custom/cyclical) – surfaced via search snippet. ([Chessable Support][18])
* Chess.com blog (custom depth & schedule for Chessable/Chess.com courses). ([Chess.com][13])
* Chesstempo opening trainer landing page (train with spaced repetition; post-game deviation feedback; extend repertoire). ([Chess Tempo][5])
* Chesstempo manual (transposition-aware opening exploration; “related openings”; stats account for transpositions).
* Chess Position Trainer (stores positions/candidate moves; spots transpositions automatically). ([chesspositiontrainer.com][6])
* Listudy blog (spaced repetition + Leitner system; openings learned by playing against repertoire). ([Listudy][2])
* Chessbook interview (moves-not-lines; frequency-based pruning; mixed move-orders to recognize transpositions; game monitoring). ([saychess.substack.com][3])
* Openingtrainer.com (Lichess-statistic opponent emulation; analysis-on-mistake philosophy). ([openingtrainer.com][4])
* Chessreps tagline (spaced repetition repertoire drills). ([Chessreps][19])
* TreeVis (handle transpositions; separate “example” moves from trained repertoire). ([TreeVis][17])

### Strong-player / practical pedagogy

* FM CheckRaiseMate (practice games early; “one move rule”; don’t add lines you don’t understand; spaced repetition as commitment). ([lichess.org][11])
* GM Noël Studer (memorization advice emphasizing “ask why”). ([Next Level Chess By GM Noël Studer][16])

### Cognitive science & expertise

* Roediger & Karpicke (test-enhanced learning / retrieval practice). ([ResearchGate][9])
* Cepeda et al. (distributed practice / spacing effect meta-analysis). ([Psychnet][8])
* Chase & Simon (chess expertise and chunking/pattern-based memory). ([PubMed][10])
* Method of loci overview (memory palace concept). ([Wikipedia][15])

---

If you want this turned into a concrete spec (data model for the position DAG + scheduling logic + exact “card types” and scoring), I can draft that next—still focusing on transpositions, plans, and mastery testing.

[1]: https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work "https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work"
[2]: https://listudy.org/en/blog/spaced-repetition-for-chess "https://listudy.org/en/blog/spaced-repetition-for-chess"
[3]: https://saychess.substack.com/p/an-interview-with-marcus-buffett "https://saychess.substack.com/p/an-interview-with-marcus-buffett"
[4]: https://openingtrainer.com/ "https://openingtrainer.com/"
[5]: https://chesstempo.com/opening-training/ "https://chesstempo.com/opening-training/"
[6]: https://www.chesspositiontrainer.com/index.php/en/features/79-features/80-openings "https://www.chesspositiontrainer.com/index.php/en/features/79-features/80-openings"
[7]: https://lichess.org/forum/general-chess-discussion/chessbase-repertoire-training-transpositions-not-merging "https://lichess.org/forum/general-chess-discussion/chessbase-repertoire-training-transpositions-not-merging"
[8]: https://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf?utm_source=chatgpt.com "The Power of Testing Memory"
[9]: https://www.researchgate.net/publication/332863064_Thought_and_choice_in_chess?utm_source=chatgpt.com "Thought and choice in chess - ResearchGate"
[10]: https://pubmed.ncbi.nlm.nih.gov/9709441/?utm_source=chatgpt.com "Expert chess memory: revisiting the chunking hypothesis"
[11]: https://lichess.org/%40/CheckRaiseMate/blog/how-to-learn-an-opening-in-2023-part-2/X3mIfzpD "https://lichess.org/%40/CheckRaiseMate/blog/how-to-learn-an-opening-in-2023-part-2/X3mIfzpD"
[12]: https://lichess.org/forum/community-blog-discussions/ublog-PIQoYchZ "https://lichess.org/forum/community-blog-discussions/ublog-PIQoYchZ"
[13]: https://www.chess.com/blog/Chessable/pro-week-is-back "https://www.chess.com/blog/Chessable/pro-week-is-back"
[14]: https://support.chess.com/en/articles/10319078-how-do-i-manage-my-course-settings "https://support.chess.com/en/articles/10319078-how-do-i-manage-my-course-settings"
[15]: https://en.wikipedia.org/wiki/Method_of_loci "https://en.wikipedia.org/wiki/Method_of_loci"
[16]: https://nextlevelchess.com/remember/ "https://nextlevelchess.com/remember/"
[17]: https://www.treevis.org/ "https://www.treevis.org/"
[18]: https://support.chessable.com/en/articles/9043243-what-is-the-schedule-setting "https://support.chessable.com/en/articles/9043243-what-is-the-schedule-setting"
[19]: https://www.chessreps.com/ "https://www.chessreps.com/"
