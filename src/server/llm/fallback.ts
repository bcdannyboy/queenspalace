import {
  MNEMONIC_SCHEMA_VERSION,
  MnemonicAnchor,
  MnemonicCardResponse,
  ToneProfile as SchemaToneProfile,
  validateMnemonicCardResponse,
} from "./schema";

export type ToneProfile = SchemaToneProfile | "explicit_local_only";

export type ModerationSeverity = "low" | "medium" | "high";

export interface ModerationDecision {
  flagged: boolean;
  categories: string[];
  severity: ModerationSeverity;
}

export type ModerationErrorCode =
  | "MODERATION_FLAGGED_INPUT"
  | "MODERATION_FLAGGED_OUTPUT"
  | "MODERATION_TIER4_BLOCK";

export type LlmErrorCode =
  | "LLM_BLOCKED_TIER4"
  | "LLM_INPUT_FLAGGED"
  | "LLM_OUTPUT_FLAGGED"
  | "LLM_UNAVAILABLE";

export interface FallbackRequest {
  trainingItemId?: string;
  fen: string;
  uci: string;
  san: string;
  toneProfile: ToneProfile;
  encodingPackId?: string;
  userNotes?: string;
}

export interface FallbackDeps {
  generate?: (request: FallbackRequest) => Promise<unknown>;
  moderate?: (text: string) => Promise<ModerationDecision> | ModerationDecision;
  validate?: (value: unknown) => { ok: boolean; errors: string[] };
  logger?: {
    info?: (message: string, meta?: Record<string, unknown>) => void;
    warn?: (message: string, meta?: Record<string, unknown>) => void;
    error?: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export interface FallbackPipelineResult {
  response: MnemonicCardResponse;
  errorCode?: LlmErrorCode;
  moderation?: ModerationDecision;
  moderationError?: ModerationErrorCode;
  fallbackStep: "llm" | "sanitized" | "downgraded" | "deterministic";
}

interface ModerationRule {
  category: string;
  severity: ModerationSeverity;
  pattern: RegExp;
}

const MODERATION_RULES: ModerationRule[] = [
  { category: "sexual", severity: "high", pattern: /\b(sex|nude|naked|porn)\b/i },
  {
    category: "violence",
    severity: "high",
    pattern: /\b(kill|murder|blood|shoot|stab|decapitate)\b/i,
  },
  {
    category: "self_harm",
    severity: "high",
    pattern: /\b(suicide|self-harm|self harm)\b/i,
  },
  {
    category: "drugs",
    severity: "medium",
    pattern: /\b(cocaine|heroin|meth|fentanyl)\b/i,
  },
  {
    category: "hate",
    severity: "medium",
    pattern: /\b(genocide|ethnic cleansing)\b/i,
  },
];

const SEVERITY_ORDER: Record<ModerationSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const SEVERITY_BY_RANK: ModerationSeverity[] = ["low", "medium", "high"];

export function isExplicitLocalOnly(toneProfile: ToneProfile): boolean {
  return toneProfile === "explicit_local_only";
}

export function normalizeToneProfile(toneProfile: ToneProfile): SchemaToneProfile {
  return toneProfile === "explicit_local_only" ? "family_friendly" : toneProfile;
}

export function downgradeToneProfile(toneProfile: ToneProfile): SchemaToneProfile {
  if (toneProfile === "explicit_local_only") {
    return "family_friendly";
  }

  const order: SchemaToneProfile[] = [
    "family_friendly",
    "absurd",
    "cinematic",
    "mature_nongraphic",
  ];

  const normalized = normalizeToneProfile(toneProfile);
  const index = order.indexOf(normalized);
  return order[Math.max(0, index - 1)];
}

export function moderateText(text: string): ModerationDecision {
  const categories = new Set<string>();
  let severityRank = 0;

  for (const rule of MODERATION_RULES) {
    if (rule.pattern.test(text)) {
      categories.add(rule.category);
      severityRank = Math.max(severityRank, SEVERITY_ORDER[rule.severity]);
    }
  }

  const flagged = categories.size > 0;
  return {
    flagged,
    categories: [...categories],
    severity: flagged ? SEVERITY_BY_RANK[severityRank] : "low",
  };
}

export function sanitizeText(text: string): string {
  let sanitized = text;
  for (const rule of MODERATION_RULES) {
    const globalPattern = new RegExp(rule.pattern.source, "gi");
    sanitized = sanitized.replace(globalPattern, "[redacted]");
  }
  return sanitized.replace(/\s{2,}/g, " ").trim();
}

export function sanitizeRequest(request: FallbackRequest): FallbackRequest {
  if (!request.userNotes) {
    return request;
  }
  return {
    ...request,
    userNotes: sanitizeText(request.userNotes),
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

function buildModerationInputText(request: FallbackRequest): string {
  return [request.userNotes, request.san, request.uci]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ");
}

function flattenMnemonicResponse(response: MnemonicCardResponse): string {
  const fragments: string[] = [];
  for (const card of response.cards) {
    fragments.push(card.title, card.imageDescription, card.story);
    for (const anchor of card.anchors) {
      fragments.push(anchor.value);
    }
    if (card.coaching) {
      fragments.push(card.coaching.keyIdea, card.coaching.howToRehearse);
      if (card.coaching.commonConfusions) {
        fragments.push(card.coaching.commonConfusions);
      }
    }
  }
  return fragments.filter(Boolean).join(" ");
}

function logModerationDecision(
  logger: FallbackDeps["logger"] | undefined,
  stage: string,
  decision: ModerationDecision,
  textLength: number,
): void {
  const meta = {
    stage,
    flagged: decision.flagged,
    categories: decision.categories,
    severity: decision.severity,
    length: textLength,
  };
  if (decision.flagged) {
    logger?.warn?.("Moderation flagged content", meta);
  } else {
    logger?.info?.("Moderation passed", meta);
  }
}

export function buildDeterministicFallback(
  request: FallbackRequest,
  title = "Deterministic fallback",
): MnemonicCardResponse {
  const moveLabel = request.san.trim() || request.uci.trim() || "move";
  const anchors = buildFallbackAnchors(request.uci);
  const toneProfile = normalizeToneProfile(request.toneProfile);

  return {
    version: MNEMONIC_SCHEMA_VERSION,
    cards: [
      {
        title,
        imageDescription: `Visualize ${moveLabel} with clear, simple imagery.`,
        story: `A calm, clear scene highlights ${moveLabel} so it is easy to remember.`,
        anchors,
        toneProfile,
        strengthTags: ["clarity"],
      },
    ],
  };
}

function ensureValidResponse(
  candidate: unknown,
  request: FallbackRequest,
  validate: (value: unknown) => { ok: boolean; errors: string[] },
): MnemonicCardResponse {
  const validation = validate(candidate);
  if (validation.ok) {
    return candidate as MnemonicCardResponse;
  }

  const fallback = buildDeterministicFallback(request);
  const fallbackValidation = validate(fallback);
  if (!fallbackValidation.ok) {
    throw new Error(
      `Fallback response failed schema validation: ${fallbackValidation.errors.join("; ")}`,
    );
  }
  return fallback;
}

interface AttemptSuccess {
  ok: true;
  response: MnemonicCardResponse;
}

interface AttemptFailure {
  ok: false;
  reason: "input_flagged" | "output_flagged" | "llm_error";
  decision?: ModerationDecision;
}

type AttemptResult = AttemptSuccess | AttemptFailure;

async function attemptGenerateWithModeration(
  request: FallbackRequest,
  deps: Required<Pick<FallbackDeps, "generate" | "moderate" | "logger">>,
  validate: (value: unknown) => { ok: boolean; errors: string[] },
  stage: string,
): Promise<AttemptResult> {
  const inputText = buildModerationInputText(request);
  const preDecision = await Promise.resolve(deps.moderate(inputText));
  logModerationDecision(deps.logger, `${stage}:pre`, preDecision, inputText.length);
  if (preDecision.flagged) {
    return { ok: false, reason: "input_flagged", decision: preDecision };
  }

  let output: unknown;
  try {
    output = await deps.generate(request);
  } catch (error) {
    deps.logger?.warn?.("LLM generation failed", {
      stage,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "llm_error" };
  }

  const validation = validate(output);
  if (!validation.ok) {
    deps.logger?.warn?.("LLM output failed schema validation", {
      stage,
      errors: validation.errors,
    });
    return { ok: false, reason: "output_flagged" };
  }

  const response = output as MnemonicCardResponse;
  const outputText = flattenMnemonicResponse(response);
  const postDecision = await Promise.resolve(deps.moderate(outputText));
  logModerationDecision(
    deps.logger,
    `${stage}:post`,
    postDecision,
    outputText.length,
  );
  if (postDecision.flagged) {
    return { ok: false, reason: "output_flagged", decision: postDecision };
  }

  return { ok: true, response };
}

async function runFallbackLadder(
  request: FallbackRequest,
  deps: Required<Pick<FallbackDeps, "generate" | "moderate" | "logger">>,
  validate: (value: unknown) => { ok: boolean; errors: string[] },
  errorCode: LlmErrorCode,
  moderationError: ModerationErrorCode,
  moderation: ModerationDecision | undefined,
): Promise<FallbackPipelineResult> {
  const sanitizedRequest = sanitizeRequest(request);
  const sanitizedAttempt = await attemptGenerateWithModeration(
    sanitizedRequest,
    deps,
    validate,
    "sanitized",
  );
  if (sanitizedAttempt.ok) {
    return {
      response: sanitizedAttempt.response,
      errorCode,
      moderationError,
      moderation,
      fallbackStep: "sanitized",
    };
  }

  if (sanitizedAttempt.reason === "llm_error") {
    const response = ensureValidResponse(
      buildDeterministicFallback(request),
      request,
      validate,
    );
    return {
      response,
      errorCode,
      moderationError,
      moderation,
      fallbackStep: "deterministic",
    };
  }

  const downgradedRequest: FallbackRequest = {
    ...sanitizedRequest,
    toneProfile: downgradeToneProfile(request.toneProfile),
  };

  const downgradedAttempt = await attemptGenerateWithModeration(
    downgradedRequest,
    deps,
    validate,
    "downgraded",
  );
  if (downgradedAttempt.ok) {
    return {
      response: downgradedAttempt.response,
      errorCode,
      moderationError,
      moderation,
      fallbackStep: "downgraded",
    };
  }

  const response = ensureValidResponse(
    buildDeterministicFallback(request),
    request,
    validate,
  );
  return {
    response,
    errorCode,
    moderationError,
    moderation,
    fallbackStep: "deterministic",
  };
}

export async function generateWithModeration(
  request: FallbackRequest,
  deps: FallbackDeps = {},
): Promise<FallbackPipelineResult> {
  const validate = deps.validate ?? validateMnemonicCardResponse;

  if (isExplicitLocalOnly(request.toneProfile)) {
    const response = ensureValidResponse(
      buildDeterministicFallback(request),
      request,
      validate,
    );
    deps.logger?.info?.("LLM bypassed for explicit_local_only tier", {
      tier: request.toneProfile,
    });
    return {
      response,
      errorCode: "LLM_BLOCKED_TIER4",
      moderationError: "MODERATION_TIER4_BLOCK",
      fallbackStep: "deterministic",
    };
  }

  if (!deps.generate) {
    const response = ensureValidResponse(
      buildDeterministicFallback(request),
      request,
      validate,
    );
    return {
      response,
      errorCode: "LLM_UNAVAILABLE",
      fallbackStep: "deterministic",
    };
  }

  const moderate = deps.moderate ?? ((text: string) => moderateText(text));
  const logger = deps.logger;

  const attempt = await attemptGenerateWithModeration(
    request,
    { generate: deps.generate, moderate, logger },
    validate,
    "primary",
  );

  if (attempt.ok) {
    return { response: attempt.response, fallbackStep: "llm" };
  }

  if (attempt.reason === "llm_error") {
    const response = ensureValidResponse(
      buildDeterministicFallback(request),
      request,
      validate,
    );
    return {
      response,
      errorCode: "LLM_UNAVAILABLE",
      fallbackStep: "deterministic",
    };
  }

  if (attempt.reason === "input_flagged") {
    return runFallbackLadder(
      request,
      { generate: deps.generate, moderate, logger },
      validate,
      "LLM_INPUT_FLAGGED",
      "MODERATION_FLAGGED_INPUT",
      attempt.decision,
    );
  }

  return runFallbackLadder(
    request,
    { generate: deps.generate, moderate, logger },
    validate,
    "LLM_OUTPUT_FLAGGED",
    "MODERATION_FLAGGED_OUTPUT",
    attempt.decision,
  );
}
