"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";

const ERROR_COLOR = "rgba(248,113,113,0.85)";
const WASTED_COLOR = "rgba(255,255,255,0.12)";
const ACTIVE_COLOR = "rgba(74,222,128,0.7)";
const BAR_SPARSE = "rgba(96,165,250,0.55)";
const BAR_SPARSE_STROKE = "rgba(96,165,250,0.8)";
const BAR_DENSE = "rgba(74,222,128,0.45)";
const BAR_DENSE_STROKE = "rgba(74,222,128,0.75)";

const SVG_WIDTH = 800;
const SVG_HEIGHT = 400;

const VECTOR_LENGTH = 16;
const NONZERO_COUNT = 3;
const VALUE_RANGE = 4; // bars span [-4, +4]

// Panel layout
const PANEL_GAP = 40;
const PANEL_WIDTH = (SVG_WIDTH - PANEL_GAP - 40) / 2; // ~380 each
const LEFT_PANEL_X = 20;
const RIGHT_PANEL_X = LEFT_PANEL_X + PANEL_WIDTH + PANEL_GAP;

const BAR_AREA_TOP = 52;
const BAR_AREA_BOTTOM = 260;
const BAR_AREA_HEIGHT = BAR_AREA_BOTTOM - BAR_AREA_TOP;
const BAR_AREA_MIDLINE = BAR_AREA_TOP + BAR_AREA_HEIGHT / 2;

const BIT_SQUARE_TOP = 310;
const BIT_SQUARE_SIZE = 14;
const BIT_SQUARE_GAP = 3;

const ANIMATION_DURATION_MS = 400;

// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator (LCG)
// ---------------------------------------------------------------------------

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Generate a sparse vector: exactly NONZERO_COUNT large values, rest near zero
// ---------------------------------------------------------------------------

function generateSparseVector(seed: number): number[] {
  const rand = createSeededRandom(seed);
  const vector = new Array(VECTOR_LENGTH).fill(0);

  // Pick NONZERO_COUNT random positions for the large values
  const positions: number[] = [];
  while (positions.length < NONZERO_COUNT) {
    const idx = Math.floor(rand() * VECTOR_LENGTH);
    if (!positions.includes(idx)) {
      positions.push(idx);
    }
  }

  for (const pos of positions) {
    // Large values between 1.5 and 3.5, with random sign
    const magnitude = 1.5 + rand() * 2.0;
    const sign = rand() > 0.5 ? 1 : -1;
    vector[pos] = sign * magnitude;
  }

  // Fill remaining positions with tiny noise
  for (let i = 0; i < VECTOR_LENGTH; i++) {
    if (!positions.includes(i)) {
      vector[i] = (rand() - 0.5) * 0.15;
    }
  }

  return vector;
}

// ---------------------------------------------------------------------------
// Apply a fixed pseudo-random orthogonal-like transform via Householder
// reflections. This scrambles the energy across all coordinates.
// ---------------------------------------------------------------------------

function applyScrambleTransform(vector: number[]): number[] {
  const dimension = vector.length;
  const rotated = [...vector];
  const rand = createSeededRandom(12345); // fixed seed for reproducible rotation

  // Generate a pair of Gaussian samples via Box-Muller
  function gaussianPair(): [number, number] {
    const u1 = Math.max(rand(), 1e-10);
    const u2 = rand();
    const radius = Math.sqrt(-2 * Math.log(u1));
    return [
      radius * Math.cos(2 * Math.PI * u2),
      radius * Math.sin(2 * Math.PI * u2),
    ];
  }

  // Apply enough random Householder reflections to produce a well-mixed
  // orthogonal transformation (norm-preserving).
  const reflectionCount = Math.max(dimension * 2, 30);

  for (let r = 0; r < reflectionCount; r++) {
    const reflectionVector: number[] = [];
    for (let i = 0; i < dimension; i += 2) {
      const [g1, g2] = gaussianPair();
      reflectionVector.push(g1);
      if (i + 1 < dimension) reflectionVector.push(g2);
    }

    let dotVX = 0;
    let dotVV = 0;
    for (let i = 0; i < dimension; i++) {
      dotVX += reflectionVector[i] * rotated[i];
      dotVV += reflectionVector[i] * reflectionVector[i];
    }

    if (dotVV < 1e-12) continue;

    const scale = (2 * dotVX) / dotVV;
    for (let i = 0; i < dimension; i++) {
      rotated[i] -= scale * reflectionVector[i];
    }
  }

  return rotated;
}

// ---------------------------------------------------------------------------
// Quantization: uniform grid for the sparse panel
// ---------------------------------------------------------------------------

function buildUniformLevels(bitWidth: number): number[] {
  const levelCount = 1 << bitWidth;
  const levels: number[] = [];
  const step = (2 * VALUE_RANGE) / levelCount;

  for (let i = 0; i < levelCount; i++) {
    levels.push(-VALUE_RANGE + step * (i + 0.5));
  }

  return levels;
}

function quantizeUniform(value: number, levels: number[]): number {
  let bestLevel = levels[0];
  let bestDistance = Math.abs(value - levels[0]);

  for (let i = 1; i < levels.length; i++) {
    const distance = Math.abs(value - levels[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestLevel = levels[i];
    }
  }

  return bestLevel;
}

// ---------------------------------------------------------------------------
// Quantization: Lloyd-Max style levels for the rotated panel.
// Pre-compute centroids that are denser near 0 (where values cluster after
// rotation) and sparser in the tails.
// ---------------------------------------------------------------------------

function buildOptimalLevels(
  bitWidth: number,
  values: number[],
): number[] {
  const levelCount = 1 << bitWidth;

  if (values.length === 0) return buildUniformLevels(bitWidth);

  // Use percentile-based initialization: place centroids at evenly-spaced
  // percentiles of the actual value distribution, then run a few Lloyd
  // iterations to converge.
  const sorted = [...values].sort((a, b) => a - b);
  const centroids: number[] = [];
  for (let i = 0; i < levelCount; i++) {
    const percentileIndex = Math.floor(
      ((i + 0.5) / levelCount) * sorted.length,
    );
    centroids.push(sorted[Math.min(percentileIndex, sorted.length - 1)]);
  }

  // Run Lloyd iterations on the actual data
  for (let iter = 0; iter < 20; iter++) {
    // Assign each value to its nearest centroid
    const sums = new Array(levelCount).fill(0);
    const counts = new Array(levelCount).fill(0);

    for (const value of values) {
      let bestIdx = 0;
      let bestDist = Math.abs(value - centroids[0]);
      for (let c = 1; c < levelCount; c++) {
        const dist = Math.abs(value - centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
        }
      }
      sums[bestIdx] += value;
      counts[bestIdx] += 1;
    }

    // Update centroids
    for (let c = 0; c < levelCount; c++) {
      if (counts[c] > 0) {
        centroids[c] = sums[c] / counts[c];
      }
    }
  }

  return centroids.sort((a, b) => a - b);
}

function quantizeOptimal(value: number, levels: number[]): number {
  return quantizeUniform(value, levels); // same nearest-neighbor logic
}

// ---------------------------------------------------------------------------
// Compute MSE between original and quantized vectors
// ---------------------------------------------------------------------------

function computeMse(original: number[], quantized: number[]): number {
  let sumSquaredError = 0;
  for (let i = 0; i < original.length; i++) {
    const error = original[i] - quantized[i];
    sumSquaredError += error * error;
  }
  return sumSquaredError / original.length;
}

// ---------------------------------------------------------------------------
// Identify which indices hold the "important" (large) values
// ---------------------------------------------------------------------------

function findLargeValueIndices(vector: number[]): Set<number> {
  const indexed = vector.map((value, index) => ({ value: Math.abs(value), index }));
  indexed.sort((a, b) => b.value - a.value);
  return new Set(indexed.slice(0, NONZERO_COUNT).map((entry) => entry.index));
}

// ---------------------------------------------------------------------------
// Interpolate between two number arrays for smooth animation
// ---------------------------------------------------------------------------

function interpolateArrays(
  from: number[],
  to: number[],
  progress: number,
): number[] {
  return to.map((targetValue, i) => {
    const sourceValue = i < from.length ? from[i] : 0;
    return sourceValue + (targetValue - sourceValue) * progress;
  });
}

// ---------------------------------------------------------------------------
// Easing function: ease-out cubic for natural deceleration
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// ---------------------------------------------------------------------------
// Sub-component: bar chart panel for either sparse or dense visualization
// ---------------------------------------------------------------------------

interface BarChartPanelProps {
  panelX: number;
  title: string;
  subtitle: string;
  values: number[];
  quantizedValues: number[];
  gridLevels: number[];
  barFill: string;
  barStroke: string;
  mse: number;
  bitBudgetLabel: string;
  bitBudgetActiveIndices: Set<number>;
  isOptimalGrid: boolean;
}

function BarChartPanel({
  panelX,
  title,
  subtitle,
  values,
  quantizedValues,
  gridLevels,
  barFill,
  barStroke,
  mse,
  bitBudgetLabel,
  bitBudgetActiveIndices,
  isOptimalGrid,
}: BarChartPanelProps) {
  const barCount = values.length;
  const barAreaWidth = PANEL_WIDTH - 30;
  const barAreaLeft = panelX + 15;
  const barWidth = (barAreaWidth / barCount) * 0.65;
  const barSpacing = barAreaWidth / barCount;

  // Map a value to a Y coordinate in the bar chart
  const valueToY = (value: number) => {
    const fraction = value / VALUE_RANGE;
    return BAR_AREA_MIDLINE - fraction * (BAR_AREA_HEIGHT / 2);
  };

  // Bit-budget squares layout
  const totalBitSquareWidth =
    barCount * BIT_SQUARE_SIZE + (barCount - 1) * BIT_SQUARE_GAP;
  const bitSquareStartX = panelX + (PANEL_WIDTH - totalBitSquareWidth) / 2;

  return (
    <g>
      {/* Panel background */}
      <rect
        x={panelX}
        y={8}
        width={PANEL_WIDTH}
        height={SVG_HEIGHT - 16}
        rx={6}
        fill="rgba(255,255,255,0.02)"
        stroke={BORDER}
        strokeWidth={1}
      />

      {/* Title */}
      <text
        x={panelX + PANEL_WIDTH / 2}
        y={26}
        textAnchor="middle"
        fill={TEXT_BRIGHT}
        fontSize={11}
        fontFamily={FONT_MONO}
        fontWeight="bold"
      >
        {title}
      </text>

      {/* Subtitle */}
      <text
        x={panelX + PANEL_WIDTH / 2}
        y={42}
        textAnchor="middle"
        fill={TEXT_DIM}
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        {subtitle}
      </text>

      {/* Zero line */}
      <line
        x1={barAreaLeft}
        y1={BAR_AREA_MIDLINE}
        x2={barAreaLeft + barAreaWidth}
        y2={BAR_AREA_MIDLINE}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.5}
      />

      {/* Quantization grid lines */}
      {gridLevels.map((level, i) => {
        const y = valueToY(level);
        if (y < BAR_AREA_TOP - 2 || y > BAR_AREA_BOTTOM + 2) return null;
        return (
          <line
            key={`grid-${i}`}
            x1={barAreaLeft}
            y1={y}
            x2={barAreaLeft + barAreaWidth}
            y2={y}
            stroke={
              isOptimalGrid
                ? "rgba(74,222,128,0.15)"
                : "rgba(255,255,255,0.1)"
            }
            strokeWidth={0.5}
            strokeDasharray="3 3"
          />
        );
      })}

      {/* Grid label: axis range */}
      <text
        x={barAreaLeft - 4}
        y={BAR_AREA_TOP + 4}
        textAnchor="end"
        fill="rgba(255,255,255,0.2)"
        fontSize={7}
        fontFamily={FONT_MONO}
      >
        +{VALUE_RANGE}
      </text>
      <text
        x={barAreaLeft - 4}
        y={BAR_AREA_BOTTOM}
        textAnchor="end"
        fill="rgba(255,255,255,0.2)"
        fontSize={7}
        fontFamily={FONT_MONO}
      >
        -{VALUE_RANGE}
      </text>
      <text
        x={barAreaLeft - 4}
        y={BAR_AREA_MIDLINE + 3}
        textAnchor="end"
        fill="rgba(255,255,255,0.2)"
        fontSize={7}
        fontFamily={FONT_MONO}
      >
        0
      </text>

      {/* Bars with error markers */}
      {values.map((value, i) => {
        const barCenterX = barAreaLeft + i * barSpacing + barSpacing / 2;
        const barX = barCenterX - barWidth / 2;
        const barTopY = valueToY(value);
        const quantizedY = valueToY(quantizedValues[i]);

        const isPositive = value >= 0;
        const barY = isPositive
          ? Math.min(barTopY, BAR_AREA_MIDLINE)
          : BAR_AREA_MIDLINE;
        const barHeight = Math.max(
          Math.abs(barTopY - BAR_AREA_MIDLINE),
          0.5,
        );

        // Error: gap between actual value and quantized level
        const errorTopY = Math.min(barTopY, quantizedY);
        const errorBottomY = Math.max(barTopY, quantizedY);
        const errorHeight = errorBottomY - errorTopY;

        return (
          <g key={`bar-${i}`}>
            {/* Value bar */}
            <rect
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill={barFill}
              stroke={barStroke}
              strokeWidth={0.5}
              rx={1}
            />

            {/* Quantization error marker */}
            {errorHeight > 0.5 && (
              <rect
                x={barCenterX - 1.5}
                y={errorTopY}
                width={3}
                height={errorHeight}
                fill={ERROR_COLOR}
                rx={0.5}
              />
            )}

            {/* Small tick at quantized level */}
            <line
              x1={barCenterX - 4}
              y1={quantizedY}
              x2={barCenterX + 4}
              y2={quantizedY}
              stroke={ERROR_COLOR}
              strokeWidth={0.8}
              opacity={0.6}
            />
          </g>
        );
      })}

      {/* MSE display */}
      <text
        x={panelX + PANEL_WIDTH - 10}
        y={BAR_AREA_BOTTOM + 20}
        textAnchor="end"
        fill={TEXT_BRIGHT}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        MSE ={" "}
        <tspan fill={mse > 0.1 ? ERROR_COLOR : ACCENT}>
          {mse.toFixed(4)}
        </tspan>
      </text>

      {/* Error legend */}
      <g>
        <rect
          x={panelX + 10}
          y={BAR_AREA_BOTTOM + 12}
          width={8}
          height={4}
          fill={ERROR_COLOR}
          rx={1}
        />
        <text
          x={panelX + 22}
          y={BAR_AREA_BOTTOM + 17}
          fill={TEXT_DIM}
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          quantization error
        </text>
      </g>

      {/* Bit-budget visualization */}
      {Array.from({ length: barCount }).map((_, i) => {
        const isActive = bitBudgetActiveIndices.has(i);
        return (
          <rect
            key={`bit-${i}`}
            x={bitSquareStartX + i * (BIT_SQUARE_SIZE + BIT_SQUARE_GAP)}
            y={BIT_SQUARE_TOP}
            width={BIT_SQUARE_SIZE}
            height={BIT_SQUARE_SIZE}
            rx={2}
            fill={isActive ? ACTIVE_COLOR : WASTED_COLOR}
            stroke={
              isActive
                ? "rgba(74,222,128,0.9)"
                : "rgba(255,255,255,0.2)"
            }
            strokeWidth={0.5}
          />
        );
      })}

      {/* Bit-budget label */}
      <text
        x={panelX + PANEL_WIDTH / 2}
        y={BIT_SQUARE_TOP + BIT_SQUARE_SIZE + 16}
        textAnchor="middle"
        fill={TEXT_DIM}
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        {bitBudgetLabel}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SparseVsDenseQuantization() {
  const [seed, setSeed] = useState(42);
  const [bitWidth, setBitWidth] = useState(2);

  // Animation state
  const [animatedSparse, setAnimatedSparse] = useState<number[] | null>(null);
  const [animatedDense, setAnimatedDense] = useState<number[] | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousSparseRef = useRef<number[] | null>(null);
  const previousDenseRef = useRef<number[] | null>(null);

  // Generate the sparse input vector
  const sparseVector = useMemo(
    () => generateSparseVector(seed),
    [seed],
  );

  // Apply the fixed orthogonal transform to spread energy evenly
  const denseVector = useMemo(
    () => applyScrambleTransform(sparseVector),
    [sparseVector],
  );

  // Build quantization grids
  const uniformLevels = useMemo(
    () => buildUniformLevels(bitWidth),
    [bitWidth],
  );

  const optimalLevels = useMemo(
    () => buildOptimalLevels(bitWidth, denseVector),
    [bitWidth, denseVector],
  );

  // Quantize both vectors
  const sparseQuantized = useMemo(
    () => sparseVector.map((v) => quantizeUniform(v, uniformLevels)),
    [sparseVector, uniformLevels],
  );

  const denseQuantized = useMemo(
    () => denseVector.map((v) => quantizeOptimal(v, optimalLevels)),
    [denseVector, optimalLevels],
  );

  // MSE values
  const sparseMse = useMemo(
    () => computeMse(sparseVector, sparseQuantized),
    [sparseVector, sparseQuantized],
  );

  const denseMse = useMemo(
    () => computeMse(denseVector, denseQuantized),
    [denseVector, denseQuantized],
  );

  const improvementFactor =
    denseMse > 0 ? sparseMse / denseMse : Infinity;

  // Identify "important" indices in the sparse vector for the bit-budget display
  const largeValueIndices = useMemo(
    () => findLargeValueIndices(sparseVector),
    [sparseVector],
  );

  const allIndices = useMemo(
    () => new Set(Array.from({ length: VECTOR_LENGTH }, (_, i) => i)),
    [],
  );

  // Animate transitions when vector or bit-width changes
  useEffect(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const fromSparse = previousSparseRef.current ?? sparseVector;
    const fromDense = previousDenseRef.current ?? denseVector;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const progress = easeOutCubic(rawProgress);

      setAnimatedSparse(interpolateArrays(fromSparse, sparseVector, progress));
      setAnimatedDense(interpolateArrays(fromDense, denseVector, progress));

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        previousSparseRef.current = sparseVector;
        previousDenseRef.current = denseVector;
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sparseVector, denseVector]);

  // Use animated values when animating, fall back to computed values
  const displaySparse = animatedSparse ?? sparseVector;
  const displayDense = animatedDense ?? denseVector;

  // Recompute quantized values from animated positions
  const displaySparseQuantized = useMemo(
    () => displaySparse.map((v) => quantizeUniform(v, uniformLevels)),
    [displaySparse, uniformLevels],
  );
  const displayDenseQuantized = useMemo(
    () => displayDense.map((v) => quantizeOptimal(v, optimalLevels)),
    [displayDense, optimalLevels],
  );
  const displaySparseMse = useMemo(
    () => computeMse(displaySparse, displaySparseQuantized),
    [displaySparse, displaySparseQuantized],
  );
  const displayDenseMse = useMemo(
    () => computeMse(displayDense, displayDenseQuantized),
    [displayDense, displayDenseQuantized],
  );

  const displayImprovement =
    displayDenseMse > 0 ? displaySparseMse / displayDenseMse : Infinity;

  const handleRandomize = useCallback(() => {
    previousSparseRef.current = animatedSparse ?? sparseVector;
    previousDenseRef.current = animatedDense ?? denseVector;
    setSeed((prev) => prev + 1);
  }, [animatedSparse, animatedDense, sparseVector, denseVector]);

  const bitOptions = [1, 2, 3, 4] as const;

  return (
    <div
      style={{
        background: BG,
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
            color: TEXT_DIM,
            letterSpacing: "0.04em",
          }}
        >
          why rotation helps quantization
        </span>
        <span style={{ fontSize: 13, color: ACCENT, opacity: 0.7 }}>
          sparse vs. rotated quantization error
        </span>
      </div>

      {/* SVG visualization */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: 6,
          border: `1px solid ${BORDER}`,
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: "100%", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Left panel: sparse vector with uniform quantization */}
          <BarChartPanel
            panelX={LEFT_PANEL_X}
            title="Before Rotation — Sparse Vector"
            subtitle={`${NONZERO_COUNT} coordinates carry all the information`}
            values={displaySparse}
            quantizedValues={displaySparseQuantized}
            gridLevels={uniformLevels}
            barFill={BAR_SPARSE}
            barStroke={BAR_SPARSE_STROKE}
            mse={displaySparseMse}
            bitBudgetLabel={`${VECTOR_LENGTH - NONZERO_COUNT} of ${VECTOR_LENGTH} bit budgets wasted on ~0 values`}
            bitBudgetActiveIndices={largeValueIndices}
            isOptimalGrid={false}
          />

          {/* Arrow between panels */}
          <g>
            <line
              x1={LEFT_PANEL_X + PANEL_WIDTH + 6}
              y1={BAR_AREA_MIDLINE}
              x2={RIGHT_PANEL_X - 6}
              y2={BAR_AREA_MIDLINE}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
              markerEnd="url(#rotation-arrow)"
            />
            <defs>
              <marker
                id="rotation-arrow"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="rgba(255,255,255,0.3)"
                />
              </marker>
            </defs>
            <text
              x={(LEFT_PANEL_X + PANEL_WIDTH + RIGHT_PANEL_X) / 2}
              y={BAR_AREA_MIDLINE - 10}
              textAnchor="middle"
              fill={ACCENT}
              fontSize={11}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              {"\u00D7 \u03A0"}
            </text>
          </g>

          {/* Right panel: dense vector with optimal quantization */}
          <BarChartPanel
            panelX={RIGHT_PANEL_X}
            title="After Rotation — Dense Vector"
            subtitle="information spread evenly across coordinates"
            values={displayDense}
            quantizedValues={displayDenseQuantized}
            gridLevels={optimalLevels}
            barFill={BAR_DENSE}
            barStroke={BAR_DENSE_STROKE}
            mse={displayDenseMse}
            bitBudgetLabel={`All ${VECTOR_LENGTH} bit budgets used effectively`}
            bitBudgetActiveIndices={allIndices}
            isOptimalGrid={true}
          />

          {/* Summary bar at the bottom */}
          <rect
            x={20}
            y={SVG_HEIGHT - 40}
            width={SVG_WIDTH - 40}
            height={30}
            rx={4}
            fill="rgba(74,222,128,0.05)"
            stroke="rgba(74,222,128,0.15)"
            strokeWidth={1}
          />
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT - 21}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={11}
            fontFamily={FONT_MONO}
          >
            Quantization Error: Sparse{" "}
            <tspan fill={ERROR_COLOR}>
              {displaySparseMse.toFixed(4)}
            </tspan>
            {" vs Rotated "}
            <tspan fill={ACCENT}>{displayDenseMse.toFixed(4)}</tspan>
            {" — "}
            <tspan fill={ACCENT} fontWeight="bold">
              {displayImprovement === Infinity
                ? "\u221E"
                : `${displayImprovement.toFixed(1)}x`}
            </tspan>
            {" improvement"}
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {/* Randomize button */}
        <button
          onClick={handleRandomize}
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.35)",
            borderRadius: 6,
            padding: "8px 20px",
            color: ACCENT,
            fontFamily: FONT_MONO,
            fontSize: 13,
            cursor: "pointer",
            letterSpacing: "0.03em",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(74,222,128,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(74,222,128,0.12)")
          }
        >
          Randomize
        </button>

        {/* Bit-width selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              color: TEXT_DIM,
            }}
          >
            Bits per coordinate:
          </span>
          {bitOptions.map((b) => {
            const isSelected = b === bitWidth;
            return (
              <button
                key={b}
                onClick={() => {
                  previousSparseRef.current = animatedSparse ?? sparseVector;
                  previousDenseRef.current = animatedDense ?? denseVector;
                  setBitWidth(b);
                }}
                style={{
                  minWidth: 32,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSelected
                    ? "rgba(74,222,128,0.15)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    isSelected ? "rgba(74,222,128,0.4)" : BORDER
                  }`,
                  borderRadius: 4,
                  color: isSelected ? ACCENT : TEXT_DIM,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {b}
              </button>
            );
          })}
          <span style={{ fontSize: 13, color: TEXT_DIM }}>
            ({1 << bitWidth} levels)
          </span>
        </div>
      </div>

      {/* Legend row */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 14,
          fontSize: 13,
          color: TEXT_DIM,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: BAR_SPARSE,
              border: `1px solid ${BAR_SPARSE_STROKE}`,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Sparse values
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: BAR_DENSE,
              border: `1px solid ${BAR_DENSE_STROKE}`,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Rotated values
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 4,
              background: ERROR_COLOR,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Quantization error
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 0,
              borderTop: "1px dashed rgba(255,255,255,0.3)",
              display: "inline-block",
            }}
          />
          Quantization grid
        </span>
      </div>
    </div>
  );
}
