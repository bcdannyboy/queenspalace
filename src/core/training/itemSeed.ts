import type {
  MoveEdge,
  PositionNode,
  Repertoire,
  TrainingItem,
  UUID,
} from "../../../contracts/v1/domain.types";
import { parseFen } from "../chess/fen";
import { buildTrainingItemId } from "../graph/ids";

export interface BuildTrainingItemSeedsInput {
  repertoire: Repertoire;
  positions: PositionNode[];
  moves: MoveEdge[];
}

function compareStrings(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

function sortMoveEdges(moves: MoveEdge[]): MoveEdge[] {
  return [...moves].sort((left, right) => {
    const uciDiff = compareStrings(left.uci, right.uci);
    if (uciDiff !== 0) {
      return uciDiff;
    }
    return compareStrings(left.id, right.id);
  });
}

function sideToColor(side: Repertoire["side"]): "w" | "b" {
  return side === "white" ? "w" : "b";
}

function getActiveColor(fenKey: string): "w" | "b" | null {
  try {
    return parseFen(fenKey).activeColor;
  } catch {
    return null;
  }
}

export function buildTrainingItemSeeds(input: BuildTrainingItemSeedsInput): TrainingItem[] {
  const movesByFrom = new Map<UUID, MoveEdge[]>();
  for (const move of input.moves) {
    const list = movesByFrom.get(move.fromPositionId) ?? [];
    list.push(move);
    movesByFrom.set(move.fromPositionId, list);
  }

  const activeColor = sideToColor(input.repertoire.side);
  const items: TrainingItem[] = [];

  for (const position of input.positions) {
    const positionColor = getActiveColor(position.fenKey);
    if (!positionColor || positionColor !== activeColor) {
      continue;
    }

    const outgoing = movesByFrom.get(position.id);
    if (!outgoing || outgoing.length === 0) {
      continue;
    }

    const expectedMoveEdgeIds = sortMoveEdges(outgoing).map((move) => move.id);
    const itemType: TrainingItem["itemType"] = "nextMove";
    const id = buildTrainingItemId(
      input.repertoire.id,
      position.id,
      itemType,
      expectedMoveEdgeIds
    );

    items.push({
      id,
      repertoireId: input.repertoire.id,
      promptPositionId: position.id,
      expectedMoveEdgeIds,
      itemType,
      difficultyTags: [],
      active: true,
    });
  }

  return items.sort((left, right) => compareStrings(left.id, right.id));
}
