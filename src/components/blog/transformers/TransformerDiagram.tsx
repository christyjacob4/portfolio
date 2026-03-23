"use client"

import { useState } from "react"

const ACCENT = "#4ade80"

interface Layer {
  id: string
  label: string
  description: string
  y: number
  width: number
  height: number
  isAccented: boolean
}

const LAYERS: Layer[] = [
  {
    id: "input-embedding",
    label: "Input Embedding",
    description: "Converts tokens to dense vectors",
    y: 580,
    width: 200,
    height: 50,
    isAccented: false,
  },
  {
    id: "positional-encoding",
    label: "Positional Encoding",
    description: "Adds position information to embeddings",
    y: 480,
    width: 200,
    height: 50,
    isAccented: false,
  },
  {
    id: "multi-head-attention",
    label: "Multi-Head Attention",
    description: "Each token attends to all other tokens in parallel",
    y: 360,
    width: 230,
    height: 60,
    isAccented: true,
  },
  {
    id: "add-norm-1",
    label: "Add & Norm",
    description: "Residual connection + layer normalization",
    y: 270,
    width: 200,
    height: 50,
    isAccented: false,
  },
  {
    id: "feed-forward",
    label: "Feed Forward",
    description: "Two linear transformations with ReLU activation",
    y: 180,
    width: 200,
    height: 50,
    isAccented: false,
  },
  {
    id: "add-norm-2",
    label: "Add & Norm",
    description: "Residual connection + layer normalization",
    y: 90,
    width: 200,
    height: 50,
    isAccented: false,
  },
  {
    id: "output",
    label: "Output",
    description: "Contextual representations for each token",
    y: 20,
    width: 200,
    height: 50,
    isAccented: false,
  },
]

const CENTER_X = 220
const TOOLTIP_X = 355

function ArrowMarker() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.5)" />
      </marker>
      <marker
        id="arrowhead-dashed"
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

function layerTopY(layer: Layer): number {
  return layer.y
}

function layerBottomY(layer: Layer): number {
  return layer.y + layer.height
}

function layerLeftX(layer: Layer): number {
  return CENTER_X - layer.width / 2
}

function ConnectionArrow({
  fromLayer,
  toLayer,
}: {
  fromLayer: Layer
  toLayer: Layer
}) {
  const x = CENTER_X
  const y1 = layerTopY(fromLayer)
  const y2 = layerBottomY(toLayer)
  return (
    <line
      x1={x}
      y1={y1}
      x2={x}
      y2={y2}
      stroke="rgba(255,255,255,0.5)"
      strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
    />
  )
}

function PlusSymbol({ y }: { y: number }) {
  const x = CENTER_X + 120
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={12}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.6)"
        fontSize={16}
        fontWeight="bold"
      >
        +
      </text>
    </g>
  )
}

function ResidualConnection({
  fromLayer,
  toLayer,
}: {
  fromLayer: Layer
  toLayer: Layer
}) {
  const startY = layerTopY(fromLayer) + fromLayer.height / 2
  const endY = layerTopY(toLayer) + toLayer.height / 2
  const curveX = layerLeftX(fromLayer) - 30

  const path = `
    M ${layerLeftX(fromLayer)} ${startY}
    C ${curveX} ${startY}, ${curveX} ${endY}, ${layerLeftX(toLayer)} ${endY}
  `

  return (
    <path
      d={path}
      fill="none"
      stroke={ACCENT}
      strokeWidth={1.5}
      strokeDasharray="6 4"
      opacity={0.5}
      markerEnd="url(#arrowhead-dashed)"
    />
  )
}

function LayerBox({
  layer,
  isHovered,
  onHover,
  onLeave,
}: {
  layer: Layer
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const x = CENTER_X - layer.width / 2
  const borderColor = isHovered ? ACCENT : "rgba(255,255,255,0.1)"
  const fillColor = isHovered
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.03)"

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
        rx={8}
        ry={8}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={isHovered ? 1.5 : 1}
        style={{ transition: "all 0.2s ease" }}
      />
      {layer.isAccented && (
        <rect
          x={x}
          y={layer.y + 8}
          width={3}
          height={layer.height - 16}
          rx={1.5}
          fill={ACCENT}
        />
      )}
      <text
        x={CENTER_X}
        y={layer.y + layer.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isHovered ? "#ffffff" : "rgba(255,255,255,0.85)"}
        fontSize={13}
        fontFamily="monospace"
        style={{ transition: "fill 0.2s ease" }}
      >
        {layer.label}
      </text>
    </g>
  )
}

function Tooltip({ layer }: { layer: Layer }) {
  const tooltipY = layer.y + layer.height / 2

  return (
    <g>
      <line
        x1={CENTER_X + layer.width / 2 + 4}
        y1={tooltipY}
        x2={TOOLTIP_X - 4}
        y2={tooltipY}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <text
        x={TOOLTIP_X}
        y={tooltipY}
        dominantBaseline="central"
        fill="rgba(255,255,255,0.6)"
        fontSize={11}
        fontFamily="monospace"
      >
        {layer.description}
      </text>
    </g>
  )
}

export default function TransformerDiagram() {
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null)

  const inputEmbedding = LAYERS[0]
  const positionalEncoding = LAYERS[1]
  const multiHeadAttention = LAYERS[2]
  const addNorm1 = LAYERS[3]
  const feedForward = LAYERS[4]
  const addNorm2 = LAYERS[5]
  const output = LAYERS[6]

  const hoveredLayer = LAYERS.find((layer) => layer.id === hoveredLayerId)

  return (
    <div className="rounded-xl p-8">
      <svg
        viewBox="0 0 700 660"
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <ArrowMarker />

        {/* Connection arrows (bottom to top) */}
        <ConnectionArrow fromLayer={positionalEncoding} toLayer={inputEmbedding} />
        <ConnectionArrow fromLayer={multiHeadAttention} toLayer={positionalEncoding} />
        <ConnectionArrow fromLayer={addNorm1} toLayer={multiHeadAttention} />
        <ConnectionArrow fromLayer={feedForward} toLayer={addNorm1} />
        <ConnectionArrow fromLayer={addNorm2} toLayer={feedForward} />
        <ConnectionArrow fromLayer={output} toLayer={addNorm2} />

        {/* Plus symbol between Input Embedding and Positional Encoding */}
        <PlusSymbol
          y={(layerTopY(positionalEncoding) + layerBottomY(inputEmbedding)) / 2}
        />

        {/* Residual connections (dashed curves) */}
        <ResidualConnection
          fromLayer={positionalEncoding}
          toLayer={addNorm1}
        />
        <ResidualConnection fromLayer={addNorm1} toLayer={addNorm2} />

        {/* Layer boxes */}
        {LAYERS.map((layer) => (
          <LayerBox
            key={layer.id}
            layer={layer}
            isHovered={hoveredLayerId === layer.id}
            onHover={() => setHoveredLayerId(layer.id)}
            onLeave={() => setHoveredLayerId(null)}
          />
        ))}

        {/* Tooltip for hovered layer */}
        {hoveredLayer && <Tooltip layer={hoveredLayer} />}
      </svg>
    </div>
  )
}
