"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";

const SVG_WIDTH = 780;
const SVG_HEIGHT = 420;

// Stage boxes
const BOX_WIDTH = 190;
const BOX_HEIGHT = 110;
const BOX_Y = 60;
const BOX_GAP = 25;
const BOX_RADIUS = 8;

const STAGES = [
  {
    id: "sft",
    label: "Supervised\nFine-Tuning",
    shortLabel: "SFT",
    x: 40,
    color: `rgba(100, 150, 255, 0.8)`,
    bgFill: `rgba(100, 150, 255, 0.06)`,
    bgStroke: `rgba(100, 150, 255, 0.25)`,
    description:
      "Train the base model on human-written demonstrations. The model learns to follow instructions by imitating high-quality examples.",
    inputs: "Base LLM + Human demonstrations",
    outputs: "SFT Model (π_SFT)",
  },
  {
    id: "reward",
    label: "Reward\nModel",
    shortLabel: "RM",
    x: 40 + BOX_WIDTH + BOX_GAP + 30,
    color: `rgba(250, 204, 21, 0.8)`,
    bgFill: `rgba(250, 204, 21, 0.06)`,
    bgStroke: `rgba(250, 204, 21, 0.25)`,
    description:
      "Train a separate model to predict human preferences. Given a prompt and two responses, it learns which response humans would prefer.",
    inputs: "Comparison data (y_w ≻ y_l)",
    outputs: "Reward model r_θ(x, y)",
  },
  {
    id: "ppo",
    label: "PPO\nOptimization",
    shortLabel: "PPO",
    x: 40 + 2 * (BOX_WIDTH + BOX_GAP) + 60,
    color: `rgba(${ACCENT_RGB}, 0.8)`,
    bgFill: `rgba(${ACCENT_RGB}, 0.06)`,
    bgStroke: `rgba(${ACCENT_RGB}, 0.25)`,
    description:
      "Use RL to optimize the SFT model against the reward model. A KL penalty prevents the policy from straying too far from the SFT model.",
    inputs: "SFT Model + Reward Model",
    outputs: "Aligned model π_RLHF",
  },
];

// Data flow particles
interface Particle {
  x: number;
  y: number;
  progress: number;
  segmentIndex: number;
  speed: number;
  opacity: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RLHFPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);

  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [dims, setDims] = useState({ width: SVG_WIDTH, height: SVG_HEIGHT });

  // Responsive scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const scale = Math.min(1, w / SVG_WIDTH);
        setDims({
          width: SVG_WIDTH * scale,
          height: SVG_HEIGHT * scale,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = dims.width / SVG_WIDTH;

  // Initialize particles for connections
  useEffect(() => {
    const particles: Particle[] = [];
    for (let seg = 0; seg < 2; seg++) {
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: 0,
          y: 0,
          progress: (i / 6) + Math.random() * 0.1,
          segmentIndex: seg,
          speed: 0.003 + Math.random() * 0.002,
          opacity: 0.4 + Math.random() * 0.4,
        });
      }
    }
    particlesRef.current = particles;
  }, []);

  // Canvas animation
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    ctx.scale(dpr * scale, dpr * scale);
    ctx.clearRect(0, 0, SVG_WIDTH, SVG_HEIGHT);

    timeRef.current += 1;

    // Draw connection arrows
    for (let seg = 0; seg < 2; seg++) {
      const fromStage = STAGES[seg];
      const toStage = STAGES[seg + 1];
      const x1 = fromStage.x + BOX_WIDTH;
      const x2 = toStage.x;
      const y = BOX_Y + BOX_HEIGHT / 2;

      // Arrow line
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrow head
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(x2, y);
      ctx.lineTo(x2 - arrowSize, y - arrowSize / 2);
      ctx.lineTo(x2 - arrowSize, y + arrowSize / 2);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
      ctx.fill();
    }

    // Animate particles along connections
    const particles = particlesRef.current;
    for (const p of particles) {
      p.progress += p.speed;
      if (p.progress > 1) p.progress -= 1;

      const fromStage = STAGES[p.segmentIndex];
      const toStage = STAGES[p.segmentIndex + 1];
      const x1 = fromStage.x + BOX_WIDTH;
      const x2 = toStage.x;
      const y = BOX_Y + BOX_HEIGHT / 2;

      p.x = x1 + (x2 - x1) * p.progress;
      p.y = y + Math.sin(p.progress * Math.PI * 2 + timeRef.current * 0.05) * 3;

      const glowOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.progress * Math.PI));

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
      grad.addColorStop(0, `rgba(${ACCENT_RGB}, ${glowOpacity * 0.8})`);
      grad.addColorStop(1, `rgba(${ACCENT_RGB}, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT_RGB}, ${glowOpacity})`;
      ctx.fill();
    }

    // Draw stage labels below boxes
    ctx.font = `13px ${FONT_MONO}`;
    ctx.textAlign = "center";
    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i];
      const cx = stage.x + BOX_WIDTH / 2;
      ctx.fillStyle = `rgba(255, 255, 255, 0.35)`;
      ctx.fillText(`Step ${i + 1}`, cx, BOX_Y - 12);
    }

    // Draw the detail panel if a stage is active
    const stageIdx = activeStage ?? hoveredStage;
    if (stageIdx !== null) {
      const stage = STAGES[stageIdx];
      const panelY = BOX_Y + BOX_HEIGHT + 40;
      const panelX = 40;
      const panelW = SVG_WIDTH - 80;
      const panelH = 170;

      // Panel background
      ctx.fillStyle = `rgba(20, 20, 20, 0.9)`;
      ctx.strokeStyle = stage.bgStroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 6);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.font = `bold 15px ${FONT_MONO}`;
      ctx.fillStyle = stage.color;
      ctx.textAlign = "left";
      ctx.fillText(
        `${stage.shortLabel} — ${stage.label.replace("\n", " ")}`,
        panelX + 16,
        panelY + 28
      );

      // Description
      ctx.font = `14px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255, 255, 255, 0.65)`;
      const descWords = stage.description.split(" ");
      let line = "";
      let lineY = panelY + 52;
      const maxLineWidth = panelW - 32;
      for (const word of descWords) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxLineWidth && line.length > 0) {
          ctx.fillText(line.trim(), panelX + 16, lineY);
          line = word + " ";
          lineY += 18;
        } else {
          line = test;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), panelX + 16, lineY);

      // Inputs / Outputs
      const ioY = lineY + 30;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.fillText("Input:", panelX + 16, ioY);
      ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.fillText(stage.inputs, panelX + 70, ioY);

      ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.fillText("Output:", panelX + 16, ioY + 20);
      ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.fillText(stage.outputs, panelX + 78, ioY + 20);
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [dims, scale, activeStage, hoveredStage]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Click handler for stages
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      for (let i = 0; i < STAGES.length; i++) {
        const s = STAGES[i];
        if (x >= s.x && x <= s.x + BOX_WIDTH && y >= BOX_Y && y <= BOX_Y + BOX_HEIGHT) {
          setActiveStage((prev) => (prev === i ? null : i));
          return;
        }
      }
      setActiveStage(null);
    },
    [scale]
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      let found = false;
      for (let i = 0; i < STAGES.length; i++) {
        const s = STAGES[i];
        if (x >= s.x && x <= s.x + BOX_WIDTH && y >= BOX_Y && y <= BOX_Y + BOX_HEIGHT) {
          setHoveredStage(i);
          found = true;
          break;
        }
      }
      if (!found) setHoveredStage(null);
    },
    [scale]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
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
          rlhf pipeline · click stages for details
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: FONT_MONO,
            color: `rgba(${ACCENT_RGB}, 0.65)`,
          }}
        >
          interactive
        </span>
      </div>

      {/* SVG stage boxes rendered on top of canvas */}
      <div style={{ position: "relative", width: dims.width, height: dims.height }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHoveredStage(null)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dims.width,
            height: dims.height,
            cursor: "pointer",
          }}
        />
        <svg
          width={dims.width}
          height={dims.height}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {STAGES.map((stage, i) => {
            const isActive = activeStage === i || hoveredStage === i;
            return (
              <g key={stage.id}>
                <rect
                  x={stage.x}
                  y={BOX_Y}
                  width={BOX_WIDTH}
                  height={BOX_HEIGHT}
                  rx={BOX_RADIUS}
                  fill={isActive ? stage.bgFill : "rgba(20, 20, 20, 0.6)"}
                  stroke={isActive ? stage.color : stage.bgStroke}
                  strokeWidth={isActive ? 2 : 1}
                  style={{
                    transition: "all 0.2s ease",
                    filter: isActive
                      ? `drop-shadow(0 0 12px ${stage.bgStroke})`
                      : "none",
                  }}
                />
                {/* Stage number circle */}
                <circle
                  cx={stage.x + 24}
                  cy={BOX_Y + 24}
                  r={12}
                  fill={isActive ? stage.color : stage.bgStroke}
                  style={{ transition: "fill 0.2s ease" }}
                />
                <text
                  x={stage.x + 24}
                  y={BOX_Y + 28}
                  textAnchor="middle"
                  fill={isActive ? "#0a0a0a" : "rgba(255,255,255,0.7)"}
                  fontSize={13}
                  fontWeight="bold"
                  fontFamily={FONT_MONO}
                  style={{ transition: "fill 0.2s ease" }}
                >
                  {i + 1}
                </text>
                {/* Stage title */}
                {stage.label.split("\n").map((line, li) => (
                  <text
                    key={li}
                    x={stage.x + BOX_WIDTH / 2}
                    y={BOX_Y + 50 + li * 20}
                    textAnchor="middle"
                    fill={isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)"}
                    fontSize={15}
                    fontWeight={isActive ? "bold" : "normal"}
                    fontFamily={FONT_MONO}
                    style={{ transition: "all 0.2s ease" }}
                  >
                    {line}
                  </text>
                ))}
                {/* Short label */}
                <text
                  x={stage.x + BOX_WIDTH / 2}
                  y={BOX_Y + BOX_HEIGHT - 8}
                  textAnchor="middle"
                  fill={stage.color}
                  fontSize={13}
                  fontFamily={FONT_MONO}
                  opacity={0.6}
                >
                  {stage.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
