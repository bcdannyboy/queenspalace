import {
  LEVEL_DEFINITIONS,
  LEVEL_ORDER,
  LevelCheckDefinition,
  LevelDefinition,
  LevelId,
  LevelMetrics,
  LevelRequirement,
} from "./criteria";

export interface LevelAttempt {
  levelId: LevelId;
  checkId: string;
  completedAt: string; // ISO timestamp
  metrics: LevelMetrics;
}

export type DayKeyResolver = (isoTimestamp: string) => string | null;

export interface LevelProgressOptions {
  dayKeyResolver?: DayKeyResolver;
  dayBoundaryOffsetMinutes?: number;
}

export interface LevelCheckStatus {
  checkId: string;
  label: string;
  passed: boolean;
  requiredDistinctDays: number;
  distinctDayCount: number;
  passingAttempts: LevelAttempt[];
  earliestPassAt?: string;
  latestPassAt?: string;
  blockedBy?: string;
  minHoursBetween?: number;
  minHoursAfter?: number;
}

export interface LevelProgress {
  levelId: LevelId;
  name: string;
  checks: LevelCheckStatus[];
  completed: boolean;
  completedAt?: string;
}

export interface LevelUnlockStatus {
  levelId: LevelId;
  unlocked: boolean;
  completed: boolean;
}

interface TimedAttempt extends LevelAttempt {
  completedMs: number;
  dayKey: string;
}

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

function parseIsoTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveDayKey(value: string, options?: LevelProgressOptions): string | null {
  if (options?.dayKeyResolver) {
    return options.dayKeyResolver(value);
  }

  const parsed = parseIsoTimestamp(value);
  if (parsed === null) {
    return null;
  }

  const offsetMinutes = Number.isFinite(options?.dayBoundaryOffsetMinutes)
    ? options!.dayBoundaryOffsetMinutes!
    : 0;
  const shifted = new Date(parsed + offsetMinutes * MS_PER_MINUTE);
  return shifted.toISOString().slice(0, 10);
}

function toTimedAttempt(attempt: LevelAttempt, options?: LevelProgressOptions): TimedAttempt | null {
  const completedMs = parseIsoTimestamp(attempt.completedAt);
  if (completedMs === null) {
    return null;
  }
  const dayKey = resolveDayKey(attempt.completedAt, options);
  if (!dayKey) {
    return null;
  }
  return {
    ...attempt,
    completedMs,
    dayKey,
  };
}

function requirementSatisfied(requirement: LevelRequirement, metrics: LevelMetrics): boolean {
  if (requirement.kind === "flag") {
    const value = metrics[requirement.metric];
    if (typeof value !== "boolean") {
      return requirement.optional ?? false;
    }
    return value === requirement.value;
  }

  const value = metrics[requirement.metric];
  if (!Number.isFinite(value)) {
    return requirement.optional ?? false;
  }

  if (requirement.kind === "min") {
    return value! >= requirement.value;
  }
  return value! <= requirement.value;
}

function attemptMeetsRequirements(check: LevelCheckDefinition, attempt: LevelAttempt): boolean {
  return check.requirements.every((requirement) => requirementSatisfied(requirement, attempt.metrics));
}

function sortByCompleted(a: TimedAttempt, b: TimedAttempt): number {
  if (a.completedMs !== b.completedMs) {
    return a.completedMs - b.completedMs;
  }
  if (a.checkId !== b.checkId) {
    return a.checkId < b.checkId ? -1 : 1;
  }
  return a.levelId - b.levelId;
}

function uniqueDayKeys(attempts: TimedAttempt[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const attempt of attempts) {
    if (!seen.has(attempt.dayKey)) {
      seen.add(attempt.dayKey);
      ordered.push(attempt.dayKey);
    }
  }
  return ordered;
}

function evaluateCheckStatus(
  definition: LevelCheckDefinition,
  rawPasses: TimedAttempt[],
  rawPassesByCheckId: Map<string, TimedAttempt[]>
): LevelCheckStatus {
  const minDistinctDays = definition.minDistinctDays ?? 1;
  const minHoursBetween = definition.minHoursBetween ?? 0;

  let eligiblePasses = rawPasses;
  let blockedBy: string | undefined;
  let minHoursAfter: number | undefined;

  if (definition.mustFollow) {
    const prerequisitePasses = rawPassesByCheckId.get(definition.mustFollow.checkId) ?? [];
    if (prerequisitePasses.length === 0) {
      eligiblePasses = [];
      blockedBy = definition.mustFollow.checkId;
    } else {
      const earliest = prerequisitePasses[0].completedMs;
      minHoursAfter = definition.mustFollow.minHoursAfter;
      const minMs = earliest + minHoursAfter * MS_PER_HOUR;
      eligiblePasses = rawPasses.filter((attempt) => attempt.completedMs >= minMs);
    }
  }

  const distinctDays = uniqueDayKeys(eligiblePasses);
  const meetsDistinctDays = distinctDays.length >= minDistinctDays;

  let meetsHourSpacing = true;
  if (minHoursBetween > 0) {
    if (eligiblePasses.length === 0) {
      meetsHourSpacing = false;
    } else {
      const earliest = eligiblePasses[0].completedMs;
      const latest = eligiblePasses[eligiblePasses.length - 1].completedMs;
      meetsHourSpacing = latest - earliest >= minHoursBetween * MS_PER_HOUR;
    }
  }

  const passed = eligiblePasses.length > 0 && meetsDistinctDays && meetsHourSpacing;
  const earliestPassAt = eligiblePasses[0]?.completedAt;
  const latestPassAt = eligiblePasses[eligiblePasses.length - 1]?.completedAt;

  return {
    checkId: definition.id,
    label: definition.label,
    passed,
    requiredDistinctDays: minDistinctDays,
    distinctDayCount: distinctDays.length,
    passingAttempts: eligiblePasses.map((attempt) => ({
      levelId: attempt.levelId,
      checkId: attempt.checkId,
      completedAt: attempt.completedAt,
      metrics: attempt.metrics,
    })),
    earliestPassAt,
    latestPassAt,
    blockedBy,
    minHoursBetween: definition.minHoursBetween,
    minHoursAfter,
  };
}

function collectRawPasses(
  definition: LevelCheckDefinition,
  attempts: LevelAttempt[],
  options?: LevelProgressOptions
): TimedAttempt[] {
  const rawPasses: TimedAttempt[] = [];
  for (const attempt of attempts) {
    if (attempt.checkId !== definition.id) {
      continue;
    }
    const timed = toTimedAttempt(attempt, options);
    if (!timed) {
      continue;
    }
    if (!attemptMeetsRequirements(definition, attempt)) {
      continue;
    }
    rawPasses.push(timed);
  }
  rawPasses.sort(sortByCompleted);
  return rawPasses;
}

function resolveLevelDefinition(levelId: LevelId): LevelDefinition | undefined {
  return LEVEL_DEFINITIONS.find((level) => level.id === levelId);
}

export function evaluateLevelProgress(
  levelId: LevelId,
  attempts: LevelAttempt[],
  options?: LevelProgressOptions
): LevelProgress {
  const definition = resolveLevelDefinition(levelId);
  if (!definition) {
    return {
      levelId,
      name: "Unknown",
      checks: [],
      completed: false,
    };
  }

  const levelAttempts = attempts.filter((attempt) => attempt.levelId === levelId);
  const rawPassesByCheckId = new Map<string, TimedAttempt[]>();

  for (const check of definition.checks) {
    rawPassesByCheckId.set(check.id, collectRawPasses(check, levelAttempts, options));
  }

  const checks = definition.checks.map((check) => {
    const rawPasses = rawPassesByCheckId.get(check.id) ?? [];
    return evaluateCheckStatus(check, rawPasses, rawPassesByCheckId);
  });

  const completed = checks.every((check) => check.passed);
  let completedAt: string | undefined;

  if (completed) {
    let latestMs = -Infinity;
    let latestIso: string | undefined;
    for (const check of checks) {
      if (!check.latestPassAt) {
        continue;
      }
      const parsed = parseIsoTimestamp(check.latestPassAt);
      if (parsed !== null && parsed > latestMs) {
        latestMs = parsed;
        latestIso = check.latestPassAt;
      }
    }
    completedAt = latestIso;
  }

  return {
    levelId: definition.id,
    name: definition.name,
    checks,
    completed,
    completedAt,
  };
}

export function evaluateAllLevelProgress(
  attempts: LevelAttempt[],
  options?: LevelProgressOptions
): LevelProgress[] {
  return LEVEL_ORDER.map((levelId) => evaluateLevelProgress(levelId, attempts, options));
}

export function computeUnlockStatus(progress: LevelProgress[]): LevelUnlockStatus[] {
  const progressById = new Map<LevelId, LevelProgress>();
  for (const entry of progress) {
    progressById.set(entry.levelId, entry);
  }

  const statuses: LevelUnlockStatus[] = [];
  let previousCompleted = true;

  for (const levelId of LEVEL_ORDER) {
    const levelProgress = progressById.get(levelId);
    const completed = levelProgress?.completed ?? false;
    const unlocked = previousCompleted;
    statuses.push({ levelId, unlocked, completed });
    previousCompleted = previousCompleted && completed;
  }

  return statuses;
}
