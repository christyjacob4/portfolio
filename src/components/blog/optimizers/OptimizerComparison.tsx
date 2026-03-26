"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const HEATMAP_WIDTH = 500;
const HEATMAP_HEIGHT = 320;
const LOSS_CHART_HEIGHT = 80;
const LEGEND_HEIGHT = 20;
const SVG_WIDTH = 500;
const SVG_HEIGHT = HEATMAP_HEIGHT + LEGEND_HEIGHT + LOSS_CHART_HEIGHT;

const GRID_SIZE = 40;
const DOMAIN_MIN = -1;
const DOMAIN_MAX = 3;
const DOMAIN_RANGE = DOMAIN_MAX - DOMAIN_MIN;

const STARTING_POINT: [number, number] = [-0.5, 2.5];
const MAX_STEPS = 100;
const STEP_INTERVAL_MS = 50;
const PAUSE_BEFORE_REPLAY_MS = 2000;
const NUMERICAL_H = 0.001;

const LOSS_CHART_TOP = HEATMAP_HEIGHT + LEGEND_HEIGHT;
const LOSS_CHART_PADDING_X = 40;
const LOSS_CHART_PADDING_TOP = 10;
const LOSS_CHART_PADDING_BOTTOM = 16;

// ---------------------------------------------------------------------------
// Optimizer definitions
// ---------------------------------------------------------------------------

interface OptimizerConfig {
  name: string;
  color: string;
}

const OPTIMIZERS: OptimizerConfig[] = [
  { name: "SGD", color: "#ef4444" },
  { name: "Momentum", color: "#eab308" },
  { name: "Adam", color: "#4ade80" },
];

// ---------------------------------------------------------------------------
// Loss function & numerical gradient
// ---------------------------------------------------------------------------

function lossAt(x: number, y: number): number {
  return (x - 1) ** 2 + (y - 1) ** 2 + 0.5 * Math.sin(3 * x) * Math.sin(3 * y);
}

function gradientAt(x: number, y: number): [number, number] {
  const dfdx =
    (lossAt(x + NUMERICAL_H, y) - lossAt(x - NUMERICAL_H, y)) / (2 * NUMERICAL_H);
  const dfdy =
    (lossAt(x, y + NUMERICAL_H) - lossAt(x, y - NUMERICAL_H)) / (2 * NUMERICAL_H);
  return [dfdx, dfdy];
}

// ---------------------------------------------------------------------------
// Path computation for each optimizer
// ---------------------------------------------------------------------------

interface OptimizerPath {
  positions: [number, number][];
  losses: number[];
}

function computeSGDPath(): OptimizerPath {
  const lr = 0.005;
  const positions: [number, number][] = [STARTING_POINT];
  const losses: number[] = [lossAt(STARTING_POINT[0], STARTING_POINT[1])];

  let [x, y] = STARTING_POINT;

  for (let step = 0; step < MAX_STEPS; step++) {
    const [gx, gy] = gradientAt(x, y);
    x = x - lr * gx;
    y = y - lr * gy;
    x = clampToDomain(x);
    y = clampToDomain(y);
    positions.push([x, y]);
    losses.push(lossAt(x, y));
  }

  return { positions, losses };
}

function computeMomentumPath(): OptimizerPath {
  const lr = 0.001;
  const momentum = 0.9;
  const positions: [number, number][] = [STARTING_POINT];
  const losses: number[] = [lossAt(STARTING_POINT[0], STARTING_POINT[1])];

  let [x, y] = STARTING_POINT;
  let vx = 0;
  let vy = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const [gx, gy] = gradientAt(x, y);
    vx = momentum * vx - lr * gx;
    vy = momentum * vy - lr * gy;
    x = x + vx;
    y = y + vy;
    x = clampToDomain(x);
    y = clampToDomain(y);
    positions.push([x, y]);
    losses.push(lossAt(x, y));
  }

  return { positions, losses };
}

function computeAdamPath(): OptimizerPath {
  const lr = 0.05;
  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;
  const positions: [number, number][] = [STARTING_POINT];
  const losses: number[] = [lossAt(STARTING_POINT[0], STARTING_POINT[1])];

  let [x, y] = STARTING_POINT;
  let mx = 0;
  let my = 0;
  let vx = 0;
  let vy = 0;

  for (let step = 1; step <= MAX_STEPS; step++) {
    const [gx, gy] = gradientAt(x, y);

    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;

    const mxHat = mx / (1 - beta1 ** step);
    const myHat = my / (1 - beta1 ** step);
    const vxHat = vx / (1 - beta2 ** step);
    const vyHat = vy / (1 - beta2 ** step);

    x = x - lr * mxHat / (Math.sqrt(vxHat) + eps);
    y = y - lr * myHat / (Math.sqrt(vyHat) + eps);
    x = clampToDomain(x);
    y = clampToDomain(y);
    positions.push([x, y]);
    losses.push(lossAt(x, y));
  }

  return { positions, losses };
}

function clampToDomain(value: number): number {
  return Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, value));
}

// ---------------------------------------------------------------------------
// Determine convergence step (loss below threshold)
// ---------------------------------------------------------------------------

const CONVERGENCE_THRESHOLD = 0.05;

function findConvergenceStep(losses: number[]): number {
  for (let i = 0; i < losses.length; i++) {
    if (losses[i] < CONVERGENCE_THRESHOLD) return i;
  }
  return losses.length - 1;
}

// ---------------------------------------------------------------------------
// Coordinate mapping: data space -> SVG space (heatmap region)
// ---------------------------------------------------------------------------

function toSvgX(dataX: number): number {
  return ((dataX - DOMAIN_MIN) / DOMAIN_RANGE) * HEATMAP_WIDTH;
}

function toSvgY(dataY: number): number {
  // Invert Y so higher data values appear at the top of the heatmap
  return HEATMAP_HEIGHT - ((dataY - DOMAIN_MIN) / DOMAIN_RANGE) * HEATMAP_HEIGHT;
}

// ---------------------------------------------------------------------------
// Heatmap color interpolation
// ---------------------------------------------------------------------------

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

const COLOR_STOPS: { t: number; color: RGBColor }[] = [
  { t: 0.0, color: { r: 15, g: 20, b: 35 } },
  { t: 0.15, color: { r: 20, g: 40, b: 80 } },
  { t: 0.35, color: { r: 50, g: 50, b: 100 } },
  { t: 0.55, color: { r: 140, g: 60, b: 50 } },
  { t: 0.75, color: { r: 200, g: 75, b: 20 } },
  { t: 1.0, color: { r: 232, g: 83, b: 14 } },
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
  const segmentProgress =
    segmentLength === 0 ? 0 : (clamped - lower.t) / segmentLength;

  const r = Math.round(
    lower.color.r + (upper.color.r - lower.color.r) * segmentProgress,
  );
  const g = Math.round(
    lower.color.g + (upper.color.g - lower.color.g) * segmentProgress,
  );
  const b = Math.round(
    lower.color.b + (upper.color.b - lower.color.b) * segmentProgress,
  );

  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// Precomputed heatmap cells
// ---------------------------------------------------------------------------

interface HeatmapCell {
  row: number;
  col: number;
  color: string;
}

function computeHeatmap(): HeatmapCell[] {
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
      const normalized =
        lossRange === 0 ? 0 : (rawValues[row][col] - minLoss) / lossRange;
      cells.push({ row, col, color: interpolateColor(normalized) });
    }
  }

  return cells;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HeatmapGrid({ cells }: { cells: HeatmapCell[] }) {
  const cellWidth = HEATMAP_WIDTH / GRID_SIZE;
  const cellHeight = HEATMAP_HEIGHT / GRID_SIZE;

  return (
    <g>
      {cells.map((cell) => (
        <rect
          key={`${cell.row}-${cell.col}`}
          x={cell.col * cellWidth}
          y={cell.row * cellHeight}
          width={cellWidth + 0.5}
          height={cellHeight + 0.5}
          fill={cell.color}
        />
      ))}
    </g>
  );
}

function MinimumMarker() {
  const cx = toSvgX(1);
  const cy = toSvgY(1);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={14}
      fill="none"
      stroke="rgba(100,180,255,0.15)"
      strokeWidth={3}
      style={{ filter: "blur(4px)" }}
    />
  );
}

function OptimizerTrail({
  positions,
  visibleSteps,
  color,
}: {
  positions: [number, number][];
  visibleSteps: number;
  color: string;
}) {
  const visible = positions.slice(0, visibleSteps + 1);
  if (visible.length < 2) return null;

  const pointsString = visible
    .map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`)
    .join(" ");

  const currentPos = visible[visible.length - 1];

  return (
    <g>
      <polyline
        points={pointsString}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
      <circle
        cx={toSvgX(currentPos[0])}
        cy={toSvgY(currentPos[1])}
        r={4}
        fill={color}
      />
      <circle
        cx={toSvgX(currentPos[0])}
        cy={toSvgY(currentPos[1])}
        r={7}
        fill={color}
        opacity={0.25}
      />
    </g>
  );
}

function LossChart({
  allPaths,
  visibleSteps,
  maxStepsToShow,
}: {
  allPaths: OptimizerPath[];
  visibleSteps: number;
  maxStepsToShow: number;
}) {
  const chartLeft = LOSS_CHART_PADDING_X;
  const chartRight = SVG_WIDTH - 12;
  const chartTop = LOSS_CHART_TOP + LOSS_CHART_PADDING_TOP;
  const chartBottom =
    LOSS_CHART_TOP + LOSS_CHART_HEIGHT - LOSS_CHART_PADDING_BOTTOM;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Find the maximum loss across all paths for Y-axis scaling
  const maxLoss = Math.max(
    ...allPaths.map((p) => Math.max(...p.losses.slice(0, 5))),
  );
  // Use a reasonable ceiling that captures the initial loss clearly
  const yMax = Math.min(maxLoss, 20);

  function toChartX(step: number): number {
    return chartLeft + (step / maxStepsToShow) * chartWidth;
  }

  function toChartY(loss: number): number {
    const clamped = Math.max(0, Math.min(yMax, loss));
    return chartBottom - (clamped / yMax) * chartHeight;
  }

  return (
    <g>
      {/* Axis lines */}
      <line
        x1={chartLeft}
        y1={chartBottom}
        x2={chartRight}
        y2={chartBottom}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      <line
        x1={chartLeft}
        y1={chartTop}
        x2={chartLeft}
        y2={chartBottom}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {/* Y-axis label */}
      <text
        x={chartLeft - 6}
        y={chartTop + 4}
        textAnchor="end"
        fill="rgba(255,255,255,0.5)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        {yMax.toFixed(0)}
      </text>
      <text
        x={chartLeft - 6}
        y={chartBottom + 3}
        textAnchor="end"
        fill="rgba(255,255,255,0.5)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        0
      </text>

      {/* X-axis label */}
      <text
        x={chartRight}
        y={chartBottom + 12}
        textAnchor="end"
        fill="rgba(255,255,255,0.5)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        steps
      </text>

      {/* Loss lines for each optimizer */}
      {allPaths.map((path, idx) => {
        const visible = path.losses.slice(0, visibleSteps + 1);
        if (visible.length < 2) return null;

        const linePoints = visible
          .map((loss, step) => `${toChartX(step)},${toChartY(loss)}`)
          .join(" ");

        return (
          <polyline
            key={idx}
            points={linePoints}
            fill="none"
            stroke={OPTIMIZERS[idx].color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.85}
          />
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OptimizerComparison() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heatmapCells = useMemo(() => computeHeatmap(), []);

  const allPaths = useMemo<OptimizerPath[]>(
    () => [computeSGDPath(), computeMomentumPath(), computeAdamPath()],
    [],
  );

  const convergenceSteps = useMemo(
    () => allPaths.map((p) => findConvergenceStep(p.losses)),
    [allPaths],
  );

  const longestPath = Math.max(...allPaths.map((p) => p.positions.length - 1));

  // Ref tracks the current animation step independently of React render cycles,
  // so the recursive setTimeout chain doesn't need state as a dependency.
  const stepRef = useRef(0);

  useEffect(() => {
    const scheduleNextStep = (currentStep: number): void => {
      if (currentStep >= longestPath) {
        animationRef.current = setTimeout(() => {
          stepRef.current = 0;
          setVisibleSteps(0);
          scheduleNextStep(0);
        }, PAUSE_BEFORE_REPLAY_MS);
        return;
      }

      animationRef.current = setTimeout(() => {
        const nextStep = currentStep + 1;
        stepRef.current = nextStep;
        setVisibleSteps(nextStep);
        scheduleNextStep(nextStep);
      }, STEP_INTERVAL_MS);
    };

    scheduleNextStep(0);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [longestPath]);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="mx-auto max-w-[520px]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ fontFamily: FONT_MONO }}
        >
          {/* Background */}
          <rect
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            fill="hsl(240, 10%, 3.9%)"
            rx={8}
          />

          {/* Heatmap */}
          <g>
            <HeatmapGrid cells={heatmapCells} />
            <MinimumMarker />
          </g>

          {/* Optimizer trails */}
          {allPaths.map((path, idx) => (
            <OptimizerTrail
              key={idx}
              positions={path.positions}
              visibleSteps={visibleSteps}
              color={OPTIMIZERS[idx].color}
            />
          ))}

          {/* Starting point marker */}
          <circle
            cx={toSvgX(STARTING_POINT[0])}
            cy={toSvgY(STARTING_POINT[1])}
            r={3}
            fill="white"
            opacity={0.6}
          />

          {/* Legend row */}
          <g>
            {OPTIMIZERS.map((opt, idx) => {
              const spacing = SVG_WIDTH / 3;
              const cx = spacing * idx + spacing / 2;
              const cy = HEATMAP_HEIGHT + LEGEND_HEIGHT / 2;
              const stepCount = convergenceSteps[idx];
              const label = `${opt.name}: ${stepCount}`;

              return (
                <g key={opt.name}>
                  <circle cx={cx - 30} cy={cy} r={4} fill={opt.color} />
                  <text
                    x={cx - 22}
                    y={cy + 3.5}
                    fill="rgba(255,255,255,0.6)"
                    fontSize={10}
                    fontFamily={FONT_MONO}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Loss-over-steps chart */}
          <LossChart
            allPaths={allPaths}
            visibleSteps={visibleSteps}
            maxStepsToShow={longestPath}
          />
        </svg>
      </div>
    </div>
  );
}
