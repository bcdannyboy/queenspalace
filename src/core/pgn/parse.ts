import { createChessEngine, type ChessEngine } from "../chess/engine";
import { parseFen } from "../chess/fen";
import type { ChessVariant, MoveFlags } from "../../../contracts/v1/domain.types";

export interface ParsePgnOptions {
  includeVariations?: boolean;
  maxPly?: number;
  variant?: ChessVariant;
}

export interface PgnParseWarning {
  code: "PGN_TRUNCATED" | "PGN_ANNOTATION_IGNORED";
  message: string;
  gameIndex?: number;
  plyIndex?: number;
  san?: string;
}

export interface PgnParseError {
  code: "PGN_PARSE_ERROR" | "PGN_ILLEGAL_MOVE" | "PGN_AMBIGUOUS_SAN" | "PGN_INVALID_FEN";
  message: string;
  plyIndex?: number;
  san?: string;
  routeName?: string;
}

export interface ParsedPositionNode {
  fen: string;
  fenKey: string;
  moves: ParsedMoveNode[];
}

export interface ParsedMoveNode {
  san: string;
  sanRaw?: string;
  uci: string;
  flags: MoveFlags;
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  fen: string;
  fenKey: string;
  comments?: string[];
  nags?: string[];
  moves: ParsedMoveNode[];
}

export interface ParsedGame {
  tags: Record<string, string>;
  root: ParsedPositionNode;
  result?: string;
}

export type PgnParseResult =
  | {
      ok: true;
      games: ParsedGame[];
      warnings: PgnParseWarning[];
    }
  | {
      ok: false;
      error: PgnParseError;
      warnings: PgnParseWarning[];
    };

interface PgnGameSection {
  tags: Record<string, string>;
  movetext: string;
}

interface MoveAnchor {
  node: BranchNode;
  ply: number;
  color: "w" | "b";
  moveNumber: number;
}

interface ParseState {
  node: BranchNode;
  engine: ChessEngine;
  ply: number;
  color: "w" | "b";
  moveNumber: number;
  lastMoveNode: ParsedMoveNode | null;
  lastMoveAnchor: MoveAnchor | null;
  pendingComments: string[];
  pendingNags: string[];
}

type BranchNode = ParsedPositionNode | ParsedMoveNode;

type Token =
  | { type: "san"; value: string }
  | { type: "comment"; value: string }
  | { type: "nag"; value: string }
  | { type: "moveNumber"; value: string }
  | { type: "variationStart" }
  | { type: "variationEnd" }
  | { type: "result"; value: string };

export function parsePgn(pgnText: string, options: ParsePgnOptions = {}): PgnParseResult {
  const warnings: PgnParseWarning[] = [];
  const games: ParsedGame[] = [];
  const sections = splitPgnGames(pgnText);
  const includeVariations = options.includeVariations ?? true;
  const maxPly = options.maxPly;
  const variant = options.variant ?? "standard";

  for (let gameIndex = 0; gameIndex < sections.length; gameIndex += 1) {
    const section = sections[gameIndex];
    const tags = section.tags;
    const initialFen = resolveInitialFen(tags);
    if (initialFen.error) {
      return {
        ok: false,
        error: {
          code: "PGN_INVALID_FEN",
          message: initialFen.error,
        },
        warnings,
      };
    }

    let engine: ChessEngine;
    try {
      engine = createChessEngine(initialFen.fen);
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "PGN_INVALID_FEN",
          message: error instanceof Error ? error.message : "Invalid initial FEN.",
        },
        warnings,
      };
    }

    if (variant !== "standard") {
      return {
        ok: false,
        error: {
          code: "PGN_PARSE_ERROR",
          message: `Unsupported variant '${variant}'.`,
        },
        warnings,
      };
    }

    const root: ParsedPositionNode = {
      fen: engine.fen(),
      fenKey: engine.fenKey(),
      moves: [],
    };

    const tokens = tokenizeMoveText(section.movetext);
    const startMoveNumber = initialFen.fullmove ?? 1;
    const state: ParseState = {
      node: root,
      engine,
      ply: 1,
      color: engine.turn(),
      moveNumber: startMoveNumber,
      lastMoveNode: null,
      lastMoveAnchor: null,
      pendingComments: [],
      pendingNags: [],
    };

    const parsed = parseTokens(tokens, 0, state, {
      includeVariations,
      maxPly,
      warnings,
      gameIndex,
    });

    if (parsed.error) {
      return {
        ok: false,
        error: parsed.error,
        warnings,
      };
    }

    if (state.pendingComments.length > 0) {
      warnings.push({
        code: "PGN_ANNOTATION_IGNORED",
        message: "Trailing comments could not be attached to a move.",
        gameIndex,
      });
    }

    if (state.pendingNags.length > 0) {
      warnings.push({
        code: "PGN_ANNOTATION_IGNORED",
        message: "Trailing NAGs could not be attached to a move.",
        gameIndex,
      });
    }

    games.push({
      tags,
      root,
      result: parsed.result ?? tags.Result,
    });
  }

  return { ok: true, games, warnings };
}

function parseTokens(
  tokens: Token[],
  startIndex: number,
  state: ParseState,
  config: {
    includeVariations: boolean;
    maxPly?: number;
    warnings: PgnParseWarning[];
    gameIndex: number;
  },
  stopOnVariationEnd = false
): { index: number; result?: string; error?: PgnParseError } {
  let index = startIndex;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token.type === "san") {
      if (config.maxPly !== undefined && state.ply > config.maxPly) {
        config.warnings.push({
          code: "PGN_TRUNCATED",
          message: `Moves beyond ply ${config.maxPly} were truncated.`,
          plyIndex: state.ply,
          gameIndex: config.gameIndex,
        });
        if (stopOnVariationEnd) {
          return { index: skipToVariationEnd(tokens, index) };
        }
        return { index: tokens.length };
      }

      const rawSan = token.value;
      const sanitizedSan = sanitizeSan(rawSan);
      const preMoveAnchor: MoveAnchor = {
        node: state.node,
        ply: state.ply,
        color: state.color,
        moveNumber: state.moveNumber,
      };

      const applied = state.engine.applySan(sanitizedSan);
      if (!applied.ok) {
        const ambiguous = detectAmbiguousSan(state.engine, sanitizedSan);
        return {
          index,
          error: {
            code: ambiguous ? "PGN_AMBIGUOUS_SAN" : "PGN_ILLEGAL_MOVE",
            message: ambiguous
              ? `Ambiguous SAN '${rawSan}'.`
              : `Illegal SAN '${rawSan}'.`,
            plyIndex: state.ply,
            san: rawSan,
          },
        };
      }

      const moveNode: ParsedMoveNode = {
        san: applied.move.san,
        sanRaw: applied.move.san === rawSan ? undefined : rawSan,
        uci: applied.move.uci,
        flags: applied.move.flags,
        ply: state.ply,
        moveNumber: state.moveNumber,
        color: state.color,
        fen: applied.fen,
        fenKey: applied.fenKey,
        moves: [],
      };

      if (state.pendingComments.length > 0) {
        moveNode.comments = [...state.pendingComments];
        state.pendingComments = [];
      }

      if (state.pendingNags.length > 0) {
        moveNode.nags = [...state.pendingNags];
        state.pendingNags = [];
      }

      state.node.moves.push(moveNode);
      state.lastMoveNode = moveNode;
      state.lastMoveAnchor = preMoveAnchor;
      state.node = moveNode;
      state.ply += 1;
      if (state.color === "b") {
        state.moveNumber += 1;
      }
      state.color = state.engine.turn();
      index += 1;
      continue;
    }

    if (token.type === "comment") {
      const comment = token.value.trim();
      if (!comment) {
        index += 1;
        continue;
      }
      if (state.lastMoveNode) {
        const existing = state.lastMoveNode.comments ?? [];
        state.lastMoveNode.comments = [...existing, comment];
      } else {
        state.pendingComments.push(comment);
      }
      index += 1;
      continue;
    }

    if (token.type === "nag") {
      if (state.lastMoveNode) {
        const existing = state.lastMoveNode.nags ?? [];
        state.lastMoveNode.nags = [...existing, token.value];
      } else {
        state.pendingNags.push(token.value);
      }
      index += 1;
      continue;
    }

    if (token.type === "moveNumber") {
      index += 1;
      continue;
    }

    if (token.type === "result") {
      return { index: index + 1, result: token.value };
    }

    if (token.type === "variationStart") {
      if (!config.includeVariations) {
        const skipped = skipToVariationEnd(tokens, index + 1);
        if (skipped >= tokens.length) {
          return {
            index: tokens.length,
            error: {
              code: "PGN_PARSE_ERROR",
              message: "Unclosed variation.",
            },
          };
        }
        index = skipped;
        continue;
      }

      const anchor = state.lastMoveAnchor ?? {
        node: state.node,
        ply: state.ply,
        color: state.color,
        moveNumber: state.moveNumber,
      };

      let variationEngine: ChessEngine;
      try {
        variationEngine = createChessEngine(getNodeFen(anchor.node));
      } catch (error) {
        return {
          index,
          error: {
            code: "PGN_INVALID_FEN",
            message: error instanceof Error ? error.message : "Invalid FEN for variation.",
          },
        };
      }

      const variationState: ParseState = {
        node: anchor.node,
        engine: variationEngine,
        ply: anchor.ply,
        color: anchor.color,
        moveNumber: anchor.moveNumber,
        lastMoveNode: null,
        lastMoveAnchor: null,
        pendingComments: [],
        pendingNags: [],
      };

      const parsed = parseTokens(tokens, index + 1, variationState, config, true);
      if (parsed.error) {
        return parsed;
      }
      index = parsed.index;
      continue;
    }

    if (token.type === "variationEnd") {
      if (stopOnVariationEnd) {
        return { index: index + 1 };
      }
      return {
        index,
        error: {
          code: "PGN_PARSE_ERROR",
          message: "Unexpected variation end.",
        },
      };
    }

    index += 1;
  }

  if (stopOnVariationEnd) {
    return {
      index,
      error: {
        code: "PGN_PARSE_ERROR",
        message: "Unclosed variation.",
      },
    };
  }

  return { index };
}

function splitPgnGames(pgnText: string): PgnGameSection[] {
  const lines = pgnText.replace(/\r\n/g, "\n").split("\n");
  const games: PgnGameSection[] = [];
  let tags: Record<string, string> = {};
  let movetextLines: string[] = [];
  let seenMovetext = false;

  const pushGame = () => {
    const movetext = movetextLines.join("\n").trim();
    if (Object.keys(tags).length === 0 && movetext.length === 0) {
      return;
    }
    games.push({ tags, movetext });
    tags = {};
    movetextLines = [];
    seenMovetext = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("[") && line.endsWith("]")) {
      const tag = parseTagLine(line);
      if (tag) {
        if (seenMovetext) {
          pushGame();
        }
        tags[tag.key] = tag.value;
        continue;
      }
    }

    if (line.length === 0) {
      if (seenMovetext) {
        movetextLines.push("");
      }
      continue;
    }

    seenMovetext = true;
    movetextLines.push(rawLine);
  }

  pushGame();

  if (games.length === 0) {
    games.push({ tags: {}, movetext: pgnText.trim() });
  }

  return games;
}

function parseTagLine(line: string): { key: string; value: string } | null {
  const match = line.match(/^\s*\[([A-Za-z0-9_]+)\s+"(.*)"\s*\]\s*$/);
  if (!match) return null;
  const key = match[1];
  const rawValue = match[2].replace(/\\"/g, '"');
  return { key, value: rawValue };
}

function resolveInitialFen(tags: Record<string, string>): {
  fen?: string;
  fullmove?: number;
  error?: string;
} {
  const fenTag = tags.FEN ?? tags.Fen ?? tags.fen;
  if (!fenTag) {
    return {};
  }
  try {
    const parsed = parseFen(fenTag);
    const fullmove = parsed.fullmove ? Number.parseInt(parsed.fullmove, 10) : 1;
    if (!Number.isFinite(fullmove) || fullmove < 1) {
      return { fen: fenTag, fullmove: 1 };
    }
    return { fen: fenTag, fullmove };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid FEN in PGN tags.",
    };
  }
}

function tokenizeMoveText(movetext: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < movetext.length) {
    const char = movetext[i];
    if (isWhitespace(char)) {
      i += 1;
      continue;
    }

    if (char === "{") {
      const end = movetext.indexOf("}", i + 1);
      if (end === -1) {
        const comment = movetext.slice(i + 1).trim();
        if (comment) tokens.push({ type: "comment", value: comment });
        break;
      }
      const comment = movetext.slice(i + 1, end).trim();
      if (comment) tokens.push({ type: "comment", value: comment });
      i = end + 1;
      continue;
    }

    if (char === ";") {
      const end = movetext.indexOf("\n", i + 1);
      const comment = movetext.slice(i + 1, end === -1 ? movetext.length : end).trim();
      if (comment) tokens.push({ type: "comment", value: comment });
      i = end === -1 ? movetext.length : end + 1;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "variationStart" });
      i += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "variationEnd" });
      i += 1;
      continue;
    }

    let j = i;
    while (j < movetext.length && !isWhitespace(movetext[j]) && !isDelimiter(movetext[j])) {
      j += 1;
    }
    const word = movetext.slice(i, j);
    const classified = classifyWordToken(word);
    if (classified) {
      if (Array.isArray(classified)) {
        tokens.push(...classified);
      } else {
        tokens.push(classified);
      }
    }
    i = j;
  }

  return tokens;
}

function classifyWordToken(word: string): Token | Token[] | null {
  if (!word) return null;
  if (word === "(") return { type: "variationStart" };
  if (word === ")") return { type: "variationEnd" };
  const combinedMatch = word.match(/^(\d+)\.(\.\.)?(.+)$/);
  if (combinedMatch) {
    const numberToken: Token = {
      type: "moveNumber",
      value: `${combinedMatch[1]}.${combinedMatch[2] ?? ""}`,
    };
    const sanPart = combinedMatch[3];
    const sanToken = classifyWordToken(sanPart);
    if (!sanToken) {
      return numberToken;
    }
    return Array.isArray(sanToken) ? [numberToken, ...sanToken] : [numberToken, sanToken];
  }
  if (/^\d+\.{1,3}$/.test(word)) return { type: "moveNumber", value: word };
  if (word === "...") return { type: "moveNumber", value: word };
  if (/^\$\d+$/.test(word)) return { type: "nag", value: word };
  if (isResultToken(word)) return { type: "result", value: word };
  return { type: "san", value: word };
}

function isResultToken(word: string): boolean {
  return word === "1-0" || word === "0-1" || word === "1/2-1/2" || word === "*";
}

function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

function isDelimiter(char: string): boolean {
  return char === "{" || char === "}" || char === "(" || char === ")" || char === ";";
}

function sanitizeSan(san: string): string {
  let cleaned = san.trim();
  cleaned = cleaned.replace(/[!?]+$/g, "");
  cleaned = cleaned.replace(/\s+/g, "");
  cleaned = cleaned.replace(/e\.p\./gi, "");
  return cleaned;
}

function detectAmbiguousSan(engine: ChessEngine, san: string): boolean {
  const normalized = normalizeSanCore(san);
  if (!normalized) return false;
  const legalMoves = engine.listLegalMoves();
  const matches = legalMoves.filter(
    (move) => normalizeSanCore(move.san) === normalized
  );
  return matches.length > 1;
}

function normalizeSanCore(san: string): string {
  let cleaned = san.trim();
  cleaned = cleaned.replace(/[!?]+$/g, "");
  cleaned = cleaned.replace(/[+#]+$/g, "");
  cleaned = cleaned.replace(/\s+/g, "");
  cleaned = cleaned.replace(/e\.p\./gi, "");
  if (cleaned.startsWith("O-O-O")) return "O-O-O";
  if (cleaned.startsWith("O-O")) return "O-O";

  const promotionMatch = cleaned.match(/=([QRBNqrnb])$/);
  const promotion = promotionMatch ? `=${promotionMatch[1].toUpperCase()}` : "";
  if (promotionMatch) {
    cleaned = cleaned.slice(0, -promotionMatch[0].length);
  }

  const destMatch = cleaned.match(/([a-h][1-8])$/);
  if (!destMatch) return cleaned;
  const dest = destMatch[1].toLowerCase();
  const prefix = cleaned.slice(0, -dest.length);
  const capture = prefix.includes("x");

  if (/^[KQRBN]/.test(prefix)) {
    const piece = prefix[0];
    return `${piece}${capture ? "x" : ""}${dest}${promotion}`;
  }

  const pawnFile = prefix[0] ?? "";
  return `${pawnFile}${capture ? "x" : ""}${dest}${promotion}`;
}

function skipToVariationEnd(tokens: Token[], startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === "variationStart") {
      depth += 1;
      continue;
    }
    if (token.type === "variationEnd") {
      if (depth === 0) {
        return i + 1;
      }
      depth -= 1;
    }
  }
  return tokens.length;
}

function getNodeFen(node: BranchNode): string {
  return node.fen;
}
