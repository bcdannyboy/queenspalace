import React, { useEffect, useMemo, useState } from "react";
import type { LevelId, LevelRequirement } from "../../core/levels/criteria";
import { LEVEL_DEFINITIONS } from "../../core/levels/criteria";
import {
  computeUnlockStatus,
  evaluateAllLevelProgress,
  LevelAttempt,
  LevelProgress,
  LevelProgressOptions,
} from "../../core/levels/progress";

export interface LevelMapProps {
  attempts: LevelAttempt[];
  options?: LevelProgressOptions;
  activeLevelId?: LevelId;
  onSelectLevel?: (levelId: LevelId) => void;
}

function humanizeMetric(metric: string): string {
  return metric
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^[a-z]/, (match) => match.toUpperCase());
}

function formatMetricValue(metric: string, value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const isRate = metric.toLowerCase().includes("accuracy") || metric.toLowerCase().includes("rate");
  if (value <= 1 && isRate) {
    return `${Math.round(value * 100)}%`;
  }
  if (metric.toLowerCase().includes("median") || metric.toLowerCase().includes("ms")) {
    return `${Math.round(value)} ms`;
  }
  return `${value}`;
}

function formatRequirement(requirement: LevelRequirement): string {
  const label = humanizeMetric(requirement.metric);
  if (requirement.kind === "flag") {
    return `${label}: ${requirement.value ? "Yes" : "No"}`;
  }
  const value = formatMetricValue(requirement.metric, requirement.value);
  return requirement.kind === "min" ? `${label} >= ${value}` : `${label} <= ${value}`;
}

function findProgress(levelId: LevelId, progress: LevelProgress[]): LevelProgress | undefined {
  return progress.find((entry) => entry.levelId === levelId);
}

export function LevelMap({
  attempts,
  options,
  activeLevelId,
  onSelectLevel,
}: LevelMapProps): JSX.Element {
  const progress = useMemo(
    () => evaluateAllLevelProgress(attempts, options),
    [attempts, options]
  );
  const unlockStatus = useMemo(() => computeUnlockStatus(progress), [progress]);
  const [expandedLevel, setExpandedLevel] = useState<LevelId | null>(activeLevelId ?? null);

  useEffect(() => {
    if (activeLevelId) {
      setExpandedLevel(activeLevelId);
    }
  }, [activeLevelId]);

  const handleToggle = (levelId: LevelId) => {
    setExpandedLevel((current) => (current === levelId ? null : levelId));
  };

  return (
    <section
      style={{
        padding: "28px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #f9f2e7 0%, #e8f0f4 100%)",
        border: "1px solid #e1d7c6",
        boxShadow: "0 24px 44px rgba(60, 50, 30, 0.12)",
        fontFamily: "Spectral, Georgia, serif",
      }}
    >
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1b1a17" }}>Level ladder</div>
          <div style={{ fontSize: "13px", color: "#5c5246" }}>
            Progress across the 8-level mastery ladder.
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "#5c5246" }}>
          Local-first, no sign-in required.
        </div>
      </header>

      <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
        {LEVEL_DEFINITIONS.map((definition) => {
          const levelProgress = findProgress(definition.id, progress);
          const unlock = unlockStatus.find((entry) => entry.levelId === definition.id);
          const passedChecks = levelProgress?.checks.filter((check) => check.passed).length ?? 0;
          const totalChecks = levelProgress?.checks.length ?? definition.checks.length;
          const isExpanded = expandedLevel === definition.id;
          const status = unlock?.unlocked
            ? levelProgress?.completed
              ? "Complete"
              : "In progress"
            : "Locked";
          const accent = unlock?.unlocked
            ? levelProgress?.completed
              ? "#0c3b2e"
              : "#1b5c8a"
            : "#8a6a43";

          return (
            <div
              key={definition.id}
              style={{
                padding: "18px",
                borderRadius: "16px",
                border: "1px solid #eadfcf",
                background: "#fffdf8",
                boxShadow: "0 12px 24px rgba(60, 50, 30, 0.08)",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: accent,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  {definition.id}
                </div>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#1b1a17" }}>
                    {definition.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#5c5246" }}>{definition.description}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "#f1e8db",
                      color: "#1b1a17",
                      fontSize: "12px",
                      fontFamily: "Work Sans, Helvetica, sans-serif",
                      textAlign: "center",
                    }}
                  >
                    {status}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5c5246", textAlign: "center" }}>
                    {passedChecks}/{totalChecks} checks
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => onSelectLevel?.(definition.id)}
                  disabled={!unlock?.unlocked}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "none",
                    background: unlock?.unlocked ? "#0c3b2e" : "#b9b1a6",
                    color: "#fff",
                    fontSize: "12px",
                    cursor: unlock?.unlocked ? "pointer" : "not-allowed",
                  }}
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(definition.id)}
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
                  {isExpanded ? "Hide details" : "Show details"}
                </button>
              </div>

              {isExpanded ? (
                <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
                  {definition.checks.map((check) => {
                    const statusEntry = levelProgress?.checks.find((entry) => entry.checkId === check.id);
                    const isPassed = statusEntry?.passed ?? false;
                    const blockedBy = statusEntry?.blockedBy;

                    return (
                      <div
                        key={check.id}
                        style={{
                          padding: "12px",
                          borderRadius: "12px",
                          background: "#f8f2ea",
                          border: "1px solid #eadfcf",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>{check.label}</div>
                            <div style={{ fontSize: "12px", color: "#5c5246" }}>{check.id}</div>
                          </div>
                          <div
                            style={{
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background: isPassed ? "#d1f5de" : "#fde6e0",
                              color: isPassed ? "#0f5132" : "#842029",
                              fontSize: "12px",
                              fontFamily: "Work Sans, Helvetica, sans-serif",
                            }}
                          >
                            {isPassed ? "Passed" : "Pending"}
                          </div>
                        </div>

                        <ul style={{ marginTop: "8px", paddingLeft: "18px", color: "#5c5246", fontSize: "12px" }}>
                          {check.requirements.map((requirement) => (
                            <li key={`${check.id}-${requirement.metric}`}>{formatRequirement(requirement)}</li>
                          ))}
                        </ul>

                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#5c5246" }}>
                          Distinct days: {statusEntry?.distinctDayCount ?? 0}/{
                            statusEntry?.requiredDistinctDays ?? 1
                          }
                          {statusEntry?.minHoursBetween ? (
                            <div>Minimum spacing: {statusEntry.minHoursBetween} hours</div>
                          ) : null}
                          {statusEntry?.minHoursAfter ? (
                            <div>Must follow {statusEntry.blockedBy ?? "prior"} by {statusEntry.minHoursAfter} hours</div>
                          ) : null}
                          {blockedBy ? <div>Blocked by: {blockedBy}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
