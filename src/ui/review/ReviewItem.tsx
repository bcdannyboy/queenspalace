import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MnemonicCard, TrainingItem, UUID } from "../../../contracts/v1/domain.types";
import { uciFromMoveIntent } from "../../core/chess/intent";
import { BoardWrapper, LegalMoveMap, PromotionMap } from "../board/BoardWrapper";

export interface ReviewPrompt {
  id: UUID;
  itemType: TrainingItem["itemType"];
  promptTitle?: string;
  promptText?: string;
  hint?: string;
  fen?: string;
  orientation?: "white" | "black";
  expectedUcis?: string[];
  expectedText?: string;
  mnemonic?: MnemonicCard | null;
  tags?: string[];
  legalMoveMap?: LegalMoveMap;
  legalPromotions?: PromotionMap;
  validateAnswer?: (answer: ReviewAnswer) => ReviewEvaluation;
}

export interface ReviewAnswer {
  answerUci?: string;
  answerText?: string;
}

export interface ReviewEvaluation {
  correct: boolean;
  expectedAnswer?: string;
}

export interface ReviewItemResult extends ReviewAnswer {
  promptId: UUID;
  correct: boolean;
  responseMs: number;
  expectedAnswer?: string;
}

export interface ReviewItemProps {
  prompt: ReviewPrompt;
  onSubmit: (result: ReviewItemResult) => void;
  disabled?: boolean;
  autoSubmit?: boolean;
  showMnemonic?: boolean;
  allowTextAnswer?: boolean;
}

const UCI_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeUci(value: string | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  return UCI_REGEX.test(normalized) ? normalized : null;
}

function defaultEvaluate(prompt: ReviewPrompt, answer: ReviewAnswer): ReviewEvaluation {
  const expectedUcis = (prompt.expectedUcis ?? [])
    .map((uci) => normalizeUci(uci))
    .filter((uci): uci is string => Boolean(uci));
  const answerUci = normalizeUci(answer.answerUci) ?? normalizeUci(answer.answerText);

  if (expectedUcis.length > 0) {
    const correct = Boolean(answerUci) && expectedUcis.includes(answerUci!);
    return {
      correct,
      expectedAnswer: expectedUcis.join(", "),
    };
  }

  const expectedText = normalizeText(prompt.expectedText);
  const answerText = normalizeText(answer.answerText);
  if (expectedText) {
    return {
      correct: Boolean(answerText) && answerText === expectedText,
      expectedAnswer: prompt.expectedText,
    };
  }

  return {
    correct: false,
    expectedAnswer: prompt.expectedText ?? (prompt.expectedUcis ?? []).join(", "),
  };
}

function formatResponseMs(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }
  return `${(value / 1000).toFixed(1)} s`;
}

export function ReviewItem({
  prompt,
  onSubmit,
  disabled = false,
  autoSubmit = true,
  showMnemonic = true,
  allowTextAnswer = true,
}: ReviewItemProps): JSX.Element {
  const [answerUci, setAnswerUci] = useState<string>("");
  const [answerText, setAnswerText] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<ReviewEvaluation | null>(null);
  const [responseMs, setResponseMs] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setAnswerUci("");
    setAnswerText("");
    setSubmitted(false);
    setEvaluation(null);
    setResponseMs(0);
    startTimeRef.current = Date.now();
  }, [prompt.id]);

  const expectedDisplay = useMemo(() => {
    if (evaluation?.expectedAnswer) {
      return evaluation.expectedAnswer;
    }
    if (prompt.expectedText) {
      return prompt.expectedText;
    }
    if (prompt.expectedUcis && prompt.expectedUcis.length > 0) {
      return prompt.expectedUcis.join(", ");
    }
    return "";
  }, [evaluation?.expectedAnswer, prompt.expectedText, prompt.expectedUcis]);

  const handleSubmit = useCallback(
    (override?: Partial<ReviewAnswer>) => {
      if (submitted || disabled) {
        return;
      }
      const resolvedAnswer: ReviewAnswer = {
        answerUci: override?.answerUci ?? answerUci || undefined,
        answerText: override?.answerText ?? answerText || undefined,
      };
      const elapsedMs = Math.max(0, Date.now() - startTimeRef.current);
      const evalResult = prompt.validateAnswer
        ? prompt.validateAnswer(resolvedAnswer)
        : defaultEvaluate(prompt, resolvedAnswer);
      setSubmitted(true);
      setEvaluation(evalResult);
      setResponseMs(elapsedMs);
      onSubmit({
        promptId: prompt.id,
        correct: evalResult.correct,
        responseMs: elapsedMs,
        answerUci: resolvedAnswer.answerUci,
        answerText: resolvedAnswer.answerText,
        expectedAnswer: evalResult.expectedAnswer,
      });
    },
    [
      answerText,
      answerUci,
      disabled,
      onSubmit,
      prompt,
      submitted,
    ]
  );

  const handleMoveIntent = useCallback(
    (intent: Parameters<typeof uciFromMoveIntent>[0]) => {
      const uci = uciFromMoveIntent(intent);
      if (!uci) {
        return;
      }
      setAnswerUci(uci);
      if (autoSubmit) {
        handleSubmit({ answerUci: uci });
      }
    },
    [autoSubmit, handleSubmit]
  );

  const canSubmit = !submitted && !disabled && (answerUci || answerText);

  const feedbackTone = submitted
    ? evaluation?.correct
      ? "#0f5132"
      : "#842029"
    : "#1b1a17";

  return (
    <section
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "24px",
        padding: "24px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #f7f3e8 0%, #e4f2f1 100%)",
        border: "1px solid #e1d7c6",
        boxShadow: "0 18px 40px rgba(60, 50, 30, 0.12)",
        color: "#1b1a17",
        fontFamily: "Spectral, Georgia, serif",
      }}
    >
      <div style={{ flex: "1 1 320px", minWidth: "280px" }}>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#101820",
            color: "#f7f3e8",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
            {prompt.itemType.replace(/([a-z])([A-Z])/g, "$1 $2")}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>
            {prompt.promptTitle ?? "Recall the move"}
          </div>
          {prompt.promptText ? (
            <div style={{ fontSize: "14px", color: "#d1c7b8" }}>
              {prompt.promptText}
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: "18px",
            height: "320px",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #e1d7c6",
            background: "#0f1114",
          }}
        >
          {prompt.fen ? (
            <BoardWrapper
              fen={prompt.fen}
              orientation={prompt.orientation}
              interactive={!submitted && !disabled}
              legalMoveMap={prompt.legalMoveMap}
              legalPromotions={prompt.legalPromotions}
              onMoveIntent={handleMoveIntent}
              showCoordinates
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d1c7b8",
                fontSize: "14px",
                textAlign: "center",
                padding: "12px",
              }}
            >
              Add a FEN to show the board.
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: "1 1 320px", minWidth: "280px" }}>
        <div
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "#fffaf2",
            border: "1px solid #eadfcf",
            boxShadow: "0 10px 24px rgba(60, 50, 30, 0.08)",
            fontFamily: "Work Sans, Helvetica, sans-serif",
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: 600 }}>Your answer</div>
          {allowTextAnswer ? (
            <input
              type="text"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              disabled={submitted || disabled}
              placeholder="Type move or keyword"
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #c9bba7",
                fontSize: "14px",
                background: submitted || disabled ? "#f1e8db" : "#fff",
              }}
            />
          ) : null}

          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => handleSubmit()}
              style={{
                padding: "9px 14px",
                borderRadius: "999px",
                border: "none",
                background: canSubmit ? "#0c3b2e" : "#a3a3a3",
                color: "#fdf7ee",
                fontSize: "13px",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              Submit answer
            </button>
            {submitted ? (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: evaluation?.correct ? "#d1f5de" : "#ffd6cf",
                  color: feedbackTone,
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {evaluation?.correct ? "Correct" : "Needs repair"}
              </div>
            ) : null}
          </div>

          {submitted ? (
            <div style={{ marginTop: "14px", fontSize: "13px", color: feedbackTone }}>
              {expectedDisplay ? (
                <div>
                  Expected: <strong>{expectedDisplay}</strong>
                </div>
              ) : (
                <div>Expected: Not provided</div>
              )}
              <div style={{ marginTop: "6px" }}>
                Response time: {formatResponseMs(responseMs)}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b5e4b" }}>
              {prompt.hint ?? "Tip: Use the board or type the move."}
            </div>
          )}
        </div>

        {prompt.tags && prompt.tags.length > 0 ? (
          <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#1f2a20",
                  color: "#f3f0e9",
                  fontSize: "12px",
                  fontFamily: "Work Sans, Helvetica, sans-serif",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {showMnemonic && prompt.mnemonic ? (
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "14px",
              background: "#f1f7f5",
              border: "1px solid #d0e2dd",
              boxShadow: "0 10px 20px rgba(20, 40, 30, 0.08)",
              fontFamily: "Work Sans, Helvetica, sans-serif",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0c3b2e" }}>
              {prompt.mnemonic.title}
            </div>
            <div style={{ fontSize: "13px", color: "#28423a", marginTop: "6px" }}>
              {prompt.mnemonic.imageDescription}
            </div>
            <div style={{ fontSize: "12px", color: "#3d4f48", marginTop: "8px" }}>
              {prompt.mnemonic.story}
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {prompt.mnemonic.strengthTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "999px",
                    background: "#d6ede4",
                    color: "#1b3a33",
                    fontSize: "11px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
