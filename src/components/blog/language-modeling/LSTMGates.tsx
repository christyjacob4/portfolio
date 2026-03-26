"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace"
const NODE_BG = "hsl(240, 10%, 3.9%)"

const CELL_FILL = "rgba(255,255,255,0.03)"
const CELL_STROKE = "rgba(255,255,255,0.1)"
const CELL_STATE_STROKE = "rgba(255,255,255,0.15)"
const ARROW_COLOR = "rgba(255,255,255,0.4)"
const LABEL_DIM = "rgba(255,255,255,0.35)"
const LABEL_MEDIUM = "rgba(255,255,255,0.6)"

// Gate color palette
const GATE_COLORS = {
  forget: {
    fill: "rgba(239,68,68,0.15)",
    stroke: "rgba(239,68,68,0.4)",
    accent: "rgba(239,68,68,0.7)",
  },
  input: {
    fill: "rgba(74,222,128,0.15)",
    stroke: "rgba(74,222,128,0.4)",
    accent: "rgba(74,222,128,0.7)",
  },
  output: {
    fill: "rgba(100,200,255,0.15)",
    stroke: "rgba(100,200,255,0.4)",
    accent: "rgba(100,200,255,0.7)",
  },
} as const

const GATE_DESCRIPTIONS: Record<GateId, string> = {
  forget: "Decides what to throw away from cell state",
  input: "Decides what new information to store",
  output: "Decides what to output based on cell state",
}

// Layout geometry
const SVG_WIDTH = 500
const SVG_HEIGHT = 350

const CELL_X = 80
const CELL_Y = 80
const CELL_WIDTH = 340
const CELL_HEIGHT = 150

const GATE_WIDTH = 80
const GATE_HEIGHT = 40
const GATE_Y = CELL_Y + 70
const GATE_SPACING = 30

const GATE_START_X =
  CELL_X + (CELL_WIDTH - 3 * GATE_WIDTH - 2 * GATE_SPACING) / 2

const CELL_STATE_Y = CELL_Y + 30

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GateId = "forget" | "input" | "output"

interface GateConfig {
  id: GateId
  label: string
  x: number
}

// ---------------------------------------------------------------------------
// Gate layout
// ---------------------------------------------------------------------------

const GATES: GateConfig[] = [
  {
    id: "forget",
    label: "forget",
    x: GATE_START_X,
  },
  {
    id: "input",
    label: "input",
    x: GATE_START_X + GATE_WIDTH + GATE_SPACING,
  },
  {
    id: "output",
    label: "output",
    x: GATE_START_X + 2 * (GATE_WIDTH + GATE_SPACING),
  },
]

// ---------------------------------------------------------------------------
// SVG building blocks
// ---------------------------------------------------------------------------

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="lstm-arrow"
        markerWidth="8"
        markerHeight="6"
        refX="7"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={ARROW_COLOR} />
      </marker>
      <marker
        id="lstm-arrow-dim"
        markerWidth="8"
        markerHeight="6"
        refX="7"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={LABEL_DIM} />
      </marker>
    </defs>
  )
}

function CellStateBar() {
  return (
    <g>
      <line
        x1={CELL_X + 15}
        y1={CELL_STATE_Y}
        x2={CELL_X + CELL_WIDTH - 15}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text
        x={CELL_X + CELL_WIDTH / 2}
        y={CELL_STATE_Y - 10}
        textAnchor="middle"
        fill={LABEL_DIM}
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        cell state
      </text>
    </g>
  )
}

function GateBox({
  gate,
  isHovered,
  onHover,
  onLeave,
}: {
  gate: GateConfig
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const colors = GATE_COLORS[gate.id]
  const hoverStrokeWidth = isHovered ? 1.8 : 1
  const hoverFill = isHovered
    ? colors.fill.replace("0.15", "0.25")
    : colors.fill

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={gate.x}
        y={GATE_Y}
        width={GATE_WIDTH}
        height={GATE_HEIGHT}
        rx={6}
        fill={hoverFill}
        stroke={colors.stroke}
        strokeWidth={hoverStrokeWidth}
        style={{ transition: "all 0.3s ease" }}
      />
      <text
        x={gate.x + GATE_WIDTH / 2}
        y={GATE_Y + GATE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isHovered ? colors.accent : LABEL_MEDIUM}
        fontSize={10}
        fontFamily={FONT_MONO}
        style={{ transition: "fill 0.3s ease" }}
      >
        {gate.label}
      </text>

      {/* Vertical connector: gate to cell state */}
      <line
        x1={gate.x + GATE_WIDTH / 2}
        y1={GATE_Y}
        x2={gate.x + GATE_WIDTH / 2}
        y2={CELL_STATE_Y + 2}
        stroke={isHovered ? colors.stroke : "rgba(255,255,255,0.08)"}
        strokeWidth={1}
        strokeDasharray="3 3"
        style={{ transition: "stroke 0.3s ease" }}
      />
    </g>
  )
}

function InputArrows() {
  const inputMergeX = CELL_X + CELL_WIDTH / 2 - 30
  const inputMergeY = CELL_Y + CELL_HEIGHT + 30

  return (
    <g>
      {/* x_t arrow: from left, curving into the bottom of the cell */}
      <path
        d={`M 20 ${inputMergeY} L ${inputMergeX - 10} ${inputMergeY}`}
        fill="none"
        stroke={ARROW_COLOR}
        strokeWidth={1.2}
        markerEnd="url(#lstm-arrow)"
      />
      {/* Hide overlap at cell boundary */}
      <rect
        x={inputMergeX - 2}
        y={inputMergeY - 6}
        width={4}
        height={12}
        fill={NODE_BG}
      />
      <line
        x1={inputMergeX}
        y1={inputMergeY}
        x2={inputMergeX}
        y2={CELL_Y + CELL_HEIGHT}
        stroke={ARROW_COLOR}
        strokeWidth={1.2}
        markerEnd="url(#lstm-arrow)"
      />
      {/* x_t label */}
      <text
        x={20}
        y={inputMergeY - 8}
        fill={LABEL_MEDIUM}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        x
        <tspan fontSize={8} dy={3}>
          t
        </tspan>
      </text>

      {/* h_{t-1} arrow: from bottom-left, merging into the same entry point */}
      <path
        d={`M 20 ${inputMergeY + 50} L ${inputMergeX - 50} ${inputMergeY + 50} L ${inputMergeX - 50} ${inputMergeY} L ${inputMergeX - 12} ${inputMergeY}`}
        fill="none"
        stroke={ARROW_COLOR}
        strokeWidth={1.2}
        markerEnd="url(#lstm-arrow)"
      />
      {/* h_{t-1} label */}
      <text
        x={20}
        y={inputMergeY + 42}
        fill={LABEL_MEDIUM}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        h
        <tspan fontSize={8} dy={3}>
          t-1
        </tspan>
      </text>
    </g>
  )
}

function OutputArrows() {
  const outputX = CELL_X + CELL_WIDTH / 2 + 30

  return (
    <g>
      {/* h_t arrow: goes up from top of cell, then turns right */}
      <line
        x1={outputX}
        y1={CELL_Y}
        x2={outputX}
        y2={CELL_Y - 30}
        stroke={ARROW_COLOR}
        strokeWidth={1.2}
      />
      <line
        x1={outputX}
        y1={CELL_Y - 30}
        x2={outputX + 70}
        y2={CELL_Y - 30}
        stroke={ARROW_COLOR}
        strokeWidth={1.2}
        markerEnd="url(#lstm-arrow)"
      />
      {/* h_t label */}
      <text
        x={outputX + 74}
        y={CELL_Y - 34}
        fill={LABEL_MEDIUM}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        h
        <tspan fontSize={8} dy={3}>
          t
        </tspan>
      </text>

      {/* c_t arrow: cell state continues right out of the cell */}
      <line
        x1={CELL_X + CELL_WIDTH - 15}
        y1={CELL_STATE_Y}
        x2={CELL_X + CELL_WIDTH + 40}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#lstm-arrow-dim)"
      />
      {/* c_t label */}
      <text
        x={CELL_X + CELL_WIDTH + 44}
        y={CELL_STATE_Y - 8}
        fill={LABEL_DIM}
        fontSize={11}
        fontFamily={FONT_MONO}
      >
        c
        <tspan fontSize={8} dy={3}>
          t
        </tspan>
      </text>

      {/* Cell state entering from the left */}
      <line
        x1={CELL_X - 40}
        y1={CELL_STATE_Y}
        x2={CELL_X + 15}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#lstm-arrow-dim)"
      />
      {/* c_{t-1} label */}
      <text
        x={CELL_X - 43}
        y={CELL_STATE_Y - 8}
        fill={LABEL_DIM}
        fontSize={11}
        fontFamily={FONT_MONO}
        textAnchor="end"
      >
        c
        <tspan fontSize={8} dy={3}>
          t-1
        </tspan>
      </text>
    </g>
  )
}

function DescriptionTooltip({ gateId }: { gateId: GateId }) {
  const colors = GATE_COLORS[gateId]

  return (
    <text
      x={SVG_WIDTH / 2}
      y={CELL_Y + CELL_HEIGHT + 90}
      textAnchor="middle"
      fill={colors.accent}
      fontSize={10}
      fontFamily={FONT_MONO}
      style={{ transition: "opacity 0.3s ease" }}
    >
      {GATE_DESCRIPTIONS[gateId]}
    </text>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LSTMGates() {
  const [hoveredGate, setHoveredGate] = useState<GateId | null>(null)

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <ArrowMarkers />

        {/* Main LSTM cell outline */}
        <rect
          x={CELL_X}
          y={CELL_Y}
          width={CELL_WIDTH}
          height={CELL_HEIGHT}
          rx={12}
          fill={CELL_FILL}
          stroke={CELL_STROKE}
          strokeWidth={1}
        />

        {/* Cell state conveyor belt */}
        <CellStateBar />

        {/* Gate boxes */}
        {GATES.map((gate) => (
          <GateBox
            key={gate.id}
            gate={gate}
            isHovered={hoveredGate === gate.id}
            onHover={() => setHoveredGate(gate.id)}
            onLeave={() => setHoveredGate(null)}
          />
        ))}

        {/* Input arrows (x_t and h_{t-1}) */}
        <InputArrows />

        {/* Output arrows (h_t and c_t) */}
        <OutputArrows />

        {/* Hover description */}
        {hoveredGate && <DescriptionTooltip gateId={hoveredGate} />}
      </svg>
    </div>
  )
}
