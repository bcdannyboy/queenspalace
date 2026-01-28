import type { TrainingItem } from "../../../contracts/v1/domain.types";

export type Rating = "again" | "hard" | "good" | "easy";

export interface GradeThresholds {
  fastMs: number;
  slowMs: number;
}

export const DEFAULT_GRADE_THRESHOLDS: Record<
  TrainingItem["itemType"],
  GradeThresholds
> = {
  squarePeg: { fastMs: 1500, slowMs: 4500 },
  pieceOnSquare: { fastMs: 2000, slowMs: 6000 },
  nextMove: { fastMs: 3000, slowMs: 9000 },
  branchDecision: { fastMs: 4500, slowMs: 12000 },
  imageToMove: { fastMs: 3000, slowMs: 9000 },
  chunk: { fastMs: 8000, slowMs: 20000 },
  plan: { fastMs: 9000, slowMs: 24000 },
};

const RATING_ORDER: Record<Rating, number> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};

export function isValidRating(value: string): value is Rating {
  return value === "again" || value === "hard" || value === "good" || value === "easy";
}

export function resolveGradeThresholds(
  itemType: TrainingItem["itemType"],
  overrides?: Partial<Record<TrainingItem["itemType"], Partial<GradeThresholds>>>
): GradeThresholds {
  const base = DEFAULT_GRADE_THRESHOLDS[itemType];
  const override = overrides?.[itemType];
  if (!override) {
    return base;
  }

  const fastMs = Number.isFinite(override.fastMs) ? Math.max(0, override.fastMs!) : base.fastMs;
  const slowMs = Number.isFinite(override.slowMs) ? Math.max(0, override.slowMs!) : base.slowMs;

  return {
    fastMs: Math.min(fastMs, slowMs),
    slowMs: Math.max(fastMs, slowMs),
  };
}

export interface RatingInput {
  correct: boolean;
  responseMs: number;
  itemType: TrainingItem["itemType"];
  thresholdsByType?: Partial<Record<TrainingItem["itemType"], Partial<GradeThresholds>>>;
  capAt?: Rating;
}

export function ratingFromTime({
  correct,
  responseMs,
  itemType,
  thresholdsByType,
  capAt,
}: RatingInput): Rating {
  if (!correct) {
    return "again";
  }

  const thresholds = resolveGradeThresholds(itemType, thresholdsByType);
  const normalizedMs = Number.isFinite(responseMs) ? Math.max(0, responseMs) : thresholds.slowMs;

  let rating: Rating;
  if (normalizedMs <= thresholds.fastMs) {
    rating = "easy";
  } else if (normalizedMs <= thresholds.slowMs) {
    rating = "good";
  } else {
    rating = "hard";
  }

  if (capAt && RATING_ORDER[rating] > RATING_ORDER[capAt]) {
    return capAt;
  }

  return rating;
}

export function ratingFromPassFail(passed: boolean): Rating {
  return passed ? "good" : "again";
}
