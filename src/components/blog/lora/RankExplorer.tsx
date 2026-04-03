"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const CANVAS_SIZE = 200; // Internal resolution for the pattern
const DISPLAY_SIZE = 180; // CSS display size

// ---------------------------------------------------------------------------
// Generate a structured test pattern (a gradient + geometric shapes)
// We'll use a simple mathematical pattern that has clear structure
// ---------------------------------------------------------------------------

function generateTestMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      // Combine several signals at different frequencies
      const x = (j / size) * 2 * Math.PI;
      const y = (i / size) * 2 * Math.PI;

      // Low-rank signal: smooth gradients and sine waves
      let val = 0;
      val += 0.3 * Math.sin(x * 1.5) * Math.cos(y * 1.5); // rank ~2
      val += 0.25 * Math.sin(x * 2 + y); // rank ~1
      val += 0.15 * Math.cos(x * 3) * Math.sin(y * 2); // rank ~2

      // Cross-shaped pattern (low rank)
      const cx = Math.abs(j / size - 0.5);
      const cy = Math.abs(i / size - 0.5);
      if (cx < 0.06 || cy < 0.06) val += 0.3;

      // Diagonal gradient (rank 1)
      val += 0.1 * ((i + j) / (2 * size));

      // Circular pattern (adds some higher rank structure)
      const dx = j / size - 0.5;
      const dy = i / size - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.25 && dist < 0.35) val += 0.2;

      // Small noise (high rank, but small magnitude)
      val += 0.02 * Math.sin(x * 15 + y * 13);

      matrix[i][j] = val;
    }
  }
  return matrix;
}

// ---------------------------------------------------------------------------
// SVD implementation (simplified power iteration for educational purposes)
// We compute a truncated SVD via iterative approach
// ---------------------------------------------------------------------------

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function vecNorm(v: number[]): number {
  return Math.sqrt(dotProduct(v, v));
}

function normalizeVec(v: number[]): number[] {
  const n = vecNorm(v);
  if (n < 1e-10) return v.map(() => 0);
  return v.map((x) => x / n);
}

function matVecMul(mat: number[][], vec: number[]): number[] {
  const rows = mat.length;
  const result: number[] = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < vec.length; j++) {
      result[i] += mat[i][j] * vec[j];
    }
  }
  return result;
}

function matTransposeVecMul(mat: number[][], vec: number[]): number[] {
  const cols = mat[0].length;
  const result: number[] = new Array(cols).fill(0);
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < vec.length; i++) {
      result[j] += mat[i][j] * vec[i];
    }
  }
  return result;
}

// Power iteration to find top singular value/vectors
function powerIteration(
  mat: number[][],
  numIters: number = 30
): { u: number[]; s: number; v: number[] } {
  const cols = mat[0].length;
  // Start with random vector
  let v: number[] = [];
  // Use deterministic seed
  let seed = 42;
  for (let j = 0; j < cols; j++) {
    seed = (seed * 16807) % 2147483647;
    v.push((seed / 2147483647) * 2 - 1);
  }
  v = normalizeVec(v);

  for (let iter = 0; iter < numIters; iter++) {
    const u = normalizeVec(matVecMul(mat, v));
    v = normalizeVec(matTransposeVecMul(mat, u));
  }

  const u = normalizeVec(matVecMul(mat, v));
  const s = dotProduct(matVecMul(mat, v), u);

  return { u, s: Math.abs(s), v };
}

// Compute rank-k approximation via deflation
function truncatedSVD(
  mat: number[][],
  k: number
): { reconstruction: number[][]; singularValues: number[]; error: number } {
  const rows = mat.length;
  const cols = mat[0].length;

  // Deep copy the matrix for deflation
  const residual: number[][] = mat.map((row) => [...row]);
  const us: number[][] = [];
  const ss: number[] = [];
  const vs: number[][] = [];

  const maxK = Math.min(k, Math.min(rows, cols));

  for (let i = 0; i < maxK; i++) {
    const { u, s, v } = powerIteration(residual);
    if (s < 1e-8) break;

    us.push(u);
    ss.push(s);
    vs.push(v);

    // Deflate: residual -= s * u * v^T
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        residual[r][c] -= s * u[r] * v[c];
      }
    }
  }

  // Reconstruct from kept components
  const reconstruction: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );

  for (let i = 0; i < us.length; i++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        reconstruction[r][c] += ss[i] * us[i][r] * vs[i][c];
      }
    }
  }

  // Compute Frobenius norm error
  let errSum = 0;
  let origSum = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const diff = mat[r][c] - reconstruction[r][c];
      errSum += diff * diff;
      origSum += mat[r][c] * mat[r][c];
    }
  }
  const error = origSum > 0 ? Math.sqrt(errSum / origSum) : 0;

  return { reconstruction, singularValues: ss, error };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RankExplorer() {
  const [rank, setRank] = useState(5);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const approxCanvasRef = useRef<HTMLCanvasElement>(null);

  // Use smaller matrix for SVD computation to keep it fast
  const COMPUTE_SIZE = 48;

  // Generate the test pattern at compute size
  const originalMatrix = useMemo(
    () => generateTestMatrix(COMPUTE_SIZE),
    []
  );

  // Compute SVD for the current rank
  const svdResult = useMemo(
    () => truncatedSVD(originalMatrix, rank),
    [originalMatrix, rank]
  );

  // Full SVD for singular value spectrum
  const fullSVD = useMemo(
    () => truncatedSVD(originalMatrix, COMPUTE_SIZE),
    [originalMatrix]
  );

  // Draw original pattern
  useEffect(() => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(COMPUTE_SIZE, COMPUTE_SIZE);
    for (let i = 0; i < COMPUTE_SIZE; i++) {
      for (let j = 0; j < COMPUTE_SIZE; j++) {
        const val = originalMatrix[i][j];
        const intensity = Math.min(255, Math.max(0, ((val + 0.5) / 1.5) * 255));
        const idx = (i * COMPUTE_SIZE + j) * 4;
        // Green-tinted
        imgData.data[idx] = Math.round(intensity * 0.3);
        imgData.data[idx + 1] = Math.round(intensity * 0.87);
        imgData.data[idx + 2] = Math.round(intensity * 0.5);
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [originalMatrix]);

  // Draw approximation
  useEffect(() => {
    const canvas = approxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(COMPUTE_SIZE, COMPUTE_SIZE);
    for (let i = 0; i < COMPUTE_SIZE; i++) {
      for (let j = 0; j < COMPUTE_SIZE; j++) {
        const val = svdResult.reconstruction[i][j];
        const intensity = Math.min(255, Math.max(0, ((val + 0.5) / 1.5) * 255));
        const idx = (i * COMPUTE_SIZE + j) * 4;
        imgData.data[idx] = Math.round(intensity * 0.3);
        imgData.data[idx + 1] = Math.round(intensity * 0.87);
        imgData.data[idx + 2] = Math.round(intensity * 0.5);
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [svdResult]);

  // Compute parameter savings
  const fullParams = COMPUTE_SIZE * COMPUTE_SIZE;
  const svdParams = rank * (COMPUTE_SIZE + COMPUTE_SIZE + 1); // u vectors + v vectors + singular values
  const compressionRatio = (fullParams / svdParams).toFixed(1);
  const errorPercent = (svdResult.error * 100).toFixed(1);

  // Singular value chart dimensions
  const chartW = 280;
  const chartH = 100;
  const chartPadL = 30;
  const chartPadB = 16;
  const chartPadT = 10;
  const chartPadR = 10;
  const plotW = chartW - chartPadL - chartPadR;
  const plotH = chartH - chartPadT - chartPadB;

  const maxSV = fullSVD.singularValues.length > 0 ? fullSVD.singularValues[0] : 1;
  const svCount = fullSVD.singularValues.length;

  return (
    <div
      style={{
        background: "rgb(10,10,10)",
        padding: "20px 16px 16px",
        fontFamily: FONT_MONO,
      }}
    >
      {/* Header */}
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
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          rank explorer · low-rank matrix approximation
        </span>
        <span style={{ fontSize: 13, color: ACCENT, opacity: 0.7 }}>
          drag slider to change rank
        </span>
      </div>

      {/* Canvas comparison */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* Original */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 6,
            }}
          >
            original ({COMPUTE_SIZE}x{COMPUTE_SIZE})
          </div>
          <canvas
            ref={originalCanvasRef}
            width={COMPUTE_SIZE}
            height={COMPUTE_SIZE}
            style={{
              width: DISPLAY_SIZE,
              height: DISPLAY_SIZE,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              imageRendering: "pixelated",
            }}
          />
          <div
            style={{
              fontSize: 8,
              color: "rgba(255,255,255,0.3)",
              marginTop: 4,
            }}
          >
            {fullParams.toLocaleString()} params
          </div>
        </div>

        {/* Approximation */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 13,
              color: ACCENT,
              marginBottom: 6,
              opacity: 0.7,
            }}
          >
            rank-{rank} approximation
          </div>
          <canvas
            ref={approxCanvasRef}
            width={COMPUTE_SIZE}
            height={COMPUTE_SIZE}
            style={{
              width: DISPLAY_SIZE,
              height: DISPLAY_SIZE,
              borderRadius: 6,
              border: `1px solid rgba(74,222,128,0.2)`,
              imageRendering: "pixelated",
            }}
          />
          <div
            style={{
              fontSize: 8,
              color: "rgba(74,222,128,0.5)",
              marginTop: 4,
            }}
          >
            {svdParams.toLocaleString()} params ({compressionRatio}x compression)
          </div>
        </div>
      </div>

      {/* Rank slider */}
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            rank
          </span>
          <span style={{ fontSize: 14, color: ACCENT, fontWeight: "bold" }}>
            r = {rank}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={COMPUTE_SIZE}
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
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>1</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            {COMPUTE_SIZE} (full)
          </span>
        </div>
      </div>

      {/* Singular value spectrum */}
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 8,
          }}
        >
          singular value spectrum
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ width: "100%", maxWidth: chartW }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Axis */}
            <line
              x1={chartPadL}
              y1={chartH - chartPadB}
              x2={chartW - chartPadR}
              y2={chartH - chartPadB}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
            <line
              x1={chartPadL}
              y1={chartPadT}
              x2={chartPadL}
              y2={chartH - chartPadB}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />

            {/* Bars for singular values */}
            {fullSVD.singularValues.map((sv, i) => {
              const barW = Math.max(1, plotW / svCount - 1);
              const barH = (sv / maxSV) * plotH;
              const x = chartPadL + (i / svCount) * plotW;
              const y = chartH - chartPadB - barH;
              const isKept = i < rank;

              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={0.5}
                  fill={
                    isKept
                      ? "rgba(74,222,128,0.6)"
                      : "rgba(255,255,255,0.08)"
                  }
                />
              );
            })}

            {/* Rank cutoff line */}
            {rank < svCount && (
              <line
                x1={chartPadL + (rank / svCount) * plotW}
                y1={chartPadT}
                x2={chartPadL + (rank / svCount) * plotW}
                y2={chartH - chartPadB}
                stroke="rgba(239,68,68,0.5)"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}

            {/* Labels */}
            <text
              x={chartPadL}
              y={chartH - 2}
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily={FONT_MONO}
            >
              0
            </text>
            <text
              x={chartW - chartPadR}
              y={chartH - 2}
              textAnchor="end"
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily={FONT_MONO}
            >
              {svCount}
            </text>
            <text
              x={chartPadL - 4}
              y={chartPadT + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily={FONT_MONO}
            >
              max
            </text>

            {/* Kept / discarded annotation */}
            <text
              x={chartPadL + (rank / svCount) * plotW * 0.5}
              y={chartPadT + 4}
              textAnchor="middle"
              fill="rgba(74,222,128,0.5)"
              fontSize={7}
              fontFamily={FONT_MONO}
            >
              kept
            </text>
            {rank < svCount && (
              <text
                x={
                  chartPadL +
                  (rank / svCount) * plotW +
                  ((svCount - rank) / svCount) * plotW * 0.5
                }
                y={chartPadT + 4}
                textAnchor="middle"
                fill="rgba(239,68,68,0.4)"
                fontSize={7}
                fontFamily={FONT_MONO}
              >
                discarded
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {[
          {
            label: "Relative error",
            value: `${errorPercent}%`,
            color:
              Number(errorPercent) < 5
                ? ACCENT
                : Number(errorPercent) < 20
                  ? "rgba(250,204,21,0.8)"
                  : "rgba(239,68,68,0.7)",
          },
          {
            label: "Compression",
            value: `${compressionRatio}x`,
            color: ACCENT,
          },
          {
            label: "Params kept",
            value: `${((svdParams / fullParams) * 100).toFixed(1)}%`,
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
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.35)",
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 15,
                color: stat.color,
                fontWeight: "bold",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
