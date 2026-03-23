"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80"
const BOX_FILL = "rgba(255,255,255,0.03)"
const BOX_FILL_HOVER = "rgba(255,255,255,0.08)"
const BOX_STROKE = "rgba(255,255,255,0.15)"
const TEXT_PRIMARY = "rgba(255,255,255,0.85)"
const ARROW_COLOR = "rgba(255,255,255,0.5)"

// Layout geometry
const ENCODER_CENTER_X = 190
const DECODER_CENTER_X = 600
const TOOLTIP_WIDTH = 280

const REGULAR_BOX_WIDTH = 160
const REGULAR_BOX_HEIGHT = 36
const ATTENTION_BOX_WIDTH = 180
const ATTENTION_BOX_HEIGHT = 42

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LayerConfig {
  id: string
  label: string
  description: string
  y: number
  width: number
  height: number
  isAttention: boolean
  isMasked?: boolean
}

interface ResidualConfig {
  fromId: string
  toId: string
}

// ---------------------------------------------------------------------------
// Layer data — Encoder (bottom to top, higher y = lower on screen)
// ---------------------------------------------------------------------------

const ENCODER_LAYERS: LayerConfig[] = [
  {
    id: "enc-input-embedding",
    label: "Input Embedding",
    description:
      "Converts source tokens (e.g., English) to vectors",
    y: 620,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "enc-positional-encoding",
    label: "Positional Encoding",
    description:
      "Injects token position information using sinusoidal functions",
    y: 545,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "enc-mha",
    label: "Multi-Head Attention",
    description:
      "Each token attends to all tokens in the source sequence across multiple heads",
    y: 430,
    width: ATTENTION_BOX_WIDTH,
    height: ATTENTION_BOX_HEIGHT,
    isAttention: true,
  },
  {
    id: "enc-add-norm-1",
    label: "Add & Norm",
    description: "Residual connection followed by layer normalization",
    y: 375,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "enc-ff",
    label: "Feed Forward",
    description:
      "Position-wise feed-forward network: two linear layers with ReLU",
    y: 310,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "enc-add-norm-2",
    label: "Add & Norm",
    description: "Residual connection followed by layer normalization",
    y: 255,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
]

const ENCODER_RESIDUALS: ResidualConfig[] = [
  { fromId: "enc-positional-encoding", toId: "enc-add-norm-1" },
  { fromId: "enc-add-norm-1", toId: "enc-add-norm-2" },
]

// ---------------------------------------------------------------------------
// Layer data — Decoder (bottom to top)
// ---------------------------------------------------------------------------

const DECODER_LAYERS: LayerConfig[] = [
  {
    id: "dec-output-embedding",
    label: "Output Embedding",
    description:
      "Converts target tokens (e.g., French), shifted right by one position",
    y: 620,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-positional-encoding",
    label: "Positional Encoding",
    description:
      "Injects position information into target token embeddings",
    y: 545,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-masked-mha",
    label: "Masked Multi-Head Attn",
    description:
      "Self-attention that prevents attending to future tokens \u2014 essential for autoregressive generation",
    y: 448,
    width: ATTENTION_BOX_WIDTH,
    height: ATTENTION_BOX_HEIGHT,
    isAttention: true,
    isMasked: true,
  },
  {
    id: "dec-add-norm-1",
    label: "Add & Norm",
    description: "Residual connection followed by layer normalization",
    y: 397,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-cross-attn",
    label: "Multi-Head Cross-Attn",
    description:
      "Decoder attends to encoder output \u2014 this is how it reads the source sequence",
    y: 335,
    width: ATTENTION_BOX_WIDTH,
    height: ATTENTION_BOX_HEIGHT,
    isAttention: true,
  },
  {
    id: "dec-add-norm-2",
    label: "Add & Norm",
    description: "Residual connection followed by layer normalization",
    y: 284,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-ff",
    label: "Feed Forward",
    description:
      "Position-wise feed-forward network: two linear layers with ReLU",
    y: 225,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-add-norm-3",
    label: "Add & Norm",
    description: "Residual connection followed by layer normalization",
    y: 174,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-linear",
    label: "Linear",
    description: "Projects decoder output to vocabulary size",
    y: 110,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
  {
    id: "dec-softmax",
    label: "Softmax",
    description:
      "Converts logits to a probability distribution over the next token",
    y: 60,
    width: REGULAR_BOX_WIDTH,
    height: REGULAR_BOX_HEIGHT,
    isAttention: false,
  },
]

const DECODER_RESIDUALS: ResidualConfig[] = [
  { fromId: "dec-positional-encoding", toId: "dec-add-norm-1" },
  { fromId: "dec-add-norm-1", toId: "dec-add-norm-2" },
  { fromId: "dec-add-norm-2", toId: "dec-add-norm-3" },
]

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function layerLeft(layer: LayerConfig, centerX: number): number {
  return centerX - layer.width / 2
}

function layerRight(layer: LayerConfig, centerX: number): number {
  return centerX + layer.width / 2
}

function layerTopY(layer: LayerConfig): number {
  return layer.y
}

function layerBottomY(layer: LayerConfig): number {
  return layer.y + layer.height
}

function layerMidY(layer: LayerConfig): number {
  return layer.y + layer.height / 2
}

function findLayer(layers: LayerConfig[], id: string): LayerConfig {
  return layers.find((l) => l.id === id)!
}

// ---------------------------------------------------------------------------
// SVG building blocks
// ---------------------------------------------------------------------------

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="ed-arrow"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={ARROW_COLOR} />
      </marker>
      <marker
        id="ed-arrow-accent"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={ACCENT} />
      </marker>
      <marker
        id="ed-arrow-cross"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={ACCENT} />
      </marker>
    </defs>
  )
}

function ConnectionArrow({
  centerX,
  fromLayer,
  toLayer,
}: {
  centerX: number
  fromLayer: LayerConfig
  toLayer: LayerConfig
}) {
  return (
    <line
      x1={centerX}
      y1={layerTopY(fromLayer)}
      x2={centerX}
      y2={layerBottomY(toLayer)}
      stroke={ARROW_COLOR}
      strokeWidth={1.2}
      markerEnd="url(#ed-arrow)"
    />
  )
}

function ResidualConnection({
  fromLayer,
  toLayer,
  centerX,
  side,
}: {
  fromLayer: LayerConfig
  toLayer: LayerConfig
  centerX: number
  side: "left" | "right"
}) {
  const startY = layerMidY(fromLayer)
  const endY = layerMidY(toLayer)
  const offset = side === "left" ? -30 : 30
  const startX =
    side === "left" ? layerLeft(fromLayer, centerX) : layerRight(fromLayer, centerX)
  const endX =
    side === "left" ? layerLeft(toLayer, centerX) : layerRight(toLayer, centerX)
  const curveX = startX + offset

  const path = `M ${startX} ${startY} C ${curveX} ${startY}, ${curveX} ${endY}, ${endX} ${endY}`

  return (
    <path
      d={path}
      fill="none"
      stroke={ACCENT}
      strokeWidth={1.2}
      strokeDasharray="5 3"
      opacity={0.4}
      markerEnd="url(#ed-arrow-accent)"
    />
  )
}

function PlusCircle({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={11}
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.6)"
        fontSize={15}
        fontWeight="bold"
      >
        +
      </text>
    </g>
  )
}

function NxBracket({
  centerX,
  topY,
  bottomY,
  side,
}: {
  centerX: number
  topY: number
  bottomY: number
  side: "left" | "right"
}) {
  const bracketWidth = 12
  const padding = 8
  const x =
    side === "left"
      ? centerX - ATTENTION_BOX_WIDTH / 2 - bracketWidth - padding
      : centerX + ATTENTION_BOX_WIDTH / 2 + padding

  const tipX = side === "left" ? x : x + bracketWidth
  const baseX = side === "left" ? x + bracketWidth : x
  const bracketTopY = topY - 6
  const bracketBottomY = bottomY + 6
  const midY = (bracketTopY + bracketBottomY) / 2

  const path = [
    `M ${tipX} ${bracketTopY}`,
    `L ${baseX} ${bracketTopY}`,
    `L ${baseX} ${midY - 4}`,
    `L ${tipX} ${midY}`,
    `L ${baseX} ${midY + 4}`,
    `L ${baseX} ${bracketBottomY}`,
    `L ${tipX} ${bracketBottomY}`,
  ].join(" ")

  const labelX = side === "left" ? x - 10 : x + bracketWidth + 10

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1.2}
      />
      <text
        x={labelX}
        y={midY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.4)"
        fontSize={12}
        fontFamily="monospace"
        fontStyle="italic"
      >
        Nx
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// LayerBox — renders a single labeled box with hover interaction
// ---------------------------------------------------------------------------

function LayerBox({
  layer,
  centerX,
  isHovered,
  onHover,
  onLeave,
}: {
  layer: LayerConfig
  centerX: number
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const x = layerLeft(layer, centerX)
  const borderColor = isHovered ? ACCENT : BOX_STROKE
  const fillColor = isHovered ? BOX_FILL_HOVER : BOX_FILL

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rx={6}
        ry={6}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={isHovered ? 1.5 : 1}
        style={{ transition: "all 0.2s ease" }}
      />
      {/* Accent bar for attention layers */}
      {layer.isAttention && (
        <rect
          x={x + 1}
          y={layer.y + 6}
          width={3}
          height={layer.height - 12}
          rx={1.5}
          fill={layer.isMasked ? "#ff6b6b" : ACCENT}
        />
      )}
      {/* Lock icon for masked attention */}
      {layer.isMasked && (
        <g>
          <rect
            x={x + layer.width - 24}
            y={layer.y + layer.height / 2 - 6}
            width={12}
            height={9}
            rx={2}
            fill="none"
            stroke="#ff6b6b"
            strokeWidth={1}
          />
          <path
            d={`M ${x + layer.width - 21} ${layer.y + layer.height / 2 - 6}
                V ${layer.y + layer.height / 2 - 9}
                a 3 3 0 0 1 6 0
                V ${layer.y + layer.height / 2 - 6}`}
            fill="none"
            stroke="#ff6b6b"
            strokeWidth={1}
          />
        </g>
      )}
      <text
        x={centerX}
        y={layer.y + layer.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isHovered ? "#ffffff" : TEXT_PRIMARY}
        fontSize={11}
        fontFamily="monospace"
        style={{ transition: "fill 0.2s ease" }}
      >
        {layer.label}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Cross-attention arrow from encoder to decoder
// ---------------------------------------------------------------------------

function CrossAttentionArrow({
  encoderLayers,
  decoderLayers,
  isHighlighted,
}: {
  encoderLayers: LayerConfig[]
  decoderLayers: LayerConfig[]
  isHighlighted: boolean
}) {
  const encoderAddNorm2 = findLayer(encoderLayers, "enc-add-norm-2")
  const crossAttn = findLayer(decoderLayers, "dec-cross-attn")

  const startX = layerRight(encoderAddNorm2, ENCODER_CENTER_X)
  const startY = layerMidY(encoderAddNorm2)
  const endX = layerLeft(crossAttn, DECODER_CENTER_X)
  const endY = layerMidY(crossAttn)

  const midX = (startX + endX) / 2
  const controlY1 = startY - 40
  const controlY2 = endY - 40

  const path = `M ${startX} ${startY} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${endX} ${endY}`

  const strokeColor = isHighlighted ? ACCENT : "rgba(255,255,255,0.25)"
  const strokeW = isHighlighted ? 2 : 1.2

  // Label position at the peak of the curve
  const labelX = midX
  const labelY = Math.min(controlY1, controlY2) - 4

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeDasharray={isHighlighted ? "none" : "6 4"}
        markerEnd="url(#ed-arrow-cross)"
        style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="auto"
        fill={isHighlighted ? ACCENT : "rgba(255,255,255,0.35)"}
        fontSize={9}
        fontFamily="monospace"
        style={{ transition: "fill 0.2s ease" }}
      >
        K, V from encoder
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Tooltip panel — appears to the right of the diagram
// ---------------------------------------------------------------------------

function TooltipPanel({
  layer,
  svgWidth,
}: {
  layer: LayerConfig
  svgWidth: number
}) {
  const tooltipX = svgWidth / 2 - TOOLTIP_WIDTH / 2
  const tooltipY = 700

  // Word-wrap the description into lines of ~40 chars
  const lines = wrapText(layer.description, 48)

  return (
    <g>
      <rect
        x={tooltipX}
        y={tooltipY}
        width={TOOLTIP_WIDTH}
        height={20 + lines.length * 15}
        rx={6}
        fill="rgba(0,0,0,0.5)"
        stroke={ACCENT}
        strokeWidth={0.8}
      />
      <text
        x={tooltipX + 12}
        y={tooltipY + 16}
        fill={ACCENT}
        fontSize={10}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {layer.label}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={tooltipX + 12}
          y={tooltipY + 31 + i * 14}
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
          fontFamily="monospace"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (candidate.length <= maxChars) {
      currentLine = candidate
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)

  return lines
}

// ---------------------------------------------------------------------------
// Column header and accent borders
// ---------------------------------------------------------------------------

function ColumnHeader({
  label,
  centerX,
  y,
}: {
  label: string
  centerX: number
  y: number
}) {
  return (
    <text
      x={centerX}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="rgba(255,255,255,0.6)"
      fontSize={13}
      fontFamily="monospace"
      fontWeight="bold"
      letterSpacing={2}
    >
      {label}
    </text>
  )
}

function ColumnAccentBorder({
  centerX,
  topY,
  bottomY,
  side,
}: {
  centerX: number
  topY: number
  bottomY: number
  side: "left" | "right"
}) {
  const offset = ATTENTION_BOX_WIDTH / 2 + 36
  const x = side === "left" ? centerX - offset : centerX + offset

  return (
    <line
      x1={x}
      y1={topY}
      x2={x}
      y2={bottomY}
      stroke={ACCENT}
      strokeWidth={2}
      opacity={0.15}
    />
  )
}

// ---------------------------------------------------------------------------
// Output label at the very top of the decoder
// ---------------------------------------------------------------------------

function OutputLabel({ centerX, y }: { centerX: number; y: number }) {
  return (
    <text
      x={centerX}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="rgba(255,255,255,0.5)"
      fontSize={10}
      fontFamily="monospace"
    >
      Output Probabilities
    </text>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EncoderDecoder() {
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null)

  const allLayers = [...ENCODER_LAYERS, ...DECODER_LAYERS]
  const hoveredLayer = allLayers.find((l) => l.id === hoveredLayerId) ?? null

  const isCrossAttentionHighlighted =
    hoveredLayerId === "dec-cross-attn" ||
    hoveredLayerId === "enc-add-norm-2"

  // Encoder connection pairs (bottom to top)
  const encoderConnections = adjacentPairs(ENCODER_LAYERS)
  // Decoder connection pairs (bottom to top)
  const decoderConnections = adjacentPairs(DECODER_LAYERS)

  // Encoder Nx bracket spans from mha to add-norm-2
  const encNxTop = findLayer(ENCODER_LAYERS, "enc-add-norm-2")
  const encNxBottom = findLayer(ENCODER_LAYERS, "enc-mha")

  // Decoder Nx bracket spans from masked-mha to add-norm-3
  const decNxTop = findLayer(DECODER_LAYERS, "dec-add-norm-3")
  const decNxBottom = findLayer(DECODER_LAYERS, "dec-masked-mha")

  // Plus circle positions (between embedding and positional encoding)
  const encPlusY =
    (layerTopY(findLayer(ENCODER_LAYERS, "enc-positional-encoding")) +
      layerBottomY(findLayer(ENCODER_LAYERS, "enc-input-embedding"))) /
    2
  const decPlusY =
    (layerTopY(findLayer(DECODER_LAYERS, "dec-positional-encoding")) +
      layerBottomY(findLayer(DECODER_LAYERS, "dec-output-embedding"))) /
    2

  const svgWidth = 800
  const svgHeight = hoveredLayer ? 760 : 690

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <ArrowMarkers />

        {/* Column headers */}
        <ColumnHeader label="ENCODER" centerX={ENCODER_CENTER_X} y={230} />
        <ColumnHeader label="DECODER" centerX={DECODER_CENTER_X} y={130} />

        {/* Subtle accent borders */}
        <ColumnAccentBorder
          centerX={ENCODER_CENTER_X}
          topY={242}
          bottomY={660}
          side="left"
        />
        <ColumnAccentBorder
          centerX={DECODER_CENTER_X}
          topY={142}
          bottomY={660}
          side="right"
        />

        {/* ---- Encoder ---- */}

        {/* Connection arrows */}
        {encoderConnections.map(([from, to]) => (
          <ConnectionArrow
            key={`${from.id}-${to.id}`}
            centerX={ENCODER_CENTER_X}
            fromLayer={from}
            toLayer={to}
          />
        ))}

        {/* Plus circle */}
        <PlusCircle cx={ENCODER_CENTER_X} cy={encPlusY} />

        {/* Residual connections */}
        {ENCODER_RESIDUALS.map(({ fromId, toId }) => (
          <ResidualConnection
            key={`${fromId}-${toId}`}
            fromLayer={findLayer(ENCODER_LAYERS, fromId)}
            toLayer={findLayer(ENCODER_LAYERS, toId)}
            centerX={ENCODER_CENTER_X}
            side="left"
          />
        ))}

        {/* Nx bracket */}
        <NxBracket
          centerX={ENCODER_CENTER_X}
          topY={layerTopY(encNxTop)}
          bottomY={layerBottomY(encNxBottom)}
          side="left"
        />

        {/* Layer boxes */}
        {ENCODER_LAYERS.map((layer) => (
          <LayerBox
            key={layer.id}
            layer={layer}
            centerX={ENCODER_CENTER_X}
            isHovered={hoveredLayerId === layer.id}
            onHover={() => setHoveredLayerId(layer.id)}
            onLeave={() => setHoveredLayerId(null)}
          />
        ))}

        {/* ---- Decoder ---- */}

        {/* Connection arrows */}
        {decoderConnections.map(([from, to]) => (
          <ConnectionArrow
            key={`${from.id}-${to.id}`}
            centerX={DECODER_CENTER_X}
            fromLayer={from}
            toLayer={to}
          />
        ))}

        {/* Plus circle */}
        <PlusCircle cx={DECODER_CENTER_X} cy={decPlusY} />

        {/* Residual connections */}
        {DECODER_RESIDUALS.map(({ fromId, toId }) => (
          <ResidualConnection
            key={`${fromId}-${toId}`}
            fromLayer={findLayer(DECODER_LAYERS, fromId)}
            toLayer={findLayer(DECODER_LAYERS, toId)}
            centerX={DECODER_CENTER_X}
            side="right"
          />
        ))}

        {/* Nx bracket */}
        <NxBracket
          centerX={DECODER_CENTER_X}
          topY={layerTopY(decNxTop)}
          bottomY={layerBottomY(decNxBottom)}
          side="right"
        />

        {/* Layer boxes */}
        {DECODER_LAYERS.map((layer) => (
          <LayerBox
            key={layer.id}
            layer={layer}
            centerX={DECODER_CENTER_X}
            isHovered={hoveredLayerId === layer.id}
            onHover={() => setHoveredLayerId(layer.id)}
            onLeave={() => setHoveredLayerId(null)}
          />
        ))}

        {/* Output arrow and label above softmax */}
        <line
          x1={DECODER_CENTER_X}
          y1={layerTopY(findLayer(DECODER_LAYERS, "dec-softmax")) - 18}
          x2={DECODER_CENTER_X}
          y2={layerTopY(findLayer(DECODER_LAYERS, "dec-softmax"))}
          stroke={ARROW_COLOR}
          strokeWidth={1.2}
          markerEnd="url(#ed-arrow)"
        />
        <OutputLabel
          centerX={DECODER_CENTER_X}
          y={layerTopY(findLayer(DECODER_LAYERS, "dec-softmax")) - 28}
        />

        {/* ---- Cross-attention arrow ---- */}
        <CrossAttentionArrow
          encoderLayers={ENCODER_LAYERS}
          decoderLayers={DECODER_LAYERS}
          isHighlighted={isCrossAttentionHighlighted}
        />

        {/* ---- Tooltip ---- */}
        {hoveredLayer && (
          <TooltipPanel layer={hoveredLayer} svgWidth={svgWidth} />
        )}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utility: create adjacent pairs from a layer array for connection arrows
// ---------------------------------------------------------------------------

function adjacentPairs(layers: LayerConfig[]): [LayerConfig, LayerConfig][] {
  const pairs: [LayerConfig, LayerConfig][] = []
  for (let i = 1; i < layers.length; i++) {
    // Arrow goes from layer[i] (higher/earlier in flow, lower on screen)
    // up to layer[i-1] (lower y = higher on screen)
    pairs.push([layers[i - 1], layers[i]])
  }
  return pairs
}
