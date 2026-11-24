"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";

const YELLOW = "#facc15";
const YELLOW_RGB = "250, 204, 21";
const BLUE = "#60a5fa";
const BLUE_RGB = "96, 165, 250";
const PURPLE = "#c084fc";
const PURPLE_RGB = "192, 132, 252";

const CANVAS_W = 720;
const CANVAS_H = 400;

// ---------------------------------------------------------------------------
// Pipeline definitions
// ---------------------------------------------------------------------------

interface PipelineStage {
  label: string;
  shortLabel: string;
  color: string;
  colorRgb: string;
  width: number;
}

const RLHF_STAGES: PipelineStage[] = [
  { label: "Collect\nDemonstrations", shortLabel: "Data", color: BLUE, colorRgb: BLUE_RGB, width: 120 },
  { label: "Supervised\nFine-Tuning", shortLabel: "SFT", color: BLUE, colorRgb: BLUE_RGB, width: 120 },
  { label: "Collect\nComparisons", shortLabel: "Prefs", color: YELLOW, colorRgb: YELLOW_RGB, width: 120 },
  { label: "Train Reward\nModel", shortLabel: "RM", color: YELLOW, colorRgb: YELLOW_RGB, width: 120 },
  { label: "PPO\nOptimization", shortLabel: "PPO", color: ACCENT, colorRgb: ACCENT_RGB, width: 120 },
];

const DPO_STAGES: PipelineStage[] = [
  { label: "Collect\nDemonstrations", shortLabel: "Data", color: BLUE, colorRgb: BLUE_RGB, width: 140 },
  { label: "Supervised\nFine-Tuning", shortLabel: "SFT", color: BLUE, colorRgb: BLUE_RGB, width: 140 },
  { label: "Collect\nComparisons", shortLabel: "Prefs", color: YELLOW, colorRgb: YELLOW_RGB, width: 140 },
  { label: "Direct Preference\nOptimization", shortLabel: "DPO", color: PURPLE, colorRgb: PURPLE_RGB, width: 180 },
];

const COMPARISON_POINTS = [
  { category: "Components", rlhf: "3 models (SFT, RM, Policy)", dpo: "2 models (SFT, Policy)" },
  { category: "RL Required", rlhf: "Yes (PPO)", dpo: "No (supervised loss)" },
  { category: "Stability", rlhf: "Sensitive to hyperparams", dpo: "More stable training" },
  { category: "Memory", rlhf: "High (3 models in memory)", dpo: "Lower (2 models)" },
  { category: "Reward Hacking", rlhf: "Possible (explicit reward)", dpo: "Less susceptible" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DPOComparison() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [mode, setMode] = useState<"rlhf" | "dpo" | "compare">("rlhf");
  const [transitionProgress, setTransitionProgress] = useState(1);
  const transitionRef = useRef<number>(0);
  const [dims, setDims] = useState({ width: CANVAS_W, height: CANVAS_H });

  // Responsive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const s = Math.min(1, w / CANVAS_W);
        setDims({ width: CANVAS_W * s, height: CANVAS_H * s });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = dims.width / CANVAS_W;

  // Transition animation when switching modes
  const switchMode = useCallback((newMode: "rlhf" | "dpo" | "compare") => {
    setTransitionProgress(0);
    setMode(newMode);
    let start: number | null = null;
    const duration = 600;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setTransitionProgress(eased);
      if (t < 1) transitionRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(transitionRef.current);
    transitionRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(transitionRef.current);
  }, []);

  // Canvas rendering
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    ctx.scale(dpr * scale, dpr * scale);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    timeRef.current += 1;

    const drawPipeline = (
      stages: PipelineStage[],
      yCenter: number,
      label: string,
      labelColor: string,
      alpha: number
    ) => {
      const totalWidth = stages.reduce((s, st) => s + st.width, 0);
      const gaps = (stages.length - 1) * 20;
      const totalSpan = totalWidth + gaps;
      const startX = (CANVAS_W - totalSpan) / 2;

      // Pipeline label
      ctx.font = `bold 15px ${FONT_MONO}`;
      ctx.fillStyle = labelColor;
      ctx.globalAlpha = alpha;
      ctx.textAlign = "left";
      ctx.fillText(label, startX, yCenter - 42);

      let x = startX;
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const boxH = 60;
        const boxY = yCenter - boxH / 2;

        // Box
        ctx.beginPath();
        ctx.roundRect(x, boxY, stage.width, boxH, 6);
        ctx.fillStyle = `rgba(${stage.colorRgb}, ${0.06 * alpha})`;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.strokeStyle = `rgba(${stage.colorRgb}, ${0.35 * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label lines
        const lines = stage.label.split("\n");
        ctx.font = `13px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(255,255,255,${0.75 * alpha})`;
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(lines[li], x + stage.width / 2, yCenter - 4 + li * 16);
        }

        // Short label below
        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillStyle = `rgba(${stage.colorRgb}, ${0.5 * alpha})`;
        ctx.fillText(stage.shortLabel, x + stage.width / 2, boxY + boxH + 14);

        // Arrow to next
        if (i < stages.length - 1) {
          const arrowX1 = x + stage.width;
          const arrowX2 = x + stage.width + 20;

          ctx.beginPath();
          ctx.moveTo(arrowX1, yCenter);
          ctx.lineTo(arrowX2, yCenter);
          ctx.strokeStyle = `rgba(255,255,255,${0.15 * alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(arrowX2, yCenter);
          ctx.lineTo(arrowX2 - 5, yCenter - 3);
          ctx.lineTo(arrowX2 - 5, yCenter + 3);
          ctx.closePath();
          ctx.fillStyle = `rgba(255,255,255,${0.2 * alpha})`;
          ctx.fill();

          // Animated particle
          const particleT = ((timeRef.current * 0.015 + i * 0.3) % 1);
          const px = arrowX1 + (arrowX2 - arrowX1) * particleT;
          ctx.beginPath();
          ctx.arc(px, yCenter, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${stage.colorRgb}, ${0.6 * alpha * (1 - Math.abs(particleT - 0.5) * 2)})`;
          ctx.fill();
        }

        x += stage.width + 20;
      }

      ctx.globalAlpha = 1;
    };

    if (mode === "compare") {
      // Draw both pipelines
      drawPipeline(RLHF_STAGES, 80, "RLHF (PPO)", ACCENT, transitionProgress);
      drawPipeline(DPO_STAGES, 200, "DPO", PURPLE, transitionProgress);

      // Draw strikethrough on RM + PPO stages (stages 3-4 in RLHF)
      if (transitionProgress > 0.5) {
        const crossAlpha = (transitionProgress - 0.5) * 2;
        // Draw "eliminated" overlay text
        ctx.font = `bold 13px ${FONT_MONO}`;
        ctx.fillStyle = `rgba(${PURPLE_RGB}, ${0.6 * crossAlpha})`;
        ctx.textAlign = "center";
        ctx.fillText(
          "DPO eliminates the reward model and RL loop",
          CANVAS_W / 2,
          148
        );
      }

      // Comparison table
      const tableY = 260;
      const tableX = 60;
      const colW = 300;
      const rowH = 22;

      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText("", tableX, tableY);
      ctx.fillStyle = ACCENT;
      ctx.fillText("RLHF", tableX + 120, tableY);
      ctx.fillStyle = PURPLE;
      ctx.fillText("DPO", tableX + 400, tableY);

      for (let i = 0; i < COMPARISON_POINTS.length; i++) {
        const pt = COMPARISON_POINTS[i];
        const ry = tableY + 18 + i * rowH;
        const rowAlpha = Math.min(1, transitionProgress * 2 - i * 0.15);
        if (rowAlpha <= 0) continue;

        ctx.globalAlpha = rowAlpha;

        // Separator
        ctx.beginPath();
        ctx.moveTo(tableX, ry - 4);
        ctx.lineTo(tableX + 560, ry - 4);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.textAlign = "left";
        ctx.fillText(pt.category, tableX, ry + 8);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(pt.rlhf, tableX + 120, ry + 8);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(pt.dpo, tableX + 400, ry + 8);
      }
      ctx.globalAlpha = 1;
    } else if (mode === "rlhf") {
      drawPipeline(RLHF_STAGES, 120, "RLHF Pipeline (Ouyang et al., 2022)", ACCENT, transitionProgress);

      // Additional info
      const infoY = 200;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255,255,255,${0.45 * transitionProgress})`;
      ctx.textAlign = "center";
      ctx.fillText(
        "Three separate training phases. The reward model must be trained before PPO can begin.",
        CANVAS_W / 2,
        infoY
      );
      ctx.fillText(
        "PPO requires keeping the policy, reference policy, reward model, and value model in memory.",
        CANVAS_W / 2,
        infoY + 20
      );

      // Memory diagram
      const memY = infoY + 60;
      const models = [
        { label: "Policy (pi_theta)", w: 140, color: ACCENT_RGB },
        { label: "Reference (pi_ref)", w: 140, color: BLUE_RGB },
        { label: "Reward Model", w: 120, color: YELLOW_RGB },
        { label: "Value Model", w: 120, color: PURPLE_RGB },
      ];
      let mx = (CANVAS_W - (models.reduce((s, m) => s + m.w, 0) + (models.length - 1) * 10)) / 2;

      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255,255,255,${0.3 * transitionProgress})`;
      ctx.textAlign = "center";
      ctx.fillText("GPU Memory", CANVAS_W / 2, memY - 8);

      for (const model of models) {
        ctx.beginPath();
        ctx.roundRect(mx, memY, model.w, 36, 4);
        ctx.fillStyle = `rgba(${model.color}, ${0.08 * transitionProgress})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${model.color}, ${0.25 * transitionProgress})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillStyle = `rgba(255,255,255,${0.55 * transitionProgress})`;
        ctx.textAlign = "center";
        ctx.fillText(model.label, mx + model.w / 2, memY + 22);

        mx += model.w + 10;
      }

      // Memory bar
      const barY = memY + 50;
      ctx.beginPath();
      ctx.roundRect(100, barY, CANVAS_W - 200, 12, 3);
      ctx.fillStyle = `rgba(${ACCENT_RGB}, ${0.15 * transitionProgress})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${0.2 * transitionProgress})`;
      ctx.stroke();

      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255,255,255,${0.3 * transitionProgress})`;
      ctx.textAlign = "center";
      ctx.fillText("~4x model parameters in GPU memory", CANVAS_W / 2, barY + 26);
    } else {
      // DPO mode
      drawPipeline(DPO_STAGES, 120, "DPO Pipeline (Rafailov et al., 2023)", PURPLE, transitionProgress);

      const infoY = 200;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255,255,255,${0.45 * transitionProgress})`;
      ctx.textAlign = "center";
      ctx.fillText(
        "No reward model. No RL loop. Direct optimization of preferences via a supervised loss.",
        CANVAS_W / 2,
        infoY
      );
      ctx.fillText(
        "The key insight: the optimal policy under the RLHF objective has a closed-form solution.",
        CANVAS_W / 2,
        infoY + 20
      );

      // Memory diagram
      const memY = infoY + 60;
      const models = [
        { label: "Policy (pi_theta)", w: 170, color: PURPLE_RGB },
        { label: "Reference (pi_ref)", w: 170, color: BLUE_RGB },
      ];
      let mx = (CANVAS_W - (models.reduce((s, m) => s + m.w, 0) + 10)) / 2;

      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255,255,255,${0.3 * transitionProgress})`;
      ctx.textAlign = "center";
      ctx.fillText("GPU Memory", CANVAS_W / 2, memY - 8);

      for (const model of models) {
        ctx.beginPath();
        ctx.roundRect(mx, memY, model.w, 36, 4);
        ctx.fillStyle = `rgba(${model.color}, ${0.08 * transitionProgress})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${model.color}, ${0.25 * transitionProgress})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillStyle = `rgba(255,255,255,${0.55 * transitionProgress})`;
        ctx.textAlign = "center";
        ctx.fillText(model.label, mx + model.w / 2, memY + 22);

        mx += model.w + 10;
      }

      // Memory bar (shorter)
      const barY = memY + 50;
      const barW = (CANVAS_W - 200) * 0.5;
      const barX = (CANVAS_W - barW) / 2;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, 12, 3);
      ctx.fillStyle = `rgba(${PURPLE_RGB}, ${0.15 * transitionProgress})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${PURPLE_RGB}, ${0.2 * transitionProgress})`;
      ctx.stroke();

      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255,255,255,${0.3 * transitionProgress})`;
      ctx.textAlign = "center";
      ctx.fillText("~2x model parameters in GPU memory", CANVAS_W / 2, barY + 26);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [dims, scale, mode, transitionProgress]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        background: BG,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px 8px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: FONT_MONO,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          rlhf vs dpo · pipeline comparison
        </span>
      </div>

      {/* Mode tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {(["rlhf", "dpo", "compare"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1,
              background:
                mode === m ? "rgba(255,255,255,0.04)" : "transparent",
              border: "none",
              borderBottom:
                mode === m
                  ? `2px solid ${m === "rlhf" ? ACCENT : m === "dpo" ? PURPLE : YELLOW}`
                  : "2px solid transparent",
              color:
                mode === m
                  ? m === "rlhf"
                    ? ACCENT
                    : m === "dpo"
                    ? PURPLE
                    : YELLOW
                  : "rgba(255,255,255,0.5)",
              padding: "10px 16px",
              fontSize: 13,
              fontFamily: FONT_MONO,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {m === "compare" ? "Compare" : m.toUpperCase()}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: dims.width, height: dims.height }}
      />
    </div>
  );
}
