"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const NUM_EXPERTS = 8;

const EXPERT_COLORS = [
  "rgba(99, 102, 241, 0.85)",
  "rgba(236, 72, 153, 0.85)",
  "rgba(74, 222, 128, 0.85)",
  "rgba(251, 191, 36, 0.85)",
  "rgba(168, 85, 247, 0.85)",
  "rgba(34, 211, 238, 0.85)",
  "rgba(244, 63, 94, 0.85)",
  "rgba(163, 230, 53, 0.85)",
];

type Scenario = "balanced" | "unbalanced" | "collapsed";

interface ScenarioConfig {
  label: string;
  description: string;
  distribution: number[];
  lossValue: number;
}

const SCENARIOS: Record<Scenario, ScenarioConfig> = {
  balanced: {
    label: "Balanced",
    description: "Load balancing loss keeps tokens evenly distributed.",
    distribution: [14, 12, 13, 11, 14, 12, 13, 11],
    lossValue: 0.125,
  },
  unbalanced: {
    label: "Unbalanced",
    description: "Some experts get overloaded; others are underutilized.",
    distribution: [32, 4, 24, 2, 18, 6, 12, 2],
    lossValue: 0.482,
  },
  collapsed: {
    label: "Collapsed",
    description: "Expert collapse: nearly all tokens route to one expert.",
    distribution: [78, 2, 4, 1, 6, 3, 4, 2],
    lossValue: 0.891,
  },
};

const TOTAL_TOKENS = 100;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExpertCapacity() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [scenario, setScenario] = useState<Scenario>("balanced");
  const [dimensions, setDimensions] = useState({ width: 700, height: 380 });
  const currentDistRef = useRef<number[]>(SCENARIOS.balanced.distribution.map(() => 0));
  const currentLossRef = useRef(0);
  const targetScenarioRef = useRef<Scenario>("balanced");

  useEffect(() => {
    targetScenarioRef.current = scenario;
  }, [scenario]);

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDimensions({ width: w, height: Math.max(330, Math.min(400, w * 0.55)) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const { width, height } = dimensions;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = SCENARIOS[targetScenarioRef.current];
      const current = currentDistRef.current;

      // Smooth interpolation
      const lerpRate = 0.06;
      for (let i = 0; i < NUM_EXPERTS; i++) {
        current[i] += (target.distribution[i] - current[i]) * lerpRate;
      }
      currentLossRef.current += (target.lossValue - currentLossRef.current) * lerpRate;

      // Clear
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      // Layout
      const chartLeft = 50;
      const chartRight = width - 30;
      const chartTop = 50;
      const chartBottom = height - 90;
      const chartW = chartRight - chartLeft;
      const chartH = chartBottom - chartTop;
      const barGap = Math.max(4, chartW * 0.015);
      const barWidth = (chartW - barGap * (NUM_EXPERTS + 1)) / NUM_EXPERTS;

      // Capacity line (ideal = TOTAL_TOKENS / NUM_EXPERTS)
      const idealPerExpert = TOTAL_TOKENS / NUM_EXPERTS;
      const maxVal = Math.max(...current, idealPerExpert * 1.2);
      const capacityY = chartBottom - (idealPerExpert / maxVal) * chartH;

      // Y-axis
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartLeft, chartTop);
      ctx.lineTo(chartLeft, chartBottom);
      ctx.stroke();

      // X-axis
      ctx.beginPath();
      ctx.moveTo(chartLeft, chartBottom);
      ctx.lineTo(chartRight, chartBottom);
      ctx.stroke();

      // Grid lines
      const gridSteps = 5;
      for (let i = 1; i <= gridSteps; i++) {
        const val = (maxVal / gridSteps) * i;
        const y = chartBottom - (val / maxVal) * chartH;
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartRight, y);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = `13px ${FONT_MONO}`;
        ctx.textAlign = "right";
        ctx.fillText(`${Math.round(val)}`, chartLeft - 6, y + 3);
      }

      // Capacity line (dashed)
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = `rgba(${ACCENT_RGB}, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chartLeft, capacityY);
      ctx.lineTo(chartRight, capacityY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Capacity label
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.6)`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "right";
      ctx.fillText("ideal capacity", chartRight, capacityY - 6);

      // Bars
      for (let i = 0; i < NUM_EXPERTS; i++) {
        const x = chartLeft + barGap + i * (barWidth + barGap);
        const barH = (current[i] / maxVal) * chartH;
        const y = chartBottom - barH;
        const isOverCapacity = current[i] > idealPerExpert * 1.3;
        const isUnderCapacity = current[i] < idealPerExpert * 0.4;

        // Bar
        const gradient = ctx.createLinearGradient(x, y, x, chartBottom);
        gradient.addColorStop(0, EXPERT_COLORS[i]);
        gradient.addColorStop(1, EXPERT_COLORS[i].replace("0.85", "0.25"));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
        ctx.fill();

        // Over-capacity warning glow
        if (isOverCapacity) {
          ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
          ctx.stroke();
        }

        // Under-utilization marker
        if (isUnderCapacity) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.font = `8px ${FONT_MONO}`;
          ctx.textAlign = "center";
          ctx.fillText("idle", x + barWidth / 2, y - 4);
        }

        // Value on top
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = `bold 13px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(current[i])}`, x + barWidth / 2, y - 10);

        // Expert label below
        ctx.fillStyle = EXPERT_COLORS[i];
        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillText(`E${i}`, x + barWidth / 2, chartBottom + 14);
      }

      // Title
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Tokens per Expert", chartLeft, chartTop - 14);

      // Load balancing loss display
      const lossValue = currentLossRef.current;
      const lossBoxX = chartLeft;
      const lossBoxY = height - 55;
      const lossBoxW = 260;
      const lossBoxH = 42;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.roundRect(lossBoxX, lossBoxY, lossBoxW, lossBoxH, 6);
      ctx.fill();
      ctx.strokeStyle = `rgba(${ACCENT_RGB}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Load Balancing Loss:", lossBoxX + 10, lossBoxY + 16);

      // Color code the loss value
      let lossColor: string;
      if (lossValue < 0.2) lossColor = ACCENT;
      else if (lossValue < 0.5) lossColor = "rgba(251, 191, 36, 1)";
      else lossColor = "rgba(239, 68, 68, 1)";

      ctx.fillStyle = lossColor;
      ctx.font = `bold 15px ${FONT_MONO}`;
      ctx.fillText(`L_aux = ${lossValue.toFixed(3)}`, lossBoxX + 10, lossBoxY + 34);

      // Formula
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("L_aux = N · Σ(f_i · P_i)", lossBoxX + lossBoxW + 20, lossBoxY + 16);
      ctx.fillText("f_i = fraction routed to i", lossBoxX + lossBoxW + 20, lossBoxY + 30);

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
            flexWrap: "wrap",
            gap: 8,
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
            Expert Load Balancing
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {(Object.keys(SCENARIOS) as Scenario[]).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: `1px solid ${
                    scenario === s
                      ? `rgba(${ACCENT_RGB}, 0.6)`
                      : "rgba(255,255,255,0.1)"
                  }`,
                  background:
                    scenario === s
                      ? `rgba(${ACCENT_RGB}, 0.1)`
                      : "rgba(255,255,255,0.03)",
                  color:
                    scenario === s
                      ? `rgba(${ACCENT_RGB}, 0.9)`
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {SCENARIOS[s].label}
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
            {SCENARIOS[scenario].description}
          </p>
        </div>
      </div>
    </div>
  );
}
