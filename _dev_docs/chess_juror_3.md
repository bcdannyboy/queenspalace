## Evidence base to anchor the design

1. **Spacing beats massing (including skills/sequences).** Spaced training produces more robust memory than massed training, and this advantage generalizes beyond “facts” to **skill/motor learning** as well. ([PMC][1])
2. **Optimal spacing depends on the “test delay.”** In a large spacing study, the *optimal* inter-study gap increased as the final test delay increased; expressed as a fraction of the test delay, the optimal gap got smaller as the test delay grew (roughly ~20–40% of a 1‑week test delay vs ~5–10% of a 1‑year test delay). ([Learning Attention and Perception Lab][2])
3. **Retrieval practice (testing) is a learning event.** Classroom experiments show that quizzing improved later exam performance relative to not being quizzed or even extra re-exposure; retrieval practice “boost[s] academic performance.” ([PDF Retrieval Practice][3])
4. **Interleaving supports discrimination and transfer (relevant to opening branches).** Interleaving forces learners to *choose* the right strategy based on the problem, not just execute; it improves delayed test performance and strengthens problem→strategy links. ([Gwern][4])
5. **Interleaving also helps sequence learning/transfer (procedural-ish).** Interleaved practice can produce better retention and transfer than blocked practice in sequence learning, consistent with contextual-interference “desirable difficulty.” ([PMC][5])

These results push the product toward: **(a) retrieval-first prompts**, **(b) spaced scheduling with a controllable retention target**, and **(c) intentional interleaving/contrast for similar items and branches**, even if it feels harder in-session.

---

## Recommendation: Primary scheduling approach

### Approach A (recommended): **FSRS-style memory-state scheduler + retrieval-first item design**

Use a **per-item memory state** (Difficulty + Stability, and computed Retrievability) and schedule the next review to hit a **target probability of recall**. This is the core FSRS idea: an interval is “optimal” if it corresponds to the desired recall probability. ([GitHub][6])

Why FSRS-like for this app:

* Works well across **heterogeneous items** because each item has its own difficulty/stability (“memory state”). ([Anki FAQs][7])
* Lets you expose one knob to users/designers: **desired retention**, trading workload vs forgetting. ([Anki FAQs][7])
* The FSRS ecosystem shows this approach is used in practice and tuned via optimization to user history (machine learning fitting). ([GitHub][8])

### Approach B (alternative): **SM-2 / Anki-style ease-factor scheduler**

SM‑2 is the classic approach: items have an “easiness factor” (EF), intervals expand multiplicatively, EF updates from a 0–5 response quality, and lapses reset repetitions. ([super-memory.com][9])
This is simpler to ship, but is generally less adaptive than a per-item memory-state model with a target retention knob.

---

## 1) What is the “unit” of spaced repetition in this chess app?

### Principle: make the SRS “unit” = the *smallest retrieval target that is stable and unambiguous*

SM‑2 itself emphasized splitting knowledge into the “smallest possible items.” ([super-memory.com][9])
But chess openings and encodings are *structured*, so we need multiple units, layered.

### Proposed unit taxonomy (with how each is prompted)

#### A. Atomic associative units

1. **Square → image** (and optionally image → square as a separate direction)

   * Prompt: “e4” → recall the locus image (free recall, then reveal).
   * Reverse prompt prevents one-way mastery.

2. **Piece-on-square → composite image / mnemonic**

   * Prompt: show square + piece icon (or “N@f3”) → recall the composite/action image.
   * Keep it atomic: one piece + one square.

Why separate these from openings? Because they are foundational and reused everywhere; your scheduler should protect them with higher retention targets and stricter speed thresholds.

#### B. State→action units (core for chess moves/openings)

3. **Single move decision**: *(Position prompt → correct move encoding)*

   * Prompt: board/FEN with side to move → user must produce **SAN** (or drag a piece).
   * This is exactly “choose strategy from the problem” rather than being cued by a line order—aligned with interleaving/discrimination benefits. ([Gwern][4])

4. **Branch decision node**: *(Position prompt → choose among plausible candidates)*

   * Prompt: position + “opponent just played …” → choose the correct response from **2–4 close distractors**.
   * This is your primary anti-interference tool.

#### C. Chunk/sequence units (for fluency + order)

5. **Multi-move chunk (N plies)**

   * Prompt: starting position (or midline position) → enter the next N plies.
   * These items train *serial retrieval* and “flow” through a line. Interleaving research on sequence learning suggests interleaving and contextual interference can improve retention/transfer. ([PMC][5])

**Key design call:** make **(3) position→move nodes** the *canonical* SRS unit for openings, because it naturally supports branching and transpositions. Then use **(5) chunks** as a secondary layer for speed/fluency (not as the only representation).

#### Practical note from SM‑2 about “hinting”

Wozniak noted retention can look “artificially high” when items appear in grouped contexts because preceding items cue the answer. ([super-memory.com][9])
So: don’t schedule opening lines as a fixed linear script; schedule **nodes** and interleave them across lines/openings.

---

## 2) How do we grade recall?

### Default: 4-button scale (Again / Hard / Good / Easy)

This matches common SRS UX (Anki uses 4 choices), and FSRS models grades 1–4. ([Anki FAQs][7])

**Mapping (recommended)**

* **Again (1):** incorrect; or correct only after hint/reveal; or wrong move family.
* **Hard (2):** correct but slow, hesitant, or minor format errors (e.g., SAN punctuation); or chunk correct but shaky.
* **Good (3):** correct with normal latency; acceptable confidence.
* **Easy (4):** correct and fast; “automatic.”

**Pass/Fail mode (optional)**
For “minimal friction,” allow pass/fail and map **Pass→Good** and **Fail→Again** (this mapping is used in practice for FSRS/Anki contexts). ([GitHub][8])

### Use time-to-answer as a *graded signal*, not the scheduler’s only truth

* Time is especially meaningful for **square→image** and **openings** (you want instant recall under pressure).
* Convert time into grade:

  * correct & >T_slow → Hard
  * correct & between thresholds → Good
  * correct & <T_fast → Easy

### Partial credit rules (must be type-specific)

* **Single move (FEN→SAN):**

  * If move is correct but SAN formatting slightly off → cap at **Hard**.
  * If correct piece + destination but illegal due to capture/check nuance → **Again** (but log error type).
* **Chunk (N plies):**

  * Score by *longest correct prefix* + whether a wrong branch was chosen.
  * Suggested grade mapping:

    * ≥ 100% correct: Good/Easy (time-based split)
    * 70–99% correct: Hard
    * < 70% correct or wrong branch: Again

---

## 3) How should scheduling differ by level?

### Two phases: acquisition vs retention (don’t confuse them)

Anki explicitly distinguishes a **learning stage** (short steps, no long-term punishment) from the **retention stage**, noting that performance during learning doesn’t reflect retaining-stage performance. ([Anki FAQs][7])

#### Phase 1: Early acquisition (minutes→days)

Use short “learning steps” before an item becomes a long-interval review:

* Example steps (tunable per item type):

  * 0m (immediate retry), 10m, 1d, 3d → graduate into FSRS schedule

For chess move nodes, this prevents “I saw it once yesterday” from immediately becoming a week-long interval.

#### Phase 2: Long-term retention (weeks→years)

Schedule using FSRS-style intervals with a **desired retention target**. FSRS defines “optimal interval” as the one corresponding to the desired probability of recall. ([GitHub][6])

**Retention targets by user level (and item type)**

* **Beginner**

  * Square/image: 0.95
  * Piece-square: 0.92–0.95
  * Opening nodes: 0.90
  * Chunks: 0.85–0.90
* **Intermediate**

  * Square/image: 0.93
  * Opening nodes: 0.85–0.90
  * Chunks: 0.80–0.85
* **Advanced**

  * Square/image: 0.90–0.93 (still high)
  * Opening nodes: 0.80–0.85
  * Chunks: 0.75–0.80

Why lower targets for higher levels? Workload control: higher retention means more daily reviews; FSRS explicitly frames desired retention as a workload/forgetting tradeoff. ([Anki FAQs][7])

### Interleaving rules by level

* Beginners: interleave within a controlled subset (avoid total chaos).
* Intermediate+: stronger interleaving across openings/branches (more contextual interference) to improve transfer and discrimination. ([PMC][5])

---

## 4) How to model and reduce interference?

Interference is where chess differs from vocab: many items are *near neighbors* (similar squares, similar branches, transpositions).

### Model interference as “confusability”

Maintain a graph where edges represent “likely confusion”:

* Squares: adjacency + symmetry (e4 vs e5; mirrored files), plus user error logs.
* Piece-square: overlaps in square + piece; e.g., knight motifs.
* Opening nodes: same pawn structure, same piece placement, transposition-equivalent FENs.

Update edge weights from actual mistakes (what did they answer instead?).

### Reduce interference via **contrastive retrieval** + interleaving

Interleaving helps because it forces strategy selection and improves discrimination/problem→strategy links. ([Gwern][4])
It also helps in sequence learning and transfer (contextual interference). ([PMC][5])

Concrete review mix tactics:

1. **Discrimination sets (micro-quizzes)**

   * After an error on node A, immediately schedule a *set* of 2–4 confusable nodes (A plus top confusers) interleaved.
   * Goal: “why is this one …c5 and not …e5?”

2. **Anti-serial scheduling**

   * Don’t show consecutive moves from the same line in order; SM‑2 warns that page-like sequencing can “hint” the next item and inflate retention. ([super-memory.com][9])

3. **Branch decision items as interference vaccines**

   * Regularly schedule “choose between candidates” at high-confusion nodes (even if the node’s recall card is mature).

---

## 5) Detecting “good faith mastery” (not just pattern-following)

You want to detect mastery that survives:

* longer gaps,
* different cues,
* and randomized prompts.

Mechanisms:

1. **Stability-based mastery threshold**

   * If a node’s Stability (S) is high and the user succeeds when Retrievability (R) is low (overdue), that’s stronger evidence than repeated short-gap success. FSRS explicitly models R as probability of recall and S as the time for R to drop from 100% to 90%. ([Anki FAQs][7])

2. **Prompt randomization + cue variation**

   * For openings: prompt from transposed positions, or from midline positions, not always from the starting move order.
   * For square/image: sometimes show square text, sometimes highlight square on board, sometimes show the locus image and ask square.

3. **“Audit reviews”**

   * Periodically sample mature items out of order, with no warm-up, to avoid within-session cueing (again aligned with SM‑2’s hint warning). ([super-memory.com][9])

---

## Scheduling engine details

### State tracked per item

For FSRS-style scheduling, each item stores:

* `S` (stability, days)
* `D` (difficulty, 1–10)
* `t_last` (last review timestamp)
* `due` (next due timestamp)
* `lapses` (count)
* `history`: grades, response times, error tags, confusions

FSRS conceptually treats (R,S,D) as the “memory state,” with R changing over time and D,S updating on review. ([Anki FAQs][7])

---

## Approach A: FSRS-style formulas + pseudocode

Below are the **core formulas** you can implement directly (and later replace parameters with a learned/optimized set).

### Forgetting curve and interval from target retention

A documented FSRS formulation uses:

* **Retrievability** (probability of recall after `t` days):

  * ( R(t,S) ) is defined so that ( R(S,S) = 0.9 ) (S is the time to drop to 90%). ([GitHub][10])

* **Next interval** for desired retention ( r ):

  * ( I(r,S) = 9 \cdot S \cdot \left(\frac{1}{r} - 1\right) )
  * and ( I(0.9,S)=S ). ([GitHub][10])

This is great for product design because it makes desired retention an explicit knob.

### Updating difficulty after a review

FSRS v4 documents:

* Initial difficulty after first rating:

  * ( D_0(G) = w_4 - (G-3)\cdot w_5 ) ([GitHub][10])
* Mean-reverting difficulty update:

  * ( D'(D,G)= w_7\cdot D_0(3) + (1-w_7)\cdot (D - w_6\cdot (G-3)) ) ([GitHub][10])

### Updating stability after success vs lapse

* After a **successful review** (Hard/Good/Easy), FSRS gives:

  * ( S'*r(D,S,R,G) = S \cdot \Big(e^{w_8}\cdot(11-D)\cdot S^{-w_9}\cdot(e^{w*{10}(1-R)}-1)\cdot [w_{15}\text{ if }G=2]\cdot [w_{16}\text{ if }G=4] + 1\Big)) ([GitHub][10])

* After **forgetting** (Again), FSRS gives a post‑lapse stability:

  * ( S'*f(D,S,R)= w*{11}\cdot D^{-w_{12}}\cdot((S+1)^{w_{13}}-1)\cdot e^{w_{14}(1-R)} ) ([GitHub][10])

### Optional: same-day review stability update

FSRS-6 explicitly adds a same-day stability update (useful if you treat relearning steps as real updates):

* ( S'(S,G)= S\cdot e^{w_{17}(G-3+w_{18})}\cdot S^{-w_{19}} ) ([GitHub][10])

### FSRS-style pseudocode (implementation sketch)

```pseudo
enum Grade { AGAIN=1, HARD=2, GOOD=3, EASY=4 }

struct ItemState {
  float S      # stability (days)
  float D      # difficulty (1..10)
  datetime last
  datetime due
  int lapses
  bool is_learning
  int learning_step_index
}

function interval_from_retention(S, r):
  return 9 * S * (1/r - 1)     # FSRS v4 formula

function update_D(D, grade, params):
  # FSRS v4 difficulty update (mean reversion)
  D0_good = params.w4          # because D0(G)=w4-(G-3)*w5
  D0 = params.w4 - (grade-3)*params.w5
  D_new = params.w7*D0_good + (1-params.w7) * (D - params.w6*(grade-3))
  return clamp(D_new, 1, 10)

function update_S_success(S, D, R, grade, params):
  mult = exp(params.w8) * (11-D) * pow(S, -params.w9) * (exp(params.w10*(1-R)) - 1)
  if grade == HARD: mult *= params.w15
  if grade == EASY: mult *= params.w16
  return S * (mult + 1)

function update_S_lapse(S, D, R, params):
  return params.w11 * pow(D, -params.w12) * (pow(S+1, params.w13) - 1) * exp(params.w14*(1-R))

function schedule_review(item, now, desired_retention_r):
  t = days_between(item.last, now)
  R = retrievability(t, item.S)          # per chosen forgetting curve
  if item.is_learning:
     # run learning steps; don't over-penalize early failures
     # (Anki-style: learning failures shouldn't permanently tank ease)
     ...
  else:
     item.D = update_D(item.D, grade, params)
     if grade == AGAIN:
        item.lapses += 1
        item.S = update_S_lapse(item.S, item.D, R, params)
        send_to_relearning_steps(item)
     else:
        item.S = update_S_success(item.S, item.D, R, grade, params)
        I = interval_from_retention(item.S, desired_retention_r)
        item.due = now + days(I)

  item.last = now
```

### How to set/learn FSRS parameters

FSRS implementations commonly **fit parameters to review history via optimization/machine learning**, rather than hand-tuning. ([GitHub][8])

Product plan:

* Start with a reasonable default parameter set (ship quickly).
* Once a user has enough reviews, re-fit parameters per user **and per item family** (square/image vs opening nodes) because their difficulty dynamics differ.

---

## Lapses: reset vs partial reduction

You should support both policies because they serve different goals.

### Policy 1 (recommended default): **Partial reduction + relearning**

* On lapse (Again):

  * Move item into **relearning steps** (e.g., 10m, 1d).
  * Update memory state: **stability drops, difficulty rises** (this is also how FSRS/Anki describes Again behavior under FSRS). ([Anki FAQs][7])
  * After relearning, return to long-term scheduling using updated S/D.

This avoids “full reset punishment” for a single miss months later, which is common in chess openings (one branch slip shouldn’t erase the entire node’s history).

### Policy 2 (optional “strict”): **Reset interval**

* SM‑2 resets repetitions if response quality < 3 (“start repetitions… from the beginning”). ([super-memory.com][9])
* Anki’s SM‑2-derived scheduler resets by default but can reduce instead. ([Anki FAQs][7])

Offer this as a user setting for people who want near-perfect opening recall.

---

## Analytics you should build (to make the engine inspectable)

### 1) Retention + calibration

* **Predicted recall probability** ( R ) vs **observed recall** (binned by R)

  * Shows whether the model is well calibrated.
* **Per-type retention curves** (square/image vs opening nodes vs chunks).

### 2) Forgetting risk dashboard

* For each deck/type:

  * `Risk = 1 - R(now)` aggregated across items (mean/median/max).
* Sort queue by highest risk when daily caps force triage.

### 3) Workload forecasting

* With desired retention ( r ) as a knob, forecast:

  * expected reviews/day over next 7/30 days
  * backlog size if user skips a day

FSRS explicitly frames desired retention as controlling review volume: higher retention → more reviews/day. ([GitHub][6])

### 4) Interference analytics

* Confusion matrix: “item A was answered as B”
* Identify top confusion clusters (opening transpositions; similar squares)
* Show “interference hotspots” to recommend contrast drills.

### 5) “Good faith mastery” score

Composite score combining:

* high stability S,
* repeated success when R was low (long gaps),
* success across varied prompts (randomized position, different cue mode),
* low confusion-rate with neighbors.

---

## Queue sizing + daily workload caps

### Daily caps are non-negotiable in consumer products

Implement:

* `max_reviews_per_day` (hard cap)
* `max_minutes_per_day` (soft cap; estimate time/item by type)
* `max_new_items_per_day`

### Prioritization under a cap

Use a priority score:

* `priority = type_weight * (1 - R(now)) + interference_bonus + overdue_bonus`

  * `type_weight` might be higher for square/image (foundational)
  * `interference_bonus` if item is in a confusion cluster
  * `overdue_bonus` if item is significantly past due

---

## UX implications and user controls

### Default daily session design

* 10–20 minutes/day feels sustainable for most.
* Session mix: ~70% due reviews, ~20% relearning/lapse cleanup, ~10% new items.

### Controls (simple but powerful)

1. **Desired retention slider** (global + per category)

   * FSRS-based systems explicitly support desired retention as the main tuning knob. ([Anki FAQs][7])
2. **New items/day**
3. **Strictness on lapses** (reset vs reduce)
4. **“Interference training” toggle** (more contrast sets; harder sessions)
5. **Speed focus toggle** (tight time thresholds → fewer “Easy”s)

### Transparency UI (build trust)

* Show “due today,” “due tomorrow,” and “risk level”
* After a miss, show *why* it was missed (confusable with X), then immediately run a contrast set.

---

## Product alignment: chess opening trainers already use SRS, but your edge is *memory-science-informed structure*

Existing chess tools describe using spaced repetition for opening training and repertoire memorization. ([Chess Tempo][11])
Your differentiator should be:

* rigorous **node-based** units + **contrastive retrieval** to handle interference,
* memory-palace primitives (square/piece encodings) scheduled with higher retention,
* and FSRS-style retention targeting + calibration analytics.

---

## Bibliography (links via citations)

* Wozniak, P. “SuperMemo 2: Algorithm (SM‑2)” (original EF + interval formulas; warns about hinting). ([super-memory.com][9])
* Anki FAQs: “What spaced repetition algorithm does Anki use?” (SM‑2 variants; learning vs retaining; 4 buttons; reset vs reduce; FSRS overview). ([Anki FAQs][7])
* FSRS4Anki Wiki: “ABC of FSRS” (optimal interval as target recall probability; D/S/R; desired retention; optimization scale claims). ([GitHub][6])
* FSRS4Anki Wiki: “The Algorithm” (FSRS formulas incl. post‑lapse stability, interval from retention, same-day update). ([GitHub][10])
* FSRS4Anki GitHub README (scheduler + optimizer; ML fitting; references to papers). ([GitHub][8])
* Smolen, Zhang & Byrne (2016) “The right time to learn: mechanisms and optimization of spaced learning” (review: spacing benefits across facts + skills). ([PMC][1])
* Cepeda et al. (2008) “Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention” (optimal gap depends on test delay). ([Learning Attention and Perception Lab][2])
* Roediger et al. (2011) “Test-Enhanced Learning in the Classroom” (quizzing improves long-term performance). ([PDF Retrieval Practice][3])
* Rohrer et al. (2014) “Benefit of interleaved mathematics practice…” (interleaving improves delayed performance; strategy selection/discrimination). ([Gwern][4])
* Schorn & Knowlton (2021) “Interleaved practice benefits implicit sequence learning and transfer” (contextual interference; sequence retention/transfer). ([PMC][5])
* ChessTempo Opening Training (spaced repetition for opening repertoire training). ([Chess Tempo][11])
* Listudy (spaced repetition for chess training, incl. openings). ([Listudy][12])
* Chessbook (opening repertoire trainer; “train with spaced repetition”). ([Google Play][13])
* Chess Prep Pro “Smart Train” announcement (spaced repetition for openings; scheduling based on performance). ([Chess Prep][14])

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5126970/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC5126970/"
[2]: https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf "https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf"
[3]: https://pdf.retrievalpractice.org/guide/Roediger_Agarwal_etal_2011_JEPA.pdf "https://pdf.retrievalpractice.org/guide/Roediger_Agarwal_etal_2011_JEPA.pdf"
[4]: https://gwern.net/doc/psychology/spaced-repetition/2014-rohrer.pdf "https://gwern.net/doc/psychology/spaced-repetition/2014-rohrer.pdf"
[5]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8476370/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC8476370/"
[6]: https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs "https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs"
[7]: https://faqs.ankiweb.net/what-spaced-repetition-algorithm "https://faqs.ankiweb.net/what-spaced-repetition-algorithm"
[8]: https://github.com/open-spaced-repetition/fsrs4anki "https://github.com/open-spaced-repetition/fsrs4anki"
[9]: https://super-memory.com/english/ol/sm2.htm "https://super-memory.com/english/ol/sm2.htm"
[10]: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm "The Algorithm · open-spaced-repetition/fsrs4anki Wiki · GitHub"
[11]: https://chesstempo.com/opening-training/ "https://chesstempo.com/opening-training/"
[12]: https://listudy.org/en "https://listudy.org/en"
[13]: https://play.google.com/store/apps/details?hl=en_US&id=com.chessbook.android "https://play.google.com/store/apps/details?hl=en_US&id=com.chessbook.android"
[14]: https://chesspreppro.com/blog/introducing-smart-train-science-backed-spaced-repetition-for-chess-openings/ "https://chesspreppro.com/blog/introducing-smart-train-science-backed-spaced-repetition-for-chess-openings/"
