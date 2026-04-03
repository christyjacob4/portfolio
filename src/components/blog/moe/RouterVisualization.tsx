"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";

const TOKENS = ["The", "cat", "sat", "on", "a", "mat"];
const NUM_EXPERTS = 4;
const TOP_K = 2;

// Pre-computed routing probabilities for each token -> expert
const ROUTING_PROBS: number[][] = [
  [0.42, 0.31, 0.18, 0.09], // The
  [0.08, 0.55, 0.27, 0.10], // cat
  [0.15, 0.12, 0.48, 0.25], // sat
  [0.38, 0.10, 0.14, 0.38], // on
  [0.50, 0.22, 0.18, 0.10], // a
  [0.05, 0.10, 0.30, 0.55], // mat
];

const EXPERT_COLORS = [
  `rgba(99, 102, 241, 0.9)`,  // indigo
  `rgba(236, 72, 153, 0.9)`,  // pink
  `rgba(${ACCENT_RGB}, 0.9)`, // green
  `rgba(251, 191, 36, 0.9)`,  // amber
];

const EXPERT_LABELS = ["Expert 0", "Expert 1", "Expert 2", "Expert 3"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function topKIndices(probs: number[], k: number): number[] {
  return probs
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p)
    .slice(0, k)
    .map((x) => x.i);
}

// ---------------------------------------------------------------------------
// Particle type
// ---------------------------------------------------------------------------

interface Particle {
  tokenIndex: number;
  expertIndex: number;
  progress: number; // 0 to 1
  weight: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RouterVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 420 });

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = Math.max(360, Math.min(460, w * 0.6));
        setDimensions({ width: w, height: h });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Spawn particles continuously
  const spawnParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let t = 0; t < TOKENS.length; t++) {
      const topK = topKIndices(ROUTING_PROBS[t], TOP_K);
      for (const expertIdx of topK) {
        newParticles.push({
          tokenIndex: t,
          expertIndex: expertIdx,
          progress: 0,
          weight: ROUTING_PROBS[t][expertIdx],
          active: true,
        });
      }
    }
    return newParticles;
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    particlesRef.current = spawnParticles();
    let cycleTimer = 0;
    const CYCLE_DURATION = 3000; // ms per full cycle

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      cycleTimer += dt;

      const { width, height } = dimensions;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      // Layout positions
      const tokenAreaX = 40;
      const routerX = width * 0.38;
      const expertAreaX = width * 0.72;
      const tokenSpacing = Math.min(52, (height - 60) / TOKENS.length);
      const tokenStartY = (height - tokenSpacing * (TOKENS.length - 1)) / 2;
      const expertSpacing = Math.min(70, (height - 60) / NUM_EXPERTS);
      const expertStartY = (height - expertSpacing * (NUM_EXPERTS - 1)) / 2;

      // Router box
      const routerW = 80;
      const routerH = Math.min(180, height * 0.45);
      const routerY = (height - routerH) / 2;

      // Draw router box
      ctx.strokeStyle = `rgba(${ACCENT_RGB}, 0.4)`;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.04)`;
      ctx.beginPath();
      ctx.roundRect(routerX - routerW / 2, routerY, routerW, routerH, 8);
      ctx.fill();
      ctx.stroke();

      // Router label
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.8)`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Router", routerX, routerY - 8);
      ctx.fillStyle = `rgba(255,255,255,0.35)`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText("G(x) = Softmax(Wg·x)", routerX, routerY + routerH + 16);

      // Draw tokens
      for (let t = 0; t < TOKENS.length; t++) {
        const ty = tokenStartY + t * tokenSpacing;
        const isHovered = hoveredToken === t;
        const radius = isHovered ? 22 : 18;

        // Token circle
        ctx.beginPath();
        ctx.arc(tokenAreaX, ty, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? `rgba(${ACCENT_RGB}, 0.15)`
          : `rgba(255, 255, 255, 0.05)`;
        ctx.fill();
        ctx.strokeStyle = isHovered
          ? `rgba(${ACCENT_RGB}, 0.7)`
          : `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Token text
        ctx.fillStyle = isHovered
          ? `rgba(${ACCENT_RGB}, 1)`
          : "rgba(255, 255, 255, 0.7)";
        ctx.font = `${isHovered ? "bold " : ""}14px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`"${TOKENS[t]}"`, tokenAreaX, ty);

        // Draw connecting line to router
        ctx.beginPath();
        ctx.moveTo(tokenAreaX + radius + 4, ty);
        ctx.lineTo(routerX - routerW / 2, routerY + ((t + 0.5) / TOKENS.length) * routerH);
        ctx.strokeStyle = isHovered
          ? `rgba(${ACCENT_RGB}, 0.25)`
          : "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw experts
      for (let e = 0; e < NUM_EXPERTS; e++) {
        const ey = expertStartY + e * expertSpacing;
        const ew = 90;
        const eh = Math.min(50, expertSpacing - 10);

        // Expert box
        ctx.beginPath();
        ctx.roundRect(expertAreaX - ew / 2, ey - eh / 2, ew, eh, 6);
        ctx.fillStyle = EXPERT_COLORS[e].replace("0.9", "0.08");
        ctx.fill();
        ctx.strokeStyle = EXPERT_COLORS[e].replace("0.9", "0.5");
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Expert label
        ctx.fillStyle = EXPERT_COLORS[e];
        ctx.font = `bold 13px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(EXPERT_LABELS[e], expertAreaX, ey - 4);

        // FFN sublabel
        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillText("FFN", expertAreaX, ey + 10);

        // Connect router to expert
        ctx.beginPath();
        ctx.moveTo(routerX + routerW / 2, routerY + ((e + 0.5) / NUM_EXPERTS) * routerH);
        ctx.lineTo(expertAreaX - ew / 2, ey);
        ctx.strokeStyle = EXPERT_COLORS[e].replace("0.9", "0.12");
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Animate particles
      const cycleProgress = (cycleTimer % CYCLE_DURATION) / CYCLE_DURATION;

      for (const particle of particlesRef.current) {
        particle.progress = cycleProgress;

        if (particle.progress >= 1) continue;

        const t = particle.tokenIndex;
        const e = particle.expertIndex;
        const ty = tokenStartY + t * tokenSpacing;
        const ey = expertStartY + e * expertSpacing;
        const p = particle.progress;

        // Two-phase: token -> router (0-0.5), router -> expert (0.5-1)
        let px: number, py: number;
        const routerEntryY = routerY + ((t + 0.5) / TOKENS.length) * routerH;
        const routerExitY = routerY + ((e + 0.5) / NUM_EXPERTS) * routerH;

        if (p < 0.45) {
          // Phase 1: token to router
          const t1 = p / 0.45;
          const eased = t1 * t1 * (3 - 2 * t1); // smoothstep
          px = tokenAreaX + 22 + eased * (routerX - routerW / 2 - tokenAreaX - 26);
          py = ty + eased * (routerEntryY - ty);
        } else if (p < 0.55) {
          // Inside router
          const t2 = (p - 0.45) / 0.1;
          px = routerX - routerW / 2 + t2 * routerW;
          py = routerEntryY + t2 * (routerExitY - routerEntryY);
        } else {
          // Phase 2: router to expert
          const t3 = (p - 0.55) / 0.45;
          const eased = t3 * t3 * (3 - 2 * t3);
          px = routerX + routerW / 2 + eased * (expertAreaX - 45 - routerX - routerW / 2);
          py = routerExitY + eased * (ey - routerExitY);
        }

        // Draw particle
        const particleRadius = 3 + particle.weight * 3;
        const alpha = 0.3 + particle.weight * 0.6;
        const isHighlighted = hoveredToken === t;

        // Glow
        if (isHighlighted) {
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, particleRadius * 4);
          gradient.addColorStop(0, EXPERT_COLORS[e].replace("0.9", `${alpha * 0.5}`));
          gradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(px, py, particleRadius * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, isHighlighted ? particleRadius * 1.5 : particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = EXPERT_COLORS[e].replace("0.9", `${isHighlighted ? 1 : alpha}`);
        ctx.fill();
      }

      // Respawn particles at cycle boundary
      if (cycleProgress < 0.02 && cycleTimer > CYCLE_DURATION) {
        // Particles loop automatically
      }

      // Draw hovered token probability breakdown
      if (hoveredToken !== null) {
        const probs = ROUTING_PROBS[hoveredToken];
        const topK = topKIndices(probs, TOP_K);
        const panelW = 170;
        const panelH = 20 + NUM_EXPERTS * 24;
        const panelX = width - panelW - 12;
        const panelY = 12;

        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 6);
        ctx.fill();
        ctx.strokeStyle = `rgba(${ACCENT_RGB}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.8)`;
        ctx.font = `bold 13px ${FONT_MONO}`;
        ctx.textAlign = "left";
        ctx.fillText(`"${TOKENS[hoveredToken]}" routing:`, panelX + 10, panelY + 14);

        for (let e = 0; e < NUM_EXPERTS; e++) {
          const y = panelY + 30 + e * 24;
          const isTopK = topK.includes(e);
          const barW = probs[e] * 100;

          // Bar background
          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
          ctx.fillRect(panelX + 10, y, 100, 12);

          // Bar fill
          ctx.fillStyle = isTopK
            ? EXPERT_COLORS[e].replace("0.9", "0.7")
            : "rgba(255, 255, 255, 0.1)";
          ctx.fillRect(panelX + 10, y, barW, 12);

          // Expert label
          ctx.fillStyle = isTopK ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)";
          ctx.font = `${isTopK ? "bold " : ""}13px ${FONT_MONO}`;
          ctx.textAlign = "left";
          ctx.fillText(`E${e}`, panelX + 116, y + 10);
          ctx.fillText(`${(probs[e] * 100).toFixed(0)}%`, panelX + 138, y + 10);

          // Top-K marker
          if (isTopK) {
            ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.7)`;
            ctx.font = `bold 7px ${FONT_MONO}`;
            ctx.fillText("TOP", panelX + 2, y + 9);
          }
        }
      }

      // Legend
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Hover over tokens to see routing probabilities", width / 2, height - 8);

      // Top-K label
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.5)`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText(`Top-K = ${TOP_K}`, 12, 18);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [dimensions, hoveredToken, spawnParticles]);

  // Mouse tracking for hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { height } = dimensions;
      const tokenAreaX = 40;
      const tokenSpacing = Math.min(52, (height - 60) / TOKENS.length);
      const tokenStartY = (height - tokenSpacing * (TOKENS.length - 1)) / 2;

      let found: number | null = null;
      for (let t = 0; t < TOKENS.length; t++) {
        const ty = tokenStartY + t * tokenSpacing;
        const dist = Math.sqrt((x - tokenAreaX) ** 2 + (y - ty) ** 2);
        if (dist < 28) {
          found = t;
          break;
        }
      }
      setHoveredToken(found);
    },
    [dimensions],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredToken(null);
  }, []);

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
            padding: "12px 16px 6px",
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
            Token Router Visualization
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Top-{TOP_K} Routing
          </span>
        </div>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: dimensions.height, cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
