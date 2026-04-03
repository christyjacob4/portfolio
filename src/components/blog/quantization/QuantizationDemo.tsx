"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";

const ERROR_COLOR = "rgba(239, 68, 68, 0.6)";
const QUANT_LINE_COLOR = "rgba(74, 222, 128, 0.35)";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 300;
const PADDING = { top: 30, right: 20, bottom: 40, left: 50 };
const PLOT_LEFT = PADDING.left;
const PLOT_RIGHT = CANVAS_WIDTH - PADDING.right;
const PLOT_TOP = PADDING.top;
const PLOT_BOTTOM = CANVAS_HEIGHT - PADDING.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

// ---------------------------------------------------------------------------
// Generate a realistic weight distribution (mixture of Gaussians)
// ---------------------------------------------------------------------------

function gaussianRandom(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateWeights(count: number, seed: number): number[] {
  // Simple seeded random for reproducibility
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  const seededGaussian = (mean: number, std: number) => {
    const u1 = rand();
    const u2 = rand();
    return mean + std * Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
  };

  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    // Mix of two Gaussians to create a realistic weight distribution
    if (rand() < 0.7) {
      weights.push(seededGaussian(0, 0.3));
    } else {
      weights.push(seededGaussian(0, 0.8));
    }
  }
  return weights;
}

// ---------------------------------------------------------------------------
// Quantization functions
// ---------------------------------------------------------------------------

function symmetricQuantize(
  value: number,
  bits: number,
  absMax: number
): { quantized: number; level: number } {
  const qMax = (1 << (bits - 1)) - 1;
  const scale = absMax / qMax;
  const level = Math.max(-qMax, Math.min(qMax, Math.round(value / scale)));
  return { quantized: level * scale, level };
}

function asymmetricQuantize(
  value: number,
  bits: number,
  minVal: number,
  maxVal: number
): { quantized: number; level: number } {
  const qMax = (1 << bits) - 1;
  const scale = (maxVal - minVal) / qMax;
  const zeroPoint = Math.round(-minVal / scale);
  const level = Math.max(0, Math.min(qMax, Math.round(value / scale) + zeroPoint));
  const quantized = (level - zeroPoint) * scale;
  return { quantized, level };
}

// ---------------------------------------------------------------------------
// Histogram computation
// ---------------------------------------------------------------------------

function computeHistogram(
  values: number[],
  bins: number,
  minVal: number,
  maxVal: number
): number[] {
  const histogram = new Array(bins).fill(0);
  const range = maxVal - minVal;
  for (const v of values) {
    const idx = Math.floor(((v - minVal) / range) * (bins - 1));
    if (idx >= 0 && idx < bins) histogram[idx]++;
  }
  return histogram;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QuantizationDemo() {
  const [bits, setBits] = useState(4);
  const [mode, setMode] = useState<"symmetric" | "asymmetric">("symmetric");
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const weights = useMemo(() => generateWeights(2000, 42), []);

  const absMax = useMemo(() => {
    let m = 0;
    for (const w of weights) m = Math.max(m, Math.abs(w));
    return m;
  }, [weights]);

  const minVal = useMemo(() => Math.min(...weights), [weights]);
  const maxVal = useMemo(() => Math.max(...weights), [weights]);

  const quantizedWeights = useMemo(() => {
    return weights.map((w) => {
      if (mode === "symmetric") {
        return symmetricQuantize(w, bits, absMax);
      } else {
        return asymmetricQuantize(w, bits, minVal, maxVal);
      }
    });
  }, [weights, bits, mode, absMax, minVal, maxVal]);

  const mse = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      const err = weights[i] - quantizedWeights[i].quantized;
      sum += err * err;
    }
    return sum / weights.length;
  }, [weights, quantizedWeights]);

  // Number of unique quantization levels used
  const uniqueLevels = useMemo(() => {
    const s = new Set(quantizedWeights.map((q) => q.level));
    return s.size;
  }, [quantizedWeights]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Plot area border
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(PLOT_LEFT, PLOT_TOP, PLOT_WIDTH, PLOT_HEIGHT);

    // Draw histogram of original weights
    const BINS = 60;
    const rangeMin = -3;
    const rangeMax = 3;
    const histogram = computeHistogram(weights, BINS, rangeMin, rangeMax);
    const histMax = Math.max(...histogram);
    const binWidth = PLOT_WIDTH / BINS;

    // Draw quantization grid lines
    const numLevels = mode === "symmetric" ? (1 << bits) - 1 : 1 << bits;
    const qMin = mode === "symmetric" ? -absMax : minVal;
    const qMax = mode === "symmetric" ? absMax : maxVal;

    for (let i = 0; i <= numLevels; i++) {
      let val: number;
      if (mode === "symmetric") {
        const qMaxLevel = (1 << (bits - 1)) - 1;
        val = ((i - qMaxLevel) / qMaxLevel) * absMax;
      } else {
        val = minVal + (i / numLevels) * (maxVal - minVal);
      }
      const x =
        PLOT_LEFT + ((val - rangeMin) / (rangeMax - rangeMin)) * PLOT_WIDTH;
      if (x >= PLOT_LEFT && x <= PLOT_RIGHT) {
        ctx.strokeStyle = QUANT_LINE_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, PLOT_TOP);
        ctx.lineTo(x, PLOT_BOTTOM);
        ctx.stroke();
      }
    }

    // Draw original histogram bars
    for (let i = 0; i < BINS; i++) {
      const x = PLOT_LEFT + i * binWidth;
      const h = (histogram[i] / histMax) * PLOT_HEIGHT * 0.85;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 1, PLOT_BOTTOM - h, binWidth - 2, h);
    }

    // Draw quantized histogram overlay
    const quantizedVals = quantizedWeights.map((q) => q.quantized);
    const quantHist = computeHistogram(quantizedVals, BINS, rangeMin, rangeMax);
    const quantHistMax = Math.max(...quantHist);

    for (let i = 0; i < BINS; i++) {
      const x = PLOT_LEFT + i * binWidth;
      const h = (quantHist[i] / Math.max(quantHistMax, 1)) * PLOT_HEIGHT * 0.85;
      if (quantHist[i] > 0) {
        ctx.fillStyle = "rgba(74, 222, 128, 0.25)";
        ctx.fillRect(x + 1, PLOT_BOTTOM - h, binWidth - 2, h);
        ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, PLOT_BOTTOM - h, binWidth - 2, h);
      }
    }

    // Draw error bars (difference between original and quantized)
    for (let i = 0; i < Math.min(200, weights.length); i++) {
      const orig = weights[i];
      const quant = quantizedWeights[i].quantized;
      const origX =
        PLOT_LEFT + ((orig - rangeMin) / (rangeMax - rangeMin)) * PLOT_WIDTH;
      const quantX =
        PLOT_LEFT + ((quant - rangeMin) / (rangeMax - rangeMin)) * PLOT_WIDTH;

      if (
        origX >= PLOT_LEFT &&
        origX <= PLOT_RIGHT &&
        quantX >= PLOT_LEFT &&
        quantX <= PLOT_RIGHT
      ) {
        const y = PLOT_TOP + 10 + (i / 200) * (PLOT_HEIGHT - 20);
        ctx.strokeStyle = ERROR_COLOR;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(origX, y);
        ctx.lineTo(quantX, y);
        ctx.stroke();
      }
    }

    // X axis labels
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `13px ${FONT_MONO}`;
    ctx.textAlign = "center";
    for (let v = -3; v <= 3; v++) {
      const x = PLOT_LEFT + ((v - rangeMin) / (rangeMax - rangeMin)) * PLOT_WIDTH;
      ctx.fillText(v.toString(), x, PLOT_BOTTOM + 16);
    }

    // X axis label
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `13px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("Weight Value", CANVAS_WIDTH / 2, PLOT_BOTTOM + 32);

    // Y axis label
    ctx.save();
    ctx.translate(14, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `13px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("Frequency", 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `13px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.fillText(
      `${bits}-bit ${mode} quantization  |  ${uniqueLevels} levels  |  MSE: ${mse.toExponential(3)}`,
      PLOT_LEFT,
      PLOT_TOP - 10
    );
  }, [weights, quantizedWeights, bits, mode, absMax, minVal, maxVal, uniqueLevels, mse]);

  return (
    <div
      ref={containerRef}
      style={{
        background: BG,
        padding: "20px",
        fontFamily: FONT_MONO,
        color: TEXT_BRIGHT,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 13,
          color: TEXT_DIM,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Interactive Quantization Demo
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {/* Bits slider */}
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontSize: 13, color: TEXT_DIM, display: "block", marginBottom: 6 }}>
            Bit width: <span style={{ color: ACCENT, fontSize: 15 }}>{bits}</span>
          </label>
          <input
            type="range"
            min={2}
            max={8}
            value={bits}
            onChange={(e) => setBits(parseInt(e.target.value, 10))}
            style={{
              width: "100%",
              accentColor: ACCENT,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: TEXT_DIM,
              marginTop: 2,
            }}
          >
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
          </div>
        </div>

        {/* Mode toggle */}
        <div>
          <label style={{ fontSize: 13, color: TEXT_DIM, display: "block", marginBottom: 6 }}>
            Mode
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            {(["symmetric", "asymmetric"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  background:
                    mode === m
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    mode === m ? "rgba(74,222,128,0.4)" : BORDER
                  }`,
                  borderRadius: 4,
                  padding: "6px 12px",
                  color: mode === m ? ACCENT : TEXT_DIM,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: 6,
          border: `1px solid ${BORDER}`,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>Levels</div>
          <div style={{ fontSize: 18, color: ACCENT }}>{1 << bits}</div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>MSE</div>
          <div
            style={{
              fontSize: 18,
              color:
                mse < 0.001
                  ? ACCENT
                  : mse < 0.01
                  ? "rgba(234,179,8,0.9)"
                  : ERROR_COLOR,
            }}
          >
            {mse.toExponential(2)}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
            Compression
          </div>
          <div style={{ fontSize: 18, color: TEXT_BRIGHT }}>
            {(32 / bits).toFixed(1)}x
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
            Memory (7B)
          </div>
          <div style={{ fontSize: 18, color: TEXT_BRIGHT }}>
            {((7e9 * bits) / 8 / 1e9).toFixed(1)} GB
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 12,
          fontSize: 13,
          color: TEXT_DIM,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: "rgba(255,255,255,0.12)",
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Original distribution
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 8,
              background: "rgba(74,222,128,0.25)",
              border: "1px solid rgba(74,222,128,0.5)",
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Quantized distribution
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 1,
              background: QUANT_LINE_COLOR,
              display: "inline-block",
            }}
          />
          Quantization grid
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 1,
              background: ERROR_COLOR,
              display: "inline-block",
            }}
          />
          Quantization error
        </span>
      </div>
    </div>
  );
}
