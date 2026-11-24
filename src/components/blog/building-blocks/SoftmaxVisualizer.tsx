"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const LABELS = ["cat", "dog", "fish", "bird", "tree"] as const;
const INITIAL_LOGITS = [2.0, 1.0, 0.5, -1.0, -0.5];

const LOGIT_MIN = -3;
const LOGIT_MAX = 5;

const TEMPERATURE_MIN = 0.1;
const TEMPERATURE_MAX = 5.0;
const TEMPERATURE_STEP = 0.1;
const TEMPERATURE_DEFAULT = 1.0;

const BAR_MAX_HEIGHT = 140;

// ---------------------------------------------------------------------------
// Softmax computation
// ---------------------------------------------------------------------------

function computeSoftmax(logits: number[], temperature: number): number[] {
  const scaled = logits.map((x) => x / temperature);
  const maxScaled = Math.max(...scaled);
  const exponents = scaled.map((x) => Math.exp(x - maxScaled));
  const sumExp = exponents.reduce((sum, e) => sum + e, 0);
  return exponents.map((e) => e / sumExp);
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
// Draggable Logit Bar
// ---------------------------------------------------------------------------

function LogitBar({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const barContainerRef = useRef<HTMLDivElement>(null);

  const normalizedHeight =
    ((value - LOGIT_MIN) / (LOGIT_MAX - LOGIT_MIN)) * BAR_MAX_HEIGHT;

  const active = hovered || dragging;

  const updateFromY = useCallback(
    (clientY: number) => {
      const el = barContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Bottom of bar = LOGIT_MIN, top = LOGIT_MAX
      const ratio = 1 - (clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, ratio));
      const newValue =
        Math.round((LOGIT_MIN + clamped * (LOGIT_MAX - LOGIT_MIN)) * 10) / 10;
      onChange(newValue);
    },
    [onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateFromY(e.clientY);
    },
    [updateFromY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      updateFromY(e.clientY);
    },
    [dragging, updateFromY],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="text-[10px] tabular-nums"
        style={{
          fontFamily: FONT_MONO,
          color: active ? ACCENT : "rgba(255,255,255,0.5)",
          transition: "color 0.15s ease",
        }}
      >
        {value.toFixed(1)}
      </span>
      <div
        ref={barContainerRef}
        className="relative w-8 overflow-hidden rounded-sm sm:w-10"
        style={{
          height: BAR_MAX_HEIGHT,
          backgroundColor: "rgba(255,255,255,0.05)",
          cursor: active ? "ns-resize" : "pointer",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="absolute bottom-0 w-full rounded-sm"
          style={{
            height: Math.max(0, normalizedHeight),
            backgroundColor: active ? ACCENT : "rgba(255,255,255,0.4)",
            opacity: active ? 0.5 : 1,
            transition: "height 0.1s ease, background-color 0.15s ease",
            pointerEvents: "none",
          }}
        />
      </div>
      <span
        className="text-[10px]"
        style={{
          fontFamily: FONT_MONO,
          color: active ? ACCENT : "rgba(255,255,255,0.5)",
          transition: "color 0.15s ease",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Probability Bar
// ---------------------------------------------------------------------------

function ProbabilityBar({
  probability,
  label,
}: {
  probability: number;
  label: string;
}) {
  const barHeight = probability * BAR_MAX_HEIGHT;

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[10px] tabular-nums text-white/70"
        style={{ fontFamily: FONT_MONO }}
      >
        {probability.toFixed(2)}
      </span>
      <div
        className="relative w-8 overflow-hidden rounded-sm sm:w-10"
        style={{
          height: BAR_MAX_HEIGHT,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="absolute bottom-0 w-full rounded-sm"
          style={{
            height: Math.max(0, barHeight),
            backgroundColor: ACCENT,
            opacity: 0.3 + probability * 0.7,
            transition: "height 0.15s ease, opacity 0.15s ease",
          }}
        />
      </div>
      <span
        className="text-[10px] text-white/60"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </span>
    </div>
  );
}

function ColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 text-center text-[11px] uppercase tracking-wider text-white/50"
      style={{ fontFamily: FONT_MONO }}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SoftmaxVisualizer() {
  const [logits, setLogits] = useState<number[]>(INITIAL_LOGITS);
  const [temperature, setTemperature] = useState(TEMPERATURE_DEFAULT);

  const probabilities = useMemo(
    () => computeSoftmax(logits, temperature),
    [logits, temperature],
  );

  function handleLogitChange(index: number, value: number) {
    setLogits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      {/* Two-column layout: logits and probabilities */}
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {/* Left column: Input Logits */}
        <div className="flex-1">
          <ColumnHeader>Input Logits</ColumnHeader>
          <div className="flex items-end justify-center gap-2 sm:gap-3">
            {LABELS.map((label, i) => (
              <LogitBar
                key={label}
                value={logits[i]}
                label={label}
                onChange={(v) => handleLogitChange(i, v)}
              />
            ))}
          </div>
        </div>

        {/* Right column: Output Probabilities */}
        <div className="flex-1">
          <ColumnHeader>Output Probabilities</ColumnHeader>
          <div className="flex items-end justify-center gap-2 sm:gap-3">
            {LABELS.map((label, i) => (
              <ProbabilityBar
                key={label}
                probability={probabilities[i]}
                label={label}
              />
            ))}
          </div>
          <p
            className="mt-3 text-center text-[11px] tabular-nums text-white/50"
            style={{ fontFamily: FONT_MONO }}
          >
            {"\u03A3"} = {probabilities.reduce((s, p) => s + p, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Temperature slider */}
      <div className="mt-6 flex items-center gap-4">
        <label
          className="shrink-0 text-[11px] text-white/50"
          style={{ fontFamily: FONT_MONO }}
        >
          Temperature: {temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min={TEMPERATURE_MIN}
          max={TEMPERATURE_MAX}
          step={TEMPERATURE_STEP}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          aria-label="Temperature"
          className={SLIDER_CLASSES}
        />
      </div>
    </div>
  );
}
