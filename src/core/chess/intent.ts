export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Square = `${File}${Rank}`;
export type PromotionPiece = "q" | "r" | "b" | "n";

export interface MoveIntent {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
}

const SQUARE_REGEX = /^[a-h][1-8]$/;
const UCI_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export function isSquare(value: string): value is Square {
  return SQUARE_REGEX.test(value);
}

export function isPromotionPiece(value: string): value is PromotionPiece {
  return value === "q" || value === "r" || value === "b" || value === "n";
}

export function normalizeSquare(value: string): Square | null {
  const normalized = value.trim().toLowerCase();
  return isSquare(normalized) ? (normalized as Square) : null;
}

export function normalizePromotionPiece(
  value: string | undefined
): PromotionPiece | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return isPromotionPiece(normalized) ? (normalized as PromotionPiece) : undefined;
}

export function parseMoveIntent(value: unknown): MoveIntent | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const maybe = value as { from?: unknown; to?: unknown; promotion?: unknown };
  if (typeof maybe.from !== "string" || typeof maybe.to !== "string") {
    return null;
  }
  const from = normalizeSquare(maybe.from);
  const to = normalizeSquare(maybe.to);
  if (!from || !to) {
    return null;
  }
  let promotion: PromotionPiece | undefined;
  if (typeof maybe.promotion === "string") {
    promotion = normalizePromotionPiece(maybe.promotion);
    if (!promotion) {
      return null;
    }
  } else if (maybe.promotion != null) {
    return null;
  }
  return { from, to, promotion };
}

export function isMoveIntent(value: unknown): value is MoveIntent {
  return parseMoveIntent(value) !== null;
}

export function moveIntentFromUci(uci: string): MoveIntent | null {
  const normalized = uci.trim().toLowerCase();
  if (!UCI_REGEX.test(normalized)) {
    return null;
  }
  const from = normalized.slice(0, 2) as Square;
  const to = normalized.slice(2, 4) as Square;
  const promotion = normalizePromotionPiece(normalized.slice(4));
  return promotion ? { from, to, promotion } : { from, to };
}

export function uciFromMoveIntent(intent: MoveIntent): string {
  return `${intent.from}${intent.to}${intent.promotion ?? ""}`;
}
