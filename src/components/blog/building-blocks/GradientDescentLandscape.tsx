"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 500;
const PADDING = 36;

const GRID_SIZE = 40;
const DOMAIN_MIN = -2;
const DOMAIN_MAX = 4;
const DOMAIN_RANGE = DOMAIN_MAX - DOMAIN_MIN;

const STARTING_POSITION: [number, number] = [-1.5, 3.5];
const MAX_AUTO_STEPS = 50;
const AUTO_STEP_INTERVAL_MS = 200;
const NUMERICAL_H = 0.001;

const GRADIENT_ARROW_DURATION_MS = 400;

// ---------------------------------------------------------------------------
// Loss function & gradient
// ---------------------------------------------------------------------------

function lossAt(x: number, y: number): number {
  return (x - 1) ** 2 + (y - 1) ** 2 + 0.5 * Math.sin(3 * x) * Math.sin(3 * y);
}

function gradientAt(x: number, y: number): [number, number] {
  const dfdx = (lossAt(x + NUMERICAL_H, y) - lossAt(x - NUMERICAL_H, y)) / (2 * NUMERICAL_H);
  const dfdy = (lossAt(x, y + NUMERICAL_H) - lossAt(x, y - NUMERICAL_H)) / (2 * NUMERICAL_H);
  return [dfdx, dfdy];
}

// ---------------------------------------------------------------------------
// Coordinate mapping: data space <-> SVG space
// ---------------------------------------------------------------------------

function toSvgX(dataX: number): number {
  return PADDING + ((dataX - DOMAIN_MIN) / DOMAIN_RANGE) * (SVG_WIDTH - 2 * PADDING);
}

function toSvgY(dataY: number): number {
  // Invert Y so higher values appear at the top
  return SVG_HEIGHT - PADDING - ((dataY - DOMAIN_MIN) / DOMAIN_RANGE) * (SVG_HEIGHT - 2 * PADDING);
}

// ---------------------------------------------------------------------------
// Color interpolation for heatmap
// ---------------------------------------------------------------------------

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

const COLOR_STOPS: { t: number; color: RGBColor }[] = [
  { t: 0.0, color: { r: 15, g: 20, b: 35 } },    // dark blue-black (low loss)
  { t: 0.15, color: { r: 20, g: 40, b: 80 } },    // deep navy
  { t: 0.35, color: { r: 50, g: 50, b: 100 } },   // muted indigo
  { t: 0.55, color: { r: 140, g: 60, b: 50 } },   // dark rust
  { t: 0.75, color: { r: 200, g: 75, b: 20 } },   // burnt orange
  { t: 1.0, color: { r: 232, g: 83, b: 14 } },    // bright accent orange
];

function interpolateColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));

  let lower = COLOR_STOPS[0];
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1];

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].t && clamped <= COLOR_STOPS[i + 1].t) {
      lower = COLOR_STOPS[i];
      upper = COLOR_STOPS[i + 1];
      break;
    }
  }

  const segmentLength = upper.t - lower.t;
  const segmentProgress = segmentLength === 0 ? 0 : (clamped - lower.t) / segmentLength;

  const r = Math.round(lower.color.r + (upper.color.r - lower.color.r) * segmentProgress);
  const g = Math.round(lower.color.g + (upper.color.g - lower.color.g) * segmentProgress);
  const b = Math.round(lower.color.b + (upper.color.b - lower.color.b) * segmentProgress);

  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// Precomputed heatmap data
// ---------------------------------------------------------------------------

interface HeatmapCell {
  row: number;
  col: number;
  color: string;
}

function computeHeatmap(): { cells: HeatmapCell[]; minLoss: number; maxLoss: number } {
  const rawValues: number[][] = [];
  let minLoss = Infinity;
  let maxLoss = -Infinity;

  for (let row = 0; row < GRID_SIZE; row++) {
    rawValues[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = DOMAIN_MIN + (col + 0.5) * (DOMAIN_RANGE / GRID_SIZE);
      const y = DOMAIN_MAX - (row + 0.5) * (DOMAIN_RANGE / GRID_SIZE);
      const loss = lossAt(x, y);
      rawValues[row][col] = loss;
      if (loss < minLoss) minLoss = loss;
      if (loss > maxLoss) maxLoss = loss;
    }
  }

  const lossRange = maxLoss - minLoss;
  const cells: HeatmapCell[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const normalizedLoss = lossRange === 0 ? 0 : (rawValues[row][col] - minLoss) / lossRange;
      cells.push({ row, col, color: interpolateColor(normalizedLoss) });
    }
  }

  return { cells, minLoss, maxLoss };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AxisLabels() {
  return (
    <>
      <text
        x={SVG_WIDTH / 2}
        y={SVG_HEIGHT - 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={12}
        fontFamily={FONT_MONO}
      >
        w₁
      </text>
      <text
        x={10}
        y={SVG_HEIGHT / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={12}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, 10, ${SVG_HEIGHT / 2})`}
      >
        w₂
      </text>
    </>
  );
}

function HeatmapGrid({ cells }: { cells: HeatmapCell[] }) {
  const plotWidth = SVG_WIDTH - 2 * PADDING;
  const plotHeight = SVG_HEIGHT - 2 * PADDING;
  const cellWidth = plotWidth / GRID_SIZE;
  const cellHeight = plotHeight / GRID_SIZE;

  return (
    <g>
      {cells.map((cell) => (
        <rect
          key={`${cell.row}-${cell.col}`}
          x={PADDING + cell.col * cellWidth}
          y={PADDING + cell.row * cellHeight}
          width={cellWidth + 0.5}
          height={cellHeight + 0.5}
          fill={cell.color}
        />
      ))}
    </g>
  );
}

function MinimumGlow() {
  // The analytical minimum of the quadratic part is at (1,1).
  // Add a subtle radial glow to mark the low-loss basin.
  const cx = toSvgX(1);
  const cy = toSvgY(1);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={18}
      fill="none"
      stroke="rgba(100,180,255,0.15)"
      strokeWidth={3}
      style={{ filter: "blur(4px)" }}
    />
  );
}

function DescentTrail({ path }: { path: [number, number][] }) {
  if (path.length < 2) return null;

  const pointsString = path.map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`).join(" ");

  return (
    <g>
      <polyline
        points={pointsString}
        fill="none"
        stroke="rgba(74,222,128,0.5)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {path.slice(0, -1).map(([x, y], i) => (
        <circle
          key={i}
          cx={toSvgX(x)}
          cy={toSvgY(y)}
          r={2.5}
          fill="rgba(74,222,128,0.6)"
        />
      ))}
    </g>
  );
}

function CurrentPositionDot({ x, y }: { x: number; y: number }) {
  const svgX = toSvgX(x);
  const svgY = toSvgY(y);

  return (
    <g>
      {/* Outer glow */}
      <circle cx={svgX} cy={svgY} r={12} fill="rgba(74,222,128,0.2)" />
      {/* Inner dot */}
      <circle cx={svgX} cy={svgY} r={6} fill={ACCENT} />
      {/* Bright center highlight */}
      <circle cx={svgX} cy={svgY} r={2} fill="rgba(255,255,255,0.6)" />
    </g>
  );
}

function GradientArrow({
  fromX,
  fromY,
  gradX,
  gradY,
  opacity,
}: {
  fromX: number;
  fromY: number;
  gradX: number;
  gradY: number;
  opacity: number;
}) {
  if (opacity <= 0) return null;

  const svgFromX = toSvgX(fromX);
  const svgFromY = toSvgY(fromY);

  // Scale the gradient for visibility (negative direction = descent direction)
  const arrowScale = 15;
  const magnitude = Math.sqrt(gradX ** 2 + gradY ** 2);
  if (magnitude === 0) return null;

  const normalizedGradX = gradX / magnitude;
  const normalizedGradY = gradY / magnitude;

  // Arrow points in the negative gradient direction (descent)
  const svgToX = svgFromX - normalizedGradX * arrowScale;
  const svgToY = svgFromY + normalizedGradY * arrowScale; // + because SVG Y is inverted

  return (
    <line
      x1={svgFromX}
      y1={svgFromY}
      x2={svgToX}
      y2={svgToY}
      stroke={`rgba(255,255,255,${opacity})`}
      strokeWidth={2}
      markerEnd="none"
      strokeLinecap="round"
    />
  );
}

// ---------------------------------------------------------------------------
// Button component
// ---------------------------------------------------------------------------

function ControlButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-white/20 px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-[#4ade80] hover:text-[#4ade80] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-white/70"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GradientDescentLandscape() {
  const [position, setPosition] = useState<[number, number]>(STARTING_POSITION);
  const [path, setPath] = useState<[number, number][]>([STARTING_POSITION]);
  const [learningRate, setLearningRate] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);

  // Gradient arrow fade animation
  const [arrowState, setArrowState] = useState<{
    fromX: number;
    fromY: number;
    gradX: number;
    gradY: number;
    opacity: number;
  } | null>(null);
  const arrowFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoRunTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepCountRef = useRef(0);

  const { cells } = useMemo(() => computeHeatmap(), []);
  const currentLoss = lossAt(position[0], position[1]);

  // ----- Step logic -----

  const performStep = useCallback(() => {
    setPosition((prev) => {
      const [x, y] = prev;
      const [dfdx, dfdy] = gradientAt(x, y);

      // Show gradient arrow
      setArrowState({ fromX: x, fromY: y, gradX: dfdx, gradY: dfdy, opacity: 0.8 });
      if (arrowFadeTimerRef.current) clearTimeout(arrowFadeTimerRef.current);
      arrowFadeTimerRef.current = setTimeout(() => {
        setArrowState(null);
      }, GRADIENT_ARROW_DURATION_MS);

      const newX = x - learningRate * dfdx;
      const newY = y - learningRate * dfdy;
      const clamped: [number, number] = [
        Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, newX)),
        Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, newY)),
      ];

      setPath((prevPath) => [...prevPath, clamped]);
      stepCountRef.current += 1;

      return clamped;
    });
  }, [learningRate]);

  // ----- Auto-run -----

  useEffect(() => {
    if (!isRunning) {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
      return;
    }

    autoRunTimerRef.current = setInterval(() => {
      const isNearMinimum = lossAt(position[0], position[1]) < 0.05;
      const hasReachedMaxSteps = stepCountRef.current >= MAX_AUTO_STEPS;

      if (isNearMinimum || hasReachedMaxSteps) {
        setIsRunning(false);
        return;
      }

      performStep();
    }, AUTO_STEP_INTERVAL_MS);

    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
    };
  }, [isRunning, position, performStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
      if (arrowFadeTimerRef.current) clearTimeout(arrowFadeTimerRef.current);
    };
  }, []);

  // ----- Handlers -----

  const handleStep = () => {
    performStep();
  };

  const handleRun = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPosition(STARTING_POSITION);
    setPath([STARTING_POSITION]);
    setArrowState(null);
    stepCountRef.current = 0;
  };

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      {/* Heatmap + overlay */}
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[540px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <HeatmapGrid cells={cells} />
          <MinimumGlow />
          <DescentTrail path={path} />

          {arrowState && (
            <GradientArrow
              fromX={arrowState.fromX}
              fromY={arrowState.fromY}
              gradX={arrowState.gradX}
              gradY={arrowState.gradY}
              opacity={arrowState.opacity}
            />
          )}

          <CurrentPositionDot x={position[0]} y={position[1]} />
          <AxisLabels />
        </svg>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-col items-center gap-4">
        {/* Loss readout */}
        <div
          className="text-xs text-white/50"
          style={{ fontFamily: FONT_MONO }}
        >
          Loss: {currentLoss.toFixed(4)}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <ControlButton onClick={handleStep} disabled={isRunning}>
            Step
          </ControlButton>
          <ControlButton onClick={handleRun} disabled={isRunning}>
            Run
          </ControlButton>
          <ControlButton onClick={handleReset}>Reset</ControlButton>
        </div>

        {/* Learning rate slider */}
        <div className="flex items-center gap-3">
          <label
            className="text-xs text-white/50"
            style={{ fontFamily: FONT_MONO }}
          >
            Learning rate: {learningRate.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            disabled={isRunning}
            className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#4ade80] disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}
