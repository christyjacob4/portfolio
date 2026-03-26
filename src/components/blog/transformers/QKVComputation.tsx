"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80"
const QUERY_COLOR = "rgba(74,222,128,0.8)"
const KEY_COLOR = "rgba(100,200,255,0.8)"
const VALUE_COLOR = "rgba(100,255,150,0.8)"

const QUERY_BG = "rgba(74,222,128,0.12)"
const KEY_BG = "rgba(100,200,255,0.10)"
const VALUE_BG = "rgba(100,255,150,0.10)"

const TOKENS = ["I", "love", "ML", "!"] as const
const TOKEN_COUNT = TOKENS.length
const STEP_COUNT = 5

const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace"

// Hardcoded embedding vectors (4 dims per token)
const EMBEDDINGS: number[][] = [
  [0.2, 0.8, -0.1, 0.5],
  [0.9, -0.3, 0.6, 0.1],
  [-0.4, 0.7, 0.3, -0.2],
  [0.1, -0.5, 0.8, 0.4],
]

// Projected Q, K, V vectors (4 dims each, per token)
const Q_VECTORS: number[][] = [
  [0.5, 0.3, -0.2, 0.7],
  [0.8, -0.1, 0.4, 0.2],
  [-0.3, 0.6, 0.1, -0.4],
  [0.2, -0.3, 0.6, 0.5],
]

const K_VECTORS: number[][] = [
  [0.4, 0.6, -0.3, 0.2],
  [0.7, -0.2, 0.5, 0.3],
  [-0.1, 0.8, 0.2, -0.5],
  [0.3, -0.4, 0.7, 0.1],
]

const V_VECTORS: number[][] = [
  [0.1, 0.9, -0.2, 0.4],
  [0.6, -0.1, 0.3, 0.7],
  [-0.3, 0.5, 0.8, -0.1],
  [0.4, -0.2, 0.1, 0.6],
]

// Raw dot-product scores (Q_i . K_j), pre-scaling
const RAW_SCORES: number[][] = [
  [0.73, 0.29, 0.61, 0.18],
  [0.41, 0.82, 0.14, 0.53],
  [0.55, 0.11, 0.76, 0.37],
  [0.22, 0.48, 0.33, 0.69],
]

// After dividing by sqrt(d_k) = 2 and applying softmax row-wise
const ATTENTION_WEIGHTS: number[][] = [
  [0.31, 0.21, 0.29, 0.19],
  [0.24, 0.34, 0.18, 0.24],
  [0.28, 0.18, 0.32, 0.22],
  [0.20, 0.27, 0.22, 0.31],
]

// Output vectors (weighted sum of V vectors per row)
const OUTPUT_VECTORS: number[][] = [
  [0.19, 0.35, 0.22, 0.44],
  [0.28, 0.21, 0.18, 0.55],
  [0.12, 0.42, 0.31, 0.33],
  [0.31, 0.15, 0.24, 0.52],
]

const STEP_LABELS = [
  "Each token is converted to an embedding vector",
  "Embeddings are projected into Query, Key, and Value spaces",
  "Compute dot product between each Query and Key pair, then scale by \u221Ad\u2096",
  "Apply softmax row-wise to get attention weights (each row sums to 1)",
  "Multiply weights by Value vectors to get the output",
]

// ---------------------------------------------------------------------------
// Layout constants for SVG
// ---------------------------------------------------------------------------

const SVG_WIDTH = 700
const SVG_HEIGHT = 450

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function VectorColumn({
  values,
  x,
  y,
  color,
}: {
  values: number[]
  x: number
  y: number
  color: string
}) {
  return (
    <g>
      {values.map((val, i) => (
        <text
          key={i}
          x={x}
          y={y + i * 14}
          textAnchor="middle"
          fill={color}
          fontSize={9}
          fontFamily={FONT_MONO}
        >
          {val.toFixed(1)}
        </text>
      ))}
    </g>
  )
}

function TokenBoxSVG({
  word,
  x,
  y,
  width = 60,
  height = 28,
  isHighlighted = false,
}: {
  word: string
  x: number
  y: number
  width?: number
  height?: number
  isHighlighted?: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={isHighlighted ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)"}
        stroke={isHighlighted ? ACCENT : "rgba(255,255,255,0.1)"}
        strokeWidth={1}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isHighlighted ? "#fff" : "rgba(255,255,255,0.8)"}
        fontSize={13}
        fontFamily={FONT_MONO}
        fontWeight={500}
      >
        {word}
      </text>
    </g>
  )
}

function SectionLabel({
  text,
  x,
  y,
  color = "rgba(255,255,255,0.45)",
}: {
  text: string
  x: number
  y: number
  color?: string
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={color}
      fontSize={10}
      fontFamily={FONT_MONO}
      fontWeight={600}
      letterSpacing={1}
    >
      {text}
    </text>
  )
}

function WeightMatrixBox({
  label,
  x,
  y,
  color,
}: {
  label: string
  x: number
  y: number
  color: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={44}
        height={24}
        rx={4}
        fill="rgba(255,255,255,0.04)"
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4 2"
      />
      <text
        x={x + 22}
        y={y + 13}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={9}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 0: Input Embeddings
// ---------------------------------------------------------------------------

function StepInputEmbeddings() {
  const startX = 140
  const tokenGap = 110
  const tokenY = 60
  const embeddingY = 110

  return (
    <g>
      {TOKENS.map((token, i) => {
        const cx = startX + i * tokenGap
        return (
          <g key={i}>
            <TokenBoxSVG word={token} x={cx - 30} y={tokenY} />
            {/* Arrow from token to embedding */}
            <line
              x1={cx}
              y1={tokenY + 28}
              x2={cx}
              y2={embeddingY - 4}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1}
            />
            {/* Embedding vector */}
            <rect
              x={cx - 26}
              y={embeddingY}
              width={52}
              height={70}
              rx={4}
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
            <VectorColumn
              values={EMBEDDINGS[i]}
              x={cx}
              y={embeddingY + 16}
              color="rgba(255,255,255,0.6)"
            />
          </g>
        )
      })}

      <SectionLabel text="Token Embeddings" x={SVG_WIDTH / 2} y={40} />

      {/* Dimension label */}
      <text
        x={startX - 70}
        y={embeddingY + 38}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        d = 4
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Q, K, V Projection
// ---------------------------------------------------------------------------

function ProjectionGroup({
  label,
  weightLabel,
  vectors,
  x,
  y,
  color,
  bgColor,
}: {
  label: string
  weightLabel: string
  vectors: number[][]
  x: number
  y: number
  color: string
  bgColor: string
}) {
  const groupWidth = TOKEN_COUNT * 50 + 20
  const groupHeight = 90

  return (
    <g>
      {/* Group background */}
      <rect
        x={x}
        y={y}
        width={groupWidth}
        height={groupHeight}
        rx={6}
        fill={bgColor}
        stroke={color}
        strokeWidth={0.5}
        opacity={0.6}
      />
      {/* Group label */}
      <text
        x={x + groupWidth / 2}
        y={y + 14}
        textAnchor="middle"
        fill={color}
        fontSize={11}
        fontFamily={FONT_MONO}
        fontWeight={700}
      >
        {label}
      </text>
      {/* Weight matrix label */}
      <WeightMatrixBox
        label={weightLabel}
        x={x + groupWidth / 2 - 22}
        y={y - 28}
        color={color}
      />
      {/* Arrow from weight matrix to group */}
      <line
        x1={x + groupWidth / 2}
        y1={y - 4}
        x2={x + groupWidth / 2}
        y2={y}
        stroke={color}
        strokeWidth={0.8}
        opacity={0.5}
      />
      {/* Vectors */}
      {vectors.map((vec, i) => (
        <VectorColumn
          key={i}
          values={vec}
          x={x + 20 + i * 50 + 15}
          y={y + 28}
          color={color}
        />
      ))}
    </g>
  )
}

function StepQKVProjection() {
  const tokenStartX = 200
  const tokenGap = 70
  const tokenY = 30

  const projectionY = 160
  const qX = 18
  const kX = 250
  const vX = 482

  return (
    <g>
      {/* Token row at top */}
      {TOKENS.map((token, i) => {
        const cx = tokenStartX + i * tokenGap
        return (
          <TokenBoxSVG
            key={i}
            word={token}
            x={cx - 25}
            y={tokenY}
            width={50}
            height={24}
          />
        )
      })}

      <SectionLabel text="Embeddings" x={SVG_WIDTH / 2} y={22} />

      {/* Arrows from tokens down to projection area */}
      {TOKENS.map((_, i) => {
        const cx = tokenStartX + i * tokenGap
        return (
          <line
            key={i}
            x1={cx}
            y1={tokenY + 24}
            x2={cx}
            y2={tokenY + 60}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={0.8}
            strokeDasharray="3 2"
          />
        )
      })}

      {/* Branching lines to Q, K, V */}
      <text
        x={SVG_WIDTH / 2}
        y={tokenY + 50}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        linear projections
      </text>

      {/* Q, K, V groups */}
      <ProjectionGroup
        label="Q (Query)"
        weightLabel="W_Q"
        vectors={Q_VECTORS}
        x={qX}
        y={projectionY}
        color={QUERY_COLOR}
        bgColor={QUERY_BG}
      />
      <ProjectionGroup
        label="K (Key)"
        weightLabel="W_K"
        vectors={K_VECTORS}
        x={kX}
        y={projectionY}
        color={KEY_COLOR}
        bgColor={KEY_BG}
      />
      <ProjectionGroup
        label="V (Value)"
        weightLabel="W_V"
        vectors={V_VECTORS}
        x={vX}
        y={projectionY}
        color={VALUE_COLOR}
        bgColor={VALUE_BG}
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Attention Scores
// ---------------------------------------------------------------------------

function ScoreGrid({
  scores,
  x,
  y,
  cellSize,
  colorFn,
  showValues,
}: {
  scores: number[][]
  x: number
  y: number
  cellSize: number
  colorFn: (value: number) => string
  showValues: boolean
}) {
  const maxScore = Math.max(...scores.flat())

  return (
    <g>
      {scores.map((row, i) =>
        row.map((score, j) => {
          const cx = x + j * cellSize
          const cy = y + i * cellSize
          const normalizedBrightness = score / maxScore

          return (
            <g key={`${i}-${j}`}>
              <rect
                x={cx}
                y={cy}
                width={cellSize - 2}
                height={cellSize - 2}
                rx={3}
                fill={colorFn(normalizedBrightness)}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.5}
              />
              {showValues && (
                <text
                  x={cx + (cellSize - 2) / 2}
                  y={cy + (cellSize - 2) / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={
                    normalizedBrightness > 0.5
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.5)"
                  }
                  fontSize={9}
                  fontFamily={FONT_MONO}
                >
                  {score.toFixed(2)}
                </text>
              )}
            </g>
          )
        }),
      )}
    </g>
  )
}

function StepAttentionScores() {
  const gridX = 260
  const gridY = 130
  const cellSize = 58

  const qLabelX = gridX - 60
  const kLabelY = gridY - 16

  return (
    <g>
      <SectionLabel text="Q × K\u1d40 / \u221Ad\u2096" x={SVG_WIDTH / 2} y={30} />

      {/* Q labels (rows) */}
      <text
        x={qLabelX - 10}
        y={gridY - 30}
        textAnchor="middle"
        fill={QUERY_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        Query
      </text>
      {TOKENS.map((token, i) => (
        <text
          key={i}
          x={qLabelX}
          y={gridY + i * cellSize + cellSize / 2}
          textAnchor="end"
          dominantBaseline="central"
          fill={QUERY_COLOR}
          fontSize={10}
          fontFamily={FONT_MONO}
        >
          Q_{token}
        </text>
      ))}

      {/* K labels (columns) */}
      <text
        x={gridX + (TOKEN_COUNT * cellSize) / 2}
        y={gridY - 40}
        textAnchor="middle"
        fill={KEY_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        Key
      </text>
      {TOKENS.map((token, j) => (
        <text
          key={j}
          x={gridX + j * cellSize + cellSize / 2}
          y={kLabelY}
          textAnchor="middle"
          fill={KEY_COLOR}
          fontSize={10}
          fontFamily={FONT_MONO}
        >
          K_{token}
        </text>
      ))}

      {/* Score grid */}
      <ScoreGrid
        scores={RAW_SCORES}
        x={gridX}
        y={gridY}
        cellSize={cellSize}
        colorFn={(brightness) =>
          `rgba(74,222,128,${0.08 + brightness * 0.55})`
        }
        showValues
      />

      {/* Computation hint */}
      <text
        x={SVG_WIDTH / 2}
        y={gridY + TOKEN_COUNT * cellSize + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        score(i,j) = Q_i \u00b7 K_j / \u221A4 = Q_i \u00b7 K_j / 2
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Softmax
// ---------------------------------------------------------------------------

function StepSoftmax() {
  const gridX = 260
  const gridY = 130
  const cellSize = 58

  return (
    <g>
      <SectionLabel text="softmax(scores)" x={SVG_WIDTH / 2} y={30} />

      {/* Row labels */}
      {TOKENS.map((token, i) => (
        <text
          key={i}
          x={gridX - 18}
          y={gridY + i * cellSize + cellSize / 2}
          textAnchor="end"
          dominantBaseline="central"
          fill={QUERY_COLOR}
          fontSize={10}
          fontFamily={FONT_MONO}
        >
          {token}
        </text>
      ))}

      {/* Column labels */}
      {TOKENS.map((token, j) => (
        <text
          key={j}
          x={gridX + j * cellSize + cellSize / 2}
          y={gridY - 12}
          textAnchor="middle"
          fill={KEY_COLOR}
          fontSize={10}
          fontFamily={FONT_MONO}
        >
          {token}
        </text>
      ))}

      {/* Attention weights grid */}
      <ScoreGrid
        scores={ATTENTION_WEIGHTS}
        x={gridX}
        y={gridY}
        cellSize={cellSize}
        colorFn={(brightness) =>
          `rgba(74,222,128,${0.1 + brightness * 0.65})`
        }
        showValues
      />

      {/* Row sum annotations */}
      {ATTENTION_WEIGHTS.map((row, i) => {
        const sum = row.reduce((a, b) => a + b, 0)
        return (
          <text
            key={i}
            x={gridX + TOKEN_COUNT * cellSize + 12}
            y={gridY + i * cellSize + cellSize / 2}
            dominantBaseline="central"
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            fontFamily={FONT_MONO}
          >
            = {sum.toFixed(2)}
          </text>
        )
      })}

      {/* Softmax formula */}
      <text
        x={SVG_WIDTH / 2}
        y={gridY + TOKEN_COUNT * cellSize + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        Each row is a probability distribution (sums to 1.0)
      </text>

      {/* Softmax arrow annotation */}
      <g>
        <text
          x={gridX - 70}
          y={gridY + (TOKEN_COUNT * cellSize) / 2 - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={9}
          fontFamily={FONT_MONO}
        >
          softmax
        </text>
        <text
          x={gridX - 70}
          y={gridY + (TOKEN_COUNT * cellSize) / 2 + 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={9}
          fontFamily={FONT_MONO}
        >
          per row
        </text>
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Weighted Sum
// ---------------------------------------------------------------------------

function StepWeightedSum() {
  const weightsX = 60
  const weightsY = 100
  const wCellSize = 48
  const vGroupX = 390
  const vGroupY = 100
  const outputX = 560
  const outputY = 100
  const highlightedRow = 1

  return (
    <g>
      <SectionLabel text="Attention × V = Output" x={SVG_WIDTH / 2} y={25} />

      {/* --- Attention weights matrix --- */}
      <text
        x={weightsX + (TOKEN_COUNT * wCellSize) / 2}
        y={weightsY - 18}
        textAnchor="middle"
        fill={ACCENT}
        fontSize={10}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        Weights
      </text>
      <ScoreGrid
        scores={ATTENTION_WEIGHTS}
        x={weightsX}
        y={weightsY}
        cellSize={wCellSize}
        colorFn={(brightness) =>
          `rgba(74,222,128,${0.08 + brightness * 0.5})`
        }
        showValues
      />
      {/* Highlight row */}
      <rect
        x={weightsX - 2}
        y={weightsY + highlightedRow * wCellSize - 2}
        width={TOKEN_COUNT * wCellSize + 2}
        height={wCellSize + 2}
        rx={4}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.5}
      />

      {/* Multiplication symbol */}
      <text
        x={weightsX + TOKEN_COUNT * wCellSize + 22}
        y={weightsY + (TOKEN_COUNT * wCellSize) / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.4)"
        fontSize={18}
        fontFamily={FONT_MONO}
      >
        ×
      </text>

      {/* --- V vectors --- */}
      <text
        x={vGroupX + 50}
        y={weightsY - 18}
        textAnchor="middle"
        fill={VALUE_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        Values
      </text>
      {V_VECTORS.map((vec, i) => {
        const vy = vGroupY + i * 50

        return (
          <g key={i}>
            <rect
              x={vGroupX}
              y={vy}
              width={100}
              height={40}
              rx={4}
              fill={VALUE_BG}
              stroke={VALUE_COLOR}
              strokeWidth={0.8}
              opacity={0.8}
            />
            <text
              x={vGroupX + 10}
              y={vy + 14}
              fill={VALUE_COLOR}
              fontSize={8}
              fontFamily={FONT_MONO}
              fontWeight={600}
            >
              V_{TOKENS[i]}
            </text>
            <text
              x={vGroupX + 50}
              y={vy + 30}
              textAnchor="middle"
              fill={VALUE_COLOR}
              fontSize={8}
              fontFamily={FONT_MONO}
            >
              [{vec.map((v) => v.toFixed(1)).join(", ")}]
            </text>

            {/* Arrow from highlighted weight row to this V vector */}
            {i <= TOKEN_COUNT - 1 && (
              <line
                x1={weightsX + TOKEN_COUNT * wCellSize + 36}
                y1={weightsY + highlightedRow * wCellSize + wCellSize / 2}
                x2={vGroupX - 2}
                y2={vy + 20}
                stroke={ACCENT}
                strokeWidth={0.6}
                opacity={ATTENTION_WEIGHTS[highlightedRow][i] * 2.5}
                strokeDasharray="3 2"
              />
            )}
          </g>
        )
      })}

      {/* Equals symbol */}
      <text
        x={vGroupX + 116}
        y={weightsY + (TOKEN_COUNT * 50) / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.4)"
        fontSize={18}
        fontFamily={FONT_MONO}
      >
        =
      </text>

      {/* --- Output vector for highlighted row --- */}
      <text
        x={outputX + 50}
        y={weightsY - 18}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={10}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        Output
      </text>
      <rect
        x={outputX}
        y={outputY + highlightedRow * 50}
        width={100}
        height={40}
        rx={4}
        fill="rgba(74,222,128,0.08)"
        stroke={ACCENT}
        strokeWidth={1.2}
      />
      <text
        x={outputX + 10}
        y={outputY + highlightedRow * 50 + 14}
        fill={ACCENT}
        fontSize={8}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        out_{TOKENS[highlightedRow]}
      </text>
      <text
        x={outputX + 50}
        y={outputY + highlightedRow * 50 + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        [{OUTPUT_VECTORS[highlightedRow].map((v) => v.toFixed(2)).join(", ")}]
      </text>

      {/* Other output slots (dimmed) */}
      {OUTPUT_VECTORS.map((vec, i) => {
        if (i === highlightedRow) return null
        return (
          <g key={i} opacity={0.3}>
            <rect
              x={outputX}
              y={outputY + i * 50}
              width={100}
              height={40}
              rx={4}
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.5}
            />
            <text
              x={outputX + 50}
              y={outputY + i * 50 + 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize={8}
              fontFamily={FONT_MONO}
            >
              [{vec.map((v) => v.toFixed(2)).join(", ")}]
            </text>
          </g>
        )
      })}

      {/* Convergence arrows from V to output */}
      {V_VECTORS.map((_, i) => (
        <line
          key={`conv-${i}`}
          x1={vGroupX + 100}
          y1={vGroupY + i * 50 + 20}
          x2={outputX}
          y2={outputY + highlightedRow * 50 + 20}
          stroke={ACCENT}
          strokeWidth={0.8 + ATTENTION_WEIGHTS[highlightedRow][i] * 3}
          opacity={0.15 + ATTENTION_WEIGHTS[highlightedRow][i] * 1.2}
        />
      ))}

      {/* Explanation */}
      <text
        x={SVG_WIDTH / 2}
        y={SVG_HEIGHT - 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        Showing output for &quot;{TOKENS[highlightedRow]}&quot; = {"\u03A3"}{" "}
        weight_j × V_j
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step Navigation
// ---------------------------------------------------------------------------

function StepDots({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <div
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] transition-all duration-200"
          style={{
            backgroundColor:
              i === currentStep ? ACCENT : "rgba(255,255,255,0.06)",
            color:
              i === currentStep ? "#fff" : "rgba(255,255,255,0.35)",
            border:
              i === currentStep
                ? `1px solid ${ACCENT}`
                : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}

function NavigationButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-white/20 px-4 py-1.5 font-mono text-xs tracking-wide text-white/70 transition-colors duration-200 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-white/70"
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const STEP_HEIGHTS = [220, 320, 300, 300, 450]

export default function QKVComputation({ step = 0 }: { step?: number }) {
  const stepComponents = [
    <StepInputEmbeddings key="step-0" />,
    <StepQKVProjection key="step-1" />,
    <StepAttentionScores key="step-2" />,
    <StepSoftmax key="step-3" />,
    <StepWeightedSum key="step-4" />,
  ]

  const safeStep = Math.max(0, Math.min(step, STEP_COUNT - 1))
  const height = STEP_HEIGHTS[safeStep]

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${height}`}
          className="w-full max-w-[700px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {stepComponents[safeStep]}
        </svg>
      </div>
    </div>
  )
}
