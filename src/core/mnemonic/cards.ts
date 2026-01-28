import type {
  MnemonicAnchor,
  MnemonicCard,
  ToneProfile,
  UUID,
} from "../../../contracts/v1/domain.types";
import type {
  DeterministicMnemonicInput,
  DeterministicMnemonicOutput,
} from "./generator";
import { generateDeterministicMnemonic } from "./generator";
import { isLlmAllowed } from "./encodingPack";

export const MNEMONIC_INVALID_INPUT = "MNEMONIC_INVALID_INPUT" as const;

export interface CreateMnemonicCardInput {
  id?: UUID;
  trainingItemId?: UUID;
  routeStepId?: UUID;
  palaceId: UUID;
  locusId: UUID;
  title: string;
  imageDescription: string;
  story: string;
  anchors: MnemonicAnchor[];
  toneProfile: ToneProfile;
  strengthTags: MnemonicCard["strengthTags"];
  userEdits?: boolean;
  updatedAt?: string;
}

export interface DeterministicMnemonicCardInput extends DeterministicMnemonicInput {
  id?: UUID;
  trainingItemId?: UUID;
  routeStepId?: UUID;
  palaceId: UUID;
  locusId: UUID;
  updatedAt?: string;
}

export interface MnemonicCardEdits {
  title?: string;
  imageDescription?: string;
  story?: string;
  anchors?: MnemonicAnchor[];
  toneProfile?: ToneProfile;
  strengthTags?: MnemonicCard["strengthTags"];
}

export type CreateMnemonicCardResult =
  | { ok: true; value: MnemonicCard }
  | { ok: false; error: typeof MNEMONIC_INVALID_INPUT };

function fnv1a32(input: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash =
      (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) +
        (hash << 24)) >>>
      0;
  }
  return hash >>> 0;
}

function deterministicUuid(parts: string[]): UUID {
  const base = parts.join("|");
  const h1 = fnv1a32(base, 0x811c9dc5);
  const h2 = fnv1a32(base, 0x01000193);
  const h3 = fnv1a32(base, 0x12345678);
  const h4 = fnv1a32(base, 0x9e3779b9);
  const hex = (value: number) => value.toString(16).padStart(8, "0");
  const all = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${all.slice(0, 8)}-${all.slice(8, 12)}-${all.slice(12, 16)}-${all.slice(16, 20)}-${all.slice(20)}`;
}

function hasAnchorData(anchors: MnemonicAnchor[]): boolean {
  return Array.isArray(anchors) && anchors.length > 0;
}

export function createMnemonicCard(
  input: CreateMnemonicCardInput,
): CreateMnemonicCardResult {
  if (!input) {
    return { ok: false, error: MNEMONIC_INVALID_INPUT };
  }
  if (!input.trainingItemId && !input.routeStepId) {
    return { ok: false, error: MNEMONIC_INVALID_INPUT };
  }
  if (!hasAnchorData(input.anchors)) {
    return { ok: false, error: MNEMONIC_INVALID_INPUT };
  }

  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const id =
    input.id ??
    deterministicUuid([
      input.trainingItemId ?? "",
      input.routeStepId ?? "",
      input.palaceId,
      input.locusId,
      input.title,
    ]);

  return {
    ok: true,
    value: {
      id,
      trainingItemId: input.trainingItemId,
      routeStepId: input.routeStepId,
      palaceId: input.palaceId,
      locusId: input.locusId,
      title: input.title,
      imageDescription: input.imageDescription,
      story: input.story,
      anchors: input.anchors,
      userEdits: input.userEdits ?? false,
      toneProfile: input.toneProfile,
      strengthTags: input.strengthTags,
      updatedAt,
    },
  };
}

export function buildDeterministicMnemonicCard(
  input: DeterministicMnemonicCardInput,
): CreateMnemonicCardResult {
  const generated = generateDeterministicMnemonic(input);
  return createMnemonicCard({
    id: input.id,
    trainingItemId: input.trainingItemId,
    routeStepId: input.routeStepId,
    palaceId: input.palaceId,
    locusId: input.locusId,
    title: generated.title,
    imageDescription: generated.imageDescription,
    story: generated.story,
    anchors: generated.anchors,
    toneProfile: generated.toneProfile,
    strengthTags: generated.strengthTags,
    updatedAt: input.updatedAt,
    userEdits: false,
  });
}

function anchorsEqual(left: MnemonicAnchor[], right: MnemonicAnchor[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (anchor, index) =>
      anchor.token === right[index]?.token &&
      anchor.value === right[index]?.value,
  );
}

function tagsEqual(
  left: MnemonicCard["strengthTags"],
  right: MnemonicCard["strengthTags"],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((tag, index) => tag === right[index]);
}

export function applyMnemonicCardEdits(
  card: MnemonicCard,
  edits: MnemonicCardEdits,
  updatedAt = new Date().toISOString(),
): MnemonicCard {
  const next: MnemonicCard = {
    ...card,
    title: edits.title ?? card.title,
    imageDescription: edits.imageDescription ?? card.imageDescription,
    story: edits.story ?? card.story,
    anchors: edits.anchors ?? card.anchors,
    toneProfile: edits.toneProfile ?? card.toneProfile,
    strengthTags: edits.strengthTags ?? card.strengthTags,
    updatedAt,
  };

  const changed =
    next.title !== card.title ||
    next.imageDescription !== card.imageDescription ||
    next.story !== card.story ||
    next.toneProfile !== card.toneProfile ||
    !anchorsEqual(next.anchors, card.anchors) ||
    !tagsEqual(next.strengthTags, card.strengthTags);

  return {
    ...next,
    userEdits: card.userEdits || changed,
  };
}

export function isMnemonicLocalOnly(
  card: MnemonicCard | DeterministicMnemonicOutput,
  encodingPack?: DeterministicMnemonicInput["encodingPack"],
): boolean {
  return !isLlmAllowed(card.toneProfile, encodingPack);
}
