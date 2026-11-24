"use client";

import { useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";

const SVG_WIDTH = 800;
const SVG_HEIGHT = 350;

const PANEL_WIDTH = 320;
const PANEL_LEFT_X = 30;
const PANEL_RIGHT_X = SVG_WIDTH - PANEL_WIDTH - 30;
const PANEL_TOP = 40;
const PANEL_BOTTOM = 280;
const PANEL_HEIGHT = PANEL_BOTTOM - PANEL_TOP;

const HISTOGRAM_BINS = 24;
const BAR_FILL = "rgba(74,222,128,0.35)";
const BAR_STROKE = "rgba(74,222,128,0.55)";
const CURVE_COLOR = "#4ade80";

const DIMENSION_OPTIONS = [8, 32, 128, 512] as const;
type Dimension = (typeof DIMENSION_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Seeded random number generator (for reproducible results)
// ---------------------------------------------------------------------------

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Box-Muller transform: uniform -> Gaussian samples
// ---------------------------------------------------------------------------

function gaussianPair(
  rand: () => number,
): [number, number] {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  const radius = Math.sqrt(-2 * Math.log(u1));
  return [
    radius * Math.cos(2 * Math.PI * u2),
    radius * Math.sin(2 * Math.PI * u2),
  ];
}

// ---------------------------------------------------------------------------
// Generate a "realistic" input vector that mimics KV cache key vectors:
// most coordinates are small, but a few are large outliers.
// ---------------------------------------------------------------------------

function generateSpikyInputVector(
  dimension: number,
  seed: number,
): number[] {
  const rand = createSeededRandom(seed);
  const vector: number[] = [];

  for (let i = 0; i < dimension; i += 2) {
    const [g1, g2] = gaussianPair(rand);

    // ~25% chance each coordinate is an outlier (scaled up 4x)
    const isOutlier1 = rand() < 0.25;
    const isOutlier2 = rand() < 0.25;

    vector.push(g1 * (isOutlier1 ? 4.0 : 0.3));
    if (i + 1 < dimension) {
      vector.push(g2 * (isOutlier2 ? 4.0 : 0.3));
    }
  }

  return vector;
}

// ---------------------------------------------------------------------------
// Apply a random orthogonal rotation to a vector.
//
// For a true random orthogonal matrix we would compute QR of a Gaussian
// matrix, but that is O(d^3). Instead, we use the mathematically equivalent
// approach of applying d Householder reflections with random normal vectors,
// which produces a Haar-distributed orthogonal transformation.
// ---------------------------------------------------------------------------

function applyRandomRotation(
  vector: number[],
  seed: number,
): number[] {
  const dimension = vector.length;
  const rand = createSeededRandom(seed);
  const rotated = [...vector];

  // Apply a sequence of random Householder reflections.
  // Each reflection: x -> x - 2 * (v^T x / v^T v) * v
  // With enough reflections the result is uniformly distributed on the
  // sphere of radius ||x||, which is what a Haar-random rotation gives us.
  const numReflections = Math.max(dimension, 20);

  for (let r = 0; r < numReflections; r++) {
    // Generate random normal vector for the reflection
    const reflectionVector: number[] = [];
    for (let i = 0; i < dimension; i += 2) {
      const [g1, g2] = gaussianPair(rand);
      reflectionVector.push(g1);
      if (i + 1 < dimension) reflectionVector.push(g2);
    }

    // Compute dot products
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
// Histogram computation
// ---------------------------------------------------------------------------

interface HistogramData {
  counts: number[];
  binEdges: number[];
  binWidth: number;
  maxCount: number;
  rangeMin: number;
  rangeMax: number;
}

function computeHistogram(
  values: number[],
  numBins: number,
  rangeMin: number,
  rangeMax: number,
): HistogramData {
  const counts = new Array(numBins).fill(0);
  const binWidth = (rangeMax - rangeMin) / numBins;

  const binEdges: number[] = [];
  for (let i = 0; i <= numBins; i++) {
    binEdges.push(rangeMin + i * binWidth);
  }

  for (const value of values) {
    const binIndex = Math.floor((value - rangeMin) / binWidth);
    const clampedIndex = Math.max(0, Math.min(numBins - 1, binIndex));
    counts[clampedIndex]++;
  }

  const maxCount = Math.max(...counts, 1);

  return { counts, binEdges, binWidth, maxCount, rangeMin, rangeMax };
}

// ---------------------------------------------------------------------------
// Theoretical density curve for coordinates of a random rotation.
//
// In d dimensions, each coordinate of Πx (where ||x|| = norm) follows a
// scaled Beta((d-1)/2, (d-1)/2) distribution on [-norm, norm].
// For large d this converges to N(0, norm²/d).
// We use the Gaussian approximation which is accurate for d >= 8.
// ---------------------------------------------------------------------------

function theoreticalDensity(
  coordinateValue: number,
  dimension: number,
  vectorNorm: number,
): number {
  const variance = (vectorNorm * vectorNorm) / dimension;
  const stdDev = Math.sqrt(variance);

  return (
    (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
    Math.exp(-(coordinateValue * coordinateValue) / (2 * variance))
  );
}

// ---------------------------------------------------------------------------
// Format a number array for display: show first few values with ellipsis
// ---------------------------------------------------------------------------

function formatVectorPreview(values: number[], count: number): string {
  const preview = values
    .slice(0, count)
    .map((v) => v.toFixed(2))
    .join(", ");
  return `[${preview}, ...]`;
}

// ---------------------------------------------------------------------------
// Compute the L2 norm of a vector
// ---------------------------------------------------------------------------

function vectorNorm(values: number[]): number {
  let sumSquares = 0;
  for (const v of values) sumSquares += v * v;
  return Math.sqrt(sumSquares);
}

// ---------------------------------------------------------------------------
// Sub-components: Histogram panel
// ---------------------------------------------------------------------------

function HistogramPanel({
  panelX,
  title,
  histogram,
  showTheoryCurve,
  dimension,
  norm,
  valuePreview,
}: {
  panelX: number;
  title: string;
  histogram: HistogramData;
  showTheoryCurve: boolean;
  dimension: number;
  norm: number;
  valuePreview: string;
}) {
  const { counts, rangeMin, rangeMax, binWidth, maxCount } = histogram;
  const barAreaWidth = PANEL_WIDTH - 40;
  const barAreaLeft = panelX + 30;
  const barAreaBottom = PANEL_BOTTOM - 10;
  const barAreaHeight = PANEL_HEIGHT - 40;

  const barPixelWidth = barAreaWidth / counts.length;

  // X-axis tick values
  const xTickCount = 5;
  const xTicks: number[] = [];
  for (let i = 0; i <= xTickCount; i++) {
    xTicks.push(rangeMin + (i / xTickCount) * (rangeMax - rangeMin));
  }

  // Scale factor to convert density to histogram bar height
  const totalValues = counts.reduce((sum, c) => sum + c, 0);

  return (
    <g>
      {/* Panel background */}
      <rect
        x={panelX}
        y={PANEL_TOP - 4}
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT + 8}
        rx={6}
        fill="rgba(255,255,255,0.02)"
        stroke={BORDER}
        strokeWidth={1}
      />

      {/* Title */}
      <text
        x={panelX + PANEL_WIDTH / 2}
        y={PANEL_TOP + 16}
        textAnchor="middle"
        fill={TEXT_BRIGHT}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        {title}
      </text>

      {/* Histogram bars */}
      {counts.map((count, i) => {
        const barHeight =
          maxCount > 0 ? (count / maxCount) * barAreaHeight * 0.85 : 0;
        const barX = barAreaLeft + i * barPixelWidth;
        const barY = barAreaBottom - barHeight;

        return (
          <rect
            key={i}
            x={barX + 0.5}
            y={barY}
            width={Math.max(barPixelWidth - 1, 1)}
            height={barHeight}
            fill={BAR_FILL}
            stroke={BAR_STROKE}
            strokeWidth={0.5}
            rx={0.5}
          />
        );
      })}

      {/* Theoretical bell curve overlay */}
      {showTheoryCurve && totalValues > 0 && (
        <TheoreticalCurve
          barAreaLeft={barAreaLeft}
          barAreaBottom={barAreaBottom}
          barAreaWidth={barAreaWidth}
          barAreaHeight={barAreaHeight}
          rangeMin={rangeMin}
          rangeMax={rangeMax}
          binWidth={binWidth}
          maxCount={maxCount}
          totalValues={totalValues}
          dimension={dimension}
          norm={norm}
        />
      )}

      {/* X-axis line */}
      <line
        x1={barAreaLeft}
        y1={barAreaBottom}
        x2={barAreaLeft + barAreaWidth}
        y2={barAreaBottom}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
      />

      {/* X-axis ticks */}
      {xTicks.map((tick) => {
        const x =
          barAreaLeft +
          ((tick - rangeMin) / (rangeMax - rangeMin)) * barAreaWidth;
        return (
          <text
            key={tick}
            x={x}
            y={barAreaBottom + 12}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={8}
            fontFamily={FONT_MONO}
          >
            {tick.toFixed(1)}
          </text>
        );
      })}

      {/* Axis labels */}
      <text
        x={panelX + PANEL_WIDTH / 2}
        y={barAreaBottom + 24}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        coordinate value
      </text>

      <text
        x={panelX + 10}
        y={PANEL_TOP + (PANEL_HEIGHT / 2)}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize={8}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, ${panelX + 10}, ${PANEL_TOP + PANEL_HEIGHT / 2})`}
      >
        frequency
      </text>

      {/* Value preview */}
      <text
        x={panelX + PANEL_WIDTH / 2}
        y={PANEL_BOTTOM + 18}
        textAnchor="middle"
        fill="rgba(255,255,255,0.25)"
        fontSize={7.5}
        fontFamily={FONT_MONO}
      >
        {valuePreview}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Theoretical bell curve rendered as a smooth SVG path
// ---------------------------------------------------------------------------

function TheoreticalCurve({
  barAreaLeft,
  barAreaBottom,
  barAreaWidth,
  barAreaHeight,
  rangeMin,
  rangeMax,
  binWidth,
  maxCount,
  totalValues,
  dimension,
  norm,
}: {
  barAreaLeft: number;
  barAreaBottom: number;
  barAreaWidth: number;
  barAreaHeight: number;
  rangeMin: number;
  rangeMax: number;
  binWidth: number;
  maxCount: number;
  totalValues: number;
  dimension: number;
  norm: number;
}) {
  const sampleCount = 80;
  const pathPoints: string[] = [];

  for (let i = 0; i <= sampleCount; i++) {
    const coordinateValue =
      rangeMin + (i / sampleCount) * (rangeMax - rangeMin);
    const density = theoreticalDensity(coordinateValue, dimension, norm);

    // Convert density to the same scale as histogram bars:
    // expected count in a bin = density * binWidth * totalValues
    const expectedCount = density * binWidth * totalValues;
    const barHeight =
      maxCount > 0 ? (expectedCount / maxCount) * barAreaHeight * 0.85 : 0;

    const x =
      barAreaLeft +
      ((coordinateValue - rangeMin) / (rangeMax - rangeMin)) * barAreaWidth;
    const y = barAreaBottom - barHeight;

    pathPoints.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return (
    <path
      d={pathPoints.join(" ")}
      fill="none"
      stroke={CURVE_COLOR}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.8}
    />
  );
}

// ---------------------------------------------------------------------------
// Arrow between panels
// ---------------------------------------------------------------------------

function RotationArrow() {
  const arrowStartX = PANEL_LEFT_X + PANEL_WIDTH + 12;
  const arrowEndX = PANEL_RIGHT_X - 12;
  const arrowY = PANEL_TOP + PANEL_HEIGHT / 2 - 10;

  return (
    <g>
      {/* Arrow line */}
      <line
        x1={arrowStartX}
        y1={arrowY}
        x2={arrowEndX - 8}
        y2={arrowY}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />

      {/* Arrowhead marker defined in <defs> */}
      <defs>
        <marker
          id="arrowhead"
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

      {/* Label */}
      <text
        x={(arrowStartX + arrowEndX) / 2}
        y={arrowY - 8}
        textAnchor="middle"
        fill={ACCENT}
        fontSize={12}
        fontFamily={FONT_MONO}
        fontWeight="bold"
      >
        {"× \u03A0"}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RandomRotationDemo() {
  const [dimension, setDimension] = useState<Dimension>(128);
  const [rotationSeed, setRotationSeed] = useState(7);

  const inputVector = useMemo(
    () => generateSpikyInputVector(dimension, 42),
    [dimension],
  );

  const rotatedVector = useMemo(
    () => applyRandomRotation(inputVector, rotationSeed),
    [inputVector, rotationSeed],
  );

  const norm = useMemo(() => vectorNorm(inputVector), [inputVector]);

  // Determine histogram ranges
  // Left panel: range accommodates the outliers in the original vector
  const originalAbsMax = useMemo(() => {
    let absMax = 0;
    for (const v of inputVector) absMax = Math.max(absMax, Math.abs(v));
    return Math.ceil(absMax) + 1;
  }, [inputVector]);

  const originalHistogram = useMemo(
    () =>
      computeHistogram(
        inputVector,
        HISTOGRAM_BINS,
        -originalAbsMax,
        originalAbsMax,
      ),
    [inputVector, originalAbsMax],
  );

  // Right panel: tighter range because rotation spreads energy evenly
  const rotatedRange = useMemo(() => {
    const theoreticalStdDev = norm / Math.sqrt(dimension);
    return Math.max(theoreticalStdDev * 4, 0.5);
  }, [norm, dimension]);

  const rotatedHistogram = useMemo(
    () =>
      computeHistogram(
        rotatedVector,
        HISTOGRAM_BINS,
        -rotatedRange,
        rotatedRange,
      ),
    [rotatedVector, rotatedRange],
  );

  const handleRotate = useCallback(() => {
    setRotationSeed((prev) => prev + 1);
  }, []);

  const handleDimensionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sliderValue = parseInt(event.target.value, 10);
      setDimension(DIMENSION_OPTIONS[sliderValue]);
    },
    [],
  );

  const dimensionSliderIndex = DIMENSION_OPTIONS.indexOf(dimension);
  const theoreticalStdDev = norm / Math.sqrt(dimension);

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
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          why random rotation works
        </span>
        <span style={{ fontSize: 13, color: ACCENT, opacity: 0.7 }}>
          click Rotate to sample a new orthogonal matrix
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
          {/* Left panel: before rotation */}
          <HistogramPanel
            panelX={PANEL_LEFT_X}
            title="Original Coordinates"
            histogram={originalHistogram}
            showTheoryCurve={false}
            dimension={dimension}
            norm={norm}
            valuePreview={formatVectorPreview(inputVector, 5)}
          />

          {/* Arrow between panels */}
          <RotationArrow />

          {/* Right panel: after rotation */}
          <HistogramPanel
            panelX={PANEL_RIGHT_X}
            title={`After Random Rotation \u03A0x`}
            histogram={rotatedHistogram}
            showTheoryCurve={true}
            dimension={dimension}
            norm={norm}
            valuePreview={formatVectorPreview(rotatedVector, 5)}
          />

          {/* Bottom annotation */}
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT - 18}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={9.5}
            fontFamily={FONT_MONO}
          >
            {`In d=${dimension} dimensions, every coordinate follows \u2248 N(0, 1/d) regardless of input`}
          </text>

          {/* Norm and variance annotation */}
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT - 5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize={8}
            fontFamily={FONT_MONO}
          >
            {`||x|| = ${norm.toFixed(2)}   \u03C3 \u2248 ${theoreticalStdDev.toFixed(3)}`}
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
        {/* Rotate button */}
        <button
          onClick={handleRotate}
          style={{
            background: "rgba(74,222,128,0.12)",
            border: `1px solid rgba(74,222,128,0.35)`,
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
          Rotate
        </button>

        {/* Dimension slider */}
        <div style={{ flex: "1 1 200px", maxWidth: 320 }}>
          <label
            style={{
              fontSize: 13,
              color: TEXT_DIM,
              display: "block",
              marginBottom: 6,
            }}
          >
            Vector dimension:{" "}
            <span style={{ color: ACCENT, fontSize: 15 }}>d={dimension}</span>
          </label>
          <input
            type="range"
            aria-label="Vector dimension"
            min={0}
            max={DIMENSION_OPTIONS.length - 1}
            step={1}
            value={dimensionSliderIndex}
            onChange={handleDimensionChange}
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
              fontSize: 13,
              color: TEXT_DIM,
              marginTop: 2,
            }}
          >
            {DIMENSION_OPTIONS.map((d) => (
              <span
                key={d}
                style={{
                  color: d === dimension ? ACCENT : TEXT_DIM,
                  fontWeight: d === dimension ? "bold" : "normal",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
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
              background: BAR_FILL,
              border: `1px solid ${BAR_STROKE}`,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Histogram bins
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 2,
              background: CURVE_COLOR,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Theoretical N(0, ||x||{"\u00B2"}/d)
        </span>
      </div>
    </div>
  );
}
