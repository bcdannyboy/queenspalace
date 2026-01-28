import type {
  EncodingPack,
  MnemonicAnchor,
  MnemonicCard,
  ToneProfile,
} from "../../../contracts/v1/domain.types";
import { moveIntentFromUci } from "../chess/intent";
import {
  getFileIndex,
  getPieceActorIndex,
  getRankIndex,
  resolveToneProfile,
  PieceColor,
  PieceType,
} from "./encodingPack";

export interface DeterministicMnemonicInput {
  uci: string;
  san?: string;
  fen?: string;
  toneProfile?: ToneProfile;
  encodingPack: EncodingPack;
}

export interface DeterministicMnemonicOutput {
  title: string;
  imageDescription: string;
  story: string;
  anchors: MnemonicAnchor[];
  toneProfile: ToneProfile;
  strengthTags: MnemonicCard["strengthTags"];
}

const PIECE_LABELS: Record<PieceType, string> = {
  pawn: "Pawn",
  knight: "Knight",
  bishop: "Bishop",
  rook: "Rook",
  queen: "Queen",
  king: "King",
};

const PIECE_SYMBOLS: Record<PieceType, string> = {
  pawn: "P",
  knight: "N",
  bishop: "B",
  rook: "R",
  queen: "Q",
  king: "K",
};

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

function pickFromList(values: string[], seed: string): string {
  if (!Array.isArray(values) || values.length === 0) {
    return "";
  }
  const hash = fnv1a32(seed);
  return values[hash % values.length];
}

function parseFenSide(fen?: string): PieceColor {
  if (!fen) {
    return "white";
  }
  const parts = fen.trim().split(/\s+/);
  if (parts.length > 1 && parts[1] === "b") {
    return "black";
  }
  return "white";
}

function parsePieceType(san: string | undefined): PieceType {
  const trimmed = (san ?? "").trim();
  if (!trimmed) {
    return "pawn";
  }
  if (trimmed.startsWith("O-O-O") || trimmed.startsWith("O-O")) {
    return "king";
  }
  const first = trimmed[0];
  switch (first) {
    case "K":
      return "king";
    case "Q":
      return "queen";
    case "R":
      return "rook";
    case "B":
      return "bishop";
    case "N":
      return "knight";
    default:
      return "pawn";
  }
}

function parseFx(san: string | undefined): {
  tokens: string[];
  castleSide?: "kingside" | "queenside";
  promotionPiece?: string;
} {
  const trimmed = (san ?? "").trim();
  const tokens: string[] = [];
  let castleSide: "kingside" | "queenside" | undefined;
  if (trimmed.startsWith("O-O-O")) {
    tokens.push("castle_queenside");
    castleSide = "queenside";
  } else if (trimmed.startsWith("O-O")) {
    tokens.push("castle_kingside");
    castleSide = "kingside";
  }
  if (trimmed.includes("x")) {
    tokens.push("capture");
  }
  if (trimmed.includes("e.p.")) {
    tokens.push("en_passant");
  }
  const promotionMatch = trimmed.match(/=([QRBN])/);
  if (promotionMatch) {
    tokens.push("promotion");
  }
  if (trimmed.endsWith("+")) {
    tokens.push("check");
  } else if (trimmed.endsWith("#")) {
    tokens.push("mate");
  }
  if (tokens.length === 0) {
    tokens.push("quiet");
  }
  return { tokens, castleSide, promotionPiece: promotionMatch?.[1] };
}

function describeSquare(
  square: string | undefined,
  pack: EncodingPack,
): { label: string; filePeg?: string; rankPeg?: string } {
  if (!square || square.length < 2) {
    return { label: "unknown square" };
  }
  const file = square[0];
  const rank = square[1];
  const fileIndex = getFileIndex(file);
  const rankIndex = getRankIndex(rank);
  if (fileIndex < 0 || rankIndex < 0) {
    return { label: square };
  }
  const filePeg = pack.filePegs[fileIndex];
  const rankPeg = pack.rankPegs[rankIndex];
  return {
    label: `${filePeg} ${rankPeg}`,
    filePeg,
    rankPeg,
  };
}

function buildStrengthTags(
  toneProfile: ToneProfile,
  fxTokens: string[],
): MnemonicCard["strengthTags"] {
  const tags = new Set<MnemonicCard["strengthTags"][number]>();
  tags.add("action");
  tags.add("clarity");
  if (fxTokens.some((token) => token !== "quiet")) {
    tags.add("surprise");
  }
  if (toneProfile === "cinematic" || toneProfile === "absurd") {
    tags.add("sensory");
  }
  return Array.from(tags);
}

export function generateDeterministicMnemonic(
  input: DeterministicMnemonicInput,
): DeterministicMnemonicOutput {
  const pack = input.encodingPack;
  const toneProfile = resolveToneProfile(input.toneProfile, pack);
  const moveIntent = moveIntentFromUci(input.uci.trim());
  const fromSquare = moveIntent?.from;
  const toSquare = moveIntent?.to;
  const pieceType = parsePieceType(input.san);
  const color = parseFenSide(input.fen);
  const pieceLabel = PIECE_LABELS[pieceType];
  const pieceSymbol = PIECE_SYMBOLS[pieceType];
  const actorIndex = getPieceActorIndex(pieceType, color);
  const actor = pack.pieceActors[actorIndex] ?? `${color} ${pieceLabel}`;
  const verbList = pack.verbsByPieceType[pieceType] ?? ["moves"];
  const verbSeed = `${input.uci}|${input.san ?? ""}|${pack.id}`;
  const verb = pickFromList(verbList, verbSeed) || "moves";
  const fx = parseFx(input.san);

  const fromLabel = describeSquare(fromSquare, pack);
  const toLabel = describeSquare(toSquare, pack);
  const fxText = fx.tokens
    .map((token) => pack.fxLibrary[token] ?? token)
    .join(" ");

  const colorLabel = color === "white" ? "White" : "Black";
  const titleBase = `${colorLabel} ${pieceLabel}`;
  const title = fx.castleSide
    ? `${colorLabel} castles ${fx.castleSide}`
    : fx.promotionPiece
      ? `${titleBase} promotes to ${fx.promotionPiece} on ${toSquare ?? "?"}`
      : `${titleBase} to ${toSquare ?? "?"}`;

  let imageDescription = `${actor} ${verb} from the ${fromLabel.label} to the ${toLabel.label}.`;
  let story = `In a vivid scene, ${actor} ${verb} from the ${fromLabel.label} to the ${toLabel.label}.`;

  if (fx.castleSide) {
    imageDescription = `${actor} moves through a ${fx.castleSide} gate while a rook slides into place.`;
    story = `A ${fx.castleSide} gate opens as ${actor} castles, and the rook tucks in beside it.`;
  }

  if (fxText) {
    imageDescription = `${imageDescription} ${fxText}`.trim();
    story = `${story} ${fxText}`.trim();
  }

  const anchors: MnemonicAnchor[] = [];
  if (fromSquare) {
    anchors.push({ token: "from", value: fromSquare });
  }
  if (toSquare) {
    anchors.push({ token: "to", value: toSquare });
  }
  anchors.push({ token: "piece", value: pieceSymbol });
  fx.tokens.forEach((token) => anchors.push({ token: "fx", value: token }));

  if (anchors.length === 0) {
    anchors.push({ token: "from", value: "unknown" });
  }

  return {
    title,
    imageDescription,
    story,
    anchors,
    toneProfile,
    strengthTags: buildStrengthTags(toneProfile, fx.tokens),
  };
}
