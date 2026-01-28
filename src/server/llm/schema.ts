export const MNEMONIC_SCHEMA_VERSION = "1.0" as const;

export type ToneProfile =
  | "family_friendly"
  | "absurd"
  | "cinematic"
  | "mature_nongraphic";

export type AnchorToken = "from" | "to" | "piece" | "fx" | "plan";

export type StrengthTag = "action" | "sensory" | "surprise" | "clarity";

export interface MnemonicAnchor {
  token: AnchorToken;
  value: string;
}

export interface MnemonicCoaching {
  keyIdea: string;
  howToRehearse: string;
  commonConfusions?: string;
}

export interface MnemonicCard {
  title: string;
  imageDescription: string;
  story: string;
  anchors: MnemonicAnchor[];
  toneProfile: ToneProfile;
  strengthTags: StrengthTag[];
  coaching?: MnemonicCoaching;
}

export interface MnemonicCardResponse {
  version: typeof MNEMONIC_SCHEMA_VERSION;
  cards: MnemonicCard[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const RESPONSE_KEYS = ["version", "cards"] as const;
const CARD_KEYS = [
  "title",
  "imageDescription",
  "story",
  "anchors",
  "toneProfile",
  "strengthTags",
  "coaching",
] as const;
const ANCHOR_KEYS = ["token", "value"] as const;
const COACHING_KEYS = ["keyIdea", "howToRehearse", "commonConfusions"] as const;

const TONE_PROFILES: ReadonlySet<string> = new Set([
  "family_friendly",
  "absurd",
  "cinematic",
  "mature_nongraphic",
]);

const ANCHOR_TOKENS: ReadonlySet<string> = new Set([
  "from",
  "to",
  "piece",
  "fx",
  "plan",
]);

const STRENGTH_TAGS: ReadonlySet<string> = new Set([
  "action",
  "sensory",
  "surprise",
  "clarity",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  obj: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${path}: unexpected key \"${key}\"`);
    }
  }
}

function requireKeys(
  obj: Record<string, unknown>,
  requiredKeys: readonly string[],
  path: string,
  errors: string[],
): void {
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      errors.push(`${path}: missing required key \"${key}\"`);
    }
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validateMnemonicCardResponse(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { ok: false, errors: ["response: expected object"] };
  }

  hasOnlyKeys(value, RESPONSE_KEYS, "response", errors);
  requireKeys(value, RESPONSE_KEYS, "response", errors);

  if (value.version !== MNEMONIC_SCHEMA_VERSION) {
    errors.push(
      `response.version: expected \"${MNEMONIC_SCHEMA_VERSION}\" but got ${JSON.stringify(value.version)}`,
    );
  }

  const cards = value.cards;
  if (!Array.isArray(cards) || cards.length === 0) {
    errors.push("response.cards: expected non-empty array");
  } else {
    cards.forEach((card, index) => {
      const path = `response.cards[${index}]`;
      if (!isPlainObject(card)) {
        errors.push(`${path}: expected object`);
        return;
      }

      hasOnlyKeys(card, CARD_KEYS, path, errors);
      requireKeys(
        card,
        [
          "title",
          "imageDescription",
          "story",
          "anchors",
          "toneProfile",
          "strengthTags",
        ],
        path,
        errors,
      );

      if (!isNonEmptyString(card.title)) {
        errors.push(`${path}.title: expected non-empty string`);
      }
      if (!isNonEmptyString(card.imageDescription)) {
        errors.push(`${path}.imageDescription: expected non-empty string`);
      }
      if (!isNonEmptyString(card.story)) {
        errors.push(`${path}.story: expected non-empty string`);
      }

      if (!TONE_PROFILES.has(card.toneProfile as string)) {
        errors.push(
          `${path}.toneProfile: expected one of ${[
            ...TONE_PROFILES,
          ].join(", ")}`,
        );
      }

      const anchors = card.anchors;
      if (!Array.isArray(anchors) || anchors.length === 0) {
        errors.push(`${path}.anchors: expected non-empty array`);
      } else {
        anchors.forEach((anchor, anchorIndex) => {
          const anchorPath = `${path}.anchors[${anchorIndex}]`;
          if (!isPlainObject(anchor)) {
            errors.push(`${anchorPath}: expected object`);
            return;
          }

          hasOnlyKeys(anchor, ANCHOR_KEYS, anchorPath, errors);
          requireKeys(anchor, ANCHOR_KEYS, anchorPath, errors);

          if (!ANCHOR_TOKENS.has(anchor.token as string)) {
            errors.push(
              `${anchorPath}.token: expected one of ${[
                ...ANCHOR_TOKENS,
              ].join(", ")}`,
            );
          }
          if (!isNonEmptyString(anchor.value)) {
            errors.push(`${anchorPath}.value: expected non-empty string`);
          }
        });
      }

      const strengthTags = card.strengthTags;
      if (!Array.isArray(strengthTags)) {
        errors.push(`${path}.strengthTags: expected array`);
      } else {
        strengthTags.forEach((tag, tagIndex) => {
          if (!STRENGTH_TAGS.has(tag as string)) {
            errors.push(
              `${path}.strengthTags[${tagIndex}]: expected one of ${[
                ...STRENGTH_TAGS,
              ].join(", ")}`,
            );
          }
        });
      }

      if ("coaching" in card) {
        const coaching = card.coaching;
        if (!isPlainObject(coaching)) {
          errors.push(`${path}.coaching: expected object`);
        } else {
          hasOnlyKeys(coaching, COACHING_KEYS, `${path}.coaching`, errors);
          requireKeys(
            coaching,
            ["keyIdea", "howToRehearse"],
            `${path}.coaching`,
            errors,
          );

          if (typeof coaching.keyIdea !== "string") {
            errors.push(`${path}.coaching.keyIdea: expected string`);
          }
          if (typeof coaching.howToRehearse !== "string") {
            errors.push(`${path}.coaching.howToRehearse: expected string`);
          }
          if (
            "commonConfusions" in coaching &&
            typeof coaching.commonConfusions !== "string"
          ) {
            errors.push(`${path}.coaching.commonConfusions: expected string`);
          }
        }
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

export function isMnemonicCardResponse(
  value: unknown,
): value is MnemonicCardResponse {
  return validateMnemonicCardResponse(value).ok;
}

export function assertMnemonicCardResponse(
  value: unknown,
): MnemonicCardResponse {
  const result = validateMnemonicCardResponse(value);
  if (!result.ok) {
    throw new Error(
      `Invalid mnemonic card response: ${result.errors.join("; ")}`,
    );
  }
  return value as MnemonicCardResponse;
}
