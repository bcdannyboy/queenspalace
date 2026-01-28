import {
  MNEMONIC_SCHEMA_VERSION,
  MnemonicAnchor,
  MnemonicCardResponse,
  ToneProfile,
  validateMnemonicCardResponse,
} from "../llm/schema";

export interface MnemonicRequest {
  trainingItemId: string;
  fen: string;
  uci: string;
  san: string;
  toneProfile: ToneProfile;
  encodingPackId: string;
  userNotes?: string;
}

export type LlmErrorCode =
  | "LLM_BLOCKED_TIER4"
  | "LLM_INPUT_FLAGGED"
  | "LLM_OUTPUT_FLAGGED"
  | "LLM_UNAVAILABLE";

export interface MnemonicHandlerDeps {
  generate?: (request: MnemonicRequest) => Promise<unknown>;
  fallback?: (request: MnemonicRequest, reason: LlmErrorCode) => MnemonicCardResponse;
  validate?: (value: unknown) => { ok: boolean; errors: string[] };
  timeoutMs?: number;
  logger?: {
    info?: (message: string, meta?: Record<string, unknown>) => void;
    warn?: (message: string, meta?: Record<string, unknown>) => void;
    error?: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export interface MnemonicErrorResponse {
  error: string;
  details?: string[];
}

export interface MnemonicHandlerResult {
  status: number;
  body: MnemonicCardResponse | MnemonicErrorResponse;
  errorCode?: LlmErrorCode;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const TONE_PROFILES: ReadonlySet<string> = new Set([
  "family_friendly",
  "absurd",
  "cinematic",
  "mature_nongraphic",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMnemonicRequest(
  body: unknown,
): { ok: true; value: MnemonicRequest } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!isPlainObject(body)) {
    return { ok: false, errors: ["body: expected object"] };
  }

  const getString = (key: keyof MnemonicRequest): string | undefined => {
    const value = body[key as string];
    if (typeof value !== "string") {
      errors.push(`${String(key)}: expected string`);
      return undefined;
    }
    return value;
  };

  const trainingItemId = getString("trainingItemId");
  const fen = getString("fen");
  const uci = getString("uci");
  const san = getString("san");
  const toneProfileValue = body.toneProfile;
  const encodingPackId = getString("encodingPackId");

  if (!TONE_PROFILES.has(toneProfileValue as string)) {
    errors.push(
      `toneProfile: expected one of ${[...TONE_PROFILES].join(", ")}`,
    );
  }

  const userNotesValue = body.userNotes;
  if (userNotesValue !== undefined && typeof userNotesValue !== "string") {
    errors.push("userNotes: expected string when provided");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      trainingItemId: trainingItemId ?? "",
      fen: fen ?? "",
      uci: uci ?? "",
      san: san ?? "",
      toneProfile: toneProfileValue as ToneProfile,
      encodingPackId: encodingPackId ?? "",
      userNotes: userNotesValue as string | undefined,
    },
  };
}

function extractUciSquares(uci: string): { from?: string; to?: string } {
  const trimmed = uci.trim();
  if (trimmed.length >= 4) {
    return { from: trimmed.slice(0, 2), to: trimmed.slice(2, 4) };
  }
  return {};
}

function buildFallbackAnchors(uci: string): MnemonicAnchor[] {
  const { from, to } = extractUciSquares(uci);
  const anchors: MnemonicAnchor[] = [];
  if (from) {
    anchors.push({ token: "from", value: from });
  }
  if (to) {
    anchors.push({ token: "to", value: to });
  }
  if (anchors.length === 0) {
    anchors.push({ token: "from", value: "unknown" });
  }
  return anchors;
}

function defaultFallback(
  request: MnemonicRequest,
  _reason: LlmErrorCode,
): MnemonicCardResponse {
  const moveLabel = request.san.trim() || request.uci.trim() || "move";
  const anchors = buildFallbackAnchors(request.uci);

  return {
    version: MNEMONIC_SCHEMA_VERSION,
    cards: [
      {
        title: "Deterministic fallback",
        imageDescription: `Visualize ${moveLabel} with clear, simple imagery.`,
        story: `A calm, clear scene highlights ${moveLabel} so it is easy to remember.`,
        anchors,
        toneProfile: request.toneProfile,
        strengthTags: ["clarity"],
      },
    ],
  };
}

function ensureValidResponse(
  candidate: MnemonicCardResponse,
  request: MnemonicRequest,
  reason: LlmErrorCode,
  validate: (value: unknown) => { ok: boolean; errors: string[] },
): MnemonicCardResponse {
  const validation = validate(candidate);
  if (validation.ok) {
    return candidate;
  }

  const fallback = defaultFallback(request, reason);
  const fallbackValidation = validate(fallback);
  if (!fallbackValidation.ok) {
    throw new Error(
      `Fallback response failed schema validation: ${fallbackValidation.errors.join("; ")}`,
    );
  }
  return fallback;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("LLM_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function handleMnemonicPayload(
  body: unknown,
  deps: MnemonicHandlerDeps = {},
): Promise<MnemonicHandlerResult> {
  const parsed = parseMnemonicRequest(body);
  if (!parsed.ok) {
    return {
      status: 400,
      body: { error: "INVALID_REQUEST", details: parsed.errors },
    };
  }

  const request = parsed.value;
  const validate = deps.validate ?? validateMnemonicCardResponse;
  const fallbackFn = deps.fallback ?? defaultFallback;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!deps.generate) {
    const fallback = ensureValidResponse(
      fallbackFn(request, "LLM_UNAVAILABLE"),
      request,
      "LLM_UNAVAILABLE",
      validate,
    );
    return { status: 200, body: fallback, errorCode: "LLM_UNAVAILABLE" };
  }

  try {
    const output = await withTimeout(deps.generate(request), timeoutMs);
    const validation = validate(output);
    if (!validation.ok) {
      deps.logger?.warn?.("LLM output failed schema validation", {
        errors: validation.errors,
      });
      const fallback = ensureValidResponse(
        fallbackFn(request, "LLM_OUTPUT_FLAGGED"),
        request,
        "LLM_OUTPUT_FLAGGED",
        validate,
      );
      return { status: 200, body: fallback, errorCode: "LLM_OUTPUT_FLAGGED" };
    }

    return { status: 200, body: output as MnemonicCardResponse };
  } catch (error) {
    deps.logger?.warn?.("LLM generation failed; using fallback", {
      error: error instanceof Error ? error.message : String(error),
    });
    const fallback = ensureValidResponse(
      fallbackFn(request, "LLM_UNAVAILABLE"),
      request,
      "LLM_UNAVAILABLE",
      validate,
    );
    return { status: 200, body: fallback, errorCode: "LLM_UNAVAILABLE" };
  }
}

export async function postMnemonic(
  request: Request,
  deps: MnemonicHandlerDeps = {},
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(
      { error: "INVALID_JSON", details: [String(error)] },
      400,
    );
  }

  const result = await handleMnemonicPayload(body, deps);
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
  });
  if (result.errorCode) {
    headers.set("x-llm-error", result.errorCode);
  }
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers,
  });
}

function jsonResponse(body: MnemonicErrorResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
