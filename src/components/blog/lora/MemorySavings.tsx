"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 580;
const SVG_HEIGHT = 340;

const MARGIN = { top: 30, right: 20, bottom: 60, left: 60 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = SVG_HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// Colors for memory segments
const COLOR_MODEL = "rgba(100,150,255,0.6)";
const COLOR_GRADIENTS = "rgba(239,68,68,0.6)";
const COLOR_OPTIMIZER = "rgba(250,204,21,0.6)";
const COLOR_LORA_GRAD = "rgba(74,222,128,0.6)";
const COLOR_LORA_OPT = "rgba(74,222,128,0.4)";
const COLOR_QUANT_MODEL = "rgba(168,85,247,0.6)";

// Model presets (sizes in billions of parameters)
interface ModelPreset {
  name: string;
  params: number; // billions
}

const MODEL_PRESETS: ModelPreset[] = [
  { name: "1.3B", params: 1.3 },
  { name: "7B", params: 7 },
  { name: "13B", params: 13 },
  { name: "30B", params: 30 },
  { name: "65B", params: 65 },
  { name: "70B", params: 70 },
];

// ---------------------------------------------------------------------------
// Memory calculations (in GB)
// ---------------------------------------------------------------------------

interface MemoryBreakdown {
  model: number;
  gradients: number;
  optimizer: number;
  total: number;
}

function fullFineTuneMemory(paramsB: number): MemoryBreakdown {
  // Full fine-tune in fp16:
  // Model: 2 bytes * params
  // Gradients: 2 bytes * params (fp16)
  // Optimizer (AdamW): 2 states * 4 bytes * params (fp32 momentum + variance)
  const model = paramsB * 2; // GB
  const gradients = paramsB * 2;
  const optimizer = paramsB * 8; // 2 fp32 states for Adam
  return { model, gradients, optimizer, total: model + gradients + optimizer };
}

function loraMemory(paramsB: number, rank: number = 16): MemoryBreakdown {
  // LoRA in fp16:
  // Model: 2 bytes * params (frozen, still loaded)
  // LoRA params: ~0.1-1% of total (very small)
  // Gradients: only for LoRA params
  // Optimizer: only for LoRA params
  const model = paramsB * 2;
  const loraFraction = (2 * rank) / 4096; // approximate for typical hidden dim
  const loraParams = paramsB * loraFraction;
  const gradients = loraParams * 2;
  const optimizer = loraParams * 8;
  return { model, gradients, optimizer, total: model + gradients + optimizer };
}

function qloraMemory(paramsB: number, rank: number = 16): MemoryBreakdown {
  // QLoRA:
  // Model: 0.5 bytes * params (4-bit quantized)
  // LoRA in fp16 on top
  const model = paramsB * 0.5;
  const loraFraction = (2 * rank) / 4096;
  const loraParams = paramsB * loraFraction;
  const gradients = loraParams * 2;
  const optimizer = loraParams * 8;
  return { model, gradients, optimizer, total: model + gradients + optimizer };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatGB(gb: number): string {
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
  if (gb >= 100) return `${gb.toFixed(0)} GB`;
  return `${gb.toFixed(1)} GB`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MemorySavings() {
  const [selectedModel, setSelectedModel] = useState(1); // 7B default
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const preset = MODEL_PRESETS[selectedModel];

  const fullMem = useMemo(() => fullFineTuneMemory(preset.params), [preset.params]);
  const loraMem = useMemo(() => loraMemory(preset.params), [preset.params]);
  const qloraMem = useMemo(() => qloraMemory(preset.params), [preset.params]);

  const maxMem = fullMem.total;

  // Bar configuration
  const methods = [
    {
      id: "full",
      label: "Full Fine-Tune",
      mem: fullMem,
      segments: [
        { label: "Model (fp16)", value: fullMem.model, color: COLOR_MODEL },
        { label: "Gradients (fp16)", value: fullMem.gradients, color: COLOR_GRADIENTS },
        { label: "Optimizer (fp32)", value: fullMem.optimizer, color: COLOR_OPTIMIZER },
      ],
    },
    {
      id: "lora",
      label: "LoRA (r=16)",
      mem: loraMem,
      segments: [
        { label: "Model (fp16, frozen)", value: loraMem.model, color: COLOR_MODEL },
        { label: "LoRA Gradients", value: loraMem.gradients, color: COLOR_LORA_GRAD },
        { label: "LoRA Optimizer", value: loraMem.optimizer, color: COLOR_LORA_OPT },
      ],
    },
    {
      id: "qlora",
      label: "QLoRA (4-bit)",
      mem: qloraMem,
      segments: [
        { label: "Model (4-bit)", value: qloraMem.model, color: COLOR_QUANT_MODEL },
        { label: "LoRA Gradients", value: qloraMem.gradients, color: COLOR_LORA_GRAD },
        { label: "LoRA Optimizer", value: qloraMem.optimizer, color: COLOR_LORA_OPT },
      ],
    },
  ];

  const barCount = methods.length;
  const barGap = 20;
  const barWidth = (PLOT_HEIGHT - (barCount - 1) * barGap) / barCount;

  // Y position for each bar
  const barY = (index: number) => PLOT_TOP + index * (barWidth + barGap);

  // X scale (memory -> pixel)
  const toX = (gb: number) => PLOT_LEFT + (gb / maxMem) * PLOT_WIDTH;

  // Grid lines
  const xTicks = useMemo(() => {
    const step = Math.ceil(maxMem / 5 / 10) * 10;
    const ticks: number[] = [];
    for (let v = 0; v <= maxMem; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [maxMem]);

  // GPU memory lines
  const gpuLimits = [
    { label: "24 GB (3090)", gb: 24 },
    { label: "48 GB (A6000)", gb: 48 },
    { label: "80 GB (A100)", gb: 80 },
  ].filter((g) => g.gb < maxMem * 1.1);

  return (
    <div
      style={{
        background: "rgb(10,10,10)",
        padding: "20px 16px 16px",
        fontFamily: FONT_MONO,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          memory comparison · fine-tuning methods
        </span>
      </div>

      {/* Model selector */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {MODEL_PRESETS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => setSelectedModel(i)}
            style={{
              fontSize: 13,
              padding: "4px 10px",
              borderRadius: 4,
              border:
                i === selectedModel
                  ? `1px solid rgba(74,222,128,0.4)`
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                i === selectedModel
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(255,255,255,0.02)",
              color:
                i === selectedModel ? ACCENT : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: "100%", maxWidth: 580 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {xTicks.map((tick) => {
            const x = toX(tick);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={PLOT_TOP - 5}
                  x2={x}
                  y2={PLOT_BOTTOM + 5}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={PLOT_BOTTOM + 18}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize={8}
                  fontFamily={FONT_MONO}
                >
                  {formatGB(tick)}
                </text>
              </g>
            );
          })}

          {/* GPU limit lines */}
          {gpuLimits.map((gpu) => {
            const x = toX(gpu.gb);
            if (x > PLOT_RIGHT + 10) return null;
            return (
              <g key={gpu.label}>
                <line
                  x1={x}
                  y1={PLOT_TOP - 5}
                  x2={x}
                  y2={PLOT_BOTTOM + 5}
                  stroke="rgba(239,68,68,0.3)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <text
                  x={x}
                  y={PLOT_TOP - 8}
                  textAnchor="middle"
                  fill="rgba(239,68,68,0.5)"
                  fontSize={7}
                  fontFamily={FONT_MONO}
                >
                  {gpu.label}
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={PLOT_LEFT + PLOT_WIDTH / 2}
            y={PLOT_BOTTOM + 42}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize={13}
            fontFamily={FONT_MONO}
          >
            GPU memory required
          </text>

          {/* Bars */}
          {methods.map((method, mi) => {
            const y = barY(mi);
            let xOffset = PLOT_LEFT;
            const isHovered = hoveredBar === method.id;

            return (
              <g
                key={method.id}
                onMouseEnter={() => setHoveredBar(method.id)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Method label */}
                <text
                  x={PLOT_LEFT - 6}
                  y={y + barWidth / 2 + 4}
                  textAnchor="end"
                  fill={
                    method.id === "full"
                      ? "rgba(239,68,68,0.7)"
                      : method.id === "lora"
                        ? ACCENT
                        : "rgba(168,85,247,0.7)"
                  }
                  fontSize={13}
                  fontFamily={FONT_MONO}
                  fontWeight="bold"
                >
                  {method.label}
                </text>

                {/* Stacked segments */}
                {method.segments.map((seg, si) => {
                  const segWidth = (seg.value / maxMem) * PLOT_WIDTH;
                  const segX = xOffset;
                  xOffset += segWidth;

                  return (
                    <g key={si}>
                      <rect
                        x={segX}
                        y={y}
                        width={Math.max(1, segWidth)}
                        height={barWidth}
                        rx={si === 0 ? 3 : 0}
                        fill={seg.color}
                        opacity={isHovered ? 1 : 0.8}
                        stroke={isHovered ? "rgba(255,255,255,0.2)" : "none"}
                        strokeWidth={isHovered ? 0.5 : 0}
                      />
                      {/* Segment label (only if wide enough) */}
                      {segWidth > 35 && (
                        <text
                          x={segX + segWidth / 2}
                          y={y + barWidth / 2 + 3}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.7)"
                          fontSize={7}
                          fontFamily={FONT_MONO}
                        >
                          {formatGB(seg.value)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Total label at end of bar */}
                <text
                  x={toX(method.mem.total) + 6}
                  y={y + barWidth / 2 + 3}
                  textAnchor="start"
                  fill="rgba(255,255,255,0.6)"
                  fontSize={13}
                  fontFamily={FONT_MONO}
                  fontWeight="bold"
                >
                  {formatGB(method.mem.total)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Model weights", color: COLOR_MODEL },
          { label: "Gradients", color: COLOR_GRADIENTS },
          { label: "Optimizer states", color: COLOR_OPTIMIZER },
          { label: "Quantized model", color: COLOR_QUANT_MODEL },
          { label: "LoRA grads/opt", color: COLOR_LORA_GRAD },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: item.color,
              }}
            />
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Savings summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginTop: 14,
        }}
      >
        {[
          {
            label: "Full Fine-Tune",
            value: formatGB(fullMem.total),
            color: "rgba(239,68,68,1)",
            subtext: "baseline",
          },
          {
            label: "LoRA (r=16)",
            value: formatGB(loraMem.total),
            color: ACCENT,
            subtext: `${((1 - loraMem.total / fullMem.total) * 100).toFixed(0)}% savings`,
          },
          {
            label: "QLoRA (4-bit)",
            value: formatGB(qloraMem.total),
            color: "rgba(168,85,247,1)",
            subtext: `${((1 - qloraMem.total / fullMem.total) * 100).toFixed(0)}% savings`,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "8px 10px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.04)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: 15,
                color: item.color,
                fontWeight: "bold",
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.5)",
                marginTop: 2,
              }}
            >
              {item.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
