import type { ReviewLog, SRSState, UUID } from "../../../contracts/v1/domain.types";
import { isValidRating, Rating } from "./grades";

export const SRS_INVALID_INPUT = "SRS_INVALID_INPUT" as const;

export interface ReviewLogInput {
  responseMs?: number;
  correct?: boolean;
  answerUci?: string;
  answerText?: string;
  errorType?: ReviewLog["errorType"];
  answeredAsTrainingItemId?: UUID;
}

export interface ScheduleReviewInput {
  trainingItemId: UUID;
  now: string;
  rating: Rating;
  previousState: SRSState;
  reviewLog?: ReviewLogInput;
}

export interface ScheduleReviewSuccess {
  nextState: SRSState;
  reviewLog: ReviewLog;
}

export type ScheduleReviewResult = ScheduleReviewSuccess | typeof SRS_INVALID_INPUT;

const START_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 24 * 60 * 60 * 1000;

export const LEARNING_STEPS_MINUTES = [0, 10, 1440, 4320] as const;
export const LEARNING_STEPS_DAYS = LEARNING_STEPS_MINUTES.map((minutes) => minutes / 1440);

function clampEase(value: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, value));
}

function roundIntervalDays(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.round(value * 1_000_000) / 1_000_000;
}

function parseIsoTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidState(previous: SRSState, trainingItemId: UUID): boolean {
  if (!previous || previous.scheduler !== "sm2") {
    return false;
  }
  if (previous.trainingItemId !== trainingItemId) {
    return false;
  }
  if (
    previous.state !== "new" &&
    previous.state !== "learning" &&
    previous.state !== "review" &&
    previous.state !== "relearning" &&
    previous.state !== "suspended"
  ) {
    return false;
  }
  if (!Number.isFinite(previous.intervalDays) || previous.intervalDays < 0) {
    return false;
  }
  if (!Number.isFinite(previous.lapses) || previous.lapses < 0) {
    return false;
  }
  if (!Number.isFinite(previous.repetitions) || previous.repetitions < 0) {
    return false;
  }
  if (previous.state === "review" && previous.intervalDays <= 0) {
    return false;
  }
  if (parseIsoTimestamp(previous.dueAt) === null) {
    return false;
  }
  return true;
}

function learningStepIndex(intervalDays: number): number {
  if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
    return 0;
  }

  let index = 0;
  for (let i = 0; i < LEARNING_STEPS_DAYS.length; i += 1) {
    const step = LEARNING_STEPS_DAYS[i];
    if (Math.abs(intervalDays - step) < 1e-6) {
      return i;
    }
    if (intervalDays >= step) {
      index = i;
    }
  }

  return index;
}

function advanceLearning(intervalDays: number): { state: "learning" | "review"; intervalDays: number } {
  const index = learningStepIndex(intervalDays);
  if (index >= LEARNING_STEPS_DAYS.length - 1) {
    const lastInterval = LEARNING_STEPS_DAYS[LEARNING_STEPS_DAYS.length - 1];
    return { state: "review", intervalDays: lastInterval };
  }
  return { state: "learning", intervalDays: LEARNING_STEPS_DAYS[index + 1] };
}

function updateReviewInterval(
  intervalDays: number,
  easeFactor: number,
  rating: Rating
): { intervalDays: number; easeFactor: number } {
  let nextInterval = intervalDays;
  let nextEase = easeFactor;

  if (rating === "hard") {
    nextInterval = intervalDays * 1.2;
    nextEase = easeFactor - 0.15;
  } else if (rating === "good") {
    nextInterval = intervalDays * easeFactor;
  } else if (rating === "easy") {
    nextInterval = intervalDays * easeFactor * 1.3;
    nextEase = easeFactor + 0.15;
  }

  return {
    intervalDays: roundIntervalDays(nextInterval),
    easeFactor: clampEase(nextEase),
  };
}

function fnv1a32(input: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash >>> 0;
}

function deterministicUuid(parts: string[]): string {
  const base = parts.join("|");
  const h1 = fnv1a32(base, 0x811c9dc5);
  const h2 = fnv1a32(base, 0x01000193);
  const h3 = fnv1a32(base, 0x12345678);
  const h4 = fnv1a32(base, 0x9e3779b9);
  const hex = (value: number) => value.toString(16).padStart(8, "0");
  const all = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${all.slice(0, 8)}-${all.slice(8, 12)}-${all.slice(12, 16)}-${all.slice(16, 20)}-${all.slice(20)}`;
}

function buildReviewLog(
  input: ScheduleReviewInput,
  reviewedAt: string,
  rating: Rating
): ReviewLog {
  const responseMs = Number.isFinite(input.reviewLog?.responseMs)
    ? Math.max(0, input.reviewLog!.responseMs!)
    : 0;
  const correct = input.reviewLog?.correct ?? rating !== "again";

  return {
    id: deterministicUuid([input.trainingItemId, reviewedAt, rating, String(responseMs)]),
    trainingItemId: input.trainingItemId,
    reviewedAt,
    rating,
    answerUci: input.reviewLog?.answerUci,
    answerText: input.reviewLog?.answerText,
    correct,
    responseMs,
    errorType: input.reviewLog?.errorType,
    answeredAsTrainingItemId: input.reviewLog?.answeredAsTrainingItemId,
  };
}

export function scheduleReview(input: ScheduleReviewInput): ScheduleReviewResult {
  if (!isValidRating(input.rating)) {
    return SRS_INVALID_INPUT;
  }

  const nowMs = parseIsoTimestamp(input.now);
  if (nowMs === null) {
    return SRS_INVALID_INPUT;
  }

  if (!isValidState(input.previousState, input.trainingItemId)) {
    return SRS_INVALID_INPUT;
  }

  if (input.previousState.state === "suspended") {
    return SRS_INVALID_INPUT;
  }

  const previousInterval = input.previousState.intervalDays;
  const previousEase = clampEase(
    Number.isFinite(input.previousState.easeFactor) ? input.previousState.easeFactor! : START_EASE
  );
  const repetitions = (Number.isFinite(input.previousState.repetitions) ? input.previousState.repetitions : 0) + 1;

  let lapses = input.previousState.lapses;
  let nextState: SRSState;

  if (input.previousState.state === "new") {
    const intervalDays = input.rating === "again" ? LEARNING_STEPS_DAYS[0] : LEARNING_STEPS_DAYS[1];
    nextState = {
      trainingItemId: input.trainingItemId,
      scheduler: "sm2",
      state: "learning",
      dueAt: new Date(nowMs + intervalDays * DAY_MS).toISOString(),
      intervalDays: roundIntervalDays(intervalDays),
      easeFactor: previousEase,
      lapses,
      repetitions,
      lastReviewedAt: input.now,
    };
  } else if (input.previousState.state === "learning" || input.previousState.state === "relearning") {
    if (input.rating === "again") {
      const intervalDays = LEARNING_STEPS_DAYS[0];
      nextState = {
        trainingItemId: input.trainingItemId,
        scheduler: "sm2",
        state: input.previousState.state,
        dueAt: new Date(nowMs + intervalDays * DAY_MS).toISOString(),
        intervalDays: roundIntervalDays(intervalDays),
        easeFactor: previousEase,
        lapses,
        repetitions,
        lastReviewedAt: input.now,
      };
    } else {
      const advance = advanceLearning(previousInterval);
      const intervalDays = roundIntervalDays(advance.intervalDays);
      const nextMode = advance.state === "review" ? "review" : input.previousState.state;
      nextState = {
        trainingItemId: input.trainingItemId,
        scheduler: "sm2",
        state: nextMode,
        dueAt: new Date(nowMs + intervalDays * DAY_MS).toISOString(),
        intervalDays,
        easeFactor: previousEase,
        lapses,
        repetitions,
        lastReviewedAt: input.now,
      };
    }
  } else {
    if (input.rating === "again") {
      lapses += 1;
      const intervalDays = LEARNING_STEPS_DAYS[0];
      nextState = {
        trainingItemId: input.trainingItemId,
        scheduler: "sm2",
        state: "relearning",
        dueAt: new Date(nowMs + intervalDays * DAY_MS).toISOString(),
        intervalDays: roundIntervalDays(intervalDays),
        easeFactor: previousEase,
        lapses,
        repetitions,
        lastReviewedAt: input.now,
      };
    } else {
      const updated = updateReviewInterval(previousInterval, previousEase, input.rating);
      nextState = {
        trainingItemId: input.trainingItemId,
        scheduler: "sm2",
        state: "review",
        dueAt: new Date(nowMs + updated.intervalDays * DAY_MS).toISOString(),
        intervalDays: updated.intervalDays,
        easeFactor: updated.easeFactor,
        lapses,
        repetitions,
        lastReviewedAt: input.now,
      };
    }
  }

  const reviewLog = buildReviewLog(input, input.now, input.rating);
  return { nextState, reviewLog };
}
