"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const LAYER_COUNT = 6;
const LAYER_LABELS = Array.from({ length: LAYER_COUNT }, (_, i) => `Layer ${i + 1}`);

const GRADIENT_FACTOR_MIN = 0.1;
const GRADIENT_FACTOR_MAX = 0.9;
const GRADIENT_FACTOR_STEP = 0.1;
const GRADIENT_FACTOR_DEFAULT = 0.5;

// Animation timing
const STEP_DURATION_MS = 600;
const PAUSE_BEFORE_RESET_MS = 1800;

// SVG layout
const LAYER_WIDTH = 80;
const LAYER_HEIGHT = 40;
const LAYER_GAP = 24;
const SVG_PADDING_X = 16;
const SVG_PADDING_Y = 20;
const SIGNAL_RADIUS = 5;

// Bar chart
const BAR_MAX_HEIGHT = 80;
const BAR_WIDTH = 40;

// ---------------------------------------------------------------------------
// Gradient computation
// ---------------------------------------------------------------------------

function computeGradients(
  factor: number,
  hasResidual: boolean,
): number[] {
  // Gradients flow backward: the last layer receives gradient = 1.0,
  // and each earlier layer multiplies by factor (plus a skip of 1.0 if residual).
  const gradients = new Array(LAYER_COUNT).fill(0);
  gradients[LAYER_COUNT - 1] = 1.0;

  for (let i = LAYER_COUNT - 2; i >= 0; i--) {
    if (hasResidual) {
      // The residual skip connection preserves the gradient from the layer ahead,
      // while the main path multiplies by factor.
      gradients[i] = factor * gradients[i + 1] + gradients[i + 1];
    } else {
      gradients[i] = factor * gradients[i + 1];
    }
  }

  // Normalize relative to the maximum so bars fit in the chart
  const maxGradient = Math.max(...gradients);
  if (maxGradient > 0) {
    return gradients.map((g) => g / maxGradient);
  }
  return gradients;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function layerCenterX(index: number): number {
  return SVG_PADDING_X + index * (LAYER_WIDTH + LAYER_GAP) + LAYER_WIDTH / 2;
}

function layerLeftX(index: number): number {
  return SVG_PADDING_X + index * (LAYER_WIDTH + LAYER_GAP);
}

function layerCenterY(): number {
  return SVG_PADDING_Y + LAYER_HEIGHT / 2;
}

function gradientBarColor(normalizedMagnitude: number): string {
  // Tall bars are bright white, short bars are dim with a reddish tint
  if (normalizedMagnitude > 0.5) {
    const opacity = 0.5 + normalizedMagnitude * 0.5;
    return `rgba(255, 255, 255, ${opacity.toFixed(2)})`;
  }
  const red = Math.round(180 + normalizedMagnitude * 75);
  const green = Math.round(normalizedMagnitude * 180);
  const blue = Math.round(normalizedMagnitude * 150);
  const opacity = 0.4 + normalizedMagnitude * 0.6;
  return `rgba(${red}, ${green}, ${blue}, ${opacity.toFixed(2)})`;
}

// ---------------------------------------------------------------------------
// Slider with accent-colored thumb
// ---------------------------------------------------------------------------

const SLIDER_CLASSES = `h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10
  [&::-webkit-slider-thumb]:h-3.5
  [&::-webkit-slider-thumb]:w-3.5
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-[#4ade80]
  [&::-webkit-slider-thumb]:shadow-md
  [&::-moz-range-thumb]:h-3.5
  [&::-moz-range-thumb]:w-3.5
  [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:border-0
  [&::-moz-range-thumb]:bg-[#4ade80]`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ModeToggle({
  hasResidual,
  onToggle,
}: {
  hasResidual: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex overflow-hidden rounded-md border border-white/10">
        <button
          onClick={() => onToggle(false)}
          className="px-3 py-1.5 text-[11px] transition-colors duration-150"
          style={{
            fontFamily: FONT_MONO,
            color: !hasResidual ? "#fff" : "rgba(255,255,255,0.5)",
            backgroundColor: !hasResidual
              ? "rgba(74,222,128,0.15)"
              : "transparent",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            borderBottom: !hasResidual ? `2px solid ${ACCENT}` : "2px solid transparent",
          }}
        >
          Without Residual
        </button>
        <button
          onClick={() => onToggle(true)}
          className="px-3 py-1.5 text-[11px] transition-colors duration-150"
          style={{
            fontFamily: FONT_MONO,
            color: hasResidual ? "#fff" : "rgba(255,255,255,0.5)",
            backgroundColor: hasResidual
              ? "rgba(74,222,128,0.15)"
              : "transparent",
            borderBottom: hasResidual ? `2px solid ${ACCENT}` : "2px solid transparent",
          }}
        >
          With Residual
        </button>
      </div>
    </div>
  );
}

function SkipConnectionArrow({
  fromIndex,
  toIndex,
}: {
  fromIndex: number;
  toIndex: number;
}) {
  const fromX = layerCenterX(fromIndex);
  const toX = layerCenterX(toIndex);
  const topY = SVG_PADDING_Y - 2;
  const curveOffsetY = -18;

  const midX = (fromX + toX) / 2;
  const controlY = topY + curveOffsetY;

  return (
    <path
      d={`M ${fromX} ${topY} Q ${midX} ${controlY} ${toX} ${topY}`}
      fill="none"
      stroke="rgba(74,222,128,0.35)"
      strokeWidth={1}
      strokeDasharray="4 3"
      markerEnd="url(#skipArrow)"
    />
  );
}

function LayerChain({
  activeLayerIndex,
  hasResidual,
}: {
  activeLayerIndex: number;
  hasResidual: boolean;
}) {
  const totalWidth =
    SVG_PADDING_X * 2 +
    LAYER_COUNT * LAYER_WIDTH +
    (LAYER_COUNT - 1) * LAYER_GAP;
  const totalHeight = SVG_PADDING_Y * 2 + LAYER_HEIGHT + (hasResidual ? 10 : 0);

  const centerY = layerCenterY();

  return (
    <div className="flex justify-center overflow-x-auto">
      <svg
        viewBox={`0 ${hasResidual ? -16 : 0} ${totalWidth} ${totalHeight}`}
        className="w-full max-w-[640px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="skipArrow"
            viewBox="0 0 6 6"
            refX={5}
            refY={3}
            markerWidth={5}
            markerHeight={5}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(74,222,128,0.5)" />
          </marker>
        </defs>

        {/* Skip connection arrows (residual bypass) */}
        {hasResidual &&
          LAYER_LABELS.slice(0, -1).map((_, i) => (
            <SkipConnectionArrow key={`skip-${i}`} fromIndex={i} toIndex={i + 1} />
          ))}

        {/* Connection lines between layers */}
        {LAYER_LABELS.slice(0, -1).map((_, i) => {
          const x1 = layerLeftX(i) + LAYER_WIDTH;
          const x2 = layerLeftX(i + 1);
          return (
            <line
              key={`conn-${i}`}
              x1={x1}
              y1={centerY}
              x2={x2}
              y2={centerY}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
            />
          );
        })}

        {/* Layer boxes */}
        {LAYER_LABELS.map((label, i) => {
          const isActive = i === activeLayerIndex;
          const x = layerLeftX(i);

          return (
            <g key={label}>
              <rect
                x={x}
                y={SVG_PADDING_Y}
                width={LAYER_WIDTH}
                height={LAYER_HEIGHT}
                rx={6}
                fill={isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.03)"}
                stroke={isActive ? ACCENT : "rgba(255,255,255,0.1)"}
                strokeWidth={isActive ? 1.5 : 1}
                style={{
                  transition: "fill 0.2s ease, stroke 0.2s ease",
                  filter: isActive
                    ? "drop-shadow(0 0 6px rgba(74,222,128,0.4))"
                    : "none",
                }}
              />
              <text
                x={x + LAYER_WIDTH / 2}
                y={centerY + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "#fff" : "rgba(255,255,255,0.6)"}
                fontSize={10}
                fontFamily={FONT_MONO}
                style={{ transition: "fill 0.2s ease" }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Animated signal dot (flows right-to-left for backward pass) */}
        {activeLayerIndex >= 0 && activeLayerIndex < LAYER_COUNT && (
          <circle
            cx={layerCenterX(activeLayerIndex)}
            cy={centerY}
            r={SIGNAL_RADIUS}
            fill={ACCENT}
            style={{
              transition: `cx ${STEP_DURATION_MS * 0.6}ms ease`,
              filter: "drop-shadow(0 0 8px rgba(74,222,128,0.8))",
            }}
          />
        )}

        {/* "Backward pass" direction arrow label */}
        <text
          x={layerCenterX(2) + (LAYER_WIDTH + LAYER_GAP) / 2}
          y={SVG_PADDING_Y + LAYER_HEIGHT + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={9}
          fontFamily={FONT_MONO}
        >
          {"\u2190 backward pass"}
        </text>
      </svg>
    </div>
  );
}

function GradientBarChart({
  gradients,
  activeLayerIndex,
}: {
  gradients: number[];
  activeLayerIndex: number;
}) {
  return (
    <div className="mt-4">
      <p
        className="mb-2 text-center text-[10px] uppercase tracking-wider text-white/50"
        style={{ fontFamily: FONT_MONO }}
      >
        Gradient Magnitude
      </p>
      <div className="flex items-end justify-center gap-2 sm:gap-3">
        {gradients.map((magnitude, i) => {
          const isActive = i === activeLayerIndex;
          const barHeight = magnitude * BAR_MAX_HEIGHT;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className="text-[9px] tabular-nums"
                style={{
                  fontFamily: FONT_MONO,
                  color: isActive ? ACCENT : "rgba(255,255,255,0.5)",
                  transition: "color 0.2s ease",
                }}
              >
                {magnitude.toFixed(2)}
              </span>
              <div
                className="relative overflow-hidden rounded-sm"
                style={{
                  width: BAR_WIDTH,
                  height: BAR_MAX_HEIGHT,
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="absolute bottom-0 w-full rounded-sm"
                  style={{
                    height: Math.max(1, barHeight),
                    backgroundColor: gradientBarColor(magnitude),
                    outline: isActive ? `1px solid ${ACCENT}` : "none",
                    transition: "height 0.3s ease",
                  }}
                />
              </div>
              <span
                className="text-[9px] text-white/50"
                style={{ fontFamily: FONT_MONO }}
              >
                L{i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function VanishingGradient() {
  const [hasResidual, setHasResidual] = useState(false);
  const [gradientFactor, setGradientFactor] = useState(GRADIENT_FACTOR_DEFAULT);
  const [activeLayerIndex, setActiveLayerIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gradients = computeGradients(gradientFactor, hasResidual);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playLoop = useCallback(() => {
    // Signal starts at the last layer and flows backward (right-to-left)
    let currentLayer = LAYER_COUNT - 1;
    setActiveLayerIndex(currentLayer);

    const advance = () => {
      currentLayer--;
      if (currentLayer >= 0) {
        setActiveLayerIndex(currentLayer);
        timerRef.current = setTimeout(advance, STEP_DURATION_MS);
      } else {
        // Pause at the end, then reset and loop
        setActiveLayerIndex(-1);
        timerRef.current = setTimeout(playLoop, PAUSE_BEFORE_RESET_MS);
      }
    };

    timerRef.current = setTimeout(advance, STEP_DURATION_MS);
  }, []);

  useEffect(() => {
    playLoop();
    return clearTimers;
  }, [playLoop, clearTimers, hasResidual]);

  function handleResidualToggle(value: boolean) {
    clearTimers();
    setHasResidual(value);
    // The useEffect will restart the animation due to the hasResidual dependency
  }

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      {/* Mode toggle */}
      <ModeToggle hasResidual={hasResidual} onToggle={handleResidualToggle} />

      {/* Layer chain SVG */}
      <div className="mt-5">
        <LayerChain
          activeLayerIndex={activeLayerIndex}
          hasResidual={hasResidual}
        />
      </div>

      {/* Gradient bar chart */}
      <GradientBarChart
        gradients={gradients}
        activeLayerIndex={activeLayerIndex}
      />

      {/* Gradient factor slider */}
      <div className="mt-5 flex items-center gap-4">
        <label
          className="shrink-0 text-[11px] text-white/50"
          style={{ fontFamily: FONT_MONO }}
        >
          Gradient factor: {gradientFactor.toFixed(1)}
        </label>
        <input
          type="range"
          min={GRADIENT_FACTOR_MIN}
          max={GRADIENT_FACTOR_MAX}
          step={GRADIENT_FACTOR_STEP}
          value={gradientFactor}
          onChange={(e) => setGradientFactor(Number(e.target.value))}
          aria-label="Gradient factor"
          className={SLIDER_CLASSES}
        />
      </div>
    </div>
  );
}
