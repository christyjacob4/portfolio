"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const NODE_RADIUS = 22;

const LAYERS = [
  { label: "input", nodes: ["x₁", "x₂", "x₃"] },
  { label: "hidden 1", nodes: ["h₁", "h₂", "h₃", "h₄", "h₅"] },
  { label: "hidden 2", nodes: ["h₁", "h₂", "h₃", "h₄", "h₅"] },
  { label: "output", nodes: ["y₁", "y₂"] },
] as const;

const BIAS_COLOR = "rgba(180,160,220,0.7)";

const LAYER_PARAMS = [
  { weights: "3×5", bias: "5", count: 20 },
  { weights: "5×5", bias: "5", count: 30 },
  { weights: "5×2", bias: "2", count: 12 },
] as const;

const TOTAL_PARAMS = LAYER_PARAMS.reduce((sum, l) => sum + l.count, 0);

// SVG layout
const SVG_WIDTH = 700;
const SVG_HEIGHT = 380;
const LAYER_X_POSITIONS = [80, 260, 440, 620];
const LABEL_Y = 30;
const NODE_AREA_TOP = 65;
const NODE_AREA_BOTTOM = 280;

// ---------------------------------------------------------------------------
// Derived node positions (computed once)
// ---------------------------------------------------------------------------

interface NodePosition {
  layerIndex: number;
  nodeIndex: number;
  x: number;
  y: number;
  label: string;
}

function computeNodePositions(): NodePosition[] {
  const positions: NodePosition[] = [];

  for (let li = 0; li < LAYERS.length; li++) {
    const layer = LAYERS[li];
    const nodeCount = layer.nodes.length;
    const availableHeight = NODE_AREA_BOTTOM - NODE_AREA_TOP;
    // Constrain max spread so small layers cluster toward center
    const maxSpread = Math.min(availableHeight, nodeCount * 55);
    const spacing = nodeCount > 1 ? maxSpread / (nodeCount - 1) : 0;
    const centerY = NODE_AREA_TOP + availableHeight / 2;
    const startY = centerY - maxSpread / 2;

    for (let ni = 0; ni < nodeCount; ni++) {
      positions.push({
        layerIndex: li,
        nodeIndex: ni,
        x: LAYER_X_POSITIONS[li],
        y: startY + ni * spacing,
        label: layer.nodes[ni],
      });
    }
  }

  return positions;
}

const ALL_NODES = computeNodePositions();

// ---------------------------------------------------------------------------
// Edge definitions (all connections between adjacent layers)
// ---------------------------------------------------------------------------

interface Edge {
  fromLayerIndex: number;
  fromNodeIndex: number;
  toLayerIndex: number;
  toNodeIndex: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function computeEdges(nodes: NodePosition[]): Edge[] {
  const edges: Edge[] = [];
  const byLayer = new Map<number, NodePosition[]>();

  for (const node of nodes) {
    const list = byLayer.get(node.layerIndex) ?? [];
    list.push(node);
    byLayer.set(node.layerIndex, list);
  }

  for (let li = 0; li < LAYERS.length - 1; li++) {
    const fromNodes = byLayer.get(li) ?? [];
    const toNodes = byLayer.get(li + 1) ?? [];

    for (const from of fromNodes) {
      for (const to of toNodes) {
        edges.push({
          fromLayerIndex: li,
          fromNodeIndex: from.nodeIndex,
          toLayerIndex: li + 1,
          toNodeIndex: to.nodeIndex,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
        });
      }
    }
  }

  return edges;
}

const ALL_EDGES = computeEdges(ALL_NODES);

// ---------------------------------------------------------------------------
// Hover target identifier
// ---------------------------------------------------------------------------

type HoveredNode = { layerIndex: number; nodeIndex: number } | null;

function isEdgeConnected(edge: Edge, hovered: HoveredNode): boolean {
  if (!hovered) return false;

  return (
    (edge.fromLayerIndex === hovered.layerIndex &&
      edge.fromNodeIndex === hovered.nodeIndex) ||
    (edge.toLayerIndex === hovered.layerIndex &&
      edge.toNodeIndex === hovered.nodeIndex)
  );
}

// Returns the 0-based "connection index" that is highlighted (between layer
// pairs). Layer pair 0 connects layers 0-1, pair 1 connects layers 1-2.
function hoveredConnectionIndices(hovered: HoveredNode): Set<number> {
  if (!hovered) return new Set();
  const li = hovered.layerIndex;
  const set = new Set<number>();
  if (li > 0) set.add(li - 1);
  if (li < LAYERS.length - 1) set.add(li);
  return set;
}

// ---------------------------------------------------------------------------
// SVG Sub-components
// ---------------------------------------------------------------------------

function NetworkEdges({ hovered }: { hovered: HoveredNode }) {
  const isAnyHovered = hovered !== null;

  return (
    <>
      {ALL_EDGES.map((edge, i) => {
        const connected = isEdgeConnected(edge, hovered);
        const dimmed = isAnyHovered && !connected;

        return (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={connected ? ACCENT : "rgba(255,255,255,0.06)"}
            strokeWidth={connected ? 1.5 : 1}
            opacity={dimmed ? 0.03 : connected ? 0.6 : 1}
            style={{ transition: "opacity 0.3s ease, stroke 0.3s ease" }}
          />
        );
      })}
    </>
  );
}

function NetworkNodes({
  hovered,
  onHover,
  onLeave,
}: {
  hovered: HoveredNode;
  onHover: (node: HoveredNode) => void;
  onLeave: () => void;
}) {
  const isAnyHovered = hovered !== null;

  return (
    <>
      {ALL_NODES.map((node) => {
        const isThisHovered =
          hovered !== null &&
          hovered.layerIndex === node.layerIndex &&
          hovered.nodeIndex === node.nodeIndex;

        // In a fully connected network, every node in an adjacent layer is
        // connected to the hovered node.
        const isConnected =
          isThisHovered ||
          (isAnyHovered &&
            Math.abs(hovered.layerIndex - node.layerIndex) === 1);

        const dimmed = isAnyHovered && !isConnected && !isThisHovered;

        const fill = isThisHovered
          ? "rgba(74,222,128,0.15)"
          : "rgba(255,255,255,0.06)";
        const stroke = isThisHovered
          ? ACCENT
          : "rgba(255,255,255,0.25)";
        const labelFill = isThisHovered
          ? "rgba(255,255,255,1)"
          : "rgba(255,255,255,0.7)";

        return (
          <g
            key={`${node.layerIndex}-${node.nodeIndex}`}
            onMouseEnter={() =>
              onHover({
                layerIndex: node.layerIndex,
                nodeIndex: node.nodeIndex,
              })
            }
            onMouseLeave={onLeave}
            style={{
              cursor: "pointer",
              opacity: dimmed ? 0.03 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            {/* Solid background to hide edges behind the node */}
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS}
              fill="hsl(240, 10%, 3.9%)"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
              style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={labelFill}
              fontSize={12}
              style={{ transition: "fill 0.3s ease", pointerEvents: "none" }}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </>
  );
}

function LayerLabels() {
  return (
    <>
      {LAYERS.map((layer, i) => (
        <text
          key={layer.label}
          x={LAYER_X_POSITIONS[i]}
          y={LABEL_Y}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize={11}
          letterSpacing="0.1em"
          style={{ textTransform: "uppercase" }}
        >
          {layer.label}
        </text>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Parameter Count Display
// ---------------------------------------------------------------------------

function ParameterBadges({ hovered }: { hovered: HoveredNode }) {
  const activeConnections = useMemo(
    () => hoveredConnectionIndices(hovered),
    [hovered],
  );

  return (
    <>
      {LAYER_PARAMS.map((param, i) => {
        const x = (LAYER_X_POSITIONS[i] + LAYER_X_POSITIONS[i + 1]) / 2;
        const y = NODE_AREA_BOTTOM + 24;
        const isHighlighted = activeConnections.has(i);
        const weightColor = isHighlighted ? ACCENT : "rgba(255,255,255,0.5)";
        const biasColor = isHighlighted ? BIAS_COLOR : "rgba(180,160,220,0.25)";
        const eqColor = isHighlighted ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)";

        return (
          <g key={i} style={{ transition: "opacity 0.3s ease" }} opacity={hovered && !isHighlighted ? 0.15 : 1}>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              fontSize={12}
              fontFamily={FONT_MONO}
            >
              <tspan fill={weightColor} style={{ transition: "fill 0.3s ease" }}>{param.weights}</tspan>
              <tspan fill={eqColor}> + </tspan>
              <tspan fill={biasColor} style={{ transition: "fill 0.3s ease" }}>{param.bias}</tspan>
              <tspan fill={eqColor}> = {param.count}</tspan>
            </text>
          </g>
        );
      })}

      {/* Total at the far right */}
      <text
        x={SVG_WIDTH / 2}
        y={NODE_AREA_BOTTOM + 62}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={12}
        fontFamily={FONT_MONO}
      >
        total: {TOTAL_PARAMS} parameters
      </text>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function NetworkDiagram() {
  const [hovered, setHovered] = useState<HoveredNode>(null);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[640px]"
          style={{ fontFamily: FONT_MONO }}
        >
          <LayerLabels />
          <NetworkEdges hovered={hovered} />
          <NetworkNodes
            hovered={hovered}
            onHover={setHovered}
            onLeave={() => setHovered(null)}
          />
          <ParameterBadges hovered={hovered} />
        </svg>
      </div>
    </div>
  );
}
