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

const SVG_WIDTH = 900;
const SVG_HEIGHT = 320;

const STAGE_COUNT = 5;

const VECTOR_LENGTH = 128;

// ---------------------------------------------------------------------------
// Seed data: 8 representative values from the KV cache vector
// ---------------------------------------------------------------------------

const RAW_VALUES = [0.23, -0.87, 0.45, -0.12, 0.91, -0.56, 0.34, -0.78];

// Simulated rotation scrambles the ordering and magnitudes
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
  let minDistance = Math.abs(value - closest);
  for (let i = 1; i < levels.length; i++) {
    const distance = Math.abs(value - levels[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = levels[i];
    }
  }
  return closest;
}

function computeQuantizedValues(
  values: number[],
  bits: number
): { quantized: number[]; errors: number[]; levelIndices: number[] } {
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
// Stage layout constants
// ---------------------------------------------------------------------------

const STAGE_WIDTH = 148;
const STAGE_HEIGHT = 200;
const STAGE_GAP = 28;
const STAGE_START_X = 14;
const STAGE_Y = 50;
const STAGE_RADIUS = 8;

function stageX(index: number): number {
  return STAGE_START_X + index * (STAGE_WIDTH + STAGE_GAP);
}

// ---------------------------------------------------------------------------
// Stage metadata
// ---------------------------------------------------------------------------

interface StageInfo {
  title: string;
  subtitle: string;
}

const STAGES: StageInfo[] = [
  { title: "Input Vector", subtitle: "KV Cache (FP32)" },
  { title: "Random Rotation", subtitle: "Orthogonal Π" },
  { title: "Scalar Quantize", subtitle: "Lloyd-Max (b-1 bits)" },
  { title: "QJL Correction", subtitle: "1-bit sign projection" },
  { title: "Compressed Output", subtitle: "Integers + Sign Bits" },
];

// ---------------------------------------------------------------------------
// SVG sub-components
// ---------------------------------------------------------------------------

function StageBox({
  index,
  isActive,
  isCompleted,
  children,
}: {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  children: React.ReactNode;
}) {
  const x = stageX(index);
  const isVisible = isActive || isCompleted;

  return (
    <g
      style={{
        transition: "opacity 0.4s ease",
        opacity: isVisible ? 1 : 0.3,
      }}
    >
      {/* Glow filter when active */}
      {isActive && (
        <rect
          x={x - 3}
          y={STAGE_Y - 3}
          width={STAGE_WIDTH + 6}
          height={STAGE_HEIGHT + 6}
          rx={STAGE_RADIUS + 2}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
          opacity={0.6}
          style={{
            filter: "blur(4px)",
            transition: "opacity 0.4s ease",
          }}
        />
      )}

      {/* Box background */}
      <rect
        x={x}
        y={STAGE_Y}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        rx={STAGE_RADIUS}
        fill={isActive ? "rgba(74,222,128,0.06)" : "rgba(20,20,20,0.7)"}
        stroke={
          isActive
            ? ACCENT
            : isCompleted
            ? "rgba(74,222,128,0.25)"
            : BORDER
        }
        strokeWidth={isActive ? 1.5 : 1}
        style={{ transition: "all 0.4s ease" }}
      />

      {/* Stage number badge */}
      <circle
        cx={x + 16}
        cy={STAGE_Y + 16}
        r={9}
        fill={isActive ? ACCENT : isCompleted ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}
        style={{ transition: "fill 0.4s ease" }}
      />
      <text
        x={x + 16}
        y={STAGE_Y + 20}
        textAnchor="middle"
        fill={isActive ? "#000" : isCompleted ? "#fff" : TEXT_DIM}
        fontSize={10}
        fontWeight={700}
        fontFamily={FONT_MONO}
      >
        {index + 1}
      </text>

      {/* Title */}
      <text
        x={x + STAGE_WIDTH / 2}
        y={STAGE_Y + 38}
        textAnchor="middle"
        fill={isActive ? TEXT_BRIGHT : isCompleted ? "rgba(255,255,255,0.7)" : TEXT_DIM}
        fontSize={10}
        fontWeight={700}
        fontFamily={FONT_MONO}
        style={{ transition: "fill 0.4s ease" }}
      >
        {STAGES[index].title}
      </text>

      {/* Subtitle */}
      <text
        x={x + STAGE_WIDTH / 2}
        y={STAGE_Y + 52}
        textAnchor="middle"
        fill={isActive ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.3)"}
        fontSize={8}
        fontFamily={FONT_MONO}
        style={{ transition: "fill 0.4s ease" }}
      >
        {STAGES[index].subtitle}
      </text>

      {/* Content area */}
      <g>{children}</g>
    </g>
  );
}

function ConnectingArrow({
  fromStageIndex,
  isActive,
  isCompleted,
}: {
  fromStageIndex: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const x1 = stageX(fromStageIndex) + STAGE_WIDTH;
  const x2 = stageX(fromStageIndex + 1);
  const y = STAGE_Y + STAGE_HEIGHT / 2;
  const arrowHeadSize = 5;

  const strokeColor = isActive
    ? ACCENT
    : isCompleted
    ? "rgba(74,222,128,0.35)"
    : "rgba(255,255,255,0.1)";

  return (
    <g style={{ transition: "opacity 0.4s ease" }}>
      <line
        x1={x1 + 2}
        y1={y}
        x2={x2 - arrowHeadSize - 2}
        y2={y}
        stroke={strokeColor}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? "none" : "4 3"}
        style={{ transition: "all 0.4s ease" }}
      />
      <polygon
        points={`${x2 - 2},${y} ${x2 - arrowHeadSize - 2},${y - arrowHeadSize} ${x2 - arrowHeadSize - 2},${y + arrowHeadSize}`}
        fill={strokeColor}
        style={{ transition: "fill 0.4s ease" }}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Bar chart inside a stage
// ---------------------------------------------------------------------------

function MiniBarChart({
  values,
  x,
  y,
  width,
  height,
  barColor,
  errorValues,
}: {
  values: number[];
  x: number;
  y: number;
  width: number;
  height: number;
  barColor: string;
  errorValues?: number[];
}) {
  const barCount = values.length;
  const barGap = 2;
  const barWidth = (width - barGap * (barCount - 1)) / barCount;
  const maxAbsValue = Math.max(...values.map(Math.abs), 0.01);
  const baseline = y + height / 2;

  return (
    <g>
      {/* Zero line */}
      <line
        x1={x}
        y1={baseline}
        x2={x + width}
        y2={baseline}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.5}
      />

      {values.map((value, i) => {
        const barX = x + i * (barWidth + barGap);
        const normalizedHeight = (Math.abs(value) / maxAbsValue) * (height / 2 - 2);
        const barY = value >= 0 ? baseline - normalizedHeight : baseline;

        return (
          <g key={i}>
            <rect
              x={barX}
              y={barY}
              width={barWidth}
              height={normalizedHeight}
              rx={1}
              fill={barColor}
              style={{
                transition: "all 0.5s ease",
              }}
            />
            {/* Error overlay */}
            {errorValues && errorValues[i] !== undefined && (
              <rect
                x={barX}
                y={
                  errorValues[i] >= 0
                    ? baseline - (Math.abs(errorValues[i]) / maxAbsValue) * (height / 2 - 2)
                    : baseline
                }
                width={barWidth}
                height={
                  (Math.abs(errorValues[i]) / maxAbsValue) * (height / 2 - 2)
                }
                rx={1}
                fill={ERROR_COLOR}
                style={{ transition: "all 0.5s ease" }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Sign bits display for QJL stage
// ---------------------------------------------------------------------------

function SignBitsDisplay({
  signs,
  x,
  y,
  width,
}: {
  signs: number[];
  x: number;
  y: number;
  width: number;
}) {
  const cellSize = Math.min(14, (width - 4) / signs.length);
  const totalWidth = cellSize * signs.length;
  const offsetX = x + (width - totalWidth) / 2;

  return (
    <g>
      {signs.map((sign, i) => (
        <g key={i}>
          <rect
            x={offsetX + i * cellSize}
            y={y}
            width={cellSize - 1}
            height={cellSize - 1}
            rx={2}
            fill={
              sign > 0 ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"
            }
            stroke={
              sign > 0 ? "rgba(74,222,128,0.4)" : "rgba(239,68,68,0.4)"
            }
            strokeWidth={0.5}
          />
          <text
            x={offsetX + i * cellSize + (cellSize - 1) / 2}
            y={y + (cellSize - 1) / 2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill={sign > 0 ? ACCENT : ERROR_COLOR}
            fontSize={7}
            fontWeight={700}
            fontFamily={FONT_MONO}
          >
            {sign > 0 ? "+" : "-"}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Compact integer indices display for compressed output
// ---------------------------------------------------------------------------

function IndexDisplay({
  indices,
  x,
  y,
  width,
}: {
  indices: number[];
  x: number;
  y: number;
  width: number;
}) {
  const cellSize = Math.min(16, (width - 4) / indices.length);
  const totalWidth = cellSize * indices.length;
  const offsetX = x + (width - totalWidth) / 2;

  return (
    <g>
      {indices.map((idx, i) => (
        <g key={i}>
          <rect
            x={offsetX + i * cellSize}
            y={y}
            width={cellSize - 1}
            height={14}
            rx={2}
            fill="rgba(74,222,128,0.1)"
            stroke="rgba(74,222,128,0.25)"
            strokeWidth={0.5}
          />
          <text
            x={offsetX + i * cellSize + (cellSize - 1) / 2}
            y={y + 8}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ACCENT}
            fontSize={7}
            fontFamily={FONT_MONO}
          >
            {idx}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Quantization staircase overlay
// ---------------------------------------------------------------------------

function StaircaseOverlay({
  values,
  quantized,
  x,
  y,
  width,
  height,
}: {
  values: number[];
  quantized: number[];
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const maxAbsValue = Math.max(...values.map(Math.abs), 0.01);
  const baseline = y + height / 2;

  // Draw horizontal dashed lines at each quantized level
  const uniqueLevels = Array.from(new Set(quantized)).sort((a, b) => a - b);

  return (
    <g>
      {uniqueLevels.map((level, i) => {
        const levelY =
          level >= 0
            ? baseline - (level / maxAbsValue) * (height / 2 - 2)
            : baseline + (Math.abs(level) / maxAbsValue) * (height / 2 - 2);

        return (
          <line
            key={i}
            x1={x}
            y1={levelY}
            x2={x + width}
            y2={levelY}
            stroke="rgba(74,222,128,0.2)"
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Navigation controls
// ---------------------------------------------------------------------------

function StepDots({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: STAGE_COUNT }, (_, i) => (
        <div
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_MONO,
            fontSize: 10,
            fontWeight: 600,
            transition: "all 0.3s ease",
            backgroundColor:
              i === currentStep ? ACCENT : "rgba(255,255,255,0.06)",
            color: i === currentStep ? "#000" : "rgba(255,255,255,0.35)",
            border:
              i === currentStep
                ? `1px solid ${ACCENT}`
                : i < currentStep
                ? "1px solid rgba(74,222,128,0.3)"
                : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function PipelineButton({
  onClick,
  disabled,
  variant = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "accent";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:
          variant === "accent"
            ? "rgba(74,222,128,0.15)"
            : "rgba(255,255,255,0.05)",
        border: `1px solid ${
          variant === "accent" ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.2)"
        }`,
        borderRadius: 6,
        padding: "6px 14px",
        color:
          variant === "accent" ? ACCENT : "rgba(255,255,255,0.7)",
        fontFamily: FONT_MONO,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "all 0.2s ease",
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </button>
  );
}

function BitSelector({
  bits,
  onChange,
}: {
  bits: number;
  onChange: (bits: number) => void;
}) {
  const options = [2, 3, 4];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: TEXT_DIM,
        }}
      >
        bits:
      </span>
      {options.map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          style={{
            width: 28,
            height: 26,
            borderRadius: 4,
            border: `1px solid ${
              bits === b ? "rgba(74,222,128,0.5)" : BORDER
            }`,
            background:
              bits === b ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.03)",
            color: bits === b ? ACCENT : TEXT_DIM,
            fontFamily: FONT_MONO,
            fontSize: 12,
            fontWeight: bits === b ? 700 : 400,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {b}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 140,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${highlight ? "rgba(74,222,128,0.25)" : BORDER}`,
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: TEXT_DIM,
          marginBottom: 4,
          fontFamily: FONT_MONO,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          color: highlight ? ACCENT : TEXT_BRIGHT,
          fontFamily: FONT_MONO,
          fontWeight: highlight ? 700 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TurboQuantPipeline() {
  const [activeStage, setActiveStage] = useState(0);
  const [bits, setBits] = useState(4);

  // Derived quantization data, recomputed when bits change
  const quantizationData = useMemo(() => {
    const { quantized, errors, levelIndices } = computeQuantizedValues(
      ROTATED_VALUES,
      bits - 1 // TurboQuant uses b-1 bits for scalar quantization
    );
    const signBits = computeQjlSignBits(errors);
    return { quantized, errors, levelIndices, signBits };
  }, [bits]);

  // Compression stats
  const originalSizeBytes = useMemo(() => VECTOR_LENGTH * 4, []);
  const compressedSizeBytes = useMemo(
    () => Math.ceil((VECTOR_LENGTH * bits) / 8),
    [bits]
  );
  const compressionRatio = useMemo(
    () => (32 / bits).toFixed(0),
    [bits]
  );

  const advanceStage = () =>
    setActiveStage((s) => Math.min(STAGE_COUNT - 1, s + 1));
  const retreatStage = () => setActiveStage((s) => Math.max(0, s - 1));
  const resetPipeline = () => setActiveStage(0);

  // ---------------------------------------------------------------------------
  // Stage content renderers
  // ---------------------------------------------------------------------------

  function renderInputVector() {
    const sx = stageX(0);
    const contentX = sx + 8;
    const contentY = STAGE_Y + 64;
    const contentWidth = STAGE_WIDTH - 16;
    const contentHeight = 80;

    return (
      <g>
        <MiniBarChart
          values={RAW_VALUES}
          x={contentX}
          y={contentY}
          width={contentWidth}
          height={contentHeight}
          barColor="rgba(255,255,255,0.35)"
        />
        {/* Float labels beneath bars */}
        {RAW_VALUES.map((v, i) => {
          const barGap = 2;
          const barWidth =
            (contentWidth - barGap * (RAW_VALUES.length - 1)) /
            RAW_VALUES.length;
          return (
            <text
              key={i}
              x={contentX + i * (barWidth + barGap) + barWidth / 2}
              y={contentY + contentHeight + 12}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize={6}
              fontFamily={FONT_MONO}
            >
              {v.toFixed(1)}
            </text>
          );
        })}
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + STAGE_HEIGHT - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          128-dim FP32 vector
        </text>
      </g>
    );
  }

  function renderRotation() {
    const sx = stageX(1);
    const contentX = sx + 8;
    const contentY = STAGE_Y + 64;
    const contentWidth = STAGE_WIDTH - 16;
    const contentHeight = 80;

    return (
      <g>
        <MiniBarChart
          values={ROTATED_VALUES}
          x={contentX}
          y={contentY}
          width={contentWidth}
          height={contentHeight}
          barColor="rgba(100,180,255,0.45)"
        />
        {/* Rotation symbol */}
        <text
          x={sx + STAGE_WIDTH / 2}
          y={contentY + contentHeight + 14}
          textAnchor="middle"
          fill="rgba(100,180,255,0.6)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          x&apos; = Πx
        </text>
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + STAGE_HEIGHT - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          Flattens outliers
        </text>
      </g>
    );
  }

  function renderScalarQuantization() {
    const sx = stageX(2);
    const contentX = sx + 8;
    const contentY = STAGE_Y + 64;
    const contentWidth = STAGE_WIDTH - 16;
    const contentHeight = 80;

    return (
      <g>
        <StaircaseOverlay
          values={ROTATED_VALUES}
          quantized={quantizationData.quantized}
          x={contentX}
          y={contentY}
          width={contentWidth}
          height={contentHeight}
        />
        <MiniBarChart
          values={quantizationData.quantized}
          x={contentX}
          y={contentY}
          width={contentWidth}
          height={contentHeight}
          barColor="rgba(74,222,128,0.4)"
          errorValues={quantizationData.errors}
        />
        <text
          x={sx + STAGE_WIDTH / 2}
          y={contentY + contentHeight + 14}
          textAnchor="middle"
          fill={ERROR_COLOR}
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          red = quantization error
        </text>
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + STAGE_HEIGHT - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          {1 << (bits - 1)} levels ({bits - 1}-bit)
        </text>
      </g>
    );
  }

  function renderQjlCorrection() {
    const sx = stageX(3);
    const contentX = sx + 8;
    const contentY = STAGE_Y + 68;
    const contentWidth = STAGE_WIDTH - 16;

    return (
      <g>
        {/* Residual error bars (small) */}
        <MiniBarChart
          values={quantizationData.errors}
          x={contentX}
          y={contentY}
          width={contentWidth}
          height={50}
          barColor={ERROR_COLOR}
        />
        {/* Arrow down to sign bits */}
        <line
          x1={sx + STAGE_WIDTH / 2}
          y1={contentY + 54}
          x2={sx + STAGE_WIDTH / 2}
          y2={contentY + 64}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          markerEnd="none"
        />
        <text
          x={sx + STAGE_WIDTH / 2}
          y={contentY + 60}
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          sign()
        </text>
        {/* Sign bits grid */}
        <SignBitsDisplay
          signs={quantizationData.signBits}
          x={contentX}
          y={contentY + 70}
          width={contentWidth}
        />
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + STAGE_HEIGHT - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          1-bit error correction
        </text>
      </g>
    );
  }

  function renderCompressedOutput() {
    const sx = stageX(4);
    const contentX = sx + 8;
    const contentWidth = STAGE_WIDTH - 16;

    return (
      <g>
        {/* Integer indices row */}
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + 68}
          textAnchor="middle"
          fill={ACCENT}
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          Quantized indices
        </text>
        <IndexDisplay
          indices={quantizationData.levelIndices}
          x={contentX}
          y={STAGE_Y + 74}
          width={contentWidth}
        />

        {/* Plus sign */}
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + 100}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={10}
          fontFamily={FONT_MONO}
        >
          +
        </text>

        {/* Sign bits row */}
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + 115}
          textAnchor="middle"
          fill="rgba(250,204,21,0.7)"
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          QJL sign bits
        </text>
        <SignBitsDisplay
          signs={quantizationData.signBits}
          x={contentX}
          y={STAGE_Y + 121}
          width={contentWidth}
        />

        {/* Compression ratio callout */}
        <rect
          x={sx + 10}
          y={STAGE_Y + 148}
          width={STAGE_WIDTH - 20}
          height={28}
          rx={4}
          fill="rgba(74,222,128,0.08)"
          stroke="rgba(74,222,128,0.2)"
          strokeWidth={0.5}
        />
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + 160}
          textAnchor="middle"
          fill={ACCENT}
          fontSize={8}
          fontWeight={700}
          fontFamily={FONT_MONO}
        >
          {`32-bit → ${bits}-bit`}
        </text>
        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + 171}
          textAnchor="middle"
          fill={ACCENT}
          fontSize={9}
          fontWeight={700}
          fontFamily={FONT_MONO}
        >
          {compressionRatio}x compression
        </text>

        <text
          x={sx + STAGE_WIDTH / 2}
          y={STAGE_Y + STAGE_HEIGHT - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={7}
          fontFamily={FONT_MONO}
        >
          Compact representation
        </text>
      </g>
    );
  }

  const stageRenderers = [
    renderInputVector,
    renderRotation,
    renderScalarQuantization,
    renderQjlCorrection,
    renderCompressedOutput,
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="not-prose my-8"
      style={{
        background: BG,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: FONT_MONO,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: "12px 16px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          TurboQuant two-stage compression pipeline
        </span>
        <BitSelector bits={bits} onChange={setBits} />
      </div>

      {/* SVG pipeline */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          padding: "0 8px",
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{
            width: "100%",
            minWidth: 600,
            display: "block",
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Title */}
          <text
            x={SVG_WIDTH / 2}
            y={24}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize={10}
            fontFamily={FONT_MONO}
          >
            Step {activeStage + 1} of {STAGE_COUNT}:{" "}
            {STAGES[activeStage].title}
          </text>

          {/* Connecting arrows between stages */}
          {Array.from({ length: STAGE_COUNT - 1 }, (_, i) => (
            <ConnectingArrow
              key={i}
              fromStageIndex={i}
              isActive={i === activeStage - 1}
              isCompleted={i < activeStage - 1}
            />
          ))}

          {/* Stage boxes with content */}
          {STAGES.map((_, i) => (
            <StageBox
              key={i}
              index={i}
              isActive={i === activeStage}
              isCompleted={i < activeStage}
            >
              {stageRenderers[i]()}
            </StageBox>
          ))}

          {/* Description text at bottom */}
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT - 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={9}
            fontFamily={FONT_MONO}
          >
            {activeStage === 0 &&
              "Raw floating-point KV cache values before compression"}
            {activeStage === 1 &&
              "Random orthogonal rotation distributes outlier magnitude across dimensions"}
            {activeStage === 2 &&
              "Lloyd-Max optimal scalar quantization maps rotated values to discrete levels"}
            {activeStage === 3 &&
              "Quantized Johnson-Lindenstrauss projection captures residual error direction"}
            {activeStage === 4 &&
              `Final compressed form: ${bits - 1}-bit indices + 1-bit corrections = ${bits}-bit total`}
          </text>
        </svg>
      </div>

      {/* Navigation controls */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <PipelineButton onClick={retreatStage} disabled={activeStage === 0}>
            Prev
          </PipelineButton>
          <PipelineButton onClick={resetPipeline} disabled={activeStage === 0}>
            Reset
          </PipelineButton>
        </div>

        <StepDots currentStep={activeStage} />

        <PipelineButton
          onClick={advanceStage}
          disabled={activeStage === STAGE_COUNT - 1}
          variant="accent"
        >
          Next Step
        </PipelineButton>
      </div>

      {/* Stats row */}
      <div
        style={{
          padding: "0 16px 16px",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <StatCard
          label="Original size"
          value={`${VECTOR_LENGTH} × 32-bit = ${originalSizeBytes} bytes`}
        />
        <StatCard
          label="Compressed"
          value={`${VECTOR_LENGTH} × ${bits}-bit = ${compressedSizeBytes} bytes`}
        />
        <StatCard
          label="Compression ratio"
          value={`${compressionRatio}×`}
          highlight
        />
      </div>
    </div>
  );
}
