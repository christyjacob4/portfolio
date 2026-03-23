"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_SIZE = 500;
const PADDING = 22;

const DATA_MIN = 0;
const DATA_MAX = 10;

const DOT_RADIUS = 4;
const HIT_AREA_RADIUS = 20;
const NEIGHBOR_COUNT = 3;

const GRID_LINE_COLOR = "rgba(255,255,255,0.04)";
const AXIS_LINE_COLOR = "rgba(255,255,255,0.12)";

// ---------------------------------------------------------------------------
// Word data
// ---------------------------------------------------------------------------

interface Word {
  label: string;
  x: number;
  y: number;
  cluster: Cluster;
}

type Cluster = "animals" | "verbs" | "objects" | "determiners" | "prepositions";

const CLUSTER_COLORS: Record<Cluster, string> = {
  animals: "rgba(74,222,128,0.10)",
  verbs: "rgba(80,170,220,0.10)",
  objects: "rgba(100,200,120,0.10)",
  determiners: "rgba(200,180,80,0.10)",
  prepositions: "rgba(180,100,200,0.10)",
};

const WORDS: Word[] = [
  // Animals — tight organic cluster
  { label: "cat", x: 2.6, y: 6.8, cluster: "animals" },
  { label: "dog", x: 3.1, y: 6.3, cluster: "animals" },
  { label: "fish", x: 2.3, y: 7.3, cluster: "animals" },
  // Verbs — tight organic cluster
  { label: "sat", x: 6.8, y: 2.4, cluster: "verbs" },
  { label: "ran", x: 7.3, y: 2.9, cluster: "verbs" },
  { label: "jumped", x: 7.6, y: 2.1, cluster: "verbs" },
  { label: "walked", x: 6.4, y: 3.2, cluster: "verbs" },
  // Objects — tight organic cluster
  { label: "table", x: 1.5, y: 3.8, cluster: "objects" },
  { label: "chair", x: 2.1, y: 3.3, cluster: "objects" },
  { label: "mat", x: 1.8, y: 4.4, cluster: "objects" },
  // Determiners — moved to top-right
  { label: "the", x: 8.0, y: 8.8, cluster: "determiners" },
  { label: "a", x: 8.7, y: 8.3, cluster: "determiners" },
  { label: "an", x: 7.5, y: 8.2, cluster: "determiners" },
  // Prepositions — tight organic cluster
  { label: "on", x: 8.2, y: 5.6, cluster: "prepositions" },
  { label: "in", x: 8.6, y: 6.2, cluster: "prepositions" },
];

// ---------------------------------------------------------------------------
// Coordinate mapping (square — both axes use the same scale)
// ---------------------------------------------------------------------------

function toSvg(dataValue: number): number {
  return PADDING + ((dataValue - DATA_MIN) / (DATA_MAX - DATA_MIN)) * (SVG_SIZE - 2 * PADDING);
}

function toSvgX(dataX: number): number {
  return toSvg(dataX);
}

function toSvgY(dataY: number): number {
  // Invert Y so higher values appear at the top
  return SVG_SIZE - toSvg(dataY);
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function euclideanDistance(a: Word, b: Word): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function findNearestNeighbors(target: Word, allWords: Word[]): Word[] {
  const others = allWords.filter((w) => w !== target);
  const sameCluster = others
    .filter((w) => w.cluster === target.cluster)
    .sort((a, b) => euclideanDistance(target, a) - euclideanDistance(target, b));
  const diffCluster = others
    .filter((w) => w.cluster !== target.cluster)
    .sort((a, b) => euclideanDistance(target, a) - euclideanDistance(target, b));
  // 2 from same cluster + 1 nearest from a different cluster
  const result = sameCluster.slice(0, 2);
  if (diffCluster.length > 0) result.push(diffCluster[0]);
  return result.slice(0, NEIGHBOR_COUNT);
}

/** Compute an ellipse that bounds all words in a cluster with some padding. */
function computeClusterBounds(cluster: Cluster): {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
} {
  const members = WORDS.filter((w) => w.cluster === cluster);
  const svgXs = members.map((w) => toSvgX(w.x));
  const svgYs = members.map((w) => toSvgY(w.y));

  const cx = (Math.min(...svgXs) + Math.max(...svgXs)) / 2;
  const cy = (Math.min(...svgYs) + Math.max(...svgYs)) / 2;
  const rx = (Math.max(...svgXs) - Math.min(...svgXs)) / 2 + 28;
  const ry = (Math.max(...svgYs) - Math.min(...svgYs)) / 2 + 24;

  return { cx, cy, rx, ry };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AxisLabels() {
  return (
    <>
      <text
        x={SVG_SIZE / 2}
        y={SVG_SIZE - 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize={10}
        fontFamily={FONT_MONO}
      >
        dimension 1
      </text>
      <text
        x={14}
        y={SVG_SIZE / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize={10}
        fontFamily={FONT_MONO}
        transform={`rotate(-90, 14, ${SVG_SIZE / 2})`}
      >
        dimension 2
      </text>
    </>
  );
}

function GridLines() {
  const lines: React.ReactNode[] = [];
  const AXIS_OVERSHOOT = 14;

  for (let v = 0; v <= 10; v += 1) {
    const isAxis = v === 0;

    // Internal grid lines (skip v=0 for the internal grid, axis drawn separately)
    if (!isAxis) {
      lines.push(
        <line
          key={`vx-${v}`}
          x1={toSvgX(v)}
          y1={toSvgY(10)}
          x2={toSvgX(v)}
          y2={toSvgY(0)}
          stroke={GRID_LINE_COLOR}
          strokeWidth={0.5}
        />,
        <line
          key={`hy-${v}`}
          x1={toSvgX(0)}
          y1={toSvgY(v)}
          x2={toSvgX(10)}
          y2={toSvgY(v)}
          stroke={GRID_LINE_COLOR}
          strokeWidth={0.5}
        />,
      );
    }
  }

  // X axis with arrowhead
  lines.push(
    <line
      key="x-axis"
      x1={toSvgX(0) - AXIS_OVERSHOOT}
      y1={toSvgY(0)}
      x2={toSvgX(10) + AXIS_OVERSHOOT}
      y2={toSvgY(0)}
      stroke={AXIS_LINE_COLOR}
      strokeWidth={1}
      markerEnd="url(#axis-arrow)"
    />,
  );

  // Y axis with arrowhead
  lines.push(
    <line
      key="y-axis"
      x1={toSvgX(0)}
      y1={toSvgY(0) + AXIS_OVERSHOOT}
      x2={toSvgX(0)}
      y2={toSvgY(10) - AXIS_OVERSHOOT}
      stroke={AXIS_LINE_COLOR}
      strokeWidth={1}
      markerEnd="url(#axis-arrow)"
    />,
  );

  return <>{lines}</>;
}

function ClusterRegion({
  cluster,
  isVisible,
}: {
  cluster: Cluster;
  isVisible: boolean;
}) {
  const { cx, cy, rx, ry } = useMemo(() => computeClusterBounds(cluster), [cluster]);

  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={isVisible ? CLUSTER_COLORS[cluster] : "transparent"}
      stroke={isVisible ? "rgba(255,255,255,0.08)" : "transparent"}
      strokeWidth={0.8}
      strokeDasharray="4 3"
      pointerEvents="none"
      style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
    />
  );
}

function NeighborLine({ from, to }: { from: Word; to: Word }) {
  return (
    <line
      x1={toSvgX(from.x)}
      y1={toSvgY(from.y)}
      x2={toSvgX(to.x)}
      y2={toSvgY(to.y)}
      stroke={ACCENT}
      strokeWidth={0.8}
      strokeDasharray="3 3"
      opacity={0.5}
    />
  );
}

function CoordinateTooltip({ word }: { word: Word }) {
  const svgX = toSvgX(word.x);
  const svgY = toSvgY(word.y);

  // Position tooltip above and slightly right of the dot
  const tooltipX = svgX + 8;
  const tooltipY = svgY - 20;

  const tooltipWidth = 80;
  const tooltipHeight = 22;

  return (
    <g pointerEvents="none">
      <rect
        x={tooltipX - tooltipWidth / 2}
        y={tooltipY - tooltipHeight / 2}
        width={tooltipWidth}
        height={tooltipHeight}
        rx={4}
        fill="rgba(0,0,0,0.85)"
      />
      <text
        x={tooltipX}
        y={tooltipY + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.8)"
        fontSize={10}
        fontFamily={FONT_MONO}
      >
        ({word.x}, {word.y})
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EmbeddingSpace() {
  const [hoveredWord, setHoveredWord] = useState<Word | null>(null);

  const neighbors = useMemo(
    () => (hoveredWord ? findNearestNeighbors(hoveredWord, WORDS) : []),
    [hoveredWord],
  );

  const highlightedLabels = useMemo(() => {
    if (!hoveredWord) return new Set<string>();
    const labels = new Set(neighbors.map((n) => n.label));
    labels.add(hoveredWord.label);
    return labels;
  }, [hoveredWord, neighbors]);

  const activeCluster = hoveredWord?.cluster ?? null;

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full max-w-[540px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="axis-arrow"
              viewBox="0 0 8 8"
              refX={7}
              refY={4}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill={AXIS_LINE_COLOR} />
            </marker>
          </defs>

          <GridLines />

          {/* Cluster shading regions (behind everything) */}
          {(Object.keys(CLUSTER_COLORS) as Cluster[]).map((cluster) => (
            <ClusterRegion
              key={cluster}
              cluster={cluster}
              isVisible={activeCluster === cluster}
            />
          ))}

          {/* Neighbor connecting lines */}
          {hoveredWord &&
            neighbors.map((neighbor) => (
              <NeighborLine
                key={`line-${hoveredWord.label}-${neighbor.label}`}
                from={hoveredWord}
                to={neighbor}
              />
            ))}

          {/* Word dots and labels */}
          {WORDS.map((word) => {
            const sx = toSvgX(word.x);
            const sy = toSvgY(word.y);
            const isHovered = hoveredWord === word;
            const isNeighbor = highlightedLabels.has(word.label);
            const isDimmed = hoveredWord !== null && !isNeighbor;

            return (
              <g key={word.label} style={{ cursor: "pointer" }}>
                {/* Invisible larger hit area — must sit above everything and capture pointer */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={HIT_AREA_RADIUS}
                  fill="transparent"
                  pointerEvents="all"
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                />

                <circle
                  cx={sx}
                  cy={sy}
                  r={isHovered ? 6 : DOT_RADIUS}
                  fill={isHovered ? ACCENT : isNeighbor ? ACCENT : "white"}
                  opacity={isDimmed ? 0.15 : isHovered ? 1 : isNeighbor ? 0.7 : 0.4}
                  pointerEvents="none"
                  style={{ transition: "r 0.2s ease, opacity 0.2s ease, fill 0.2s ease" }}
                />

                <text
                  x={sx + 10}
                  y={sy + 1}
                  dominantBaseline="central"
                  fill={isHovered ? "white" : isNeighbor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}
                  fontSize={11}
                  fontFamily={FONT_MONO}
                  opacity={isDimmed ? 0.2 : 1}
                  pointerEvents="none"
                  style={{ transition: "fill 0.2s ease, opacity 0.2s ease" }}
                >
                  {word.label}
                </text>
              </g>
            );
          })}

          {/* Tooltip showing coordinates */}
          {hoveredWord && <CoordinateTooltip word={hoveredWord} />}

          <AxisLabels />
        </svg>
      </div>
    </div>
  );
}
