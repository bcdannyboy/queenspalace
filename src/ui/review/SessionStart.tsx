import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReviewLog, SRSState, UUID } from "../../../contracts/v1/domain.types";
import type { ReviewLogInput } from "../../core/srs/sm2";
import { scheduleReview, SRS_INVALID_INPUT } from "../../core/srs/sm2";
import { ratingFromTime } from "../../core/srs/grades";
import { buildQueue, QueueCaps, QueueOrdering } from "../../core/srs/queue";
import { RepairDetails, RepairLoop } from "./RepairLoop";
import { ReviewItem, ReviewItemResult, ReviewPrompt } from "./ReviewItem";

export interface ReviewSessionSummary {
  startedAt: string;
  endedAt: string;
  durationMs: number;
  completedCount: number;
  correctCount: number;
  incorrectCount: number;
  reviewLogs: ReviewLog[];
  nextStates: SRSState[];
}

export interface SessionStartProps {
  prompts: ReviewPrompt[];
  states: SRSState[];
  ordering?: QueueOrdering;
  queueCaps?: QueueCaps;
  sessionDurationMs?: number;
  repairDelay?: number;
  allowFullSession?: boolean;
  now?: () => string;
  onSessionComplete?: (summary: ReviewSessionSummary) => void;
  onSessionCancel?: () => void;
}

interface PendingRepair {
  result: ReviewItemResult;
  expectedAnswer?: string;
}

interface RetestEntry {
  promptId: UUID;
  remaining: number;
}

const DEFAULT_SESSION_MS = 5 * 60 * 1000;
const DEFAULT_REPAIR_DELAY = 2;

function createFallbackState(trainingItemId: UUID, nowIso: string): SRSState {
  return {
    trainingItemId,
    scheduler: "sm2",
    state: "new",
    dueAt: nowIso,
    intervalDays: 0,
    easeFactor: 2.5,
    lapses: 0,
    repetitions: 0,
  };
}

function formatCountdown(ms: number | null): string {
  if (!Number.isFinite(ms)) {
    return "--:--";
  }
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function defaultCapsForDuration(durationMs: number | null): QueueCaps {
  if (!durationMs || durationMs <= 0) {
    return { maxReviews: 200, maxNew: 80 };
  }
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  const total = Math.max(8, minutes * 4);
  return {
    maxReviews: total,
    maxNew: Math.max(4, Math.round(total * 0.4)),
  };
}

function parseIsoTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SessionStart({
  prompts,
  states,
  ordering,
  queueCaps,
  sessionDurationMs = DEFAULT_SESSION_MS,
  repairDelay = DEFAULT_REPAIR_DELAY,
  allowFullSession = true,
  now,
  onSessionComplete,
  onSessionCancel,
}: SessionStartProps): JSX.Element {
  const nowRef = useRef(now ?? (() => new Date().toISOString()));
  useEffect(() => {
    nowRef.current = now ?? (() => new Date().toISOString());
  }, [now]);

  const promptById = useMemo(() => {
    const map = new Map<UUID, ReviewPrompt>();
    for (const prompt of prompts) {
      map.set(prompt.id, prompt);
    }
    return map;
  }, [prompts]);

  const stateByIdRef = useRef<Map<UUID, SRSState>>(new Map());
  const reviewLogsRef = useRef<ReviewLog[]>([]);
  const statsRef = useRef({ completed: 0, correct: 0, incorrect: 0 });
  const sessionStartMsRef = useRef<number>(0);
  const timeExpiredRef = useRef<boolean>(false);

  const [phase, setPhase] = useState<"idle" | "active" | "summary">("idle");
  const [queueIds, setQueueIds] = useState<UUID[]>([]);
  const [currentPromptId, setCurrentPromptId] = useState<UUID | null>(null);
  const [pendingRetests, setPendingRetests] = useState<RetestEntry[]>([]);
  const [pendingRepair, setPendingRepair] = useState<PendingRepair | null>(null);
  const [activeDurationMs, setActiveDurationMs] = useState<number | null>(sessionDurationMs);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(sessionDurationMs);
  const [timeExpired, setTimeExpired] = useState(false);
  const [stats, setStats] = useState({ completed: 0, correct: 0, incorrect: 0 });
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);

  useEffect(() => {
    timeExpiredRef.current = timeExpired;
  }, [timeExpired]);

  useEffect(() => {
    if (phase !== "active" || !activeDurationMs) {
      return;
    }
    const startMs = Date.now();
    setTimeLeftMs(activeDurationMs);
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startMs;
      const remaining = Math.max(0, activeDurationMs - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        setTimeExpired(true);
        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [phase, activeDurationMs]);

  const buildSessionQueue = useCallback(
    (durationMs: number | null) => {
      const nowIso = nowRef.current();
      const stateMap = new Map<UUID, SRSState>();
      for (const state of states) {
        stateMap.set(state.trainingItemId, state);
      }

      const normalizedStates = prompts.map(
        (prompt) => stateMap.get(prompt.id) ?? createFallbackState(prompt.id, nowIso)
      );
      const caps = queueCaps ?? defaultCapsForDuration(durationMs);
      const queue = buildQueue({ now: nowIso, states: normalizedStates, caps, ordering });
      const filtered = queue.filter((id) => promptById.has(id));
      return filtered.length > 0 ? filtered : prompts.map((prompt) => prompt.id);
    },
    [ordering, promptById, prompts, queueCaps, states]
  );

  const dueQueuePreview = useMemo(() => buildSessionQueue(sessionDurationMs), [buildSessionQueue, sessionDurationMs]);

  const advanceQueue = useCallback(
    (queue: UUID[], retests: RetestEntry[]) => {
      const updatedRetests = retests.map((entry) => ({
        ...entry,
        remaining: entry.remaining - 1,
      }));
      const readyIndex = updatedRetests.findIndex((entry) => entry.remaining <= 0);
      if (readyIndex >= 0) {
        const [ready] = updatedRetests.splice(readyIndex, 1);
        return { nextId: ready.promptId, queue, retests: updatedRetests };
      }
      if (queue.length > 0) {
        const [nextId, ...rest] = queue;
        return { nextId, queue: rest, retests: updatedRetests };
      }
      if (updatedRetests.length > 0) {
        updatedRetests.sort((a, b) => a.remaining - b.remaining);
        const [next, ...rest] = updatedRetests;
        return { nextId: next.promptId, queue: [], retests: rest };
      }
      return { nextId: null, queue: [], retests: [] };
    },
    []
  );

  const upsertRetest = useCallback(
    (current: RetestEntry[], promptId: UUID) => {
      const existing = current.find((entry) => entry.promptId === promptId);
      if (existing) {
        return current.map((entry) =>
          entry.promptId === promptId
            ? { ...entry, remaining: Math.min(entry.remaining, repairDelay) }
            : entry
        );
      }
      return [...current, { promptId, remaining: repairDelay }];
    },
    [repairDelay]
  );

  const finalizeAnswer = useCallback(
    (result: ReviewItemResult, repair?: RepairDetails) => {
      const prompt = promptById.get(result.promptId);
      if (!prompt) {
        return;
      }
      const nowIso = nowRef.current();
      const previousState =
        stateByIdRef.current.get(result.promptId) ?? createFallbackState(result.promptId, nowIso);
      const rating = ratingFromTime({
        correct: result.correct,
        responseMs: result.responseMs,
        itemType: prompt.itemType,
      });
      const reviewLogInput: ReviewLogInput = {
        responseMs: result.responseMs,
        correct: result.correct,
        answerUci: result.answerUci,
        answerText: result.answerText,
        errorType: repair?.errorType,
      };
      const scheduled = scheduleReview({
        trainingItemId: result.promptId,
        now: nowIso,
        rating,
        previousState,
        reviewLog: reviewLogInput,
      });

      if (scheduled !== SRS_INVALID_INPUT) {
        stateByIdRef.current.set(result.promptId, scheduled.nextState);
        reviewLogsRef.current = [...reviewLogsRef.current, scheduled.reviewLog];
      }

      setStats((current) => {
        const next = {
          completed: current.completed + 1,
          correct: current.correct + (result.correct ? 1 : 0),
          incorrect: current.incorrect + (result.correct ? 0 : 1),
        };
        statsRef.current = next;
        return next;
      });
    },
    [promptById]
  );

  const endSession = useCallback(
    () => {
      const endIso = nowRef.current();
      const startIso = startedAt ?? endIso;
      setEndedAt(endIso);
      setPhase("summary");
      const durationMs = Math.max(0, Date.now() - sessionStartMsRef.current);
      onSessionComplete?.({
        startedAt: startIso,
        endedAt: endIso,
        durationMs,
        completedCount: statsRef.current.completed,
        correctCount: statsRef.current.correct,
        incorrectCount: statsRef.current.incorrect,
        reviewLogs: reviewLogsRef.current,
        nextStates: Array.from(stateByIdRef.current.values()),
      });
    },
    [onSessionComplete, startedAt]
  );

  const startSession = useCallback(
    (durationMs: number | null) => {
      const nowIso = nowRef.current();
      const queue = buildSessionQueue(durationMs);
      const stateMap = new Map<UUID, SRSState>();
      for (const state of states) {
        stateMap.set(state.trainingItemId, state);
      }
      for (const prompt of prompts) {
        if (!stateMap.has(prompt.id)) {
          stateMap.set(prompt.id, createFallbackState(prompt.id, nowIso));
        }
      }
      stateByIdRef.current = stateMap;
      reviewLogsRef.current = [];
      sessionStartMsRef.current = Date.now();
      setStats({ completed: 0, correct: 0, incorrect: 0 });
      statsRef.current = { completed: 0, correct: 0, incorrect: 0 };
      setPendingRetests([]);
      setPendingRepair(null);
      setQueueIds(queue.slice(1));
      setCurrentPromptId(queue[0] ?? null);
      setPhase("active");
      setStartedAt(nowIso);
      setEndedAt(null);
      setActiveDurationMs(durationMs);
      setTimeLeftMs(durationMs);
      setTimeExpired(false);
    },
    [buildSessionQueue, prompts, states]
  );

  const advanceToNext = useCallback(() => {
    const { nextId, queue, retests } = advanceQueue(queueIds, pendingRetests);
    setQueueIds(queue);
    setPendingRetests(retests);
    if (!nextId || timeExpiredRef.current) {
      endSession();
      return;
    }
    setCurrentPromptId(nextId);
  }, [advanceQueue, endSession, pendingRetests, queueIds]);

  const handleSubmit = useCallback(
    (result: ReviewItemResult) => {
      if (pendingRepair) {
        return;
      }
      if (result.correct) {
        finalizeAnswer(result);
        advanceToNext();
        return;
      }
      setPendingRepair({ result, expectedAnswer: result.expectedAnswer });
    },
    [advanceToNext, finalizeAnswer, pendingRepair]
  );

  const handleRepairComplete = useCallback(
    (details: RepairDetails) => {
      if (!pendingRepair) {
        return;
      }
      finalizeAnswer(pendingRepair.result, details);
      const updatedRetests = upsertRetest(pendingRetests, pendingRepair.result.promptId);
      setPendingRetests(updatedRetests);
      setPendingRepair(null);
      const { nextId, queue, retests } = advanceQueue(queueIds, updatedRetests);
      setQueueIds(queue);
      setPendingRetests(retests);
      if (!nextId || timeExpiredRef.current) {
        endSession();
        return;
      }
      setCurrentPromptId(nextId);
    },
    [advanceQueue, endSession, finalizeAnswer, pendingRepair, pendingRetests, queueIds, upsertRetest]
  );

  const handleCancel = () => {
    setPhase("idle");
    onSessionCancel?.();
  };

  const currentPrompt = currentPromptId ? promptById.get(currentPromptId) ?? null : null;
  const timeDisplay = formatCountdown(timeLeftMs);

  const progressText = `${stats.completed} done`;
  const remainingCount = queueIds.length + pendingRetests.length + (currentPrompt ? 1 : 0);

  if (phase === "summary" && startedAt && endedAt) {
    const durationMs = parseIsoTimestamp(endedAt) - parseIsoTimestamp(startedAt);
    return (
      <section
        style={{
          padding: "28px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #f7f0e5 0%, #edf7f2 100%)",
          border: "1px solid #e1d7c6",
          boxShadow: "0 22px 48px rgba(60, 50, 30, 0.12)",
          fontFamily: "Spectral, Georgia, serif",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 700, color: "#1b1a17" }}>Session complete</div>
        <div style={{ marginTop: "8px", fontSize: "13px", color: "#5c5246" }}>
          Duration: {formatCountdown(durationMs)}
        </div>
        <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ padding: "10px 14px", borderRadius: "12px", background: "#fffaf2" }}>
            Completed: {stats.completed}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: "12px", background: "#d1f5de" }}>
            Correct: {stats.correct}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: "12px", background: "#ffd6cf" }}>
            Repair loops: {stats.incorrect}
          </div>
        </div>
        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => startSession(sessionDurationMs)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "none",
              background: "#0c3b2e",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Start another 5-min session
          </button>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid #d7c8b5",
              background: "transparent",
              color: "#1b1a17",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Back to start
          </button>
        </div>
      </section>
    );
  }

  if (phase === "active") {
    return (
      <section
        style={{
          padding: "24px",
          borderRadius: "20px",
          background: "#fdf8f1",
          border: "1px solid #eadfcf",
          boxShadow: "0 20px 40px rgba(60, 50, 30, 0.12)",
          fontFamily: "Spectral, Georgia, serif",
        }}
      >
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#1b1a17" }}>Daily review</div>
            <div style={{ fontSize: "12px", color: "#5c5246" }}>
              {progressText} - {remainingCount} left
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "12px",
                background: "#0c3b2e",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              {activeDurationMs ? `Time left ${timeDisplay}` : "Full session"}
            </div>
            <button
              type="button"
              onClick={endSession}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid #d7c8b5",
                background: "transparent",
                color: "#1b1a17",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              End session
            </button>
          </div>
        </header>

        <div style={{ marginTop: "20px" }}>
          {currentPrompt ? (
            <ReviewItem key={currentPrompt.id} prompt={currentPrompt} onSubmit={handleSubmit} />
          ) : (
            <div style={{ padding: "24px", textAlign: "center", color: "#5c5246" }}>
              No items ready.
            </div>
          )}
        </div>

        {pendingRepair ? (
          <RepairLoop
            promptId={pendingRepair.result.promptId}
            expectedAnswer={pendingRepair.expectedAnswer}
            userAnswer={pendingRepair.result.answerUci ?? pendingRepair.result.answerText}
            mnemonic={currentPrompt?.mnemonic ?? null}
            onComplete={handleRepairComplete}
          />
        ) : null}

        {timeExpired ? (
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "#fde6e0",
              color: "#842029",
              fontSize: "12px",
            }}
          >
            Time is up. Finish the current card to wrap the session.
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "28px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #f7f2ea 0%, #e4f2f1 100%)",
        border: "1px solid #e1d7c6",
        boxShadow: "0 22px 48px rgba(60, 50, 30, 0.12)",
        fontFamily: "Spectral, Georgia, serif",
      }}
    >
      <div style={{ fontSize: "24px", fontWeight: 700, color: "#1b1a17" }}>Ready to review</div>
      <div style={{ marginTop: "8px", fontSize: "13px", color: "#5c5246" }}>
        Due now: {dueQueuePreview.length} prompts
      </div>
      <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => startSession(sessionDurationMs)}
          style={{
            padding: "10px 16px",
            borderRadius: "999px",
            border: "none",
            background: "#0c3b2e",
            color: "#fff",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Start 5-min session
        </button>
        {allowFullSession ? (
          <button
            type="button"
            onClick={() => startSession(null)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid #d7c8b5",
              background: "transparent",
              color: "#1b1a17",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Start full session
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleCancel}
          style={{
            padding: "10px 16px",
            borderRadius: "999px",
            border: "1px solid #d7c8b5",
            background: "transparent",
            color: "#1b1a17",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
      <div style={{ marginTop: "16px", fontSize: "12px", color: "#5c5246" }}>
        Local-first review session. No account, no network required.
      </div>
    </section>
  );
}
