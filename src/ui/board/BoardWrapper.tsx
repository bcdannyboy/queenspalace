import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type MoveIntent,
  type PromotionPiece,
  type Square,
  normalizePromotionPiece,
  normalizeSquare,
} from "../../core/chess/intent";

type Orientation = "white" | "black";

export type LegalMoveMap = Partial<Record<Square, Square[]>>;
export type PromotionMap = Partial<Record<`${Square}${Square}`, PromotionPiece[]>>;

export interface BoardWrapperProps {
  fen: string;
  orientation?: Orientation;
  interactive?: boolean;
  legalMoveMap?: LegalMoveMap;
  legalPromotions?: PromotionMap;
  onMoveIntent?: (intent: MoveIntent) => void;
  overlays?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  showCoordinates?: boolean;
}

interface PendingPromotion {
  from: Square;
  to: Square;
  options: PromotionPiece[];
}

interface MoveInputEvent {
  type?: string;
  squareFrom?: string;
  squareTo?: string;
  promotion?: string;
}

interface CmChessboardModule {
  Chessboard: new (element: HTMLElement, config: Record<string, unknown>) => CmChessboard;
  COLOR?: Record<string, string>;
  INPUT_EVENT_TYPE?: Record<string, string>;
  MOVE_INPUT_MODE?: Record<string, string>;
}

interface CmChessboard {
  setPosition?: (fen: string, animated?: boolean) => void;
  setOrientation?: (orientation: string) => void;
  enableMoveInput?: (
    handler: (event: MoveInputEvent) => boolean | void,
    options?: Record<string, unknown>
  ) => void;
  disableMoveInput?: () => void;
  destroy?: () => void;
}

const DEFAULT_PROMOTIONS: PromotionPiece[] = ["q", "r", "b", "n"];

export function BoardWrapper({
  fen,
  orientation = "white",
  interactive = true,
  legalMoveMap,
  legalPromotions,
  onMoveIntent,
  overlays,
  className,
  style,
  showCoordinates = true,
}: BoardWrapperProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<CmChessboard | null>(null);
  const moduleRef = useRef<CmChessboardModule | null>(null);
  const currentFenRef = useRef(fen);
  const latestRef = useRef({
    legalMoveMap,
    legalPromotions,
    onMoveIntent,
    interactive,
  });

  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  useEffect(() => {
    latestRef.current = { legalMoveMap, legalPromotions, onMoveIntent, interactive };
  }, [legalMoveMap, legalPromotions, onMoveIntent, interactive]);

  useEffect(() => {
    currentFenRef.current = fen;
    setPendingPromotion(null);
    boardRef.current?.setPosition?.(fen);
  }, [fen]);

  useEffect(() => {
    const board = boardRef.current;
    const module = moduleRef.current;
    if (!board) {
      return;
    }
    const orientationValue = module?.COLOR?.[orientation] ?? orientation;
    board.setOrientation?.(orientationValue);
  }, [orientation]);

  const syncBoardPosition = useCallback(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }
    board.setPosition?.(currentFenRef.current);
  }, []);

  const isMoveAllowed = useCallback((from: Square, to: Square): boolean => {
    const map = latestRef.current.legalMoveMap;
    if (!map) {
      return true;
    }
    const targets = map[from];
    return Array.isArray(targets) && targets.includes(to);
  }, []);

  const resolvePromotionOptions = useCallback(
    (from: Square, to: Square): PromotionPiece[] | null => {
      const map = latestRef.current.legalPromotions;
      if (!map) {
        return null;
      }
      const key = `${from}${to}` as `${Square}${Square}`;
      const options = map[key];
      if (!options || options.length === 0) {
        return null;
      }
      const unique = Array.from(new Set(options.map((option) => option.toLowerCase())))
        .map((option) => normalizePromotionPiece(option))
        .filter((option): option is PromotionPiece => Boolean(option));
      return unique.length > 0 ? unique : null;
    },
    []
  );

  const emitMoveIntent = useCallback(
    (intent: MoveIntent) => {
      if (latestRef.current.onMoveIntent) {
        latestRef.current.onMoveIntent(intent);
      }
    },
    []
  );

  const queueMoveIntent = useCallback(
    (from: Square, to: Square) => {
      const options = resolvePromotionOptions(from, to);
      if (!options) {
        emitMoveIntent({ from, to });
        return;
      }
      if (options.length === 1) {
        emitMoveIntent({ from, to, promotion: options[0] });
        return;
      }
      const normalized = DEFAULT_PROMOTIONS.filter((piece) => options.includes(piece));
      setPendingPromotion({ from, to, options: normalized.length > 0 ? normalized : options });
    },
    [emitMoveIntent, resolvePromotionOptions]
  );

  const handleMoveInput = useCallback(
    (event: MoveInputEvent): boolean => {
      const module = moduleRef.current;
      const inputTypes = module?.INPUT_EVENT_TYPE;
      const type = event?.type;
      if (!latestRef.current.interactive) {
        syncBoardPosition();
        return false;
      }

      if (type && inputTypes?.moveStart && type === inputTypes.moveStart) {
        const from = normalizeSquare(event.squareFrom ?? "");
        if (!from) {
          return false;
        }
        const map = latestRef.current.legalMoveMap;
        if (!map) {
          return true;
        }
        const targets = map[from];
        return Array.isArray(targets) && targets.length > 0;
      }

      if (type && inputTypes?.moveDone && type === inputTypes.moveDone) {
        const from = normalizeSquare(event.squareFrom ?? "");
        const to = normalizeSquare(event.squareTo ?? "");
        if (!from || !to) {
          syncBoardPosition();
          return false;
        }
        if (!isMoveAllowed(from, to)) {
          syncBoardPosition();
          return false;
        }
        const promotion = normalizePromotionPiece(event.promotion);
        if (promotion) {
          emitMoveIntent({ from, to, promotion });
        } else {
          queueMoveIntent(from, to);
        }
        syncBoardPosition();
        return true;
      }

      if (type && inputTypes?.moveCanceled && type === inputTypes.moveCanceled) {
        syncBoardPosition();
        return false;
      }

      return false;
    },
    [emitMoveIntent, isMoveAllowed, queueMoveIntent, syncBoardPosition]
  );

  useEffect(() => {
    let canceled = false;

    const init = async () => {
      if (!containerRef.current) {
        return;
      }
      try {
        const module = (await import("cm-chessboard")) as CmChessboardModule;
        if (canceled) {
          return;
        }
        moduleRef.current = module;
        const orientationValue = module.COLOR?.[orientation] ?? orientation;
        const board = new module.Chessboard(containerRef.current, {
          position: currentFenRef.current,
          orientation: orientationValue,
          responsive: true,
          style: {
            showCoordinates,
          },
        });
        boardRef.current = board;
        board.enableMoveInput?.(handleMoveInput, {
          moveInputMode: module.MOVE_INPUT_MODE?.all,
        });
      } catch (error) {
        if (!canceled) {
          const message = error instanceof Error ? error.message : "Failed to load board";
          setLoadError(message);
        }
      }
    };

    init();

    return () => {
      canceled = true;
      boardRef.current?.destroy?.();
      boardRef.current = null;
    };
  }, [handleMoveInput, orientation, showCoordinates]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }
    if (interactive && !pendingPromotion) {
      board.enableMoveInput?.(handleMoveInput, {
        moveInputMode: moduleRef.current?.MOVE_INPUT_MODE?.all,
      });
    } else {
      board.disableMoveInput?.();
    }
  }, [handleMoveInput, interactive, pendingPromotion]);

  const promotionOverlay = useMemo(() => {
    if (!pendingPromotion) {
      return null;
    }

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px",
            borderRadius: "8px",
            display: "grid",
            gap: "8px",
            minWidth: "200px",
          }}
        >
          <div style={{ fontSize: "14px" }}>Choose promotion</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {pendingPromotion.options.map((piece) => (
              <button
                key={piece}
                type="button"
                onClick={() => {
                  emitMoveIntent({
                    from: pendingPromotion.from,
                    to: pendingPromotion.to,
                    promotion: piece,
                  });
                  setPendingPromotion(null);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {piece.toUpperCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPendingPromotion(null)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "transparent",
                color: "#ddd",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }, [emitMoveIntent, pendingPromotion]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {overlays ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {overlays}
        </div>
      ) : null}
      {promotionOverlay}
      {loadError ? (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(20, 20, 20, 0.8)",
            color: "#fff",
            zIndex: 3,
            padding: "12px",
            textAlign: "center",
          }}
        >
          {loadError}
        </div>
      ) : null}
    </div>
  );
}
