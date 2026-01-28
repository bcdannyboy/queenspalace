import {
  ANALYTICS_SESSION_KINDS,
  TRAINING_ITEM_TYPES,
  type AnalyticsEvent,
  type AnalyticsSessionKind,
  type TrainingItemType,
  isAnalyticsEvent,
} from "./events";

export const DEFAULT_RETENTION_INTERVAL_DAYS = 1;

export interface AnalyticsItemMetrics {
  count: number;
  correct: number;
  accuracy: number | null;
  medianResponseMs: number | null;
}

export interface AnalyticsSessionMetrics {
  started: number;
  completed: number;
  completionRate: number | null;
  medianDurationMs: number | null;
}

export interface AnalyticsImportMetrics {
  count: number;
  routes: number;
  positions: number;
  moves: number;
}

export interface AnalyticsConsentMetrics {
  enabledCount: number;
  disabledCount: number;
  lastUpdatedAt: number | null;
}

export interface AnalyticsMetricsSnapshot {
  totals: {
    events: number;
    sessionsStarted: number;
    sessionsCompleted: number;
    reviewItems: number;
    reviewItemsCorrect: number;
  };
  sessionCompletionRate: number | null;
  reviewAccuracy: number | null;
  medianReviewResponseMs: number | null;
  timeToNewOpeningMs: number | null;
  retentionAccuracy: number | null;
  byItemType: Record<TrainingItemType, AnalyticsItemMetrics>;
  bySessionKind: Record<AnalyticsSessionKind, AnalyticsSessionMetrics>;
  imports: AnalyticsImportMetrics;
  consent: AnalyticsConsentMetrics;
}

export interface AnalyticsMetricsOptions {
  retentionIntervalDays?: number;
}

export function normalizeAnalyticsEvents(
  values: ReadonlyArray<AnalyticsEvent | unknown>
): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  for (const value of values) {
    if (isAnalyticsEvent(value)) {
      events.push(value);
    }
  }
  return events;
}

export function buildAnalyticsMetrics(
  values: ReadonlyArray<AnalyticsEvent | unknown>,
  options: AnalyticsMetricsOptions = {}
): AnalyticsMetricsSnapshot {
  const events = normalizeAnalyticsEvents(values);
  const retentionThreshold =
    typeof options.retentionIntervalDays === "number" && options.retentionIntervalDays >= 0
      ? options.retentionIntervalDays
      : DEFAULT_RETENTION_INTERVAL_DAYS;

  const byItemType = initItemMetrics();
  const bySessionKind = initSessionMetrics();
  const responseTimes: number[] = [];
  const seedDurations: number[] = [];

  const totals = {
    events: 0,
    sessionsStarted: 0,
    sessionsCompleted: 0,
    reviewItems: 0,
    reviewItemsCorrect: 0,
  };

  const imports: AnalyticsImportMetrics = {
    count: 0,
    routes: 0,
    positions: 0,
    moves: 0,
  };

  const consent: AnalyticsConsentMetrics = {
    enabledCount: 0,
    disabledCount: 0,
    lastUpdatedAt: null,
  };

  let retentionCount = 0;
  let retentionCorrect = 0;

  for (const event of events) {
    totals.events += 1;

    switch (event.name) {
      case "consent_updated": {
        if (event.payload.enabled) {
          consent.enabledCount += 1;
        } else {
          consent.disabledCount += 1;
        }
        consent.lastUpdatedAt =
          consent.lastUpdatedAt === null ? event.ts : Math.max(consent.lastUpdatedAt, event.ts);
        break;
      }
      case "session_started": {
        totals.sessionsStarted += 1;
        bySessionKind[event.payload.sessionKind].started += 1;
        break;
      }
      case "session_completed": {
        totals.sessionsCompleted += 1;
        const sessionMetrics = bySessionKind[event.payload.sessionKind];
        sessionMetrics.completed += 1;
        sessionMetrics._durations.push(event.payload.durationMs);
        if (event.payload.sessionKind === "seed") {
          seedDurations.push(event.payload.durationMs);
        }
        break;
      }
      case "review_item_answered": {
        totals.reviewItems += 1;
        if (event.payload.correct) {
          totals.reviewItemsCorrect += 1;
        }

        responseTimes.push(event.payload.responseMs);

        const itemMetrics = byItemType[event.payload.itemType];
        itemMetrics.count += 1;
        if (event.payload.correct) {
          itemMetrics.correct += 1;
        }
        itemMetrics._responseTimes.push(event.payload.responseMs);

        if (event.payload.intervalDays !== undefined) {
          if (event.payload.intervalDays >= retentionThreshold) {
            retentionCount += 1;
            if (event.payload.correct) {
              retentionCorrect += 1;
            }
          }
        }
        break;
      }
      case "route_imported": {
        imports.count += 1;
        imports.routes += event.payload.routeCount;
        imports.positions += event.payload.positionCount;
        imports.moves += event.payload.moveCount;
        break;
      }
      default:
        break;
    }
  }

  const sessionCompletionRate =
    totals.sessionsStarted > 0 ? totals.sessionsCompleted / totals.sessionsStarted : null;
  const reviewAccuracy =
    totals.reviewItems > 0 ? totals.reviewItemsCorrect / totals.reviewItems : null;

  const snapshot: AnalyticsMetricsSnapshot = {
    totals,
    sessionCompletionRate,
    reviewAccuracy,
    medianReviewResponseMs: median(responseTimes),
    timeToNewOpeningMs: median(seedDurations),
    retentionAccuracy: retentionCount > 0 ? retentionCorrect / retentionCount : null,
    byItemType: finalizeItemMetrics(byItemType),
    bySessionKind: finalizeSessionMetrics(bySessionKind),
    imports,
    consent,
  };

  return snapshot;
}

type ItemMetricsInternal = {
  count: number;
  correct: number;
  _responseTimes: number[];
};

type SessionMetricsInternal = {
  started: number;
  completed: number;
  _durations: number[];
};

function initItemMetrics(): Record<TrainingItemType, ItemMetricsInternal> {
  const metrics = {} as Record<TrainingItemType, ItemMetricsInternal>;
  for (const itemType of TRAINING_ITEM_TYPES) {
    metrics[itemType] = { count: 0, correct: 0, _responseTimes: [] };
  }
  return metrics;
}

function finalizeItemMetrics(
  metrics: Record<TrainingItemType, ItemMetricsInternal>
): Record<TrainingItemType, AnalyticsItemMetrics> {
  const output = {} as Record<TrainingItemType, AnalyticsItemMetrics>;
  for (const itemType of TRAINING_ITEM_TYPES) {
    const entry = metrics[itemType];
    output[itemType] = {
      count: entry.count,
      correct: entry.correct,
      accuracy: entry.count > 0 ? entry.correct / entry.count : null,
      medianResponseMs: median(entry._responseTimes),
    };
  }
  return output;
}

function initSessionMetrics(): Record<AnalyticsSessionKind, SessionMetricsInternal> {
  const metrics = {} as Record<AnalyticsSessionKind, SessionMetricsInternal>;
  for (const kind of ANALYTICS_SESSION_KINDS) {
    metrics[kind] = { started: 0, completed: 0, _durations: [] };
  }
  return metrics;
}

function finalizeSessionMetrics(
  metrics: Record<AnalyticsSessionKind, SessionMetricsInternal>
): Record<AnalyticsSessionKind, AnalyticsSessionMetrics> {
  const output = {} as Record<AnalyticsSessionKind, AnalyticsSessionMetrics>;
  for (const kind of ANALYTICS_SESSION_KINDS) {
    const entry = metrics[kind];
    output[kind] = {
      started: entry.started,
      completed: entry.completed,
      completionRate: entry.started > 0 ? entry.completed / entry.started : null,
      medianDurationMs: median(entry._durations),
    };
  }
  return output;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
