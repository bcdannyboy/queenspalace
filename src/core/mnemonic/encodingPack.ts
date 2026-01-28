import type { EncodingPack, ToneProfile } from "../../../contracts/v1/domain.types";

export type PieceColor = "white" | "black";
export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

export const PIECE_TYPE_ORDER: readonly PieceType[] = [
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
  "king",
];

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export interface EncodingPackOverrides {
  name?: string;
  defaultTone?: ToneProfile;
  filePegs?: Array<string | null>;
  rankPegs?: Array<string | null>;
  pieceActors?: Array<string | null>;
  verbsByPieceType?: Record<string, string[]>;
  fxLibrary?: Record<string, string>;
  safetyTier?: EncodingPack["safetyTier"];
}

const DEFAULT_PACK_ID = "pack_animals_props_v1";

const DEFAULT_PACK: EncodingPack = {
  id: DEFAULT_PACK_ID,
  name: "Animals + Props",
  defaultTone: "family_friendly",
  filePegs: [
    "Ant",
    "Bear",
    "Cat",
    "Dog",
    "Elephant",
    "Fox",
    "Gorilla",
    "Hippo",
  ],
  rankPegs: [
    "Doormat",
    "Shoe",
    "Table",
    "Chair",
    "Bed",
    "Sink",
    "Bookshelf",
    "Chandelier",
  ],
  pieceActors: [
    "White Hiker",
    "White Ninja",
    "White Archer",
    "White Robot",
    "White Queen",
    "White King",
    "Black Hiker",
    "Black Ninja",
    "Black Wizard",
    "Black Robot",
    "Black Queen",
    "Black King",
  ],
  verbsByPieceType: {
    pawn: ["marches", "steps", "nudges", "pushes"],
    knight: ["leaps", "vaults", "pounces", "springs"],
    bishop: ["glides", "slices", "sweeps", "slides"],
    rook: ["rumbles", "slides", "thunders", "stomps"],
    queen: ["whirls", "commands", "strikes", "soars"],
    king: ["steps", "claims", "advances", "moves"],
  },
  fxLibrary: {
    quiet: "Calm, clean motion.",
    capture: "A playful capture with a burst of confetti.",
    check: "A spotlight flashes on the king.",
    mate: "A dramatic final spotlight freezes the scene.",
    castle_kingside: "A small gate swings open to the right.",
    castle_queenside: "A stone gate swings open to the left.",
    promotion: "A crown pops into place with sparkles.",
    en_passant: "A quick sidestep leaves a puff of dust.",
  },
  safetyTier: "G",
};

const ENCODING_PACKS: EncodingPack[] = [DEFAULT_PACK];

export function listEncodingPacks(): EncodingPack[] {
  return ENCODING_PACKS.map((pack) => ({ ...pack }));
}

export function getEncodingPackById(id: string | undefined | null): EncodingPack | null {
  if (!id) {
    return null;
  }
  const found = ENCODING_PACKS.find((pack) => pack.id === id);
  return found ? { ...found } : null;
}

export function resolveEncodingPack(id?: string | null): EncodingPack {
  return getEncodingPackById(id) ?? { ...DEFAULT_PACK };
}

function applyOverridesList(base: string[], overrides?: Array<string | null>): string[] {
  if (!overrides || overrides.length !== base.length) {
    return [...base];
  }
  return base.map((value, index) => overrides[index] ?? value);
}

export function applyEncodingPackOverrides(
  base: EncodingPack,
  overrides?: EncodingPackOverrides,
): EncodingPack {
  if (!overrides) {
    return { ...base };
  }

  return {
    ...base,
    name: overrides.name ?? base.name,
    defaultTone: overrides.defaultTone ?? base.defaultTone,
    filePegs: applyOverridesList(base.filePegs, overrides.filePegs),
    rankPegs: applyOverridesList(base.rankPegs, overrides.rankPegs),
    pieceActors: applyOverridesList(base.pieceActors, overrides.pieceActors),
    verbsByPieceType: overrides.verbsByPieceType
      ? { ...base.verbsByPieceType, ...overrides.verbsByPieceType }
      : { ...base.verbsByPieceType },
    fxLibrary: overrides.fxLibrary
      ? { ...base.fxLibrary, ...overrides.fxLibrary }
      : { ...base.fxLibrary },
    safetyTier: overrides.safetyTier ?? base.safetyTier,
  };
}

export function isValidEncodingPack(pack: EncodingPack): boolean {
  if (!pack) {
    return false;
  }
  if (pack.filePegs.length !== FILES.length) {
    return false;
  }
  if (pack.rankPegs.length !== RANKS.length) {
    return false;
  }
  if (pack.pieceActors.length !== PIECE_TYPE_ORDER.length * 2) {
    return false;
  }
  for (const pieceType of PIECE_TYPE_ORDER) {
    const verbs = pack.verbsByPieceType[pieceType];
    if (!Array.isArray(verbs) || verbs.length === 0) {
      return false;
    }
  }
  return true;
}

export function getFileIndex(file: string): number {
  return FILES.indexOf(file as (typeof FILES)[number]);
}

export function getRankIndex(rank: string): number {
  return RANKS.indexOf(rank as (typeof RANKS)[number]);
}

export function getPieceActorIndex(pieceType: PieceType, color: PieceColor): number {
  const baseIndex = PIECE_TYPE_ORDER.indexOf(pieceType);
  const offset = color === "white" ? 0 : PIECE_TYPE_ORDER.length;
  return baseIndex >= 0 ? baseIndex + offset : 0;
}

export function isLocalOnlyTone(toneProfile: ToneProfile): boolean {
  return toneProfile === "explicit_local_only";
}

export function isLocalOnlyPack(pack: EncodingPack): boolean {
  return pack.safetyTier === "LocalOnlyExplicit";
}

export function isLlmAllowed(toneProfile: ToneProfile, pack?: EncodingPack): boolean {
  if (isLocalOnlyTone(toneProfile)) {
    return false;
  }
  if (pack && isLocalOnlyPack(pack)) {
    return false;
  }
  return true;
}

export function resolveToneProfile(
  toneProfile: ToneProfile | undefined,
  pack: EncodingPack,
): ToneProfile {
  if (isLocalOnlyPack(pack)) {
    return "explicit_local_only";
  }
  return toneProfile ?? pack.defaultTone;
}

export const DEFAULT_ENCODING_PACK = { ...DEFAULT_PACK } as const;
export const DEFAULT_ENCODING_PACK_ID = DEFAULT_PACK_ID;
