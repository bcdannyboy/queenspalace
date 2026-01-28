import { describe, expect, it } from "vitest";
import type { SRSState } from "../../contracts/v1/domain.types";
import { buildQueue } from "../../src/core/srs/queue";

const NOW = "2025-01-01T12:00:00.000Z";

function uuid(suffix: number): string {
  return `00000000-0000-0000-0000-${suffix.toString().padStart(12, "0")}`;
}

function makeState(overrides: Partial<SRSState> & Pick<SRSState, "trainingItemId" | "state" | "dueAt">): SRSState {
  return {
    trainingItemId: overrides.trainingItemId,
    scheduler: "sm2",
    state: overrides.state,
    dueAt: overrides.dueAt,
    intervalDays: overrides.intervalDays ?? (overrides.state === "review" ? 3 : 0),
    easeFactor: overrides.easeFactor,
    lapses: overrides.lapses ?? 0,
    repetitions: overrides.repetitions ?? 0,
    lastReviewedAt: overrides.lastReviewedAt,
  };
}

describe("srs_queue_under_cap", () => {
  it("respects review/new caps and deterministic ordering", () => {
    const states: SRSState[] = [
      makeState({
        trainingItemId: uuid(1),
        state: "review",
        dueAt: "2025-01-01T00:00:00.000Z",
        intervalDays: 4,
        easeFactor: 2.4,
        lapses: 0,
        repetitions: 3,
      }),
      makeState({
        trainingItemId: uuid(2),
        state: "review",
        dueAt: "2025-01-01T06:00:00.000Z",
        intervalDays: 5,
        easeFactor: 2.5,
        lapses: 1,
        repetitions: 4,
      }),
      makeState({
        trainingItemId: uuid(3),
        state: "review",
        dueAt: "2025-01-01T10:00:00.000Z",
        intervalDays: 2,
        easeFactor: 2.2,
        lapses: 0,
        repetitions: 5,
      }),
      makeState({
        trainingItemId: uuid(4),
        state: "relearning",
        dueAt: "2024-12-31T23:00:00.000Z",
        intervalDays: 0,
        easeFactor: 2.5,
        lapses: 2,
        repetitions: 6,
      }),
      makeState({
        trainingItemId: uuid(5),
        state: "learning",
        dueAt: "2025-01-01T11:00:00.000Z",
        intervalDays: 0,
        easeFactor: 2.5,
        lapses: 0,
        repetitions: 1,
      }),
      makeState({
        trainingItemId: uuid(6),
        state: "new",
        dueAt: "2025-01-01T01:00:00.000Z",
        intervalDays: 0,
        repetitions: 0,
      }),
      makeState({
        trainingItemId: uuid(7),
        state: "new",
        dueAt: "2025-01-01T02:00:00.000Z",
        intervalDays: 0,
        repetitions: 0,
      }),
      makeState({
        trainingItemId: uuid(8),
        state: "new",
        dueAt: "2025-01-01T03:00:00.000Z",
        intervalDays: 0,
        repetitions: 0,
      }),
      makeState({
        trainingItemId: uuid(9),
        state: "suspended",
        dueAt: "2025-01-01T00:00:00.000Z",
        intervalDays: 0,
        repetitions: 0,
      }),
      makeState({
        trainingItemId: uuid(10),
        state: "review",
        dueAt: "2025-01-02T00:00:00.000Z",
        intervalDays: 6,
        easeFactor: 2.5,
        lapses: 0,
        repetitions: 3,
      }),
    ];

    const caps = { maxReviews: 2, maxNew: 1 };
    const queue = buildQueue({ now: NOW, states, caps });

    expect(queue).toEqual([uuid(4), uuid(1), uuid(5), uuid(6)]);

    const byId = new Map(states.map((state) => [state.trainingItemId, state]));
    const reviewCount = queue.filter((id) => {
      const state = byId.get(id);
      return state?.state === "review" || state?.state === "relearning";
    }).length;
    const newCount = queue.filter((id) => byId.get(id)?.state === "new").length;

    expect(reviewCount).toBe(2);
    expect(newCount).toBe(1);

    const queueShuffled = buildQueue({ now: NOW, states: [...states].reverse(), caps });
    expect(queueShuffled).toEqual(queue);
  });
});
