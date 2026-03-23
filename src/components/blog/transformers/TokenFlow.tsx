"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"]
const TOKEN_COUNT = TOKENS.length

const ACCENT = "#4ade80"
const BORDER_IDLE = "rgba(255,255,255,0.1)"
const CONNECTOR_IDLE = "rgba(255,255,255,0.15)"
const CONNECTOR_ACTIVE = ACCENT

const STEP_DURATION_MS = 800
const RESET_DELAY_MS = 1500

// Layout for the SVG coordinate system
const TOKEN_WIDTH = 52
const TOKEN_HEIGHT = 30
const TOKEN_GAP = 12
const TOKEN_Y = 20
const TOTAL_TOKENS_WIDTH =
  TOKEN_COUNT * TOKEN_WIDTH + (TOKEN_COUNT - 1) * TOKEN_GAP

// RNN hidden state bar
const HIDDEN_STATE_Y = TOKEN_Y + TOKEN_HEIGHT + 40
const HIDDEN_STATE_HEIGHT = 24

// Transformer attention arc area
const ATTENTION_ARC_Y = TOKEN_Y + TOKEN_HEIGHT + 14

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenX(index: number): number {
  return index * (TOKEN_WIDTH + TOKEN_GAP)
}

function tokenCenterX(index: number): number {
  return tokenX(index) + TOKEN_WIDTH / 2
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TokenBox({
  word,
  x,
  y,
  isActive,
}: {
  word: string
  x: number
  y: number
  isActive: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={TOKEN_WIDTH}
        height={TOKEN_HEIGHT}
        rx={6}
        ry={6}
        fill={isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.03)"}
        stroke={isActive ? ACCENT : BORDER_IDLE}
        strokeWidth={isActive ? 1.5 : 1}
        style={{
          transition: "fill 0.25s ease, stroke 0.25s ease",
          filter: isActive
            ? `drop-shadow(0 0 6px rgba(74,222,128,0.4))`
            : "none",
        }}
      />
      <text
        x={x + TOKEN_WIDTH / 2}
        y={y + TOKEN_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.7)"}
        fontSize={11}
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        style={{ transition: "fill 0.25s ease" }}
      >
        {word}
      </text>
    </g>
  )
}

/** The sequential arrow that sits between RNN tokens. */
function SequentialArrow({
  fromIndex,
  isActive,
}: {
  fromIndex: number
  isActive: boolean
}) {
  const x1 = tokenX(fromIndex) + TOKEN_WIDTH + 1
  const x2 = tokenX(fromIndex + 1) - 1
  const y = TOKEN_Y + TOKEN_HEIGHT / 2

  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={isActive ? ACCENT : CONNECTOR_IDLE}
      strokeWidth={1.2}
      markerEnd={isActive ? "url(#arrowActive)" : "url(#arrowIdle)"}
      style={{ transition: "stroke 0.25s ease" }}
    />
  )
}

/** A curved arc connecting two tokens for the attention visualization. */
function AttentionArc({
  fromIndex,
  toIndex,
  isActive,
}: {
  fromIndex: number
  toIndex: number
  isActive: boolean
}) {
  if (fromIndex === toIndex) return null

  const x1 = tokenCenterX(fromIndex)
  const x2 = tokenCenterX(toIndex)
  const distance = Math.abs(x2 - x1)
  const curveHeight = Math.min(distance * 0.4, 36)

  const midX = (x1 + x2) / 2
  const controlY = ATTENTION_ARC_Y + curveHeight

  const d = `M ${x1} ${ATTENTION_ARC_Y} Q ${midX} ${controlY} ${x2} ${ATTENTION_ARC_Y}`

  return (
    <path
      d={d}
      fill="none"
      stroke={isActive ? CONNECTOR_ACTIVE : CONNECTOR_IDLE}
      strokeWidth={isActive ? 1 : 0.6}
      opacity={isActive ? 0.7 : 0.25}
      style={{ transition: "stroke 0.3s ease, opacity 0.3s ease" }}
    />
  )
}

// ---------------------------------------------------------------------------
// Panel components
// ---------------------------------------------------------------------------

function RNNPanel({ activeStep }: { activeStep: number }) {
  const svgWidth = TOTAL_TOKENS_WIDTH
  const svgHeight = HIDDEN_STATE_Y + HIDDEN_STATE_HEIGHT + 8

  return (
    <div className="flex-1 min-w-0">
      <p className="font-mono text-[11px] tracking-wider text-white/50 uppercase mb-3 text-center">
        Sequential Processing
      </p>
      <div className="flex justify-center">
        <svg
          viewBox={`-4 0 ${svgWidth + 8} ${svgHeight}`}
          className="w-full max-w-[560px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrowIdle"
              viewBox="0 0 6 6"
              refX={5}
              refY={3}
              markerWidth={5}
              markerHeight={5}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 6 3 L 0 6 z" fill={CONNECTOR_IDLE} />
            </marker>
            <marker
              id="arrowActive"
              viewBox="0 0 6 6"
              refX={5}
              refY={3}
              markerWidth={5}
              markerHeight={5}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 6 3 L 0 6 z" fill={ACCENT} />
            </marker>
          </defs>

          {/* Token boxes */}
          {TOKENS.map((word, i) => (
            <TokenBox
              key={word + i}
              word={word}
              x={tokenX(i)}
              y={TOKEN_Y}
              isActive={activeStep >= 0 && i <= activeStep}
            />
          ))}

          {/* Sequential arrows between tokens */}
          {TOKENS.slice(0, -1).map((_, i) => (
            <SequentialArrow
              key={`arrow-${i}`}
              fromIndex={i}
              isActive={activeStep >= 0 && i < activeStep}
            />
          ))}

          {/* Hidden state bar */}
          <rect
            x={0}
            y={HIDDEN_STATE_Y}
            width={
              activeStep >= 0
                ? ((activeStep + 1) / TOKEN_COUNT) * svgWidth
                : 0
            }
            height={HIDDEN_STATE_HEIGHT}
            rx={4}
            fill="rgba(74,222,128,0.18)"
            stroke={ACCENT}
            strokeWidth={0.8}
            style={{ transition: "width 0.4s ease" }}
          />
          {activeStep >= 0 && (
            <text
              x={
                Math.min(((activeStep + 1) / TOKEN_COUNT) * svgWidth, svgWidth) /
                2
              }
              y={HIDDEN_STATE_Y + HIDDEN_STATE_HEIGHT / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.8)"
              fontSize={10}
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            >
              h{subscriptDigit(activeStep + 1)}
            </text>
          )}

          {/* Hidden state label */}
          <text
            x={svgWidth / 2}
            y={HIDDEN_STATE_Y - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          >
            hidden state
          </text>
        </svg>
      </div>
    </div>
  )
}

function TransformerPanel({ isActive }: { isActive: boolean }) {
  const svgWidth = TOTAL_TOKENS_WIDTH
  const svgHeight = ATTENTION_ARC_Y + 48

  // Generate all unique pairs for attention arcs
  const attentionPairs: [number, number][] = []
  for (let i = 0; i < TOKEN_COUNT; i++) {
    for (let j = i + 1; j < TOKEN_COUNT; j++) {
      attentionPairs.push([i, j])
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="font-mono text-[11px] tracking-wider text-white/50 uppercase mb-3 text-center">
        Parallel Processing
      </p>
      <div className="flex justify-center">
        <svg
          viewBox={`-4 0 ${svgWidth + 8} ${svgHeight}`}
          className="w-full max-w-[560px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Attention arcs (drawn behind tokens) */}
          {attentionPairs.map(([i, j]) => (
            <AttentionArc
              key={`arc-${i}-${j}`}
              fromIndex={i}
              toIndex={j}
              isActive={isActive}
            />
          ))}

          {/* Token boxes */}
          {TOKENS.map((word, i) => (
            <TokenBox
              key={word + i}
              word={word}
              x={tokenX(i)}
              y={TOKEN_Y}
              isActive={isActive}
            />
          ))}

          {/* "Self-Attention" label */}
          <text
            x={svgWidth / 2}
            y={svgHeight - 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          >
            self-attention
          </text>
        </svg>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Unicode subscript helper
// ---------------------------------------------------------------------------

const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉"

function subscriptDigit(n: number): string {
  return String(n)
    .split("")
    .map((ch) => SUBSCRIPT_DIGITS[parseInt(ch, 10)] ?? ch)
    .join("")
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TokenFlow() {
  const [rnnStep, setRnnStep] = useState(-1)
  const [transformerActive, setTransformerActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const playLoop = useCallback(() => {
    setRnnStep(-1)
    setTransformerActive(false)

    timerRef.current = setTimeout(() => {
      setTransformerActive(true)

      let step = 0
      const advance = () => {
        setRnnStep(step)
        step++
        if (step < TOKEN_COUNT) {
          timerRef.current = setTimeout(advance, STEP_DURATION_MS)
        } else {
          timerRef.current = setTimeout(() => {
            setRnnStep(-1)
            setTransformerActive(false)
            timerRef.current = setTimeout(playLoop, RESET_DELAY_MS)
          }, RESET_DELAY_MS)
        }
      }
      advance()
    }, 600)
  }, [])

  useEffect(() => {
    playLoop()
    return clearTimers
  }, [playLoop, clearTimers])

  return (
    <div className="not-prose my-8 rounded-xl p-5 sm:p-6">
      {/* Panels — stacked vertically */}
      <div className="flex flex-col gap-6">
        <RNNPanel activeStep={rnnStep} />
        <div className="h-px bg-white/10" />
        <TransformerPanel isActive={transformerActive} />
      </div>
    </div>
  )
}
