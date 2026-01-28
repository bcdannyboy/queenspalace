export interface FenFields {
  placement: string;
  activeColor: "w" | "b";
  castling: string;
  enPassant: string;
  halfmove?: string;
  fullmove?: string;
}

const FEN_MIN_FIELDS = 4;

export function splitFen(fen: string): string[] {
  return fen.trim().split(/\s+/).filter(Boolean);
}

export function parseFen(fen: string): FenFields {
  const fields = splitFen(fen);
  if (fields.length < FEN_MIN_FIELDS) {
    throw new Error(`Invalid FEN: expected at least 4 fields, got ${fields.length}`);
  }
  const [placement, activeColor, castling, enPassant, halfmove, fullmove] = fields;
  if (activeColor !== "w" && activeColor !== "b") {
    throw new Error(`Invalid FEN: active color must be 'w' or 'b', got '${activeColor}'`);
  }
  return {
    placement,
    activeColor,
    castling,
    enPassant,
    halfmove,
    fullmove,
  };
}

export function fenKeyFromFen(fen: string): string {
  const fields = splitFen(fen);
  if (fields.length < FEN_MIN_FIELDS) {
    throw new Error(`Invalid FEN: expected at least 4 fields, got ${fields.length}`);
  }
  return fields.slice(0, 4).join(" ");
}

export function normalizeFenKey(fenOrKey: string): string {
  const fields = splitFen(fenOrKey);
  if (fields.length < FEN_MIN_FIELDS) {
    throw new Error(`Invalid FEN key: expected at least 4 fields, got ${fields.length}`);
  }
  return fields.slice(0, 4).join(" ");
}

export function isFenKey(value: string): boolean {
  try {
    const fields = splitFen(value);
    return fields.length === 4 && (fields[1] === "w" || fields[1] === "b");
  } catch {
    return false;
  }
}
