"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const BLUE = "rgba(100,180,255,0.7)";
const YELLOW = "rgba(234,179,8,0.7)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 280;

const MARGIN = { top: 18, right: 16, bottom: 38, left: 46 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// Domain: x = probability [0.01, 1.0], y = loss [0, 5]
const P_MIN = 0.01;
const P_MAX = 1.0;
const LOSS_MIN = 0;
const LOSS_MAX = 5;

const SAMPLE_COUNT = 200;

// ---------------------------------------------------------------------------
// Loss functions
// ---------------------------------------------------------------------------

function crossEntropyLoss(p: number): number {
  return -Math.log(Math.max(p, 1e-10));
}

function mseLoss(p: number): number {
  return (1 - p) ** 2;
}

function maeLoss(p: number): number {
  return 1 - p;
}

interface LossCurve {
  name: string;
  fn: (p: number) => number;
  color: string;
  label: string;
}

const CURVES: LossCurve[] = [
  { name: "Cross-Entropy", fn: crossEntropyLoss, color: ACCENT, label: "Cross-Entropy" },
  { name: "MSE", fn: mseLoss, color: BLUE, label: "MSE (1-p)\u00B2" },
  { name: "MAE", fn: maeLoss, color: YELLOW, label: "MAE |1-p|" },
];

// ---------------------------------------------------------------------------
// Coordinate mapping
// ---------------------------------------------------------------------------

function toSvgX(p: number): number {
  const fraction = (p - P_MIN) / (P_MAX - P_MIN);
  return PLOT_LEFT + fraction * PLOT_WIDTH;
}

function toSvgY(loss: number): number {
  const fraction = (loss - LOSS_MIN) / (LOSS_MAX - LOSS_MIN);
  return PLOT_BOTTOM - fraction * PLOT_HEIGHT;
}

function fromSvgX(svgX: number): number {
  const fraction = (svgX - PLOT_LEFT) / PLOT_WIDTH;
  return P_MIN + fraction * (P_MAX - P_MIN);
}

// ---------------------------------------------------------------------------
// Axis ticks
// ---------------------------------------------------------------------------

const X_TICKS = [0.01, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0];
const Y_TICKS = [0, 1, 2, 3, 4, 5];

// ---------------------------------------------------------------------------
// Generate curve path data
// ---------------------------------------------------------------------------

function generateCurvePath(lossFn: (p: number) => number): string {
  const segments: string[] = [];

  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const p = P_MIN + (i / SAMPLE_COUNT) * (P_MAX - P_MIN);
    const loss = lossFn(p);
    const clampedLoss = Math.min(loss, LOSS_MAX + 0.5);
    const x = toSvgX(p);
    const y = toSvgY(clampedLoss);

    segments.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }

  return segments.join(" ");
}

function generateFillPath(lossFn: (p: number) => number): string {
  const segments: string[] = [];

  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const p = P_MIN + (i / SAMPLE_COUNT) * (P_MAX - P_MIN);
    const loss = lossFn(p);
    const clampedLoss = Math.min(loss, LOSS_MAX + 0.5);
    const x = toSvgX(p);
    const y = toSvgY(clampedLoss);

    segments.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }

  const lastX = toSvgX(P_MAX);
  const firstX = toSvgX(P_MIN);
  segments.push(`L${lastX},${PLOT_BOTTOM}`);
  segments.push(`L${firstX},${PLOT_BOTTOM}`);
  segments.push("Z");

  return segments.join(" ");
}

// ---------------------------------------------------------------------------
// Annotation data
// ---------------------------------------------------------------------------

interface Annotation {
  p: number;
  lines: { label: string; value: string; color: string }[];
  anchorSide: "left" | "right";
}

const ANNOTATIONS: Annotation[] = [
  {
    p: 0.01,
    lines: [
      { label: "CE", value: "4.61", color: ACCENT },
      { label: "MSE", value: "0.98", color: BLUE },
      { label: "MAE", value: "0.99", color: YELLOW },
    ],
    anchorSide: "right",
  },
  {
    p: 0.9,
    lines: [
      { label: "CE", value: "0.11", color: ACCENT },
      { label: "MSE", value: "0.01", color: BLUE },
      { label: "MAE", value: "0.10", color: YELLOW },
    ],
    anchorSide: "left",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Defs() {
  return (
    <defs>
      <clipPath id="loss-chart-clip">
        <rect
          x={PLOT_LEFT}
          y={PLOT_TOP}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
        />
      </clipPath>
      <marker
        id="loss-arrow-x"
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
      >
        <path d="M0,0 L6,3 L0,6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      </marker>
      <marker
        id="loss-arrow-y"
        markerWidth="6"
        markerHeight="6"
        refX="3"
        refY="1"
        orient="auto"
      >
        <path d="M0,6 L3,0 L6,6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      </marker>
    </defs>
  );
}

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
      {/* X axis with arrowhead */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_RIGHT + 6}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        markerEnd="url(#loss-arrow-x)"
      />
      {/* Y axis with arrowhead */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_LEFT}
        y2={PLOT_TOP - 6}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        markerEnd="url(#loss-arrow-y)"
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
          {tick === 0.01 ? ".01" : tick.toFixed(1)}
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
        p (predicted probability for correct class)
      </text>

      {/* Y-axis tick labels */}
      {Y_TICKS.map((tick) => (
        <text
          key={tick}
          x={PLOT_LEFT - 8}
          y={toSvgY(tick) + 3}
          textAnchor="end"
          fill="rgba(255,255,255,0.35)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          {tick}
        </text>
      ))}

      {/* Y-axis label */}
      <text
        x={10}
        y={PLOT_TOP + PLOT_HEIGHT / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, 10, ${PLOT_TOP + PLOT_HEIGHT / 2})`}
      >
        loss
      </text>
    </g>
  );
}

function CurvePaths() {
  const paths = useMemo(
    () =>
      CURVES.map((curve) => ({
        curve: generateCurvePath(curve.fn),
        fill: curve.name === "Cross-Entropy" ? generateFillPath(curve.fn) : null,
        color: curve.color,
        name: curve.name,
      })),
    [],
  );

  return (
    <g clipPath="url(#loss-chart-clip)">
      {/* Subtle fill under cross-entropy curve */}
      {paths.map(
        ({ fill, name }) =>
          fill && (
            <path
              key={`fill-${name}`}
              d={fill}
              fill="rgba(74,222,128,0.05)"
            />
          ),
      )}

      {/* Curve strokes */}
      {paths.map(({ curve, color, name }) => (
        <path
          key={`line-${name}`}
          d={curve}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function AnnotationCallouts() {
  return (
    <g>
      {ANNOTATIONS.map((annotation) => {
        const anchorX = toSvgX(annotation.p);
        // Position the callout box relative to the anchor point
        const boxWidth = 80;
        const boxHeight = 10 + annotation.lines.length * 12;
        const boxPadding = 6;
        const offsetX = annotation.anchorSide === "right" ? 12 : -(boxWidth + 12);
        const boxX = anchorX + offsetX;

        // Place the box vertically near the highest loss value at this p
        const highestLoss = Math.min(crossEntropyLoss(annotation.p), LOSS_MAX);
        const boxY = toSvgY(highestLoss) - boxHeight / 2;

        // Connector line
        const connectorStartX =
          annotation.anchorSide === "right" ? anchorX + 2 : anchorX - 2;
        const connectorEndX =
          annotation.anchorSide === "right" ? boxX : boxX + boxWidth;

        return (
          <g key={annotation.p}>
            {/* Dashed vertical line through annotation point */}
            <line
              x1={anchorX}
              y1={PLOT_TOP}
              x2={anchorX}
              y2={PLOT_BOTTOM}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Dots on each curve */}
            {CURVES.map((curve) => {
              const loss = curve.fn(annotation.p);
              if (loss > LOSS_MAX) return null;
              return (
                <circle
                  key={`${annotation.p}-${curve.name}`}
                  cx={anchorX}
                  cy={toSvgY(loss)}
                  r={3}
                  fill={curve.color}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Connector line */}
            <line
              x1={connectorStartX}
              y1={boxY + boxHeight / 2}
              x2={connectorEndX}
              y2={boxY + boxHeight / 2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />

            {/* Callout box background */}
            <rect
              x={boxX}
              y={boxY}
              width={boxWidth}
              height={boxHeight}
              rx={3}
              fill="rgba(0,0,0,0.75)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.5}
            />

            {/* Callout text */}
            {annotation.lines.map((line, i) => (
              <text
                key={i}
                x={boxX + boxPadding}
                y={boxY + boxPadding + 6 + i * 12}
                fill={line.color}
                fontSize={7.5}
                fontFamily={FONT_MONO}
              >
                {line.label}: {line.value}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

function Legend() {
  const legendX = PLOT_RIGHT - 100;
  const legendY = PLOT_TOP + 6;

  return (
    <g>
      {CURVES.map((curve, i) => (
        <g key={curve.name}>
          <line
            x1={legendX}
            y1={legendY + i * 14}
            x2={legendX + 14}
            y2={legendY + i * 14}
            stroke={curve.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <text
            x={legendX + 20}
            y={legendY + i * 14 + 3.5}
            fill="rgba(255,255,255,0.5)"
            fontSize={7.5}
            fontFamily={FONT_MONO}
          >
            {curve.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function Crosshair({ svgX }: { svgX: number }) {
  const p = fromSvgX(svgX);
  const clampedP = Math.max(P_MIN, Math.min(P_MAX, p));

  const values = CURVES.map((curve) => ({
    name: curve.name,
    loss: curve.fn(clampedP),
    color: curve.color,
  }));

  // Tooltip text
  const tooltipParts = [
    `p=${clampedP.toFixed(2)}`,
    ...values.map((v) => `${v.name}: ${v.loss.toFixed(2)}`),
  ];
  const tooltipText = tooltipParts.join("  ");

  const tooltipCharWidth = 4.4;
  const tooltipPaddingH = 8;
  const tooltipWidth = tooltipText.length * tooltipCharWidth + tooltipPaddingH * 2;
  const tooltipHeight = 20;
  const tooltipGap = 8;

  // Position tooltip: prefer right of crosshair, flip if near edge
  const tooltipX =
    svgX + tooltipGap + tooltipWidth > PLOT_RIGHT
      ? svgX - tooltipGap - tooltipWidth
      : svgX + tooltipGap;
  const tooltipY = PLOT_TOP + 4;

  return (
    <g>
      {/* Vertical crosshair line */}
      <line
        x1={svgX}
        y1={PLOT_TOP}
        x2={svgX}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {/* Subtle highlighted area between cross-entropy and MAE */}
      {(() => {
        const ceLoss = Math.min(crossEntropyLoss(clampedP), LOSS_MAX);
        const maeLossVal = maeLoss(clampedP);
        const topY = toSvgY(ceLoss);
        const bottomY = toSvgY(maeLossVal);
        const bandWidth = 12;

        return (
          <rect
            x={svgX - bandWidth / 2}
            y={topY}
            width={bandWidth}
            height={Math.max(0, bottomY - topY)}
            fill="rgba(255,255,255,0.03)"
            rx={2}
          />
        );
      })()}

      {/* Dots on each curve */}
      {values.map((v) => {
        const y = toSvgY(Math.min(v.loss, LOSS_MAX));
        if (y < PLOT_TOP || y > PLOT_BOTTOM) return null;
        return (
          <circle
            key={v.name}
            cx={svgX}
            cy={y}
            r={4}
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
        x={tooltipX + tooltipPaddingH}
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

export default function LossFunctionComparison() {
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
          <Defs />
          <GridLines />
          <Axes />
          <CurvePaths />
          <AnnotationCallouts />
          <Legend />
          {hoverX !== null && <Crosshair svgX={hoverX} />}
        </svg>
      </div>
    </div>
  );
}
