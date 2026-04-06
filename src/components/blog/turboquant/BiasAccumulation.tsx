"use client";

import { useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";

const COLOR_TRUE = "rgba(255,255,255,0.45)";
const COLOR_BIASED = "rgba(251,146,60,0.75)";
const COLOR_UNBIASED = "rgba(74,222,128,0.7)";

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;

const SEQUENCE_LENGTH_OPTIONS = [8, 16, 32, 64, 128] as const;
type SequenceLength = (typeof SEQUENCE_LENGTH_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Seeded random number generator (LCG for reproducibility)
// ---------------------------------------------------------------------------

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Box-Muller transform: uniform -> Gaussian samples
// ---------------------------------------------------------------------------

function gaussianSample(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ---------------------------------------------------------------------------
// Data generation: true attention scores with clear "winners"
// ---------------------------------------------------------------------------

function generateTrueScores(numKeys: number, seed: number): number[] {
  const rand = createSeededRandom(seed);
  const scores: number[] = [];

  // Position 0 is the "winner" (~2.0), positions 1-2 are runners-up (~1.5),
  // the rest are uniformly sampled between -0.5 and 1.0
  for (let i = 0; i < numKeys; i++) {
    if (i === 0) {
      scores.push(2.0 + rand() * 0.2);
    } else if (i === 1 || i === 2) {
      scores.push(1.4 + rand() * 0.3);
    } else {
      scores.push(-0.5 + rand() * 1.5);
    }
  }

  return scores;
}

// ---------------------------------------------------------------------------
// Biased quantization: adds a constant positive bias to every score
// ---------------------------------------------------------------------------

function addConstantBias(scores: number[], bias: number): number[] {
  return scores.map((s) => s + bias);
}

// ---------------------------------------------------------------------------
// Unbiased quantization: adds zero-mean Gaussian noise (same variance as bias)
// ---------------------------------------------------------------------------

function addUnbiasedNoise(
  scores: number[],
  biasMagnitude: number,
  seed: number,
): number[] {
  const rand = createSeededRandom(seed);
  return scores.map((s) => s + gaussianSample(rand) * biasMagnitude);
}

// ---------------------------------------------------------------------------
// Softmax
// ---------------------------------------------------------------------------

function softmax(scores: number[]): number[] {
  const maxScore = Math.max(...scores);
  const exponents = scores.map((s) => Math.exp(s - maxScore));
  const sumExp = exponents.reduce((sum, e) => sum + e, 0);
  return exponents.map((e) => e / sumExp);
}

// ---------------------------------------------------------------------------
// KL divergence: D_KL(true || approx) = sum true_i * log(true_i / approx_i)
// ---------------------------------------------------------------------------

function klDivergence(
  trueDistribution: number[],
  approxDistribution: number[],
): number {
  let kl = 0;
  for (let i = 0; i < trueDistribution.length; i++) {
    const p = trueDistribution[i];
    const q = Math.max(approxDistribution[i], 1e-12);
    if (p > 1e-12) {
      kl += p * Math.log(p / q);
    }
  }
  return kl;
}

// ---------------------------------------------------------------------------
// Find the position with the highest true weight (the "correct" top-1)
// ---------------------------------------------------------------------------

function argmax(values: number[]): number {
  let maxIndex = 0;
  let maxValue = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > maxValue) {
      maxValue = values[i];
      maxIndex = i;
    }
  }
  return maxIndex;
}

// ---------------------------------------------------------------------------
// Compute attention on "correct" positions (top-3 true scores)
// ---------------------------------------------------------------------------

function attentionOnCorrectPositions(
  weights: number[],
  trueScores: number[],
  topK: number,
): number {
  const indexed = trueScores.map((s, i) => ({ score: s, index: i }));
  indexed.sort((a, b) => b.score - a.score);
  const topIndices = new Set(indexed.slice(0, topK).map((d) => d.index));

  let totalWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    if (topIndices.has(i)) {
      totalWeight += weights[i];
    }
  }
  return totalWeight;
}

// ---------------------------------------------------------------------------
// Layout constants for the two chart sections
// ---------------------------------------------------------------------------

const MARGIN = { top: 16, right: 20, bottom: 16, left: 48 };

const CHART_TOP_Y = 36;
const CHART_TOP_HEIGHT = 180;
const CHART_BOTTOM_Y = 268;
const CHART_BOTTOM_HEIGHT = 180;

const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = SVG_WIDTH - MARGIN.right;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

// ---------------------------------------------------------------------------
// Bar chart renderer (reusable for both sections)
// ---------------------------------------------------------------------------

interface BarChartProps {
  chartY: number;
  chartHeight: number;
  title: string;
  numKeys: number;
  trueValues: number[];
  biasedValues: number[];
  unbiasedValues: number[];
  yMin: number;
  yMax: number;
  formatYTick: (value: number) => string;
  annotationIndex?: number;
  annotationLabel?: string;
}

function BarChart({
  chartY,
  chartHeight,
  title,
  numKeys,
  trueValues,
  biasedValues,
  unbiasedValues,
  yMin,
  yMax,
  formatYTick,
  annotationIndex,
  annotationLabel,
}: BarChartProps) {
  const plotTop = chartY + 20;
  const plotBottom = chartY + chartHeight - 4;
  const plotHeight = plotBottom - plotTop;

  const groupWidth = PLOT_WIDTH / numKeys;
  const barWidth = Math.max(groupWidth * 0.22, 1.5);
  const groupPadding = groupWidth * 0.17;

  function toY(value: number): number {
    const fraction = (value - yMin) / (yMax - yMin);
    return plotBottom - fraction * plotHeight;
  }

  // Y-axis ticks: 4-5 evenly spaced values
  const yTickCount = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + (i / yTickCount) * (yMax - yMin));
  }

  // Zero line position (if within range)
  const hasZeroLine = yMin < 0 && yMax > 0;

  return (
    <g>
      {/* Section title */}
      <text
        x={PLOT_LEFT}
        y={chartY + 12}
        fill={TEXT_BRIGHT}
        fontSize={11}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        {title}
      </text>

      {/* Plot background */}
      <rect
        x={PLOT_LEFT}
        y={plotTop}
        width={PLOT_WIDTH}
        height={plotHeight}
        fill="rgba(255,255,255,0.015)"
        stroke={BORDER}
        strokeWidth={0.5}
        rx={2}
      />

      {/* Horizontal grid lines */}
      {yTicks.map((tick, i) => (
        <line
          key={i}
          x1={PLOT_LEFT}
          y1={toY(tick)}
          x2={PLOT_RIGHT}
          y2={toY(tick)}
          stroke={BORDER}
          strokeWidth={0.3}
        />
      ))}

      {/* Zero line */}
      {hasZeroLine && (
        <line
          x1={PLOT_LEFT}
          y1={toY(0)}
          x2={PLOT_RIGHT}
          y2={toY(0)}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => (
        <text
          key={i}
          x={PLOT_LEFT - 6}
          y={toY(tick) + 3}
          textAnchor="end"
          fill={TEXT_DIM}
          fontSize={8}
          fontFamily={FONT_MONO}
        >
          {formatYTick(tick)}
        </text>
      ))}

      {/* Bars for each key position */}
      {trueValues.map((_, keyIndex) => {
        const groupX = PLOT_LEFT + keyIndex * groupWidth + groupPadding;

        const trueBarX = groupX;
        const biasedBarX = groupX + barWidth + 1;
        const unbiasedBarX = groupX + 2 * (barWidth + 1);

        function barRect(
          x: number,
          value: number,
          fill: string,
          stroke: string,
        ) {
          const barY = toY(Math.max(value, 0));
          const barBottomY = hasZeroLine
            ? toY(Math.min(value, 0))
            : plotBottom;
          const height = Math.max(barBottomY - barY, 0.5);

          return (
            <rect
              x={x}
              y={barY}
              width={barWidth}
              height={height}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.3}
              rx={0.5}
            />
          );
        }

        return (
          <g key={keyIndex}>
            {barRect(trueBarX, trueValues[keyIndex], COLOR_TRUE, "rgba(255,255,255,0.2)")}
            {barRect(biasedBarX, biasedValues[keyIndex], COLOR_BIASED, "rgba(251,146,60,0.4)")}
            {barRect(unbiasedBarX, unbiasedValues[keyIndex], COLOR_UNBIASED, "rgba(74,222,128,0.4)")}
          </g>
        );
      })}

      {/* X-axis position labels (show subset for large N) */}
      {trueValues.map((_, keyIndex) => {
        const labelInterval =
          numKeys <= 16 ? 1 : numKeys <= 32 ? 2 : numKeys <= 64 ? 4 : 8;
        if (keyIndex % labelInterval !== 0) return null;

        const groupCenter = PLOT_LEFT + keyIndex * groupWidth + groupWidth / 2;
        return (
          <text
            key={keyIndex}
            x={groupCenter}
            y={plotBottom + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize={numKeys <= 32 ? 7 : 6}
            fontFamily={FONT_MONO}
          >
            {keyIndex}
          </text>
        );
      })}

      {/* Annotation callout for the most affected position */}
      {annotationIndex !== undefined && annotationLabel && (
        <AnnotationCallout
          x={PLOT_LEFT + annotationIndex * groupWidth + groupWidth / 2}
          y={toY(Math.max(
            trueValues[annotationIndex],
            biasedValues[annotationIndex],
            unbiasedValues[annotationIndex],
          ))}
          label={annotationLabel}
          chartY={chartY}
        />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Annotation callout — a label with a line pointing to a bar
// ---------------------------------------------------------------------------

function AnnotationCallout({
  x,
  y,
  label,
  chartY,
}: {
  x: number;
  y: number;
  label: string;
  chartY: number;
}) {
  // Position the label above the bar, but keep it within the chart
  const labelY = Math.max(chartY + 28, y - 16);
  const labelX = Math.min(x + 8, PLOT_RIGHT - 140);

  return (
    <g>
      <line
        x1={x}
        y1={y - 2}
        x2={labelX + 2}
        y2={labelY + 4}
        stroke="rgba(251,146,60,0.5)"
        strokeWidth={0.7}
        strokeDasharray="2 2"
      />
      <text
        x={labelX + 4}
        y={labelY}
        fill={COLOR_BIASED}
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        {label}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BiasAccumulation() {
  const [sequenceLength, setSequenceLength] = useState<SequenceLength>(16);
  const [biasMagnitude, setBiasMagnitude] = useState(0.15);
  const [noiseSeed, setNoiseSeed] = useState(101);

  // -------------------------------------------------------------------------
  // Compute all derived data
  // -------------------------------------------------------------------------

  const trueScores = useMemo(
    () => generateTrueScores(sequenceLength, 42),
    [sequenceLength],
  );

  const biasedScores = useMemo(
    () => addConstantBias(trueScores, biasMagnitude),
    [trueScores, biasMagnitude],
  );

  const unbiasedScores = useMemo(
    () => addUnbiasedNoise(trueScores, biasMagnitude, noiseSeed),
    [trueScores, biasMagnitude, noiseSeed],
  );

  const trueWeights = useMemo(() => softmax(trueScores), [trueScores]);
  const biasedWeights = useMemo(() => softmax(biasedScores), [biasedScores]);
  const unbiasedWeights = useMemo(
    () => softmax(unbiasedScores),
    [unbiasedScores],
  );

  // -------------------------------------------------------------------------
  // Statistics
  // -------------------------------------------------------------------------

  const klBiased = useMemo(
    () => klDivergence(trueWeights, biasedWeights),
    [trueWeights, biasedWeights],
  );

  const klUnbiased = useMemo(
    () => klDivergence(trueWeights, unbiasedWeights),
    [trueWeights, unbiasedWeights],
  );

  const trueTop1 = useMemo(() => argmax(trueWeights), [trueWeights]);
  const biasedTop1 = useMemo(() => argmax(biasedWeights), [biasedWeights]);
  const unbiasedTop1 = useMemo(
    () => argmax(unbiasedWeights),
    [unbiasedWeights],
  );

  const biasedTop1Correct = biasedTop1 === trueTop1;
  const unbiasedTop1Correct = unbiasedTop1 === trueTop1;

  const trueCorrectAttention = useMemo(
    () => attentionOnCorrectPositions(trueWeights, trueScores, 3),
    [trueWeights, trueScores],
  );

  const biasedCorrectAttention = useMemo(
    () => attentionOnCorrectPositions(biasedWeights, trueScores, 3),
    [biasedWeights, trueScores],
  );

  const unbiasedCorrectAttention = useMemo(
    () => attentionOnCorrectPositions(unbiasedWeights, trueScores, 3),
    [unbiasedWeights, trueScores],
  );

  // -------------------------------------------------------------------------
  // Chart Y-axis ranges
  // -------------------------------------------------------------------------

  const allScores = [...trueScores, ...biasedScores, ...unbiasedScores];
  const scoreMin = Math.floor(Math.min(...allScores) * 2) / 2;
  const scoreMax = Math.ceil(Math.max(...allScores) * 2) / 2;

  const allWeights = [...trueWeights, ...biasedWeights, ...unbiasedWeights];
  const weightMax = Math.ceil(Math.max(...allWeights) * 20) / 20;

  // -------------------------------------------------------------------------
  // Annotation for the most-affected position after softmax
  // -------------------------------------------------------------------------

  const annotationLabel = useMemo(() => {
    const truePercent = (trueWeights[trueTop1] * 100).toFixed(1);
    const biasedPercent = (biasedWeights[trueTop1] * 100).toFixed(1);
    return `Biased: ${biasedPercent}% (should be ${truePercent}%)`;
  }, [trueWeights, biasedWeights, trueTop1]);

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  const handleSequenceLengthChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sliderIndex = parseInt(event.target.value, 10);
      setSequenceLength(SEQUENCE_LENGTH_OPTIONS[sliderIndex]);
    },
    [],
  );

  const handleBiasMagnitudeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setBiasMagnitude(parseFloat(event.target.value));
    },
    [],
  );

  const handleResample = useCallback(() => {
    setNoiseSeed((prev) => prev + 1);
  }, []);

  const sequenceLengthSliderIndex =
    SEQUENCE_LENGTH_OPTIONS.indexOf(sequenceLength);

  return (
    <div
      style={{
        background: BG,
        padding: "20px 16px 16px",
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
        Why Bias in Quantized Inner Products Is Dangerous
      </div>

      {/* SVG visualization */}
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
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Top chart: raw attention scores before softmax */}
          <BarChart
            chartY={CHART_TOP_Y}
            chartHeight={CHART_TOP_HEIGHT}
            title="Attention Scores (Before Softmax)"
            numKeys={sequenceLength}
            trueValues={trueScores}
            biasedValues={biasedScores}
            unbiasedValues={unbiasedScores}
            yMin={scoreMin}
            yMax={scoreMax}
            formatYTick={(v) => v.toFixed(1)}
          />

          {/* Divider label */}
          <text
            x={SVG_WIDTH / 2}
            y={CHART_BOTTOM_Y - 12}
            textAnchor="middle"
            fill={TEXT_DIM}
            fontSize={9}
            fontFamily={FONT_MONO}
          >
            softmax
          </text>
          <line
            x1={PLOT_LEFT + 20}
            y1={CHART_BOTTOM_Y - 16}
            x2={SVG_WIDTH / 2 - 30}
            y2={CHART_BOTTOM_Y - 16}
            stroke={BORDER}
            strokeWidth={0.5}
          />
          <line
            x1={SVG_WIDTH / 2 + 30}
            y1={CHART_BOTTOM_Y - 16}
            x2={PLOT_RIGHT - 20}
            y2={CHART_BOTTOM_Y - 16}
            stroke={BORDER}
            strokeWidth={0.5}
          />

          {/* Arrow pointing down */}
          <polygon
            points={`${SVG_WIDTH / 2 - 4},${CHART_BOTTOM_Y - 22} ${SVG_WIDTH / 2 + 4},${CHART_BOTTOM_Y - 22} ${SVG_WIDTH / 2},${CHART_BOTTOM_Y - 16}`}
            fill={TEXT_DIM}
          />

          {/* Bottom chart: attention weights after softmax */}
          <BarChart
            chartY={CHART_BOTTOM_Y}
            chartHeight={CHART_BOTTOM_HEIGHT}
            title="Attention Weights (After Softmax)"
            numKeys={sequenceLength}
            trueValues={trueWeights}
            biasedValues={biasedWeights}
            unbiasedValues={unbiasedWeights}
            yMin={0}
            yMax={weightMax}
            formatYTick={(v) => `${(v * 100).toFixed(0)}%`}
            annotationIndex={trueTop1}
            annotationLabel={annotationLabel}
          />

          {/* Legend (top right) */}
          <g>
            <rect
              x={PLOT_RIGHT - 175}
              y={CHART_TOP_Y + 2}
              width={172}
              height={46}
              rx={4}
              fill="rgba(0,0,0,0.6)"
              stroke={BORDER}
              strokeWidth={0.5}
            />

            {/* True */}
            <rect
              x={PLOT_RIGHT - 166}
              y={CHART_TOP_Y + 10}
              width={10}
              height={8}
              fill={COLOR_TRUE}
              rx={1}
            />
            <text
              x={PLOT_RIGHT - 152}
              y={CHART_TOP_Y + 17}
              fill={TEXT_DIM}
              fontSize={9}
              fontFamily={FONT_MONO}
            >
              True scores
            </text>

            {/* Biased */}
            <rect
              x={PLOT_RIGHT - 166}
              y={CHART_TOP_Y + 22}
              width={10}
              height={8}
              fill={COLOR_BIASED}
              rx={1}
            />
            <text
              x={PLOT_RIGHT - 152}
              y={CHART_TOP_Y + 29}
              fill="rgba(251,146,60,0.9)"
              fontSize={9}
              fontFamily={FONT_MONO}
            >
              Biased quantization
            </text>

            {/* Unbiased */}
            <rect
              x={PLOT_RIGHT - 166}
              y={CHART_TOP_Y + 34}
              width={10}
              height={8}
              fill={COLOR_UNBIASED}
              rx={1}
            />
            <text
              x={PLOT_RIGHT - 152}
              y={CHART_TOP_Y + 41}
              fill={ACCENT}
              fontSize={9}
              fontFamily={FONT_MONO}
            >
              Unbiased (QJL)
            </text>
          </g>
        </svg>
      </div>

      {/* Stats panel */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        {/* KL divergence */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: TEXT_DIM,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            KL Divergence from True
          </div>
          <div style={{ color: COLOR_BIASED }}>
            Biased:{" "}
            <span style={{ color: TEXT_BRIGHT, fontWeight: 600 }}>
              {klBiased.toFixed(4)}
            </span>
          </div>
          <div style={{ color: ACCENT }}>
            Unbiased:{" "}
            <span style={{ color: TEXT_BRIGHT, fontWeight: 600 }}>
              {klUnbiased.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Top-1 correctness */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: TEXT_DIM,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Top-1 Position Correct
          </div>
          <div>
            Biased:{" "}
            <span
              style={{
                color: biasedTop1Correct ? ACCENT : COLOR_BIASED,
                fontWeight: 600,
              }}
            >
              {biasedTop1Correct ? "\u2713 yes" : "\u2717 wrong"}
            </span>
            {!biasedTop1Correct && (
              <span style={{ color: TEXT_DIM, fontSize: 10, marginLeft: 4 }}>
                (pos {biasedTop1} vs {trueTop1})
              </span>
            )}
          </div>
          <div>
            Unbiased:{" "}
            <span
              style={{
                color: unbiasedTop1Correct ? ACCENT : COLOR_BIASED,
                fontWeight: 600,
              }}
            >
              {unbiasedTop1Correct ? "\u2713 yes" : "\u2717 wrong"}
            </span>
          </div>
        </div>

        {/* Attention on correct positions */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: TEXT_DIM,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Attention on Top-3 Positions
          </div>
          <div style={{ color: TEXT_DIM }}>
            True:{" "}
            <span style={{ color: TEXT_BRIGHT, fontWeight: 600 }}>
              {(trueCorrectAttention * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ color: COLOR_BIASED }}>
            Biased:{" "}
            <span style={{ color: TEXT_BRIGHT, fontWeight: 600 }}>
              {(biasedCorrectAttention * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ color: ACCENT }}>
            Unbiased:{" "}
            <span style={{ color: TEXT_BRIGHT, fontWeight: 600 }}>
              {(unbiasedCorrectAttention * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {/* Sequence length slider */}
        <div style={{ flex: "1 1 200px", maxWidth: 280 }}>
          <label
            style={{
              fontSize: 12,
              color: TEXT_DIM,
              display: "block",
              marginBottom: 6,
            }}
          >
            Sequence length:{" "}
            <span style={{ color: ACCENT, fontSize: 14 }}>
              N={sequenceLength}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={SEQUENCE_LENGTH_OPTIONS.length - 1}
            step={1}
            value={sequenceLengthSliderIndex}
            onChange={handleSequenceLengthChange}
            style={{
              width: "100%",
              accentColor: ACCENT,
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: TEXT_DIM,
              marginTop: 2,
            }}
          >
            {SEQUENCE_LENGTH_OPTIONS.map((n) => (
              <span
                key={n}
                style={{
                  color: n === sequenceLength ? ACCENT : TEXT_DIM,
                  fontWeight: n === sequenceLength ? 600 : 400,
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Bias magnitude slider */}
        <div style={{ flex: "1 1 200px", maxWidth: 280 }}>
          <label
            style={{
              fontSize: 12,
              color: TEXT_DIM,
              display: "block",
              marginBottom: 6,
            }}
          >
            Bias magnitude:{" "}
            <span style={{ color: COLOR_BIASED, fontSize: 14 }}>
              {biasMagnitude.toFixed(2)}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={biasMagnitude}
            onChange={handleBiasMagnitudeChange}
            style={{
              width: "100%",
              accentColor: "rgb(251,146,60)",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: TEXT_DIM,
              marginTop: 2,
            }}
          >
            <span>0.00</span>
            <span>0.15</span>
            <span>0.30</span>
          </div>
        </div>

        {/* Resample button */}
        <button
          onClick={handleResample}
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.35)",
            borderRadius: 6,
            padding: "8px 20px",
            color: ACCENT,
            fontFamily: FONT_MONO,
            fontSize: 13,
            cursor: "pointer",
            letterSpacing: "0.03em",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(74,222,128,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(74,222,128,0.12)")
          }
        >
          Resample Noise
        </button>
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
        A constant bias shifts <em>all</em> scores uniformly, but softmax
        amplifies relative differences exponentially. As sequence length grows,
        biased errors compound &mdash; flattening the attention distribution and
        stealing probability mass from the correct positions. Unbiased noise
        (QJL) cancels out on average, keeping the attention distribution close
        to the truth even at long contexts.
      </div>
    </div>
  );
}
