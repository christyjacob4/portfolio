"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";

const NUM_NEURONS_PER_ROW = 8;
const NUM_ROWS = 6;
const TOTAL_NEURONS = NUM_NEURONS_PER_ROW * NUM_ROWS;

const EXPERT_COLORS_SPARSE = [
  "rgba(99, 102, 241, 0.85)",
  "rgba(236, 72, 153, 0.85)",
  "rgba(74, 222, 128, 0.85)",
  "rgba(251, 191, 36, 0.85)",
];

// Expert assignment: which neurons belong to which expert (4 experts, each owns a row-group)
function getExpertForNeuron(idx: number): number {
  const row = Math.floor(idx / NUM_NEURONS_PER_ROW);
  if (row < 2) return 0;
  if (row < 3) return 1;
  if (row < 5) return 2;
  return 3;
}

// Active experts for sparse mode (Top-2)
const ACTIVE_EXPERTS = [0, 2];

type Mode = "dense" | "sparse";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DenseVsSparse() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [mode, setMode] = useState<Mode>("dense");
  const [dimensions, setDimensions] = useState({ width: 700, height: 400 });
  const transitionRef = useRef(0); // 0 = dense, 1 = sparse
  const targetRef = useRef(0);

  useEffect(() => {
    targetRef.current = mode === "dense" ? 0 : 1;
  }, [mode]);

  // Responsive
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDimensions({ width: w, height: Math.max(350, Math.min(440, w * 0.6)) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = (timestamp: number) => {
      const { width, height } = dimensions;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      // Smooth transition
      const lerpRate = 0.05;
      transitionRef.current +=
        (targetRef.current - transitionRef.current) * lerpRate;
      const t = transitionRef.current; // 0 = dense, 1 = sparse

      // Layout: two side-by-side panels
      const panelGap = 20;
      const panelW = (width - panelGap - 40) / 2;
      const panelH = height - 100;
      const leftX = 20;
      const rightX = leftX + panelW + panelGap;
      const panelY = 50;

      // Panel headers
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "center";

      // Dense panel
      const denseAlpha = 1 - t * 0.3;
      ctx.fillStyle = `rgba(100, 150, 255, ${0.7 * denseAlpha})`;
      ctx.fillText("Dense Model", leftX + panelW / 2, panelY - 12);
      ctx.fillStyle = `rgba(255,255,255,${0.35 * denseAlpha})`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText("All neurons active", leftX + panelW / 2, panelY - 1);

      // Sparse panel
      const sparseAlpha = 0.5 + t * 0.5;
      ctx.fillStyle = `rgba(${ACCENT_RGB}, ${0.7 * sparseAlpha})`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.fillText("Sparse MoE", rightX + panelW / 2, panelY - 12);
      ctx.fillStyle = `rgba(255,255,255,${0.35 * sparseAlpha})`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText("Only selected experts active", rightX + panelW / 2, panelY - 1);

      // Panel outlines
      ctx.strokeStyle = `rgba(100, 150, 255, ${0.15 * denseAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(leftX, panelY, panelW, panelH, 8);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${0.15 * sparseAlpha})`;
      ctx.beginPath();
      ctx.roundRect(rightX, panelY, panelW, panelH, 8);
      ctx.stroke();

      // Draw neurons
      const neuronRadius = Math.min(12, (panelW - 40) / (NUM_NEURONS_PER_ROW * 3));
      const neuronSpacingX = (panelW - 30) / NUM_NEURONS_PER_ROW;
      const neuronSpacingY = (panelH - 30) / NUM_ROWS;

      const pulse = Math.sin(timestamp / 600) * 0.2 + 0.8;

      for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_NEURONS_PER_ROW; col++) {
          const idx = row * NUM_NEURONS_PER_ROW + col;
          const nx = 15 + col * neuronSpacingX + neuronSpacingX / 2;
          const ny = panelY + 15 + row * neuronSpacingY + neuronSpacingY / 2;

          // Dense side: all neurons lit
          const denseNx = leftX + nx;
          const denseNy = ny;

          ctx.beginPath();
          ctx.arc(denseNx, denseNy, neuronRadius, 0, Math.PI * 2);
          const denseActive = 0.4 + 0.3 * pulse;
          ctx.fillStyle = `rgba(100, 150, 255, ${denseActive * denseAlpha})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(100, 150, 255, ${0.5 * denseAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Sparse side: only active experts lit
          const sparseNx = rightX + nx;
          const sparseNy = ny;
          const expertIdx = getExpertForNeuron(idx);
          const isActive = ACTIVE_EXPERTS.includes(expertIdx);

          ctx.beginPath();
          ctx.arc(sparseNx, sparseNy, neuronRadius, 0, Math.PI * 2);

          if (isActive) {
            const activeAlpha = (0.5 + 0.3 * pulse) * sparseAlpha;
            ctx.fillStyle = EXPERT_COLORS_SPARSE[expertIdx].replace(
              "0.85",
              `${activeAlpha}`,
            );
            ctx.fill();
            ctx.strokeStyle = EXPERT_COLORS_SPARSE[expertIdx].replace(
              "0.85",
              `${0.6 * sparseAlpha}`,
            );

            // Glow for active
            if (t > 0.5) {
              ctx.shadowColor = EXPERT_COLORS_SPARSE[expertIdx];
              ctx.shadowBlur = 8;
            }
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * sparseAlpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * sparseAlpha})`;
          }
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Expert labels on sparse side
      const expertRegions = [
        { expert: 0, startRow: 0, endRow: 1 },
        { expert: 1, startRow: 2, endRow: 2 },
        { expert: 2, startRow: 3, endRow: 4 },
        { expert: 3, startRow: 5, endRow: 5 },
      ];

      for (const region of expertRegions) {
        const ry1 = panelY + 15 + region.startRow * neuronSpacingY;
        const ry2 =
          panelY + 15 + (region.endRow + 1) * neuronSpacingY;
        const isActive = ACTIVE_EXPERTS.includes(region.expert);

        // Bracket on the right
        const bracketX = rightX + panelW - 6;
        ctx.strokeStyle = isActive
          ? EXPERT_COLORS_SPARSE[region.expert].replace("0.85", `${0.4 * sparseAlpha}`)
          : `rgba(255,255,255,${0.06 * sparseAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bracketX - 4, ry1 + 2);
        ctx.lineTo(bracketX, ry1 + 2);
        ctx.lineTo(bracketX, ry2 - 2);
        ctx.lineTo(bracketX - 4, ry2 - 2);
        ctx.stroke();

        // Label removed for cleanliness; the color coding is sufficient
      }

      // Stats comparison at bottom
      const statsY = panelY + panelH + 14;

      // Dense stats
      ctx.fillStyle = `rgba(100, 150, 255, ${0.6 * denseAlpha})`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Parameters: 48 neurons", leftX + panelW / 2, statsY);
      ctx.fillStyle = `rgba(100, 150, 255, ${0.4 * denseAlpha})`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText("Active: 48 / 48 (100%)", leftX + panelW / 2, statsY + 14);
      ctx.fillText("FLOPs: 100%", leftX + panelW / 2, statsY + 27);

      // Sparse stats
      const activeCount =
        ACTIVE_EXPERTS.reduce((acc, e) => {
          const count = expertRegions.find((r) => r.expert === e);
          if (!count) return acc;
          return acc + (count.endRow - count.startRow + 1) * NUM_NEURONS_PER_ROW;
        }, 0);
      const pct = Math.round((activeCount / TOTAL_NEURONS) * 100);

      ctx.fillStyle = `rgba(${ACCENT_RGB}, ${0.6 * sparseAlpha})`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.fillText("Parameters: 48 neurons", rightX + panelW / 2, statsY);
      ctx.fillStyle = `rgba(${ACCENT_RGB}, ${0.4 * sparseAlpha})`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText(
        `Active: ${activeCount} / ${TOTAL_NEURONS} (${pct}%)`,
        rightX + panelW / 2,
        statsY + 14,
      );
      ctx.fillText(`FLOPs: ~${pct}%`, rightX + panelW / 2, statsY + 27);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [dimensions]);

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: 750 }}>
      <div
        style={{
          background: BG,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px 8px",
            borderBottom: `1px solid rgba(${ACCENT_RGB}, 0.08)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              fontWeight: 600,
              color: `rgba(${ACCENT_RGB}, 0.8)`,
            }}
          >
            Dense vs Sparse Computation
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {(["dense", "sparse"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  padding: "4px 12px",
                  borderRadius: 4,
                  border: `1px solid ${
                    mode === m
                      ? `rgba(${ACCENT_RGB}, 0.6)`
                      : "rgba(255,255,255,0.1)"
                  }`,
                  background:
                    mode === m
                      ? `rgba(${ACCENT_RGB}, 0.1)`
                      : "rgba(255,255,255,0.03)",
                  color:
                    mode === m
                      ? `rgba(${ACCENT_RGB}, 0.9)`
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textTransform: "capitalize",
                }}
              >
                {m === "dense" ? "Focus Dense" : "Focus Sparse"}
              </button>
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: dimensions.height }}
        />

        <div
          style={{
            padding: "8px 16px 12px",
            borderTop: `1px solid rgba(${ACCENT_RGB}, 0.08)`,
          }}
        >
          <p
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {mode === "dense"
              ? "Dense: Every neuron activates for every input token. Total parameters = active parameters."
              : "Sparse MoE: Only top-K expert sub-networks activate per token. Same total parameters, far less compute."}
          </p>
        </div>
      </div>
    </div>
  );
}
