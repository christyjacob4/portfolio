"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKENS = ["I", "love", "deep", "learning", "!"] as const;
const TOKEN_COUNT = TOKENS.length;

const ACCENT = "#4ade80";
const CELL_SIZE = 52;
const LABEL_AREA = 72;
const COLUMN_LABEL_HEIGHT = 64;
const GENERATION_STEP_MS = 500;

// Full self-attention weights (encoder-style, every token attends to every token).
// Each row sums to ~1.0. Designed for linguistic plausibility:
//   - "I" distributes attention broadly with slight self-focus
//   - "love" attends strongly to "I" (subject) and "deep" (object modifier)
//   - "deep" attends to "learning" (its head noun) and "love" (governing verb)
//   - "learning" attends to "deep" (modifier) and "love" (verb)
//   - "!" attends mainly to "learning" (preceding) and "love" (sentence core)
const FULL_ATTENTION_WEIGHTS: number[][] = [
  //    I    love  deep  learn  !
  [0.35, 0.20, 0.18, 0.15, 0.12], // I
  [0.30, 0.15, 0.25, 0.18, 0.12], // love
  [0.10, 0.22, 0.18, 0.38, 0.12], // deep
  [0.08, 0.25, 0.30, 0.22, 0.15], // learning
  [0.06, 0.28, 0.10, 0.32, 0.24], // !
];

// ---------------------------------------------------------------------------
// Derived data helpers
// ---------------------------------------------------------------------------

/** Apply a causal mask and renormalize so each row's visible cells sum to 1. */
function buildMaskedWeights(fullWeights: number[][]): number[][] {
  return fullWeights.map((row, rowIndex) => {
    const visibleWeights = row.slice(0, rowIndex + 1);
    const visibleSum = visibleWeights.reduce((sum, w) => sum + w, 0);

    return row.map((weight, colIndex) => {
      if (colIndex > rowIndex) return 0;
      return weight / visibleSum;
    });
  });
}

const MASKED_ATTENTION_WEIGHTS = buildMaskedWeights(FULL_ATTENTION_WEIGHTS);

function isMaskedCell(row: number, col: number): boolean {
  return col > row;
}

/** Map weight to opacity range [0.08, 1.0] for visual contrast. */
function weightToOpacity(weight: number): number {
  return 0.08 + weight * 0.92;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ColumnLabels({
  highlightedCol,
}: {
  highlightedCol: number | null;
}) {
  return (
    <div className="flex" style={{ paddingLeft: LABEL_AREA }}>
      {TOKENS.map((token, col) => (
        <div
          key={col}
          className="flex items-end justify-center font-mono text-xs transition-colors duration-150"
          style={{
            width: CELL_SIZE,
            height: COLUMN_LABEL_HEIGHT,
            color: highlightedCol === col ? ACCENT : "rgba(255,255,255,0.5)",
          }}
        >
          <span
            className="block origin-bottom-left"
            style={{ transform: "rotate(-45deg)", whiteSpace: "nowrap" }}
          >
            {token}
          </span>
        </div>
      ))}
    </div>
  );
}

function AttentionCell({
  weight,
  isMasked,
  isDimmed,
}: {
  weight: number;
  isMasked: boolean;
  isDimmed: boolean;
}) {
  if (isMasked) {
    return (
      <div
        className="transition-opacity duration-150"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          padding: 1,
          opacity: isDimmed ? 0.15 : 1,
        }}
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2px]"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            outline: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Diagonal stripe pattern */}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className="transition-opacity duration-150"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        padding: 1,
        opacity: isDimmed ? 0.2 : 1,
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-[2px] transition-all duration-150"
        style={{
          backgroundColor: ACCENT,
          opacity: weightToOpacity(weight),
          outline: "1px solid rgba(255,255,255,0.05)",
        }}
      />
    </div>
  );
}

function MatrixPanel({
  title,
  weights,
  showMask,
  hoveredRow,
  visibleTokenCount,
  onRowHover,
  onRowLeave,
}: {
  title: string;
  weights: number[][];
  showMask: boolean;
  hoveredRow: number | null;
  visibleTokenCount: number;
  onRowHover: (row: number) => void;
  onRowLeave: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-center font-mono text-[11px] tracking-wider text-white/50 uppercase">
        {title}
      </p>

      <div>
        <ColumnLabels highlightedCol={null} />

        {TOKENS.map((queryToken, row) => {
          const isRowVisible = row < visibleTokenCount;
          const isHighlighted = hoveredRow === row;
          const hasActiveHover = hoveredRow !== null;

          return (
            <div
              key={row}
              className="flex items-center"
              style={{ opacity: isRowVisible ? 1 : 0.08 }}
            >
              {/* Row label (query token) */}
              <div
                className="flex shrink-0 cursor-default items-center justify-end pr-4 font-mono text-xs transition-colors duration-150 before:content-[attr(data-token)]"
                data-token={isRowVisible ? undefined : queryToken}
                style={{
                  width: LABEL_AREA,
                  height: CELL_SIZE,
                  color:
                    isHighlighted && isRowVisible
                      ? ACCENT
                      : "rgba(255,255,255,0.5)",
                }}
                onMouseEnter={() => isRowVisible && onRowHover(row)}
                onMouseLeave={onRowLeave}
              >
                {isRowVisible ? queryToken : null}
              </div>

              {/* Attention cells for this row */}
              {TOKENS.map((_, col) => {
                const masked = showMask && isMaskedCell(row, col);
                const isColVisible = col < visibleTokenCount;
                const cellVisible = isRowVisible && isColVisible;
                const isDimmed =
                  hasActiveHover && !isHighlighted && cellVisible;

                return (
                  <div
                    key={col}
                    style={{ opacity: cellVisible ? 1 : 0.08 }}
                  >
                    <AttentionCell
                      weight={weights[row][col]}
                      isMasked={masked}
                      isDimmed={isDimmed}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 font-mono text-xs text-white/50">
      <span>0</span>
      <div
        className="h-3 w-24 rounded-sm"
        style={{
          background: `linear-gradient(to right, transparent, ${ACCENT})`,
        }}
      />
      <span>1</span>
      <span className="ml-4 flex items-center gap-2">
        <span
          className="relative inline-block h-3 w-5 overflow-hidden rounded-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          <svg className="absolute inset-0 h-full w-full">
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />
          </svg>
        </span>
        masked
      </span>
    </div>
  );
}

function Annotation() {
  return (
    <p className="max-w-md text-center font-mono text-[11px] leading-relaxed text-white/50">
      During generation, future tokens don&rsquo;t exist yet. The mask ensures
      the model can only attend to tokens it has already generated.
    </p>
  );
}

function GenerationProgress({
  visibleCount,
}: {
  visibleCount: number;
}) {
  if (visibleCount >= TOKEN_COUNT) return null;

  const visibleTokens = TOKENS.slice(0, visibleCount);
  const pendingTokens = TOKENS.slice(visibleCount);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs">
      {visibleTokens.map((token, i) => (
        <span key={i} style={{ color: ACCENT }}>
          {token}
        </span>
      ))}
      {pendingTokens.map((token, i) => (
        <span key={`pending-${i}`} className="text-white/50">
          {token}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MaskedAttention() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [visibleTokenCount, setVisibleTokenCount] = useState<number>(TOKEN_COUNT);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGeneration = useCallback(() => {
    clearTimer();
    setVisibleTokenCount(1);

    let step = 1;
    const advanceStep = () => {
      step++;
      setVisibleTokenCount(step);
      if (step < TOKEN_COUNT) {
        timerRef.current = setTimeout(advanceStep, GENERATION_STEP_MS);
      } else {
        // Pause at full visibility, then restart the loop
        timerRef.current = setTimeout(() => {
          setVisibleTokenCount(TOKEN_COUNT);
          timerRef.current = setTimeout(() => startGeneration(), GENERATION_STEP_MS);
        }, GENERATION_STEP_MS * 2);
      }
    };

    timerRef.current = setTimeout(advanceStep, GENERATION_STEP_MS);
  }, [clearTimer]);

  // Auto-start the generation loop on mount
  useEffect(() => {
    // Brief initial pause showing all tokens, then begin looping
    const initialDelay = setTimeout(() => startGeneration(), GENERATION_STEP_MS * 2);
    return () => {
      clearTimeout(initialDelay);
      clearTimer();
    };
  }, [startGeneration, clearTimer]);

  return (
    <div className="not-prose my-8 rounded-xl p-5 sm:p-6">
      {/* Panels */}
      <div className="flex flex-col items-center gap-6">
        <MatrixPanel
          title="Self-Attention (Encoder)"
          weights={FULL_ATTENTION_WEIGHTS}
          showMask={false}
          hoveredRow={hoveredRow}
          visibleTokenCount={visibleTokenCount}
          onRowHover={setHoveredRow}
          onRowLeave={() => setHoveredRow(null)}
        />

        {/* Divider */}
        <div className="h-px w-full bg-white/10" />

        <MatrixPanel
          title="Masked Self-Attention (Decoder)"
          weights={MASKED_ATTENTION_WEIGHTS}
          showMask={true}
          hoveredRow={hoveredRow}
          visibleTokenCount={visibleTokenCount}
          onRowHover={setHoveredRow}
          onRowLeave={() => setHoveredRow(null)}
        />
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <Legend />

        <GenerationProgress visibleCount={visibleTokenCount} />

        <Annotation />
      </div>
    </div>
  );
}
