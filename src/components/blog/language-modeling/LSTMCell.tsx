"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace"
const NODE_BG = "hsl(240, 10%, 3.9%)"

const CELL_STATE_STROKE = "rgba(255,255,255,0.12)"
const ARROW_STROKE = "rgba(255,255,255,0.08)"
const LABEL_COLOR = "rgba(255,255,255,0.4)"
const SYMBOL_COLOR = "rgba(255,255,255,0.6)"

const OP_FILL = "rgba(255,255,255,0.04)"
const OP_STROKE = "rgba(255,255,255,0.15)"

const SVG_WIDTH = 600
const SVG_HEIGHT = 320

// ---------------------------------------------------------------------------
// Gate color palette
// ---------------------------------------------------------------------------

const GATE_COLORS = {
  forget: {
    fill: "rgba(239,68,68,0.08)",
    stroke: "rgba(239,68,68,0.25)",
    glow: "rgba(239,68,68,0.5)",
  },
  input: {
    fill: "rgba(74,222,128,0.08)",
    stroke: "rgba(74,222,128,0.25)",
    glow: "rgba(74,222,128,0.5)",
  },
  output: {
    fill: "rgba(100,180,255,0.08)",
    stroke: "rgba(100,180,255,0.25)",
    glow: "rgba(100,180,255,0.5)",
  },
} as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GateId = "forget" | "input" | "output"

// ---------------------------------------------------------------------------
// Layout geometry
//
// Spatial zones (left to right):
//   - Cell state highway at y=60
//   - Input concatenation at y~260, merging at x~80
//   - Forget gate zone at x~150
//   - Input gate zone at x~250 (sigma + tanh side by side)
//   - Output gate zone at x~420
// ---------------------------------------------------------------------------

const CELL_STATE_Y = 60

// Gate node dimensions (rounded rect)
const GATE_W = 50
const GATE_H = 35
const GATE_RX = 8

// Pointwise operation circles
const OP_R = 12

// Y positions for gate layer and concat bus
const GATE_Y = 190
const CONCAT_Y = 260

// Horizontal positions of gate centers
const FORGET_X = 150
const INPUT_SIGMA_X = 240
const INPUT_TANH_X = 300
const OUTPUT_SIGMA_X = 420

// Pointwise operations on the cell state line
const FORGET_MULTIPLY_X = 150
const INPUT_ADD_X = 280
const OUTPUT_TANH_X = 420

// Output multiply where sigma output meets tanh(cell state)
const OUTPUT_MULTIPLY_X = 480
const OUTPUT_MULTIPLY_Y = 180

// ---------------------------------------------------------------------------
// Transition
// ---------------------------------------------------------------------------

const TRANSITION = "opacity 0.3s ease, stroke 0.3s ease, fill 0.3s ease, filter 0.3s ease"

// ---------------------------------------------------------------------------
// Helpers: derive opacity and color from hover state
// ---------------------------------------------------------------------------

function elementOpacity(
  hoveredGate: GateId | null,
  belongsTo: GateId | null,
): number {
  if (hoveredGate === null) return 1
  if (belongsTo === null) return 0.15
  return hoveredGate === belongsTo ? 1 : 0.15
}

function elementStroke(
  hoveredGate: GateId | null,
  belongsTo: GateId | null,
  defaultStroke: string,
): string {
  if (hoveredGate === null) return defaultStroke
  if (belongsTo === null) return defaultStroke
  if (hoveredGate !== belongsTo) return defaultStroke
  return GATE_COLORS[hoveredGate].glow
}

// ---------------------------------------------------------------------------
// SVG markers (arrowheads)
// ---------------------------------------------------------------------------

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="cell-arrow"
        markerWidth="6"
        markerHeight="5"
        refX="5"
        refY="2.5"
        orient="auto"
      >
        <polygon points="0 0, 6 2.5, 0 5" fill="rgba(255,255,255,0.4)" />
      </marker>
      <marker
        id="cell-arrow-dim"
        markerWidth="6"
        markerHeight="5"
        refX="5"
        refY="2.5"
        orient="auto"
      >
        <polygon points="0 0, 6 2.5, 0 5" fill="rgba(255,255,255,0.1)" />
      </marker>
      {/* Colored markers for each gate hover state */}
      {(["forget", "input", "output"] as const).map((gate) => (
        <marker
          key={`cell-arrow-${gate}`}
          id={`cell-arrow-${gate}`}
          markerWidth="6"
          markerHeight="5"
          refX="5"
          refY="2.5"
          orient="auto"
        >
          <polygon
            points="0 0, 6 2.5, 0 5"
            fill={GATE_COLORS[gate].glow}
          />
        </marker>
      ))}
    </defs>
  )
}

function arrowMarkerUrl(
  hoveredGate: GateId | null,
  belongsTo: GateId | null,
): string {
  if (hoveredGate === null) return "url(#cell-arrow-dim)"
  if (belongsTo !== null && hoveredGate === belongsTo)
    return `url(#cell-arrow-${hoveredGate})`
  return "url(#cell-arrow-dim)"
}

// ---------------------------------------------------------------------------
// Cell state highway: the horizontal conveyor belt
// ---------------------------------------------------------------------------

function CellStateHighway({ hoveredGate }: { hoveredGate: GateId | null }) {
  // The cell state line is always visible but dims when a gate is hovered
  // (except the segments connected to the hovered gate)
  const baseOpacity = hoveredGate === null ? 1 : 0.3

  return (
    <g>
      {/* Left segment: c_{t-1} to forget multiply */}
      <line
        x1={15}
        y1={CELL_STATE_Y}
        x2={FORGET_MULTIPLY_X - OP_R}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#cell-arrow-dim)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />

      {/* Middle segment: forget multiply to input add */}
      <line
        x1={FORGET_MULTIPLY_X + OP_R}
        y1={CELL_STATE_Y}
        x2={INPUT_ADD_X - OP_R}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#cell-arrow-dim)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />

      {/* Right segment: input add to output tanh */}
      <line
        x1={INPUT_ADD_X + OP_R}
        y1={CELL_STATE_Y}
        x2={OUTPUT_TANH_X - OP_R}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#cell-arrow-dim)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />

      {/* Final segment: output tanh to c_t */}
      <line
        x1={OUTPUT_TANH_X + OP_R}
        y1={CELL_STATE_Y}
        x2={585}
        y2={CELL_STATE_Y}
        stroke={CELL_STATE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#cell-arrow-dim)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />

      {/* c_{t-1} label */}
      <text
        x={15}
        y={CELL_STATE_Y - 12}
        fill={LABEL_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      >
        c
        <tspan fontSize={7} dy={2}>
          t-1
        </tspan>
      </text>

      {/* c_t label */}
      <text
        x={575}
        y={CELL_STATE_Y - 12}
        fill={LABEL_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        textAnchor="end"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      >
        c
        <tspan fontSize={7} dy={2}>
          t
        </tspan>
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Input concatenation zone: h_{t-1} and x_t merge, then fan out
// ---------------------------------------------------------------------------

function InputConcatZone({ hoveredGate }: { hoveredGate: GateId | null }) {
  const mergeX = 80
  const baseOpacity = hoveredGate === null ? 1 : 0.15

  return (
    <g>
      {/* h_{t-1} entering from the left */}
      <line
        x1={15}
        y1={CONCAT_Y}
        x2={mergeX}
        y2={CONCAT_Y}
        stroke={ARROW_STROKE}
        strokeWidth={1}
        markerEnd="url(#cell-arrow-dim)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />
      <text
        x={15}
        y={CONCAT_Y - 10}
        fill={LABEL_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      >
        h
        <tspan fontSize={7} dy={2}>
          t-1
        </tspan>
      </text>

      {/* x_t entering from the bottom */}
      <line
        x1={50}
        y1={310}
        x2={50}
        y2={CONCAT_Y + 5}
        stroke={ARROW_STROKE}
        strokeWidth={1}
        markerEnd="url(#cell-arrow-dim)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />
      <line
        x1={50}
        y1={CONCAT_Y}
        x2={mergeX}
        y2={CONCAT_Y}
        stroke={ARROW_STROKE}
        strokeWidth={1}
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />
      <text
        x={50}
        y={310}
        fill={LABEL_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        textAnchor="middle"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      >
        x
        <tspan fontSize={7} dy={2}>
          t
        </tspan>
      </text>

      {/* Concat merge dot */}
      <circle
        cx={mergeX}
        cy={CONCAT_Y}
        r={3}
        fill="rgba(255,255,255,0.35)"
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />

      {/* Fan-out line: horizontal bus from merge point to all gates */}
      <line
        x1={mergeX}
        y1={CONCAT_Y}
        x2={OUTPUT_SIGMA_X + 10}
        y2={CONCAT_Y}
        stroke={ARROW_STROKE}
        strokeWidth={1}
        style={{ transition: TRANSITION, opacity: baseOpacity }}
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Gate node: rounded rect with symbol (sigma or tanh)
// ---------------------------------------------------------------------------

function GateNode({
  cx,
  cy,
  symbol,
  colors,
  hoveredGate,
  belongsTo,
  onHover,
  onLeave,
}: {
  cx: number
  cy: number
  symbol: string
  colors: { fill: string; stroke: string; glow: string }
  hoveredGate: GateId | null
  belongsTo: GateId
  onHover: () => void
  onLeave: () => void
}) {
  const opacity = elementOpacity(hoveredGate, belongsTo)
  const isHighlighted = hoveredGate === belongsTo
  const strokeColor = isHighlighted ? colors.glow : colors.stroke
  const fillColor = isHighlighted
    ? colors.fill.replace("0.08", "0.15")
    : colors.fill

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer", transition: TRANSITION, opacity }}
    >
      {/* Solid background to hide crossing lines */}
      <rect
        x={cx - GATE_W / 2}
        y={cy - GATE_H / 2}
        width={GATE_W}
        height={GATE_H}
        rx={GATE_RX}
        fill={NODE_BG}
      />
      {/* Visible gate rect */}
      <rect
        x={cx - GATE_W / 2}
        y={cy - GATE_H / 2}
        width={GATE_W}
        height={GATE_H}
        rx={GATE_RX}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isHighlighted ? 1.5 : 1}
        style={{
          transition: TRANSITION,
          filter: isHighlighted
            ? `drop-shadow(0 0 6px ${colors.glow})`
            : "none",
        }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={SYMBOL_COLOR}
        fontSize={symbol === "tanh" ? 10 : 13}
        fontFamily={FONT_MONO}
        fontWeight={500}
        style={{ pointerEvents: "none", transition: TRANSITION }}
      >
        {symbol}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Pointwise operation node: circle with symbol
// ---------------------------------------------------------------------------

function OpNode({
  cx,
  cy,
  symbol,
  hoveredGate,
  belongsTo,
}: {
  cx: number
  cy: number
  symbol: string
  hoveredGate: GateId | null
  belongsTo: GateId | null
}) {
  const opacity = elementOpacity(hoveredGate, belongsTo)
  const strokeColor = elementStroke(hoveredGate, belongsTo, OP_STROKE)
  const isHighlighted =
    hoveredGate !== null && belongsTo !== null && hoveredGate === belongsTo

  return (
    <g style={{ transition: TRANSITION, opacity }}>
      {/* Solid background to hide crossing lines */}
      <circle cx={cx} cy={cy} r={OP_R} fill={NODE_BG} />
      <circle
        cx={cx}
        cy={cy}
        r={OP_R}
        fill={OP_FILL}
        stroke={strokeColor}
        strokeWidth={1}
        style={{
          transition: TRANSITION,
          filter: isHighlighted
            ? `drop-shadow(0 0 4px ${GATE_COLORS[hoveredGate].glow})`
            : "none",
        }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={SYMBOL_COLOR}
        fontSize={12}
        fontFamily={FONT_MONO}
        style={{ pointerEvents: "none", transition: TRANSITION }}
      >
        {symbol}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Flow arrow: a line segment with optional arrowhead
// ---------------------------------------------------------------------------

function FlowArrow({
  x1,
  y1,
  x2,
  y2,
  hoveredGate,
  belongsTo,
  hasArrow = true,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  hoveredGate: GateId | null
  belongsTo: GateId | null
  hasArrow?: boolean
}) {
  const opacity = elementOpacity(hoveredGate, belongsTo)
  const stroke = elementStroke(hoveredGate, belongsTo, ARROW_STROKE)

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={1}
      markerEnd={hasArrow ? arrowMarkerUrl(hoveredGate, belongsTo) : undefined}
      style={{ transition: TRANSITION, opacity }}
    />
  )
}

// ---------------------------------------------------------------------------
// Flow path: a multi-segment path with optional arrowhead
// ---------------------------------------------------------------------------

function FlowPath({
  d,
  hoveredGate,
  belongsTo,
  hasArrow = true,
}: {
  d: string
  hoveredGate: GateId | null
  belongsTo: GateId | null
  hasArrow?: boolean
}) {
  const opacity = elementOpacity(hoveredGate, belongsTo)
  const stroke = elementStroke(hoveredGate, belongsTo, ARROW_STROKE)

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={1}
      markerEnd={hasArrow ? arrowMarkerUrl(hoveredGate, belongsTo) : undefined}
      style={{ transition: TRANSITION, opacity }}
    />
  )
}

// ---------------------------------------------------------------------------
// Forget gate zone
// ---------------------------------------------------------------------------

function ForgetGateZone({
  hoveredGate,
  onHover,
  onLeave,
}: {
  hoveredGate: GateId | null
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <g>
      {/* Arrow: concat bus up to forget sigma */}
      <FlowArrow
        x1={FORGET_X}
        y1={CONCAT_Y}
        x2={FORGET_X}
        y2={GATE_Y + GATE_H / 2}
        hoveredGate={hoveredGate}
        belongsTo="forget"
      />

      {/* Forget sigma gate */}
      <GateNode
        cx={FORGET_X}
        cy={GATE_Y}
        symbol={"\u03C3"}
        colors={GATE_COLORS.forget}
        hoveredGate={hoveredGate}
        belongsTo="forget"
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Arrow: forget sigma up to multiply on cell state */}
      <FlowArrow
        x1={FORGET_X}
        y1={GATE_Y - GATE_H / 2}
        x2={FORGET_X}
        y2={CELL_STATE_Y + OP_R}
        hoveredGate={hoveredGate}
        belongsTo="forget"
      />

      {/* Multiply on cell state */}
      <OpNode
        cx={FORGET_MULTIPLY_X}
        cy={CELL_STATE_Y}
        symbol={"\u2297"}
        hoveredGate={hoveredGate}
        belongsTo="forget"
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Input gate zone
// ---------------------------------------------------------------------------

function InputGateZone({
  hoveredGate,
  onHover,
  onLeave,
}: {
  hoveredGate: GateId | null
  onHover: () => void
  onLeave: () => void
}) {
  // The intermediate multiply where sigma and tanh outputs combine
  const intermediateMultiplyY = 135
  const intermediateMultiplyX = 270

  return (
    <g>
      {/* Arrow: concat bus up to input sigma */}
      <FlowArrow
        x1={INPUT_SIGMA_X}
        y1={CONCAT_Y}
        x2={INPUT_SIGMA_X}
        y2={GATE_Y + GATE_H / 2}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />

      {/* Arrow: concat bus up to input tanh */}
      <FlowArrow
        x1={INPUT_TANH_X}
        y1={CONCAT_Y}
        x2={INPUT_TANH_X}
        y2={GATE_Y + GATE_H / 2}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />

      {/* Input sigma gate */}
      <GateNode
        cx={INPUT_SIGMA_X}
        cy={GATE_Y}
        symbol={"\u03C3"}
        colors={GATE_COLORS.input}
        hoveredGate={hoveredGate}
        belongsTo="input"
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Input tanh gate */}
      <GateNode
        cx={INPUT_TANH_X}
        cy={GATE_Y}
        symbol="tanh"
        colors={GATE_COLORS.input}
        hoveredGate={hoveredGate}
        belongsTo="input"
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Arrow: sigma up, then right to intermediate multiply */}
      <FlowPath
        d={`M ${INPUT_SIGMA_X} ${GATE_Y - GATE_H / 2} L ${INPUT_SIGMA_X} ${intermediateMultiplyY} L ${intermediateMultiplyX - OP_R} ${intermediateMultiplyY}`}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />

      {/* Arrow: tanh up, then left to intermediate multiply */}
      <FlowPath
        d={`M ${INPUT_TANH_X} ${GATE_Y - GATE_H / 2} L ${INPUT_TANH_X} ${intermediateMultiplyY} L ${intermediateMultiplyX + OP_R} ${intermediateMultiplyY}`}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />

      {/* Intermediate multiply: sigma * tanh */}
      <OpNode
        cx={intermediateMultiplyX}
        cy={intermediateMultiplyY}
        symbol={"\u2297"}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />

      {/* Arrow: intermediate multiply up to add on cell state */}
      <FlowArrow
        x1={intermediateMultiplyX}
        y1={intermediateMultiplyY - OP_R}
        x2={INPUT_ADD_X}
        y2={CELL_STATE_Y + OP_R}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />

      {/* Add on cell state */}
      <OpNode
        cx={INPUT_ADD_X}
        cy={CELL_STATE_Y}
        symbol={"\u2295"}
        hoveredGate={hoveredGate}
        belongsTo="input"
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Output gate zone
// ---------------------------------------------------------------------------

function OutputGateZone({
  hoveredGate,
  onHover,
  onLeave,
}: {
  hoveredGate: GateId | null
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <g>
      {/* Arrow: concat bus up to output sigma */}
      <FlowArrow
        x1={OUTPUT_SIGMA_X}
        y1={CONCAT_Y}
        x2={OUTPUT_SIGMA_X}
        y2={GATE_Y + GATE_H / 2}
        hoveredGate={hoveredGate}
        belongsTo="output"
      />

      {/* Output sigma gate */}
      <GateNode
        cx={OUTPUT_SIGMA_X}
        cy={GATE_Y}
        symbol={"\u03C3"}
        colors={GATE_COLORS.output}
        hoveredGate={hoveredGate}
        belongsTo="output"
        onHover={onHover}
        onLeave={onLeave}
      />

      {/* Tanh on cell state line */}
      <OpNode
        cx={OUTPUT_TANH_X}
        cy={CELL_STATE_Y}
        symbol="tanh"
        hoveredGate={hoveredGate}
        belongsTo="output"
      />

      {/* Arrow: tanh on cell state down to output multiply */}
      <FlowPath
        d={`M ${OUTPUT_TANH_X} ${CELL_STATE_Y + OP_R} L ${OUTPUT_TANH_X} ${OUTPUT_MULTIPLY_Y - 15} L ${OUTPUT_MULTIPLY_X - OP_R} ${OUTPUT_MULTIPLY_Y}`}
        hoveredGate={hoveredGate}
        belongsTo="output"
      />

      {/* Arrow: output sigma right to output multiply */}
      <FlowPath
        d={`M ${OUTPUT_SIGMA_X + GATE_W / 2} ${GATE_Y} L ${OUTPUT_MULTIPLY_X} ${GATE_Y} L ${OUTPUT_MULTIPLY_X} ${OUTPUT_MULTIPLY_Y - OP_R}`}
        hoveredGate={hoveredGate}
        belongsTo="output"
      />

      {/* Output multiply: sigma * tanh(cell state) */}
      <OpNode
        cx={OUTPUT_MULTIPLY_X}
        cy={OUTPUT_MULTIPLY_Y}
        symbol={"\u2297"}
        hoveredGate={hoveredGate}
        belongsTo="output"
      />

      {/* Arrow: output multiply down to h_t output line */}
      <FlowArrow
        x1={OUTPUT_MULTIPLY_X}
        y1={OUTPUT_MULTIPLY_Y + OP_R}
        x2={OUTPUT_MULTIPLY_X}
        y2={CONCAT_Y}
        hoveredGate={hoveredGate}
        belongsTo="output"
        hasArrow={false}
      />

      {/* h_t exits to the right */}
      <FlowArrow
        x1={OUTPUT_MULTIPLY_X}
        y1={CONCAT_Y}
        x2={585}
        y2={CONCAT_Y}
        hoveredGate={hoveredGate}
        belongsTo="output"
      />

      {/* h_t label */}
      <text
        x={575}
        y={CONCAT_Y - 10}
        fill={LABEL_COLOR}
        fontSize={10}
        fontFamily={FONT_MONO}
        textAnchor="end"
        style={{
          transition: TRANSITION,
          opacity: elementOpacity(hoveredGate, "output"),
        }}
      >
        h
        <tspan fontSize={7} dy={2}>
          t
        </tspan>
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LSTMCell() {
  const [hoveredGate, setHoveredGate] = useState<GateId | null>(null)

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="mx-auto max-w-[580px]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ fontFamily: FONT_MONO }}
          preserveAspectRatio="xMidYMid meet"
        >
          <ArrowMarkers />

          {/* Cell state highway (drawn first, behind everything) */}
          <CellStateHighway hoveredGate={hoveredGate} />

          {/* Input concat zone (h_{t-1}, x_t, fan-out bus) */}
          <InputConcatZone hoveredGate={hoveredGate} />

          {/* Gate zones (order matters: arrows first, then nodes on top) */}
          <ForgetGateZone
            hoveredGate={hoveredGate}
            onHover={() => setHoveredGate("forget")}
            onLeave={() => setHoveredGate(null)}
          />
          <InputGateZone
            hoveredGate={hoveredGate}
            onHover={() => setHoveredGate("input")}
            onLeave={() => setHoveredGate(null)}
          />
          <OutputGateZone
            hoveredGate={hoveredGate}
            onHover={() => setHoveredGate("output")}
            onLeave={() => setHoveredGate(null)}
          />
        </svg>
      </div>
    </div>
  )
}
