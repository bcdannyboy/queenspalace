# SRS Contract v1

## Purpose
Define the scheduling API, grading scale, and deterministic queue rules for MVP (SM-2 style).

---

## Scheduler API

### `scheduleReview`
Inputs:
- `trainingItemId: UUID`
- `now: ISO timestamp`
- `rating: "again" | "hard" | "good" | "easy"`
- `previousState: SRSState`

Outputs:
- `nextState: SRSState`
- `reviewLog: ReviewLog`

### `buildQueue`
Inputs:
- `now: ISO timestamp`
- `states: SRSState[]`
- `caps: { maxReviews: number; maxNew: number }`
- `ordering: "dueFirst" | "riskFirst"` (default `dueFirst`)

Outputs:
- `queue: UUID[]` (trainingItemIds)

---

## Grading scale
- Again: incorrect or correct only after reveal
- Hard: correct but slow or hesitant
- Good: correct with normal latency
- Easy: correct and fast

Time-based grading thresholds MUST be configurable per item type.

---

## Learning steps (MVP defaults)
- Step 0: immediate retry (0 minutes)
- Step 1: 10 minutes
- Step 2: 1 day
- Step 3: 3 days

Rules:
- Items in `learning` or `relearning` MUST follow the steps above before entering `review`.
- Failures in learning MUST not permanently reduce long-term ease.

---

## SM-2 update rules (MVP)
- Start easeFactor at 2.5 for new items.
- If rating is Again: set intervalDays = 0, move to relearning steps.
- If rating is Hard: intervalDays *= 1.2 and easeFactor -= 0.15.
- If rating is Good: intervalDays *= easeFactor.
- If rating is Easy: intervalDays *= easeFactor * 1.3 and easeFactor += 0.15.
- easeFactor MUST be clamped to [1.3, 3.0].

These values MAY be tuned but MUST remain deterministic and documented.

---

## Daily caps
- `maxReviews` limits items in `review` and `relearning`.
- `maxNew` limits items in `new`.
- Queue MUST be deterministic: same inputs produce same outputs.

---

## Error semantics
- If scheduleReview receives an unknown rating or invalid state, it MUST return `SRS_INVALID_INPUT`.
- Queue generation MUST ignore suspended items.

---

## Migration to FSRS (V1+)
- The contract allows `scheduler = "fsrs"` with additional fields `stability` and `difficulty`.
- Migration MUST preserve review history and avoid data loss.

