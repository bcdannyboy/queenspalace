import { ModerationDecision, moderateText } from "../llm/fallback";

export interface ModerationRequest {
  text: string;
}

export interface ModerationHandlerDeps {
  moderate?: (text: string) => Promise<ModerationDecision> | ModerationDecision;
  logger?: {
    info?: (message: string, meta?: Record<string, unknown>) => void;
    warn?: (message: string, meta?: Record<string, unknown>) => void;
    error?: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export interface ModerationErrorResponse {
  error: string;
  details?: string[];
}

export interface ModerationHandlerResult {
  status: number;
  body: ModerationDecision | ModerationErrorResponse;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModerationRequest(
  body: unknown,
): { ok: true; value: ModerationRequest } | { ok: false; errors: string[] } {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["body: expected object"] };
  }

  const text = body.text;
  if (typeof text !== "string") {
    return { ok: false, errors: ["text: expected string"] };
  }

  return { ok: true, value: { text } };
}

export async function handleModerationPayload(
  body: unknown,
  deps: ModerationHandlerDeps = {},
): Promise<ModerationHandlerResult> {
  const parsed = parseModerationRequest(body);
  if (!parsed.ok) {
    return {
      status: 400,
      body: { error: "INVALID_REQUEST", details: parsed.errors },
    };
  }

  const moderate = deps.moderate ?? ((text: string) => moderateText(text));
  const decision = await Promise.resolve(moderate(parsed.value.text));

  const meta = {
    flagged: decision.flagged,
    categories: decision.categories,
    severity: decision.severity,
    length: parsed.value.text.length,
  };

  if (decision.flagged) {
    deps.logger?.warn?.("Moderation flagged content", meta);
  } else {
    deps.logger?.info?.("Moderation passed", meta);
  }

  return { status: 200, body: decision };
}

export async function postModerate(
  request: Request,
  deps: ModerationHandlerDeps = {},
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: "INVALID_JSON", details: [String(error)] }, 400);
  }

  const result = await handleModerationPayload(body, deps);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function jsonResponse(body: ModerationErrorResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
