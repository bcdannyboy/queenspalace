import type { Route, RouteStep, UUID } from "../../../contracts/v1/domain.types";
import type { ParsedGame, ParsedMoveNode, ParsedPositionNode } from "../pgn/parse";
import { buildRouteId } from "../graph/ids";

export interface BuildRoutesInput {
  games: ParsedGame[];
  repertoireId: UUID;
  rootPositionId: UUID;
  moveEdgeIds: WeakMap<ParsedMoveNode, UUID>;
  routeName?: string;
}

export interface BuildRoutesResult {
  routes: Route[];
  routeSteps: RouteStep[];
}

function collectRoutePaths(
  node: ParsedPositionNode | ParsedMoveNode,
  path: ParsedMoveNode[],
  paths: ParsedMoveNode[][]
): void {
  if (node.moves.length === 0) {
    paths.push(path);
    return;
  }
  for (const move of node.moves) {
    collectRoutePaths(move, [...path, move], paths);
  }
}

function deriveGameBaseName(
  game: ParsedGame,
  gameIndex: number,
  totalGames: number,
  routeName?: string
): string {
  if (routeName) {
    return totalGames === 1 ? routeName : `${routeName} Game ${gameIndex + 1}`;
  }
  const tagName =
    (game.tags.Event ?? game.tags.Opening ?? game.tags.Site ?? "").trim();
  if (tagName) {
    return tagName;
  }
  return `Game ${gameIndex + 1}`;
}

function deriveRouteName(baseName: string, pathIndex: number, pathCount: number): string {
  if (pathCount <= 1) {
    return baseName;
  }
  return `${baseName} (Line ${pathIndex + 1})`;
}

function buildRouteDescription(tags: Record<string, string>): string | undefined {
  const white = tags.White ?? "";
  const black = tags.Black ?? "";
  const date = tags.Date ?? "";
  const result = tags.Result ?? "";
  const parts: string[] = [];
  if (white || black) {
    const left = white || "White";
    const right = black || "Black";
    parts.push(`${left} vs ${right}`);
  }
  if (date) {
    parts.push(date);
  }
  if (result && result !== "*") {
    parts.push(result);
  }
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

function getMoveEdgeId(
  map: WeakMap<ParsedMoveNode, UUID>,
  move: ParsedMoveNode
): UUID {
  const id = map.get(move);
  if (!id) {
    throw new Error(`Missing moveEdgeId for SAN '${move.san}'.`);
  }
  return id;
}

export function buildRoutesFromParsedGames(input: BuildRoutesInput): BuildRoutesResult {
  const routes: Route[] = [];
  const routeSteps: RouteStep[] = [];

  const totalGames = input.games.length;

  input.games.forEach((game, gameIndex) => {
    const paths: ParsedMoveNode[][] = [];
    collectRoutePaths(game.root, [], paths);

    const baseName = deriveGameBaseName(game, gameIndex, totalGames, input.routeName);
    const description = buildRouteDescription(game.tags);
    const pathCount = paths.length === 0 ? 1 : paths.length;
    const effectivePaths = paths.length === 0 ? [[]] : paths;

    effectivePaths.forEach((path, pathIndex) => {
      const routeName = deriveRouteName(baseName, pathIndex, pathCount);
      const moveEdgeIds = path.map((move) => getMoveEdgeId(input.moveEdgeIds, move));
      const routeId = buildRouteId(input.repertoireId, routeName, moveEdgeIds);

      routes.push({
        id: routeId,
        repertoireId: input.repertoireId,
        name: routeName,
        description,
        rootPositionId: input.rootPositionId,
      });

      moveEdgeIds.forEach((moveEdgeId, index) => {
        routeSteps.push({
          routeId,
          plyIndex: index + 1,
          moveEdgeId,
        });
      });
    });
  });

  return { routes, routeSteps };
}
