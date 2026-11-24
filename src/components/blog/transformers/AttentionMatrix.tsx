"use client";

import { useState } from "react";

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"] as const;

// Each row is a query token's attention distribution over all key tokens.
// Rows sum to ~1.0. Designed for linguistic plausibility:
//   - "cat" attends strongly to "sat" (its verb) and "The" (its determiner)
//   - "sat" attends to "cat" (subject) and "mat" (object of the prepositional phrase)
//   - "mat" attends to "on" and "the" (its local context)
//   - Moderate self-attention on the diagonal throughout
const ATTENTION_WEIGHTS: number[][] = [
  //  The   cat   sat    on   the   mat
  [0.30, 0.25, 0.15, 0.10, 0.12, 0.08], // The
  [0.22, 0.18, 0.32, 0.08, 0.10, 0.10], // cat
  [0.08, 0.28, 0.15, 0.10, 0.09, 0.30], // sat
  [0.05, 0.10, 0.18, 0.20, 0.22, 0.25], // on
  [0.10, 0.08, 0.07, 0.20, 0.25, 0.30], // the
  [0.04, 0.06, 0.10, 0.28, 0.30, 0.22], // mat
];

const ACCENT = "#4ade80";
const CELL_SIZE = 56;
const LABEL_AREA = 72;
const COLUMN_LABEL_HEIGHT = 64;

type HoveredCell = { row: number; col: number } | null;

function cellOpacity(weight: number): number {
  // Map weight to opacity range [0.06, 1.0] for visual contrast
  return 0.06 + weight * 0.94;
}

function CellTooltip({ weight, x, y }: { weight: number; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-sm bg-black/90 px-2 py-1 font-mono text-xs text-white shadow-lg"
      style={{ left: x, top: y, transform: "translate(-50%, -120%)" }}
    >
      {weight.toFixed(2)}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-6 flex items-center gap-3 font-mono text-xs text-white/50">
      <span>0</span>
      <div
        className="h-3 w-32 rounded-sm"
        style={{
          background: `linear-gradient(to right, transparent, ${ACCENT})`,
        }}
      />
      <span>1</span>
    </div>
  );
}

export default function AttentionMatrix() {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const activeRow = hoveredCell?.row ?? hoveredRow;
  const activeCol = hoveredCell?.col ?? null;

  function handleCellMouseEnter(
    row: number,
    col: number,
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    setHoveredCell({ row, col });
    const rect = event.currentTarget.getBoundingClientRect();
    const container = event.currentTarget.closest("[data-matrix-container]");
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    }
  }

  function handleCellMouseLeave() {
    setHoveredCell(null);
  }

  function handleRowLabelEnter(row: number) {
    setHoveredRow(row);
  }

  function handleRowLabelLeave() {
    setHoveredRow(null);
  }

  function isRowHighlighted(row: number): boolean {
    return activeRow === row;
  }

  function isCellHighlighted(row: number, col: number): boolean {
    return hoveredCell?.row === row && hoveredCell?.col === col;
  }

  return (
    <div className="flex flex-col items-center rounded-xl p-8 max-w-full overflow-x-auto">
      <div className="relative" data-matrix-container>
        {hoveredCell && (
          <CellTooltip
            weight={ATTENTION_WEIGHTS[hoveredCell.row][hoveredCell.col]}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        )}

        {/* Column labels (key tokens) */}
        <div className="flex" style={{ paddingLeft: LABEL_AREA }}>
          {TOKENS.map((token, col) => (
            <div
              key={col}
              className="flex items-end justify-center font-mono text-xs transition-colors duration-150"
              style={{
                width: CELL_SIZE,
                height: COLUMN_LABEL_HEIGHT,
                color: activeCol === col ? ACCENT : "rgba(255,255,255,0.5)",
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

        {/* Matrix rows */}
        {TOKENS.map((queryToken, row) => (
          <div key={row} className="flex items-center">
            {/* Row label (query token) */}
            <div
              className="flex shrink-0 cursor-default items-center justify-end pr-4 font-mono text-xs transition-colors duration-150"
              style={{
                width: LABEL_AREA,
                height: CELL_SIZE,
                color: activeRow === row ? ACCENT : "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={() => handleRowLabelEnter(row)}
              onMouseLeave={handleRowLabelLeave}
            >
              {queryToken}
            </div>

            {/* Attention cells for this row */}
            {TOKENS.map((_, col) => {
              const weight = ATTENTION_WEIGHTS[row][col];
              const isActive = isCellHighlighted(row, col);
              const isInActiveRow = isRowHighlighted(row);
              const dimmed = activeRow !== null && !isInActiveRow;

              return (
                <div
                  key={col}
                  className="transition-opacity duration-150"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    padding: 1,
                    opacity: dimmed ? 0.3 : 1,
                  }}
                  onMouseEnter={(e) => handleCellMouseEnter(row, col, e)}
                  onMouseLeave={handleCellMouseLeave}
                >
                  <div
                    className="flex h-full w-full items-center justify-center rounded-[2px] transition-all duration-150"
                    style={{
                      backgroundColor: ACCENT,
                      opacity: cellOpacity(weight),
                      outline: isActive
                        ? `2px solid ${ACCENT}`
                        : "1px solid rgba(255,255,255,0.05)",
                      outlineOffset: isActive ? -1 : 0,
                    }}
                  >
                    {isActive && (
                      <span className="font-mono text-[10px] font-medium text-white drop-shadow-md">
                        {weight.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <Legend />
    </div>
  );
}
