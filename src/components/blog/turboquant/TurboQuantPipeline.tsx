"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";
const ERROR_COLOR = "rgba(239,68,68,0.7)";

// Single-step focused view dimensions
const SVG_W = 560;
const SVG_H = 280;
const BOX_X = 16;
const BOX_Y = 16;
const BOX_W = SVG_W - 32;
const BOX_H = SVG_H - 32;
const BOX_R = 10;

const STAGE_COUNT = 5;
const VECTOR_LENGTH = 128;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const RAW_VALUES = [0.23, -0.87, 0.45, -0.12, 0.91, -0.56, 0.34, -0.78];
const ROTATED_VALUES = [0.61, -0.34, -0.72, 0.48, -0.15, 0.83, -0.59, 0.27];

// ---------------------------------------------------------------------------
// Quantization helpers
// ---------------------------------------------------------------------------

function lloydMaxLevels(bits: number): number[] {
  const levelCount = 1 << bits;
  const step = 2 / (levelCount - 1);
  return Array.from({ length: levelCount }, (_, i) => -1 + i * step);
}

function quantizeToNearestLevel(value: number, levels: number[]): number {
  let closest = levels[0];
  let minDist = Math.abs(value - closest);
  for (let i = 1; i < levels.length; i++) {
    const d = Math.abs(value - levels[i]);
    if (d < minDist) { minDist = d; closest = levels[i]; }
  }
  return closest;
}

function computeQuantizedValues(values: number[], bits: number) {
  const levels = lloydMaxLevels(bits);
  const quantized: number[] = [];
  const errors: number[] = [];
  const levelIndices: number[] = [];
  for (const value of values) {
    const nearest = quantizeToNearestLevel(value, levels);
    quantized.push(nearest);
    errors.push(value - nearest);
    levelIndices.push(levels.indexOf(nearest));
  }
  return { quantized, errors, levelIndices };
}

function computeQjlSignBits(errors: number[]): number[] {
  return errors.map((e) => (e >= 0 ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Stage metadata
// ---------------------------------------------------------------------------

const STAGES = [
  { title: "Input Vector",       subtitle: "KV Cache (FP32)",         description: "Raw floating-point KV cache values before any compression" },
  { title: "Random Rotation",    subtitle: "Orthogonal matrix Π",      description: "Random orthogonal rotation distributes outlier magnitude evenly across all dimensions" },
  { title: "Scalar Quantize",    subtitle: "Lloyd-Max (b−1 bits)",     description: "Optimal scalar quantization maps each rotated coordinate to the nearest discrete level" },
  { title: "QJL Correction",     subtitle: "1-bit sign projection",    description: "Quantized Johnson-Lindenstrauss projection captures the sign of each residual error" },
  { title: "Compressed Output",  subtitle: "Indices + sign bits",      description: "Final form: (b−1)-bit integer indices plus 1-bit QJL corrections = b bits total" },
];

// ---------------------------------------------------------------------------
// Large bar chart (full-stage width)
// ---------------------------------------------------------------------------

function BarChart({
  values, x, y, w, h, barColor, errorValues,
}: {
  values: number[]; x: number; y: number; w: number; h: number;
  barColor: string; errorValues?: number[];
}) {
  const n = values.length;
  const gap = 6;
  const barW = (w - gap * (n - 1)) / n;
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  const baseline = y + h / 2;

  return (
    <g>
      <line x1={x} y1={baseline} x2={x + w} y2={baseline}
        stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      {values.map((v, i) => {
        const bx = x + i * (barW + gap);
        const bh = (Math.abs(v) / maxAbs) * (h / 2 - 4);
        const by = v >= 0 ? baseline - bh : baseline;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={barW} height={bh} rx={2}
              fill={barColor} style={{ transition: "all 0.5s ease" }} />
            {errorValues && errorValues[i] !== undefined && (
              <rect
                x={bx}
                y={errorValues[i] >= 0 ? baseline - (Math.abs(errorValues[i]) / maxAbs) * (h / 2 - 4) : baseline}
                width={barW}
                height={(Math.abs(errorValues[i]) / maxAbs) * (h / 2 - 4)}
                rx={2} fill={ERROR_COLOR}
                style={{ transition: "all 0.5s ease" }}
              />
            )}
            <text x={bx + barW / 2} y={y + h + 16} textAnchor="middle"
              fill="rgba(255,255,255,0.35)" fontSize={9} fontFamily={FONT_MONO}>
              {v.toFixed(2)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Staircase level lines
// ---------------------------------------------------------------------------

function Staircase({ values, quantized, x, y, w, h }: {
  values: number[]; quantized: number[]; x: number; y: number; w: number; h: number;
}) {
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  const baseline = y + h / 2;
  const uniqueLevels = Array.from(new Set(quantized)).sort((a, b) => a - b);
  return (
    <g>
      {uniqueLevels.map((lv, i) => {
        const ly = lv >= 0
          ? baseline - (lv / maxAbs) * (h / 2 - 4)
          : baseline + (Math.abs(lv) / maxAbs) * (h / 2 - 4);
        return <line key={i} x1={x} y1={ly} x2={x + w} y2={ly}
          stroke="rgba(74,222,128,0.25)" strokeWidth={1} strokeDasharray="3 3" />;
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Sign bits grid
// ---------------------------------------------------------------------------

function SignBits({ signs, x, y, w }: { signs: number[]; x: number; y: number; w: number }) {
  const cell = Math.min(24, (w - 8) / signs.length);
  const total = cell * signs.length;
  const ox = x + (w - total) / 2;
  return (
    <g>
      {signs.map((s, i) => (
        <g key={i}>
          <rect x={ox + i * cell} y={y} width={cell - 2} height={cell - 2} rx={3}
            fill={s > 0 ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)"}
            stroke={s > 0 ? "rgba(74,222,128,0.4)" : "rgba(239,68,68,0.4)"}
            strokeWidth={1} />
          <text x={ox + i * cell + (cell - 2) / 2} y={y + (cell - 2) / 2 + 1}
            textAnchor="middle" dominantBaseline="central"
            fill={s > 0 ? ACCENT : ERROR_COLOR}
            fontSize={11} fontWeight={700} fontFamily={FONT_MONO}>
            {s > 0 ? "+" : "-"}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Integer index display
// ---------------------------------------------------------------------------

function IndexRow({ indices, x, y, w }: { indices: number[]; x: number; y: number; w: number }) {
  const cell = Math.min(26, (w - 8) / indices.length);
  const total = cell * indices.length;
  const ox = x + (w - total) / 2;
  return (
    <g>
      {indices.map((idx, i) => (
        <g key={i}>
          <rect x={ox + i * cell} y={y} width={cell - 2} height={20} rx={3}
            fill="rgba(74,222,128,0.1)" stroke="rgba(74,222,128,0.3)" strokeWidth={1} />
          <text x={ox + i * cell + (cell - 2) / 2} y={y + 11}
            textAnchor="middle" dominantBaseline="central"
            fill={ACCENT} fontSize={10} fontFamily={FONT_MONO}>
            {idx}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb pill row
// ---------------------------------------------------------------------------

function Breadcrumb({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {STAGES.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{
            padding: "2px 10px",
            borderRadius: 99,
            fontSize: 10,
            fontFamily: FONT_MONO,
            fontWeight: i === active ? 700 : 400,
            letterSpacing: "0.02em",
            transition: "all 0.3s ease",
            background: i === active ? "rgba(74,222,128,0.15)" : i < active ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${i === active ? "rgba(74,222,128,0.5)" : i < active ? "rgba(74,222,128,0.2)" : BORDER}`,
            color: i === active ? ACCENT : i < active ? "rgba(74,222,128,0.6)" : TEXT_DIM,
          }}>
            {i + 1}. {s.title}
          </div>
          {i < STAGE_COUNT - 1 && (
            <span style={{ color: i < active ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)", fontSize: 10 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function Btn({ onClick, disabled, accent, children }: {
  onClick: () => void; disabled?: boolean; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: accent ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${accent ? "rgba(74,222,128,0.4)" : BORDER}`,
      borderRadius: 6, padding: "7px 18px",
      color: accent ? ACCENT : "rgba(255,255,255,0.7)",
      fontFamily: FONT_MONO, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.3 : 1, transition: "all 0.2s ease",
    }}>
      {children}
    </button>
  );
}

function BitSelector({ bits, onChange }: { bits: number; onChange: (b: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEXT_DIM }}>bits:</span>
      {[2, 3, 4].map((b) => (
        <button key={b} onClick={() => onChange(b)} style={{
          width: 30, height: 28, borderRadius: 4,
          border: `1px solid ${bits === b ? "rgba(74,222,128,0.5)" : BORDER}`,
          background: bits === b ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.03)",
          color: bits === b ? ACCENT : TEXT_DIM,
          fontFamily: FONT_MONO, fontSize: 13,
          fontWeight: bits === b ? 700 : 400, cursor: "pointer",
          transition: "all 0.2s ease",
        }}>{b}</button>
      ))}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      flex: "1 1 0", minWidth: 140,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${highlight ? "rgba(74,222,128,0.25)" : BORDER}`,
      borderRadius: 6, padding: "10px 14px",
    }}>
      <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4, fontFamily: FONT_MONO }}>{label}</div>
      <div style={{ fontSize: 15, color: highlight ? ACCENT : TEXT_BRIGHT, fontFamily: FONT_MONO, fontWeight: highlight ? 700 : 400 }}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage SVG content — rendered into the large focused box
// ---------------------------------------------------------------------------

function StageContent({ stage, qd, bits }: {
  stage: number;
  qd: { quantized: number[]; errors: number[]; levelIndices: number[]; signBits: number[] };
  bits: number;
}) {
  const cx = BOX_X + 24;
  const cw = BOX_W - 48;
  const chartY = BOX_Y + 68;
  const chartH = 110;

  if (stage === 0) {
    return (
      <g>
        <BarChart values={RAW_VALUES} x={cx} y={chartY} w={cw} h={chartH}
          barColor="rgba(255,255,255,0.4)" />
        <text x={BOX_X + BOX_W / 2} y={BOX_Y + BOX_H - 14} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily={FONT_MONO}>
          128-dim FP32 vector — 32 bits per value
        </text>
      </g>
    );
  }

  if (stage === 1) {
    return (
      <g>
        <BarChart values={ROTATED_VALUES} x={cx} y={chartY} w={cw} h={chartH}
          barColor="rgba(100,180,255,0.5)" />
        <text x={BOX_X + BOX_W / 2} y={chartY + chartH + 32} textAnchor="middle"
          fill="rgba(100,180,255,0.8)" fontSize={13} fontFamily={FONT_MONO}>
          x&apos; = Πx
        </text>
        <text x={BOX_X + BOX_W / 2} y={BOX_Y + BOX_H - 14} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily={FONT_MONO}>
          Outliers smoothed — coordinates now near-Gaussian
        </text>
      </g>
    );
  }

  if (stage === 2) {
    return (
      <g>
        <Staircase values={ROTATED_VALUES} quantized={qd.quantized}
          x={cx} y={chartY} w={cw} h={chartH} />
        <BarChart values={qd.quantized} x={cx} y={chartY} w={cw} h={chartH}
          barColor="rgba(74,222,128,0.45)" errorValues={qd.errors} />
        <text x={BOX_X + BOX_W / 2} y={chartY + chartH + 32} textAnchor="middle"
          fill={ERROR_COLOR} fontSize={11} fontFamily={FONT_MONO}>
          Red bars = quantization error (residual)
        </text>
        <text x={BOX_X + BOX_W / 2} y={BOX_Y + BOX_H - 14} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily={FONT_MONO}>
          {1 << (bits - 1)} levels using {bits - 1}-bit Lloyd-Max quantizer
        </text>
      </g>
    );
  }

  if (stage === 3) {
    return (
      <g>
        <BarChart values={qd.errors} x={cx} y={chartY - 10} w={cw} h={80}
          barColor={ERROR_COLOR} />
        <text x={BOX_X + BOX_W / 2} y={chartY + 84} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily={FONT_MONO}>
          sign() ↓
        </text>
        <SignBits signs={qd.signBits} x={cx} y={chartY + 96} w={cw} />
        <text x={BOX_X + BOX_W / 2} y={BOX_Y + BOX_H - 14} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily={FONT_MONO}>
          1 bit per coordinate captures error direction — eliminates bias
        </text>
      </g>
    );
  }

  // stage === 4
  return (
    <g>
      <text x={BOX_X + BOX_W / 2} y={chartY - 4} textAnchor="middle"
        fill={ACCENT} fontSize={11} fontFamily={FONT_MONO}>
        Quantized indices ({bits - 1}-bit)
      </text>
      <IndexRow indices={qd.levelIndices} x={cx} y={chartY + 8} w={cw} />

      <text x={BOX_X + BOX_W / 2} y={chartY + 48} textAnchor="middle"
        fill="rgba(255,255,255,0.25)" fontSize={13} fontFamily={FONT_MONO}>+</text>

      <text x={BOX_X + BOX_W / 2} y={chartY + 68} textAnchor="middle"
        fill="rgba(250,204,21,0.8)" fontSize={11} fontFamily={FONT_MONO}>
        QJL sign bits (1-bit)
      </text>
      <SignBits signs={qd.signBits} x={cx} y={chartY + 76} w={cw} />

      <rect x={BOX_X + BOX_W / 2 - 90} y={chartY + 122}
        width={180} height={32} rx={6}
        fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.25)" strokeWidth={1} />
      <text x={BOX_X + BOX_W / 2} y={chartY + 136} textAnchor="middle"
        fill={ACCENT} fontSize={12} fontWeight={700} fontFamily={FONT_MONO}>
        32-bit → {bits}-bit · {Math.round(32 / bits)}× compression
      </text>
      <text x={BOX_X + BOX_W / 2} y={chartY + 148} textAnchor="middle"
        fill="rgba(74,222,128,0.6)" fontSize={10} fontFamily={FONT_MONO}>
        ({bits - 1}-bit indices + 1-bit QJL = {bits} bits total)
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TurboQuantPipeline() {
  const [step, setStep] = useState(0);
  const [bits, setBits] = useState(4);

  const qd = useMemo(() => {
    const { quantized, errors, levelIndices } = computeQuantizedValues(ROTATED_VALUES, bits - 1);
    const signBits = computeQjlSignBits(errors);
    return { quantized, errors, levelIndices, signBits };
  }, [bits]);

  const originalBytes = VECTOR_LENGTH * 4;
  const compressedBytes = Math.ceil((VECTOR_LENGTH * bits) / 8);
  const ratio = Math.round(32 / bits);

  return (
    <div className="not-prose my-8" style={{ background: BG, borderRadius: 12, overflow: "hidden", fontFamily: FONT_MONO }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>
          TurboQuant two-stage compression pipeline
        </span>
        <BitSelector bits={bits} onChange={setBits} />
      </div>

      {/* Breadcrumb */}
      <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", overflowX: "auto" }}>
        <Breadcrumb active={step} />
      </div>

      {/* Focused single-step SVG */}
      <div style={{ width: "100%", padding: "0 8px" }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: "100%", display: "block" }}
          preserveAspectRatio="xMidYMid meet">

          {/* Box */}
          <rect x={BOX_X} y={BOX_Y} width={BOX_W} height={BOX_H} rx={BOX_R}
            fill="rgba(74,222,128,0.04)" stroke={ACCENT} strokeWidth={1.5} />

          {/* Stage number badge */}
          <circle cx={BOX_X + 20} cy={BOX_Y + 20} r={11}
            fill={ACCENT} />
          <text x={BOX_X + 20} y={BOX_Y + 25} textAnchor="middle"
            fill="#000" fontSize={12} fontWeight={800} fontFamily={FONT_MONO}>
            {step + 1}
          </text>

          {/* Title */}
          <text x={BOX_X + 42} y={BOX_Y + 22} textAnchor="start"
            fill={TEXT_BRIGHT} fontSize={15} fontWeight={700} fontFamily={FONT_MONO}>
            {STAGES[step].title}
          </text>

          {/* Subtitle */}
          <text x={BOX_X + 42} y={BOX_Y + 38} textAnchor="start"
            fill="rgba(74,222,128,0.7)" fontSize={11} fontFamily={FONT_MONO}>
            {STAGES[step].subtitle}
          </text>

          {/* Stage content */}
          <StageContent stage={step} qd={qd} bits={bits} />
        </svg>
      </div>

      {/* Navigation */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Prev</Btn>
          <Btn onClick={() => setStep(0)} disabled={step === 0}>Reset</Btn>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEXT_DIM }}>
          Step {step + 1} of {STAGE_COUNT}
        </span>
        <Btn onClick={() => setStep(s => Math.min(STAGE_COUNT - 1, s + 1))}
          disabled={step === STAGE_COUNT - 1} accent>
          Next Step
        </Btn>
      </div>

      {/* Description */}
      <div style={{
        padding: "0 16px 10px",
        fontSize: 12, color: TEXT_DIM, fontFamily: FONT_MONO, lineHeight: 1.5,
      }}>
        {STAGES[step].description}
      </div>

      {/* Stats */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatCard label="Original size" value={`${VECTOR_LENGTH} × 32-bit = ${originalBytes} bytes`} />
        <StatCard label="Compressed" value={`${VECTOR_LENGTH} × ${bits}-bit = ${compressedBytes} bytes`} />
        <StatCard label="Compression ratio" value={`${ratio}×`} highlight />
      </div>
    </div>
  );
}
