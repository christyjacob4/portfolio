"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 250;

const MARGIN = { top: 20, right: 16, bottom: 40, left: 52 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Schedule definitions
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 10000;
const MAX_LR = 0.001;
const WARMUP_STEPS = 1000;
const STEP_DECAY_POINTS = [3000, 7000];
const STEP_DECAY_FACTOR = 0.5;

interface Schedule {
  name: string;
  label: string;
  color: string;
  strokeWidth: number;
  compute: (step: number) => number;
}

const SCHEDULES: Schedule[] = [
  {
    name: "constant",
    label: "Constant",
    color: "rgba(255,255,255,0.5)",
    strokeWidth: 1.5,
    compute: () => MAX_LR,
  },
  {
    name: "step",
    label: "Step decay",
    color: "rgba(234,179,8,0.7)",
    strokeWidth: 1.5,
    compute: (step: number) => {
      let lr = MAX_LR;
      for (const boundary of STEP_DECAY_POINTS) {
        if (step >= boundary) lr *= STEP_DECAY_FACTOR;
      }
      return lr;
    },
  },
  {
    name: "cosine",
    label: "Cosine decay",
    color: "rgba(100,180,255,0.7)",
    strokeWidth: 1.5,
    compute: (step: number) =>
      MAX_LR * 0.5 * (1 + Math.cos(Math.PI * step / TOTAL_STEPS)),
  },
  {
    name: "warmup_cosine",
    label: "Warmup+Cos",
    color: ACCENT,
    strokeWidth: 2.5,
    compute: (step: number) => {
      if (step < WARMUP_STEPS) {
        return MAX_LR * (step / WARMUP_STEPS);
      }
      const decaySteps = TOTAL_STEPS - WARMUP_STEPS;
      const decayProgress = (step - WARMUP_STEPS) / decaySteps;
      return MAX_LR * 0.5 * (1 + Math.cos(Math.PI * decayProgress));
    },
  },
];

// ---------------------------------------------------------------------------
// Axis configuration
// ---------------------------------------------------------------------------

const X_TICKS = [0, 2000, 4000, 6000, 8000, 10000];
const Y_TICKS = [0, 0.0002, 0.0004, 0.0006, 0.0008, 0.001];

// ---------------------------------------------------------------------------
// Coordinate mapping
// ---------------------------------------------------------------------------

function toSvgX(step: number): number {
  return PLOT_LEFT + (step / TOTAL_STEPS) * PLOT_WIDTH;
}

function toSvgY(lr: number): number {
  return PLOT_BOTTOM - (lr / MAX_LR) * PLOT_HEIGHT;
}

function fromSvgX(svgX: number): number {
  const fraction = (svgX - PLOT_LEFT) / PLOT_WIDTH;
  return Math.round(fraction * TOTAL_STEPS);
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatLR(lr: number): string {
  if (lr === 0) return "0";
  if (lr >= 0.001) return "1e-3";
  if (lr >= 0.0001) return `${(lr * 10000).toFixed(1)}e-4`;
  return lr.toExponential(1);
}

function formatStep(step: number): string {
  if (step >= 1000) {
    const k = step / 1000;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(step);
}

function formatYTickLabel(lr: number): string {
  if (lr === 0) return "0";
  if (lr === 0.001) return "1e-3";
  return `${(lr * 10000).toFixed(0)}e-4`;
}

// ---------------------------------------------------------------------------
// Generate polyline sample points
// ---------------------------------------------------------------------------

const SAMPLE_COUNT = 250;

function generateSchedulePoints(
  schedule: Schedule,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const step = (i / SAMPLE_COUNT) * TOTAL_STEPS;
    const lr = schedule.compute(step);
    points.push({ x: toSvgX(step), y: toSvgY(lr) });
  }
  return points;
}

function pointsToPolylineString(
  points: { x: number; y: number }[],
): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GridLines() {
  return (
    <g>
      {Y_TICKS.map((tick) => {
        const y = toSvgY(tick);
        return (
          <line
            key={`h-${tick}`}
            x1={PLOT_LEFT}
            y1={y}
            x2={PLOT_RIGHT}
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        );
      })}
      {X_TICKS.map((tick) => {
        const x = toSvgX(tick);
        return (
          <line
            key={`v-${tick}`}
            x1={x}
            y1={PLOT_TOP}
            x2={x}
            y2={PLOT_BOTTOM}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
}

function Axes() {
  return (
    <g>
      {/* X axis with arrow */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_RIGHT}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      <polygon
        points={`${PLOT_RIGHT},${PLOT_BOTTOM} ${PLOT_RIGHT - 5},${PLOT_BOTTOM - 3} ${PLOT_RIGHT - 5},${PLOT_BOTTOM + 3}`}
        fill="rgba(255,255,255,0.12)"
      />

      {/* Y axis with arrow */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={PLOT_LEFT}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      <polygon
        points={`${PLOT_LEFT},${PLOT_TOP} ${PLOT_LEFT - 3},${PLOT_TOP + 5} ${PLOT_LEFT + 3},${PLOT_TOP + 5}`}
        fill="rgba(255,255,255,0.12)"
      />

      {/* X-axis tick labels */}
      {X_TICKS.map((tick) => (
        <text
          key={tick}
          x={toSvgX(tick)}
          y={PLOT_BOTTOM + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          {formatStep(tick)}
        </text>
      ))}

      {/* X-axis label */}
      <text
        x={PLOT_LEFT + PLOT_WIDTH / 2}
        y={PLOT_BOTTOM + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        training step
      </text>

      {/* Y-axis tick labels */}
      {Y_TICKS.map((tick) => (
        <text
          key={tick}
          x={PLOT_LEFT - 6}
          y={toSvgY(tick) + 3}
          textAnchor="end"
          fill="rgba(255,255,255,0.35)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          {formatYTickLabel(tick)}
        </text>
      ))}

      {/* Y-axis label */}
      <text
        x={12}
        y={PLOT_TOP + PLOT_HEIGHT / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, 12, ${PLOT_TOP + PLOT_HEIGHT / 2})`}
      >
        learning rate
      </text>
    </g>
  );
}

function ScheduleLines() {
  const allPoints = useMemo(
    () => SCHEDULES.map((schedule) => generateSchedulePoints(schedule)),
    [],
  );

  return (
    <g>
      {SCHEDULES.map((schedule, i) => (
        <polyline
          key={schedule.name}
          points={pointsToPolylineString(allPoints[i])}
          fill="none"
          stroke={schedule.color}
          strokeWidth={schedule.strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function Annotations() {
  const warmupStartX = toSvgX(0);
  const warmupEndX = toSvgX(WARMUP_STEPS);
  const warmupMidX = (warmupStartX + warmupEndX) / 2;
  const bracketY = PLOT_BOTTOM - 12;
  const bracketTickHeight = 4;

  const cosineStartX = toSvgX(WARMUP_STEPS);
  const cosineEndX = toSvgX(TOTAL_STEPS);
  const cosineMidX = (cosineStartX + cosineEndX) / 2;

  return (
    <g>
      {/* Warmup bracket */}
      <line
        x1={warmupStartX + 2}
        y1={bracketY}
        x2={warmupEndX - 2}
        y2={bracketY}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      <line
        x1={warmupStartX + 2}
        y1={bracketY - bracketTickHeight}
        x2={warmupStartX + 2}
        y2={bracketY + bracketTickHeight}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      <line
        x1={warmupEndX - 2}
        y1={bracketY - bracketTickHeight}
        x2={warmupEndX - 2}
        y2={bracketY + bracketTickHeight}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      <text
        x={warmupMidX}
        y={bracketY - 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={7}
        fontFamily={FONT_MONO}
      >
        warmup
      </text>

      {/* Cosine decay label */}
      <text
        x={cosineMidX}
        y={bracketY - 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={7}
        fontFamily={FONT_MONO}
      >
        cosine decay
      </text>
    </g>
  );
}

function Legend() {
  const legendX = PLOT_RIGHT - 110;
  const legendY = PLOT_TOP + 10;

  return (
    <g>
      {SCHEDULES.map((schedule, i) => (
        <g key={schedule.name}>
          <line
            x1={legendX}
            y1={legendY + i * 14}
            x2={legendX + 14}
            y2={legendY + i * 14}
            stroke={schedule.color}
            strokeWidth={schedule.strokeWidth}
            strokeLinecap="round"
          />
          <text
            x={legendX + 20}
            y={legendY + i * 14 + 3.5}
            fill="rgba(255,255,255,0.5)"
            fontSize={8}
            fontFamily={FONT_MONO}
          >
            {schedule.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function Crosshair({ svgX }: { svgX: number }) {
  const step = Math.max(0, Math.min(TOTAL_STEPS, fromSvgX(svgX)));
  const clampedX = toSvgX(step);

  const values = SCHEDULES.map((schedule) => ({
    name: schedule.label,
    lr: schedule.compute(step),
    color: schedule.color,
  }));

  const tooltipSegments = [
    `Step: ${formatStep(step)}`,
    ...values.map((v) => `${v.name}: ${formatLR(v.lr)}`),
  ];
  const tooltipText = tooltipSegments.join(" | ");

  const tooltipCharWidth = 4.6;
  const tooltipPadding = 8;
  const tooltipWidth = tooltipText.length * tooltipCharWidth + tooltipPadding * 2;
  const tooltipHeight = 20;
  const tooltipGap = 10;

  const tooltipX =
    clampedX + tooltipGap + tooltipWidth > PLOT_RIGHT
      ? clampedX - tooltipGap - tooltipWidth
      : clampedX + tooltipGap;
  const tooltipY = PLOT_TOP + 4;

  return (
    <g>
      {/* Vertical crosshair */}
      <line
        x1={clampedX}
        y1={PLOT_TOP}
        x2={clampedX}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {/* Horizontal crosshair at each schedule value */}
      {values.map((v, i) => {
        const y = toSvgY(v.lr);
        if (y < PLOT_TOP || y > PLOT_BOTTOM) return null;
        return (
          <line
            key={`h-${i}`}
            x1={PLOT_LEFT}
            y1={y}
            x2={PLOT_RIGHT}
            y2={y}
            stroke={v.color.replace(/[\d.]+\)$/, "0.08)")}
            strokeWidth={1}
          />
        );
      })}

      {/* Dots on each schedule line */}
      {values.map((v, i) => {
        const y = toSvgY(v.lr);
        if (y < PLOT_TOP || y > PLOT_BOTTOM) return null;
        return (
          <circle
            key={i}
            cx={clampedX}
            cy={y}
            r={3.5}
            fill={v.color}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={1}
          />
        );
      })}

      {/* Tooltip background */}
      <rect
        x={tooltipX}
        y={tooltipY}
        width={tooltipWidth}
        height={tooltipHeight}
        rx={4}
        fill="rgba(0,0,0,0.85)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
      />

      {/* Tooltip text */}
      <text
        x={tooltipX + tooltipPadding}
        y={tooltipY + tooltipHeight / 2 + 3}
        fill="rgba(255,255,255,0.75)"
        fontSize={7.5}
        fontFamily={FONT_MONO}
      >
        {tooltipText}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LRScheduleChart() {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const svgX = (e.clientX - rect.left) * scaleX;

      if (svgX >= PLOT_LEFT && svgX <= PLOT_RIGHT) {
        setHoverX(svgX);
      } else {
        setHoverX(null);
      }
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
  }, []);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: "crosshair" }}
        >
          <defs>
            <clipPath id="lr-schedule-clip">
              <rect
                x={PLOT_LEFT}
                y={PLOT_TOP}
                width={PLOT_WIDTH}
                height={PLOT_HEIGHT}
              />
            </clipPath>
          </defs>

          <GridLines />
          <Axes />

          <g clipPath="url(#lr-schedule-clip)">
            <ScheduleLines />
            <Annotations />
          </g>

          <Legend />

          {hoverX !== null && <Crosshair svgX={hoverX} />}
        </svg>
      </div>
    </div>
  );
}
