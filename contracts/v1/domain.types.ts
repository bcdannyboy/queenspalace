/*
  Domain Types Contract v1
  All invariants documented in doc comments are mandatory.
*/

export type UUID = string;

/**
 * Chess variant identifier.
 * Invariant: MVP supports only "standard".
 */
export type ChessVariant = "standard";

/**
 * Repertoire metadata.
 * Invariant: side MUST be "white" or "black".
 * Invariant: rootPositionId MUST reference a PositionNode for the same variant.
 */
export interface Repertoire {
  id: UUID;
  name: string;
  side: "white" | "black";
  variant: ChessVariant;
  rootPositionId: UUID;
}

/**
 * Position node in the position graph.
 * Invariant: fenKey MUST equal the first 4 fields of fenFull.
 * Invariant: (variant, fenKey) is unique.
 */
export interface PositionNode {
  id: UUID;
  variant: ChessVariant;
  fenFull: string;
  fenKey: string;
  createdAt: string; // ISO timestamp
}

/**
 * Move edge connecting two positions.
 * Invariant: uci MUST be the canonical identity for the move.
 * Invariant: san MUST be the SAN representation for the move from fromPositionId.
 * Invariant: (variant, fromPositionId, uci) is unique.
 */
export interface MoveEdge {
  id: UUID;
  variant: ChessVariant;
  fromPositionId: UUID;
  toPositionId: UUID;
  uci: string;
  san: string;
  flags: MoveFlags;
  createdAt: string; // ISO timestamp
}

/**
 * Move flags.
 * Invariant: promotionPiece MUST be set only if isPromotion is true.
 */
export interface MoveFlags {
  isCapture: boolean;
  isCheck: boolean;
  isMate: boolean;
  isPromotion: boolean;
  promotionPiece?: "q" | "r" | "b" | "n";
  isCastle: boolean;
  isEnPassant: boolean;
}

/**
 * Links a repertoire to a move edge with context.
 * Invariant: role MUST describe whether the move is mine or opponent.
 */
export interface RepertoireEdge {
  repertoireId: UUID;
  moveEdgeId: UUID;
  role: "myMove" | "opponentMove" | "sideline";
  priority: number; // 1=highest
  weight: number; // frequency or importance weighting
  tags: string[];
  comment?: string;
}

/**
 * Route is a human-readable path through the graph.
 * Invariant: rootPositionId MUST match the repertoire root.
 */
export interface Route {
  id: UUID;
  repertoireId: UUID;
  name: string;
  description?: string;
  rootPositionId: UUID;
}

/**
 * RouteStep orders edges for a route.
 * Invariant: plyIndex is 1-based and strictly increasing within a route.
 */
export interface RouteStep {
  routeId: UUID;
  plyIndex: number;
  moveEdgeId: UUID;
}

/**
 * Training items are the schedulable units.
 * Invariant: promptPositionId references a PositionNode.
 * Invariant: expectedMoveEdgeIds reference MoveEdges from promptPositionId.
 */
export interface TrainingItem {
  id: UUID;
  repertoireId: UUID;
  promptPositionId: UUID;
  expectedMoveEdgeIds: UUID[];
  itemType:
    | "squarePeg"
    | "pieceOnSquare"
    | "nextMove"
    | "branchDecision"
    | "imageToMove"
    | "chunk"
    | "plan";
  difficultyTags: string[];
  confusionGroupId?: UUID;
  active: boolean;
}

/**
 * SRS state per training item.
 * Invariant: scheduler MUST be "sm2" for MVP and MAY be "fsrs" in V1+.
 * Invariant: dueAt and lastReviewedAt are ISO timestamps.
 */
export interface SRSState {
  trainingItemId: UUID;
  scheduler: "sm2" | "fsrs";
  state: "new" | "learning" | "review" | "relearning" | "suspended";
  dueAt: string; // ISO timestamp
  intervalDays: number;
  easeFactor?: number; // SM-2
  stability?: number; // FSRS
  difficulty?: number; // FSRS
  lapses: number;
  repetitions: number;
  lastReviewedAt?: string; // ISO timestamp
}

/**
 * Review log entry.
 * Invariant: rating MUST be one of Again/Hard/Good/Easy.
 */
export interface ReviewLog {
  id: UUID;
  trainingItemId: UUID;
  reviewedAt: string; // ISO timestamp
  rating: "again" | "hard" | "good" | "easy";
  answerUci?: string;
  answerText?: string;
  correct: boolean;
  responseMs: number;
  errorType?: "piece" | "from" | "to" | "special" | "branch" | "unknown";
  answeredAsTrainingItemId?: UUID;
}

/**
 * Palace and loci.
 * Invariant: lociCount MUST equal the number of Locus entries for the palace.
 */
export interface Palace {
  id: UUID;
  name: string;
  type: "starter" | "userRealPlace";
  lociCount: number;
  createdAt: string; // ISO timestamp
}

/**
 * Locus within a palace.
 * Invariant: index is 1-based and unique per palace.
 */
export interface Locus {
  id: UUID;
  palaceId: UUID;
  index: number;
  label: string;
  note?: string;
}

/**
 * Mnemonic card bound to a training item or route step.
 * Invariant: Either trainingItemId or routeStepId MUST be set.
 */
export interface MnemonicCard {
  id: UUID;
  trainingItemId?: UUID;
  routeStepId?: UUID;
  palaceId: UUID;
  locusId: UUID;
  title: string;
  imageDescription: string;
  story: string;
  anchors: MnemonicAnchor[];
  userEdits: boolean;
  toneProfile: ToneProfile;
  strengthTags: Array<"action" | "sensory" | "surprise" | "clarity">;
  updatedAt: string; // ISO timestamp
}

/**
 * Anchor token inside a mnemonic card.
 * Invariant: token must be one of "from", "to", "piece", "fx", "plan".
 */
export interface MnemonicAnchor {
  token: "from" | "to" | "piece" | "fx" | "plan";
  value: string;
}

/**
 * Encoding pack definition.
 * Invariant: filePegs length = 8, rankPegs length = 8.
 * Invariant: pieceActors length = 12 (6 pieces x 2 colors).
 */
export interface EncodingPack {
  id: UUID;
  name: string;
  defaultTone: ToneProfile;
  filePegs: string[];
  rankPegs: string[];
  pieceActors: string[];
  verbsByPieceType: Record<string, string[]>;
  fxLibrary: Record<string, string>;
  safetyTier: "G" | "PG" | "Cinematic" | "Mature" | "LocalOnlyExplicit";
}

/**
 * Tone profiles.
 * Invariant: LocalOnlyExplicit disables LLM generation.
 */
export type ToneProfile =
  | "family_friendly"
  | "absurd"
  | "cinematic"
  | "mature_nongraphic"
  | "explicit_local_only";

