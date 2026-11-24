"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const BLUE = "#60a5fa";
const YELLOW = "#facc15";
const RED = "#ef4444";
const DIM_TEXT = "rgba(255,255,255,0.5)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeedupCalculator() {
  const [draftSpeed, setDraftSpeed] = useState(2); // ms per token
  const [targetSpeed, setTargetSpeed] = useState(40); // ms per forward pass
  const [acceptanceRate, setAcceptanceRate] = useState(0.8); // alpha
  const [K, setK] = useState(5); // draft length

  // Expected accepted tokens per step (geometric series)
  // E[accepted] = alpha * (1 - alpha^K) / (1 - alpha) for alpha != 1
  const alpha = acceptanceRate;
  const expectedAccepted =
    alpha === 1 ? K : alpha * (1 - Math.pow(alpha, K)) / (1 - alpha);

  // Total tokens per speculation step = accepted + 1 (recovery/bonus token)
  const tokensPerStep = expectedAccepted + 1;

  // Time for one speculation step = K * draft_speed + target_speed
  const speculationTime = K * draftSpeed + targetSpeed;

  // Time for standard decoding of same number of tokens = tokensPerStep * target_speed
  const standardTime = tokensPerStep * targetSpeed;

  // Speedup
  const speedup = standardTime / speculationTime;

  // Effective tokens per second
  const specTPS = (tokensPerStep / speculationTime) * 1000;
  const stdTPS = (1 / targetSpeed) * 1000;

  // Timeline bar widths (normalized to container)
  const maxTime = Math.max(standardTime, speculationTime);

  return (
    <div
      style={{
        background: "#0a0a0a",
        padding: "24px",
        fontFamily: FONT_MONO,
        color: "white",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: ACCENT }}>
          Speedup Calculator
        </div>
        <div
          style={{
            padding: "6px 16px",
            background: speedup > 1 ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${speedup > 1 ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            color: speedup > 1 ? ACCENT : RED,
          }}
        >
          {speedup.toFixed(2)}x speedup
        </div>
      </div>

      {/* Sliders */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Draft speed */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: DIM_TEXT, marginBottom: 4 }}>
            <span>Draft model latency</span>
            <span style={{ color: BLUE }}>{draftSpeed} ms/token</span>
          </div>
          <input
            type="range"
            aria-label="Draft model latency"
            min={0.5}
            max={20}
            step={0.5}
            value={draftSpeed}
            onChange={(e) => setDraftSpeed(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: BLUE, cursor: "pointer" }}
          />
        </div>

        {/* Target speed */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: DIM_TEXT, marginBottom: 4 }}>
            <span>Target model latency</span>
            <span style={{ color: YELLOW }}>{targetSpeed} ms/fwd pass</span>
          </div>
          <input
            type="range"
            aria-label="Target model latency"
            min={10}
            max={200}
            step={5}
            value={targetSpeed}
            onChange={(e) => setTargetSpeed(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: YELLOW, cursor: "pointer" }}
          />
        </div>

        {/* Acceptance rate */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: DIM_TEXT, marginBottom: 4 }}>
            <span>Token acceptance rate</span>
            <span style={{ color: ACCENT }}>{(acceptanceRate * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            aria-label="Token acceptance rate"
            min={0.1}
            max={0.99}
            step={0.01}
            value={acceptanceRate}
            onChange={(e) => setAcceptanceRate(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: ACCENT, cursor: "pointer" }}
          />
        </div>

        {/* Draft length K */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: DIM_TEXT, marginBottom: 4 }}>
            <span>Draft length (K)</span>
            <span style={{ color: "white" }}>{K} tokens</span>
          </div>
          <input
            type="range"
            aria-label="Draft length (K)"
            min={1}
            max={20}
            step={1}
            value={K}
            onChange={(e) => setK(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "white", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Timeline comparison */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: DIM_TEXT, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Time to generate {tokensPerStep.toFixed(1)} tokens (expected)
        </div>

        {/* Standard decoding */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: DIM_TEXT, marginBottom: 4 }}>
            <span>Standard decoding</span>
            <span>{standardTime.toFixed(1)} ms</span>
          </div>
          <div
            style={{
              height: 28,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(standardTime / maxTime) * 100}%`,
                background: `repeating-linear-gradient(90deg, rgba(250,204,21,0.15) 0px, rgba(250,204,21,0.15) ${
                  (1 / tokensPerStep) * 100
                }%, rgba(250,204,21,0.08) ${(1 / tokensPerStep) * 100}%, rgba(250,204,21,0.08) ${
                  (2 / tokensPerStep) * 100
                }%)`,
                borderRadius: 6,
                transition: "width 0.3s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: YELLOW,
              }}
            >
              {tokensPerStep.toFixed(1)} sequential forward passes
            </div>
          </div>
        </div>

        {/* Speculative decoding */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: DIM_TEXT, marginBottom: 4 }}>
            <span>Speculative decoding</span>
            <span>{speculationTime.toFixed(1)} ms</span>
          </div>
          <div
            style={{
              height: 28,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Draft portion */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${((K * draftSpeed) / maxTime) * 100}%`,
                background: "rgba(96,165,250,0.2)",
                borderRadius: "6px 0 0 6px",
                transition: "width 0.3s ease",
              }}
            />
            {/* Verify portion */}
            <div
              style={{
                position: "absolute",
                left: `${((K * draftSpeed) / maxTime) * 100}%`,
                top: 0,
                bottom: 0,
                width: `${(targetSpeed / maxTime) * 100}%`,
                background: "rgba(74,222,128,0.2)",
                borderRadius: "0 6px 6px 0",
                transition: "width 0.3s ease, left 0.3s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "white",
                display: "flex",
                gap: 8,
              }}
            >
              <span style={{ color: BLUE }}>Draft: {(K * draftSpeed).toFixed(0)}ms</span>
              <span style={{ color: ACCENT }}>Verify: {targetSpeed}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {[
          {
            label: "Expected accepted",
            value: expectedAccepted.toFixed(2),
            unit: "tokens",
            color: ACCENT,
          },
          {
            label: "Tokens per step",
            value: tokensPerStep.toFixed(2),
            unit: "total",
            color: ACCENT,
          },
          {
            label: "Spec. throughput",
            value: specTPS.toFixed(1),
            unit: "tok/s",
            color: BLUE,
          },
          {
            label: "Std. throughput",
            value: stdTPS.toFixed(1),
            unit: "tok/s",
            color: YELLOW,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "10px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: DIM_TEXT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>
              {stat.value}
              <span style={{ fontSize: 13, color: DIM_TEXT, marginLeft: 4 }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Formula */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.6,
        }}
      >
        Speedup = (tokens_per_step * target_latency) / (K * draft_latency + target_latency) = (
        {tokensPerStep.toFixed(2)} * {targetSpeed}) / ({K} * {draftSpeed} + {targetSpeed}) ={" "}
        <span style={{ color: ACCENT, fontWeight: 600 }}>{speedup.toFixed(2)}x</span>
      </div>
    </div>
  );
}
