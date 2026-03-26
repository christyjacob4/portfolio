"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace"
const NODE_BG = "hsl(240, 10%, 3.9%)"

const LINE_DIM = "rgba(255,255,255,0.08)"
const LABEL_DIM = "rgba(255,255,255,0.35)"
const LABEL_MEDIUM = "rgba(255,255,255,0.6)"

const STEP_DURATION_MS = 2000
const TRANSITION_DURATION = "0.5s"
const PAUSE_AFTER_CYCLE_MS = 1500

const SVG_WIDTH = 650
const SVG_HEIGHT = 350

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

type StepId = 0 | 1 | 2 | 3

interface StepConfig {
  id: StepId
  color: string
  label: string
}

const STEPS: StepConfig[] = [
  { id: 0, color: "rgba(239,68,68,0.5)", label: "forget: what to discard" },
  { id: 1, color: "rgba(74,222,128,0.5)", label: "input: what to store" },
  { id: 2, color: "rgba(250,200,50,0.5)", label: "cell state: update memory" },
  { id: 3, color: "rgba(100,180,255,0.5)", label: "output: what to expose" },
]

// ---------------------------------------------------------------------------
// Layout geometry
//
// The LSTM cell layout, left to right:
//   - Cell state line runs horizontally at y=65
//   - Hidden state line runs horizontally at y=280
//   - Four operation zones are spaced across the cell
//   - Input x_t enters from the bottom center
// ---------------------------------------------------------------------------

const CELL_STATE_Y = 65
const HIDDEN_STATE_Y = 280

// Horizontal positions of each gate zone (center x)
const FORGET_X = 145
const INPUT_SIGMA_X = 265
const INPUT_TANH_X = 315
const OUTPUT_X = 505

// Pointwise operation positions on the cell state line
const FORGET_MULTIPLY_X = 145
const INPUT_ADD_X = 290

// Vertical positions for gate nodes
const GATE_NODE_Y = 195
const CONCAT_Y = 280

// Operation node sizes
const GATE_RADIUS = 20
const OP_RADIUS = 12

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function opacityForElement(
  belongsToStep: StepId | StepId[],
  activeStep: StepId,
): number {
  const steps = Array.isArray(belongsToStep) ? belongsToStep : [belongsToStep]
  return steps.includes(activeStep) ? 1.0 : 0.15
}

function strokeForElement(
  belongsToStep: StepId | StepId[],
  activeStep: StepId,
): string {
  const steps = Array.isArray(belongsToStep) ? belongsToStep : [belongsToStep]
  if (!steps.includes(activeStep)) return LINE_DIM
  return STEPS[activeStep].color
}

function glowFilter(
  belongsToStep: StepId | StepId[],
  activeStep: StepId,
): string {
  const steps = Array.isArray(belongsToStep) ? belongsToStep : [belongsToStep]
  if (!steps.includes(activeStep)) return "none"
  return `drop-shadow(0 0 6px ${STEPS[activeStep].color})`
}

const transition = `opacity ${TRANSITION_DURATION} ease, stroke ${TRANSITION_DURATION} ease, fill ${TRANSITION_DURATION} ease, filter ${TRANSITION_DURATION} ease`

// ---------------------------------------------------------------------------
// SVG building blocks
// ---------------------------------------------------------------------------

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="walk-arrow"
        markerWidth="8"
        markerHeight="6"
        refX="7"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.4)" />
      </marker>
      <marker
        id="walk-arrow-dim"
        markerWidth="8"
        markerHeight="6"
        refX="7"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={LABEL_DIM} />
      </marker>
      {/* Colored arrow markers for each step */}
      {STEPS.map((step) => (
        <marker
          key={`walk-arrow-step-${step.id}`}
          id={`walk-arrow-step-${step.id}`}
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={step.color} />
        </marker>
      ))}
    </defs>
  )
}

function markerEnd(
  belongsToStep: StepId | StepId[],
  activeStep: StepId,
): string {
  const steps = Array.isArray(belongsToStep) ? belongsToStep : [belongsToStep]
  if (!steps.includes(activeStep)) return "url(#walk-arrow-dim)"
  return `url(#walk-arrow-step-${activeStep})`
}

// ---------------------------------------------------------------------------
// Gate node: circle with symbol (sigma or tanh)
// ---------------------------------------------------------------------------

function GateNode({
  cx,
  cy,
  symbol,
  belongsToStep,
  activeStep,
}: {
  cx: number
  cy: number
  symbol: string
  belongsToStep: StepId | StepId[]
  activeStep: StepId
}) {
  const opacity = opacityForElement(belongsToStep, activeStep)
  const stroke = strokeForElement(belongsToStep, activeStep)
  const filter = glowFilter(belongsToStep, activeStep)

  return (
    <g style={{ transition, opacity, filter }}>
      {/* Solid bg to hide overlapping lines */}
      <circle cx={cx} cy={cy} r={GATE_RADIUS} fill={NODE_BG} />
      <circle
        cx={cx}
        cy={cy}
        r={GATE_RADIUS}
        fill="rgba(255,255,255,0.04)"
        stroke={stroke}
        strokeWidth={1.5}
        style={{ transition }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={opacity > 0.5 ? "#fff" : LABEL_DIM}
        fontSize={symbol === "σ" ? 15 : 11}
        fontFamily={FONT_MONO}
        fontWeight={500}
        style={{ transition, pointerEvents: "none" }}
      >
        {symbol}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Pointwise operation node: smaller circle with symbol
// ---------------------------------------------------------------------------

function OpNode({
  cx,
  cy,
  symbol,
  belongsToStep,
  activeStep,
}: {
  cx: number
  cy: number
  symbol: string
  belongsToStep: StepId | StepId[]
  activeStep: StepId
}) {
  const opacity = opacityForElement(belongsToStep, activeStep)
  const stroke = strokeForElement(belongsToStep, activeStep)
  const filter = glowFilter(belongsToStep, activeStep)

  return (
    <g style={{ transition, opacity, filter }}>
      <circle cx={cx} cy={cy} r={OP_RADIUS} fill={NODE_BG} />
      <circle
        cx={cx}
        cy={cy}
        r={OP_RADIUS}
        fill="rgba(255,255,255,0.04)"
        stroke={stroke}
        strokeWidth={1.2}
        style={{ transition }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={opacity > 0.5 ? "#fff" : LABEL_DIM}
        fontSize={12}
        fontFamily={FONT_MONO}
        style={{ transition, pointerEvents: "none" }}
      >
        {symbol}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Connecting line with transition
// ---------------------------------------------------------------------------

function FlowLine({
  x1,
  y1,
  x2,
  y2,
  belongsToStep,
  activeStep,
  strokeWidth = 1.2,
  hasArrow = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  belongsToStep: StepId | StepId[]
  activeStep: StepId
  strokeWidth?: number
  hasArrow?: boolean
}) {
  const opacity = opacityForElement(belongsToStep, activeStep)
  const stroke = strokeForElement(belongsToStep, activeStep)

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      markerEnd={hasArrow ? markerEnd(belongsToStep, activeStep) : undefined}
      style={{ transition, opacity }}
    />
  )
}

// ---------------------------------------------------------------------------
// Cell state line (the horizontal "conveyor belt")
// ---------------------------------------------------------------------------

function CellStateLine({ activeStep }: { activeStep: StepId }) {
  const isHighlighted = activeStep === 2
  const cellStateColor = isHighlighted
    ? STEPS[2].color
    : "rgba(255,255,255,0.15)"

  return (
    <g>
      {/* Left segment: c_{t-1} entering */}
      <line
        x1={20}
        y1={CELL_STATE_Y}
        x2={FORGET_MULTIPLY_X - OP_RADIUS}
        y2={CELL_STATE_Y}
        stroke={cellStateColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        markerEnd="url(#walk-arrow-dim)"
        style={{ transition }}
      />
      {/* Middle segment: between forget multiply and input add */}
      <line
        x1={FORGET_MULTIPLY_X + OP_RADIUS}
        y1={CELL_STATE_Y}
        x2={INPUT_ADD_X - OP_RADIUS}
        y2={CELL_STATE_Y}
        stroke={cellStateColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        markerEnd="url(#walk-arrow-dim)"
        style={{ transition }}
      />
      {/* Right segment: after input add to output tanh branch */}
      <line
        x1={INPUT_ADD_X + OP_RADIUS}
        y1={CELL_STATE_Y}
        x2={630}
        y2={CELL_STATE_Y}
        stroke={cellStateColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        markerEnd="url(#walk-arrow-dim)"
        style={{ transition }}
      />

      {/* c_{t-1} label */}
      <text
        x={20}
        y={CELL_STATE_Y - 14}
        fill={LABEL_DIM}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        c
        <tspan fontSize={8} dy={3}>
          t-1
        </tspan>
      </text>

      {/* c_t label */}
      <text
        x={620}
        y={CELL_STATE_Y - 14}
        fill={LABEL_DIM}
        fontSize={11}
        fontFamily={FONT_MONO}
        textAnchor="end"
      >
        c
        <tspan fontSize={8} dy={3}>
          t
        </tspan>
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Hidden state line
// ---------------------------------------------------------------------------

function HiddenStateLine({ activeStep }: { activeStep: StepId }) {
  const isOutput = activeStep === 3
  const hiddenColor = isOutput ? STEPS[3].color : "rgba(255,255,255,0.15)"

  return (
    <g>
      {/* h_{t-1} entering from left */}
      <line
        x1={20}
        y1={HIDDEN_STATE_Y}
        x2={100}
        y2={HIDDEN_STATE_Y}
        stroke={hiddenColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd="url(#walk-arrow-dim)"
        style={{ transition }}
      />

      {/* h_t exiting on the right */}
      <line
        x1={OUTPUT_X + GATE_RADIUS + 20}
        y1={HIDDEN_STATE_Y}
        x2={630}
        y2={HIDDEN_STATE_Y}
        stroke={hiddenColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd="url(#walk-arrow-dim)"
        style={{ transition }}
      />

      {/* h_{t-1} label */}
      <text
        x={20}
        y={HIDDEN_STATE_Y - 12}
        fill={LABEL_DIM}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        h
        <tspan fontSize={8} dy={3}>
          t-1
        </tspan>
      </text>

      {/* h_t label */}
      <text
        x={620}
        y={HIDDEN_STATE_Y - 12}
        fill={LABEL_DIM}
        fontSize={11}
        fontFamily={FONT_MONO}
        textAnchor="end"
      >
        h
        <tspan fontSize={8} dy={3}>
          t
        </tspan>
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Input x_t label
// ---------------------------------------------------------------------------

function InputLabel() {
  return (
    <text
      x={SVG_WIDTH / 2}
      y={340}
      textAnchor="middle"
      fill={LABEL_MEDIUM}
      fontSize={11}
      fontFamily={FONT_MONO}
    >
      x
      <tspan fontSize={8} dy={3}>
        t
      </tspan>
    </text>
  )
}

// ---------------------------------------------------------------------------
// Forget gate zone (step 0)
// ---------------------------------------------------------------------------

function ForgetGate({ activeStep }: { activeStep: StepId }) {
  return (
    <g>
      {/* Sigmoid node */}
      <GateNode
        cx={FORGET_X}
        cy={GATE_NODE_Y}
        symbol="σ"
        belongsToStep={0}
        activeStep={activeStep}
      />

      {/* Arrow: sigma up to multiply on cell state */}
      <FlowLine
        x1={FORGET_X}
        y1={GATE_NODE_Y - GATE_RADIUS}
        x2={FORGET_X}
        y2={CELL_STATE_Y + OP_RADIUS}
        belongsToStep={0}
        activeStep={activeStep}
        hasArrow
      />

      {/* Multiply node on cell state */}
      <OpNode
        cx={FORGET_MULTIPLY_X}
        cy={CELL_STATE_Y}
        symbol="⊗"
        belongsToStep={[0, 2]}
        activeStep={activeStep}
      />

      {/* Input from concat (hidden + x) */}
      <FlowLine
        x1={FORGET_X}
        y1={CONCAT_Y}
        x2={FORGET_X}
        y2={GATE_NODE_Y + GATE_RADIUS}
        belongsToStep={0}
        activeStep={activeStep}
        hasArrow
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Input gate zone (step 1)
// ---------------------------------------------------------------------------

function InputGate({ activeStep }: { activeStep: StepId }) {
  const inputMultiplyY = 140

  return (
    <g>
      {/* Sigmoid node */}
      <GateNode
        cx={INPUT_SIGMA_X}
        cy={GATE_NODE_Y}
        symbol="σ"
        belongsToStep={1}
        activeStep={activeStep}
      />

      {/* Tanh node */}
      <GateNode
        cx={INPUT_TANH_X}
        cy={GATE_NODE_Y}
        symbol="tanh"
        belongsToStep={1}
        activeStep={activeStep}
      />

      {/* Multiply node where sigma and tanh outputs combine */}
      <OpNode
        cx={INPUT_ADD_X}
        cy={inputMultiplyY}
        symbol="⊗"
        belongsToStep={1}
        activeStep={activeStep}
      />

      {/* Arrow: sigma up to multiply */}
      <FlowLine
        x1={INPUT_SIGMA_X}
        y1={GATE_NODE_Y - GATE_RADIUS}
        x2={INPUT_SIGMA_X}
        y2={inputMultiplyY}
        belongsToStep={1}
        activeStep={activeStep}
        hasArrow={false}
      />
      <FlowLine
        x1={INPUT_SIGMA_X}
        y1={inputMultiplyY}
        x2={INPUT_ADD_X - OP_RADIUS}
        y2={inputMultiplyY}
        belongsToStep={1}
        activeStep={activeStep}
        hasArrow
      />

      {/* Arrow: tanh up to multiply */}
      <FlowLine
        x1={INPUT_TANH_X}
        y1={GATE_NODE_Y - GATE_RADIUS}
        x2={INPUT_TANH_X}
        y2={inputMultiplyY}
        belongsToStep={1}
        activeStep={activeStep}
        hasArrow={false}
      />
      <FlowLine
        x1={INPUT_TANH_X}
        y1={inputMultiplyY}
        x2={INPUT_ADD_X + OP_RADIUS}
        y2={inputMultiplyY}
        belongsToStep={1}
        activeStep={activeStep}
        hasArrow
      />

      {/* Add node on cell state */}
      <OpNode
        cx={INPUT_ADD_X}
        cy={CELL_STATE_Y}
        symbol="⊕"
        belongsToStep={[1, 2]}
        activeStep={activeStep}
      />

      {/* Arrow: multiply result up to add on cell state */}
      <FlowLine
        x1={INPUT_ADD_X}
        y1={inputMultiplyY - OP_RADIUS}
        x2={INPUT_ADD_X}
        y2={CELL_STATE_Y + OP_RADIUS}
        belongsToStep={[1, 2]}
        activeStep={activeStep}
        hasArrow
      />

      {/* Inputs from concat */}
      <FlowLine
        x1={INPUT_SIGMA_X}
        y1={CONCAT_Y}
        x2={INPUT_SIGMA_X}
        y2={GATE_NODE_Y + GATE_RADIUS}
        belongsToStep={1}
        activeStep={activeStep}
        hasArrow
      />
      <FlowLine
        x1={INPUT_TANH_X}
        y1={CONCAT_Y}
        x2={INPUT_TANH_X}
        y2={GATE_NODE_Y + GATE_RADIUS}
        belongsToStep={1}
        activeStep={activeStep}
        hasArrow
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Output gate zone (step 3)
// ---------------------------------------------------------------------------

function OutputGate({ activeStep }: { activeStep: StepId }) {
  const outputTanhY = 140
  const outputMultiplyY = HIDDEN_STATE_Y

  return (
    <g>
      {/* Sigmoid node */}
      <GateNode
        cx={OUTPUT_X}
        cy={GATE_NODE_Y}
        symbol="σ"
        belongsToStep={3}
        activeStep={activeStep}
      />

      {/* Tanh applied to cell state (small node branching down from cell state) */}
      <GateNode
        cx={OUTPUT_X}
        cy={outputTanhY}
        symbol="tanh"
        belongsToStep={3}
        activeStep={activeStep}
      />

      {/* Arrow: cell state down to tanh */}
      <FlowLine
        x1={OUTPUT_X}
        y1={CELL_STATE_Y}
        x2={OUTPUT_X}
        y2={outputTanhY - GATE_RADIUS}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow
      />

      {/* Multiply node: sigma output * tanh(cell state) */}
      <OpNode
        cx={OUTPUT_X}
        cy={outputMultiplyY}
        symbol="⊗"
        belongsToStep={3}
        activeStep={activeStep}
      />

      {/* Arrow: sigma down to multiply */}
      <FlowLine
        x1={OUTPUT_X}
        y1={GATE_NODE_Y + GATE_RADIUS}
        x2={OUTPUT_X}
        y2={outputMultiplyY - OP_RADIUS}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow
      />

      {/* Arrow: tanh down to multiply */}
      <FlowLine
        x1={OUTPUT_X - GATE_RADIUS}
        y1={outputTanhY}
        x2={OUTPUT_X - OP_RADIUS - 30}
        y2={outputTanhY}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow={false}
      />
      <FlowLine
        x1={OUTPUT_X - OP_RADIUS - 30}
        y1={outputTanhY}
        x2={OUTPUT_X - OP_RADIUS - 30}
        y2={outputMultiplyY}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow={false}
      />
      <FlowLine
        x1={OUTPUT_X - OP_RADIUS - 30}
        y1={outputMultiplyY}
        x2={OUTPUT_X - OP_RADIUS}
        y2={outputMultiplyY}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow
      />

      {/* Arrow: multiply output goes right to h_t */}
      <FlowLine
        x1={OUTPUT_X + OP_RADIUS}
        y1={outputMultiplyY}
        x2={OUTPUT_X + GATE_RADIUS + 20}
        y2={outputMultiplyY}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow
      />

      {/* Input from concat to sigma (enters from below the sigma node) */}
      <FlowLine
        x1={OUTPUT_X + 30}
        y1={CONCAT_Y}
        x2={OUTPUT_X + 30}
        y2={GATE_NODE_Y}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow={false}
      />
      <FlowLine
        x1={OUTPUT_X + 30}
        y1={GATE_NODE_Y}
        x2={OUTPUT_X + GATE_RADIUS}
        y2={GATE_NODE_Y}
        belongsToStep={3}
        activeStep={activeStep}
        hasArrow
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Concat zone: where h_{t-1} and x_t combine
// ---------------------------------------------------------------------------

function ConcatZone({ activeStep }: { activeStep: StepId }) {
  const concatColor =
    activeStep === 0
      ? STEPS[0].color
      : activeStep === 1
        ? STEPS[1].color
        : activeStep === 3
          ? STEPS[3].color
          : LINE_DIM

  return (
    <g>
      {/* Horizontal line along hidden state to distribute to gates */}
      <line
        x1={100}
        y1={HIDDEN_STATE_Y}
        x2={OUTPUT_X + 30}
        y2={HIDDEN_STATE_Y}
        stroke={concatColor}
        strokeWidth={1}
        style={{ transition }}
      />

      {/* x_t arrow coming up from the bottom */}
      <line
        x1={SVG_WIDTH / 2}
        y1={330}
        x2={SVG_WIDTH / 2}
        y2={HIDDEN_STATE_Y + 5}
        stroke={concatColor}
        strokeWidth={1.2}
        markerEnd="url(#walk-arrow)"
        style={{ transition }}
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step indicator dots
// ---------------------------------------------------------------------------

function StepIndicator({ activeStep }: { activeStep: StepId }) {
  const dotSpacing = 20
  const startX = SVG_WIDTH / 2 - ((STEPS.length - 1) * dotSpacing) / 2

  return (
    <g>
      {STEPS.map((step, i) => {
        const isActive = i === activeStep
        return (
          <circle
            key={step.id}
            cx={startX + i * dotSpacing}
            cy={20}
            r={isActive ? 4 : 3}
            fill={isActive ? step.color : "rgba(255,255,255,0.15)"}
            style={{
              transition: `fill ${TRANSITION_DURATION} ease, r ${TRANSITION_DURATION} ease`,
              filter: isActive
                ? `drop-shadow(0 0 4px ${step.color})`
                : "none",
            }}
          />
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Step label at the bottom
// ---------------------------------------------------------------------------

function StepLabel({ activeStep }: { activeStep: StepId }) {
  const step = STEPS[activeStep]

  return (
    <text
      x={SVG_WIDTH / 2}
      y={312}
      textAnchor="middle"
      fill={step.color}
      fontSize={10}
      fontFamily={FONT_MONO}
      style={{ transition: `fill ${TRANSITION_DURATION} ease` }}
    >
      {step.label}
    </text>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LSTMWalkthrough() {
  const [activeStep, setActiveStep] = useState<StepId>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const playLoop = useCallback(() => {
    let currentStep: StepId = 0
    setActiveStep(currentStep)

    const advance = () => {
      const nextStep = currentStep + 1
      if (nextStep <= 3) {
        currentStep = nextStep as StepId
        setActiveStep(currentStep)
        timerRef.current = setTimeout(advance, STEP_DURATION_MS)
      } else {
        // Pause after completing all 4 steps, then restart
        timerRef.current = setTimeout(() => {
          currentStep = 0
          setActiveStep(0)
          timerRef.current = setTimeout(advance, STEP_DURATION_MS)
        }, PAUSE_AFTER_CYCLE_MS)
      }
    }

    timerRef.current = setTimeout(advance, STEP_DURATION_MS)
  }, [])

  useEffect(() => {
    playLoop()
    return clearTimers
  }, [playLoop, clearTimers])

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[600px]"
          style={{ fontFamily: FONT_MONO }}
          preserveAspectRatio="xMidYMid meet"
        >
          <ArrowMarkers />

          {/* Step indicator dots */}
          <StepIndicator activeStep={activeStep} />

          {/* Cell state line (top horizontal) */}
          <CellStateLine activeStep={activeStep} />

          {/* Hidden state line (bottom horizontal) */}
          <HiddenStateLine activeStep={activeStep} />

          {/* Concat zone: h_{t-1} + x_t distribution */}
          <ConcatZone activeStep={activeStep} />

          {/* Gate zones */}
          <ForgetGate activeStep={activeStep} />
          <InputGate activeStep={activeStep} />
          <OutputGate activeStep={activeStep} />

          {/* Input label */}
          <InputLabel />

          {/* Current step description */}
          <StepLabel activeStep={activeStep} />
        </svg>
      </div>
    </div>
  )
}
