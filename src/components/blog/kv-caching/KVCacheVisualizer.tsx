"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80"
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace"

const QUERY_COLOR = "rgba(74,222,128,0.8)"
const KEY_COLOR = "rgba(100,200,255,0.8)"
const VALUE_COLOR = "rgba(100,255,150,0.8)"

const QUERY_BG = "rgba(74,222,128,0.15)"
const QUERY_BG_DIM = "rgba(74,222,128,0.06)"
const KEY_BG = "rgba(100,200,255,0.15)"
const KEY_BG_DIM = "rgba(100,200,255,0.06)"
const VALUE_BG = "rgba(100,255,150,0.15)"
const VALUE_BG_DIM = "rgba(100,255,150,0.06)"

const PROMPT_TOKENS = ["I", "love", "ML", "!"] as const
const GENERATED_TOKENS = ["It", "is", "great"] as const

const STEP_COUNT = 5
const MATRIX_COLS = 4
const ROW_HEIGHT = 12
const ROW_GAP = 2
const COL_WIDTH = 16
const COL_GAP = 2

// ---------------------------------------------------------------------------
// Step descriptions
// ---------------------------------------------------------------------------

const STEP_LABELS = [
  "Prefill: process entire prompt in parallel",
  'Decode: Q is just 1 token. K,V retrieved from cache + new entry appended.',
  "Decode: cache grows by one row each step",
  "Decode: cache continues growing, Q stays at 1 row",
  "Cache eliminates O(N) re-projections per step",
]

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function matrixHeight(rows: number): number {
  return rows * (ROW_HEIGHT + ROW_GAP) - ROW_GAP
}

// ---------------------------------------------------------------------------
// SVG sub-components
// ---------------------------------------------------------------------------

function MatrixGrid({
  x,
  y,
  rows,
  brightRows,
  color,
  dimColor,
}: {
  x: number
  y: number
  rows: number
  brightRows: number[]
  color: string
  dimColor: string
}) {
  return (
    <g>
      {Array.from({ length: rows }, (_, row) => {
        const isBright = brightRows.includes(row)
        const ry = y + row * (ROW_HEIGHT + ROW_GAP)
        return (
          <g key={row}>
            {Array.from({ length: MATRIX_COLS }, (_, col) => (
              <rect
                key={col}
                x={x + col * (COL_WIDTH + COL_GAP)}
                y={ry}
                width={COL_WIDTH}
                height={ROW_HEIGHT}
                rx={2}
                fill={isBright ? color : dimColor}
                style={{ transition: "fill 0.3s ease, opacity 0.3s ease" }}
              />
            ))}
          </g>
        )
      })}
    </g>
  )
}

function MatrixLabel({
  text,
  x,
  y,
  color,
}: {
  text: string
  x: number
  y: number
  color: string
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={color}
      fontSize={11}
      fontFamily={FONT_MONO}
      fontWeight={700}
    >
      {text}
    </text>
  )
}

function DimensionLabel({
  text,
  x,
  y,
}: {
  text: string
  x: number
  y: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="rgba(255,255,255,0.35)"
      fontSize={9}
      fontFamily={FONT_MONO}
    >
      {text}
    </text>
  )
}

function TokenRow({
  tokens,
  x,
  y,
  highlightIndex,
}: {
  tokens: readonly string[]
  x: number
  y: number
  highlightIndex?: number
}) {
  const boxWidth = 38
  const boxHeight = 22
  const gap = 4
  return (
    <g>
      {tokens.map((token, i) => {
        const isHighlighted = highlightIndex === i
        return (
          <g key={i}>
            <rect
              x={x + i * (boxWidth + gap)}
              y={y}
              width={boxWidth}
              height={boxHeight}
              rx={4}
              fill={isHighlighted ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)"}
              stroke={isHighlighted ? ACCENT : "rgba(255,255,255,0.12)"}
              strokeWidth={1}
            />
            <text
              x={x + i * (boxWidth + gap) + boxWidth / 2}
              y={y + boxHeight / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isHighlighted ? "#fff" : "rgba(255,255,255,0.7)"}
              fontSize={11}
              fontFamily={FONT_MONO}
              fontWeight={isHighlighted ? 600 : 400}
            >
              {token}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function DescriptionText({
  text,
  x,
  y,
}: {
  text: string
  x: number
  y: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="rgba(255,255,255,0.45)"
      fontSize={10}
      fontFamily={FONT_MONO}
    >
      {text}
    </text>
  )
}

// ---------------------------------------------------------------------------
// Attention arrow from Q to K
// ---------------------------------------------------------------------------

function AttentionArrow({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number
  fromY: number
  toX: number
  toY: number
}) {
  const midY = (fromY + toY) / 2
  return (
    <g>
      <path
        d={`M ${fromX} ${fromY} C ${fromX + 30} ${midY}, ${toX - 30} ${midY}, ${toX} ${toY}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.2}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      {/* arrowhead */}
      <polygon
        points={`${toX},${toY} ${toX - 5},${toY - 3} ${toX - 5},${toY + 3}`}
        fill={ACCENT}
        opacity={0.5}
      />
      <text
        x={(fromX + toX) / 2 + 14}
        y={midY - 4}
        textAnchor="middle"
        fill={ACCENT}
        fontSize={8}
        fontFamily={FONT_MONO}
        opacity={0.7}
      >
        attention
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 0: Prefill
// ---------------------------------------------------------------------------

function StepPrefill() {
  const matrixWidth = MATRIX_COLS * (COL_WIDTH + COL_GAP) - COL_GAP
  const totalMatrixSpan = matrixWidth * 3 + 80 * 2
  const startX = (650 - totalMatrixSpan) / 2
  const matrixY = 80
  const rows = 4
  const height = matrixHeight(rows)
  const allBright = [0, 1, 2, 3]

  const tokenRowWidth = PROMPT_TOKENS.length * 42
  const tokenRowX = (650 - tokenRowWidth) / 2

  const qX = startX
  const kX = startX + matrixWidth + 80
  const vX = startX + (matrixWidth + 80) * 2

  return (
    <g>
      <TokenRow tokens={PROMPT_TOKENS} x={tokenRowX} y={16} />

      <MatrixLabel text="Q" x={qX + matrixWidth / 2} y={matrixY - 8} color={QUERY_COLOR} />
      <MatrixGrid x={qX} y={matrixY} rows={rows} brightRows={allBright} color={QUERY_BG} dimColor={QUERY_BG_DIM} />
      <DimensionLabel text={`Q(${rows}×d)`} x={qX + matrixWidth / 2} y={matrixY + height + 16} />

      <MatrixLabel text="K" x={kX + matrixWidth / 2} y={matrixY - 8} color={KEY_COLOR} />
      <MatrixGrid x={kX} y={matrixY} rows={rows} brightRows={allBright} color={KEY_BG} dimColor={KEY_BG_DIM} />
      <DimensionLabel text={`K(${rows}×d)`} x={kX + matrixWidth / 2} y={matrixY + height + 16} />

      <MatrixLabel text="V" x={vX + matrixWidth / 2} y={matrixY - 8} color={VALUE_COLOR} />
      <MatrixGrid x={vX} y={matrixY} rows={rows} brightRows={allBright} color={VALUE_BG} dimColor={VALUE_BG_DIM} />
      <DimensionLabel text={`V(${rows}×d)`} x={vX + matrixWidth / 2} y={matrixY + height + 16} />

      <DescriptionText text={STEP_LABELS[0]} x={325} y={matrixY + height + 40} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Steps 1-3: Decode steps
// ---------------------------------------------------------------------------

function StepDecode({ decodeIndex }: { decodeIndex: number }) {
  const cachedRows = PROMPT_TOKENS.length + decodeIndex
  const totalKVRows = cachedRows + 1
  const newRowIndex = totalKVRows - 1

  const matrixWidth = MATRIX_COLS * (COL_WIDTH + COL_GAP) - COL_GAP
  const kvHeight = matrixHeight(totalKVRows)
  const qHeight = matrixHeight(1)

  const totalMatrixSpan = matrixWidth * 3 + 80 * 2
  const startX = (650 - totalMatrixSpan) / 2
  const matrixY = 80

  const qX = startX
  const kX = startX + matrixWidth + 80
  const vX = startX + (matrixWidth + 80) * 2

  // All tokens visible so far
  const allTokens = [
    ...PROMPT_TOKENS,
    ...GENERATED_TOKENS.slice(0, decodeIndex + 1),
  ]
  const tokenRowWidth = allTokens.length * 42
  const tokenRowX = (650 - tokenRowWidth) / 2

  // Q is vertically centered relative to K/V
  const qCenterY = matrixY + kvHeight / 2 - qHeight / 2

  return (
    <g>
      <TokenRow
        tokens={allTokens}
        x={tokenRowX}
        y={16}
        highlightIndex={allTokens.length - 1}
      />

      {/* Q — single row */}
      <MatrixLabel text="Q" x={qX + matrixWidth / 2} y={qCenterY - 8} color={QUERY_COLOR} />
      <MatrixGrid
        x={qX}
        y={qCenterY}
        rows={1}
        brightRows={[0]}
        color={QUERY_BG}
        dimColor={QUERY_BG_DIM}
      />
      <DimensionLabel text="Q(1×d)" x={qX + matrixWidth / 2} y={qCenterY + qHeight + 16} />

      {/* K cache */}
      <MatrixLabel text="K cache" x={kX + matrixWidth / 2} y={matrixY - 8} color={KEY_COLOR} />
      <MatrixGrid
        x={kX}
        y={matrixY}
        rows={totalKVRows}
        brightRows={[newRowIndex]}
        color={KEY_BG}
        dimColor={KEY_BG_DIM}
      />
      <DimensionLabel
        text={`K(${totalKVRows}×d)`}
        x={kX + matrixWidth / 2}
        y={matrixY + kvHeight + 16}
      />

      {/* V cache */}
      <MatrixLabel text="V cache" x={vX + matrixWidth / 2} y={matrixY - 8} color={VALUE_COLOR} />
      <MatrixGrid
        x={vX}
        y={matrixY}
        rows={totalKVRows}
        brightRows={[newRowIndex]}
        color={VALUE_BG}
        dimColor={VALUE_BG_DIM}
      />
      <DimensionLabel
        text={`V(${totalKVRows}×d)`}
        x={vX + matrixWidth / 2}
        y={matrixY + kvHeight + 16}
      />

      {/* Attention arrow from Q to K */}
      <AttentionArrow
        fromX={qX + matrixWidth + 4}
        fromY={qCenterY + qHeight / 2}
        toX={kX - 4}
        toY={matrixY + kvHeight / 2}
      />

      <DescriptionText
        text={STEP_LABELS[Math.min(decodeIndex + 1, 3)]}
        x={325}
        y={matrixY + kvHeight + 40}
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Summary comparison
// ---------------------------------------------------------------------------

function ComparisonMatrix({
  x,
  y,
  rows,
  cols,
  color,
  isRedundant,
}: {
  x: number
  y: number
  rows: number
  cols: number
  color: string
  isRedundant: (row: number, col: number) => boolean
}) {
  return (
    <g>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const cx = x + col * (COL_WIDTH + COL_GAP)
          const cy = y + row * (ROW_HEIGHT + ROW_GAP)
          const redundant = isRedundant(row, col)
          return (
            <rect
              key={`${row}-${col}`}
              x={cx}
              y={cy}
              width={COL_WIDTH}
              height={ROW_HEIGHT}
              rx={2}
              fill={color}
              opacity={redundant ? 0.15 : 0.6}
            />
          )
        }),
      )}
    </g>
  )
}

function StepSummary() {
  const totalTokens = 7
  const matrixWidth = MATRIX_COLS * (COL_WIDTH + COL_GAP) - COL_GAP
  const fullHeight = matrixHeight(totalTokens)

  // Left side — without cache
  const leftX = 40
  const leftMatrixY = 60
  const leftCenterX = leftX + matrixWidth * 1.5 + 30

  // Right side — with cache
  const rightX = 370
  const rightMatrixY = 60
  const rightCenterX = rightX + matrixWidth + 40

  return (
    <g>
      {/* Without cache */}
      <text
        x={leftCenterX}
        y={20}
        textAnchor="middle"
        fill="rgba(255,100,100,0.8)"
        fontSize={11}
        fontFamily={FONT_MONO}
        fontWeight={700}
      >
        Without cache
      </text>

      {/* Q, K, V all 7 rows */}
      <MatrixLabel text="Q" x={leftX + matrixWidth / 2} y={leftMatrixY - 8} color="rgba(255,100,100,0.5)" />
      <ComparisonMatrix
        x={leftX}
        y={leftMatrixY}
        rows={totalTokens}
        cols={MATRIX_COLS}
        color="rgba(255,100,100,0.5)"
        isRedundant={(row) => row < totalTokens - 1}
      />

      <MatrixLabel text="K" x={leftX + matrixWidth + 30 + matrixWidth / 2} y={leftMatrixY - 8} color="rgba(255,100,100,0.5)" />
      <ComparisonMatrix
        x={leftX + matrixWidth + 30}
        y={leftMatrixY}
        rows={totalTokens}
        cols={MATRIX_COLS}
        color="rgba(255,100,100,0.5)"
        isRedundant={(row) => row < totalTokens - 1}
      />

      <MatrixLabel text="V" x={leftX + (matrixWidth + 30) * 2 + matrixWidth / 2} y={leftMatrixY - 8} color="rgba(255,100,100,0.5)" />
      <ComparisonMatrix
        x={leftX + (matrixWidth + 30) * 2}
        y={leftMatrixY}
        rows={totalTokens}
        cols={MATRIX_COLS}
        color="rgba(255,100,100,0.5)"
        isRedundant={(row) => row < totalTokens - 1}
      />

      {/* Red strikethrough on redundant rows */}
      {Array.from({ length: totalTokens - 1 }, (_, row) => {
        const ry = leftMatrixY + row * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2
        const fullWidth = (matrixWidth + 30) * 2 + matrixWidth
        return (
          <line
            key={row}
            x1={leftX - 4}
            y1={ry}
            x2={leftX + fullWidth + 4}
            y2={ry}
            stroke="rgba(255,80,80,0.35)"
            strokeWidth={1}
          />
        )
      })}

      <DimensionLabel text="7×d each — recomputed every step" x={leftCenterX} y={leftMatrixY + fullHeight + 16} />

      {/* Divider */}
      <line
        x1={330}
        y1={20}
        x2={330}
        y2={280}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* With cache */}
      <text
        x={rightCenterX}
        y={20}
        textAnchor="middle"
        fill={ACCENT}
        fontSize={11}
        fontFamily={FONT_MONO}
        fontWeight={700}
      >
        With cache
      </text>

      {/* Q — 1 row, vertically centered */}
      <MatrixLabel text="Q" x={rightX + matrixWidth / 2} y={rightMatrixY - 8} color={QUERY_COLOR} />
      <MatrixGrid
        x={rightX}
        y={rightMatrixY + fullHeight / 2 - ROW_HEIGHT / 2}
        rows={1}
        brightRows={[0]}
        color={QUERY_BG}
        dimColor={QUERY_BG_DIM}
      />

      {/* K cache — 7 rows */}
      <MatrixLabel text="K cache" x={rightX + matrixWidth + 40 + matrixWidth / 2} y={rightMatrixY - 8} color={KEY_COLOR} />
      <MatrixGrid
        x={rightX + matrixWidth + 40}
        y={rightMatrixY}
        rows={totalTokens}
        brightRows={[totalTokens - 1]}
        color={KEY_BG}
        dimColor={KEY_BG_DIM}
      />

      {/* V cache — 7 rows */}
      <MatrixLabel text="V cache" x={rightX + (matrixWidth + 40) * 2 + matrixWidth / 2} y={rightMatrixY - 8} color={VALUE_COLOR} />
      <MatrixGrid
        x={rightX + (matrixWidth + 40) * 2}
        y={rightMatrixY}
        rows={totalTokens}
        brightRows={[totalTokens - 1]}
        color={VALUE_BG}
        dimColor={VALUE_BG_DIM}
      />

      <DimensionLabel text="Q(1×d) + cached K,V" x={rightCenterX + 20} y={rightMatrixY + fullHeight + 16} />

      {/* Comparison text */}
      <text
        x={325}
        y={rightMatrixY + fullHeight + 42}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={10}
        fontFamily={FONT_MONO}
      >
        21 projections → 7 projections
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Navigation
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
              i === currentStep ? "#000" : "rgba(255,255,255,0.5)",
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
// Main component
// ---------------------------------------------------------------------------

export default function KVCacheVisualizer() {
  const [step, setStep] = useState(0)

  const goToPrev = () => setStep((s) => Math.max(0, s - 1))
  const goToNext = () => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))

  const stepContent = (() => {
    switch (step) {
      case 0:
        return <StepPrefill />
      case 1:
        return <StepDecode decodeIndex={0} />
      case 2:
        return <StepDecode decodeIndex={1} />
      case 3:
        return <StepDecode decodeIndex={2} />
      case 4:
        return <StepSummary />
      default:
        return null
    }
  })()

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="mx-auto max-w-[600px]">
        <div className="flex justify-center overflow-x-auto">
          <svg
            viewBox="0 0 650 320"
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ fontFamily: FONT_MONO }}
          >
            {stepContent}
          </svg>
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <NavigationButton onClick={goToPrev} disabled={step === 0}>
            Prev
          </NavigationButton>

          <StepDots currentStep={step} />

          <NavigationButton onClick={goToNext} disabled={step === STEP_COUNT - 1}>
            Next
          </NavigationButton>
        </div>
      </div>
    </div>
  )
}
