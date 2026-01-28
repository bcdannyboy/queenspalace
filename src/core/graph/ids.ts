import type { ChessVariant, UUID } from "../../../contracts/v1/domain.types";

function fnv1a32(input: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash =
      (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>>
      0;
  }
  return hash >>> 0;
}

function deterministicUuid(parts: Array<string | number | null | undefined>): UUID {
  const base = parts.map((part) => (part === undefined || part === null ? "" : String(part))).join("|");
  const h1 = fnv1a32(base, 0x811c9dc5);
  const h2 = fnv1a32(base, 0x01000193);
  const h3 = fnv1a32(base, 0x12345678);
  const h4 = fnv1a32(base, 0x9e3779b9);
  const hex = (value: number) => value.toString(16).padStart(8, "0");
  const all = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${all.slice(0, 8)}-${all.slice(8, 12)}-${all.slice(12, 16)}-${all.slice(16, 20)}-${all.slice(20)}`;
}

export function buildPositionNodeId(variant: ChessVariant, fenKey: string): UUID {
  return deterministicUuid(["position", variant, fenKey]);
}

export function buildMoveEdgeId(
  variant: ChessVariant,
  fromPositionId: UUID,
  uci: string
): UUID {
  return deterministicUuid(["move", variant, fromPositionId, uci]);
}

export function buildRepertoireId(
  variant: ChessVariant,
  name: string,
  side: "white" | "black",
  rootPositionId: UUID
): UUID {
  return deterministicUuid(["repertoire", variant, side, rootPositionId, name]);
}

export function buildRouteId(repertoireId: UUID, name: string, moveEdgeIds: UUID[]): UUID {
  return deterministicUuid(["route", repertoireId, name, ...moveEdgeIds]);
}

export function buildTrainingItemId(
  repertoireId: UUID,
  promptPositionId: UUID,
  itemType: string,
  expectedMoveEdgeIds: UUID[]
): UUID {
  return deterministicUuid(["training", repertoireId, promptPositionId, itemType, ...expectedMoveEdgeIds]);
}
