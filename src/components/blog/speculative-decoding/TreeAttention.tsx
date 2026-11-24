"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_BG = "rgba(74,222,128,0.15)";
const ACCENT_BORDER = "rgba(74,222,128,0.3)";
const RED = "#ef4444";
const RED_BG = "rgba(239,68,68,0.12)";
const BLUE = "#60a5fa";
const BLUE_BG = "rgba(96,165,250,0.12)";
const YELLOW = "#facc15";
const DIM_TEXT = "rgba(255,255,255,0.5)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

// ---------------------------------------------------------------------------
// Tree data
// ---------------------------------------------------------------------------

interface TreeNode {
  id: number;
  token: string;
  prob: number;
  children: TreeNode[];
  accepted: boolean;
  onAcceptedPath: boolean;
  depth: number;
}

// A tree of speculative candidates (Medusa-style)
// Root -> 3 candidates -> each has 2 candidates -> each has 1 candidate
function buildTree(): TreeNode {
  return {
    id: 0,
    token: "The",
    prob: 1.0,
    accepted: true,
    onAcceptedPath: true,
    depth: 0,
    children: [
      {
        id: 1,
        token: "quick",
        prob: 0.45,
        accepted: true,
        onAcceptedPath: true,
        depth: 1,
        children: [
          {
            id: 4,
            token: "brown",
            prob: 0.6,
            accepted: true,
            onAcceptedPath: true,
            depth: 2,
            children: [
              {
                id: 10,
                token: "fox",
                prob: 0.72,
                accepted: true,
                onAcceptedPath: true,
                depth: 3,
                children: [],
              },
              {
                id: 11,
                token: "dog",
                prob: 0.18,
                accepted: false,
                onAcceptedPath: false,
                depth: 3,
                children: [],
              },
            ],
          },
          {
            id: 5,
            token: "red",
            prob: 0.25,
            accepted: false,
            onAcceptedPath: false,
            depth: 2,
            children: [
              {
                id: 12,
                token: "fox",
                prob: 0.55,
                accepted: false,
                onAcceptedPath: false,
                depth: 3,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 2,
        token: "lazy",
        prob: 0.3,
        accepted: false,
        onAcceptedPath: false,
        depth: 1,
        children: [
          {
            id: 6,
            token: "cat",
            prob: 0.4,
            accepted: false,
            onAcceptedPath: false,
            depth: 2,
            children: [
              {
                id: 13,
                token: "sat",
                prob: 0.5,
                accepted: false,
                onAcceptedPath: false,
                depth: 3,
                children: [],
              },
            ],
          },
          {
            id: 7,
            token: "dog",
            prob: 0.35,
            accepted: false,
            onAcceptedPath: false,
            depth: 2,
            children: [],
          },
        ],
      },
      {
        id: 3,
        token: "big",
        prob: 0.15,
        accepted: false,
        onAcceptedPath: false,
        depth: 1,
        children: [
          {
            id: 8,
            token: "brown",
            prob: 0.3,
            accepted: false,
            onAcceptedPath: false,
            depth: 2,
            children: [
              {
                id: 14,
                token: "bear",
                prob: 0.4,
                accepted: false,
                onAcceptedPath: false,
                depth: 3,
                children: [],
              },
            ],
          },
          {
            id: 9,
            token: "red",
            prob: 0.2,
            accepted: false,
            onAcceptedPath: false,
            depth: 2,
            children: [],
          },
        ],
      },
    ],
  };
}

// Flatten tree to list of nodes with positions
interface FlatNode {
  node: TreeNode;
  x: number;
  y: number;
  parentX: number | null;
  parentY: number | null;
}

function flattenTree(root: TreeNode, width: number, height: number): FlatNode[] {
  const result: FlatNode[] = [];
  const depthCounts: number[] = [0, 0, 0, 0];
  const depthTotals: number[] = [1, 3, 6, 5]; // nodes at each depth

  function count(node: TreeNode, depth: number) {
    if (depth < depthTotals.length) {
      depthTotals[depth] = depthTotals[depth] || 0;
    }
    for (const child of node.children) {
      count(child, depth + 1);
    }
  }
  count(root, 0);

  // Recount properly
  const perDepth: TreeNode[][] = [[], [], [], []];
  function collect(node: TreeNode) {
    if (node.depth < 4) perDepth[node.depth].push(node);
    for (const child of node.children) collect(child);
  }
  collect(root);

  const paddingX = 50;
  const paddingY = 40;
  const usableWidth = width - 2 * paddingX;
  const usableHeight = height - 2 * paddingY;

  const nodePositions = new Map<number, { x: number; y: number }>();

  for (let d = 0; d < 4; d++) {
    const nodes = perDepth[d];
    const y = paddingY + (d / 3) * usableHeight;
    const count = nodes.length;
    for (let i = 0; i < count; i++) {
      const x = paddingX + ((i + 0.5) / count) * usableWidth;
      nodePositions.set(nodes[i].id, { x, y });
    }
  }

  function traverse(node: TreeNode, parentId: number | null) {
    const pos = nodePositions.get(node.id);
    if (!pos) return;
    const parentPos = parentId !== null ? nodePositions.get(parentId) : null;
    result.push({
      node,
      x: pos.x,
      y: pos.y,
      parentX: parentPos?.x ?? null,
      parentY: parentPos?.y ?? null,
    });
    for (const child of node.children) {
      traverse(child, node.id);
    }
  }

  traverse(root, null);
  return result;
}

// DFS order for animation
function dfsOrder(root: TreeNode): number[] {
  const order: number[] = [];
  function visit(node: TreeNode) {
    order.push(node.id);
    for (const child of node.children) visit(child);
  }
  visit(root);
  return order;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TreeAttention() {
  const tree = buildTree();
  const svgWidth = 600;
  const svgHeight = 300;
  const flatNodes = flattenTree(tree, svgWidth, svgHeight);
  const order = dfsOrder(tree);

  const [exploredCount, setExploredCount] = useState(0);
  const [showAccepted, setShowAccepted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const animate = useCallback(() => {
    cleanup();
    setExploredCount(0);
    setShowAccepted(false);
    setSelectedNode(null);
    setIsAnimating(true);

    let step = 0;
    const tick = () => {
      if (step <= order.length) {
        setExploredCount(step);
        step++;
        timerRef.current = setTimeout(tick, 300);
      } else {
        // Show accepted path
        setShowAccepted(true);
        setIsAnimating(false);
      }
    };
    timerRef.current = setTimeout(tick, 200);
  }, [order.length, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setExploredCount(0);
    setShowAccepted(false);
    setSelectedNode(null);
    setIsAnimating(false);
  }, [cleanup]);

  const exploredIds = new Set(order.slice(0, exploredCount));
  const nodeById = new Map<number, TreeNode>();
  function buildMap(node: TreeNode) {
    nodeById.set(node.id, node);
    for (const child of node.children) buildMap(child);
  }
  buildMap(tree);

  const selectedInfo = selectedNode !== null ? nodeById.get(selectedNode) : null;

  return (
    <div
      style={{
        background: "#0a0a0a",
        padding: "24px",
        fontFamily: FONT_MONO,
        color: "white",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: ACCENT }}>
          Tree-Structured Speculation (Medusa)
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={animate}
            disabled={isAnimating}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              background: isAnimating ? "rgba(255,255,255,0.05)" : ACCENT_BG,
              border: `1px solid ${isAnimating ? "rgba(255,255,255,0.1)" : ACCENT_BORDER}`,
              borderRadius: 6,
              color: isAnimating ? DIM_TEXT : ACCENT,
              cursor: isAnimating ? "default" : "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            {exploredCount === 0 && !showAccepted ? "Explore Tree" : "Replay"}
          </button>
          <button
            onClick={reset}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: DIM_TEXT,
              cursor: "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* SVG Tree */}
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            width: "100%",
            maxWidth: svgWidth,
            height: "auto",
            display: "block",
            margin: "0 auto",
          }}
        >
          {/* Depth labels */}
          {["Root", "Head 1", "Head 2", "Head 3"].map((label, d) => (
            <text
              key={d}
              x={12}
              y={40 + (d / 3) * (svgHeight - 80) + 4}
              fill="rgba(255,255,255,0.2)"
              fontSize={13}
              fontFamily={FONT_MONO}
            >
              {label}
            </text>
          ))}

          {/* Edges */}
          {flatNodes.map((fn) => {
            if (fn.parentX === null || fn.parentY === null) return null;
            const explored = exploredIds.has(fn.node.id);
            const onPath = showAccepted && fn.node.onAcceptedPath;
            const parentExplored =
              fn.node.id === 0 ||
              flatNodes.some(
                (p) =>
                  p.node.children.some((c) => c.id === fn.node.id) &&
                  exploredIds.has(p.node.id)
              );

            let stroke = "rgba(255,255,255,0.06)";
            let strokeWidth = 1;
            if (explored && parentExplored) {
              stroke = "rgba(255,255,255,0.15)";
              strokeWidth = 1.5;
            }
            if (onPath) {
              stroke = ACCENT;
              strokeWidth = 2.5;
            }

            return (
              <line
                key={`edge-${fn.node.id}`}
                x1={fn.parentX}
                y1={fn.parentY}
                x2={fn.x}
                y2={fn.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
              />
            );
          })}

          {/* Nodes */}
          {flatNodes.map((fn) => {
            const explored = exploredIds.has(fn.node.id);
            const onPath = showAccepted && fn.node.onAcceptedPath;
            const rejected = showAccepted && !fn.node.accepted && explored;
            const isSelected = selectedNode === fn.node.id;

            let fill = "rgba(255,255,255,0.04)";
            let stroke = "rgba(255,255,255,0.1)";
            let textColor = "rgba(255,255,255,0.25)";

            if (explored) {
              fill = "rgba(255,255,255,0.08)";
              stroke = "rgba(255,255,255,0.2)";
              textColor = "rgba(255,255,255,0.7)";
            }
            if (onPath) {
              fill = "rgba(74,222,128,0.15)";
              stroke = "rgba(74,222,128,0.5)";
              textColor = ACCENT;
            }
            if (rejected) {
              fill = "rgba(239,68,68,0.1)";
              stroke = "rgba(239,68,68,0.3)";
              textColor = "rgba(239,68,68,0.6)";
            }
            if (isSelected) {
              stroke = "white";
            }

            const nodeRadius = 22;

            return (
              <g
                key={`node-${fn.node.id}`}
                onClick={() => setSelectedNode(fn.node.id === selectedNode ? null : fn.node.id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={fn.x}
                  cy={fn.y}
                  r={nodeRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 2 : 1.5}
                  style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
                />
                <text
                  x={fn.x}
                  y={fn.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textColor}
                  fontSize={13}
                  fontFamily={FONT_MONO}
                  style={{ transition: "fill 0.3s ease", pointerEvents: "none" }}
                >
                  {fn.node.token}
                </text>
                {/* Probability badge */}
                {explored && fn.node.depth > 0 && (
                  <text
                    x={fn.x}
                    y={fn.y + nodeRadius + 12}
                    textAnchor="middle"
                    fill={onPath ? ACCENT : rejected ? RED : DIM_TEXT}
                    fontSize={13}
                    fontFamily={FONT_MONO}
                    style={{ transition: "fill 0.3s ease" }}
                  >
                    {(fn.node.prob * 100).toFixed(0)}%
                  </text>
                )}
                {/* Accepted / rejected badges */}
                {showAccepted && explored && fn.node.depth > 0 && (
                  <text
                    x={fn.x + nodeRadius + 4}
                    y={fn.y - nodeRadius + 4}
                    fill={fn.node.accepted ? ACCENT : RED}
                    fontSize={14}
                    fontFamily={FONT_MONO}
                  >
                    {fn.node.accepted ? "\u2713" : "\u2717"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info panel */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.6,
        }}
      >
        {selectedInfo ? (
          <>
            <span style={{ color: "white" }}>&quot;{selectedInfo.token}&quot;</span> at depth{" "}
            {selectedInfo.depth} {"\u2014"} probability: {(selectedInfo.prob * 100).toFixed(1)}%
            {selectedInfo.accepted ? (
              <span style={{ color: ACCENT }}> {"\u2192"} ACCEPTED (on the verified path)</span>
            ) : (
              <span style={{ color: RED }}> {"\u2192"} REJECTED (not on the verified path)</span>
            )}
          </>
        ) : showAccepted ? (
          <>
            Tree verification complete. The{" "}
            <span style={{ color: ACCENT }}>accepted path</span> is highlighted: The {"\u2192"}{" "}
            quick {"\u2192"} brown {"\u2192"} fox. All{" "}
            {flatNodes.filter((n) => n.node.onAcceptedPath).length} tokens on this path are verified
            in a <span style={{ color: "white" }}>single forward pass</span> using tree attention
            masks. Click any node to see its details.
          </>
        ) : exploredCount > 0 ? (
          <>
            Exploring candidates via depth-first traversal... ({exploredCount}/{order.length} nodes
            visited)
          </>
        ) : (
          <>
            Medusa attaches multiple prediction heads to the target model, generating a{" "}
            <span style={{ color: "white" }}>tree</span> of candidate continuations. Tree attention
            verifies all paths simultaneously. Click &quot;Explore Tree&quot; to see the process, then click
            nodes for details.
          </>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 12,
          fontSize: 13,
          color: DIM_TEXT,
        }}
      >
        <span>
          <span style={{ color: ACCENT }}>{"\u25CF"}</span> Accepted path
        </span>
        <span>
          <span style={{ color: RED }}>{"\u25CF"}</span> Rejected
        </span>
        <span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{"\u25CF"}</span> Explored
        </span>
        <span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{"\u25CF"}</span> Unexplored
        </span>
      </div>
    </div>
  );
}
