"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const DECODER_ACCENT = "#60a5fa";
const BOTTLENECK_COLOR = "#f59e0b";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const NODE_BG = "hsl(240, 10%, 3.9%)";

const ENCODER_WORDS = ["I", "love", "you"] as const;
const DECODER_WORDS = ["Je", "t'aime", "<end>"] as const;

// SVG layout
const SVG_WIDTH = 750;
const SVG_HEIGHT = 300;

// Cell dimensions
const CELL_WIDTH = 50;
const CELL_HEIGHT = 40;
const WORD_BOX_WIDTH = 52;
const WORD_BOX_HEIGHT = 26;

// Context vector dimensions (larger to emphasize bottleneck)
const CTX_WIDTH = 60;
const CTX_HEIGHT = 48;

// Horizontal layout
const ENCODER_START_X = 55;
const ENCODER_SPACING = 80;
const CTX_CENTER_X = 375;
const DECODER_START_X = 495;
const DECODER_SPACING = 80;

// Vertical positions
const SECTION_LABEL_Y = 38;
const OUTPUT_WORD_Y = 60;
const CELL_Y = 120;
const INPUT_WORD_Y = 225;
const CTX_LABEL_Y = 250;

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

function encoderCellCenterX(index: number): number {
  return ENCODER_START_X + index * ENCODER_SPACING;
}

function decoderCellCenterX(index: number): number {
  return DECODER_START_X + index * DECODER_SPACING;
}

// ---------------------------------------------------------------------------
// Animation phases
//
// Phase 0-8:   Encoder (3 words x 3 sub-phases each: word highlight, cell activate, arrow glow)
// Phase 9-10:  Context vector pulse (2 beats)
// Phase 11-19: Decoder (3 words x 3 sub-phases each: cell activate, arrow glow, word appears)
// Phase 20:    Pause before reset
// ---------------------------------------------------------------------------

const ENCODER_PHASES = 9; // 3 words x 3 sub-phases
const CTX_PHASES = 2;
const DECODER_PHASES = 9; // 3 words x 3 sub-phases
const TOTAL_PHASES = ENCODER_PHASES + CTX_PHASES + DECODER_PHASES + 1;

const ENCODER_PHASE_START = 0;
const CTX_PHASE_START = ENCODER_PHASES;
const DECODER_PHASE_START = ENCODER_PHASES + CTX_PHASES;

// Timing per phase (ms)
const ENCODER_PHASE_DURATION = 333; // 3s / 9 phases
const CTX_PHASE_DURATION = 500; // 1s / 2 phases
const DECODER_PHASE_DURATION = 333; // 3s / 9 phases
const PAUSE_DURATION = 1500;

function phaseDuration(phase: number): number {
  if (phase < CTX_PHASE_START) return ENCODER_PHASE_DURATION;
  if (phase < DECODER_PHASE_START) return CTX_PHASE_DURATION;
  if (phase < DECODER_PHASE_START + DECODER_PHASES) return DECODER_PHASE_DURATION;
  return PAUSE_DURATION;
}

// ---------------------------------------------------------------------------
// Activation state queries
// ---------------------------------------------------------------------------

/** Encoder word at `index` is highlighted once its sub-phase 0 is reached */
function isEncoderWordActive(index: number, phase: number): boolean {
  return phase >= ENCODER_PHASE_START + index * 3;
}

/** Encoder cell at `index` is active once its sub-phase 1 is reached */
function isEncoderCellActive(index: number, phase: number): boolean {
  return phase >= ENCODER_PHASE_START + index * 3 + 1;
}

/** Hidden state arrow FROM encoder[index] to encoder[index+1] glows at sub-phase 2 */
function isEncoderArrowActive(index: number, phase: number): boolean {
  return phase >= ENCODER_PHASE_START + index * 3 + 2;
}

/** Context vector is active during its phases and all decoder phases */
function isContextActive(phase: number): boolean {
  return phase >= CTX_PHASE_START;
}

/** Context vector is in its "pulse" phase (the bottleneck moment) */
function isContextPulsing(phase: number): boolean {
  return phase >= CTX_PHASE_START && phase < DECODER_PHASE_START;
}

/** Arrow from last encoder cell to context vector */
function isEncoderToCtxArrowActive(phase: number): boolean {
  return phase >= ENCODER_PHASE_START + 2 * 3 + 2; // after 3rd encoder step completes
}

/** Arrow from context vector to first decoder cell */
function isCtxToDecoderArrowActive(phase: number): boolean {
  return phase >= DECODER_PHASE_START;
}

/** Decoder cell at `index` is active once its sub-phase 0 is reached */
function isDecoderCellActive(index: number, phase: number): boolean {
  return phase >= DECODER_PHASE_START + index * 3;
}

/** Hidden state arrow FROM decoder[index] to decoder[index+1] glows at sub-phase 1 */
function isDecoderArrowActive(index: number, phase: number): boolean {
  return phase >= DECODER_PHASE_START + index * 3 + 1;
}

/** Decoder output word at `index` appears at sub-phase 2 */
function isDecoderWordActive(index: number, phase: number): boolean {
  return phase >= DECODER_PHASE_START + index * 3 + 2;
}

/** The bottleneck label fades in during the context phase */
function bottleneckLabelOpacity(phase: number): number {
  if (phase < CTX_PHASE_START) return 0;
  if (phase < DECODER_PHASE_START) return 1;
  return 0.5;
}

// ---------------------------------------------------------------------------
// SVG Sub-components
// ---------------------------------------------------------------------------

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="s2s-arrowDim"
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
        id="s2s-arrowGreen"
        viewBox="0 0 6 6"
        refX={5}
        refY={3}
        markerWidth={5}
        markerHeight={5}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" fill={ACCENT} />
      </marker>
      <marker
        id="s2s-arrowBlue"
        viewBox="0 0 6 6"
        refX={5}
        refY={3}
        markerWidth={5}
        markerHeight={5}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" fill={DECODER_ACCENT} />
      </marker>
      <marker
        id="s2s-arrowAmber"
        viewBox="0 0 6 6"
        refX={5}
        refY={3}
        markerWidth={5}
        markerHeight={5}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" fill={BOTTLENECK_COLOR} />
      </marker>
      <filter id="s2s-glowGreen">
        <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor={ACCENT} floodOpacity={0.5} />
      </filter>
      <filter id="s2s-glowBlue">
        <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor={DECODER_ACCENT} floodOpacity={0.5} />
      </filter>
      <filter id="s2s-glowAmber">
        <feDropShadow dx={0} dy={0} stdDeviation={6} floodColor={BOTTLENECK_COLOR} floodOpacity={0.6} />
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

function WordBox({
  word,
  cx,
  cy,
  isActive,
  accentColor,
}: {
  word: string;
  cx: number;
  cy: number;
  isActive: boolean;
  accentColor: string;
}) {
  const x = cx - WORD_BOX_WIDTH / 2;
  const y = cy - WORD_BOX_HEIGHT / 2;
  const glowRgba =
    accentColor === ACCENT
      ? "rgba(74,222,128,0.4)"
      : accentColor === DECODER_ACCENT
        ? "rgba(96,165,250,0.4)"
        : "rgba(245,158,11,0.4)";

  return (
    <g>
      <rect x={x} y={y} width={WORD_BOX_WIDTH} height={WORD_BOX_HEIGHT} rx={6} fill={NODE_BG} />
      <rect
        x={x}
        y={y}
        width={WORD_BOX_WIDTH}
        height={WORD_BOX_HEIGHT}
        rx={6}
        fill={isActive ? `${accentColor}1f` : "rgba(255,255,255,0.03)"}
        stroke={isActive ? accentColor : "rgba(255,255,255,0.1)"}
        strokeWidth={isActive ? 1.5 : 1}
        style={{
          transition: "fill 0.4s ease, stroke 0.4s ease",
          filter: isActive ? `drop-shadow(0 0 6px ${glowRgba})` : "none",
        }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.55)"}
        fontSize={11}
        style={{ transition: "fill 0.4s ease", pointerEvents: "none" }}
      >
        {word}
      </text>
    </g>
  );
}

function RNNCell({
  cx,
  cy,
  isActive,
  accentColor,
}: {
  cx: number;
  cy: number;
  isActive: boolean;
  accentColor: string;
}) {
  const x = cx - CELL_WIDTH / 2;
  const y = cy - CELL_HEIGHT / 2;
  const glowRgba =
    accentColor === ACCENT ? "rgba(74,222,128,0.4)" : "rgba(96,165,250,0.4)";
  const filterName =
    accentColor === ACCENT ? "url(#s2s-glowGreen)" : "url(#s2s-glowBlue)";

  return (
    <g>
      <rect x={x} y={y} width={CELL_WIDTH} height={CELL_HEIGHT} rx={8} fill={NODE_BG} />
      <rect
        x={x}
        y={y}
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        rx={8}
        fill={isActive ? `${accentColor}1f` : "rgba(255,255,255,0.03)"}
        stroke={isActive ? accentColor : "rgba(255,255,255,0.12)"}
        strokeWidth={isActive ? 1.5 : 1}
        style={{
          transition: "fill 0.4s ease, stroke 0.4s ease",
          filter: isActive ? `drop-shadow(0 0 6px ${glowRgba})` : "none",
        }}
      />
      {isActive && (
        <rect
          x={x}
          y={y}
          width={CELL_WIDTH}
          height={CELL_HEIGHT}
          rx={8}
          fill="none"
          stroke={accentColor}
          strokeWidth={0}
          style={{ filter: filterName, opacity: 0.3 }}
        />
      )}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.45)"}
        fontSize={12}
        fontWeight={500}
        style={{ transition: "fill 0.4s ease", pointerEvents: "none" }}
      >
        RNN
      </text>
    </g>
  );
}

function HorizontalArrow({
  x1,
  x2,
  y,
  isActive,
  accentColor,
}: {
  x1: number;
  x2: number;
  y: number;
  isActive: boolean;
  accentColor: string;
}) {
  const markerId =
    accentColor === ACCENT
      ? "url(#s2s-arrowGreen)"
      : accentColor === DECODER_ACCENT
        ? "url(#s2s-arrowBlue)"
        : "url(#s2s-arrowAmber)";
  const glowRgba =
    accentColor === ACCENT
      ? "rgba(74,222,128,0.5)"
      : accentColor === DECODER_ACCENT
        ? "rgba(96,165,250,0.5)"
        : "rgba(245,158,11,0.5)";

  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={isActive ? accentColor : "rgba(255,255,255,0.12)"}
      strokeWidth={isActive ? 1.8 : 1.2}
      markerEnd={isActive ? markerId : "url(#s2s-arrowDim)"}
      style={{
        transition: "stroke 0.4s ease, stroke-width 0.4s ease",
        filter: isActive ? `drop-shadow(0 0 4px ${glowRgba})` : "none",
      }}
    />
  );
}

function VerticalArrow({
  cx,
  y1,
  y2,
  isActive,
  accentColor,
}: {
  cx: number;
  y1: number;
  y2: number;
  isActive: boolean;
  accentColor: string;
}) {
  const markerId =
    accentColor === ACCENT
      ? "url(#s2s-arrowGreen)"
      : accentColor === DECODER_ACCENT
        ? "url(#s2s-arrowBlue)"
        : "url(#s2s-arrowAmber)";

  return (
    <line
      x1={cx}
      y1={y1}
      x2={cx}
      y2={y2}
      stroke={isActive ? accentColor : "rgba(255,255,255,0.12)"}
      strokeWidth={isActive ? 1.5 : 1}
      markerEnd={isActive ? markerId : "url(#s2s-arrowDim)"}
      style={{ transition: "stroke 0.4s ease" }}
    />
  );
}

function HiddenStateLabel({
  cx,
  cy,
  label,
  isActive,
  accentColor,
}: {
  cx: number;
  cy: number;
  label: string;
  isActive: boolean;
  accentColor: string;
}) {
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fill={isActive ? accentColor : "rgba(255,255,255,0.5)"}
      fontSize={10}
      style={{ transition: "fill 0.4s ease, opacity 0.4s ease", pointerEvents: "none" }}
    >
      {label}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Context vector (the bottleneck)
// ---------------------------------------------------------------------------

function ContextVector({ isActive, isPulsing }: { isActive: boolean; isPulsing: boolean }) {
  const x = CTX_CENTER_X - CTX_WIDTH / 2;
  const y = CELL_Y - CTX_HEIGHT / 2;

  return (
    <g>
      {/* Outer glow ring when pulsing */}
      {isPulsing && (
        <rect
          x={x - 4}
          y={y - 4}
          width={CTX_WIDTH + 8}
          height={CTX_HEIGHT + 8}
          rx={12}
          fill="none"
          stroke={BOTTLENECK_COLOR}
          strokeWidth={2}
          opacity={0.3}
          style={{ filter: "url(#s2s-glowAmber)" }}
        >
          <animate
            attributeName="opacity"
            values="0.15;0.5;0.15"
            dur="1s"
            repeatCount="indefinite"
          />
        </rect>
      )}
      {/* Background */}
      <rect x={x} y={y} width={CTX_WIDTH} height={CTX_HEIGHT} rx={10} fill={NODE_BG} />
      {/* Main rect */}
      <rect
        x={x}
        y={y}
        width={CTX_WIDTH}
        height={CTX_HEIGHT}
        rx={10}
        fill={isActive ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)"}
        stroke={isActive ? BOTTLENECK_COLOR : "rgba(255,255,255,0.12)"}
        strokeWidth={isActive ? 2 : 1}
        style={{
          transition: "fill 0.4s ease, stroke 0.4s ease, stroke-width 0.4s ease",
          filter: isPulsing ? "url(#s2s-glowAmber)" : "none",
        }}
      />
      {/* Label */}
      <text
        x={CTX_CENTER_X}
        y={CELL_Y - 4}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.4)"}
        fontSize={8}
        fontWeight={600}
        letterSpacing={0.5}
        style={{ transition: "fill 0.4s ease", pointerEvents: "none" }}
      >
        context
      </text>
      <text
        x={CTX_CENTER_X}
        y={CELL_Y + 8}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isActive ? "#fff" : "rgba(255,255,255,0.4)"}
        fontSize={8}
        fontWeight={600}
        letterSpacing={0.5}
        style={{ transition: "fill 0.4s ease", pointerEvents: "none" }}
      >
        vector
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Section labels
// ---------------------------------------------------------------------------

function SectionLabel({ text, cx, cy }: { text: string; cx: number; cy: number }) {
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fill="rgba(255,255,255,0.5)"
      fontSize={11}
      fontWeight={600}
      letterSpacing={3}
      style={{ pointerEvents: "none" }}
    >
      {text}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Bottleneck annotation
// ---------------------------------------------------------------------------

function BottleneckLabel({ opacity }: { opacity: number }) {
  return (
    <text
      x={CTX_CENTER_X}
      y={CTX_LABEL_Y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={BOTTLENECK_COLOR}
      fontSize={8}
      fontStyle="italic"
      opacity={opacity}
      style={{ transition: "opacity 0.6s ease", pointerEvents: "none" }}
    >
      entire input meaning
    </text>
  );
}

function BottleneckLabelLine2({ opacity }: { opacity: number }) {
  return (
    <text
      x={CTX_CENTER_X}
      y={CTX_LABEL_Y + 12}
      textAnchor="middle"
      dominantBaseline="central"
      fill={BOTTLENECK_COLOR}
      fontSize={8}
      fontStyle="italic"
      opacity={opacity}
      style={{ transition: "opacity 0.6s ease", pointerEvents: "none" }}
    >
      compressed into one vector
    </text>
  );
}

// ---------------------------------------------------------------------------
// Subtle side accent borders
// ---------------------------------------------------------------------------

function SideAccent({
  x,
  y1,
  y2,
  color,
}: {
  x: number;
  y1: number;
  y2: number;
  color: string;
}) {
  return (
    <line
      x1={x}
      y1={y1}
      x2={x}
      y2={y2}
      stroke={color}
      strokeWidth={2}
      opacity={0.1}
    />
  );
}

// ---------------------------------------------------------------------------
// Thick bottleneck arrow (encoder -> context)
// ---------------------------------------------------------------------------

function BottleneckArrow({
  x1,
  x2,
  y,
  isActive,
}: {
  x1: number;
  x2: number;
  y: number;
  isActive: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={isActive ? BOTTLENECK_COLOR : "rgba(255,255,255,0.12)"}
      strokeWidth={isActive ? 2.5 : 1.5}
      markerEnd={isActive ? "url(#s2s-arrowAmber)" : "url(#s2s-arrowDim)"}
      style={{
        transition: "stroke 0.4s ease, stroke-width 0.4s ease",
        filter: isActive ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Seq2SeqDiagram() {
  const [phase, setPhase] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
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
        timerRef.current = setTimeout(advance, phaseDuration(currentPhase));
      } else {
        // All phases complete -- pause then reset and loop
        timerRef.current = setTimeout(() => {
          setPhase(-1);
          timerRef.current = setTimeout(playLoop, 400);
        }, PAUSE_DURATION);
      }
    };

    timerRef.current = setTimeout(advance, phaseDuration(0));
  }, []);

  useEffect(() => {
    playLoop();
    return clearTimer;
  }, [playLoop, clearTimer]);

  // --- Derived state ---

  const encoderCellY = CELL_Y;
  const decoderCellY = CELL_Y;

  // Encoder section center (for label)
  const encoderCenterX =
    (encoderCellCenterX(0) + encoderCellCenterX(2)) / 2;
  // Decoder section center (for label)
  const decoderCenterX =
    (decoderCellCenterX(0) + decoderCellCenterX(2)) / 2;

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[680px]"
          style={{ fontFamily: FONT_MONO }}
          preserveAspectRatio="xMidYMid meet"
        >
          <ArrowMarkers />

          {/* Subtle side accent borders */}
          <SideAccent
            x={encoderCellCenterX(0) - CELL_WIDTH / 2 - 16}
            y1={SECTION_LABEL_Y - 10}
            y2={INPUT_WORD_Y + WORD_BOX_HEIGHT / 2 + 10}
            color={ACCENT}
          />
          <SideAccent
            x={decoderCellCenterX(2) + CELL_WIDTH / 2 + 16}
            y1={SECTION_LABEL_Y - 10}
            y2={INPUT_WORD_Y + WORD_BOX_HEIGHT / 2 + 10}
            color={DECODER_ACCENT}
          />

          {/* Section labels */}
          <SectionLabel text="ENCODER" cx={encoderCenterX} cy={SECTION_LABEL_Y} />
          <SectionLabel text="DECODER" cx={decoderCenterX} cy={SECTION_LABEL_Y} />

          {/* ====== ENCODER ====== */}

          {/* Hidden state arrows between encoder cells (drawn first, behind cells) */}
          {[0, 1].map((i) => (
            <HorizontalArrow
              key={`enc-h-${i}`}
              x1={encoderCellCenterX(i) + CELL_WIDTH / 2 + 2}
              x2={encoderCellCenterX(i + 1) - CELL_WIDTH / 2 - 2}
              y={encoderCellY}
              isActive={isEncoderArrowActive(i, phase)}
              accentColor={ACCENT}
            />
          ))}

          {/* Hidden state labels between encoder cells */}
          {[0, 1].map((i) => {
            const midX = (encoderCellCenterX(i) + encoderCellCenterX(i + 1)) / 2;
            return (
              <HiddenStateLabel
                key={`enc-hl-${i}`}
                cx={midX}
                cy={encoderCellY - CELL_HEIGHT / 2 - 10}
                label={`h${toSubscript(i + 1)}`}
                isActive={isEncoderArrowActive(i, phase)}
                accentColor={ACCENT}
              />
            );
          })}

          {/* h3 label above last encoder cell */}
          <HiddenStateLabel
            cx={encoderCellCenterX(2) + CELL_WIDTH / 2 + 16}
            cy={encoderCellY - CELL_HEIGHT / 2 - 10}
            label={`h${toSubscript(3)}`}
            isActive={isEncoderToCtxArrowActive(phase)}
            accentColor={BOTTLENECK_COLOR}
          />

          {/* Input words and vertical arrows */}
          {ENCODER_WORDS.map((word, i) => {
            const cx = encoderCellCenterX(i);
            const wordActive = isEncoderWordActive(i, phase);
            return (
              <g key={`enc-input-${i}`}>
                <VerticalArrow
                  cx={cx}
                  y1={INPUT_WORD_Y - WORD_BOX_HEIGHT / 2 - 2}
                  y2={encoderCellY + CELL_HEIGHT / 2 + 2}
                  isActive={wordActive}
                  accentColor={ACCENT}
                />
                <WordBox
                  word={word}
                  cx={cx}
                  cy={INPUT_WORD_Y}
                  isActive={wordActive}
                  accentColor={ACCENT}
                />
              </g>
            );
          })}

          {/* Encoder RNN cells */}
          {ENCODER_WORDS.map((_, i) => (
            <RNNCell
              key={`enc-cell-${i}`}
              cx={encoderCellCenterX(i)}
              cy={encoderCellY}
              isActive={isEncoderCellActive(i, phase)}
              accentColor={ACCENT}
            />
          ))}

          {/* ====== BOTTLENECK ====== */}

          {/* Thick arrow: last encoder cell -> context vector */}
          <BottleneckArrow
            x1={encoderCellCenterX(2) + CELL_WIDTH / 2 + 2}
            x2={CTX_CENTER_X - CTX_WIDTH / 2 - 2}
            y={CELL_Y}
            isActive={isEncoderToCtxArrowActive(phase)}
          />

          {/* Thick arrow: context vector -> first decoder cell */}
          <BottleneckArrow
            x1={CTX_CENTER_X + CTX_WIDTH / 2 + 2}
            x2={decoderCellCenterX(0) - CELL_WIDTH / 2 - 2}
            y={CELL_Y}
            isActive={isCtxToDecoderArrowActive(phase)}
          />

          {/* Context vector node */}
          <ContextVector
            isActive={isContextActive(phase)}
            isPulsing={isContextPulsing(phase)}
          />

          {/* Bottleneck annotation */}
          <BottleneckLabel opacity={bottleneckLabelOpacity(phase)} />
          <BottleneckLabelLine2 opacity={bottleneckLabelOpacity(phase)} />

          {/* ====== DECODER ====== */}

          {/* Hidden state arrows between decoder cells (drawn first, behind cells) */}
          {[0, 1].map((i) => (
            <HorizontalArrow
              key={`dec-h-${i}`}
              x1={decoderCellCenterX(i) + CELL_WIDTH / 2 + 2}
              x2={decoderCellCenterX(i + 1) - CELL_WIDTH / 2 - 2}
              y={decoderCellY}
              isActive={isDecoderArrowActive(i, phase)}
              accentColor={DECODER_ACCENT}
            />
          ))}

          {/* Hidden state labels between decoder cells */}
          {[0, 1].map((i) => {
            const midX = (decoderCellCenterX(i) + decoderCellCenterX(i + 1)) / 2;
            return (
              <HiddenStateLabel
                key={`dec-hl-${i}`}
                cx={midX}
                cy={decoderCellY + CELL_HEIGHT / 2 + 14}
                label={`s${toSubscript(i + 1)}`}
                isActive={isDecoderArrowActive(i, phase)}
                accentColor={DECODER_ACCENT}
              />
            );
          })}

          {/* Output words and vertical arrows */}
          {DECODER_WORDS.map((word, i) => {
            const cx = decoderCellCenterX(i);
            const wordActive = isDecoderWordActive(i, phase);
            return (
              <g key={`dec-output-${i}`}>
                <VerticalArrow
                  cx={cx}
                  y1={decoderCellY - CELL_HEIGHT / 2 - 2}
                  y2={OUTPUT_WORD_Y + WORD_BOX_HEIGHT / 2 + 2}
                  isActive={wordActive}
                  accentColor={DECODER_ACCENT}
                />
                <WordBox
                  word={word}
                  cx={cx}
                  cy={OUTPUT_WORD_Y}
                  isActive={wordActive}
                  accentColor={DECODER_ACCENT}
                />
              </g>
            );
          })}

          {/* Decoder RNN cells */}
          {DECODER_WORDS.map((_, i) => (
            <RNNCell
              key={`dec-cell-${i}`}
              cx={decoderCellCenterX(i)}
              cy={decoderCellY}
              isActive={isDecoderCellActive(i, phase)}
              accentColor={DECODER_ACCENT}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
