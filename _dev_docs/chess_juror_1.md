## Research distillation: what actually makes mnemonic systems “stick”

**Method of Loci (Memory Palace) fundamentals**

* Core loop: pick a **space with distinct locations**, create **vivid/unusual images**, and **link** each item to a location; recall by mentally walking the route. ([PMC][1])
* The technique is especially strong for **ordered/serial recall** (i.e., sequences), which maps well to opening move-orders. ([PMC][1])
* High performers (“superior memorizers”) commonly use **spatial-learning / loci-based strategies** and recruit brain regions important for spatial memory. ([sites.uni.edu][2])
* Mnemonic training can measurably alter brain-network connectivity (supporting the “trainable skill” framing for your app). ([ChessBase][3])

**PAO and sequence packing**

* PAO systems work by chunking information into **Person–Action–Object** composites and placing them at loci; this is a standard way memory competitors compress many symbols into fewer locations. ([Art of Memory][4])
* “Progressive elaboration” + loci supports remembering **order within and between** loci (useful when you store *two plies* in one locus: White move then Black move). ([ScienceDirect][5])

**Interference control (this is the #1 risk for chess mnemonics)**

* Good retrieval cues must be **constructible, consistent, strongly associated, and distinctive**; when one cue points to many targets (“**cue overload**”), recall gets slower and less accurate (fan effect). ([PMC][6])
* Translation for chess: if many squares/pieces/moves “feel similar,” users will swap them unless you enforce a discriminable visual grammar. ([PMC][6])

**Imagery, distinctiveness, and emotion—useful but must be disciplined**

* Dual Coding theory: memory benefits when material is represented with **verbal + imagery codes** (e.g., “e4” + a stable mental image). ([Stanford Encyclopedia of Philosophy][7])
* Distinctive items are recalled better than non-distinct items (isolation/von Restorff effects). ([PubMed][8])
* Emotion/arousal can improve memory, but it often produces **“focal” enhancements**—stronger memory for central details and weaker memory for peripheral/background details. Design implication: attach “emotion” to the *coordinate/piece/move token itself*, not to unrelated scenery. ([PMC][9])

**Mastery measurement: retrieval + spacing**

* Distributed (spaced) practice robustly improves retention across many verbal-learning tasks relative to massed practice, with retention depending on the spacing interval. ([Augmenting Cognition][10])
* Repeated retrieval (testing) produces large long-term learning benefits vs. additional studying once recall is possible. ([PubMed][11])
* An SRS-style scheduler (e.g., SM-2’s “quality of response” driving interval growth) gives a practical blueprint for “mastery gating.” ([Super Memory][12])

**Chess-specific: why you must transition from “encoding everything” to “chunking tabiyas”**

* Classic chess cognition work shows experts perceive/remember meaningful piece constellations better than novices (knowledge-driven structures). ([ScienceDirect][13])
* Therefore, your ladder should end by converting move-by-move mnemonics into **position chunks** (“tabiyas,” pawn structures, typical piece placements) so transpositions don’t multiply workload. ([ResearchGate][14])

---

## Recommended approach: a “visual grammar” that scales from squares → pieces → moves → opening trees

### Design principle: keep roles consistent

To minimize interference, enforce a **strict grammar** so the brain never has to guess what a component means:

* **Squares = Places/Props** (never people).
* **Pieces = Characters/Actors** (always animate).
* **Move semantics = Action + special-effects layer** (capture/check/mate/promo/castle).
* **Sequence order = Journey order** (memory palace route order). ([PMC][1])

This directly implements “distinct, discriminable cues” and avoids cue overload by giving each cue a single job. ([PMC][6])

---

## Key design questions answered (with rationale)

### 1) Cleanest encoding scheme for 64 squares with minimal interference

**Recommendation: Option C (coordinate pegs) + Option A (board as loci) hybrid.**

* **Why not pure Option A (each square is just a locus on a bare board)?**
  A chessboard is highly regular/symmetric; loci are not naturally distinct, increasing swaps (cue overload risk). ([PMC][6])

* **Why not pure Option B (map squares to a separate house route)?**
  Distinct loci are great for memory palaces, but translating “square → locus in my kitchen” adds a decoding step that fights the chess goal (fast board-vision). ([Art of Memory][15])

* **Hybrid win:**
  Use the board as the spatial schema (fast chess mapping), but make each square *distinct* by generating its imagery from a **two-part peg** (file peg + rank peg). This reduces learning burden and interference because users only master 16 pegs (8+8) and then “compose” 64 squares. The compositionality also improves cue-target match and discriminability. ([PMC][6])

**Concrete square system (family-friendly, low-confusion)**

* **Files a–h = 8 “File Objects”** (Category A: *always animals*)
  a Ant, b Bear, c Cat, d Dog, e Elephant, f Fox, g Gorilla, h Hippo
* **Ranks 1–8 = 8 “Rank Props”** (Category B: *always household objects*, vertically intuitive)
  1 Doormat (floor), 2 Shoe, 3 Table, 4 Chair, 5 Bed, 6 Sink, 7 Bookshelf (high), 8 Chandelier (top)

**Square image rule:** *Animal interacts with Prop*.
Example: **e4 = Elephant sitting on a Chair**.
This is dual-coded (verbal coordinate + image), with consistent categories reducing swaps. ([Stanford Encyclopedia of Philosophy][7])

**Extra anti-confusion overlays (optional but powerful)**

* **Square color overlay:** light squares have a “sun-glow,” dark squares have a “moon-shadow.”
* **Quadrant tint:** a–d vs e–h gets subtle background hue.
  These add discriminable features without increasing item count, helping prevent near-neighbor swaps. ([PMC][6])

---

### 2) How should we represent pieces?

**Recommendation: type + color (12 identities) with a “single-character-per-type” design.**

* Chess requires encoding *both sides* reliably in openings; type-only invites errors (“my bishop moved” vs “their bishop moved”).
* Color is best encoded as a **systematic modifier** rather than doubling the whole cast:

  * White pieces: “glow/halo,” clean costume
  * Black pieces: “shadow/smoke,” dark costume
    This preserves distinctiveness while controlling cue overload. ([PMC][6])

**Piece cast (family-friendly defaults)**

* King = **King** (crown, heavy robe)
* Queen = **Queen** (crown + staff)
* Rook = **Robot** (boxy silhouette)
* Bishop = **Wizard** (diagonal “magic beam” motif)
* Knight = **Ninja** (jump/leap motif)
* Pawn = **Hiker** (backpack; “step forward” motif)

**Disambiguation tags (needed later for SAN-like ambiguity)**
When two pieces of same type could go to the same square (e.g., Nbd2), add a small **file badge** to the actor (e.g., a tiny “b” on the Ninja’s belt). This keeps the system expandable without exploding the cast to 768 images (a common concern raised by chess mnemonics discussions). ([United States Chess Federation][16])

---

### 3) How should we represent a move?

**Recommendation: PAO-inspired “Actor–Verb–Target” with a special-effects layer.**

A single move scene encodes:

* **Actor (Person):** moving piece (type+color)
* **Verb (Action):** move type (quiet/capture/check/mate/promo/castle/en passant)
* **Target (Object):** destination square image (Level 1 composite)
  This mirrors PAO’s chunking into a compact scene that’s easy to place in loci. ([Art of Memory][4])

**Critical choice: do you encode the from-square explicitly?**

* For *in-position “next move” training*, you can omit from-square because the board position disambiguates.
* But your Level 3 spec explicitly wants “Knight on f4 captures …,” so you should **support explicit from-square encoding**.

**Best compromise for Level 3:**
Encode **from-square as the “stage”** (the scene begins on the from-square prop), and **to-square as the target prop** that the actor reaches/lands on.

#### Special moves and annotations (visual grammar)

* **Capture (x):** actor destroys/steals the *victim piece* sitting on the destination prop. (Use slapstick “poof” or “confetti explosion” for family-friendly mode.)
* **Check (+):** add a “police siren” spotlight pointing at the enemy King.
* **Mate (#):** enemy King in a “glass box / cage” + siren.
* **Promotion (=Q/R/B/N):** pawn “metamorphoses” into the promoted piece on the 8th/1st rank (cocoon → new character appears).
* **Castling (O-O / O-O-O):** King rides a “rook-robot vehicle” to the correct side; big vs small castle-gate distinguishes queenside vs kingside.
* **En passant:** “ghost pawn” (transparent) gets grabbed from beside the landing square—make it *weird-but-clean* so it stands out.
  These are “distinct effects” attached to central move tokens, leveraging distinctiveness without requiring graphic content. ([PubMed][8])

---

### 4) Multi-move sequences, branching variations, and transpositions

**Level 4 recommendation: one locus per full move (White+Black), not per ply.**

* Pros: halves the journey length; aligns with how openings are usually spoken (“move 6, both sides”).
* To preserve order within the locus, use **two sub-spots** at the locus: left = White, right = Black (or near/far).
* This is consistent with evidence that loci + elaboration can preserve ordering within/between loci. ([ScienceDirect][5])

**Branching variations**

* At the decision locus, place a **signpost** or “door” with 2–4 labeled icons, each leading to a **mini-route** (sub-palace) for that variation.
* Important: don’t stack too many variations on one locus; that’s classic cue overload. ([PMC][6])

**Transpositions**

* Model the opening as a graph, but memorize as:

  1. **Move-order route(s)** for early forcing lines, and
  2. **Tabiya anchors** (key resulting positions) as convergence points.
* Since chess expertise relies on stored patterns/chunks/templates, teaching users to recognize and anchor tabiyas is how you prevent “transposition blow-up.” ([ResearchGate][14])

---

### 5) Teaching vivid scenes without graphic/sexual content

Use “**safe vividness**”:

* **Absurdity, motion, surprise, scale, sound** (sirens, confetti, cartoon physics).
* Avoid gore/sexuality; you can still get distinctiveness via *weirdness* and *humor*. Distinctiveness is what matters for recall. ([PubMed][8])
* Because emotion can narrow memory to central items, put the “punch” on the coordinate/piece interaction (the cue), not the background. ([PMC][9])

**App modes**

* **Family-friendly:** slapstick, confetti, cartoon “bonk,” no injury detail.
* **Neutral:** clean geometric effects (glow, magnet pull, stamp marks).
* **Absurd:** surreal physics (elephant on chandelier), but still clean.
* **Mature (non-graphic):** higher intensity, but no gore/sex (e.g., “laser tag,” “prison cell,” “eviction notice”).

---

# Concrete Level-by-Level Encoding Ladder (up to opening mastery)

## Level 1 — Squares: “8×8 Peg Grid”

**Goal:** instantly convert any square ↔ image, with minimal interference.

**Encoding**

* Learn 8 file animals + 8 rank props.
* Square = animal × prop interaction (place-like).

**Mastery definition (suggested)**

* ≥95% accuracy converting random square↔image, median response ≤2.0s.

**Why this works**

* Strong cue discriminability (two orthogonal features). ([PMC][6])
* Dual coding (coordinate label + image). ([Stanford Encyclopedia of Philosophy][7])

---

## Level 2 — Pieces on squares: “Actor on Prop”

**Goal:** instantly encode/decode “(color, piece type) on square.”

**Encoding**

* Piece = character (12 with color overlay).
* Place piece-character interacting with the square prop-image.

**Mastery definition**

* Given a position with 8–12 pieces: identify all piece-square bindings ≥90% accurate.
* Given an image scene: reconstruct piece + square.

**Anti-interference tip**

* Keep **one actor** per piece; don’t encode squares as people or you’ll confuse “who is the actor?” (cue role conflict). ([PMC][6])

---

## Level 3 — Single-move actions: “Actor–Verb–Target (+FX)”

**Goal:** encode/decode individual moves including captures/check/etc.

**Encoding template**

* **From-stage:** from-square prop beneath actor.
* **Actor:** moving piece-character.
* **Target:** destination square prop in front.
* **Verb:** movement style (leap/slide/step) + rule marker.
* **FX layer:** capture/check/mate/promo/castle/ep.

**Mastery definition**

* Decode scene → move with ≥90% accuracy.
* Encode SAN/coordinate move → scene in ≤5 seconds (then train down).

**Why this works**

* PAO-style chunking is proven for compressing structured symbols into loci. ([Art of Memory][4])

---

## Level 4 — Opening main lines: “One locus per full move”

**Goal:** memorize 8–20 plies as a stable ordered sequence.

**Encoding**

* Choose a short route (10–15 loci). Use the same order every time. ([Art of Memory][15])
* Each locus stores **one full move** (White scene on left, Black scene on right).
* Put a giant **opening mascot** at locus 0 (context marker) to prevent opening-to-opening interference. ([PMC][6])

**Mastery definition**

* Can “play through” the line correctly from start (≥95%).
* Can resume from a random mid-position (≥85% initially, trending up).

**Review rule**

* Immediate retrieval practice beats re-reading; schedule spaced review. ([PubMed][11])

---

## Level 5 — Variations: “Branch Doors”

**Goal:** memorize deviations without mixing them.

**Encoding**

* At the branching move locus, place 2–4 **doors/signs** (“If 3…Nf6 → Door A”, “If 3…d5 → Door B”).
* Each door leads to a **mini-route** (3–8 loci) dedicated to that variation.

**Mastery definition**

* Given opponent’s choice at branch point, user reliably recalls the correct continuation ≥90%.

**Anti-overload rule**

* Do not store more than ~4 alternatives at one door; split into sub-branches. (Cue overload risk.) ([PMC][6])

---

## Level 6 — Transpositions: “Tabiya Anchors + Portals”

**Goal:** stop memorizing duplicate move orders that reach the same position.

**Encoding**

* Define **tabiya nodes** (key positions the opening often reaches).
* Create a single “tabiya locus” with:

  * pawn-structure “landscape,”
  * major piece placements as characters in stable positions,
  * a label icon for the opening family.
* When a different move order reaches the same tabiya, use a **portal image** (e.g., a “wormhole” sign) that jumps the learner to the same tabiya locus.

**Why this is the right endgame**

* Chess expertise depends on stored chunks/templates; tabiyas are exactly the “chunk targets” for opening study. ([ScienceDirect][13])

---

## Level 7 — Opening mastery: “Fade the crutch, keep the chunk”

**Goal:** fast, chess-useful recall without mentally “walking a palace” mid-game.

**Process**

* Shift drills from “recall the mnemonic” to “play the move from the position.”
* Keep mnemonics as a *backup* for weak nodes only.

**Why**

* Community discussions correctly warn that full palace-travel is too slow for blitz/bullet; your app should explicitly transition users from mnemonics → pattern fluency. ([Art of Memory Forum][17])

---

# Two alternative encoding architectures (with pros/cons)

## Alternative 1 — 64 fixed square images (pure Option A)

**How it works**

* Memorize 64 unique images (one per square). Board itself is the palace.
* Pieces are modifiers; moves are actor interactions between square images.

**Pros**

* Fast decoding once learned (no “composition step”).
* Works well for users who already have robust 00–99 or custom image libraries (memory-athlete style). ([Art of Memory][4])

**Cons**

* Higher upfront load (64 items instead of 16 pegs).
* Higher interference risk unless images are extremely discriminable (cue overload pressure on “similar squares”). ([PMC][6])

**Best for**

* Advanced mnemonists / competitive memorizers.

---

## Alternative 2 — “Move-code” (Major/phonetic) compression (inspired by Picture Notation)

**How it works**

* Encode moves into compact phonetic/major-system words (often a single word per move).
* Place words as images along loci (opening route). ([Art of Memory Forum][17])

**Pros**

* Extremely compact; good for very long lines.
* Potentially fast for experts who already automate major-system decoding.

**Cons**

* High cognitive overhead for chess learners (you’re learning chess *and* a dense code).
* Error correction can be hard: if one syllable is misheard/misremembered, the move may shift completely.
* Less “board-native” than square/actor/target imagery.

**Best for**

* Users already fluent in major system / competitive memory techniques.

---

# Sample mappings (demo)

## Sample square peg set (Animal × Prop)

**Files (animals):**
a Ant, b Bear, c Cat, d Dog, e Elephant, f Fox, g Gorilla, h Hippo

**Ranks (props):**
1 Doormat, 2 Shoe, 3 Table, 4 Chair, 5 Bed, 6 Sink, 7 Bookshelf, 8 Chandelier

**Squares**

* **a1** = Ant on a Doormat
* **e4** = Elephant sitting on a Chair
* **h8** = Hippo swinging from a Chandelier
* **c7** = Cat shredding a Bookshelf
* **g2** = Gorilla wearing a Shoe
* **f6** = Fox bathing in a Sink

## Sample pieces (actors)

* White Knight = **White Ninja** (glow suit)
* Black Bishop = **Black Wizard** (shadow cloak)
* White Pawn = **White Hiker**
* Black Rook = **Black Robot**

## Sample move scenes

1. **1. Nf3** (White knight g1→f3)

* Stage: **g1 = Gorilla+Doormat** (gorilla stomping on doormat)
* Actor: **White Ninja**
* Target: **f3 = Fox+Table**
* Verb: Ninja *leaps* onto the fox’s table and lands in a “ready stance.”

2. **… exd5+** (pawn captures on d5 with check)

* Actor: pawn-hiker grabs the victim piece on **d5 = Dog+Bed**
* Capture FX: confetti “X” stamp
* Check FX: siren spotlight beams onto the enemy King.

3. **O-O** (kingside castle)

* King jumps into a “small castle-gate” on the right; rook-robot slides next to him.
* Add a big “K-side” arrow (rightward) to prevent O-O vs O-O-O swaps.

4. **e8=Q** (promotion)

* White Hiker reaches **e8 = Elephant+Chandelier** and instantly *metamorphoses* into the **Queen** (crown pops on, sparkles).

---

# Training drills by level (recognition → recall → speed → mixed review)

## Level 1 drills (Squares)

1. **Recognition (easy):** show “e4” → pick correct composite image (4 options).
2. **Reverse recognition:** show image → pick coordinate (4 options).
3. **Active recall:** show image → type coordinate (no options).
4. **Speed round:** 60 seconds, random squares; track accuracy + median RT.
5. **Interference drill:** “same file” blocks (a1,a2,a3…) then “same rank” blocks. This targets the most common swaps.

**Mastery gating**

* Promote when user hits ≥95% accuracy at ≤2s median RT across two spaced sessions. ([Augmenting Cognition][10])

## Level 2 drills (Pieces on squares)

1. **Spot-check:** show position, ask “What is on f6?”
2. **Reverse:** show “Black Wizard on Fox+Sink” → user selects square and piece.
3. **Batch recall:** show 10-piece position, then blank board; place pieces back.

## Level 3 drills (Single moves)

1. **Template drills:** start with quiet moves only → add capture → add check → add promo/castle/ep.
2. **Decode drills:** show scene → pick correct move among near-confusable distractors (e.g., Nf3 vs Nd2).
3. **Encode drills:** show move → user writes a 1–2 sentence “scene script” (app can rate it via key tokens present).
4. **Error-correction drill:** when wrong, force user to answer: “Which token failed? piece / from / to / special?” (builds diagnostic retrieval cues). ([PMC][6])

## Level 4 drills (Single-line openings)

1. **Forward playthrough:** from start position, “play the next move” repeatedly.
2. **Random restart:** jump to move 7 position → recall continuation.
3. **Bidirectional recall:** sometimes ask “what move led here?” (strengthens associations; helps reduce order confusions). ([PMC][6])

## Level 5+ drills (Variations, transpositions)

1. **Opponent-choice drill:** at branch node, app randomly chooses opponent reply; user must select the correct door/variation.
2. **Transposition drill:** present two move orders that reach same tabiya; user must recognize the tabiya and continue from the shared node.
3. **Chunk test:** show tabiya position for 5 seconds; user describes it in 3 “chunk phrases” (pawn structure, key piece placements, main plan). This aligns with chunk/template findings in chess expertise. ([ResearchGate][14])

## Review scheduling (app-level)

* Implement SRS with a quality rating (0–5) and expanding intervals (SM-2 style). ([Super Memory][12])
* Prioritize **retrieval tests** over restudy; repeated testing drives durable learning. ([PubMed][11])
* Use **spacing** as the default; avoid cramming-only flows. ([Augmenting Cognition][10])

---

# Confusion audit (what users will mix up, and how to prevent it)

## A) Square confusions (e.g., g7 vs g8, e4 vs e5)

**Why it happens:** similar cues, overloaded categories. ([PMC][6])
**Preventions**

* Rank props must be maximally discriminable **and** vertically intuitive (bookshelf vs chandelier).
* Add optional overlays: square color glow; quadrant tint; corner “anchors.”

## B) Piece confusions (bishop vs pawn, white vs black)

**Why:** insufficiently distinct silhouettes / weak color coding. ([PubMed][8])
**Preventions**

* Enforce high-contrast silhouettes (Robot vs Wizard vs Ninja).
* Color as a *consistent* modifier (glow vs shadow), not a new character.

## C) Move-type confusions (capture vs non-capture; check vs mate; O-O vs O-O-O)

**Why:** action layer not standardized; special symbols omitted.
**Preventions**

* Standard FX library:

  * capture = “X stamp + poof”
  * check = siren spotlight to King
  * mate = King in cage + “#”
  * castle = King rides rook-vehicle + side-sized gate
* Always attach FX to the actor-target interaction (central detail). ([PMC][9])

## D) Variation mixing (two similar Sicilian sidelines collide)

**Why:** same loci reused across different lines; cue overload. ([PMC][6])
**Preventions**

* One opening family per palace, or add an unmistakable **opening mascot** at the palace entrance (context cue).
* Keep branch factors low per node; split trees early.

## E) Transposition duplication

**Why:** memorizing move order instead of position-chunk.
**Preventions**

* Explicit tabiya anchors + portals; chunk tests; “same position” drills. ([ResearchGate][14])

---

# Bibliography (key sources used)

* Method of Loci systematic review/meta-analysis (2025, PMC). ([PMC][1])
* Dresler et al. (2017). *Mnemonic training reshapes brain networks* (Current Biology, PMC). ([ChessBase][3])
* Maguire et al. (2003). *Brains behind superior memorizers* (Nature Neuroscience PDF). ([sites.uni.edu][2])
* Art of Memory: Method of Loci tutorial/best-practice progression. ([Art of Memory][15])
* Art of Memory: PAO system and chunking into loci. ([Art of Memory][4])
* De Beni & Cornoldi (1985). Loci mnemonics + progressive elaboration for ordered triplets (Acta Psychologica abstract). ([ScienceDirect][5])
* Wheeler et al. (2017). Retrieval cue quality, cue overload, distinctiveness (PMC narrative review). ([PMC][6])
* Roediger & Karpicke (2006). Testing effect / test-enhanced learning (PubMed record). ([PubMed][11])
* Karpicke & Roediger (2008). Retrieval practice improves long-term retention (Science PDF). ([Massachusetts Institute of Technology][18])
* Cepeda et al. (2006). Distributed practice meta-analytic review (PDF). ([Augmenting Cognition][10])
* SM-2 spaced repetition algorithm description (SuperMemo / super-memory.com). ([Super Memory][12])
* Chase & Simon (1973). Perception/chunking in chess (ScienceDirect abstract). ([ScienceDirect][13])
* Gobet & Simon (1998). Chunking hypothesis revisited (full-text via ResearchGate). ([ResearchGate][14])
* Kensinger (2009). Emotion yields focal memory enhancements (PMC). ([PMC][9])
* Mather (2007). Emotional arousal and attentional narrowing (PDF). ([USC Leonard Davis School of Gerontology][19])
* ChessBase (2017). Memory palace technique and chess-oriented framing (chess education source). ([ChessBase][3])
* US Chess Federation forum discussion: practical concerns & image-per-square ideas (community reference). ([United States Chess Federation][16])
* Art of Memory Forum: “Picture Notation” move-word approach (community reference). ([Art of Memory Forum][17])

---

If you want one “default” system to bake into the app, I’d ship the **Hybrid C+A** (file/rank pegs generating square props + pieces as actors + PAO-style move scenes + one-locus-per-full-move routes). It’s the best balance of (1) low initial load, (2) strong interference resistance, and (3) scalability to variations/transpositions without demanding memory-athlete background.

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/"
[2]: https://sites.uni.edu/gabriele/page4/files/maguire002820020029brains-behind-superior-memorizers.pdf "https://sites.uni.edu/gabriele/page4/files/maguire002820020029brains-behind-superior-memorizers.pdf"
[3]: https://en.chessbase.com/post/memory-techniques-memory-palace-from-roman-times-to-today "https://en.chessbase.com/post/memory-techniques-memory-palace-from-roman-times-to-today"
[4]: https://artofmemory.com/blog/pao-system/ "https://artofmemory.com/blog/pao-system/"
[5]: https://www.sciencedirect.com/science/article/pii/0001691885900101 "https://www.sciencedirect.com/science/article/pii/0001691885900101"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5664228/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC5664228/"
[7]: https://plato.stanford.edu/archives/fall2012/entries/mental-imagery/theories-memory.html "https://plato.stanford.edu/archives/fall2012/entries/mental-imagery/theories-memory.html"
[8]: https://pubmed.ncbi.nlm.nih.gov/40788721/ "https://pubmed.ncbi.nlm.nih.gov/40788721/"
[9]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2676782/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC2676782/"
[10]: https://augmentingcognition.com/assets/Cepeda2006.pdf "https://augmentingcognition.com/assets/Cepeda2006.pdf"
[11]: https://pubmed.ncbi.nlm.nih.gov/16507066/ "https://pubmed.ncbi.nlm.nih.gov/16507066/"
[12]: https://super-memory.com/english/ol/sm2.htm "https://super-memory.com/english/ol/sm2.htm"
[13]: https://www.sciencedirect.com/science/article/pii/0010028573900042 "https://www.sciencedirect.com/science/article/pii/0010028573900042"
[14]: https://www.researchgate.net/publication/13576754_Expert_Chess_Memory_Revisiting_the_Chunking_Hypothesis "https://www.researchgate.net/publication/13576754_Expert_Chess_Memory_Revisiting_the_Chunking_Hypothesis"
[15]: https://artofmemory.com/blog/method-of-loci/ "https://artofmemory.com/blog/method-of-loci/"
[16]: https://forum.uschess.org/t/mnemonics-chess-openings/14784 "https://forum.uschess.org/t/mnemonics-chess-openings/14784"
[17]: https://forum.artofmemory.com/t/picture-notation-a-mnemonic-system-for-chess/70514 "https://forum.artofmemory.com/t/picture-notation-a-mnemonic-system-for-chess/70514"
[18]: https://web.mit.edu/jbelcher/www/learner/retrieval.pdf "https://web.mit.edu/jbelcher/www/learner/retrieval.pdf"
[19]: https://gero.usc.edu/labs/matherlab/files/2019/03/Mather2007.pdf "https://gero.usc.edu/labs/matherlab/files/2019/03/Mather2007.pdf"
