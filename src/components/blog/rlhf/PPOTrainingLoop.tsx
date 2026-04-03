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
const RED = "#ef4444";
const RED_RGB = "239, 68, 68";

const CANVAS_W = 700;
const CANVAS_H = 480;

// PPO training stages
const PPO_STAGES = [
  {
    id: "generate",
    label: "Generate",
    description: "Sample responses from the current policy for a batch of prompts.",
    icon: "G",
    color: BLUE,
    colorRgb: BLUE_RGB,
  },
  {
    id: "score",
    label: "Score",
    description: "Use the reward model to score each generated response.",
    icon: "R",
    color: YELLOW,
    colorRgb: YELLOW_RGB,
  },
  {
    id: "compute",
    label: "Advantage",
    description: "Compute advantage estimates: how much better was this than expected?",
    icon: "A",
    color: `rgba(${ACCENT_RGB}, 0.9)`,
    colorRgb: ACCENT_RGB,
  },
  {
    id: "update",
    label: "Update",
    description: "Update policy with clipped PPO objective + KL penalty.",
    icon: "U",
    color: "#c084fc",
    colorRgb: "192, 132, 252",
  },
];

// Simulated training metrics
function generateTrainingData(steps: number) {
  const data: {
    reward: number[];
    kl: number[];
    loss: number[];
  } = { reward: [], kl: [], loss: [] };

  let reward = 0.1;
  let kl = 0.0;
  let loss = 2.0;

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    // Reward climbs logarithmically then plateaus
    reward = 0.1 + 0.75 * (1 - Math.exp(-4 * t)) + Math.random() * 0.05;
    // KL grows then gets controlled
    kl = 0.5 * t * (1 + 0.3 * Math.sin(t * 10)) + Math.random() * 0.03;
    // Loss decreases with noise
    loss = 2.0 * Math.exp(-3 * t) + 0.15 + Math.random() * 0.08;

    data.reward.push(reward);
    data.kl.push(kl);
    data.loss.push(loss);
  }

  return data;
}

const TOTAL_STEPS = 80;
const TRAINING_DATA = generateTrainingData(TOTAL_STEPS);
const KL_THRESHOLD = 0.3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PPOTrainingLoop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const stageTimerRef = useRef<number>(0);
  const [dims, setDims] = useState({ width: CANVAS_W, height: CANVAS_H });

  // Responsive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const scale = Math.min(1, w / CANVAS_W);
        setDims({ width: CANVAS_W * scale, height: CANVAS_H * scale });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = dims.width / CANVAS_W;

  // Step-through animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= PPO_STAGES.length - 1) {
          // Complete one full PPO iteration
          setCurrentStep((s) => {
            if (s >= TOTAL_STEPS - 1) {
              setIsPlaying(false);
              return s;
            }
            return s + 1;
          });
          return 0;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying]);

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

    // --- CYCLE DIAGRAM (top) ---
    const centerX = CANVAS_W / 2;
    const centerY = 115;
    const radius = 70;

    // Draw cycle connections
    for (let i = 0; i < PPO_STAGES.length; i++) {
      const angle1 = (i / PPO_STAGES.length) * Math.PI * 2 - Math.PI / 2;
      const angle2 = ((i + 1) / PPO_STAGES.length) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * radius;
      const x2 = centerX + Math.cos(angle2) * radius;
      const y2 = centerY + Math.sin(angle2) * radius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      // Curved connection
      const midAngle = (angle1 + angle2) / 2;
      const cpDist = radius * 1.15;
      const cpx = centerX + Math.cos(midAngle) * cpDist;
      const cpy = centerY + Math.sin(midAngle) * cpDist;
      ctx.quadraticCurveTo(cpx, cpy, x2, y2);

      const isActive = i === currentStage;
      ctx.strokeStyle = isActive
        ? PPO_STAGES[i].color
        : "rgba(255,255,255,0.1)";
      ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.stroke();

      // Arrow head on active
      if (isActive) {
        const t = 0.85;
        const ax = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpx + t * t * x2;
        const ay = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpy + t * t * y2;
        const t2 = 0.86;
        const bx = (1 - t2) * (1 - t2) * x1 + 2 * (1 - t2) * t2 * cpx + t2 * t2 * x2;
        const by = (1 - t2) * (1 - t2) * y1 + 2 * (1 - t2) * t2 * cpy + t2 * t2 * y2;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          const nx = dx / len;
          const ny = dy / len;
          const arrowSize = 6;
          ctx.beginPath();
          ctx.moveTo(ax + nx * arrowSize, ay + ny * arrowSize);
          ctx.lineTo(ax - ny * arrowSize * 0.5, ay + nx * arrowSize * 0.5);
          ctx.lineTo(ax + ny * arrowSize * 0.5, ay - nx * arrowSize * 0.5);
          ctx.closePath();
          ctx.fillStyle = PPO_STAGES[i].color;
          ctx.fill();
        }
      }
    }

    // Draw stage nodes
    for (let i = 0; i < PPO_STAGES.length; i++) {
      const stage = PPO_STAGES[i];
      const angle = (i / PPO_STAGES.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const isActive = i === currentStage;
      const nodeRadius = isActive ? 26 : 22;

      // Glow
      if (isActive) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 2);
        glow.addColorStop(0, `rgba(${stage.colorRgb}, 0.2)`);
        glow.addColorStop(1, `rgba(${stage.colorRgb}, 0)`);
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node background
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isActive
        ? `rgba(${stage.colorRgb}, 0.15)`
        : "rgba(20,20,20,0.8)";
      ctx.fill();
      ctx.strokeStyle = isActive
        ? stage.color
        : `rgba(${stage.colorRgb}, 0.3)`;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();

      // Icon
      ctx.font = `bold ${isActive ? 15 : 14}px ${FONT_MONO}`;
      ctx.fillStyle = isActive ? stage.color : `rgba(${stage.colorRgb}, 0.6)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stage.icon, x, y);

      // Label
      const labelOffset = nodeRadius + 16;
      const lx = centerX + Math.cos(angle) * (radius + labelOffset);
      const ly = centerY + Math.sin(angle) * (radius + labelOffset);
      ctx.font = `${isActive ? "bold " : ""}13px ${FONT_MONO}`;
      ctx.fillStyle = isActive ? stage.color : "rgba(255,255,255,0.4)";
      ctx.fillText(stage.label, lx, ly);
    }

    // Step counter in center
    ctx.font = `bold 18px ${FONT_MONO}`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${currentStep}`, centerX, centerY - 4);
    ctx.font = `13px ${FONT_MONO}`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("step", centerX, centerY + 12);

    // Stage description
    const desc = PPO_STAGES[currentStage].description;
    ctx.font = `13px ${FONT_MONO}`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.fillText(desc, centerX, centerY + radius + 50);

    // --- CHARTS (bottom) ---
    const chartY = 240;
    const chartH = 80;
    const chartPadX = 60;
    const chartW = CANVAS_W - 2 * chartPadX;

    // Helper to draw a line chart
    const drawChart = (
      data: number[],
      yOffset: number,
      color: string,
      label: string,
      maxVal: number,
      threshold?: number
    ) => {
      const cy = chartY + yOffset;

      // Background
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(chartPadX, cy, chartW, chartH);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(chartPadX, cy, chartW, chartH);

      // Label
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(label, chartPadX, cy - 6);

      // Current value
      if (currentStep > 0) {
        const val = data[Math.min(currentStep, data.length - 1)];
        ctx.textAlign = "right";
        ctx.fillText(val.toFixed(3), chartPadX + chartW, cy - 6);
      }

      // Threshold line
      if (threshold !== undefined) {
        const ty = cy + chartH - (threshold / maxVal) * chartH;
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(chartPadX, ty);
        ctx.lineTo(chartPadX + chartW, ty);
        ctx.strokeStyle = `rgba(${RED_RGB}, 0.4)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.font = `13px ${FONT_MONO}`;
        ctx.fillStyle = `rgba(${RED_RGB}, 0.5)`;
        ctx.textAlign = "left";
        ctx.fillText("KL limit", chartPadX + chartW + 4, ty + 3);
      }

      // Data line
      if (currentStep > 0) {
        ctx.beginPath();
        for (let i = 0; i <= currentStep && i < data.length; i++) {
          const px = chartPadX + (i / TOTAL_STEPS) * chartW;
          const py = cy + chartH - (data[i] / maxVal) * chartH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Current point glow
        const lastI = Math.min(currentStep, data.length - 1);
        const lastX = chartPadX + (lastI / TOTAL_STEPS) * chartW;
        const lastY = cy + chartH - (data[lastI] / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Y-axis ticks
      ctx.font = `8px ${FONT_MONO}`;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.textAlign = "right";
      ctx.fillText("0", chartPadX - 4, cy + chartH);
      ctx.fillText(maxVal.toFixed(1), chartPadX - 4, cy + 8);
    };

    drawChart(TRAINING_DATA.reward, 0, ACCENT, "reward", 1.0);
    drawChart(TRAINING_DATA.kl, chartH + 20, YELLOW, "kl divergence", 0.6, KL_THRESHOLD);
    drawChart(TRAINING_DATA.loss, 2 * (chartH + 20), BLUE, "ppo loss", 2.5);

    animRef.current = requestAnimationFrame(draw);
  }, [dims, scale, currentStep, currentStage]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= TOTAL_STEPS - 1) {
      setCurrentStep(0);
      setCurrentStage(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [currentStep]);

  const handleStepForward = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStage((prev) => {
        if (prev >= PPO_STAGES.length - 1) {
          setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
          return 0;
        }
        return prev + 1;
      });
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    setCurrentStage(0);
  }, []);

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
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          ppo training loop · generate {">"} score {">"} advantage {">"} update
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: FONT_MONO,
            color: `rgba(${ACCENT_RGB}, 0.5)`,
          }}
        >
          step {currentStep}/{TOTAL_STEPS}
        </span>
      </div>

      <div style={{ position: "relative", width: dims.width, height: dims.height }}>
        <canvas
          ref={canvasRef}
          style={{ width: dims.width, height: dims.height }}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          padding: "10px 16px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 8,
          justifyContent: "center",
          fontFamily: FONT_MONO,
        }}
      >
        <button
          onClick={handleReset}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            borderRadius: 4,
            padding: "6px 14px",
            fontSize: 13,
            fontFamily: FONT_MONO,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        <button
          onClick={handleStepForward}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            borderRadius: 4,
            padding: "6px 14px",
            fontSize: 13,
            fontFamily: FONT_MONO,
            cursor: "pointer",
          }}
        >
          Step
        </button>
        <button
          onClick={handlePlayPause}
          style={{
            background: `rgba(${ACCENT_RGB}, 0.1)`,
            border: `1px solid rgba(${ACCENT_RGB}, 0.3)`,
            color: ACCENT,
            borderRadius: 4,
            padding: "6px 20px",
            fontSize: 13,
            fontFamily: FONT_MONO,
            cursor: "pointer",
          }}
        >
          {isPlaying ? "Pause" : currentStep >= TOTAL_STEPS - 1 ? "Replay" : "Play"}
        </button>
      </div>
    </div>
  );
}
