"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"] as const
const TOKEN_COUNT = TOKENS.length

const STEP_DURATION_MS = 800
const SUMMARY_DURATION_MS = 2000

const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace"
const NODE_BG = "hsl(240, 10%, 3.9%)"

const GREEN_FILL = "rgba(74,222,128,0.3)"
const GREEN_STROKE = "rgba(74,222,128,0.4)"
const GREEN_FILL_BRIGHT = "rgba(74,222,128,0.5)"
const GREEN_STROKE_BRIGHT = "rgba(74,222,128,0.6)"

const RED_FILL = "rgba(239,68,68,0.2)"
const RED_STROKE = "rgba(239,68,68,0.3)"
const RED_FILL_BRIGHT = "rgba(239,68,68,0.35)"
const RED_STROKE_BRIGHT = "rgba(239,68,68,0.45)"

// Layout
const SVG_WIDTH = 600
const SVG_HEIGHT = 350

const TOKEN_BOX_WIDTH = 52
const TOKEN_BOX_HEIGHT = 26
const TOKEN_GAP = 12
const TOKENS_START_X = 80
const TOKENS_START_Y = 16

const GRID_START_X = TOKENS_START_X
const GRID_START_Y = 70
const CELL_SIZE = 30
const CELL_GAP = 2
const ROW_GAP = 4
const LABEL_X = 10

// ---------------------------------------------------------------------------
// Derived computations
// ---------------------------------------------------------------------------

const TOTAL_COMPUTATIONS = (TOKEN_COUNT * (TOKEN_COUNT + 1)) / 2
const NEW_COMPUTATIONS = TOKEN_COUNT
const REDUNDANT_COMPUTATIONS = TOTAL_COMPUTATIONS - NEW_COMPUTATIONS

function computationsAtStep(step: number): number {
  return (step * (step + 1)) / 2
}

function redundantAtStep(step: number): number {
  return computationsAtStep(step) - step
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TokenBoxes({
  visibleCount,
  activeStep,
}: {
  visibleCount: number
  activeStep: number
}) {
  return (
    <g>
      {TOKENS.map((token, i) => {
        const x = TOKENS_START_X + i * (TOKEN_BOX_WIDTH + TOKEN_GAP)
        const isRevealed = i < visibleCount
        const isNewlyRevealed = i === activeStep - 1

        return (
          <g key={i}>
            <rect
              x={x}
              y={TOKENS_START_Y}
              width={TOKEN_BOX_WIDTH}
              height={TOKEN_BOX_HEIGHT}
              rx={5}
              ry={5}
              fill={NODE_BG}
              stroke={isRevealed ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}
              strokeWidth={1}
              style={{ transition: "stroke 0.3s ease" }}
            />
            <text
              x={x + TOKEN_BOX_WIDTH / 2}
              y={TOKENS_START_Y + TOKEN_BOX_HEIGHT / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontFamily={FONT_MONO}
              fill={
                isNewlyRevealed
                  ? "#4ade80"
                  : isRevealed
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.35)"
              }
              style={{ transition: "fill 0.3s ease" }}
            >
              {token}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function ComputeCounter({
  totalSoFar,
  redundantSoFar,
  showSummary,
}: {
  totalSoFar: number
  redundantSoFar: number
  showSummary: boolean
}) {
  if (showSummary) {
    return (
      <g style={{ transition: "opacity 0.3s ease" }}>
        <text
          x={SVG_WIDTH - 12}
          y={TOKENS_START_Y + 4}
          textAnchor="end"
          fontSize={10}
          fontFamily={FONT_MONO}
          fill="rgba(255,255,255,0.6)"
        >
          Total: {TOTAL_COMPUTATIONS} computations
        </text>
        <text
          x={SVG_WIDTH - 12}
          y={TOKENS_START_Y + 18}
          textAnchor="end"
          fontSize={10}
          fontFamily={FONT_MONO}
          fill="rgba(74,222,128,0.8)"
        >
          New work: {NEW_COMPUTATIONS}
        </text>
        <text
          x={SVG_WIDTH - 12}
          y={TOKENS_START_Y + 32}
          textAnchor="end"
          fontSize={10}
          fontFamily={FONT_MONO}
          fill="rgba(239,68,68,0.8)"
        >
          Redundant: {REDUNDANT_COMPUTATIONS}
        </text>
      </g>
    )
  }

  return (
    <text
      x={SVG_WIDTH - 12}
      y={TOKENS_START_Y + 10}
      textAnchor="end"
      fontSize={10}
      fontFamily={FONT_MONO}
      fill="rgba(255,255,255,0.5)"
      style={{ transition: "opacity 0.3s ease" }}
    >
      Compute: {totalSoFar} / {redundantSoFar} redundant
    </text>
  )
}

function GridRow({
  stepIndex,
  isCurrentStep,
  isPastStep,
}: {
  stepIndex: number
  isCurrentStep: boolean
  isPastStep: boolean
}) {
  const rowY = GRID_START_Y + stepIndex * (CELL_SIZE + ROW_GAP)
  const cellCount = stepIndex + 1

  return (
    <g
      style={{
        opacity: isCurrentStep || isPastStep ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Row label */}
      <text
        x={LABEL_X}
        y={rowY + CELL_SIZE / 2 + 1}
        dominantBaseline="central"
        fontSize={9}
        fontFamily={FONT_MONO}
        fill="rgba(255,255,255,0.4)"
      >
        step {stepIndex + 1}
      </text>

      {/* Cells */}
      {Array.from({ length: cellCount }, (_, colIndex) => {
        const isNewComputation = colIndex === cellCount - 1
        const x = GRID_START_X + colIndex * (CELL_SIZE + CELL_GAP)

        let fillColor: string
        let strokeColor: string

        if (isNewComputation) {
          fillColor = isCurrentStep ? GREEN_FILL_BRIGHT : GREEN_FILL
          strokeColor = isCurrentStep ? GREEN_STROKE_BRIGHT : GREEN_STROKE
        } else {
          fillColor = isCurrentStep ? RED_FILL_BRIGHT : RED_FILL
          strokeColor = isCurrentStep ? RED_STROKE_BRIGHT : RED_STROKE
        }

        return (
          <rect
            key={colIndex}
            x={x}
            y={rowY}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={4}
            ry={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1}
            style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
          />
        )
      })}
    </g>
  )
}

function ComputationGrid({ activeStep }: { activeStep: number }) {
  return (
    <g>
      {Array.from({ length: TOKEN_COUNT }, (_, stepIndex) => (
        <GridRow
          key={stepIndex}
          stepIndex={stepIndex}
          isCurrentStep={stepIndex === activeStep - 1}
          isPastStep={stepIndex < activeStep - 1}
        />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AutoregressiveLoop() {
  const [activeStep, setActiveStep] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const playLoop = useCallback(() => {
    clearTimer()
    setActiveStep(0)
    setShowSummary(false)

    let step = 0

    const advanceStep = () => {
      step++
      setActiveStep(step)

      if (step < TOKEN_COUNT) {
        timerRef.current = setTimeout(advanceStep, STEP_DURATION_MS)
      } else {
        // All steps done — show summary
        timerRef.current = setTimeout(() => {
          setShowSummary(true)

          // Hold summary, then reset and loop
          timerRef.current = setTimeout(() => {
            setShowSummary(false)
            setActiveStep(0)
            timerRef.current = setTimeout(playLoop, 400)
          }, SUMMARY_DURATION_MS)
        }, 300)
      }
    }

    timerRef.current = setTimeout(advanceStep, STEP_DURATION_MS)
  }, [clearTimer])

  useEffect(() => {
    playLoop()
    return clearTimer
  }, [playLoop, clearTimer])

  const totalSoFar = activeStep > 0 ? computationsAtStep(activeStep) : 0
  const redundantSoFar = activeStep > 0 ? redundantAtStep(activeStep) : 0

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="mx-auto max-w-[560px]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <TokenBoxes
            visibleCount={activeStep}
            activeStep={activeStep}
          />

          <ComputeCounter
            totalSoFar={totalSoFar}
            redundantSoFar={redundantSoFar}
            showSummary={showSummary}
          />

          <ComputationGrid activeStep={activeStep} />
        </svg>
      </div>
    </div>
  )
}
