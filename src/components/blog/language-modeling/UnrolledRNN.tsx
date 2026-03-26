"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const NODE_BG = "hsl(240, 10%, 3.9%)";

const WORDS = ["The", "cat", "sat", "on"] as const;
const STEP_COUNT = WORDS.length;

const STEP_DURATION_MS = 800;
const PAUSE_BEFORE_RESET_MS = 1500;

// SVG layout
const SVG_WIDTH = 700;
const SVG_HEIGHT = 280;

const CELL_WIDTH = 70;
const CELL_HEIGHT = 44;
const WORD_BOX_WIDTH = 56;
const WORD_BOX_HEIGHT = 28;
const STEP_SPACING = 160;
const FIRST_STEP_X = 50;

// Vertical positions (top to bottom: output arrow tip, cell, input arrow, word box)
const OUTPUT_ARROW_TIP_Y = 30;
const CELL_Y = 100;
const WORD_BOX_Y = 220;

// ---------------------------------------------------------------------------
// Unicode subscript helper
// ---------------------------------------------------------------------------

const SUBSCRIPT_DIGITS = "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089";

function toSubscript(n: number): string {
  return String(n)
    .split("")
    .map((ch) => SUBSCRIPT_DIGITS[parseInt(ch, 10)] ?? ch)
    .join("");
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function stepCenterX(stepIndex: number): number {
  return FIRST_STEP_X + stepIndex * STEP_SPACING + CELL_WIDTH / 2;
}

// ---------------------------------------------------------------------------
// Animation phase tracking
//
// Each time step progresses through three phases:
//   0 = word highlights
//   1 = RNN cell activates
//   2 = output arrow + hidden state arrow glow
//
// Total phases = STEP_COUNT * 3
// After all phases complete, we pause then reset.
// ---------------------------------------------------------------------------

const PHASES_PER_STEP = 3;
const TOTAL_PHASES = STEP_COUNT * PHASES_PER_STEP;

function activeStepIndex(phase: number): number {
  return Math.floor(phase / PHASES_PER_STEP);
}

function activePhaseWithinStep(phase: number): number {
  return phase % PHASES_PER_STEP;
}

// ---------------------------------------------------------------------------
// Determine element activation states
// ---------------------------------------------------------------------------

/** Whether the word box at `stepIndex` should be highlighted. */
function isWordActive(stepIndex: number, phase: number): boolean {
  if (phase < 0) return false;
  const currentStep = activeStepIndex(phase);
  const withinPhase = activePhaseWithinStep(phase);
  return stepIndex === currentStep && withinPhase >= 0;
}

/** Whether the RNN cell at `stepIndex` should be highlighted. */
function isCellActive(stepIndex: number, phase: number): boolean {
  if (phase < 0) return false;
  const currentStep = activeStepIndex(phase);
  const withinPhase = activePhaseWithinStep(phase);
  return stepIndex === currentStep && withinPhase >= 1;
}

/** Whether the output arrow at `stepIndex` should be highlighted. */
function isOutputArrowActive(stepIndex: number, phase: number): boolean {
  if (phase < 0) return false;
  const currentStep = activeStepIndex(phase);
  const withinPhase = activePhaseWithinStep(phase);
  return stepIndex === currentStep && withinPhase >= 2;
}

/** Whether the hidden state arrow FROM `stepIndex` to `stepIndex+1` should glow. */
function isHiddenArrowActive(stepIndex: number, phase: number): boolean {
  if (phase < 0) return false;
  const currentStep = activeStepIndex(phase);
  const withinPhase = activePhaseWithinStep(phase);
  return stepIndex === currentStep && withinPhase >= 2;
}

/**
 * Opacity for the hidden state label h_{stepIndex+1}.
 * Bright green when first produced, then fades as later states appear.
 */
function hiddenStateLabelOpacity(stepIndex: number, phase: number): number {
  if (phase < 0) return 0.15;

  const currentStep = activeStepIndex(phase);
  const withinPhase = activePhaseWithinStep(phase);

  // The label appears once its arrow activates (phase 2 of that step)
  const labelProducedAtPhase = stepIndex * PHASES_PER_STEP + 2;
  if (phase < labelProducedAtPhase) return 0.15;

  // If this is the step currently producing the label, bright green
  if (stepIndex === currentStep && withinPhase >= 2) return 1.0;

  // Fade proportionally to how many steps have passed since production
  const stepsSinceProduced = currentStep - stepIndex;
  const maxFadeSteps = STEP_COUNT - 1;
  const fadeAmount = stepsSinceProduced / maxFadeSteps;
  return Math.max(0.12, 1.0 - fadeAmount * 0.85);
}

/**
 * Whether the hidden state label should use accent color (just produced)
 * vs dim white (fading).
 */
function isHiddenStateLabelAccent(stepIndex: number, phase: number): boolean {
  if (phase < 0) return false;
  const currentStep = activeStepIndex(phase);
  const withinPhase = activePhaseWithinStep(phase);
  return stepIndex === currentStep && withinPhase >= 2;
}

// ---------------------------------------------------------------------------
// SVG Sub-components
// ---------------------------------------------------------------------------

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="arrowDim"
        viewBox="0 0 6 6"
        refX={5}
        refY={3}
        markerWidth={5}
        markerHeight={5}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(255,255,255,0.15)" />
      </marker>
      <marker
        id="arrowAccent"
        viewBox="0 0 6 6"
        refX={5}
        refY={3}
        markerWidth={5}
        markerHeight={5}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" fill={ACCENT} />
      </marker>
      <filter id="accentGlow">
        <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor={ACCENT} floodOpacity={0.5} />
      </filter>
    </defs>
  );
}

function WordBox({
  word,
  stepIndex,
  isActive,
}: {
  word: string;
  stepIndex: number;
  isActive: boolean;
}) {
  const cx = stepCenterX(stepIndex);
  const x = cx - WORD_BOX_WIDTH / 2;

  return (
    <g>
      {/* Solid background to hide any overlapping edges */}
      <rect
        x={x}
        y={WORD_BOX_Y}
        width={WORD_BOX_WIDTH}
        height={WORD_BOX_HEIGHT}
        rx={6}
        fill={NODE_BG}
      />
      <rect
        x={x}
        y={WORD_BOX_Y}
        width={WORD_BOX_WIDTH}
        height={WORD_BOX_HEIGHT}
        rx={6}
        fill={isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.03)"}
        stroke={isActive ? ACCENT : "rgba(255,255,255,0.1)"}
        strokeWidth={isActive ? 1.5 : 1}
        style={{
          transition: "fill 0.3s ease, stroke 0.3s ease",
          filter: isActive ? "drop-shadow(0 0 6px rgba(74,222,128,0.4))" : "none",
        }}
      />
      <text
        x={cx}
        y={WORD_BOX_Y + WORD_BOX_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.6)"}
        fontSize={12}
        style={{ transition: "fill 0.3s ease", pointerEvents: "none" }}
      >
        {word}
      </text>
    </g>
  );
}

function InputArrow({
  stepIndex,
  isActive,
}: {
  stepIndex: number;
  isActive: boolean;
}) {
  const cx = stepCenterX(stepIndex);
  const y1 = WORD_BOX_Y - 2;
  const y2 = CELL_Y + CELL_HEIGHT + 2;

  return (
    <line
      x1={cx}
      y1={y1}
      x2={cx}
      y2={y2}
      stroke={isActive ? ACCENT : "rgba(255,255,255,0.15)"}
      strokeWidth={1.2}
      markerEnd={isActive ? "url(#arrowAccent)" : "url(#arrowDim)"}
      style={{ transition: "stroke 0.3s ease" }}
    />
  );
}

function RNNCell({
  stepIndex,
  isActive,
}: {
  stepIndex: number;
  isActive: boolean;
}) {
  const cx = stepCenterX(stepIndex);
  const x = cx - CELL_WIDTH / 2;

  return (
    <g>
      {/* Solid background to hide edges behind the cell */}
      <rect
        x={x}
        y={CELL_Y}
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        rx={8}
        fill={NODE_BG}
      />
      <rect
        x={x}
        y={CELL_Y}
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        rx={8}
        fill={isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.03)"}
        stroke={isActive ? ACCENT : "rgba(255,255,255,0.15)"}
        strokeWidth={isActive ? 1.5 : 1}
        style={{
          transition: "fill 0.3s ease, stroke 0.3s ease",
          filter: isActive ? "drop-shadow(0 0 6px rgba(74,222,128,0.4))" : "none",
        }}
      />
      <text
        x={cx}
        y={CELL_Y + CELL_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.5)"}
        fontSize={13}
        fontWeight={500}
        style={{ transition: "fill 0.3s ease", pointerEvents: "none" }}
      >
        RNN
      </text>
    </g>
  );
}

function OutputArrow({
  stepIndex,
  isActive,
}: {
  stepIndex: number;
  isActive: boolean;
}) {
  const cx = stepCenterX(stepIndex);
  const y1 = CELL_Y - 2;
  const y2 = OUTPUT_ARROW_TIP_Y;

  return (
    <line
      x1={cx}
      y1={y1}
      x2={cx}
      y2={y2}
      stroke={isActive ? ACCENT : "rgba(255,255,255,0.15)"}
      strokeWidth={1.2}
      markerEnd={isActive ? "url(#arrowAccent)" : "url(#arrowDim)"}
      style={{ transition: "stroke 0.3s ease" }}
    />
  );
}

function HiddenStateArrow({
  stepIndex,
  isActive,
}: {
  stepIndex: number;
  isActive: boolean;
}) {
  // Horizontal arrow from cell[stepIndex] to cell[stepIndex+1]
  const x1 = stepCenterX(stepIndex) + CELL_WIDTH / 2 + 2;
  const x2 = stepCenterX(stepIndex + 1) - CELL_WIDTH / 2 - 2;
  const y = CELL_Y + CELL_HEIGHT / 2;

  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={isActive ? ACCENT : "rgba(255,255,255,0.15)"}
      strokeWidth={isActive ? 1.5 : 1.2}
      markerEnd={isActive ? "url(#arrowAccent)" : "url(#arrowDim)"}
      style={{
        transition: "stroke 0.3s ease",
        filter: isActive ? "drop-shadow(0 0 4px rgba(74,222,128,0.5))" : "none",
      }}
    />
  );
}

function HiddenStateLabel({
  stepIndex,
  opacity,
  useAccentColor,
}: {
  stepIndex: number;
  opacity: number;
  useAccentColor: boolean;
}) {
  // Position the label above the horizontal arrow between cells.
  // For the last step, position it above the output area since there is no
  // next cell to draw an arrow to.
  const isLastStep = stepIndex === STEP_COUNT - 1;
  const labelX = isLastStep
    ? stepCenterX(stepIndex) + CELL_WIDTH / 2 + 20
    : (stepCenterX(stepIndex) + stepCenterX(stepIndex + 1)) / 2;
  const labelY = CELL_Y + CELL_HEIGHT / 2 - 18;

  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor="middle"
      dominantBaseline="central"
      fill={useAccentColor ? ACCENT : "rgba(255,255,255,0.5)"}
      fontSize={11}
      style={{
        transition: "fill 0.3s ease, opacity 0.3s ease",
        opacity,
        pointerEvents: "none",
      }}
    >
      h{toSubscript(stepIndex + 1)}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Time step labels (t=0, t=1, ...) at the very bottom
// ---------------------------------------------------------------------------

function TimeStepLabels() {
  return (
    <>
      {WORDS.map((_, i) => (
        <text
          key={`t-${i}`}
          x={stepCenterX(i)}
          y={WORD_BOX_Y + WORD_BOX_HEIGHT + 18}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={10}
        >
          t={i}
        </text>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UnrolledRNN() {
  const [phase, setPhase] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playLoop = useCallback(() => {
    let currentPhase = 0;
    setPhase(currentPhase);

    const advance = () => {
      currentPhase++;
      if (currentPhase < TOTAL_PHASES) {
        setPhase(currentPhase);
        // Faster transitions within a step (phases 1,2), slower at step boundaries (phase 0)
        const withinStep = currentPhase % PHASES_PER_STEP;
        const delay = withinStep === 0 ? STEP_DURATION_MS : STEP_DURATION_MS * 0.4;
        timerRef.current = setTimeout(advance, delay);
      } else {
        // All steps complete -- pause then reset
        timerRef.current = setTimeout(() => {
          setPhase(-1);
          timerRef.current = setTimeout(playLoop, 400);
        }, PAUSE_BEFORE_RESET_MS);
      }
    };

    timerRef.current = setTimeout(advance, STEP_DURATION_MS * 0.4);
  }, []);

  useEffect(() => {
    playLoop();
    return clearTimers;
  }, [playLoop, clearTimers]);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[700px]"
          style={{ fontFamily: FONT_MONO }}
          preserveAspectRatio="xMidYMid meet"
        >
          <ArrowMarkers />

          {/* Hidden state arrows between cells (drawn first so cells sit on top) */}
          {WORDS.slice(0, -1).map((_, i) => (
            <HiddenStateArrow
              key={`h-arrow-${i}`}
              stepIndex={i}
              isActive={isHiddenArrowActive(i, phase)}
            />
          ))}

          {/* Hidden state labels above the connecting arrows */}
          {WORDS.map((_, i) => (
            <HiddenStateLabel
              key={`h-label-${i}`}
              stepIndex={i}
              opacity={hiddenStateLabelOpacity(i, phase)}
              useAccentColor={isHiddenStateLabelAccent(i, phase)}
            />
          ))}

          {/* Each time step column */}
          {WORDS.map((word, i) => (
            <g key={`step-${i}`}>
              {/* Output arrow (cell -> top) */}
              <OutputArrow
                stepIndex={i}
                isActive={isOutputArrowActive(i, phase)}
              />

              {/* RNN cell */}
              <RNNCell stepIndex={i} isActive={isCellActive(i, phase)} />

              {/* Input arrow (word -> cell) */}
              <InputArrow
                stepIndex={i}
                isActive={isWordActive(i, phase)}
              />

              {/* Word box */}
              <WordBox
                word={word}
                stepIndex={i}
                isActive={isWordActive(i, phase)}
              />
            </g>
          ))}

          {/* Time step labels */}
          <TimeStepLabels />
        </svg>
      </div>
    </div>
  );
}
