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
const SVG_HEIGHT = 340;

const MARGIN = { top: 30, right: 20, bottom: 50, left: 50 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Precision definitions
// ---------------------------------------------------------------------------

interface PrecisionConfig {
  name: string;
  bits: number;
  color: string;
  colorBg: string;
}

const PRECISIONS: PrecisionConfig[] = [
  {
    name: "FP32",
    bits: 32,
    color: "rgba(239, 68, 68, 0.85)",
    colorBg: "rgba(239, 68, 68, 0.15)",
  },
  {
    name: "FP16",
    bits: 16,
    color: "rgba(96, 165, 250, 0.85)",
    colorBg: "rgba(96, 165, 250, 0.15)",
  },
  {
    name: "INT8",
    bits: 8,
    color: "rgba(234, 179, 8, 0.85)",
    colorBg: "rgba(234, 179, 8, 0.15)",
  },
  {
    name: "INT4",
    bits: 4,
    color: "rgba(74, 222, 128, 0.85)",
    colorBg: "rgba(74, 222, 128, 0.15)",
  },
];

// ---------------------------------------------------------------------------
// GPU reference lines
// ---------------------------------------------------------------------------

interface GpuRef {
  name: string;
  vramGB: number;
  color: string;
}

const GPU_REFS: GpuRef[] = [
  { name: "RTX 3060 12GB", vramGB: 12, color: "rgba(255,255,255,0.2)" },
  { name: "RTX 4090 24GB", vramGB: 24, color: "rgba(255,255,255,0.25)" },
  { name: "A100 40GB", vramGB: 40, color: "rgba(255,255,255,0.3)" },
  { name: "A100 80GB", vramGB: 80, color: "rgba(255,255,255,0.35)" },
];

// ---------------------------------------------------------------------------
// Model presets
// ---------------------------------------------------------------------------

interface ModelPreset {
  name: string;
  params: number; // in billions
}

const MODEL_PRESETS: ModelPreset[] = [
  { name: "1.3B", params: 1.3 },
  { name: "7B", params: 7 },
  { name: "13B", params: 13 },
  { name: "34B", params: 34 },
  { name: "70B", params: 70 },
];

// ---------------------------------------------------------------------------
// Memory computation
// ---------------------------------------------------------------------------

function computeMemoryGB(paramsB: number, bits: number): number {
  // params (in billions) * bits / 8 bytes * 1e9 / 1e9 (GB)
  return (paramsB * bits) / 8;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MemoryCalculator() {
  const [paramsB, setParamsB] = useState(7);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const memories = useMemo(
    () => PRECISIONS.map((p) => computeMemoryGB(paramsB, p.bits)),
    [paramsB]
  );

  const yMax = useMemo(() => {
    const maxMem = Math.max(...memories, 80);
    // Round up to a nice number
    return Math.ceil(maxMem / 20) * 20;
  }, [memories]);

  // Coordinate mapping
  const toY = useCallback(
    (gb: number) => PLOT_BOTTOM - (gb / yMax) * PLOT_HEIGHT,
    [yMax]
  );

  // Bar dimensions
  const barCount = PRECISIONS.length;
  const barGroupWidth = PLOT_WIDTH / (barCount + 1);
  const barWidth = Math.min(barGroupWidth * 0.6, 80);

  // Y axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = yMax <= 40 ? 5 : yMax <= 100 ? 10 : 20;
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    return ticks;
  }, [yMax]);

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const x = (e.clientX - rect.left) * scaleX;

      let found: number | null = null;
      for (let i = 0; i < barCount; i++) {
        const cx = PLOT_LEFT + (i + 1) * barGroupWidth;
        const bx = cx - barWidth / 2;
        if (x >= bx && x <= bx + barWidth) {
          found = i;
          break;
        }
      }
      setHoveredBar(found);
    },
    [barGroupWidth, barWidth, barCount]
  );

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
        Model Memory Calculator
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 250px" }}>
          <label style={{ fontSize: 13, color: TEXT_DIM, display: "block", marginBottom: 6 }}>
            Model size:{" "}
            <span style={{ color: ACCENT, fontSize: 16 }}>{paramsB}B</span>{" "}
            parameters
          </label>
          <input
            type="range"
            min={0.5}
            max={180}
            step={0.5}
            value={paramsB}
            onChange={(e) => setParamsB(parseFloat(e.target.value))}
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
            <span>0.5B</span>
            <span>45B</span>
            <span>90B</span>
            <span>180B</span>
          </div>
        </div>

        {/* Presets */}
        <div>
          <label style={{ fontSize: 13, color: TEXT_DIM, display: "block", marginBottom: 6 }}>
            Presets
          </label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setParamsB(preset.params)}
                style={{
                  background:
                    paramsB === preset.params
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    paramsB === preset.params ? "rgba(74,222,128,0.4)" : BORDER
                  }`,
                  borderRadius: 4,
                  padding: "6px 10px",
                  color: paramsB === preset.params ? ACCENT : TEXT_DIM,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
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
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* Y grid lines */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PLOT_LEFT}
                y1={toY(v)}
                x2={PLOT_RIGHT}
                y2={toY(v)}
                stroke={BORDER}
                strokeWidth={0.5}
              />
              <text
                x={PLOT_LEFT - 8}
                y={toY(v) + 3}
                textAnchor="end"
                fill={TEXT_DIM}
                fontSize={13}
                fontFamily={FONT_MONO}
              >
                {v}
              </text>
            </g>
          ))}

          {/* Y axis label */}
          <text
            x={14}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={13}
            fontFamily={FONT_MONO}
            transform={`rotate(-90, 14, ${SVG_HEIGHT / 2})`}
          >
            Memory (GB)
          </text>

          {/* GPU reference lines */}
          {GPU_REFS.map((gpu) => {
            const y = toY(gpu.vramGB);
            if (y < PLOT_TOP || y > PLOT_BOTTOM) return null;
            return (
              <g key={gpu.name}>
                <line
                  x1={PLOT_LEFT}
                  y1={y}
                  x2={PLOT_RIGHT}
                  y2={y}
                  stroke={gpu.color}
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
                <text
                  x={PLOT_RIGHT - 4}
                  y={y - 5}
                  textAnchor="end"
                  fill={gpu.color}
                  fontSize={13}
                  fontFamily={FONT_MONO}
                >
                  {gpu.name}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {PRECISIONS.map((p, i) => {
            const cx = PLOT_LEFT + (i + 1) * barGroupWidth;
            const bx = cx - barWidth / 2;
            const mem = memories[i];
            const barH = (mem / yMax) * PLOT_HEIGHT;
            const by = PLOT_BOTTOM - barH;
            const isHovered = hoveredBar === i;

            return (
              <g key={p.name}>
                {/* Bar */}
                <rect
                  x={bx}
                  y={by}
                  width={barWidth}
                  height={barH}
                  fill={isHovered ? p.color.replace("0.85", "0.95") : p.colorBg}
                  stroke={p.color}
                  strokeWidth={isHovered ? 2 : 1}
                  rx={3}
                  style={{ transition: "all 0.2s ease" }}
                />

                {/* Value label on bar */}
                <text
                  x={cx}
                  y={by - 8}
                  textAnchor="middle"
                  fill={p.color}
                  fontSize={13}
                  fontFamily={FONT_MONO}
                  fontWeight={600}
                >
                  {mem < 1 ? mem.toFixed(2) : mem.toFixed(1)} GB
                </text>

                {/* Precision label below */}
                <text
                  x={cx}
                  y={PLOT_BOTTOM + 16}
                  textAnchor="middle"
                  fill={isHovered ? p.color : TEXT_DIM}
                  fontSize={13}
                  fontFamily={FONT_MONO}
                >
                  {p.name}
                </text>

                {/* Bits label */}
                <text
                  x={cx}
                  y={PLOT_BOTTOM + 30}
                  textAnchor="middle"
                  fill={TEXT_DIM}
                  fontSize={13}
                  fontFamily={FONT_MONO}
                >
                  {p.bits} bits
                </text>
              </g>
            );
          })}

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

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        {PRECISIONS.map((p, i) => {
          const mem = memories[i];
          // Find smallest GPU that fits
          const fitsGpu = GPU_REFS.find((g) => g.vramGB >= mem);
          return (
            <div
              key={p.name}
              style={{
                background: p.colorBg,
                border: `1px solid ${p.color}40`,
                borderRadius: 6,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 13, color: p.color, marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 16, color: TEXT_BRIGHT, marginBottom: 2 }}>
                {mem < 1 ? mem.toFixed(2) : mem.toFixed(1)} GB
              </div>
              <div style={{ fontSize: 13, color: TEXT_DIM }}>
                {fitsGpu
                  ? `Fits on ${fitsGpu.name}`
                  : "Needs multi-GPU"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
