"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";

const COLOR_LOWER_BOUND = "rgba(255,255,255,0.5)";
const COLOR_TURBO = ACCENT;
const COLOR_UNIFORM = "rgba(251,146,60,0.7)";

const SVG_WIDTH = 700;
const SVG_HEIGHT = 420;

const MARGIN = { top: 30, right: 30, bottom: 50, left: 70 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Data — distortion at each bit-width
// ---------------------------------------------------------------------------

const BIT_WIDTHS = [1, 2, 3, 4, 5, 6, 7, 8];

const TURBO_CONSTANT = Math.sqrt(3 * Math.PI) / 2; // ~2.72

function shannonLowerBound(bits: number): number {
  return Math.pow(0.25, bits);
}

function turboQuantDistortion(bits: number): number {
  return TURBO_CONSTANT * Math.pow(0.25, bits);
}

function uniformDistortion(bits: number): number {
  // Uniform quantization on non-uniform (e.g. Gaussian) distributions
  // is roughly ~4x worse than TurboQuant's distortion
  return TURBO_CONSTANT * 4 * Math.pow(0.25, bits);
}

interface DataPoint {
  bits: number;
  shannon: number;
  turbo: number;
  uniform: number;
}

const DATA_POINTS: DataPoint[] = BIT_WIDTHS.map((b) => ({
  bits: b,
  shannon: shannonLowerBound(b),
  turbo: turboQuantDistortion(b),
  uniform: uniformDistortion(b),
}));

// ---------------------------------------------------------------------------
// Log-scale Y-axis configuration
// ---------------------------------------------------------------------------

const Y_MIN_LOG = -5; // log10(0.00001) = -5
const Y_MAX_LOG = 1; // log10(10) = 1
const Y_LOG_RANGE = Y_MAX_LOG - Y_MIN_LOG;

const Y_TICK_EXPONENTS = [-4, -3, -2, -1, 0];

// ---------------------------------------------------------------------------
// Coordinate mapping
// ---------------------------------------------------------------------------

function toSvgX(bits: number): number {
  const minBits = BIT_WIDTHS[0];
  const maxBits = BIT_WIDTHS[BIT_WIDTHS.length - 1];
  return PLOT_LEFT + ((bits - minBits) / (maxBits - minBits)) * PLOT_WIDTH;
}

function toSvgY(value: number): number {
  const logValue = Math.log10(Math.max(value, 1e-6));
  const fraction = (logValue - Y_MIN_LOG) / Y_LOG_RANGE;
  return PLOT_BOTTOM - fraction * PLOT_HEIGHT;
}

// ---------------------------------------------------------------------------
// SVG path builder
// ---------------------------------------------------------------------------

function buildLinePath(points: { x: number; y: number }[]): string {
  return points
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

function buildShadedRegionPath(
  topPoints: { x: number; y: number }[],
  bottomPoints: { x: number; y: number }[],
): string {
  if (topPoints.length === 0 || bottomPoints.length === 0) return "";
  const forward = topPoints
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const backward = [...bottomPoints]
    .reverse()
    .map(({ x, y }) => `L ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  return `${forward} ${backward} Z`;
}

// ---------------------------------------------------------------------------
// Llama KV cache memory calculation
// ---------------------------------------------------------------------------

// Llama-3.1-8B: 32 layers, 8 KV heads, 128 head dim, 32768 context
const LLAMA_LAYERS = 32;
const LLAMA_KV_HEADS = 8;
const LLAMA_HEAD_DIM = 128;
const LLAMA_CONTEXT = 32768;

function fp16KvCacheGB(): number {
  // 2 (K+V) * layers * kv_heads * head_dim * context * 2 bytes / 1024^3
  return (2 * LLAMA_LAYERS * LLAMA_KV_HEADS * LLAMA_HEAD_DIM * LLAMA_CONTEXT * 2) / (1024 ** 3);
}

function turboQuantKvCacheGB(bits: number): number {
  return fp16KvCacheGB() * (bits / 16);
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatDistortion(value: number): string {
  if (value >= 0.01) return value.toFixed(4);
  return value.toExponential(2);
}

function formatMemoryGB(gb: number): string {
  if (gb >= 1) return gb.toFixed(1);
  if (gb >= 0.1) return gb.toFixed(2);
  return gb.toFixed(3);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DistortionExplorer() {
  const [selectedBits, setSelectedBits] = useState<number>(4);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pre-compute line coordinates
  const shannonLine = useMemo(
    () => DATA_POINTS.map((d) => ({ x: toSvgX(d.bits), y: toSvgY(d.shannon) })),
    [],
  );
  const turboLine = useMemo(
    () => DATA_POINTS.map((d) => ({ x: toSvgX(d.bits), y: toSvgY(d.turbo) })),
    [],
  );
  const uniformLine = useMemo(
    () => DATA_POINTS.map((d) => ({ x: toSvgX(d.bits), y: toSvgY(d.uniform) })),
    [],
  );

  const shadedPath = useMemo(
    () => buildShadedRegionPath(shannonLine, turboLine),
    [shannonLine, turboLine],
  );

  const selectedData = useMemo(
    () => DATA_POINTS.find((d) => d.bits === selectedBits) ?? DATA_POINTS[3],
    [selectedBits],
  );

  const displayedPoint = hoveredPoint ?? selectedData;

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const svgX = (e.clientX - rect.left) * scaleX;

      if (svgX < PLOT_LEFT || svgX > PLOT_RIGHT) return;

      // Snap to nearest bit-width
      const minBits = BIT_WIDTHS[0];
      const maxBits = BIT_WIDTHS[BIT_WIDTHS.length - 1];
      const rawBits = minBits + ((svgX - PLOT_LEFT) / PLOT_WIDTH) * (maxBits - minBits);
      const nearest = BIT_WIDTHS.reduce((prev, curr) =>
        Math.abs(curr - rawBits) < Math.abs(prev - rawBits) ? curr : prev,
      );
      setSelectedBits(nearest);
    },
    [],
  );

  const fp16Memory = fp16KvCacheGB();
  const turboMemory = turboQuantKvCacheGB(displayedPoint.bits);
  const memorySaved = fp16Memory - turboMemory;
  const compressionRatio = 32 / displayedPoint.bits;
  const gapRatio = displayedPoint.turbo / displayedPoint.shannon;

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
        TurboQuant Distortion vs. Information-Theoretic Lower Bound
      </div>

      {/* Bit-width selector */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: TEXT_DIM, marginRight: 4 }}>
          Bit-width:
        </span>
        {BIT_WIDTHS.map((b) => {
          const isSelected = b === selectedBits;
          return (
            <button
              key={b}
              onClick={() => setSelectedBits(b)}
              style={{
                minWidth: 32,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isSelected
                  ? "rgba(74,222,128,0.15)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? "rgba(74,222,128,0.4)" : BORDER}`,
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
      </div>

      {/* Chart */}
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
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
          onClick={handleSvgClick}
        >
          {/* Grid lines */}
          {Y_TICK_EXPONENTS.map((exp) => {
            const y = toSvgY(Math.pow(10, exp));
            return (
              <line
                key={`h-${exp}`}
                x1={PLOT_LEFT}
                y1={y}
                x2={PLOT_RIGHT}
                y2={y}
                stroke={BORDER}
                strokeWidth={0.5}
              />
            );
          })}
          {BIT_WIDTHS.map((b) => (
            <line
              key={`v-${b}`}
              x1={toSvgX(b)}
              y1={PLOT_TOP}
              x2={toSvgX(b)}
              y2={PLOT_BOTTOM}
              stroke={BORDER}
              strokeWidth={0.5}
            />
          ))}

          {/* Selected bit-width highlight column */}
          <rect
            x={toSvgX(selectedBits) - 18}
            y={PLOT_TOP}
            width={36}
            height={PLOT_HEIGHT}
            fill="rgba(74,222,128,0.04)"
            stroke="rgba(74,222,128,0.12)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Shaded optimality gap region */}
          <path d={shadedPath} fill="rgba(74,222,128,0.06)" />

          {/* Gap label — placed at midpoint between lines at b=3 */}
          <text
            x={toSvgX(2.5)}
            y={(toSvgY(DATA_POINTS[1].shannon) + toSvgY(DATA_POINTS[1].turbo)) / 2 + 3}
            textAnchor="middle"
            fill="rgba(74,222,128,0.4)"
            fontSize={9}
            fontFamily={FONT_MONO}
          >
            gap ~2.7x
          </text>

          {/* Y-axis labels */}
          {Y_TICK_EXPONENTS.map((exp) => (
            <text
              key={exp}
              x={PLOT_LEFT - 10}
              y={toSvgY(Math.pow(10, exp)) + 3.5}
              textAnchor="end"
              fill={TEXT_DIM}
              fontSize={10}
              fontFamily={FONT_MONO}
            >
              {exp === 0 ? "1" : `10${superscriptLabel(exp)}`}
            </text>
          ))}

          {/* X-axis labels */}
          {BIT_WIDTHS.map((b) => (
            <text
              key={b}
              x={toSvgX(b)}
              y={PLOT_BOTTOM + 18}
              textAnchor="middle"
              fill={TEXT_DIM}
              fontSize={11}
              fontFamily={FONT_MONO}
            >
              {b}
            </text>
          ))}

          {/* Axis titles */}
          <text
            x={PLOT_LEFT + PLOT_WIDTH / 2}
            y={PLOT_BOTTOM + 40}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={11}
            fontFamily={FONT_MONO}
          >
            Bits per coordinate
          </text>
          <text
            x={16}
            y={PLOT_TOP + PLOT_HEIGHT / 2}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={11}
            fontFamily={FONT_MONO}
            transform={`rotate(-90, 16, ${PLOT_TOP + PLOT_HEIGHT / 2})`}
          >
            MSE Distortion (log scale)
          </text>

          {/* Lines */}

          {/* Uniform quantization (background, draw first) */}
          <path
            d={buildLinePath(uniformLine)}
            fill="none"
            stroke={COLOR_UNIFORM}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Shannon lower bound (dashed) */}
          <path
            d={buildLinePath(shannonLine)}
            fill="none"
            stroke={COLOR_LOWER_BOUND}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* TurboQuant (solid, prominent) */}
          <path
            d={buildLinePath(turboLine)}
            fill="none"
            stroke={COLOR_TURBO}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points — Uniform */}
          {DATA_POINTS.map((d) => (
            <circle
              key={`uniform-${d.bits}`}
              cx={toSvgX(d.bits)}
              cy={toSvgY(d.uniform)}
              r={3}
              fill={BG}
              stroke={COLOR_UNIFORM}
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredPoint(d)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBits(d.bits);
              }}
            />
          ))}

          {/* Data points — Shannon */}
          {DATA_POINTS.map((d) => (
            <circle
              key={`shannon-${d.bits}`}
              cx={toSvgX(d.bits)}
              cy={toSvgY(d.shannon)}
              r={3}
              fill={BG}
              stroke={COLOR_LOWER_BOUND}
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredPoint(d)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBits(d.bits);
              }}
            />
          ))}

          {/* Data points — TurboQuant */}
          {DATA_POINTS.map((d) => (
            <circle
              key={`turbo-${d.bits}`}
              cx={toSvgX(d.bits)}
              cy={toSvgY(d.turbo)}
              r={4}
              fill={BG}
              stroke={COLOR_TURBO}
              strokeWidth={2}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredPoint(d)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBits(d.bits);
              }}
            />
          ))}

          {/* Hover tooltip */}
          {hoveredPoint && (
            <HoverTooltip point={hoveredPoint} />
          )}

          {/* Legend */}
          <g>
            <line
              x1={PLOT_RIGHT - 160}
              y1={PLOT_TOP + 14}
              x2={PLOT_RIGHT - 140}
              y2={PLOT_TOP + 14}
              stroke={COLOR_TURBO}
              strokeWidth={2.5}
            />
            <circle
              cx={PLOT_RIGHT - 150}
              cy={PLOT_TOP + 14}
              r={3}
              fill={BG}
              stroke={COLOR_TURBO}
              strokeWidth={1.5}
            />
            <text
              x={PLOT_RIGHT - 134}
              y={PLOT_TOP + 18}
              fill={COLOR_TURBO}
              fontSize={10}
              fontFamily={FONT_MONO}
            >
              TurboQuant
            </text>

            <line
              x1={PLOT_RIGHT - 160}
              y1={PLOT_TOP + 32}
              x2={PLOT_RIGHT - 140}
              y2={PLOT_TOP + 32}
              stroke={COLOR_LOWER_BOUND}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <text
              x={PLOT_RIGHT - 134}
              y={PLOT_TOP + 36}
              fill={COLOR_LOWER_BOUND}
              fontSize={10}
              fontFamily={FONT_MONO}
            >
              Shannon Lower Bound
            </text>

            <line
              x1={PLOT_RIGHT - 160}
              y1={PLOT_TOP + 50}
              x2={PLOT_RIGHT - 140}
              y2={PLOT_TOP + 50}
              stroke={COLOR_UNIFORM}
              strokeWidth={1.5}
            />
            <circle
              cx={PLOT_RIGHT - 150}
              cy={PLOT_TOP + 50}
              r={3}
              fill={BG}
              stroke={COLOR_UNIFORM}
              strokeWidth={1.5}
            />
            <text
              x={PLOT_RIGHT - 134}
              y={PLOT_TOP + 54}
              fill={COLOR_UNIFORM}
              fontSize={10}
              fontFamily={FONT_MONO}
            >
              Naive Uniform
            </text>
          </g>

          {/* Plot border */}
          <rect
            x={PLOT_LEFT}
            y={PLOT_TOP}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="none"
            stroke={BORDER}
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* Details panel for selected bit-width */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {/* Distortion breakdown */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "14px 16px",
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: TEXT_DIM,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            At {displayedPoint.bits} bits per coordinate
          </div>

          <div style={{ color: COLOR_LOWER_BOUND }}>
            Shannon bound:{" "}
            <span style={{ color: TEXT_BRIGHT }}>
              {formatDistortion(displayedPoint.shannon)}
            </span>
          </div>
          <div style={{ color: COLOR_TURBO }}>
            TurboQuant:{" "}
            <span style={{ color: TEXT_BRIGHT }}>
              {formatDistortion(displayedPoint.turbo)}
            </span>
            <span style={{ color: TEXT_DIM, marginLeft: 8 }}>
              ({gapRatio.toFixed(1)}x gap)
            </span>
          </div>
          <div style={{ color: COLOR_UNIFORM }}>
            Naive Uniform:{" "}
            <span style={{ color: TEXT_BRIGHT }}>
              {formatDistortion(displayedPoint.uniform)}
            </span>
          </div>
          <div style={{ color: TEXT_DIM, marginTop: 6 }}>
            Compression vs FP32: 32/{displayedPoint.bits} ={" "}
            <span style={{ color: ACCENT }}>{compressionRatio.toFixed(0)}x</span>
          </div>

          {/* Visual compression bar */}
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: TEXT_DIM,
                marginBottom: 4,
              }}
            >
              Size comparison
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: TEXT_DIM, width: 48 }}>
                  FP32
                </span>
                <div
                  style={{
                    height: 10,
                    width: "100%",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: ACCENT, width: 48 }}>
                  {displayedPoint.bits}-bit
                </span>
                <div
                  style={{
                    height: 10,
                    width: `${(displayedPoint.bits / 32) * 100}%`,
                    background: "rgba(74,222,128,0.3)",
                    borderRadius: 2,
                    border: "1px solid rgba(74,222,128,0.4)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Practical memory example */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "14px 16px",
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: TEXT_DIM,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Llama-3.1-8B at 32K context
          </div>

          <div style={{ color: TEXT_DIM }}>
            FP16 KV cache:{" "}
            <span style={{ color: TEXT_BRIGHT }}>
              {formatMemoryGB(fp16Memory)} GB
            </span>
          </div>
          <div style={{ color: ACCENT }}>
            TurboQuant at {displayedPoint.bits} bits:{" "}
            <span style={{ color: TEXT_BRIGHT }}>
              {formatMemoryGB(turboMemory)} GB
            </span>
          </div>
          <div style={{ color: TEXT_DIM }}>
            Memory saved:{" "}
            <span style={{ color: ACCENT }}>
              {formatMemoryGB(memorySaved)} GB
            </span>
          </div>

          {/* Memory bar visualization */}
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: TEXT_DIM,
                marginBottom: 4,
              }}
            >
              KV cache memory
            </div>
            <div
              style={{
                position: "relative",
                height: 24,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {/* FP16 full bar (reference) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "50%",
                  background: "rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              />
              {/* TurboQuant bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: `${(displayedPoint.bits / 16) * 100}%`,
                  height: "50%",
                  background: "rgba(74,222,128,0.2)",
                  borderTop: "1px solid rgba(74,222,128,0.3)",
                }}
              />
              {/* Labels inside bars */}
              <span
                style={{
                  position: "absolute",
                  top: 1,
                  left: 6,
                  fontSize: 9,
                  color: TEXT_DIM,
                  lineHeight: "12px",
                }}
              >
                FP16: {formatMemoryGB(fp16Memory)} GB
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: 1,
                  left: 6,
                  fontSize: 9,
                  color: ACCENT,
                  lineHeight: "12px",
                }}
              >
                {displayedPoint.bits}-bit: {formatMemoryGB(turboMemory)} GB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key insight */}
      <div
        style={{
          marginTop: 16,
          background: "rgba(74,222,128,0.05)",
          border: "1px solid rgba(74,222,128,0.15)",
          borderRadius: 6,
          padding: "12px 16px",
          fontSize: 13,
          color: TEXT_DIM,
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: ACCENT, fontWeight: 600 }}>Key insight:</span>{" "}
        TurboQuant operates within a constant factor{" "}
        <span style={{ color: TEXT_BRIGHT }}>~2.7x</span> of the theoretical
        minimum &mdash; no quantizer can do better than the Shannon bound.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hover tooltip (rendered inside SVG)
// ---------------------------------------------------------------------------

function HoverTooltip({ point }: { point: DataPoint }) {
  const gapRatio = point.turbo / point.shannon;
  const tooltipX = toSvgX(point.bits) + 14;
  const tooltipY = toSvgY(point.turbo) - 36;

  // Flip tooltip to the left if near the right edge
  const flipped = tooltipX + 180 > PLOT_RIGHT;
  const finalX = flipped ? toSvgX(point.bits) - 194 : tooltipX;
  const finalY = Math.max(PLOT_TOP + 4, tooltipY);

  return (
    <g>
      <rect
        x={finalX}
        y={finalY}
        width={180}
        height={56}
        rx={4}
        fill="rgba(0,0,0,0.9)"
        stroke={BORDER}
        strokeWidth={1}
      />
      <text
        x={finalX + 8}
        y={finalY + 14}
        fill={TEXT_BRIGHT}
        fontSize={10}
        fontFamily={FONT_MONO}
      >
        {point.bits}-bit distortion
      </text>
      <text
        x={finalX + 8}
        y={finalY + 28}
        fill={COLOR_TURBO}
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        TurboQuant: {formatDistortion(point.turbo)}
      </text>
      <text
        x={finalX + 8}
        y={finalY + 40}
        fill={COLOR_LOWER_BOUND}
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        Shannon: {formatDistortion(point.shannon)}
      </text>
      <text
        x={finalX + 8}
        y={finalY + 52}
        fill={TEXT_DIM}
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        Gap: {gapRatio.toFixed(2)}x
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Superscript label helper for log-scale ticks
// ---------------------------------------------------------------------------

function superscriptLabel(exp: number): string {
  const superscripts: Record<string, string> = {
    "0": "\u2070",
    "1": "\u00B9",
    "2": "\u00B2",
    "3": "\u00B3",
    "4": "\u2074",
    "5": "\u2075",
    "6": "\u2076",
    "7": "\u2077",
    "8": "\u2078",
    "9": "\u2079",
  };
  const absStr = Math.abs(exp).toString();
  const superDigits = absStr.split("").map((ch) => superscripts[ch] ?? ch).join("");
  return exp < 0 ? `\u207B${superDigits}` : superDigits;
}
