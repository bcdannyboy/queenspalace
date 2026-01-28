## Research takeaways that directly shape the UX

### What we’re teaching: Method of Loci as a *workflow*, not a concept

Method of Loci (memory palace) is fundamentally: pick a familiar space/route with distinct locations, create vivid (often unusual) images for items, bind them to loci, then recall by mentally “walking” the route. ([PMC][1])
Two design implications:

* **We must teach “route + binding + retrieval walk” with practice checks**, not just explanations.
* **Image quality matters**: more *salient/vivid/bizarre* and *emotive* associations improve recall, so the app should coach image strength and repair weak images after errors. ([C2AD][2])

### How we’ll get it to stick: retrieval + spacing + feedback (in-app and in drills)

Evidence base strongly supports:

* **Practice testing / retrieval practice** produces large gains in long-term retention versus restudying, and feedback boosts it further. ([PubMed][3])
* **Distributed practice (spacing)** outperforms massed practice across many studies; optimal spacing depends on retention interval. ([PubMed][4])
* Reviews rate **practice testing + distributed practice** as high-utility learning techniques. ([whz.de][5])

UX implication: the product should behave like an “opening trainer + mnemonic coach,” where **every move/position becomes a schedulable review item**, and mistakes trigger a *memory-strengthening repair loop*, not just “wrong.” ([PubMed][3])

### How we avoid overwhelm: progressive disclosure + micro-lessons + worked examples

* **Progressive disclosure** keeps first-use simple by deferring advanced options to later screens. ([nngroup.com][6])
* Mobile onboarding can include **customization + instructions**, but should let users skip when possible. ([nngroup.com][7])
* Segmenting instruction and reducing extraneous cognitive load is critical for multimedia learning. ([uky.edu][8])

### Motivation without manipulation: support autonomy/competence and make the habit easy

* Habits are more likely when **Motivation + Ability + Prompt** converge (B=MAP). ([Fogg Behavior Model][9])
* Forming habits can take longer than people expect (often cited average ~66 days). ([University College London][10])
* Gamification works best when it supports autonomy/competence/relatedness; poorly applied gamification can undermine needs via overjustification or negative competition. ([Self Determination Theory][11])

## 3+ concrete UX patterns from existing apps we can directly apply

1. **Per-item spaced repetition levels & reset-on-error (move-level granularity)**
   Chess.com’s MoveTrainer describes per-move timers with increasing intervals (e.g., 4h → 1d → 3d → 1w …) and resets timing after mistakes. ([Chess.com Help Center][12])
   **Apply:** each *position prompt* and each *memory image* is an SRS item with its own level.

2. **“Train by playing against your repertoire” (active recall in context)**
   Listudy frames each move like an Anki “card” and trains openings hands-on by playing against the repertoire, increasing/decreasing move “value.” ([Listudy][13])
   **Apply:** drills that feel like chess (not flashcards) while still using SRS under the hood.

3. **Post-game deviation feedback loop**
   ChessTempo’s opening trainer links training with play: after games it shows where you deviated from your repertoire and lets you extend coverage. ([Chess Tempo][14])
   **Apply:** “Import your last game → see the first deviation → repair/extend palace.”

4. **Complex-feature onboarding overlay + in-context reference + checklist**
   memoryOS uses a tutorial overlay before entering a 3D mind palace, provides an in-lesson reference list, and an onboarding checklist that rewards key actions. ([ScreensDesign][15])
   **Apply:** first palace creation gets a guided overlay and a “First Palace Checklist.”

---

# Deliverable 1: Three end-to-end user flows

## Flow 1 — New user onboarding (teach MoL without overwhelm)

**Goal:** user experiences a first “I can recall this” win in <5 minutes, and leaves with *one tiny palace + one mini-opening seed*.

### Screen-by-screen

1. **Welcome / goal pick**

   * Choose: *“Learn openings faster”* (default) or *“Learn memory palaces first.”*
   * Pick chess comfort level: *Beginner (needs notation help)* / *Comfortable* / *Advanced*.
   * Pick daily minimum: **2 / 5 / 10 minutes** (default 5).
   * Explain: “You’ll do tiny sessions; the app schedules reviews for you.” (No streak mention yet.)

2. **Content & imagery preference**

   * **Tone preset**:

     * Family-friendly (default)
     * Absurd (cartoon-weird)
     * Mature (non-graphic)
   * “Tone slider” preview row: shows example image prompts and confirms what’s allowed/blocked.

3. **Micro-lesson 1: “What is a locus?” (worked example + 1 check)**

   * Show a *3-locus starter route* (Front door → Sofa → Fridge).
   * Demonstrate placing 3 items with vivid images (short animation).
   * **Practice check:** user taps loci in order to “walk the route.”

4. **Micro-lesson 2: “Bind an image” (user creates 1 image)**

   * Prompt: “Place ‘e4’ at the Front Door.”
   * Provide 3 image suggestions matching selected tone (editable).
   * **Image strength meter** with 3 toggles:

     * Action (static → interactive)
     * Sensory (add sound/texture)
     * Surprise (normal → unusual)
   * Rationale: vivid/unusual/emotive images help recall. ([C2AD][2])

5. **Recall check (retrieval practice + feedback)**

   * Show the route again; user is asked: “At Front Door, what move?” (multiple choice first)
   * If wrong: show correct answer + “repair prompt” (see Drill Library “Error Repair”).

6. **Choose palace type**

   * Option A: “Use my real place” → quick locus picker checklist (5 loci)
   * Option B: “Use a pre-built palace” (starter)
     *Pattern borrowed from memoryOS “virtual palaces.”* ([memoryOS][16])

7. **Finish: “Your first seed is planted”**

   * Shows “Today’s plan: 5 minutes, 6 prompts” button.
   * Shows next review time (SRS) but hides full scheduler settings (progressive disclosure). ([nngroup.com][6])

**Onboarding success metric:** user completes one retrieval check + sets a daily minimum + has 1 mini-sequence encoded.

---

## Flow 2 — First opening imported and trained

**Goal:** user imports an opening, scopes it, encodes the first chunk into loci, and completes the first structured drill ladder.

### Screen-by-screen

1. **Add Opening**

   * Import options:

     * Paste PGN
     * Pick from library (e.g., “Italian Game”)
     * Import from last game PGN
   * App parses into a variation tree and suggests “starter slice”:

     * Main line only (default)
     * Main + 1 common deviation
     * Full tree (locked until later)

2. **“Palace mapping” wizard**

   * Shows: “This slice needs 8 loci.”
   * User chooses:

     * “One line per room” (branching-friendly)
     * “One move-pair per locus” (simple)
   * App auto-allocates loci and shows a mini-map.

3. **Encoding workshop (guided)**

   * For first 6–10 plies:

     * Show position → ask for move
     * Then: “Place this move at Locus 1”
     * Offer 3 suggestions in chosen tone + an “edit” option
   * Encourages image properties (action/sensory/surprise). ([C2AD][2])

4. **Drill ladder starts (recognition → recall)**

   * Stage A: Recognition (multiple choice)
   * Stage B: Recall (type move or select from piece + square picker)
   * Stage C: First timed set (gentle: 10s per move)
     *This follows desirable difficulty: increase challenge as competence rises.* ([Bjork Learning and Forgetting Lab][17])

5. **Schedule & next steps**

   * Items enter SRS at Level 1.
   * The app shows “Next review in ~4 hours” style messaging, following chess MoveTrainer patterns. ([Chess.com Help Center][12])
   * Unlock: “Add 1 more branch” *only after* first slice reaches mastery threshold.

---

## Flow 3 — Daily review session (minimum viable daily session)

**Goal:** user completes a “small win” session (2–10 minutes), reinforces weak spots, and sees chess-relevant progress.

### Screen-by-screen

1. **Today tab**

   * “Due now: 18 prompts”
   * Buttons:

     * **Start 5-min session** (default)
     * Start full session
     * Reschedule (no guilt copy)

2. **Warm-up (30–60s)**

   * 5 rapid recognition prompts to re-enter context.

3. **Core review (SRS queue)**

   * Mix across openings (interleaving), but cap context switching to avoid overload.
   * Each item:

     * Position shown
     * User answers (recall)
     * Confidence tap (Optional: “Unsure / OK / Solid”)
     * Immediate feedback

4. **Error Repair Loop (when wrong or low-confidence)**

   * Show correct move + “what in your image failed?”

     * Wrong character? (piece confusion)
     * Wrong locus order? (route confusion)
     * Image too bland? (low salience)
   * Then: user updates image with one guided upgrade (action/sensory/surprise).
   * Re-test after 2–3 other cards (short delay) to strengthen retrieval. ([PubMed][3])

5. **Wrap**

   * “You strengthened 4 weak links.”
   * **Chess outcome map:** “You’re ‘game-ready’ for 62% of your Italian slice” + “fast mode accuracy.”
   * Option: “Import last game to see first deviation” (transfer loop). ([Chess Tempo][14])

---

# Deliverable 2: Recommended level UI

## Level structure as a “skill tree”

Two connected trees (so it feels like *skills*, not a linear course):

### Tree A — Memory Craft (global skills)

1. **Loci Basics** (pick distinct loci, fixed order)
2. **Image Strength** (action/sensory/surprise; tone-safe)
3. **Binding & Retrieval Walk** (walk route, decode reliably)
4. **Branching Palaces** (handle forks without confusion)
5. **Maintenance** (repair, prune, reuse palaces)

### Tree B — Opening Mastery (per opening)

1. **Seed** (first 6–10 plies)
2. **Mainline** (core line to depth target)
3. **Sidelines** (1–3 deviations)
4. **Speed Ready** (timed recall)
5. **Transfer Ready** (play vs repertoire + post-game fixes)
6. **Opening Mastery** (retention over long intervals)

This mirrors how method-of-loci is a structured method (space → images → binding → recall walk) ([PMC][1]) while chess opening training benefits from spaced repetition and contextual recall. ([Chess Tempo][14])

## What the Level UI shows

**Level card (default view):**

* Level name + 1-sentence purpose
* “You’ll prove mastery by:” (2–3 bullets)
* A single primary CTA: **Continue**
* “Due items” count (if this level feeds today’s queue)
* A “Preview drills” drawer (collapsed)

**Level detail (expanded):**

* **Mastery criteria** (clear, measurable)
* A short “why this matters in games” note
* Drill menu (unlocked drills only)
* Settings (advanced) behind “Tune” (progressive disclosure). ([nngroup.com][6])

## What’s hidden until needed

* Full SRS settings (interval tuning, custom algorithms)
* Full repertoire tree editing
* Advanced encoding systems (PAO variants, multiple images per locus)
* Competitive leaderboards (optional, off by default)

Reason: reduce cognitive overload early and keep learners moving through small chunks. ([uky.edu][8])

## How mastery is proven (locks & tests)

Borrowing from chess MoveTrainer’s “level per move” concept: each move/position has an SRS level, but **level completion requires both accuracy and retention across time**. ([Chess.com Help Center][12])

**Example mastery gates**

* **Seed (Opening):**

  * 90%+ recall accuracy in untimed recall drill
  * At least 2 successful spaced reviews (e.g., Level 1→2→3)
* **Speed Ready:**

  * 85%+ recall at 5s/move across mixed positions
* **Transfer Ready:**

  * “Play vs repertoire” drill: survive 10 deviations with correct branch selection
  * Post-game: import 1 recent game and correctly identify the first deviation (or confirm none)

---

# Deliverable 3: Drill library (10+ drill types mapped to levels)

Below are **12** drills (you can ship a minimal set first, then unlock more as users progress).

### Level 0–1: Foundations (Loci + imagery)

1. **Loci Builder**

* Task: pick/confirm 5–20 loci in order (drag/drop, keyboard reorder)
* Feedback: flags loci that are too similar (“two chairs”) and suggests making loci more distinctive
* Why: MoL relies on distinct locations + fixed route. ([PMC][1])

2. **Image Strength Coach**

* Task: user creates/edits an image for a move
* Prompts: “Add an action,” “Add a sensory detail,” “Make it unusual”
* Why: vivid/bizarre/emotive imagery improves recall. ([C2AD][2])

3. **Decode Walk**

* Task: “walk” your palace; each locus asks “what move?”
* Mode: recognition first, then recall
* Why: trains the retrieval walk step explicitly. ([PMC][1])

### Level 2–3: Recognition → Recall ladder (opening slice training)

4. **Move Recognition (MCQ)**

* Position → choose correct move among 3–5
* Feedback: shows your locus image and explains mismatch (“Your image had a bishop, but move is a knight”)

5. **Move Recall (Type / Picker)**

* Position → type SAN/uci or select piece + square
* Feedback: corrective + prompt to “repair image” if wrong
* Retrieval practice is a strong enhancer; feedback improves it. ([PubMed][3])

6. **Image-to-Move Translation**

* Show the locus image (or the “story beat”) → user inputs move
* Purpose: ensures images are *decodable*, not just funny

7. **Branch Choice Drill**

* Show opponent deviation → user selects correct branch (or “out of repertoire”)
* Purpose: prevents “mainline autopilot”

### Level 4–5: Speed + interleaving + robustness

8. **Speed Ladder**

* Same recall prompts, but time per move decreases (10s → 7s → 5s → 3s)
* Rationale: desirable difficulties, but only after competence. ([Bjork Learning and Forgetting Lab][17])

9. **Interleaved Mixed Review**

* Mix positions from multiple openings/slices
* Rationale: interleaving is a desirable difficulty; avoid blocked-only practice. ([Bjork Learning and Forgetting Lab][17])

10. **Error Repair Loop (Dedicated)**

* After incorrect/low-confidence answers:

  * Diagnose error type
  * Upgrade image
  * Re-test after short delay
* Anchored in “feedback enhances benefits of testing.” ([PubMed][3])

### Level 6+: Transfer to real chess

11. **Play vs Repertoire**

* Interactive game mode: opponent plays deviations; user must respond with repertoire move or flag “unknown”
* Mirrors “train against your repertoire” patterns. ([Listudy][13])

12. **Post-game Deviation Review**

* Import PGN → app finds first divergence from repertoire → generates a mini-drill set and prompts a palace update
* Mirrors ChessTempo’s training-to-play feedback loop. ([Chess Tempo][14])

---

# Deliverable 4: Personalization spec for imagery and tone

## A. Tone & content controls

### 1) Preset selector (first-run + settings)

* **Family-friendly**: no profanity, no sexual content, no gore, no substance imagery.
* **Absurd**: surreal/cartoon weirdness, exaggerated physics, but still PG.
* **Mature (non-graphic)**: mild profanity, mild adult themes, *no explicit sex*, *no graphic violence*, no hate, no self-harm.

### 2) Tone sliders (2-axis model)

* **Weirdness**: Plain → Surreal
* **Edginess**: Clean → Mild adult
  Constraints: if Family-friendly, Edginess locked low; if Mature, allowed higher within non-graphic rules.

### 3) Preview + test prompt

Before saving, show 3 sample generated images and ask:

* “Comfortable with this tone?” (Yes / Adjust)

## B. Image packs & customization UI

### Core objects to customize

* **Piece characters** (6): Pawn/Knight/Bishop/Rook/Queen/King
* **Action verbs** (library grouped by intensity)
* **Square/coordinate encoding** (optional)
* **Opening concepts** (optional layer): “pin,” “fork,” “castle,” “center break”

### Pack types

* **Classic** (neutral objects/characters)
* **Animals**
* **Myth/Fantasy**
* **Sports**
* **Custom** (user uploads or writes their own)

### Editor design

* “Card-style” editor:

  * **Image** (text + optional user image)
  * **Tone tags** (family/absurd/mature)
  * **Strength tags** (Action / Sensory / Surprise)
  * **Decode hint** (optional short cue shown only on errors)

## C. Accessibility requirements (built-in, not bolted-on)

1. **Keyboard-only operation**

* Every drill action operable via keyboard; no timing-based key requirements. ([w3.org][18])

2. **Screen reader mode**

* Provide a “command line” move entry and structured headings (inspired by Lichess blind mode patterns). ([lichess.org][19])

3. **Colorblind + low-vision**

* Do not encode correctness with color alone; provide icons + text + optional sound.
* Offer high-contrast theme and ensure UI control contrast meets guidance (non-text contrast). ([w3.org][20])

4. **Dyslexia-friendly mode**

* Avoid italics/underlines, avoid ALL CAPS, use 1.5 line spacing, left-justified ragged right, shorter line length. ([The Dyslexia-SPLD Trust][21])

---

# Motivation without manipulation

## Healthy consistency model

* **Minimum viable daily session** (2–5 minutes) + “Stop here” celebration.
* **Streak is optional** and uses “grace days” (no shame reset).
* **User chooses prompts** (notifications) and can snooze easily.

This aligns with B=MAP: make the behavior easy (Ability), prompt at chosen times (Prompt), and support motivation with visible competence gains. ([Fogg Behavior Model][9])

## Progress visualization tied to chess outcomes

* “Opening Readiness” per opening:

  * % positions at SRS Level 3+ (short-term stability)
  * % positions at Level 6+ (long-term stability)
  * Speed readiness (accuracy at 5s/move)
* “Game Transfer”:

  * last 10 games: deviations caught + repaired
  * suggested next sidelines based on real games (post-game loop). ([Chess Tempo][14])

## Gamification guardrails

* Badges for **mastery proofs**, not for grind.
* No “loss framing” (no “you lost your streak, try harder”).
* Avoid forced competition; focus on autonomy/competence. ([Self Determination Theory][11])

---

# Risks + mitigations

## 1) Early drop-off from cognitive overload

**Risk:** memory palace concepts + chess notation + app UI at once.
**Mitigations:**

* Progressive disclosure; hide advanced settings. ([nngroup.com][6])
* Segment into micro-lessons; reduce extraneous load. ([uky.edu][8])
* “Skip theory, start practicing” option (NN/g onboarding guidance). ([nngroup.com][7])

## 2) Users create weak/boring images → poor recall → frustration

**Mitigations:**

* Strength coach (action/sensory/surprise) and “repair loop.”
* Encourage vivid/unusual/emotive associations (within tone constraints). ([C2AD][2])

## 3) Over-scoping: importing a giant repertoire

**Mitigations:**

* “Starter slice” scoping default (mainline first)
* Locks: sideline expansion only after mastery of slice

## 4) “I memorized it in the app but can’t use it in games”

**Mitigations:**

* Play vs repertoire drills (contextual recall) ([Listudy][13])
* Post-game deviation workflow (close the loop) ([Chess Tempo][14])

## 5) Motivation backfires (streak guilt, grind fatigue)

**Mitigations:**

* Optional streak + grace days + “minimum session”
* Emphasize competence/autonomy; avoid overjustification/competition pressure. ([Self Determination Theory][11])

## 6) Accessibility gaps block practice (esp. move entry)

**Mitigations:**

* Keyboard-first design (WCAG 2.1.1) ([w3.org][18])
* Screen-reader optimized “move command line” model (Lichess inspiration) ([lichess.org][19])
* Dyslexia-friendly typography mode ([The Dyslexia-SPLD Trust][21])

---

# Bibliography (links via citations)

* Ondřej, J. (2025). *The method of loci in the context of psychological research: systematic review & meta-analysis.* ([PMC][1])
* Qureshi, A. et al. (2014). *Method of loci as a mnemonic device…* ([PMC][22])
* Dalgleish, T. et al. (2013). *Method-of-loci… vivid/bizarre/emotive imagery and recall.* ([C2AD][2])
* Roediger, H. L., & Butler, A. C. (2011). *Retrieval practice in long-term retention.* ([PubMed][3])
* Butler, A. C. et al. (2008). *Feedback increases retention…* ([PubMed][23])
* Cepeda, N. J. et al. (2006). *Distributed practice meta-analysis.* ([PubMed][4])
* Dunlosky, J. et al. (2013). *Effective learning techniques; practice testing & distributed practice high utility.* ([whz.de][5])
* Bjork, E. L., & Bjork, R. A. (2011). *Desirable difficulties: spacing, interleaving, tests.* ([Bjork Learning and Forgetting Lab][17])
* Mayer, R. E. (2003). *Nine ways to reduce cognitive load in multimedia learning.* ([uky.edu][8])
* Nielsen Norman Group: *Mobile-app onboarding components* and *Progressive disclosure.* ([nngroup.com][7])
* Chess.com Help: *MoveTrainer spaced repetition schedule.* ([Chess.com Help Center][12])
* Listudy: *Spaced repetition for chess; moves as cards.* ([Listudy][13])
* ChessTempo: *Opening training + post-game deviation feedback.* ([Chess Tempo][14])
* memoryOS + ScreensDesign: *micro-lessons, onboarding overlay, integrated help, checklist.* ([memoryOS][16])
* BJ Fogg: *Fogg Behavior Model (B=MAP).* ([Fogg Behavior Model][9])
* UCL (Lally et al.): *Habit formation ~66 days average.* ([University College London][10])
* Rutledge et al. (2018): *Gamification via SDT; pitfalls of poor gamification.* ([Self Determination Theory][11])
* W3C WCAG: *Keyboard accessibility (2.1.1), Non-text contrast (1.4.11).* ([w3.org][18])
* British Dyslexia Association: *Style guide recommendations.* ([The Dyslexia-SPLD Trust][21])

If you want, I can convert this into a “spec-ready” set of screens (wireframe descriptions + component list + event tracking plan) while keeping the same research-backed structure.

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/"
[2]: https://c2ad.mrc-cbu.cam.ac.uk/wp-content/uploads/c2ad/sites/4/2018/11/Dalgleish-Method-of-loci-CPS.pdf "https://c2ad.mrc-cbu.cam.ac.uk/wp-content/uploads/c2ad/sites/4/2018/11/Dalgleish-Method-of-loci-CPS.pdf"
[3]: https://pubmed.ncbi.nlm.nih.gov/20951630/ "https://pubmed.ncbi.nlm.nih.gov/20951630/"
[4]: https://pubmed.ncbi.nlm.nih.gov/16719566/ "https://pubmed.ncbi.nlm.nih.gov/16719566/"
[5]: https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf "https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf"
[6]: https://www.nngroup.com/articles/progressive-disclosure/ "https://www.nngroup.com/articles/progressive-disclosure/"
[7]: https://www.nngroup.com/articles/mobile-app-onboarding/ "https://www.nngroup.com/articles/mobile-app-onboarding/"
[8]: https://www.uky.edu/~gmswan3/544/9_ways_to_reduce_CL.pdf "https://www.uky.edu/~gmswan3/544/9_ways_to_reduce_CL.pdf"
[9]: https://www.behaviormodel.org/ "https://www.behaviormodel.org/"
[10]: https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit "https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit"
[11]: https://selfdeterminationtheory.org/wp-content/uploads/2020/10/2018_RutledgeWalshEtAl_Gamification.pdf "https://selfdeterminationtheory.org/wp-content/uploads/2020/10/2018_RutledgeWalshEtAl_Gamification.pdf"
[12]: https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work "https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work"
[13]: https://listudy.org/en/blog/spaced-repetition-for-chess "https://listudy.org/en/blog/spaced-repetition-for-chess"
[14]: https://chesstempo.com/opening-training/ "https://chesstempo.com/opening-training/"
[15]: https://screensdesign.com/showcase/memoryosimprove-memory-skills "https://screensdesign.com/showcase/memoryosimprove-memory-skills"
[16]: https://memoryos.com/ "https://memoryos.com/"
[17]: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf "https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf"
[18]: https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html"
[19]: https://lichess.org/page/blind-mode-guide "https://lichess.org/page/blind-mode-guide"
[20]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html"
[21]: https://www.thedyslexia-spldtrust.org.uk/media/downloads/69-bda-style-guide-april14.pdf "https://www.thedyslexia-spldtrust.org.uk/media/downloads/69-bda-style-guide-april14.pdf"
[22]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4056179/ "https://pmc.ncbi.nlm.nih.gov/articles/PMC4056179/"
[23]: https://pubmed.ncbi.nlm.nih.gov/18605878/ "https://pubmed.ncbi.nlm.nih.gov/18605878/"
