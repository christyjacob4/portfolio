"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants — matched exactly to NetworkDiagram
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const LAYERS = [
  { label: "input", nodes: ["x₁", "x₂", "x₃"] },
  { label: "hidden 1", nodes: ["h₁", "h₂", "h₃", "h₄", "h₅"] },
  { label: "hidden 2", nodes: ["h₁", "h₂", "h₃", "h₄", "h₅"] },
  { label: "output", nodes: ["y₁", "y₂"] },
] as const;

const SVG_WIDTH = 700;
const SVG_HEIGHT = 340;
const LAYER_X_POSITIONS = [80, 260, 440, 620];
const NODE_RADIUS = 22;
const LABEL_Y = 30;
const NODE_AREA_TOP = 65;
const NODE_AREA_BOTTOM = 280;
const BG_COLOR = "hsl(240, 10%, 3.9%)";

const ANIMATION_INTERVAL_MS = 1800;
const DROPOUT_DEFAULT = 20;

const SLIDER_CLASSES = `h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10
  [&::-webkit-slider-thumb]:h-3.5
  [&::-webkit-slider-thumb]:w-3.5
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-[#4ade80]
  [&::-webkit-slider-thumb]:shadow-md
  [&::-moz-range-thumb]:h-3.5
  [&::-moz-range-thumb]:w-3.5
  [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:border-0
  [&::-moz-range-thumb]:bg-[#4ade80]`;

// ---------------------------------------------------------------------------
// Node positions — same logic as NetworkDiagram
// ---------------------------------------------------------------------------

interface NodePos {
  layer: number;
  index: number;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  fromLayer: number;
  fromIndex: number;
  toLayer: number;
  toIndex: number;
  x1: number; y1: number;
  x2: number; y2: number;
}

function computeNodes(): NodePos[] {
  const nodes: NodePos[] = [];
  for (let li = 0; li < LAYERS.length; li++) {
    const layer = LAYERS[li];
    const count = layer.nodes.length;
    const available = NODE_AREA_BOTTOM - NODE_AREA_TOP;
    const maxSpread = Math.min(available, count * 55);
    const spacing = count > 1 ? maxSpread / (count - 1) : 0;
    const center = NODE_AREA_TOP + available / 2;
    const startY = center - maxSpread / 2;
    for (let ni = 0; ni < count; ni++) {
      nodes.push({ layer: li, index: ni, x: LAYER_X_POSITIONS[li], y: startY + ni * spacing, label: layer.nodes[ni] });
    }
  }
  return nodes;
}

function computeEdges(nodes: NodePos[]): Edge[] {
  const edges: Edge[] = [];
  const byLayer = new Map<number, NodePos[]>();
  for (const n of nodes) {
    const list = byLayer.get(n.layer) ?? [];
    list.push(n);
    byLayer.set(n.layer, list);
  }
  for (let li = 0; li < LAYERS.length - 1; li++) {
    for (const from of byLayer.get(li) ?? []) {
      for (const to of byLayer.get(li + 1) ?? []) {
        edges.push({ fromLayer: li, fromIndex: from.index, toLayer: li + 1, toIndex: to.index, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
      }
    }
  }
  return edges;
}

const ALL_NODES = computeNodes();
const ALL_EDGES = computeEdges(ALL_NODES);

// Which layers can be dropped (hidden layers only)
const DROPPABLE_LAYERS = new Set([1, 2]);

function rollDropped(rate: number): Set<string> {
  const dropped = new Set<string>();
  for (const n of ALL_NODES) {
    if (DROPPABLE_LAYERS.has(n.layer) && Math.random() * 100 < rate) {
      dropped.add(`${n.layer}-${n.index}`);
    }
  }
  return dropped;
}

function isDropped(dropped: Set<string>, layer: number, index: number): boolean {
  return dropped.has(`${layer}-${index}`);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DropoutDemo() {
  const [dropoutRate, setDropoutRate] = useState(DROPOUT_DEFAULT);
  const [dropped, setDropped] = useState<Set<string>>(() => rollDropped(DROPOUT_DEFAULT));
  const rateRef = useRef(DROPOUT_DEFAULT);

  useEffect(() => { rateRef.current = dropoutRate; }, [dropoutRate]);

  const reroll = useCallback(() => {
    setDropped(rollDropped(rateRef.current));
  }, []);

  useEffect(() => {
    reroll();
    const id = setInterval(reroll, ANIMATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reroll]);

  // Immediately reroll when slider changes
  useEffect(() => { reroll(); }, [dropoutRate, reroll]);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[640px]"
          style={{ fontFamily: FONT_MONO }}
        >
          {/* Layer labels */}
          {LAYERS.map((layer, i) => (
            <text
              key={layer.label}
              x={LAYER_X_POSITIONS[i]}
              y={LABEL_Y}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize={11}
              letterSpacing="0.1em"
              style={{ textTransform: "uppercase" }}
            >
              {layer.label}
            </text>
          ))}

          {/* Edges */}
          {ALL_EDGES.map((edge, i) => {
            const fromOff = isDropped(dropped, edge.fromLayer, edge.fromIndex);
            const toOff = isDropped(dropped, edge.toLayer, edge.toIndex);
            const dead = fromOff || toOff;
            return (
              <line
                key={i}
                x1={edge.x1} y1={edge.y1}
                x2={edge.x2} y2={edge.y2}
                stroke={dead ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)"}
                strokeWidth={dead ? 0.5 : 1}
                style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
              />
            );
          })}

          {/* Nodes */}
          {ALL_NODES.map((node) => {
            const off = isDropped(dropped, node.layer, node.index);
            return (
              <g key={`${node.layer}-${node.index}`}>
                {/* Solid bg to hide edges */}
                <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill={BG_COLOR} />
                <circle
                  cx={node.x} cy={node.y} r={NODE_RADIUS}
                  fill={off ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.06)"}
                  stroke={off ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.15)"}
                  strokeWidth={1}
                  style={{ transition: "fill 0.5s ease, stroke 0.5s ease" }}
                />
                <text
                  x={node.x} y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={off ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)"}
                  fontSize={12}
                  style={{ transition: "fill 0.5s ease", pointerEvents: "none" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Slider */}
      <div className="mx-auto mt-3 flex max-w-md items-center gap-4">
        <label className="shrink-0 text-[11px] text-white/40" style={{ fontFamily: FONT_MONO }}>
          Dropout: {dropoutRate}%
        </label>
        <input
          type="range" min={0} max={50} step={5} value={dropoutRate}
          onChange={(e) => setDropoutRate(Number(e.target.value))}
          className={SLIDER_CLASSES}
        />
      </div>
    </div>
  );
}
