"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const NAIVE_COLOR = "rgba(239,68,68,0.7)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 550;
const SVG_HEIGHT = 300;

const MARGIN = { top: 20, right: 16, bottom: 44, left: 56 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

const NUM_HEADS = 12;
const HEAD_DIM = 64;
const GPU_LIMIT_MB = 16 * 1024; // 16 GB in MB

// ---------------------------------------------------------------------------
// Sequence lengths and axis config
// ---------------------------------------------------------------------------

const SEQ_LENGTHS = [512, 1024, 2048, 4096, 8192, 16384, 32768];

const SEQ_LABELS: Record<number, string> = {
  512: "512",
  1024: "1K",
  2048: "2K",
  4096: "4K",
  8192: "8K",
  16384: "16K",
  32768: "32K",
};

// ---------------------------------------------------------------------------
// Memory formulas
// ---------------------------------------------------------------------------

function naiveMemoryMB(seqLen: number): number {
  // N x N attention matrix in fp16 per head, times num_heads
  return (seqLen * seqLen * 2 * NUM_HEADS) / (1024 * 1024);
}

function flashMemoryMB(seqLen: number): number {
  // O(N) tiles in SRAM: 2 * N * head_dim * 2 bytes per head, times num_heads
  return (2 * seqLen * HEAD_DIM * 2 * NUM_HEADS) / (1024 * 1024);
}

// ---------------------------------------------------------------------------
// Y-axis: compute scale from data
// ---------------------------------------------------------------------------

const NAIVE_MAX_MB = naiveMemoryMB(SEQ_LENGTHS[SEQ_LENGTHS.length - 1]);
const Y_MAX = Math.ceil(NAIVE_MAX_MB / 4096) * 4096; // round up to nearest 4096 MB

function generateYTicks(): number[] {
  const tickCount = 5;
  const step = Y_MAX / tickCount;
  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(Math.round(i * step));
  }
  return ticks;
}

const Y_TICKS = generateYTicks();

// ---------------------------------------------------------------------------
// Coordinate mapping (log scale on X, linear on Y)
// ---------------------------------------------------------------------------

const LOG_SEQ_MIN = Math.log2(SEQ_LENGTHS[0]);
const LOG_SEQ_MAX = Math.log2(SEQ_LENGTHS[SEQ_LENGTHS.length - 1]);
const LOG_SEQ_RANGE = LOG_SEQ_MAX - LOG_SEQ_MIN;

function toSvgX(seqLen: number): number {
  const fraction = (Math.log2(seqLen) - LOG_SEQ_MIN) / LOG_SEQ_RANGE;
  return PLOT_LEFT + fraction * PLOT_WIDTH;
}

function toSvgY(memoryMB: number): number {
  const fraction = memoryMB / Y_MAX;
  return PLOT_BOTTOM - fraction * PLOT_HEIGHT;
}

function fromSvgX(svgX: number): number {
  const fraction = (svgX - PLOT_LEFT) / PLOT_WIDTH;
  const logValue = LOG_SEQ_MIN + fraction * LOG_SEQ_RANGE;
  return Math.pow(2, logValue);
}

// ---------------------------------------------------------------------------
// Snap to nearest discrete sequence length
// ---------------------------------------------------------------------------

function snapToNearestSeqLen(rawSeqLen: number): number {
  let closest = SEQ_LENGTHS[0];
  let closestLogDist = Math.abs(Math.log2(rawSeqLen) - Math.log2(closest));
  for (const seq of SEQ_LENGTHS) {
    const dist = Math.abs(Math.log2(rawSeqLen) - Math.log2(seq));
    if (dist < closestLogDist) {
      closest = seq;
      closestLogDist = dist;
    }
  }
  return closest;
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatMemoryMB(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return gb >= 10 ? `${gb.toFixed(0)} GB` : `${gb.toFixed(1)} GB`;
  }
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${mb.toFixed(2)} MB`;
}

function formatCompactMB(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return gb >= 10 ? `${gb.toFixed(0)}GB` : `${gb.toFixed(1)}GB`;
  }
  return `${Math.round(mb)}MB`;
}

// ---------------------------------------------------------------------------
// Generate smooth polyline sample points
// ---------------------------------------------------------------------------

const SAMPLE_COUNT = 100;

function generateCurvePoints(
  memoryFn: (seqLen: number) => number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const logSeq = LOG_SEQ_MIN + (i / SAMPLE_COUNT) * LOG_SEQ_RANGE;
    const seqLen = Math.pow(2, logSeq);
    const mem = memoryFn(seqLen);
    points.push({ x: toSvgX(seqLen), y: toSvgY(mem) });
  }
  return points;
}

function pointsToPolyline(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

function pointsToFillPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  const lineSegments = points.map((p) => `L${p.x},${p.y}`).join(" ");
  return `M${first.x},${PLOT_BOTTOM} ${lineSegments} L${last.x},${PLOT_BOTTOM} Z`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GradientDefs() {
  return (
    <defs>
      <clipPath id="memory-chart-clip">
        <rect
          x={PLOT_LEFT}
          y={PLOT_TOP}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
        />
      </clipPath>
      <linearGradient id="naive-fill-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(239,68,68,0.15)" />
        <stop offset="100%" stopColor="rgba(239,68,68,0.02)" />
      </linearGradient>
      <linearGradient id="flash-fill-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(74,222,128,0.15)" />
        <stop offset="100%" stopColor="rgba(74,222,128,0.02)" />
      </linearGradient>
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
      {SEQ_LENGTHS.map((seq) => {
        const x = toSvgX(seq);
        return (
          <line
            key={`v-${seq}`}
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
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_RIGHT}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      <line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={PLOT_LEFT}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />

      {SEQ_LENGTHS.map((seq) => (
        <text
          key={seq}
          x={toSvgX(seq)}
          y={PLOT_BOTTOM + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          {SEQ_LABELS[seq]}
        </text>
      ))}

      <text
        x={PLOT_LEFT + PLOT_WIDTH / 2}
        y={PLOT_BOTTOM + 34}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        sequence length
      </text>

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
          {formatCompactMB(tick)}
        </text>
      ))}

      <text
        x={14}
        y={PLOT_TOP + PLOT_HEIGHT / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, 14, ${PLOT_TOP + PLOT_HEIGHT / 2})`}
      >
        peak memory (MB)
      </text>
    </g>
  );
}

function GpuLimitLine() {
  const y = toSvgY(GPU_LIMIT_MB);
  const isVisible = y >= PLOT_TOP && y <= PLOT_BOTTOM;
  if (!isVisible) return null;

  return (
    <g>
      {/* Red zone above GPU limit */}
      <rect
        x={PLOT_LEFT}
        y={PLOT_TOP}
        width={PLOT_WIDTH}
        height={Math.max(0, y - PLOT_TOP)}
        fill="rgba(239,68,68,0.03)"
      />
      <line
        x1={PLOT_LEFT}
        y1={y}
        x2={PLOT_RIGHT}
        y2={y}
        stroke="rgba(239,68,68,0.4)"
        strokeWidth={1}
        strokeDasharray="6 3"
      />
      <text
        x={PLOT_RIGHT - 4}
        y={y - 5}
        textAnchor="end"
        fill="rgba(239,68,68,0.6)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        16 GB GPU limit
      </text>
    </g>
  );
}

function DataLines() {
  const naivePoints = useMemo(() => generateCurvePoints(naiveMemoryMB), []);
  const flashPoints = useMemo(() => generateCurvePoints(flashMemoryMB), []);

  const clippedNaivePoints = useMemo(
    () => naivePoints.filter((p) => p.y >= PLOT_TOP),
    [naivePoints],
  );

  return (
    <g clipPath="url(#memory-chart-clip)">
      {/* Fill under naive line */}
      <path d={pointsToFillPath(naivePoints)} fill="url(#naive-fill-gradient)" />

      {/* Fill under flash line */}
      <path d={pointsToFillPath(flashPoints)} fill="url(#flash-fill-gradient)" />

      {/* Naive attention line */}
      <polyline
        points={pointsToPolyline(clippedNaivePoints)}
        fill="none"
        stroke={NAIVE_COLOR}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Flash attention line */}
      <polyline
        points={pointsToPolyline(flashPoints)}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

function OomAnnotation() {
  // Find the rightmost sequence length where naive exceeds GPU memory
  const lastSeq = SEQ_LENGTHS[SEQ_LENGTHS.length - 1];
  const naiveMem = naiveMemoryMB(lastSeq);

  if (naiveMem <= GPU_LIMIT_MB) return null;

  const x = toSvgX(lastSeq);
  const lineY = toSvgY(naiveMem);
  // Place the annotation at the GPU limit level since the line is clipped above
  const annotationY = Math.max(lineY, PLOT_TOP + 14);

  return (
    <g>
      <text
        x={x + 2}
        y={annotationY}
        textAnchor="middle"
        fill="rgba(239,68,68,0.9)"
        fontSize={11}
        fontFamily={FONT_MONO}
        fontWeight="bold"
      >
        OOM!
      </text>
    </g>
  );
}

function Legend() {
  const legendX = PLOT_LEFT + 10;
  const legendY = PLOT_TOP + 12;

  return (
    <g>
      {/* Naive */}
      <line
        x1={legendX}
        y1={legendY}
        x2={legendX + 16}
        y2={legendY}
        stroke={NAIVE_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text
        x={legendX + 22}
        y={legendY + 3.5}
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        {"Naive O(N\u00B2)"}
      </text>

      {/* Flash */}
      <line
        x1={legendX}
        y1={legendY + 16}
        x2={legendX + 16}
        y2={legendY + 16}
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text
        x={legendX + 22}
        y={legendY + 16 + 3.5}
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        Flash O(N)
      </text>
    </g>
  );
}

function Crosshair({ svgX }: { svgX: number }) {
  const rawSeqLen = fromSvgX(svgX);
  const seqLen = snapToNearestSeqLen(rawSeqLen);
  const snappedX = toSvgX(seqLen);

  const naiveMem = naiveMemoryMB(seqLen);
  const flashMem = flashMemoryMB(seqLen);

  const naiveY = toSvgY(naiveMem);
  const flashY = toSvgY(flashMem);

  const seqLabel = SEQ_LABELS[seqLen] ?? String(seqLen);
  const tooltipText = `Seq: ${seqLabel} | Naive: ${formatMemoryMB(naiveMem)} | Flash: ${formatMemoryMB(flashMem)}`;

  const tooltipCharWidth = 5;
  const tooltipPadding = 10;
  const tooltipWidth = tooltipText.length * tooltipCharWidth + tooltipPadding * 2;
  const tooltipHeight = 22;
  const tooltipGap = 10;

  // Position tooltip: prefer right of crosshair, flip if near edge
  const tooltipX =
    snappedX + tooltipGap + tooltipWidth > PLOT_RIGHT
      ? snappedX - tooltipGap - tooltipWidth
      : snappedX + tooltipGap;
  const tooltipY = PLOT_TOP + 6;

  const naiveVisible = naiveY >= PLOT_TOP && naiveY <= PLOT_BOTTOM;
  const flashVisible = flashY >= PLOT_TOP && flashY <= PLOT_BOTTOM;

  return (
    <g>
      {/* Vertical crosshair */}
      <line
        x1={snappedX}
        y1={PLOT_TOP}
        x2={snappedX}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {/* Horizontal crosshairs at data points */}
      {naiveVisible && (
        <line
          x1={PLOT_LEFT}
          y1={naiveY}
          x2={PLOT_RIGHT}
          y2={naiveY}
          stroke="rgba(239,68,68,0.12)"
          strokeWidth={1}
        />
      )}
      {flashVisible && (
        <line
          x1={PLOT_LEFT}
          y1={flashY}
          x2={PLOT_RIGHT}
          y2={flashY}
          stroke="rgba(74,222,128,0.12)"
          strokeWidth={1}
        />
      )}

      {/* Dots on each line */}
      {naiveVisible && (
        <circle
          cx={snappedX}
          cy={naiveY}
          r={4}
          fill={NAIVE_COLOR}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={1}
        />
      )}
      {flashVisible && (
        <circle
          cx={snappedX}
          cy={flashY}
          r={4}
          fill={ACCENT}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={1}
        />
      )}

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
        y={tooltipY + tooltipHeight / 2 + 3.5}
        fill="rgba(255,255,255,0.75)"
        fontSize={8}
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

export default function MemoryScalingChart() {
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
          className="w-full max-w-[540px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: "crosshair" }}
        >
          <GradientDefs />
          <GridLines />
          <Axes />
          <GpuLimitLine />
          <DataLines />
          <OomAnnotation />
          <Legend />
          {hoverX !== null && <Crosshair svgX={hoverX} />}
        </svg>
      </div>
    </div>
  );
}
