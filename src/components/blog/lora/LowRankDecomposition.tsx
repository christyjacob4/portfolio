"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_DIM = "rgba(74,222,128,0.3)";
const FROZEN_COLOR = "rgba(100,150,255,0.8)";
const FROZEN_FILL = "rgba(100,150,255,0.08)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 600;
const SVG_HEIGHT = 380;

const MATRIX_CELL = 8;
const CELL_GAP = 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function cellColor(value: number, isTrainable: boolean): string {
  const intensity = Math.abs(value);
  if (isTrainable) {
    return `rgba(74,222,128,${0.1 + intensity * 0.6})`;
  }
  return `rgba(100,150,255,${0.05 + intensity * 0.3})`;
}

// Deterministic pseudo-random using a seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Matrix rendering sub-component
// ---------------------------------------------------------------------------

interface MatrixBlockProps {
  x: number;
  y: number;
  rows: number;
  cols: number;
  label: string;
  sublabel?: string;
  isTrainable: boolean;
  seed: number;
  maxVisualRows?: number;
  maxVisualCols?: number;
  opacity?: number;
}

function MatrixBlock({
  x,
  y,
  rows,
  cols,
  label,
  sublabel,
  isTrainable,
  seed,
  maxVisualRows = 28,
  maxVisualCols = 28,
  opacity = 1,
}: MatrixBlockProps) {
  const rand = useMemo(() => seededRandom(seed), [seed]);
  const vRows = Math.min(rows, maxVisualRows);
  const vCols = Math.min(cols, maxVisualCols);
  const totalW = vCols * (MATRIX_CELL + CELL_GAP) - CELL_GAP;
  const totalH = vRows * (MATRIX_CELL + CELL_GAP) - CELL_GAP;

  const borderColor = isTrainable ? ACCENT_DIM : "rgba(100,150,255,0.15)";
  const labelColor = isTrainable ? ACCENT : FROZEN_COLOR;

  // Pre-generate random values
  const values = useMemo(() => {
    const v: number[][] = [];
    for (let r = 0; r < vRows; r++) {
      v[r] = [];
      for (let c = 0; c < vCols; c++) {
        v[r][c] = rand() * 2 - 1;
      }
    }
    return v;
  }, [rand, vRows, vCols]);

  return (
    <g opacity={opacity}>
      {/* Border */}
      <rect
        x={x - 3}
        y={y - 3}
        width={totalW + 6}
        height={totalH + 6}
        rx={3}
        fill="none"
        stroke={borderColor}
        strokeWidth={1}
      />
      {/* Cells */}
      {values.map((row, ri) =>
        row.map((val, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={x + ci * (MATRIX_CELL + CELL_GAP)}
            y={y + ri * (MATRIX_CELL + CELL_GAP)}
            width={MATRIX_CELL}
            height={MATRIX_CELL}
            rx={1}
            fill={cellColor(val, isTrainable)}
          />
        ))
      )}
      {/* Label above */}
      <text
        x={x + totalW / 2}
        y={y - 12}
        textAnchor="middle"
        fill={labelColor}
        fontSize={13}
        fontFamily={FONT_MONO}
        fontWeight="bold"
      >
        {label}
      </text>
      {/* Sublabel below */}
      {sublabel && (
        <text
          x={x + totalW / 2}
          y={y + totalH + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LowRankDecomposition() {
  const [rank, setRank] = useState(8);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const d = 64; // dimension of original matrix
  const fullParams = d * d;
  const loraParams = d * rank + rank * d;
  const savings = ((1 - loraParams / fullParams) * 100).toFixed(1);
  const ratio = (fullParams / loraParams).toFixed(1);

  // Visual sizes for B and A matrices
  const bVisualCols = Math.max(2, Math.round((rank / 64) * 28));
  const aVisualRows = Math.max(2, Math.round((rank / 64) * 28));

  return (
    <div
      style={{
        background: "rgb(10,10,10)",
        padding: "20px 16px 16px",
        fontFamily: FONT_MONO,
      }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          low-rank decomposition · W = W + BA
        </span>
        <span
          style={{
            fontSize: 13,
            color: ACCENT,
            opacity: 0.7,
          }}
        >
          drag slider to change rank
        </span>
      </div>

      {/* SVG visualization */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: "100%", maxWidth: 600 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Original frozen weight W */}
          <MatrixBlock
            x={20}
            y={50}
            rows={d}
            cols={d}
            label="W (frozen)"
            sublabel={`${d}x${d} = ${formatNumber(fullParams)} params`}
            isTrainable={false}
            seed={42}
            maxVisualRows={28}
            maxVisualCols={28}
            opacity={hoveredSection === "lora" ? 0.3 : 1}
          />

          {/* Plus sign */}
          <text
            x={285}
            y={178}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={20}
            fontFamily={FONT_MONO}
          >
            +
          </text>

          {/* B matrix */}
          <g
            onMouseEnter={() => setHoveredSection("B")}
            onMouseLeave={() => setHoveredSection(null)}
            style={{ cursor: "pointer" }}
          >
            <MatrixBlock
              x={310}
              y={50}
              rows={d}
              cols={rank}
              label={`B`}
              sublabel={`${d}x${rank} = ${formatNumber(d * rank)}`}
              isTrainable={true}
              seed={123}
              maxVisualRows={28}
              maxVisualCols={bVisualCols}
              opacity={hoveredSection === "W" ? 0.3 : 1}
            />
          </g>

          {/* Multiply sign */}
          <text
            x={310 + bVisualCols * (MATRIX_CELL + CELL_GAP) + 18}
            y={178}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={16}
            fontFamily={FONT_MONO}
          >
            x
          </text>

          {/* A matrix */}
          <g
            onMouseEnter={() => setHoveredSection("A")}
            onMouseLeave={() => setHoveredSection(null)}
            style={{ cursor: "pointer" }}
          >
            <MatrixBlock
              x={310 + bVisualCols * (MATRIX_CELL + CELL_GAP) + 36}
              y={50}
              rows={rank}
              cols={d}
              label={`A`}
              sublabel={`${rank}x${d} = ${formatNumber(rank * d)}`}
              isTrainable={true}
              seed={456}
              maxVisualRows={aVisualRows}
              maxVisualCols={28}
              opacity={hoveredSection === "W" ? 0.3 : 1}
            />
          </g>

          {/* Annotation arrows and labels */}
          <text
            x={300}
            y={SVG_HEIGHT - 55}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize={13}
            fontFamily={FONT_MONO}
          >
            {"<--- frozen --->"}
          </text>
          <text
            x={460}
            y={SVG_HEIGHT - 55}
            textAnchor="middle"
            fill="rgba(74,222,128,0.4)"
            fontSize={13}
            fontFamily={FONT_MONO}
          >
            {"<--- trainable (LoRA) --->"}
          </text>
        </svg>
      </div>

      {/* Rank slider */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            rank (r)
          </span>
          <span
            style={{
              fontSize: 14,
              color: ACCENT,
              fontWeight: "bold",
            }}
          >
            r = {rank}
          </span>
        </div>
        <input
          type="range"
          aria-label="Rank"
          min={1}
          max={64}
          value={rank}
          onChange={(e) => setRank(Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: ACCENT,
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>1</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            {d} (full rank)
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginTop: 12,
        }}
      >
        {[
          {
            label: "Full params",
            value: formatNumber(fullParams),
            color: FROZEN_COLOR,
          },
          {
            label: "LoRA params",
            value: formatNumber(loraParams),
            color: ACCENT,
          },
          {
            label: "Reduction",
            value: `${savings}%`,
            color: ACCENT,
          },
          {
            label: "Ratio",
            value: `${ratio}x`,
            color: "rgba(255,255,255,0.7)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "8px 10px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.04)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 15, color: stat.color, fontWeight: "bold" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
