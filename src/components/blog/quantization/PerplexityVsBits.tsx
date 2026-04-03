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

const SVG_WIDTH = 600;
const SVG_HEIGHT = 360;

const MARGIN = { top: 30, right: 24, bottom: 50, left: 54 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Quantization method data
// ---------------------------------------------------------------------------

interface MethodConfig {
  name: string;
  label: string;
  color: string;
  strokeWidth: number;
  // [bits, perplexity] data points
  data: [number, number][];
}

// Approximate data inspired by published benchmarks (LLaMA 7B on WikiText-2)
const METHODS: MethodConfig[] = [
  {
    name: "rtn",
    label: "Round-to-Nearest (RTN)",
    color: "rgba(239, 68, 68, 0.8)",
    strokeWidth: 2,
    data: [
      [2, 85.0],
      [3, 12.5],
      [4, 7.2],
      [5, 6.1],
      [6, 5.72],
      [7, 5.68],
      [8, 5.68],
      [16, 5.67],
    ],
  },
  {
    name: "gptq",
    label: "GPTQ",
    color: "rgba(96, 165, 250, 0.8)",
    strokeWidth: 2,
    data: [
      [2, 28.0],
      [3, 7.8],
      [4, 5.85],
      [5, 5.72],
      [6, 5.69],
      [7, 5.68],
      [8, 5.67],
      [16, 5.67],
    ],
  },
  {
    name: "awq",
    label: "AWQ",
    color: ACCENT,
    strokeWidth: 2.5,
    data: [
      [2, 22.0],
      [3, 7.1],
      [4, 5.78],
      [5, 5.70],
      [6, 5.68],
      [7, 5.67],
      [8, 5.67],
      [16, 5.67],
    ],
  },
];

// ---------------------------------------------------------------------------
// Axis configuration
// ---------------------------------------------------------------------------

const X_MIN = 2;
const X_MAX = 16;
const X_TICKS = [2, 3, 4, 5, 6, 8, 16];

const Y_MIN = 5;
const Y_MAX = 30;
const Y_TICKS = [5, 6, 8, 10, 15, 20, 30];

// Use log scale for Y to show detail at low perplexity
const LOG_Y_MIN = Math.log(Y_MIN);
const LOG_Y_MAX = Math.log(Y_MAX);
const LOG_Y_RANGE = LOG_Y_MAX - LOG_Y_MIN;

// ---------------------------------------------------------------------------
// Coordinate mapping
// ---------------------------------------------------------------------------

function toSvgX(bits: number): number {
  return PLOT_LEFT + ((bits - X_MIN) / (X_MAX - X_MIN)) * PLOT_WIDTH;
}

function toSvgY(perplexity: number): number {
  const logP = Math.log(Math.max(perplexity, Y_MIN));
  return PLOT_BOTTOM - ((logP - LOG_Y_MIN) / LOG_Y_RANGE) * PLOT_HEIGHT;
}

function fromSvgX(svgX: number): number {
  const fraction = (svgX - PLOT_LEFT) / PLOT_WIDTH;
  return X_MIN + fraction * (X_MAX - X_MIN);
}

// ---------------------------------------------------------------------------
// SVG path generation
// ---------------------------------------------------------------------------

function buildPath(data: [number, number][]): string {
  const filtered = data.filter(([b, p]) => b >= X_MIN && b <= X_MAX && p <= Y_MAX);
  if (filtered.length === 0) return "";
  return filtered
    .map(([b, p], i) => {
      const x = toSvgX(b);
      const y = toSvgY(p);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// Interpolation to get value at cursor position
// ---------------------------------------------------------------------------

function interpolateAtBits(data: [number, number][], bits: number): number | null {
  if (bits < data[0][0] || bits > data[data.length - 1][0]) return null;

  for (let i = 0; i < data.length - 1; i++) {
    if (bits >= data[i][0] && bits <= data[i + 1][0]) {
      const t = (bits - data[i][0]) / (data[i + 1][0] - data[i][0]);
      return data[i][1] + t * (data[i + 1][1] - data[i][1]);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PerplexityVsBits() {
  const [hoveredBits, setHoveredBits] = useState<number | null>(null);
  const [enabledMethods, setEnabledMethods] = useState<Set<string>>(
    new Set(METHODS.map((m) => m.name))
  );
  const svgRef = useRef<SVGSVGElement>(null);

  const toggleMethod = useCallback((name: string) => {
    setEnabledMethods((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        // Don't let user disable all methods
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const svgX = (e.clientX - rect.left) * scaleX;

      if (svgX >= PLOT_LEFT && svgX <= PLOT_RIGHT) {
        const bits = fromSvgX(svgX);
        setHoveredBits(Math.max(X_MIN, Math.min(X_MAX, bits)));
      } else {
        setHoveredBits(null);
      }
    },
    []
  );

  // Compute hovered values
  const hoveredValues = useMemo(() => {
    if (hoveredBits === null) return null;
    return METHODS.filter((m) => enabledMethods.has(m.name)).map((m) => ({
      method: m,
      value: interpolateAtBits(m.data, hoveredBits),
    }));
  }, [hoveredBits, enabledMethods]);

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
        Perplexity vs. Bits per Weight (LLaMA-7B, WikiText-2)
      </div>

      {/* Method toggles */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {METHODS.map((m) => {
          const isEnabled = enabledMethods.has(m.name);
          return (
            <button
              key={m.name}
              onClick={() => toggleMethod(m.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: isEnabled
                  ? `${m.color.replace("0.8", "0.1").replace(ACCENT, "rgba(74,222,128,0.1)")}`
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  isEnabled ? m.color.replace("0.8", "0.3") : BORDER
                }`,
                borderRadius: 4,
                padding: "6px 12px",
                color: isEnabled ? m.color : TEXT_DIM,
                fontFamily: FONT_MONO,
                fontSize: 13,
                cursor: "pointer",
                opacity: isEnabled ? 1 : 0.5,
                transition: "all 0.15s ease",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 2,
                  background: m.color,
                  display: "inline-block",
                  borderRadius: 1,
                  opacity: isEnabled ? 1 : 0.3,
                }}
              />
              {m.label}
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
          style={{ width: "100%", height: "auto", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredBits(null)}
        >
          {/* Grid lines */}
          {Y_TICKS.map((v) => (
            <line
              key={v}
              x1={PLOT_LEFT}
              y1={toSvgY(v)}
              x2={PLOT_RIGHT}
              y2={toSvgY(v)}
              stroke={BORDER}
              strokeWidth={0.5}
            />
          ))}

          {X_TICKS.map((v) => (
            <line
              key={v}
              x1={toSvgX(v)}
              y1={PLOT_TOP}
              x2={toSvgX(v)}
              y2={PLOT_BOTTOM}
              stroke={BORDER}
              strokeWidth={0.5}
            />
          ))}

          {/* Sweet spot region (4-bit) */}
          <rect
            x={toSvgX(3.5)}
            y={PLOT_TOP}
            width={toSvgX(4.5) - toSvgX(3.5)}
            height={PLOT_HEIGHT}
            fill="rgba(74, 222, 128, 0.04)"
            stroke="rgba(74, 222, 128, 0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={toSvgX(4)}
            y={PLOT_TOP + 14}
            textAnchor="middle"
            fill="rgba(74, 222, 128, 0.5)"
            fontSize={13}
            fontFamily={FONT_MONO}
          >
            sweet spot
          </text>

          {/* Y axis labels */}
          {Y_TICKS.map((v) => (
            <text
              key={v}
              x={PLOT_LEFT - 8}
              y={toSvgY(v) + 3}
              textAnchor="end"
              fill={TEXT_DIM}
              fontSize={13}
              fontFamily={FONT_MONO}
            >
              {v}
            </text>
          ))}

          {/* X axis labels */}
          {X_TICKS.map((v) => (
            <text
              key={v}
              x={toSvgX(v)}
              y={PLOT_BOTTOM + 16}
              textAnchor="middle"
              fill={TEXT_DIM}
              fontSize={13}
              fontFamily={FONT_MONO}
            >
              {v}
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={SVG_WIDTH / 2}
            y={PLOT_BOTTOM + 38}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={13}
            fontFamily={FONT_MONO}
          >
            Bits per weight
          </text>
          <text
            x={14}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={13}
            fontFamily={FONT_MONO}
            transform={`rotate(-90, 14, ${SVG_HEIGHT / 2})`}
          >
            Perplexity (log scale)
          </text>

          {/* FP16 baseline */}
          <line
            x1={PLOT_LEFT}
            y1={toSvgY(5.67)}
            x2={PLOT_RIGHT}
            y2={toSvgY(5.67)}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            strokeDasharray="8 4"
          />
          <text
            x={PLOT_RIGHT - 4}
            y={toSvgY(5.67) - 5}
            textAnchor="end"
            fill="rgba(255,255,255,0.3)"
            fontSize={13}
            fontFamily={FONT_MONO}
          >
            FP16 baseline (5.67)
          </text>

          {/* Method lines */}
          {METHODS.filter((m) => enabledMethods.has(m.name)).map((m) => (
            <g key={m.name}>
              <path
                d={buildPath(m.data)}
                fill="none"
                stroke={m.color}
                strokeWidth={m.strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Data points */}
              {m.data
                .filter(
                  ([b, p]) => b >= X_MIN && b <= X_MAX && p <= Y_MAX
                )
                .map(([b, p]) => (
                  <circle
                    key={`${m.name}-${b}`}
                    cx={toSvgX(b)}
                    cy={toSvgY(p)}
                    r={3}
                    fill={BG}
                    stroke={m.color}
                    strokeWidth={1.5}
                  />
                ))}
            </g>
          ))}

          {/* Hover crosshair */}
          {hoveredBits !== null && (
            <g>
              <line
                x1={toSvgX(hoveredBits)}
                y1={PLOT_TOP}
                x2={toSvgX(hoveredBits)}
                y2={PLOT_BOTTOM}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {/* Intersection dots */}
              {hoveredValues?.map(({ method, value }) =>
                value !== null ? (
                  <circle
                    key={method.name}
                    cx={toSvgX(hoveredBits)}
                    cy={toSvgY(value)}
                    r={4}
                    fill={method.color}
                    stroke={BG}
                    strokeWidth={1.5}
                  />
                ) : null
              )}
            </g>
          )}

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

      {/* Hover tooltip */}
      {hoveredBits !== null && hoveredValues && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <span style={{ color: TEXT_DIM }}>
            {hoveredBits.toFixed(1)} bits:
          </span>
          {hoveredValues.map(({ method, value }) => (
            <span key={method.name} style={{ color: method.color }}>
              {method.label}: {value !== null ? value.toFixed(2) : "N/A"}
            </span>
          ))}
        </div>
      )}

      {/* Key insight */}
      <div
        style={{
          marginTop: 16,
          background: "rgba(74,222,128,0.05)",
          border: `1px solid rgba(74,222,128,0.15)`,
          borderRadius: 6,
          padding: "12px 16px",
          fontSize: 13,
          color: TEXT_DIM,
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: ACCENT, fontWeight: 600 }}>Key insight:</span>{" "}
        At 4 bits per weight, advanced methods (GPTQ, AWQ) achieve perplexity
        within 2-3% of the FP16 baseline while using 4x less memory. Below 4
        bits, quality degrades rapidly. The sweet spot for practical deployment
        is 4-bit quantization.
      </div>
    </div>
  );
}
