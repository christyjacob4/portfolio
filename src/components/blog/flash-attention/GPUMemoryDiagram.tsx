"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const NODE_BG = "hsl(240, 10%, 3.9%)";

// HBM colors
const HBM_FILL = "rgba(100,150,255,0.06)";
const HBM_STROKE = "rgba(100,150,255,0.2)";
const HBM_TEXT = "rgba(100,150,255,0.7)";

// SRAM colors
const SRAM_FILL = "rgba(74,222,128,0.06)";
const SRAM_STROKE = "rgba(74,222,128,0.2)";
const SRAM_TEXT = "rgba(74,222,128,0.7)";

// Data block colors
const BLOCK_DEFAULT = "rgba(100,150,255,0.25)";
const BLOCK_LARGE = "rgba(239,68,68,0.3)";
const BLOCK_SMALL_TILE = "rgba(74,222,128,0.25)";
const BLOCK_OUTPUT = "rgba(74,222,128,0.35)";

// Layout
const SVG_WIDTH = 650;
const SVG_HEIGHT = 350;

const HBM_X = 30;
const HBM_Y = 40;
const HBM_WIDTH = 180;
const HBM_HEIGHT = 260;

const SRAM_X = 440;
const SRAM_Y = 90;
const SRAM_WIDTH = 110;
const SRAM_HEIGHT = 65;

const COMPUTE_Y = 200;
const COMPUTE_CORE_SIZE = 18;
const COMPUTE_CORE_GAP = 6;
const COMPUTE_CORE_COUNT = 4;

const PIPE_X1 = HBM_X + HBM_WIDTH;
const PIPE_X2 = SRAM_X;
const PIPE_Y = 150;
const PIPE_HEIGHT = 24;

// Animation timing
const NAIVE_STEP_SLOW = 1200;
const NAIVE_STEP_FAST = 300;
const NAIVE_PAUSE = 1000;

const FLASH_STEP_MOVE = 500;
const FLASH_STEP_COMPUTE = 200;
const FLASH_PAUSE = 800;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Mode = "naive" | "flash";

interface DataBlock {
  label: string;
  width: number;
  height: number;
  fill: string;
  x: number;
  y: number;
  opacity: number;
}

interface AnimationFrame {
  blocks: DataBlock[];
  computeActive: boolean;
  statusText: string;
  statusColor: string;
  annotation?: string;
  pipeFill: string;
}

// ---------------------------------------------------------------------------
// Animation frame builders
// ---------------------------------------------------------------------------

function buildNaiveFrames(): { frame: AnimationFrame; durationMs: number }[] {
  const hbmCenterX = HBM_X + HBM_WIDTH / 2;
  const sramCenterX = SRAM_X + SRAM_WIDTH / 2;
  const pipeCenter = (PIPE_X1 + PIPE_X2) / 2;
  const pipeFill = "rgba(100,150,255,0.08)";

  const blockInHBM = (label: string, w: number, h: number, fill: string): DataBlock => ({
    label, width: w, height: h, fill,
    x: hbmCenterX - w / 2, y: HBM_Y + HBM_HEIGHT / 2 - h / 2, opacity: 1,
  });

  const blockInPipe = (label: string, w: number, h: number, fill: string): DataBlock => ({
    label, width: w, height: h, fill,
    x: pipeCenter - w / 2, y: PIPE_Y + PIPE_HEIGHT / 2 - h / 2, opacity: 0.85,
  });

  const blockInSRAM = (label: string, w: number, h: number, fill: string): DataBlock => ({
    label, width: w, height: h, fill,
    x: sramCenterX - w / 2, y: SRAM_Y + SRAM_HEIGHT / 2 - h / 2, opacity: 1,
  });

  // Step 1: Q,K sitting in HBM, about to move
  const step1Idle: AnimationFrame = {
    blocks: [blockInHBM("Q, K", 70, 30, BLOCK_DEFAULT)],
    computeActive: false,
    statusText: "loading Q, K...",
    statusColor: "rgba(255,255,255,0.4)",
    pipeFill,
  };

  // Step 2: Q,K in pipe, moving to SRAM
  const step2Transit: AnimationFrame = {
    blocks: [blockInPipe("Q, K", 70, 30, BLOCK_DEFAULT)],
    computeActive: false,
    statusText: "transferring...",
    statusColor: "rgba(255,200,100,0.7)",
    pipeFill,
  };

  // Step 3: Q,K arrived in SRAM, compute flash
  const step3Compute: AnimationFrame = {
    blocks: [blockInSRAM("Q, K", 60, 24, BLOCK_DEFAULT)],
    computeActive: true,
    statusText: "compute S = QKT",
    statusColor: ACCENT,
    pipeFill,
  };

  // Step 4: HUGE N*N scores block in SRAM, about to go to HBM
  const step4ScoresReady: AnimationFrame = {
    blocks: [blockInSRAM("N\u00D7N", 90, 50, BLOCK_LARGE)],
    computeActive: false,
    statusText: "bottleneck!",
    statusColor: "rgba(239,68,68,0.9)",
    pipeFill,
  };

  // Step 5: Huge block transiting to HBM
  const step5ScoresTransit: AnimationFrame = {
    blocks: [blockInPipe("N\u00D7N scores", 110, 50, BLOCK_LARGE)],
    computeActive: false,
    statusText: "bottleneck!",
    statusColor: "rgba(239,68,68,0.9)",
    pipeFill,
  };

  // Step 6: Huge block stored in HBM
  const step6ScoresInHBM: AnimationFrame = {
    blocks: [blockInHBM("N\u00D7N scores", 110, 55, BLOCK_LARGE)],
    computeActive: false,
    statusText: "bottleneck!",
    statusColor: "rgba(239,68,68,0.9)",
    pipeFill,
  };

  // Step 7: Scores moving BACK to SRAM for softmax
  const step7ScoresBack: AnimationFrame = {
    blocks: [blockInPipe("N\u00D7N scores", 110, 50, BLOCK_LARGE)],
    computeActive: false,
    statusText: "bottleneck!",
    statusColor: "rgba(239,68,68,0.9)",
    pipeFill,
  };

  // Step 8: Softmax compute
  const step8Softmax: AnimationFrame = {
    blocks: [blockInSRAM("softmax", 60, 24, BLOCK_DEFAULT)],
    computeActive: true,
    statusText: "compute softmax",
    statusColor: ACCENT,
    pipeFill,
  };

  return [
    { frame: step1Idle, durationMs: NAIVE_STEP_SLOW },
    { frame: step2Transit, durationMs: NAIVE_STEP_SLOW },
    { frame: step3Compute, durationMs: NAIVE_STEP_FAST },
    { frame: step4ScoresReady, durationMs: NAIVE_STEP_SLOW * 0.5 },
    { frame: step5ScoresTransit, durationMs: NAIVE_STEP_SLOW * 1.2 },
    { frame: step6ScoresInHBM, durationMs: NAIVE_STEP_SLOW },
    { frame: step7ScoresBack, durationMs: NAIVE_STEP_SLOW * 1.2 },
    { frame: step8Softmax, durationMs: NAIVE_STEP_FAST },
    { frame: step1Idle, durationMs: NAIVE_PAUSE },
  ];
}

function buildFlashFrames(): { frame: AnimationFrame; durationMs: number }[] {
  const hbmCenterX = HBM_X + HBM_WIDTH / 2;
  const sramCenterX = SRAM_X + SRAM_WIDTH / 2;
  const pipeCenter = (PIPE_X1 + PIPE_X2) / 2;
  const pipeFill = "rgba(74,222,128,0.06)";

  const tileInHBM = (label: string): DataBlock => ({
    label, width: 50, height: 20, fill: BLOCK_SMALL_TILE,
    x: hbmCenterX - 25, y: HBM_Y + HBM_HEIGHT / 2 - 10, opacity: 1,
  });

  const tileInPipe = (label: string): DataBlock => ({
    label, width: 50, height: 20, fill: BLOCK_SMALL_TILE,
    x: pipeCenter - 25, y: PIPE_Y + PIPE_HEIGHT / 2 - 10, opacity: 0.85,
  });

  const tileInSRAM = (label: string): DataBlock => ({
    label, width: 44, height: 18, fill: BLOCK_SMALL_TILE,
    x: sramCenterX - 22, y: SRAM_Y + SRAM_HEIGHT / 2 - 9, opacity: 1,
  });

  const outputInPipe = (): DataBlock => ({
    label: "out", width: 40, height: 16, fill: BLOCK_OUTPUT,
    x: pipeCenter - 20, y: PIPE_Y + PIPE_HEIGHT / 2 - 8, opacity: 0.9,
  });

  const outputInHBM = (): DataBlock => ({
    label: "output", width: 50, height: 20, fill: BLOCK_OUTPUT,
    x: hbmCenterX - 25, y: HBM_Y + HBM_HEIGHT / 2 - 10, opacity: 1,
  });

  // Tile 1
  const tile1Load: AnimationFrame = {
    blocks: [tileInHBM("tile 1")],
    computeActive: false,
    statusText: "streaming",
    statusColor: ACCENT,
    pipeFill,
    annotation: "small tiles, fast transfer",
  };

  const tile1Transit: AnimationFrame = {
    blocks: [tileInPipe("tile 1")],
    computeActive: false,
    statusText: "streaming",
    statusColor: ACCENT,
    pipeFill,
  };

  const tile1Compute: AnimationFrame = {
    blocks: [tileInSRAM("tile 1")],
    computeActive: true,
    statusText: "fused compute",
    statusColor: ACCENT,
    pipeFill,
    annotation: "QKT + softmax + V in SRAM",
  };

  // Tile 2
  const tile2Transit: AnimationFrame = {
    blocks: [tileInPipe("tile 2")],
    computeActive: false,
    statusText: "streaming",
    statusColor: ACCENT,
    pipeFill,
  };

  const tile2Compute: AnimationFrame = {
    blocks: [tileInSRAM("tile 2")],
    computeActive: true,
    statusText: "fused compute",
    statusColor: ACCENT,
    pipeFill,
  };

  // Tile 3
  const tile3Transit: AnimationFrame = {
    blocks: [tileInPipe("tile 3")],
    computeActive: false,
    statusText: "streaming",
    statusColor: ACCENT,
    pipeFill,
  };

  const tile3Compute: AnimationFrame = {
    blocks: [tileInSRAM("tile 3")],
    computeActive: true,
    statusText: "fused compute",
    statusColor: ACCENT,
    pipeFill,
    annotation: "no N\u00D7N matrix ever leaves SRAM",
  };

  // Output back to HBM
  const outputTransit: AnimationFrame = {
    blocks: [outputInPipe()],
    computeActive: false,
    statusText: "streaming",
    statusColor: ACCENT,
    pipeFill,
    annotation: "only small output goes back",
  };

  const outputDone: AnimationFrame = {
    blocks: [outputInHBM()],
    computeActive: false,
    statusText: "done",
    statusColor: ACCENT,
    pipeFill,
  };

  return [
    { frame: tile1Load, durationMs: FLASH_STEP_MOVE },
    { frame: tile1Transit, durationMs: FLASH_STEP_MOVE },
    { frame: tile1Compute, durationMs: FLASH_STEP_COMPUTE },
    { frame: tile2Transit, durationMs: FLASH_STEP_MOVE },
    { frame: tile2Compute, durationMs: FLASH_STEP_COMPUTE },
    { frame: tile3Transit, durationMs: FLASH_STEP_MOVE },
    { frame: tile3Compute, durationMs: FLASH_STEP_COMPUTE },
    { frame: outputTransit, durationMs: FLASH_STEP_MOVE },
    { frame: outputDone, durationMs: FLASH_PAUSE },
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ModeToggle({
  mode,
  onToggle,
}: {
  mode: Mode;
  onToggle: (mode: Mode) => void;
}) {
  return (
    <div className="mb-3 flex justify-center">
      <div className="inline-flex overflow-hidden rounded-md border border-white/10">
        <button
          onClick={() => onToggle("naive")}
          className="px-3 py-1.5 text-[11px] transition-colors duration-150"
          style={{
            fontFamily: FONT_MONO,
            color: mode === "naive" ? "#fff" : "rgba(255,255,255,0.5)",
            backgroundColor:
              mode === "naive" ? "rgba(74,222,128,0.15)" : "transparent",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            borderBottom:
              mode === "naive"
                ? `2px solid ${ACCENT}`
                : "2px solid transparent",
          }}
        >
          Naive Attention
        </button>
        <button
          onClick={() => onToggle("flash")}
          className="px-3 py-1.5 text-[11px] transition-colors duration-150"
          style={{
            fontFamily: FONT_MONO,
            color: mode === "flash" ? "#fff" : "rgba(255,255,255,0.5)",
            backgroundColor:
              mode === "flash" ? "rgba(74,222,128,0.15)" : "transparent",
            borderBottom:
              mode === "flash"
                ? `2px solid ${ACCENT}`
                : "2px solid transparent",
          }}
        >
          Flash Attention
        </button>
      </div>
    </div>
  );
}

function HBMBox() {
  return (
    <g>
      <rect
        x={HBM_X}
        y={HBM_Y}
        width={HBM_WIDTH}
        height={HBM_HEIGHT}
        rx={12}
        fill={HBM_FILL}
        stroke={HBM_STROKE}
        strokeWidth={1.5}
      />
      <text
        x={HBM_X + HBM_WIDTH / 2}
        y={HBM_Y + 20}
        textAnchor="middle"
        fill={HBM_TEXT}
        fontSize={13}
        fontFamily={FONT_MONO}
        fontWeight={700}
      >
        HBM
      </text>
      <text
        x={HBM_X + HBM_WIDTH / 2}
        y={HBM_Y + 36}
        textAnchor="middle"
        fill="rgba(100,150,255,0.35)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        80 GB — slow
      </text>
    </g>
  );
}

function SRAMBox() {
  return (
    <g>
      <rect
        x={SRAM_X}
        y={SRAM_Y}
        width={SRAM_WIDTH}
        height={SRAM_HEIGHT}
        rx={8}
        fill={SRAM_FILL}
        stroke={SRAM_STROKE}
        strokeWidth={1.5}
      />
      <text
        x={SRAM_X + SRAM_WIDTH / 2}
        y={SRAM_Y + 22}
        textAnchor="middle"
        fill={SRAM_TEXT}
        fontSize={12}
        fontFamily={FONT_MONO}
        fontWeight={700}
      >
        SRAM
      </text>
      <text
        x={SRAM_X + SRAM_WIDTH / 2}
        y={SRAM_Y + 38}
        textAnchor="middle"
        fill="rgba(74,222,128,0.35)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        20 MB — fast
      </text>
    </g>
  );
}

function ComputeCores({ isActive }: { isActive: boolean }) {
  const totalWidth =
    COMPUTE_CORE_COUNT * COMPUTE_CORE_SIZE +
    (COMPUTE_CORE_COUNT - 1) * COMPUTE_CORE_GAP;
  const startX = SRAM_X + SRAM_WIDTH / 2 - totalWidth / 2;

  return (
    <g>
      <text
        x={SRAM_X + SRAM_WIDTH / 2}
        y={COMPUTE_Y - 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        compute cores
      </text>
      {Array.from({ length: COMPUTE_CORE_COUNT }, (_, i) => {
        const cx = startX + i * (COMPUTE_CORE_SIZE + COMPUTE_CORE_GAP);
        return (
          <rect
            key={i}
            x={cx}
            y={COMPUTE_Y}
            width={COMPUTE_CORE_SIZE}
            height={COMPUTE_CORE_SIZE}
            rx={3}
            fill={isActive ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.04)"}
            stroke={isActive ? ACCENT : "rgba(255,255,255,0.1)"}
            strokeWidth={1}
            style={{
              transition: "fill 0.15s ease, stroke 0.15s ease",
              filter: isActive
                ? "drop-shadow(0 0 4px rgba(74,222,128,0.5))"
                : "none",
            }}
          />
        );
      })}
    </g>
  );
}

function ConnectionPipe({ fill }: { fill: string }) {
  return (
    <g>
      {/* Pipe body */}
      <rect
        x={PIPE_X1}
        y={PIPE_Y}
        width={PIPE_X2 - PIPE_X1}
        height={PIPE_HEIGHT}
        rx={4}
        fill={fill}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
      {/* Animated dashes along the pipe */}
      <line
        x1={PIPE_X1 + 8}
        y1={PIPE_Y + PIPE_HEIGHT / 2}
        x2={PIPE_X2 - 8}
        y2={PIPE_Y + PIPE_HEIGHT / 2}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        strokeDasharray="6 8"
        style={{ animation: "pipeDash 1.5s linear infinite" }}
      />
      {/* Pipe label */}
      <text
        x={(PIPE_X1 + PIPE_X2) / 2}
        y={PIPE_Y - 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={8}
        fontFamily={FONT_MONO}
      >
        data bus
      </text>
    </g>
  );
}

function DataBlockElement({ block }: { block: DataBlock }) {
  return (
    <g
      style={{
        transition: "transform 0.4s ease, opacity 0.3s ease",
        opacity: block.opacity,
      }}
    >
      <rect
        x={block.x}
        y={block.y}
        width={block.width}
        height={block.height}
        rx={5}
        fill={block.fill}
        stroke={
          block.fill === BLOCK_LARGE
            ? "rgba(239,68,68,0.5)"
            : "rgba(255,255,255,0.15)"
        }
        strokeWidth={1}
        style={{ transition: "all 0.4s ease" }}
      />
      <text
        x={block.x + block.width / 2}
        y={block.y + block.height / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={
          block.fill === BLOCK_LARGE
            ? "rgba(239,68,68,0.9)"
            : "rgba(255,255,255,0.8)"
        }
        fontSize={block.width > 80 ? 10 : 9}
        fontFamily={FONT_MONO}
        fontWeight={600}
      >
        {block.label}
      </text>
    </g>
  );
}

function StatusIndicator({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  const isBottleneck = text === "bottleneck!";
  return (
    <g>
      {/* Status dot */}
      <circle
        cx={HBM_X + HBM_WIDTH / 2 - 50}
        cy={HBM_Y + HBM_HEIGHT + 28}
        r={4}
        fill={color}
        style={{
          animation: isBottleneck ? "statusPulse 0.6s ease-in-out infinite" : "none",
        }}
      />
      <text
        x={HBM_X + HBM_WIDTH / 2 - 40}
        y={HBM_Y + HBM_HEIGHT + 32}
        fill={color}
        fontSize={10}
        fontFamily={FONT_MONO}
        fontWeight={600}
        style={{
          animation: isBottleneck ? "statusPulse 0.6s ease-in-out infinite" : "none",
        }}
      >
        {text}
      </text>
    </g>
  );
}

function AnnotationText({ text }: { text: string }) {
  return (
    <text
      x={SVG_WIDTH / 2}
      y={SVG_HEIGHT - 14}
      textAnchor="middle"
      fill="rgba(255,255,255,0.4)"
      fontSize={9}
      fontFamily={FONT_MONO}
      style={{ transition: "opacity 0.3s ease" }}
    >
      {text}
    </text>
  );
}

function GPUOutline() {
  return (
    <g>
      {/* GPU outline around SRAM + compute */}
      <rect
        x={SRAM_X - 24}
        y={SRAM_Y - 30}
        width={SRAM_WIDTH + 48}
        height={COMPUTE_Y + COMPUTE_CORE_SIZE - SRAM_Y + 54}
        rx={10}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text
        x={SRAM_X + SRAM_WIDTH / 2}
        y={SRAM_Y - 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.18)"
        fontSize={9}
        fontFamily={FONT_MONO}
      >
        GPU chip
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Keyframe CSS (injected once)
// ---------------------------------------------------------------------------

function AnimationStyles() {
  return (
    <style>{`
      @keyframes pipeDash {
        0% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -28; }
      }
      @keyframes statusPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GPUMemoryDiagram() {
  const [mode, setMode] = useState<Mode>("naive");
  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<{ frame: AnimationFrame; durationMs: number }[]>([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Animation loop: rebuilds frames and restarts when mode changes
  useEffect(() => {
    framesRef.current =
      mode === "naive" ? buildNaiveFrames() : buildFlashFrames();

    let currentIndex = 0;
    setFrameIndex(0);

    const advance = () => {
      const frames = framesRef.current;
      if (frames.length === 0) return;

      currentIndex = (currentIndex + 1) % frames.length;
      setFrameIndex(currentIndex);

      timerRef.current = setTimeout(advance, frames[currentIndex].durationMs);
    };

    const frames = framesRef.current;
    if (frames.length > 0) {
      timerRef.current = setTimeout(advance, frames[0].durationMs);
    }

    return clearTimer;
  }, [mode, clearTimer]);

  function handleModeToggle(newMode: Mode) {
    clearTimer();
    setMode(newMode);
  }

  const frames = mode === "naive" ? buildNaiveFrames() : buildFlashFrames();
  const currentFrame = frames[frameIndex]?.frame ?? frames[0].frame;

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="mx-auto max-w-[600px]">
        <ModeToggle mode={mode} onToggle={handleModeToggle} />

        <div className="flex justify-center overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ fontFamily: FONT_MONO }}
          >
            <AnimationStyles />

            {/* Background fill for the entire GPU area */}
            <rect
              x={0}
              y={0}
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              rx={12}
              fill={NODE_BG}
            />

            {/* Static architecture */}
            <HBMBox />
            <GPUOutline />
            <ConnectionPipe fill={currentFrame.pipeFill} />
            <SRAMBox />
            <ComputeCores isActive={currentFrame.computeActive} />

            {/* Animated data blocks */}
            {currentFrame.blocks.map((block, i) => (
              <DataBlockElement key={`${block.label}-${i}`} block={block} />
            ))}

            {/* Status indicator */}
            <StatusIndicator
              text={currentFrame.statusText}
              color={currentFrame.statusColor}
            />

            {/* Annotation */}
            {currentFrame.annotation && (
              <AnnotationText text={currentFrame.annotation} />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
