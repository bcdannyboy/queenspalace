export const ANALYTICS_SCHEMA_VERSION = 1 as const;

export type AnalyticsSchemaVersion = typeof ANALYTICS_SCHEMA_VERSION;

export const ANALYTICS_SESSION_KINDS = [
  "onboarding",
  "review",
  "practice",
  "seed",
  "repair",
  "import",
] as const;

export type AnalyticsSessionKind = (typeof ANALYTICS_SESSION_KINDS)[number];

export const TRAINING_ITEM_TYPES = [
  "squarePeg",
  "pieceOnSquare",
  "nextMove",
  "branchDecision",
  "imageToMove",
  "chunk",
  "plan",
] as const;

export type TrainingItemType = (typeof TRAINING_ITEM_TYPES)[number];

export type ReviewRating = "again" | "hard" | "good" | "easy";

export type AnalyticsConsentSource = "onboarding" | "settings" | "system";

export type AnalyticsImportSource = "pgn" | "manual" | "other";

export type AnalyticsEventName =
  | "consent_updated"
  | "session_started"
  | "session_completed"
  | "review_item_answered"
  | "route_imported";

export interface AnalyticsEventPayloads {
  consent_updated: {
    enabled: boolean;
    source: AnalyticsConsentSource;
  };
  session_started: {
    sessionKind: AnalyticsSessionKind;
    plannedItems?: number;
  };
  session_completed: {
    sessionKind: AnalyticsSessionKind;
    durationMs: number;
    reviewCount: number;
    correctCount: number;
  };
  review_item_answered: {
    itemType: TrainingItemType;
    correct: boolean;
    responseMs: number;
    rating?: ReviewRating;
    intervalDays?: number;
  };
  route_imported: {
    source: AnalyticsImportSource;
    routeCount: number;
    positionCount: number;
    moveCount: number;
  };
}

export type AnalyticsEvent<Name extends AnalyticsEventName = AnalyticsEventName> = {
  id: string;
  name: Name;
  ts: number;
  schemaVersion: AnalyticsSchemaVersion;
  anonymousId: string;
  sessionId?: string;
  payload: AnalyticsEventPayloads[Name];
};

export interface AnalyticsEventInput<Name extends AnalyticsEventName> {
  name: Name;
  payload: AnalyticsEventPayloads[Name];
  anonymousId: string;
  sessionId?: string;
  ts?: number;
  id?: string;
}

export interface AnalyticsEventValidationResult {
  ok: boolean;
  errors: string[];
}

export interface AnalyticsDispatchOptions {
  enabled: boolean;
  event: AnalyticsEvent;
  onEvent: (event: AnalyticsEvent) => void | Promise<void>;
  schedule?: (task: () => void) => void;
}

const DEFAULT_SCHEDULE = (task: () => void): void => {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task);
  } else {
    setTimeout(task, 0);
  }
};

export function createAnalyticsEvent<Name extends AnalyticsEventName>(
  input: AnalyticsEventInput<Name>
): AnalyticsEvent<Name> {
  return {
    id: input.id ?? createEventId(),
    name: input.name,
    ts: input.ts ?? Date.now(),
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    anonymousId: input.anonymousId,
    sessionId: input.sessionId,
    payload: input.payload,
  };
}

export function dispatchAnalyticsEvent({
  enabled,
  event,
  onEvent,
  schedule = DEFAULT_SCHEDULE,
}: AnalyticsDispatchOptions): boolean {
  if (!enabled) {
    return false;
  }

  schedule(() => {
    try {
      void onEvent(event);
    } catch {
      // Analytics must never block core flows.
    }
  });

  return true;
}

export function validateAnalyticsEvent(value: unknown): AnalyticsEventValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["event must be an object"] };
  }

  if (!isNonEmptyString(value.id)) {
    errors.push("id must be a non-empty string");
  }

  if (!isAnalyticsEventName(value.name)) {
    errors.push("name must be a supported analytics event");
  }

  if (!isFiniteNumber(value.ts) || value.ts < 0) {
    errors.push("ts must be a non-negative number");
  }

  if (value.schemaVersion !== ANALYTICS_SCHEMA_VERSION) {
    errors.push("schemaVersion must match analytics schema");
  }

  if (!isNonEmptyString(value.anonymousId)) {
    errors.push("anonymousId must be a non-empty string");
  }

  if (value.sessionId !== undefined && !isNonEmptyString(value.sessionId)) {
    errors.push("sessionId must be a non-empty string when provided");
  }

  if (!isRecord(value.payload)) {
    errors.push("payload must be an object");
  } else if (isAnalyticsEventName(value.name)) {
    errors.push(...validatePayload(value.name, value.payload));
  }

  return { ok: errors.length === 0, errors };
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return validateAnalyticsEvent(value).ok;
}

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return (
    typeof value === "string"
    && (value === "consent_updated"
      || value === "session_started"
      || value === "session_completed"
      || value === "review_item_answered"
      || value === "route_imported")
  );
}

export function isAnalyticsSessionKind(value: unknown): value is AnalyticsSessionKind {
  return typeof value === "string" && ANALYTICS_SESSION_KINDS.includes(value as AnalyticsSessionKind);
}

export function isTrainingItemType(value: unknown): value is TrainingItemType {
  return typeof value === "string" && TRAINING_ITEM_TYPES.includes(value as TrainingItemType);
}

export function isReviewRating(value: unknown): value is ReviewRating {
  return (
    value === "again"
    || value === "hard"
    || value === "good"
    || value === "easy"
  );
}

export function createEventId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `evt_${Math.random().toString(36).slice(2, 12)}`;
}

function validatePayload(
  name: AnalyticsEventName,
  payload: Record<string, unknown>
): string[] {
  const errors: string[] = [];
  switch (name) {
    case "consent_updated":
      if (typeof payload.enabled !== "boolean") {
        errors.push("consent_updated.enabled must be boolean");
      }
      if (!isConsentSource(payload.source)) {
        errors.push("consent_updated.source must be a known source");
      }
      break;
    case "session_started":
      if (!isAnalyticsSessionKind(payload.sessionKind)) {
        errors.push("session_started.sessionKind must be a known session kind");
      }
      if (payload.plannedItems !== undefined && !isNonNegativeInteger(payload.plannedItems)) {
        errors.push("session_started.plannedItems must be a non-negative integer when provided");
      }
      break;
    case "session_completed":
      if (!isAnalyticsSessionKind(payload.sessionKind)) {
        errors.push("session_completed.sessionKind must be a known session kind");
      }
      if (!isNonNegativeInteger(payload.durationMs)) {
        errors.push("session_completed.durationMs must be a non-negative integer");
      }
      if (!isNonNegativeInteger(payload.reviewCount)) {
        errors.push("session_completed.reviewCount must be a non-negative integer");
      }
      if (!isNonNegativeInteger(payload.correctCount)) {
        errors.push("session_completed.correctCount must be a non-negative integer");
      }
      break;
    case "review_item_answered":
      if (!isTrainingItemType(payload.itemType)) {
        errors.push("review_item_answered.itemType must be a known item type");
      }
      if (typeof payload.correct !== "boolean") {
        errors.push("review_item_answered.correct must be boolean");
      }
      if (!isNonNegativeInteger(payload.responseMs)) {
        errors.push("review_item_answered.responseMs must be a non-negative integer");
      }
      if (payload.rating !== undefined && !isReviewRating(payload.rating)) {
        errors.push("review_item_answered.rating must be a known rating when provided");
      }
      if (payload.intervalDays !== undefined && !isNonNegativeNumber(payload.intervalDays)) {
        errors.push("review_item_answered.intervalDays must be a non-negative number when provided");
      }
      break;
    case "route_imported":
      if (!isImportSource(payload.source)) {
        errors.push("route_imported.source must be a known import source");
      }
      if (!isNonNegativeInteger(payload.routeCount)) {
        errors.push("route_imported.routeCount must be a non-negative integer");
      }
      if (!isNonNegativeInteger(payload.positionCount)) {
        errors.push("route_imported.positionCount must be a non-negative integer");
      }
      if (!isNonNegativeInteger(payload.moveCount)) {
        errors.push("route_imported.moveCount must be a non-negative integer");
      }
      break;
    default:
      errors.push("unsupported analytics event");
  }

  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isConsentSource(value: unknown): value is AnalyticsConsentSource {
  return value === "onboarding" || value === "settings" || value === "system";
}

function isImportSource(value: unknown): value is AnalyticsImportSource {
  return value === "pgn" || value === "manual" || value === "other";
}
