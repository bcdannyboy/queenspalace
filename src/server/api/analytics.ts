import {
  AnalyticsEvent,
  AnalyticsEventValidationResult,
  validateAnalyticsEvent,
} from "../../core/analytics/events";

export interface AnalyticsHandlerDeps {
  enabled?: boolean;
  ingest?: (events: AnalyticsEvent[]) => void | Promise<void>;
  validate?: (value: unknown) => AnalyticsEventValidationResult;
  maxBatchSize?: number;
  maxErrorDetails?: number;
  schedule?: (task: () => void) => void;
  logger?: {
    info?: (message: string, meta?: Record<string, unknown>) => void;
    warn?: (message: string, meta?: Record<string, unknown>) => void;
    error?: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export interface AnalyticsErrorResponse {
  error: string;
  details?: string[];
}

export interface AnalyticsValidationError {
  index: number;
  errors: string[];
}

export interface AnalyticsIngestResponse {
  accepted: number;
  dropped: number;
  disabled: boolean;
  errors?: AnalyticsValidationError[];
}

export interface AnalyticsHandlerResult {
  status: number;
  body: AnalyticsIngestResponse | AnalyticsErrorResponse;
}

const DEFAULT_MAX_BATCH_SIZE = 100;
const DEFAULT_MAX_ERROR_DETAILS = 25;

const DEFAULT_SCHEDULE = (task: () => void): void => {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task);
  } else {
    setTimeout(task, 0);
  }
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAnalyticsRequest(
  body: unknown,
): { ok: true; events: unknown[] } | { ok: false; errors: string[] } {
  if (Array.isArray(body)) {
    return { ok: true, events: body };
  }

  if (!isPlainObject(body)) {
    return { ok: false, errors: ["body: expected object or array"] };
  }

  if (Array.isArray(body.events)) {
    return { ok: true, events: body.events };
  }

  return { ok: true, events: [body] };
}

export async function handleAnalyticsPayload(
  body: unknown,
  deps: AnalyticsHandlerDeps = {},
): Promise<AnalyticsHandlerResult> {
  const parsed = parseAnalyticsRequest(body);
  if (!parsed.ok) {
    return {
      status: 400,
      body: { error: "INVALID_REQUEST", details: parsed.errors },
    };
  }

  const maxBatchSize = deps.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
  const validate = deps.validate ?? validateAnalyticsEvent;
  const maxErrorDetails = deps.maxErrorDetails ?? DEFAULT_MAX_ERROR_DETAILS;

  const incoming = parsed.events.slice(0, maxBatchSize);
  const overLimit = parsed.events.length - incoming.length;

  const accepted: AnalyticsEvent[] = [];
  const errors: AnalyticsValidationError[] = [];

  for (let i = 0; i < incoming.length; i += 1) {
    const candidate = incoming[i];
    const result = validate(candidate);
    if (result.ok) {
      accepted.push(candidate as AnalyticsEvent);
    } else if (errors.length < maxErrorDetails) {
      errors.push({ index: i, errors: result.errors });
    }
  }

  const invalidCount = incoming.length - accepted.length;
  const dropped = overLimit + invalidCount;

  const hasIngest = typeof deps.ingest === "function";
  const enabled = deps.enabled ?? hasIngest;
  const canIngest = enabled && hasIngest;

  if (canIngest && accepted.length > 0) {
    const schedule = deps.schedule ?? DEFAULT_SCHEDULE;
    schedule(() => {
      try {
        const result = deps.ingest?.(accepted);
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch((error) => {
            deps.logger?.warn?.("Analytics ingest failed", {
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
      } catch (error) {
        deps.logger?.warn?.("Analytics ingest threw", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  } else if (accepted.length > 0) {
    deps.logger?.info?.("Analytics disabled; dropping events", {
      dropped: accepted.length,
    });
  }

  if (errors.length > 0) {
    deps.logger?.warn?.("Analytics payload validation failed", {
      invalidCount,
      dropped,
    });
  }

  return {
    status: 202,
    body: {
      accepted: accepted.length,
      dropped,
      disabled: !canIngest,
      errors: errors.length > 0 ? errors : undefined,
    },
  };
}

export async function postAnalytics(
  request: Request,
  deps: AnalyticsHandlerDeps = {},
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: "INVALID_JSON", details: [String(error)] }, 400);
  }

  const result = await handleAnalyticsPayload(body, deps);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function jsonResponse(body: AnalyticsErrorResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
