import type {
  ChessVariant,
  MoveEdge,
  PositionNode,
  Repertoire,
  Route,
  RouteStep,
  TrainingItem,
  UUID,
} from "../../../contracts/v1/domain.types";
import {
  parsePgn,
  type ParsedGame,
  type ParsedMoveNode,
  type ParsedPositionNode,
  type PgnParseError,
  type PgnParseWarning,
} from "../pgn/parse";
import { normalizeFenKey } from "../chess/fen";
import {
  buildMoveEdgeId,
  buildPositionNodeId,
  buildRepertoireId,
} from "./ids";
import { buildRoutesFromParsedGames } from "../routes/routes";
import { buildTrainingItemSeeds } from "../training/itemSeed";

export interface BuildGraphOptions {
  variant?: ChessVariant;
  repertoireName?: string;
  repertoireSide?: Repertoire["side"];
  routeName?: string;
  createdAt?: string;
}

export interface GraphBuildResult {
  repertoire: Repertoire;
  positions: PositionNode[];
  moves: MoveEdge[];
  routes: Route[];
  routeSteps: RouteStep[];
  trainingItemSeeds: TrainingItem[];
}

export interface ImportPgnOptions extends BuildGraphOptions {
  includeVariations?: boolean;
  maxPly?: number;
}

export type ImportPgnResult =
  | {
      ok: true;
      value: GraphBuildResult;
      warnings: PgnParseWarning[];
    }
  | {
      ok: false;
      error: PgnParseError;
      warnings: PgnParseWarning[];
    };

function resolveCreatedAt(value?: string): string {
  return value ?? new Date().toISOString();
}

function resolveRepertoireName(
  games: ParsedGame[],
  options: BuildGraphOptions
): string {
  if (options.repertoireName) {
    return options.repertoireName;
  }
  if (options.routeName) {
    return options.routeName;
  }
  const firstTags = games[0]?.tags ?? {};
  const tagName =
    (firstTags.Event ?? firstTags.Opening ?? firstTags.Site ?? "").trim();
  if (tagName) {
    return tagName;
  }
  return "Imported PGN";
}

function getFenKey(fenKey: string | undefined, fenFull: string): string {
  return normalizeFenKey(fenKey ?? fenFull);
}

export function buildGraphFromParsedGames(
  games: ParsedGame[],
  options: BuildGraphOptions = {}
): GraphBuildResult {
  if (!games || games.length === 0) {
    throw new Error("No parsed games provided.");
  }

  const variant = options.variant ?? "standard";
  const createdAt = resolveCreatedAt(options.createdAt);
  const positionsByKey = new Map<string, PositionNode>();
  const movesByKey = new Map<string, MoveEdge>();
  const moveEdgeIds = new WeakMap<ParsedMoveNode, UUID>();

  const getPositionNode = (fenFull: string, fenKey?: string): PositionNode => {
    const normalizedKey = getFenKey(fenKey, fenFull);
    const key = `${variant}|${normalizedKey}`;
    const existing = positionsByKey.get(key);
    if (existing) {
      return existing;
    }
    const id = buildPositionNodeId(variant, normalizedKey);
    const node: PositionNode = {
      id,
      variant,
      fenFull,
      fenKey: normalizedKey,
      createdAt,
    };
    positionsByKey.set(key, node);
    return node;
  };

  const getMoveEdge = (
    fromPositionId: UUID,
    move: ParsedMoveNode
  ): MoveEdge => {
    const key = `${variant}|${fromPositionId}|${move.uci}`;
    const existing = movesByKey.get(key);
    if (existing) {
      moveEdgeIds.set(move, existing.id);
      return existing;
    }
    const toPosition = getPositionNode(move.fen, move.fenKey);
    const id = buildMoveEdgeId(variant, fromPositionId, move.uci);
    const edge: MoveEdge = {
      id,
      variant,
      fromPositionId,
      toPositionId: toPosition.id,
      uci: move.uci,
      san: move.san,
      flags: move.flags,
      createdAt,
    };
    movesByKey.set(key, edge);
    moveEdgeIds.set(move, id);
    return edge;
  };

  const walkNode = (node: ParsedPositionNode | ParsedMoveNode): void => {
    const fromPosition = getPositionNode(node.fen, node.fenKey);
    for (const move of node.moves) {
      getMoveEdge(fromPosition.id, move);
      walkNode(move);
    }
  };

  const rootPosition = getPositionNode(games[0].root.fen, games[0].root.fenKey);
  for (const game of games) {
    walkNode(game.root);
  }

  const repertoireName = resolveRepertoireName(games, options);
  const repertoireSide = options.repertoireSide ?? "white";
  const repertoireId = buildRepertoireId(
    variant,
    repertoireName,
    repertoireSide,
    rootPosition.id
  );

  const repertoire: Repertoire = {
    id: repertoireId,
    name: repertoireName,
    side: repertoireSide,
    variant,
    rootPositionId: rootPosition.id,
  };

  const { routes, routeSteps } = buildRoutesFromParsedGames({
    games,
    repertoireId,
    rootPositionId: rootPosition.id,
    moveEdgeIds,
    routeName: options.routeName,
  });

  const positions = Array.from(positionsByKey.values());
  const moves = Array.from(movesByKey.values());
  const trainingItemSeeds = buildTrainingItemSeeds({ repertoire, positions, moves });

  return {
    repertoire,
    positions,
    moves,
    routes,
    routeSteps,
    trainingItemSeeds,
  };
}

export function importPgnToGraph(
  pgnText: string,
  options: ImportPgnOptions = {}
): ImportPgnResult {
  const parsed = parsePgn(pgnText, {
    includeVariations: options.includeVariations,
    maxPly: options.maxPly,
    variant: options.variant,
  });

  if (!parsed.ok) {
    return { ok: false, error: parsed.error, warnings: parsed.warnings };
  }

  return {
    ok: true,
    value: buildGraphFromParsedGames(parsed.games, options),
    warnings: parsed.warnings,
  };
}
