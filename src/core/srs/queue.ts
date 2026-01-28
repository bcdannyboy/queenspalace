import type { SRSState, UUID } from "../../../contracts/v1/domain.types";

export type QueueOrdering = "dueFirst" | "riskFirst";

export interface QueueCaps {
  maxReviews: number;
  maxNew: number;
}

export interface BuildQueueInput {
  now: string;
  states: SRSState[];
  caps: QueueCaps;
  ordering?: QueueOrdering;
}

const DEFAULT_EASE = 2.5;

interface QueueEntry {
  state: SRSState;
  dueMs: number;
  ease: number;
  lapses: number;
  intervalDays: number;
}

function parseIsoTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCap(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function statePriority(state: SRSState["state"]): number {
  if (state === "learning") {
    return 0;
  }
  if (state === "relearning") {
    return 1;
  }
  if (state === "review") {
    return 2;
  }
  if (state === "new") {
    return 3;
  }
  return 4;
}

function compareIds(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

function compareDueFirst(a: QueueEntry, b: QueueEntry): number {
  if (a.dueMs !== b.dueMs) {
    return a.dueMs - b.dueMs;
  }
  const priorityDiff = statePriority(a.state.state) - statePriority(b.state.state);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  return compareIds(a.state.trainingItemId, b.state.trainingItemId);
}

function compareRiskFirst(a: QueueEntry, b: QueueEntry): number {
  if (a.lapses !== b.lapses) {
    return b.lapses - a.lapses;
  }
  if (a.ease !== b.ease) {
    return a.ease - b.ease;
  }
  if (a.intervalDays !== b.intervalDays) {
    return a.intervalDays - b.intervalDays;
  }
  if (a.dueMs !== b.dueMs) {
    return a.dueMs - b.dueMs;
  }
  const priorityDiff = statePriority(a.state.state) - statePriority(b.state.state);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  return compareIds(a.state.trainingItemId, b.state.trainingItemId);
}

function toEntry(state: SRSState, dueMs: number): QueueEntry {
  const ease = Number.isFinite(state.easeFactor) ? state.easeFactor! : DEFAULT_EASE;
  const lapses = Number.isFinite(state.lapses) ? state.lapses : 0;
  const intervalDays = Number.isFinite(state.intervalDays) ? state.intervalDays : 0;
  return {
    state,
    dueMs,
    ease,
    lapses,
    intervalDays,
  };
}

export function buildQueue({ now, states, caps, ordering = "dueFirst" }: BuildQueueInput): UUID[] {
  const nowMs = parseIsoTimestamp(now);
  if (nowMs === null) {
    return [];
  }

  const maxReviews = normalizeCap(caps?.maxReviews);
  const maxNew = normalizeCap(caps?.maxNew);

  const dueItems: QueueEntry[] = [];
  const newItems: QueueEntry[] = [];

  for (const state of states) {
    if (!state || state.state === "suspended") {
      continue;
    }

    const dueMs = parseIsoTimestamp(state.dueAt);
    if (dueMs === null || dueMs > nowMs) {
      continue;
    }

    const entry = toEntry(state, dueMs);

    if (state.state === "new") {
      newItems.push(entry);
    } else {
      dueItems.push(entry);
    }
  }

  const comparator = ordering === "riskFirst" ? compareRiskFirst : compareDueFirst;

  dueItems.sort(comparator);
  newItems.sort(comparator);

  const queue: UUID[] = [];
  let reviewCount = 0;

  for (const entry of dueItems) {
    if (entry.state.state === "learning") {
      queue.push(entry.state.trainingItemId);
      continue;
    }
    if (entry.state.state === "review" || entry.state.state === "relearning") {
      if (reviewCount < maxReviews) {
        queue.push(entry.state.trainingItemId);
        reviewCount += 1;
      }
    }
  }

  let newCount = 0;
  for (const entry of newItems) {
    if (newCount >= maxNew) {
      break;
    }
    queue.push(entry.state.trainingItemId);
    newCount += 1;
  }

  return queue;
}
