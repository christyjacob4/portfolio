"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_DIM = "rgba(74,222,128,0.15)";
const FROZEN_COLOR = "rgba(100,150,255,0.7)";
const FROZEN_FILL = "rgba(100,150,255,0.06)";
const FROZEN_STROKE = "rgba(100,150,255,0.2)";
const TRAINABLE_FILL = "rgba(74,222,128,0.06)";
const TRAINABLE_STROKE = "rgba(74,222,128,0.2)";
const SIGNAL_COLOR = "rgba(250,204,21,0.9)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;

// Layout positions
const INPUT_X = 50;
const INPUT_Y = 190;
const INPUT_W = 50;
const INPUT_H = 30;

const W_X = 200;
const W_Y = 80;
const W_W = 100;
const W_H = 60;

const B_X = 200;
const B_Y = 260;
const B_W = 60;
const B_H = 50;

const A_X = 310;
const A_Y = 260;
const A_W = 60;
const A_H = 50;

const ADD_X = 430;
const ADD_Y = 175;
const ADD_R = 18;

const OUTPUT_X = 510;
const OUTPUT_Y = 175;
const OUTPUT_W = 60;
const OUTPUT_H = 30;

// Scaling box
const ALPHA_X = 400;
const ALPHA_Y = 270;
const ALPHA_W = 40;
const ALPHA_H = 24;

// Animation timing
const STEP_DURATION = 600;
const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnimStep {
  label: string;
  description: string;
  activeElements: string[];
  signalPaths: { from: string; to: string }[];
}

const STEPS: AnimStep[] = [
  {
    label: "Input",
    description: "Input vector x enters the layer",
    activeElements: ["input"],
    signalPaths: [],
  },
  {
    label: "Frozen path",
    description: "x is multiplied by frozen weight W",
    activeElements: ["input", "W"],
    signalPaths: [{ from: "input", to: "W" }],
  },
  {
    label: "W output",
    description: "Wx produces the main output",
    activeElements: ["W", "add"],
    signalPaths: [{ from: "W", to: "add" }],
  },
  {
    label: "LoRA down",
    description: "x is also projected down by A (d -> r)",
    activeElements: ["input", "A"],
    signalPaths: [{ from: "input", to: "A" }],
  },
  {
    label: "LoRA up",
    description: "The low-rank representation is projected up by B (r -> d)",
    activeElements: ["A", "B"],
    signalPaths: [{ from: "A", to: "B" }],
  },
  {
    label: "Scale",
    description: "Result is scaled by alpha/r",
    activeElements: ["B", "alpha"],
    signalPaths: [{ from: "B", to: "alpha" }],
  },
  {
    label: "Add",
    description: "Wx + (alpha/r) * BAx = output",
    activeElements: ["alpha", "add", "output"],
    signalPaths: [{ from: "alpha", to: "add" }, { from: "add", to: "output" }],
  },
];

// ---------------------------------------------------------------------------
// Signal particle
// ---------------------------------------------------------------------------

function getNodeCenter(id: string): { x: number; y: number } {
  switch (id) {
    case "input":
      return { x: INPUT_X + INPUT_W / 2, y: INPUT_Y + INPUT_H / 2 };
    case "W":
      return { x: W_X + W_W / 2, y: W_Y + W_H / 2 };
    case "A":
      return { x: A_X + A_W / 2, y: A_Y + A_H / 2 };
    case "B":
      return { x: B_X + B_W / 2, y: B_Y + B_H / 2 };
    case "alpha":
      return { x: ALPHA_X + ALPHA_W / 2, y: ALPHA_Y + ALPHA_H / 2 };
    case "add":
      return { x: ADD_X, y: ADD_Y };
    case "output":
      return { x: OUTPUT_X + OUTPUT_W / 2, y: OUTPUT_Y + OUTPUT_H / 2 };
    default:
      return { x: 0, y: 0 };
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LoRAForwardPass() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const stepProgress = (elapsed % STEP_DURATION) / STEP_DURATION;
      const currentStep = Math.floor(elapsed / STEP_DURATION) % TOTAL_STEPS;

      setStep(currentStep);
      setProgress(stepProgress);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  const currentStep = STEPS[step];
  const isActive = (id: string) => currentStep.activeElements.includes(id);

  // Render connection paths
  const renderPaths = () => {
    const paths = [
      // input -> W (frozen path, top)
      {
        id: "input-W",
        d: `M${INPUT_X + INPUT_W},${INPUT_Y + INPUT_H / 2} Q${(INPUT_X + INPUT_W + W_X) / 2},${W_Y + W_H / 2} ${W_X},${W_Y + W_H / 2}`,
        frozen: true,
      },
      // W -> add
      {
        id: "W-add",
        d: `M${W_X + W_W},${W_Y + W_H / 2} Q${(W_X + W_W + ADD_X) / 2},${(W_Y + W_H / 2 + ADD_Y) / 2} ${ADD_X - ADD_R},${ADD_Y}`,
        frozen: true,
      },
      // input -> A (LoRA path, bottom)
      {
        id: "input-A",
        d: `M${INPUT_X + INPUT_W},${INPUT_Y + INPUT_H / 2} Q${(INPUT_X + INPUT_W + A_X) / 2},${A_Y + A_H / 2} ${A_X},${A_Y + A_H / 2}`,
        frozen: false,
      },
      // A -> B
      {
        id: "A-B",
        d: `M${A_X - 1},${A_Y + A_H / 2} L${B_X + B_W + 1},${B_Y + B_H / 2}`,
        frozen: false,
      },
      // B -> alpha
      {
        id: "B-alpha",
        d: `M${B_X + B_W / 2},${B_Y} Q${(B_X + B_W / 2 + ALPHA_X + ALPHA_W / 2) / 2},${ALPHA_Y + ALPHA_H / 2} ${ALPHA_X},${ALPHA_Y + ALPHA_H / 2}`,
        frozen: false,
      },
      // alpha -> add
      {
        id: "alpha-add",
        d: `M${ALPHA_X + ALPHA_W},${ALPHA_Y + ALPHA_H / 2} Q${(ALPHA_X + ALPHA_W + ADD_X) / 2},${(ALPHA_Y + ALPHA_H / 2 + ADD_Y) / 2} ${ADD_X},${ADD_Y + ADD_R}`,
        frozen: false,
      },
      // add -> output
      {
        id: "add-output",
        d: `M${ADD_X + ADD_R},${ADD_Y} L${OUTPUT_X},${OUTPUT_Y + OUTPUT_H / 2}`,
        frozen: false,
      },
    ];

    return paths.map((p) => {
      // Determine if this path has an active signal
      const pathActive =
        currentStep.signalPaths.some(
          (sp) => p.id === `${sp.from}-${sp.to}`
        );

      return (
        <g key={p.id}>
          {/* Base path */}
          <path
            d={p.d}
            fill="none"
            stroke={
              pathActive
                ? p.frozen
                  ? "rgba(100,150,255,0.5)"
                  : "rgba(74,222,128,0.5)"
                : "rgba(255,255,255,0.06)"
            }
            strokeWidth={pathActive ? 2.5 : 1.5}
            strokeDasharray={pathActive ? undefined : "4 3"}
          />
          {/* Animated signal particle */}
          {pathActive && (
            <circle r={4} fill={SIGNAL_COLOR}>
              <animateMotion
                dur={`${STEP_DURATION}ms`}
                repeatCount="1"
                path={p.d}
              />
            </circle>
          )}
        </g>
      );
    });
  };

  return (
    <div
      style={{
        background: "rgb(10,10,10)",
        padding: "20px 16px 16px",
        fontFamily: FONT_MONO,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          forward pass · h = Wx + (alpha/r) * BAx
        </span>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            fontSize: 13,
            color: ACCENT,
            background: "rgba(74,222,128,0.08)",
            border: `1px solid rgba(74,222,128,0.2)`,
            borderRadius: 4,
            padding: "3px 10px",
            cursor: "pointer",
            fontFamily: FONT_MONO,
          }}
        >
          {isPlaying ? "pause" : "play"}
        </button>
      </div>

      {/* SVG Diagram */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: "100%", maxWidth: 600 }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* No filters needed - using direct stroke/fill for emphasis */}
          </defs>

          {/* Path labels */}
          <text
            x={W_X + W_W / 2}
            y={40}
            textAnchor="middle"
            fill={FROZEN_COLOR}
            fontSize={13}
            fontFamily={FONT_MONO}
            opacity={0.6}
          >
            frozen path
          </text>
          <text
            x={(B_X + A_X + A_W) / 2}
            y={345}
            textAnchor="middle"
            fill={ACCENT}
            fontSize={13}
            fontFamily={FONT_MONO}
            opacity={0.6}
          >
            trainable LoRA path
          </text>

          {/* Connection paths */}
          {renderPaths()}

          {/* Input node */}
          <g>
            <rect
              x={INPUT_X}
              y={INPUT_Y}
              width={INPUT_W}
              height={INPUT_H}
              rx={5}
              fill={isActive("input") ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.03)"}
              stroke={isActive("input") ? "rgba(250,204,21,0.5)" : "rgba(255,255,255,0.1)"}
              strokeWidth={isActive("input") ? 2 : 1}
            />
            <text
              x={INPUT_X + INPUT_W / 2}
              y={INPUT_Y + INPUT_H / 2 + 4}
              textAnchor="middle"
              fill={isActive("input") ? "rgba(250,204,21,0.9)" : "rgba(255,255,255,0.5)"}
              fontSize={14}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              x
            </text>
          </g>

          {/* W (frozen) */}
          <g>
            <rect
              x={W_X}
              y={W_Y}
              width={W_W}
              height={W_H}
              rx={6}
              fill={isActive("W") ? "rgba(100,150,255,0.12)" : FROZEN_FILL}
              stroke={isActive("W") ? "rgba(100,150,255,0.5)" : FROZEN_STROKE}
              strokeWidth={isActive("W") ? 2 : 1}
            />
            {/* Lock icon indicator */}
            <text
              x={W_X + 10}
              y={W_Y + 16}
              fill="rgba(100,150,255,0.3)"
              fontSize={8}
              fontFamily={FONT_MONO}
            >
              frozen
            </text>
            <text
              x={W_X + W_W / 2}
              y={W_Y + W_H / 2 + 6}
              textAnchor="middle"
              fill={isActive("W") ? FROZEN_COLOR : "rgba(100,150,255,0.5)"}
              fontSize={16}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              W
            </text>
          </g>

          {/* A matrix (down-projection) */}
          <g>
            <rect
              x={A_X}
              y={A_Y}
              width={A_W}
              height={A_H}
              rx={6}
              fill={isActive("A") ? "rgba(74,222,128,0.12)" : TRAINABLE_FILL}
              stroke={isActive("A") ? "rgba(74,222,128,0.5)" : TRAINABLE_STROKE}
              strokeWidth={isActive("A") ? 2 : 1}
            />
            <text
              x={A_X + A_W / 2}
              y={A_Y + 16}
              textAnchor="middle"
              fill="rgba(74,222,128,0.4)"
              fontSize={7}
              fontFamily={FONT_MONO}
            >
              d -&gt; r
            </text>
            <text
              x={A_X + A_W / 2}
              y={A_Y + A_H / 2 + 8}
              textAnchor="middle"
              fill={isActive("A") ? ACCENT : "rgba(74,222,128,0.5)"}
              fontSize={16}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              A
            </text>
          </g>

          {/* B matrix (up-projection) */}
          <g>
            <rect
              x={B_X}
              y={B_Y}
              width={B_W}
              height={B_H}
              rx={6}
              fill={isActive("B") ? "rgba(74,222,128,0.12)" : TRAINABLE_FILL}
              stroke={isActive("B") ? "rgba(74,222,128,0.5)" : TRAINABLE_STROKE}
              strokeWidth={isActive("B") ? 2 : 1}
            />
            <text
              x={B_X + B_W / 2}
              y={B_Y + 16}
              textAnchor="middle"
              fill="rgba(74,222,128,0.4)"
              fontSize={7}
              fontFamily={FONT_MONO}
            >
              r -&gt; d
            </text>
            <text
              x={B_X + B_W / 2}
              y={B_Y + B_H / 2 + 8}
              textAnchor="middle"
              fill={isActive("B") ? ACCENT : "rgba(74,222,128,0.5)"}
              fontSize={16}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              B
            </text>
          </g>

          {/* Alpha/r scaling */}
          <g>
            <rect
              x={ALPHA_X}
              y={ALPHA_Y}
              width={ALPHA_W}
              height={ALPHA_H}
              rx={4}
              fill={isActive("alpha") ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.02)"}
              stroke={isActive("alpha") ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)"}
              strokeWidth={1}
            />
            <text
              x={ALPHA_X + ALPHA_W / 2}
              y={ALPHA_Y + ALPHA_H / 2 + 4}
              textAnchor="middle"
              fill={isActive("alpha") ? ACCENT : "rgba(255,255,255,0.4)"}
              fontSize={13}
              fontFamily={FONT_MONO}
            >
              a/r
            </text>
          </g>

          {/* Addition node */}
          <g>
            <circle
              cx={ADD_X}
              cy={ADD_Y}
              r={ADD_R}
              fill={isActive("add") ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.02)"}
              stroke={isActive("add") ? "rgba(250,204,21,0.5)" : "rgba(255,255,255,0.1)"}
              strokeWidth={isActive("add") ? 2 : 1}
            />
            <text
              x={ADD_X}
              y={ADD_Y + 5}
              textAnchor="middle"
              fill={isActive("add") ? "rgba(250,204,21,0.9)" : "rgba(255,255,255,0.4)"}
              fontSize={18}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              +
            </text>
          </g>

          {/* Output */}
          <g>
            <rect
              x={OUTPUT_X}
              y={OUTPUT_Y}
              width={OUTPUT_W}
              height={OUTPUT_H}
              rx={5}
              fill={isActive("output") ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.03)"}
              stroke={isActive("output") ? "rgba(250,204,21,0.5)" : "rgba(255,255,255,0.1)"}
              strokeWidth={isActive("output") ? 2 : 1}
            />
            <text
              x={OUTPUT_X + OUTPUT_W / 2}
              y={OUTPUT_Y + OUTPUT_H / 2 + 4}
              textAnchor="middle"
              fill={isActive("output") ? "rgba(250,204,21,0.9)" : "rgba(255,255,255,0.5)"}
              fontSize={13}
              fontFamily={FONT_MONO}
              fontWeight="bold"
            >
              h
            </text>
          </g>
        </svg>
      </div>

      {/* Step indicator */}
      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 13, color: ACCENT, fontWeight: "bold" }}>
            Step {step + 1}/{TOTAL_STEPS}: {currentStep.label}
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setStep(i); setIsPlaying(false); }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    i === step
                      ? ACCENT
                      : i < step
                        ? "rgba(74,222,128,0.3)"
                        : "rgba(255,255,255,0.1)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {currentStep.description}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 10,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: FROZEN_FILL,
              border: `1px solid ${FROZEN_STROKE}`,
            }}
          />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Frozen weights
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: TRAINABLE_FILL,
              border: `1px solid ${TRAINABLE_STROKE}`,
            }}
          />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Trainable (LoRA)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "rgba(250,204,21,0.2)",
              border: "1px solid rgba(250,204,21,0.4)",
            }}
          />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Data signal
          </span>
        </div>
      </div>
    </div>
  );
}
