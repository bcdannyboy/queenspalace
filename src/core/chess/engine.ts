import { Chess } from "chess.js";
import type { MoveFlags } from "../../../contracts/v1/domain.types";
import {
  type MoveIntent,
  type PromotionPiece,
  type Square,
  normalizePromotionPiece,
} from "./intent";
import { fenKeyFromFen } from "./fen";

export interface EngineMove {
  from: Square;
  to: Square;
  uci: string;
  san: string;
  promotion?: PromotionPiece;
  flags: MoveFlags;
}

export type EngineErrorCode =
  | "INVALID_FEN"
  | "INVALID_INTENT"
  | "ILLEGAL_MOVE"
  | "INVALID_SAN"
  | "PROMOTION_REQUIRED";

export interface EngineError {
  code: EngineErrorCode;
  message: string;
}

export type EngineMoveResult =
  | {
      ok: true;
      move: EngineMove;
      fen: string;
      fenKey: string;
    }
  | {
      ok: false;
      error: EngineError;
    };

export interface ChessEngine {
  load: (fen: string) => { ok: true } | { ok: false; error: EngineError };
  reset: () => void;
  fen: () => string;
  fenKey: () => string;
  turn: () => "w" | "b";
  isLegalMove: (intent: MoveIntent) => boolean;
  listLegalMoves: () => EngineMove[];
  applyMove: (intent: MoveIntent) => EngineMoveResult;
  applySan: (san: string) => EngineMoveResult;
}

interface ChessMoveLike {
  from: string;
  to: string;
  san: string;
  flags: string;
  promotion?: string;
}

export function createChessEngine(initialFen?: string): ChessEngine {
  const chess = new Chess();
  if (initialFen) {
    const loaded = safeLoad(chess, initialFen);
    if (!loaded.ok) {
      throw new Error(loaded.error.message);
    }
  }

  const listLegalMoves = (): EngineMove[] => {
    const verboseMoves = chess.moves({ verbose: true }) as ChessMoveLike[];
    return verboseMoves.map(toEngineMove);
  };

  const findLegalMove = (
    intent: MoveIntent
  ): { move?: EngineMove; error?: EngineError } => {
    const verboseMoves = chess.moves({ verbose: true }) as ChessMoveLike[];
    const matches = verboseMoves.filter(
      (move) => move.from === intent.from && move.to === intent.to
    );
    if (matches.length === 0) {
      return {
        error: {
          code: "ILLEGAL_MOVE",
          message: "Move is not legal in the current position.",
        },
      };
    }

    const promotion = normalizePromotionPiece(intent.promotion);
    if (promotion) {
      const match = matches.find(
        (move) => normalizePromotionPiece(move.promotion) === promotion
      );
      if (!match) {
        return {
          error: {
            code: "ILLEGAL_MOVE",
            message: "Promotion piece is not legal for this move.",
          },
        };
      }
      return { move: toEngineMove(match) };
    }

    const hasPromotion = matches.some((move) => move.promotion);
    if (hasPromotion) {
      return {
        error: {
          code: "PROMOTION_REQUIRED",
          message: "Promotion move requires a promotion piece.",
        },
      };
    }

    return { move: toEngineMove(matches[0]) };
  };

  const applyMove = (intent: MoveIntent): EngineMoveResult => {
    const resolved = findLegalMove(intent);
    if (!resolved.move) {
      return {
        ok: false,
        error: resolved.error ?? {
          code: "INVALID_INTENT",
          message: "Move intent is invalid.",
        },
      };
    }

    const applied = chess.move({
      from: resolved.move.from,
      to: resolved.move.to,
      promotion: resolved.move.promotion,
    });

    if (!applied) {
      return {
        ok: false,
        error: {
          code: "ILLEGAL_MOVE",
          message: "Move is not legal in the current position.",
        },
      };
    }

    const fen = chess.fen();
    return {
      ok: true,
      move: toEngineMove(applied as ChessMoveLike),
      fen,
      fenKey: fenKeyFromFen(fen),
    };
  };

  const applySan = (san: string): EngineMoveResult => {
    const applied = moveFromSan(chess, san);
    if (!applied) {
      return {
        ok: false,
        error: {
          code: "INVALID_SAN",
          message: "SAN move is invalid or illegal for this position.",
        },
      };
    }
    const fen = chess.fen();
    return {
      ok: true,
      move: toEngineMove(applied as ChessMoveLike),
      fen,
      fenKey: fenKeyFromFen(fen),
    };
  };

  return {
    load: (fen: string) => safeLoad(chess, fen),
    reset: () => {
      chess.reset();
    },
    fen: () => chess.fen(),
    fenKey: () => fenKeyFromFen(chess.fen()),
    turn: () => chess.turn(),
    isLegalMove: (intent: MoveIntent) => Boolean(findLegalMove(intent).move),
    listLegalMoves,
    applyMove,
    applySan,
  };
}

export function buildLegalMoveMap(moves: EngineMove[]): Record<Square, Square[]> {
  const map = new Map<Square, Set<Square>>();
  for (const move of moves) {
    const existing = map.get(move.from) ?? new Set<Square>();
    existing.add(move.to);
    map.set(move.from, existing);
  }

  const result: Record<Square, Square[]> = {} as Record<Square, Square[]>;
  for (const [from, toSet] of map) {
    result[from] = Array.from(toSet).sort();
  }
  return result;
}

function safeLoad(
  chess: Chess,
  fen: string
): { ok: true } | { ok: false; error: EngineError } {
  try {
    const loaded = chess.load(fen);
    if (!loaded) {
      return {
        ok: false,
        error: {
          code: "INVALID_FEN",
          message: "FEN string is invalid.",
        },
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "INVALID_FEN",
        message: error instanceof Error ? error.message : "FEN string is invalid.",
      },
    };
  }
}

function moveFromSan(chess: Chess, san: string): ChessMoveLike | null {
  try {
    return (chess.move(san, { sloppy: false }) as ChessMoveLike | null) ?? null;
  } catch {
    try {
      return (chess.move(san) as ChessMoveLike | null) ?? null;
    } catch {
      return null;
    }
  }
}

function toEngineMove(move: ChessMoveLike): EngineMove {
  const promotion = normalizePromotionPiece(move.promotion);
  return {
    from: move.from as Square,
    to: move.to as Square,
    uci: `${move.from}${move.to}${promotion ?? ""}`,
    san: move.san,
    promotion,
    flags: toMoveFlags(move),
  };
}

function toMoveFlags(move: ChessMoveLike): MoveFlags {
  const flags = move.flags ?? "";
  const isCastle = flags.includes("k") || flags.includes("q");
  const isEnPassant = flags.includes("e");
  const isCapture = flags.includes("c") || isEnPassant;
  const isPromotion = flags.includes("p") || Boolean(move.promotion);
  const promotionPiece = isPromotion
    ? normalizePromotionPiece(move.promotion)
    : undefined;
  const isMate = move.san.includes("#");
  const isCheck = isMate || move.san.includes("+");

  return {
    isCapture,
    isCheck,
    isMate,
    isPromotion,
    promotionPiece,
    isCastle,
    isEnPassant,
  };
}
