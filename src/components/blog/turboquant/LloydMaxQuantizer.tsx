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

const REGION_COLORS = [
  "rgba(74, 222, 128, 0.25)",
  "rgba(96, 165, 250, 0.25)",
  "rgba(251, 191, 36, 0.25)",
  "rgba(244, 114, 182, 0.25)",
  "rgba(167, 139, 250, 0.25)",
  "rgba(52, 211, 153, 0.25)",
  "rgba(248, 113, 113, 0.25)",
  "rgba(56, 189, 248, 0.25)",
];

const REGION_STROKE_COLORS = [
  "rgba(74, 222, 128, 0.6)",
  "rgba(96, 165, 250, 0.6)",
  "rgba(251, 191, 36, 0.6)",
  "rgba(244, 114, 182, 0.6)",
  "rgba(167, 139, 250, 0.6)",
  "rgba(52, 211, 153, 0.6)",
  "rgba(248, 113, 113, 0.6)",
  "rgba(56, 189, 248, 0.6)",
];

const SVG_WIDTH = 700;
const SVG_HEIGHT = 400;
const DIST_TOP = 30;
const DIST_BOTTOM = 200;
const DIST_HEIGHT = DIST_BOTTOM - DIST_TOP;
const STAIR_TOP = 230;
const STAIR_BOTTOM = 380;
const STAIR_HEIGHT = STAIR_BOTTOM - STAIR_TOP;
const PLOT_LEFT = 60;
const PLOT_RIGHT = SVG_WIDTH - 24;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

// Gaussian distribution parameters
const MEAN = 0;
const STD = 0.5;
const RANGE_MIN = -2.0;
const RANGE_MAX = 2.0;
const RANGE_SPAN = RANGE_MAX - RANGE_MIN;

// Lloyd-Max iteration parameters
const LLOYD_MAX_ITERATIONS = 50;
const NUMERICAL_INTEGRATION_STEPS = 2000;

// ---------------------------------------------------------------------------
// Gaussian PDF
// ---------------------------------------------------------------------------

function gaussianPdf(x: number, mean: number, std: number): number {
  const exponent = -0.5 * ((x - mean) / std) ** 2;
  return Math.exp(exponent) / (std * Math.sqrt(2 * Math.PI));
}

// ---------------------------------------------------------------------------
// Numerical integration helpers for the Gaussian distribution
// ---------------------------------------------------------------------------

function integratePdf(a: number, b: number): number {
  const steps = NUMERICAL_INTEGRATION_STEPS;
  const dx = (b - a) / steps;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    sum += (gaussianPdf(x0, MEAN, STD) + gaussianPdf(x1, MEAN, STD)) * 0.5 * dx;
  }
  return sum;
}

function integrateWeightedMean(a: number, b: number): number {
  const steps = NUMERICAL_INTEGRATION_STEPS;
  const dx = (b - a) / steps;
  let sumXP = 0;
  let sumP = 0;
  for (let i = 0; i < steps; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    const xMid = (x0 + x1) * 0.5;
    const pMid = gaussianPdf(xMid, MEAN, STD);
    sumXP += xMid * pMid * dx;
    sumP += pMid * dx;
  }
  return sumP > 1e-12 ? sumXP / sumP : (a + b) * 0.5;
}

function integrateMse(a: number, b: number, centroid: number): number {
  const steps = NUMERICAL_INTEGRATION_STEPS;
  const dx = (b - a) / steps;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    const xMid = (x0 + x1) * 0.5;
    const pMid = gaussianPdf(xMid, MEAN, STD);
    sum += (xMid - centroid) ** 2 * pMid * dx;
  }
  return sum;
}

// ---------------------------------------------------------------------------
// Lloyd-Max algorithm
// ---------------------------------------------------------------------------

interface QuantizerState {
  centroids: number[];
  boundaries: number[];
  mse: number;
  regionProbabilities: number[];
}

function computeLloydMax(numLevels: number): QuantizerState {
  // Initialize centroids uniformly across the range
  const centroids: number[] = [];
  for (let i = 0; i < numLevels; i++) {
    centroids.push(
      RANGE_MIN + ((i + 0.5) / numLevels) * RANGE_SPAN
    );
  }

  let boundaries: number[] = [];

  for (let iter = 0; iter < LLOYD_MAX_ITERATIONS; iter++) {
    // Step 1: Compute boundaries as midpoints between adjacent centroids
    boundaries = [];
    boundaries.push(RANGE_MIN);
    for (let i = 0; i < numLevels - 1; i++) {
      boundaries.push((centroids[i] + centroids[i + 1]) / 2);
    }
    boundaries.push(RANGE_MAX);

    // Step 2: Update centroids as conditional means within each region
    for (let i = 0; i < numLevels; i++) {
      const newCentroid = integrateWeightedMean(boundaries[i], boundaries[i + 1]);
      centroids[i] = newCentroid;
    }
  }

  // Final boundaries after last centroid update
  boundaries = [RANGE_MIN];
  for (let i = 0; i < numLevels - 1; i++) {
    boundaries.push((centroids[i] + centroids[i + 1]) / 2);
  }
  boundaries.push(RANGE_MAX);

  // Compute MSE and region probabilities
  let mse = 0;
  const regionProbabilities: number[] = [];
  for (let i = 0; i < numLevels; i++) {
    mse += integrateMse(boundaries[i], boundaries[i + 1], centroids[i]);
    regionProbabilities.push(integratePdf(boundaries[i], boundaries[i + 1]));
  }

  return { centroids, boundaries, mse, regionProbabilities };
}

// ---------------------------------------------------------------------------
// Coordinate mapping
// ---------------------------------------------------------------------------

function toSvgX(value: number): number {
  return PLOT_LEFT + ((value - RANGE_MIN) / RANGE_SPAN) * PLOT_WIDTH;
}

function fromSvgX(svgX: number): number {
  return RANGE_MIN + ((svgX - PLOT_LEFT) / PLOT_WIDTH) * RANGE_SPAN;
}

function toDistY(pdfValue: number, maxPdf: number): number {
  return DIST_BOTTOM - (pdfValue / maxPdf) * DIST_HEIGHT * 0.9;
}

function toStairY(centroidValue: number): number {
  const fraction = (centroidValue - RANGE_MIN) / RANGE_SPAN;
  return STAIR_BOTTOM - fraction * STAIR_HEIGHT;
}

// ---------------------------------------------------------------------------
// Generate the smooth bell curve path
// ---------------------------------------------------------------------------

function buildDistributionPath(maxPdf: number): string {
  const steps = 200;
  const points: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const x = RANGE_MIN + (i / steps) * RANGE_SPAN;
    const y = gaussianPdf(x, MEAN, STD);
    const svgX = toSvgX(x);
    const svgY = toDistY(y, maxPdf);
    points.push(`${i === 0 ? "M" : "L"} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`);
  }

  return points.join(" ");
}

// ---------------------------------------------------------------------------
// Build a region fill path (area under curve between two boundaries)
// ---------------------------------------------------------------------------

function buildRegionFillPath(
  left: number,
  right: number,
  maxPdf: number
): string {
  const steps = 80;
  const span = right - left;
  const points: string[] = [];

  points.push(`M ${toSvgX(left).toFixed(1)} ${DIST_BOTTOM}`);

  for (let i = 0; i <= steps; i++) {
    const x = left + (i / steps) * span;
    const y = gaussianPdf(x, MEAN, STD);
    points.push(`L ${toSvgX(x).toFixed(1)} ${toDistY(y, maxPdf).toFixed(1)}`);
  }

  points.push(`L ${toSvgX(right).toFixed(1)} ${DIST_BOTTOM} Z`);
  return points.join(" ");
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, color: valueColor ?? ACCENT }}>
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LloydMaxQuantizer() {
  const [bits, setBits] = useState(3);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatedState, setAnimatedState] = useState<QuantizerState | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousStateRef = useRef<QuantizerState | null>(null);

  // Pre-compute Lloyd-Max for all bit-widths
  const quantizerStates = useMemo(() => {
    const states: Record<number, QuantizerState> = {};
    for (let b = 1; b <= 5; b++) {
      states[b] = computeLloydMax(1 << b);
    }
    return states;
  }, []);

  const targetState = quantizerStates[bits];
  const maxPdf = gaussianPdf(MEAN, MEAN, STD);

  // Animate transitions between bit-widths
  useEffect(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const fromState = previousStateRef.current ?? targetState;
    const startTime = performance.now();
    const duration = 400;

    function interpolateArrays(
      from: number[],
      to: number[],
      t: number
    ): number[] {
      // When array sizes differ, we fade from the old layout to the new one.
      // Interpolate using the target array length, mapping from-indices
      // proportionally.
      const result: number[] = [];
      for (let i = 0; i < to.length; i++) {
        const fromIdx = (i / Math.max(to.length - 1, 1)) * Math.max(from.length - 1, 1);
        const lo = Math.floor(fromIdx);
        const hi = Math.min(lo + 1, from.length - 1);
        const frac = fromIdx - lo;
        const fromVal = from[lo] + (from[hi] - from[lo]) * frac;
        result.push(fromVal + (to[i] - fromVal) * t);
      }
      return result;
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const t = 1 - (1 - rawT) ** 3;

      const interpolatedCentroids = interpolateArrays(
        fromState.centroids,
        targetState.centroids,
        t
      );

      const interpolatedBoundaries = interpolateArrays(
        fromState.boundaries,
        targetState.boundaries,
        t
      );

      const interpolatedProbs = interpolateArrays(
        fromState.regionProbabilities,
        targetState.regionProbabilities,
        t
      );

      const interpolatedMse = fromState.mse + (targetState.mse - fromState.mse) * t;

      setAnimatedState({
        centroids: interpolatedCentroids,
        boundaries: interpolatedBoundaries,
        mse: interpolatedMse,
        regionProbabilities: interpolatedProbs,
      });

      if (rawT < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        previousStateRef.current = targetState;
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetState]);

  const displayState = animatedState ?? targetState;

  // Handle hover over regions
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const scaleY = SVG_HEIGHT / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;

      // Only detect hover within the distribution or staircase areas
      if (svgX < PLOT_LEFT || svgX > PLOT_RIGHT) {
        setHoveredRegion(null);
        return;
      }

      const isInDistArea = svgY >= DIST_TOP && svgY <= DIST_BOTTOM;
      const isInStairArea = svgY >= STAIR_TOP && svgY <= STAIR_BOTTOM;

      if (!isInDistArea && !isInStairArea) {
        setHoveredRegion(null);
        return;
      }

      const xVal = fromSvgX(svgX);

      for (let i = 0; i < displayState.centroids.length; i++) {
        if (
          xVal >= displayState.boundaries[i] &&
          xVal < displayState.boundaries[i + 1]
        ) {
          setHoveredRegion(i);
          return;
        }
      }

      setHoveredRegion(null);
    },
    [displayState]
  );

  // Compute theoretical optimum MSE for the Gaussian
  // For a Gaussian with variance sigma^2, high-rate approximation:
  // D(R) ~= (pi * e / 6) * sigma^2 * 2^(-2R) where R = bits
  const theoreticalMse =
    ((Math.PI * Math.E) / 6) * STD * STD * Math.pow(2, -2 * bits);

  // X-axis ticks
  const xTicks = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];

  return (
    <div
      style={{
        background: BG,
        padding: "20px",
        fontFamily: FONT_MONO,
        color: TEXT_BRIGHT,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 13,
          color: TEXT_DIM,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Lloyd-Max Optimal Scalar Quantizer
      </div>

      {/* Bit-width slider */}
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <label
          style={{
            fontSize: 13,
            color: TEXT_DIM,
            display: "block",
            marginBottom: 6,
          }}
        >
          Bit width:{" "}
          <span style={{ color: ACCENT, fontSize: 15 }}>{bits}</span>
          <span style={{ color: TEXT_DIM, fontSize: 13 }}>
            {" "}
            ({1 << bits} levels)
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={bits}
          onChange={(e) => setBits(parseInt(e.target.value, 10))}
          style={{
            width: "100%",
            accentColor: ACCENT,
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
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: 6,
          border: `1px solid ${BORDER}`,
          background: BG,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredRegion(null)}
        >
          {/* ============================================ */}
          {/* UPPER SECTION: Distribution + Quantization   */}
          {/* ============================================ */}

          {/* Subtle grid lines in distribution area */}
          {xTicks.map((v) => (
            <line
              key={`grid-${v}`}
              x1={toSvgX(v)}
              y1={DIST_TOP}
              x2={toSvgX(v)}
              y2={DIST_BOTTOM}
              stroke={BORDER}
              strokeWidth={0.5}
            />
          ))}

          {/* Filled region under the curve for each quantization bin */}
          {displayState.centroids.map((_, i) => (
            <path
              key={`region-${i}`}
              d={buildRegionFillPath(
                displayState.boundaries[i],
                displayState.boundaries[i + 1],
                maxPdf
              )}
              fill={REGION_COLORS[i % REGION_COLORS.length]}
              opacity={hoveredRegion === i ? 1 : 0.7}
              style={{ transition: "opacity 0.15s ease" }}
            />
          ))}

          {/* Distribution curve outline */}
          <path
            d={buildDistributionPath(maxPdf)}
            fill="none"
            stroke={TEXT_BRIGHT}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {/* Boundary lines */}
          {displayState.boundaries.map((b, i) => {
            // Skip the outermost boundaries (range edges)
            if (i === 0 || i === displayState.boundaries.length - 1) return null;
            return (
              <line
                key={`boundary-${i}`}
                x1={toSvgX(b)}
                y1={DIST_TOP}
                x2={toSvgX(b)}
                y2={DIST_BOTTOM}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Centroid dots on the distribution */}
          {displayState.centroids.map((c, i) => {
            const pdfAtCentroid = gaussianPdf(c, MEAN, STD);
            const svgX = toSvgX(c);
            const svgY = toDistY(pdfAtCentroid, maxPdf);
            const isHovered = hoveredRegion === i;

            return (
              <g key={`centroid-${i}`}>
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={isHovered ? 6 : 4}
                  fill={REGION_STROKE_COLORS[i % REGION_STROKE_COLORS.length]}
                  stroke={BG}
                  strokeWidth={1.5}
                  style={{ transition: "r 0.15s ease" }}
                />
                {/* Vertical line from centroid dot down to the baseline */}
                <line
                  x1={svgX}
                  y1={svgY}
                  x2={svgX}
                  y2={DIST_BOTTOM}
                  stroke={REGION_STROKE_COLORS[i % REGION_STROKE_COLORS.length]}
                  strokeWidth={isHovered ? 1.5 : 0.8}
                  strokeDasharray={isHovered ? "none" : "2 2"}
                  opacity={isHovered ? 0.8 : 0.4}
                />
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredRegion !== null && (() => {
            const i = hoveredRegion;
            const leftB = displayState.boundaries[i];
            const rightB = displayState.boundaries[i + 1];
            const centroid = displayState.centroids[i];
            const prob = displayState.regionProbabilities[i];
            const tooltipX = toSvgX(centroid);
            const tooltipY = DIST_TOP - 2;

            // Clamp tooltip so it doesn't overflow
            const clampedX = Math.max(PLOT_LEFT + 70, Math.min(PLOT_RIGHT - 70, tooltipX));

            return (
              <g>
                <rect
                  x={clampedX - 68}
                  y={tooltipY - 46}
                  width={136}
                  height={48}
                  rx={4}
                  fill="rgba(20,20,20,0.95)"
                  stroke={REGION_STROKE_COLORS[i % REGION_STROKE_COLORS.length]}
                  strokeWidth={1}
                />
                <text
                  x={clampedX}
                  y={tooltipY - 30}
                  textAnchor="middle"
                  fill={TEXT_BRIGHT}
                  fontSize={11}
                  fontFamily={FONT_MONO}
                >
                  [{leftB.toFixed(2)}, {rightB.toFixed(2)}]
                </text>
                <text
                  x={clampedX}
                  y={tooltipY - 16}
                  textAnchor="middle"
                  fill={REGION_STROKE_COLORS[i % REGION_STROKE_COLORS.length]}
                  fontSize={11}
                  fontFamily={FONT_MONO}
                >
                  c = {centroid.toFixed(3)}
                </text>
                <text
                  x={clampedX}
                  y={tooltipY - 2}
                  textAnchor="middle"
                  fill={TEXT_DIM}
                  fontSize={11}
                  fontFamily={FONT_MONO}
                >
                  mass = {(prob * 100).toFixed(1)}%
                </text>
              </g>
            );
          })()}

          {/* Distribution Y-axis label */}
          <text
            x={14}
            y={(DIST_TOP + DIST_BOTTOM) / 2}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={12}
            fontFamily={FONT_MONO}
            transform={`rotate(-90, 14, ${(DIST_TOP + DIST_BOTTOM) / 2})`}
          >
            p(x)
          </text>

          {/* ============================================ */}
          {/* LOWER SECTION: Staircase transfer function   */}
          {/* ============================================ */}

          {/* Section label */}
          <text
            x={PLOT_LEFT}
            y={STAIR_TOP - 8}
            fill={TEXT_DIM}
            fontSize={11}
            fontFamily={FONT_MONO}
          >
            Quantization transfer function Q(x)
          </text>

          {/* Staircase background grid */}
          {xTicks.map((v) => (
            <line
              key={`stair-grid-${v}`}
              x1={toSvgX(v)}
              y1={STAIR_TOP}
              x2={toSvgX(v)}
              y2={STAIR_BOTTOM}
              stroke={BORDER}
              strokeWidth={0.5}
            />
          ))}

          {/* Diagonal reference line (identity: Q(x) = x) */}
          <line
            x1={PLOT_LEFT}
            y1={STAIR_BOTTOM}
            x2={PLOT_RIGHT}
            y2={STAIR_TOP}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            strokeDasharray="6 4"
          />

          {/* Colored staircase segments */}
          {displayState.centroids.map((c, i) => {
            const leftX = toSvgX(displayState.boundaries[i]);
            const rightX = toSvgX(displayState.boundaries[i + 1]);
            const y = toStairY(c);
            const isHovered = hoveredRegion === i;

            return (
              <g key={`stair-${i}`}>
                {/* Highlighted background for hovered step */}
                {isHovered && (
                  <rect
                    x={leftX}
                    y={STAIR_TOP}
                    width={rightX - leftX}
                    height={STAIR_HEIGHT}
                    fill={REGION_COLORS[i % REGION_COLORS.length]}
                    opacity={0.3}
                  />
                )}
                {/* Step line */}
                <line
                  x1={leftX}
                  y1={y}
                  x2={rightX}
                  y2={y}
                  stroke={REGION_STROKE_COLORS[i % REGION_STROKE_COLORS.length]}
                  strokeWidth={isHovered ? 2.5 : 2}
                  strokeLinecap="round"
                />
                {/* Centroid dot on step */}
                <circle
                  cx={(leftX + rightX) / 2}
                  cy={y}
                  r={isHovered ? 3.5 : 2.5}
                  fill={REGION_STROKE_COLORS[i % REGION_STROKE_COLORS.length]}
                />
              </g>
            );
          })}

          {/* Vertical risers between steps */}
          {displayState.centroids.map((_, i) => {
            if (i === 0) return null;
            const bx = toSvgX(displayState.boundaries[i]);
            const prevY = toStairY(displayState.centroids[i - 1]);
            const currY = toStairY(displayState.centroids[i]);
            return (
              <line
                key={`riser-${i}`}
                x1={bx}
                y1={prevY}
                x2={bx}
                y2={currY}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            );
          })}

          {/* Staircase plot border */}
          <rect
            x={PLOT_LEFT}
            y={STAIR_TOP}
            width={PLOT_WIDTH}
            height={STAIR_HEIGHT}
            fill="none"
            stroke={BORDER}
            strokeWidth={1}
          />

          {/* Staircase Y-axis label */}
          <text
            x={14}
            y={(STAIR_TOP + STAIR_BOTTOM) / 2}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={12}
            fontFamily={FONT_MONO}
            transform={`rotate(-90, 14, ${(STAIR_TOP + STAIR_BOTTOM) / 2})`}
          >
            Q(x)
          </text>

          {/* Shared X-axis labels */}
          {xTicks.filter((_, i) => i % 2 === 0 || xTicks.length <= 9).map((v) => (
            <text
              key={`xlabel-${v}`}
              x={toSvgX(v)}
              y={STAIR_BOTTOM + 14}
              textAnchor="middle"
              fill={TEXT_DIM}
              fontSize={11}
              fontFamily={FONT_MONO}
            >
              {v}
            </text>
          ))}

          {/* Distribution plot border */}
          <rect
            x={PLOT_LEFT}
            y={DIST_TOP}
            width={PLOT_WIDTH}
            height={DIST_HEIGHT}
            fill="none"
            stroke={BORDER}
            strokeWidth={1}
          />

          {/* MSE display in top-right corner */}
          <text
            x={PLOT_RIGHT - 4}
            y={DIST_TOP + 16}
            textAnchor="end"
            fill={ACCENT}
            fontSize={12}
            fontFamily={FONT_MONO}
          >
            MSE = {displayState.mse.toFixed(4)}
          </text>
          <text
            x={PLOT_RIGHT - 4}
            y={DIST_TOP + 30}
            textAnchor="end"
            fill={TEXT_DIM}
            fontSize={11}
            fontFamily={FONT_MONO}
          >
            theoretical: {theoreticalMse.toFixed(4)}
          </text>
        </svg>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        <StatCard
          label="Levels"
          value={`${1 << bits}`}
          valueColor={ACCENT}
        />
        <StatCard
          label="MSE Distortion"
          value={targetState.mse.toExponential(2)}
          valueColor={
            targetState.mse < 0.001
              ? ACCENT
              : targetState.mse < 0.01
                ? "rgba(234,179,8,0.9)"
                : "rgba(239,68,68,0.8)"
          }
        />
        <StatCard
          label="Bits / Coord"
          value={`${bits}`}
          valueColor={TEXT_BRIGHT}
        />
        <StatCard
          label="vs FP32"
          value={`${(32 / bits).toFixed(1)}x`}
          valueColor={TEXT_BRIGHT}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 12,
          fontSize: 13,
          color: TEXT_DIM,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 2,
              background: TEXT_BRIGHT,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Gaussian PDF
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: REGION_COLORS[0],
              border: `1px solid ${REGION_STROKE_COLORS[0]}`,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Quantization regions
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              background: REGION_STROKE_COLORS[0],
              display: "inline-block",
              borderRadius: "50%",
            }}
          />
          Centroids
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 1,
              background: "rgba(255,255,255,0.35)",
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Boundaries
        </span>
      </div>
    </div>
  );
}
