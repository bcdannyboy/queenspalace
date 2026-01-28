import React, { useMemo, useState } from "react";
import type { MnemonicCard, ReviewLog, UUID } from "../../../contracts/v1/domain.types";

export interface RepairDetails {
  promptId: UUID;
  errorType: ReviewLog["errorType"];
  selectedUpgrade: "action" | "sensory" | "surprise" | "clarity";
  repairNote: string;
}

export interface RepairLoopProps {
  promptId: UUID;
  expectedAnswer?: string;
  userAnswer?: string;
  mnemonic?: MnemonicCard | null;
  allowSkip?: boolean;
  onComplete: (details: RepairDetails) => void;
  onSkip?: () => void;
}

const ERROR_OPTIONS: Array<{ id: ReviewLog["errorType"]; label: string; description: string }> = [
  { id: "piece", label: "Wrong piece", description: "I picked the wrong piece type." },
  { id: "from", label: "Wrong origin", description: "I moved the right piece from the wrong square." },
  { id: "to", label: "Wrong destination", description: "I aimed at the wrong square." },
  { id: "branch", label: "Wrong branch", description: "I recalled the wrong line or sideline." },
  { id: "special", label: "Special rule", description: "Castling, promotion, or en passant tripped me." },
  { id: "unknown", label: "Not sure", description: "I am not sure what failed." },
];

const UPGRADE_OPTIONS: Array<{ id: RepairDetails["selectedUpgrade"]; label: string; description: string }> = [
  { id: "action", label: "Add action", description: "Give the image stronger movement." },
  { id: "sensory", label: "Add sensory", description: "Add sound, smell, or texture." },
  { id: "surprise", label: "Add surprise", description: "Make it weird or vivid." },
  { id: "clarity", label: "Add clarity", description: "Highlight the key square or piece." },
];

export function RepairLoop({
  promptId,
  expectedAnswer,
  userAnswer,
  mnemonic,
  allowSkip = false,
  onComplete,
  onSkip,
}: RepairLoopProps): JSX.Element {
  const [errorType, setErrorType] = useState<ReviewLog["errorType"]>("unknown");
  const [upgrade, setUpgrade] = useState<RepairDetails["selectedUpgrade"]>("action");
  const [note, setNote] = useState<string>("");

  const canSubmit = Boolean(errorType) && Boolean(upgrade);

  const summary = useMemo(() => {
    const parts = [];
    if (expectedAnswer) {
      parts.push(`Correct: ${expectedAnswer}`);
    }
    if (userAnswer) {
      parts.push(`You answered: ${userAnswer}`);
    }
    return parts.join(" | ");
  }, [expectedAnswer, userAnswer]);

  return (
    <section
      style={{
        marginTop: "20px",
        padding: "20px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #fff1e1 0%, #fff7f0 100%)",
        border: "1px solid #f0d2b7",
        boxShadow: "0 14px 30px rgba(80, 40, 20, 0.12)",
        fontFamily: "Work Sans, Helvetica, sans-serif",
      }}
    >
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#7a2e12" }}>Repair loop</div>
      {summary ? (
        <div style={{ marginTop: "6px", fontSize: "13px", color: "#7a2e12" }}>
          {summary}
        </div>
      ) : null}

      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#432015" }}>What failed?</div>
        <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
          {ERROR_OPTIONS.map((option) => (
            <label
              key={option.id ?? "unknown"}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "12px",
                border: errorType === option.id ? "1px solid #b85c34" : "1px solid #f0d2b7",
                background: errorType === option.id ? "#ffe4cf" : "#fffaf6",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={`repair-error-${promptId}`}
                value={option.id ?? "unknown"}
                checked={errorType === option.id}
                onChange={() => setErrorType(option.id)}
                style={{ marginTop: "4px" }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{option.label}</div>
                <div style={{ fontSize: "12px", color: "#6b3b2c" }}>{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#432015" }}>
          Strengthen the image
        </div>
        <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
          {UPGRADE_OPTIONS.map((option) => (
            <label
              key={option.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "12px",
                border: upgrade === option.id ? "1px solid #0c3b2e" : "1px solid #d9e2dd",
                background: upgrade === option.id ? "#e4f2f1" : "#f7fbfa",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={`repair-upgrade-${promptId}`}
                value={option.id}
                checked={upgrade === option.id}
                onChange={() => setUpgrade(option.id)}
                style={{ marginTop: "4px" }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{option.label}</div>
                <div style={{ fontSize: "12px", color: "#305047" }}>{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#432015" }}>Rewrite the cue</div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Add a quick note or stronger image."
          style={{
            marginTop: "8px",
            width: "100%",
            padding: "10px 12px",
            borderRadius: "12px",
            border: "1px solid #f0d2b7",
            background: "#fffaf6",
            fontSize: "13px",
            fontFamily: "Work Sans, Helvetica, sans-serif",
          }}
        />
      </div>

      {mnemonic ? (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "12px",
            background: "#fdf1e5",
            border: "1px solid #f0d2b7",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#7a2e12" }}>Mnemonic</div>
          <div style={{ fontSize: "12px", marginTop: "6px", color: "#6b3b2c" }}>
            {mnemonic.title}
          </div>
          <div style={{ fontSize: "12px", marginTop: "6px", color: "#6b3b2c" }}>
            {mnemonic.imageDescription}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            onComplete({
              promptId,
              errorType: errorType ?? "unknown",
              selectedUpgrade: upgrade,
              repairNote: note,
            })
          }
          style={{
            padding: "10px 16px",
            borderRadius: "999px",
            border: "none",
            background: canSubmit ? "#7a2e12" : "#bda89a",
            color: "#fff",
            fontSize: "13px",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Lock repair and continue
        </button>
        {allowSkip && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid #c89e84",
              background: "transparent",
              color: "#7a2e12",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Skip repair
          </button>
        ) : null}
      </div>
    </section>
  );
}
