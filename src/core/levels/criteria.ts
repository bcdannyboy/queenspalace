export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const LEVEL_ORDER: LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8];

export type LevelNumericMetric =
  | "squareAccuracy"
  | "medianResponseMs"
  | "confusableAccuracy"
  | "reconstructionAccuracy"
  | "spotCheckAccuracy"
  | "spotCheckMedianMs"
  | "decodeAccuracy"
  | "encodeMedianMs"
  | "encodeCount"
  | "lociCount"
  | "sequenceLength"
  | "sequenceRecallAccuracy"
  | "positionOnlyAccuracy"
  | "positionOnlyMedianMs"
  | "coldTestAccuracy"
  | "branchDecisionAccuracy"
  | "branchDecisionCount"
  | "confusionRate"
  | "tabiyaMoveAccuracy"
  | "planPromptAccuracy"
  | "retentionAccuracy"
  | "slicePlyCount";

export type LevelBooleanMetric =
  | "specialMoveCheckPassed"
  | "randomStartPassed"
  | "keyMovesSpaced"
  | "duplicateDetectionPassed"
  | "transpositionCheckPassed"
  | "withinDailyCap";

export type LevelMetrics =
  Partial<Record<LevelNumericMetric, number>>
  & Partial<Record<LevelBooleanMetric, boolean>>;

export type LevelRequirement =
  | {
      kind: "min";
      metric: LevelNumericMetric;
      value: number;
      optional?: boolean;
    }
  | {
      kind: "max";
      metric: LevelNumericMetric;
      value: number;
      optional?: boolean;
    }
  | {
      kind: "flag";
      metric: LevelBooleanMetric;
      value: boolean;
      optional?: boolean;
    };

export interface LevelCheckDefinition {
  id: string;
  label: string;
  requirements: LevelRequirement[];
  minDistinctDays?: number;
  minHoursBetween?: number;
  mustFollow?: {
    checkId: string;
    minHoursAfter: number;
  };
}

export interface LevelDefinition {
  id: LevelId;
  name: string;
  description: string;
  checks: LevelCheckDefinition[];
}

const HOURS_24 = 24;
const HOURS_72 = 72;
const HOURS_168 = 168;

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    id: 1,
    name: "Square fluency",
    description: "Square peg grid fluency and confusable-pair accuracy.",
    checks: [
      {
        id: "square-fluency",
        label: "Square <-> image accuracy",
        requirements: [
          { kind: "min", metric: "squareAccuracy", value: 0.95 },
          { kind: "max", metric: "medianResponseMs", value: 2000 },
          { kind: "min", metric: "confusableAccuracy", value: 0.9 },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
    ],
  },
  {
    id: 2,
    name: "Pieces on squares",
    description: "Piece + square binding accuracy under spot checks.",
    checks: [
      {
        id: "piece-binding",
        label: "Piece on square accuracy",
        requirements: [
          { kind: "min", metric: "reconstructionAccuracy", value: 0.9 },
          { kind: "min", metric: "spotCheckAccuracy", value: 0.9 },
          { kind: "max", metric: "spotCheckMedianMs", value: 3000 },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
    ],
  },
  {
    id: 3,
    name: "Move grammar",
    description: "Actor-verb-target grammar including special moves.",
    checks: [
      {
        id: "move-grammar",
        label: "Move grammar mastery",
        requirements: [
          { kind: "min", metric: "decodeAccuracy", value: 0.9 },
          { kind: "min", metric: "encodeCount", value: 20 },
          { kind: "max", metric: "encodeMedianMs", value: 5000 },
          { kind: "flag", metric: "specialMoveCheckPassed", value: true },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
    ],
  },
  {
    id: 4,
    name: "Palace workflow",
    description: "Build a route, place moves, and retrieve via a walk.",
    checks: [
      {
        id: "palace-setup",
        label: "Palace setup",
        requirements: [{ kind: "min", metric: "lociCount", value: 10 }],
        minDistinctDays: 1,
      },
      {
        id: "palace-recall",
        label: "12-ply recall walk",
        requirements: [
          { kind: "min", metric: "sequenceLength", value: 12 },
          { kind: "min", metric: "sequenceRecallAccuracy", value: 0.9 },
          { kind: "flag", metric: "randomStartPassed", value: true },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
    ],
  },
  {
    id: 5,
    name: "Opening seed",
    description: "Position-only recall for a starter slice with cold retention.",
    checks: [
      {
        id: "starter-slice",
        label: "Starter slice mastery",
        requirements: [
          { kind: "min", metric: "slicePlyCount", value: 10 },
          { kind: "min", metric: "positionOnlyAccuracy", value: 0.9 },
          { kind: "max", metric: "positionOnlyMedianMs", value: 6000 },
          { kind: "flag", metric: "keyMovesSpaced", value: true },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
      {
        id: "cold-test",
        label: "Cold test after 72h",
        requirements: [{ kind: "min", metric: "coldTestAccuracy", value: 0.8 }],
        minDistinctDays: 1,
        mustFollow: {
          checkId: "starter-slice",
          minHoursAfter: HOURS_72,
        },
      },
    ],
  },
  {
    id: 6,
    name: "Branch doors",
    description: "Discriminate opponent deviations at branch nodes.",
    checks: [
      {
        id: "branch-doors",
        label: "Branch decision accuracy",
        requirements: [
          { kind: "min", metric: "branchDecisionCount", value: 20 },
          { kind: "min", metric: "branchDecisionAccuracy", value: 0.9 },
          { kind: "max", metric: "confusionRate", value: 0.1 },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
    ],
  },
  {
    id: 7,
    name: "Transpositions",
    description: "Tabiya anchors and plan prompts across routes.",
    checks: [
      {
        id: "tabiya-anchors",
        label: "Tabiya anchors",
        requirements: [
          { kind: "min", metric: "tabiyaMoveAccuracy", value: 0.85 },
          { kind: "min", metric: "planPromptAccuracy", value: 0.8 },
          { kind: "flag", metric: "duplicateDetectionPassed", value: true },
        ],
        minDistinctDays: 2,
        minHoursBetween: HOURS_24,
      },
    ],
  },
  {
    id: 8,
    name: "Graduation",
    description: "Rapid acquisition with 7-day retention and cap discipline.",
    checks: [
      {
        id: "rapid-acquisition",
        label: "New opening sprint",
        requirements: [
          { kind: "min", metric: "slicePlyCount", value: 10 },
          { kind: "min", metric: "positionOnlyAccuracy", value: 0.9 },
          { kind: "flag", metric: "withinDailyCap", value: true },
        ],
        minDistinctDays: 1,
      },
      {
        id: "retention",
        label: "Retention after 7 days",
        requirements: [
          { kind: "min", metric: "retentionAccuracy", value: 0.8 },
          { kind: "flag", metric: "withinDailyCap", value: true },
          {
            kind: "flag",
            metric: "transpositionCheckPassed",
            value: true,
            optional: true,
          },
        ],
        minDistinctDays: 1,
        mustFollow: {
          checkId: "rapid-acquisition",
          minHoursAfter: HOURS_168,
        },
      },
    ],
  },
];

export function getLevelDefinition(levelId: LevelId): LevelDefinition | undefined {
  return LEVEL_DEFINITIONS.find((level) => level.id === levelId);
}
