"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ROW_HIGHLIGHT = "#E8530E";
const COLUMN_HIGHLIGHT = "rgba(100,200,255,0.8)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const CELL_WIDTH = 50;
const CELL_HEIGHT = 35;

// Token embeddings (3x2)
const MATRIX_A: number[][] = [
  [0.2, 0.8],
  [0.9, 0.3],
  [0.1, -0.5],
];

// Weight matrix (2x4)
const MATRIX_B: number[][] = [
  [0.5, -0.3, 0.4, 0.1],
  [0.2, 0.7, -0.2, 0.6],
];

type HoveredCell = { row: number; col: number } | null;

// ---------------------------------------------------------------------------
// Matrix multiplication
// ---------------------------------------------------------------------------

function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const rowsA = a.length;
  const colsB = b[0].length;
  const inner = a[0].length;

  const result: number[][] = [];
  for (let i = 0; i < rowsA; i++) {
    const row: number[] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum += a[i][k] * b[k][j];
      }
      row.push(sum);
    }
    result.push(row);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Matrix Grid
// ---------------------------------------------------------------------------

function MatrixGrid({
  matrix,
  label,
  highlightRow,
  highlightCol,
  highlightColor,
  hoveredResultCell,
  isResult,
  onCellHover,
  onCellLeave,
}: {
  matrix: number[][];
  label: string;
  highlightRow: number | null;
  highlightCol: number | null;
  highlightColor: string;
  hoveredResultCell: HoveredCell;
  isResult: boolean;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
}) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="text-[10px] tracking-wider text-white/50"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </span>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${CELL_WIDTH}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_HEIGHT}px)`,
          gap: 2,
        }}
      >
        {matrix.map((row, i) =>
          row.map((value, j) => {
            const isRowHighlighted = highlightRow === i;
            const isColHighlighted = highlightCol === j;
            const isHoveredResultCell =
              isResult &&
              hoveredResultCell?.row === i &&
              hoveredResultCell?.col === j;

            // Determine cell styling based on highlight state
            let backgroundColor = "rgba(255,255,255,0.03)";
            let borderColor = "rgba(255,255,255,0.1)";
            let textColor = "rgba(255,255,255,0.6)";
            let borderWidth = 1;

            if (isRowHighlighted) {
              backgroundColor = highlightColor === ROW_HIGHLIGHT ? "rgba(232,83,14,0.12)" : "rgba(74,222,128,0.12)";
              borderColor = highlightColor;
              textColor = highlightColor;
            }

            if (isColHighlighted) {
              backgroundColor = "rgba(100,200,255,0.08)";
              borderColor = COLUMN_HIGHLIGHT;
              textColor = COLUMN_HIGHLIGHT;
            }

            if (isHoveredResultCell) {
              borderColor = ACCENT;
              borderWidth = 2;
              textColor = ACCENT;
              backgroundColor = "rgba(74,222,128,0.15)";
            }

            return (
              <div
                key={`${i}-${j}`}
                className="flex cursor-default items-center justify-center rounded-[3px] transition-all duration-100"
                style={{
                  width: CELL_WIDTH,
                  height: CELL_HEIGHT,
                  backgroundColor,
                  border: `${borderWidth}px solid ${borderColor}`,
                  color: textColor,
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                  fontWeight: isRowHighlighted || isColHighlighted || isHoveredResultCell ? 600 : 400,
                }}
                onMouseEnter={
                  isResult && onCellHover
                    ? () => onCellHover(i, j)
                    : undefined
                }
                onMouseLeave={isResult && onCellLeave ? onCellLeave : undefined}
              >
                {value.toFixed(2)}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dot Product Explanation
// ---------------------------------------------------------------------------

function DotProductExplanation({
  hoveredCell,
  matrixA,
  matrixB,
  matrixC,
}: {
  hoveredCell: HoveredCell;
  matrixA: number[][];
  matrixB: number[][];
  matrixC: number[][];
}) {
  const hasCell = hoveredCell !== null;
  const row = hoveredCell?.row ?? 0;
  const col = hoveredCell?.col ?? 0;
  const rowValues = matrixA[row];
  const colValues = matrixB.map((r) => r[col]);
  const result = matrixC[row][col];

  return (
    <div
      className="mt-6 px-4 py-3 text-sm"
      style={{ fontFamily: FONT_MONO, minHeight: 44 }}
    >
      <div className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-1">
        {rowValues.map((v, k) => (
          <span key={k} className="flex items-baseline gap-x-1">
            {k > 0 && <span className="text-white/50 mx-1">+</span>}
            <span style={{ color: ROW_HIGHLIGHT }}>{v.toFixed(1)}</span>
            <span className="text-white/50">×</span>
            <span style={{ color: COLUMN_HIGHLIGHT }}>{colValues[k].toFixed(1)}</span>
          </span>
        ))}
        <span className="text-white/50 mx-1">=</span>
        <span className="text-base font-semibold" style={{ color: ACCENT }}>
          {result.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operator Symbol
// ---------------------------------------------------------------------------

function OperatorSymbol({ symbol }: { symbol: string }) {
  return (
    <div
      className="flex items-center justify-center self-center px-2 text-lg text-white/50"
      style={{ fontFamily: FONT_MONO }}
    >
      {symbol}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MatrixMultiplier() {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell>({ row: 0, col: 0 });

  const matrixC = useMemo(
    () => multiplyMatrices(MATRIX_A, MATRIX_B),
    [],
  );

  const highlightedRow = hoveredCell?.row ?? null;
  const highlightedCol = hoveredCell?.col ?? null;

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      {/* Matrices layout */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <MatrixGrid
          matrix={MATRIX_A}
          label="A (3×2)"
          highlightRow={highlightedRow}
          highlightCol={null}
          highlightColor={ROW_HIGHLIGHT}
          hoveredResultCell={null}
          isResult={false}
        />

        <OperatorSymbol symbol={"×"} />

        <MatrixGrid
          matrix={MATRIX_B}
          label="B (2×4)"
          highlightRow={null}
          highlightCol={highlightedCol}
          highlightColor={COLUMN_HIGHLIGHT}
          hoveredResultCell={null}
          isResult={false}
        />

        <OperatorSymbol symbol="=" />

        <MatrixGrid
          matrix={matrixC}
          label="C (3×4)"
          highlightRow={null}
          highlightCol={null}
          highlightColor={ACCENT}
          hoveredResultCell={hoveredCell}
          isResult={true}
          onCellHover={(row, col) => setHoveredCell({ row, col })}
          onCellLeave={() => setHoveredCell({ row: 0, col: 0 })}
        />
      </div>

      {/* Dot product explanation */}
      <DotProductExplanation
        hoveredCell={hoveredCell}
        matrixA={MATRIX_A}
        matrixB={MATRIX_B}
        matrixC={matrixC}
      />
    </div>
  );
}
