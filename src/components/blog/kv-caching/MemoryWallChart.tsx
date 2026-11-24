"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 600;
const SVG_HEIGHT = 350;

const MARGIN = { top: 24, right: 20, bottom: 44, left: 54 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Model configurations
// ---------------------------------------------------------------------------

interface ModelConfig {
  name: string;
  layers: number;
  heads: number;
  dHead: number;
  color: string;
}

const MODELS: ModelConfig[] = [
  { name: "7B", layers: 32, heads: 32, dHead: 128, color: "rgba(74,222,128,0.4)" },
  { name: "13B", layers: 40, heads: 40, dHead: 128, color: "rgba(74,222,128,0.6)" },
  { name: "70B", layers: 80, heads: 64, dHead: 128, color: ACCENT },
];

// ---------------------------------------------------------------------------
// GPU reference lines
// ---------------------------------------------------------------------------

interface GpuReference {
  memoryGB: number;
  label: string;
}

const GPU_REFERENCES: GpuReference[] = [
  { memoryGB: 24, label: "RTX 4090" },
  { memoryGB: 40, label: "A100 40GB" },
  { memoryGB: 80, label: "A100 80GB / H100" },
];

// ---------------------------------------------------------------------------
// Axis definitions
// ---------------------------------------------------------------------------

const SEQ_LENGTHS = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];

const SEQ_LABELS: Record<number, string> = {
  512: "512",
  1024: "1K",
  2048: "2K",
  4096: "4K",
  8192: "8K",
  16384: "16K",
  32768: "32K",
  65536: "64K",
  131072: "128K",
};

const Y_MAX = 160;
const Y_TICKS = [0, 20, 40, 60, 80, 100, 120, 140, 160];

// ---------------------------------------------------------------------------
// Memory formula
// ---------------------------------------------------------------------------

function kvCacheMemoryGB(
  layers: number,
  heads: number,
  dHead: number,
  seqLen: number,
  batchSize: number,
): number {
  // 2 (K + V) * layers * heads * d_head * seq_len * batch * 2 bytes (fp16)
  // divided by 1024^3 to get GB
  return (2 * layers * heads * dHead * seqLen * batchSize * 2) / (1024 ** 3);
}

// ---------------------------------------------------------------------------
// Coordinate mapping
// ---------------------------------------------------------------------------

const LOG_SEQ_MIN = Math.log2(SEQ_LENGTHS[0]);
const LOG_SEQ_MAX = Math.log2(SEQ_LENGTHS[SEQ_LENGTHS.length - 1]);
const LOG_SEQ_RANGE = LOG_SEQ_MAX - LOG_SEQ_MIN;

function toSvgX(seqLen: number): number {
  const logValue = Math.log2(seqLen);
  const fraction = (logValue - LOG_SEQ_MIN) / LOG_SEQ_RANGE;
  return PLOT_LEFT + fraction * PLOT_WIDTH;
}

function toSvgY(memoryGB: number): number {
  const fraction = memoryGB / Y_MAX;
  return PLOT_BOTTOM - fraction * PLOT_HEIGHT;
}

function fromSvgX(svgX: number): number {
  const fraction = (svgX - PLOT_LEFT) / PLOT_WIDTH;
  const logValue = LOG_SEQ_MIN + fraction * LOG_SEQ_RANGE;
  return Math.pow(2, logValue);
}

// ---------------------------------------------------------------------------
// Find intersection of a line segment with a horizontal threshold
// ---------------------------------------------------------------------------

function findCrossingSeqLen(
  model: ModelConfig,
  thresholdGB: number,
  batchSize: number,
): number | null {
  // Memory is linear in seqLen, so: threshold = constant * seqLen
  // Solve for seqLen:
  const constantPerToken =
    (2 * model.layers * model.heads * model.dHead * batchSize * 2) / (1024 ** 3);
  if (constantPerToken === 0) return null;
  const crossingSeqLen = thresholdGB / constantPerToken;

  const minSeq = SEQ_LENGTHS[0];
  const maxSeq = SEQ_LENGTHS[SEQ_LENGTHS.length - 1];
  if (crossingSeqLen < minSeq || crossingSeqLen > maxSeq) return null;
  return crossingSeqLen;
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatSeqLen(seqLen: number): string {
  if (seqLen >= 1024) {
    const k = seqLen / 1024;
    return k >= 1 && k === Math.round(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(Math.round(seqLen));
}

function formatMemoryGB(gb: number): string {
  if (gb >= 10) return gb.toFixed(0);
  if (gb >= 1) return gb.toFixed(1);
  return gb.toFixed(2);
}

// ---------------------------------------------------------------------------
// Generate polyline data points (sampled along log scale)
// ---------------------------------------------------------------------------

const SAMPLE_COUNT = 120;

function generateLinePoints(
  model: ModelConfig,
  batchSize: number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const logSeq = LOG_SEQ_MIN + (i / SAMPLE_COUNT) * LOG_SEQ_RANGE;
    const seqLen = Math.pow(2, logSeq);
    const mem = kvCacheMemoryGB(model.layers, model.heads, model.dHead, seqLen, batchSize);
    points.push({ x: toSvgX(seqLen), y: toSvgY(mem) });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GridLines() {
  const horizontalLines = Y_TICKS.map((tick) => {
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
  });

  const verticalLines = SEQ_LENGTHS.map((seq) => {
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
  });

  return (
    <g>
      {horizontalLines}
      {verticalLines}
    </g>
  );
}

function Axes() {
  return (
    <g>
      {/* X-axis line */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_RIGHT}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      {/* Y-axis line */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={PLOT_LEFT}
        y2={PLOT_BOTTOM}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />

      {/* X-axis tick labels */}
      {SEQ_LENGTHS.map((seq) => (
        <text
          key={seq}
          x={toSvgX(seq)}
          y={PLOT_BOTTOM + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={9}
          fontFamily={FONT_MONO}
        >
          {SEQ_LABELS[seq]}
        </text>
      ))}

      {/* X-axis label */}
      <text
        x={PLOT_LEFT + PLOT_WIDTH / 2}
        y={PLOT_BOTTOM + 34}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        sequence length
      </text>

      {/* Y-axis tick labels */}
      {Y_TICKS.map((tick) => (
        <text
          key={tick}
          x={PLOT_LEFT - 8}
          y={toSvgY(tick) + 3}
          textAnchor="end"
          fill="rgba(255,255,255,0.35)"
          fontSize={9}
          fontFamily={FONT_MONO}
        >
          {tick}
        </text>
      ))}

      {/* Y-axis label */}
      <text
        x={14}
        y={PLOT_TOP + PLOT_HEIGHT / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={9}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, 14, ${PLOT_TOP + PLOT_HEIGHT / 2})`}
      >
        KV cache (GB)
      </text>
    </g>
  );
}

function GpuReferenceLines() {
  return (
    <g>
      {GPU_REFERENCES.map(({ memoryGB, label }) => {
        const y = toSvgY(memoryGB);
        return (
          <g key={label}>
            <line
              x1={PLOT_LEFT}
              y1={y}
              x2={PLOT_RIGHT}
              y2={y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={PLOT_RIGHT - 4}
              y={y - 5}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              fontSize={8}
              fontFamily={FONT_MONO}
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ModelLine({
  model,
  batchSize,
}: {
  model: ModelConfig;
  batchSize: number;
}) {
  const points = useMemo(
    () => generateLinePoints(model, batchSize),
    [model, batchSize],
  );

  const clippedPoints = useMemo(() => {
    // Clip points to the plot area vertically
    return points.filter((p) => p.y >= PLOT_TOP);
  }, [points]);

  const pointsString = clippedPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Crossing dots where line meets GPU reference thresholds
  const crossingDots = GPU_REFERENCES.map(({ memoryGB, label }) => {
    const crossingSeqLen = findCrossingSeqLen(model, memoryGB, batchSize);
    if (crossingSeqLen === null) return null;

    const cx = toSvgX(crossingSeqLen);
    const cy = toSvgY(memoryGB);
    return (
      <circle
        key={`${model.name}-${label}`}
        cx={cx}
        cy={cy}
        r={3}
        fill={model.color}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={1}
      />
    );
  });

  return (
    <g>
      <polyline
        points={pointsString}
        fill="none"
        stroke={model.color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {crossingDots}
    </g>
  );
}

function Legend() {
  const legendX = PLOT_LEFT + 10;
  const legendY = PLOT_TOP + 8;

  return (
    <g>
      {MODELS.map((model, i) => (
        <g key={model.name}>
          <circle
            cx={legendX}
            cy={legendY + i * 16}
            r={4}
            fill={model.color}
          />
          <text
            x={legendX + 10}
            y={legendY + i * 16 + 3.5}
            fill="rgba(255,255,255,0.5)"
            fontSize={9}
            fontFamily={FONT_MONO}
          >
            {model.name}
          </text>
        </g>
      ))}
    </g>
  );
}

function Crosshair({
  svgX,
  batchSize,
}: {
  svgX: number;
  batchSize: number;
}) {
  const seqLen = fromSvgX(svgX);

  const values = MODELS.map((model) => ({
    name: model.name,
    memoryGB: kvCacheMemoryGB(
      model.layers,
      model.heads,
      model.dHead,
      seqLen,
      batchSize,
    ),
    color: model.color,
  }));

  // Build tooltip text
  const seqLabel = formatSeqLen(Math.round(seqLen));
  const modelValues = values
    .map((v) => `${v.name}: ${formatMemoryGB(v.memoryGB)} GB`)
    .join(" | ");
  const tooltipText = `Seq: ${seqLabel} | ${modelValues}`;

  // Tooltip positioning: prefer to the right, flip if near edge
  const tooltipWidth = tooltipText.length * 5.2 + 16;
  const tooltipHeight = 22;
  const tooltipPadding = 8;
  const tooltipX =
    svgX + tooltipPadding + tooltipWidth > PLOT_RIGHT
      ? svgX - tooltipPadding - tooltipWidth
      : svgX + tooltipPadding;
  const tooltipY = PLOT_TOP + 6;

  // Indicator dots on each line
  const dots = values.map((v, i) => {
    const y = toSvgY(v.memoryGB);
    if (y < PLOT_TOP || y > PLOT_BOTTOM) return null;
    return (
      <circle
        key={i}
        cx={svgX}
        cy={y}
        r={4}
        fill={MODELS[i].color}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={1}
      />
    );
  });

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

      {dots}

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
        x={tooltipX + 8}
        y={tooltipY + tooltipHeight / 2 + 3.5}
        fill="rgba(255,255,255,0.75)"
        fontSize={8.5}
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

export default function MemoryWallChart() {
  const [batchSize, setBatchSize] = useState(1);
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
          className="w-full max-w-[580px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: "crosshair" }}
        >
          {/* Clip path for the plot area */}
          <defs>
            <clipPath id="plot-area-clip">
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
          <GpuReferenceLines />

          <g clipPath="url(#plot-area-clip)">
            {MODELS.map((model) => (
              <ModelLine
                key={model.name}
                model={model}
                batchSize={batchSize}
              />
            ))}
          </g>

          <Legend />

          {hoverX !== null && (
            <Crosshair svgX={hoverX} batchSize={batchSize} />
          )}
        </svg>
      </div>

      {/* Batch size slider */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <label
          className="text-xs text-white/50"
          style={{ fontFamily: FONT_MONO }}
        >
          Batch size: {batchSize}
        </label>
        <input
          type="range"
          aria-label="Batch size"
          min={1}
          max={32}
          step={1}
          value={batchSize}
          onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
          className="h-1 w-36 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#4ade80]"
        />
      </div>
    </div>
  );
}
