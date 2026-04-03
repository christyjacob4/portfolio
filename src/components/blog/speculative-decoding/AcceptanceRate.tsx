"use client";

import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const RED = "#ef4444";
const BLUE = "#60a5fa";
const YELLOW = "#facc15";
const DIM_TEXT = "rgba(255,255,255,0.5)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const VOCAB = ["the", "cat", "sat", "on", "mat", "dog", "ran", "big"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function generateDistributions(alignment: number): { p: number[]; q: number[] } {
  // Target distribution: fixed
  const pLogits = [3.0, 2.5, 1.8, 1.2, 0.5, 0.3, 0.1, -0.5];
  const p = softmax(pLogits);

  // Draft distribution: blend between target (high alignment) and uniform (low alignment)
  const uniform = Array(VOCAB.length).fill(1 / VOCAB.length);
  const q = p.map((pi, i) => alignment * pi + (1 - alignment) * uniform[i]);
  // Renormalize
  const qSum = q.reduce((a, b) => a + b, 0);
  return { p, q: q.map((v) => v / qSum) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AcceptanceRate() {
  const [alignment, setAlignment] = useState(0.7);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { p, q } = generateDistributions(alignment);

  // Compute acceptance probability per token: min(1, p(t)/q(t))
  const acceptProb = p.map((pi, i) => Math.min(1, pi / q[i]));
  // Overall acceptance rate (weighted by q): sum_t q(t) * min(1, p(t)/q(t))
  const overallAcceptance = q.reduce((sum, qi, i) => sum + qi * acceptProb[i], 0);

  const maxProb = Math.max(...p, ...q);
  const barMaxHeight = 120;

  const getBarColor = useCallback(
    (idx: number): { pColor: string; qColor: string; verdict: string } => {
      if (p[idx] >= q[idx]) {
        return {
          pColor: ACCENT,
          qColor: BLUE,
          verdict: "Always accept (p >= q)",
        };
      } else {
        return {
          pColor: ACCENT,
          qColor: RED,
          verdict: `Accept with prob ${(p[idx] / q[idx]).toFixed(2)}`,
        };
      }
    },
    [p, q]
  );

  return (
    <div
      ref={containerRef}
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
          Acceptance Probability Visualization
        </div>
        <div
          style={{
            padding: "4px 12px",
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 6,
            fontSize: 14,
            color: ACCENT,
          }}
        >
          Overall acceptance: {(overallAcceptance * 100).toFixed(1)}%
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: DIM_TEXT,
            marginBottom: 6,
          }}
        >
          <span>Draft-Target Alignment</span>
          <span>{(alignment * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={0.99}
          step={0.01}
          value={alignment}
          onChange={(e) => setAlignment(parseFloat(e.target.value))}
          style={{
            width: "100%",
            accentColor: ACCENT,
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            marginTop: 2,
          }}
        >
          <span>Poor alignment (near uniform)</span>
          <span>High alignment (near target)</span>
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          marginBottom: 16,
          overflowX: "auto",
        }}
      >
        {VOCAB.map((token, i) => {
          const pHeight = (p[i] / maxProb) * barMaxHeight;
          const qHeight = (q[i] / maxProb) * barMaxHeight;
          const isHovered = hoveredIdx === i;
          const { pColor, qColor, verdict } = getBarColor(i);

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: "1 1 0",
                minWidth: 50,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: barMaxHeight + 48,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    zIndex: 10,
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    <span style={{ color: pColor }}>p</span>(&quot;{token}&quot;) = {p[i].toFixed(4)}
                  </div>
                  <div>
                    <span style={{ color: qColor }}>q</span>(&quot;{token}&quot;) = {q[i].toFixed(4)}
                  </div>
                  <div style={{ marginTop: 4, color: p[i] >= q[i] ? ACCENT : YELLOW }}>
                    {verdict}
                  </div>
                </div>
              )}

              {/* Bars */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  height: barMaxHeight,
                }}
              >
                {/* p bar */}
                <div
                  style={{
                    width: 16,
                    height: Math.max(2, pHeight),
                    background: isHovered
                      ? `${pColor}`
                      : `${pColor}88`,
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.3s ease, background 0.2s ease",
                    opacity: isHovered ? 1 : 0.7,
                  }}
                />
                {/* q bar */}
                <div
                  style={{
                    width: 16,
                    height: Math.max(2, qHeight),
                    background: isHovered
                      ? `${qColor}`
                      : `${qColor}88`,
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.3s ease, background 0.2s ease",
                    opacity: isHovered ? 1 : 0.7,
                  }}
                />
              </div>

              {/* Acceptance indicator */}
              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: p[i] >= q[i] ? ACCENT : RED,
                  transition: "color 0.3s ease",
                }}
              >
                {p[i] >= q[i] ? "\u2713" : `${(acceptProb[i] * 100).toFixed(0)}%`}
              </div>

              {/* Token label */}
              <div
                style={{
                  fontSize: 13,
                  color: isHovered ? "white" : DIM_TEXT,
                  marginTop: 2,
                  transition: "color 0.2s ease",
                }}
              >
                {token}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 20,
          fontSize: 13,
          color: DIM_TEXT,
          marginBottom: 16,
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: ACCENT,
              borderRadius: 2,
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          p(t) - Target model
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: BLUE,
              borderRadius: 2,
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          q(t) - Draft model
        </span>
        <span>
          <span style={{ color: ACCENT }}>{"\u2713"}</span> = Always accept
        </span>
        <span>
          <span style={{ color: RED }}>%</span> = Conditional accept
        </span>
      </div>

      {/* Explanation */}
      <div
        style={{
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.6,
        }}
      >
        {hoveredIdx !== null ? (
          <>
            Token &quot;<span style={{ color: "white" }}>{VOCAB[hoveredIdx]}</span>&quot;:{" "}
            {p[hoveredIdx] >= q[hoveredIdx] ? (
              <>
                Target prob ({p[hoveredIdx].toFixed(4)}) {"\u2265"} Draft prob ({q[hoveredIdx].toFixed(4)}) {"\u2192"}{" "}
                <span style={{ color: ACCENT }}>always accepted</span>. The draft model is not overconfident here.
              </>
            ) : (
              <>
                Target prob ({p[hoveredIdx].toFixed(4)}) {"<"} Draft prob ({q[hoveredIdx].toFixed(4)}) {"\u2192"}{" "}
                <span style={{ color: YELLOW }}>
                  accepted with probability p/q = {(p[hoveredIdx] / q[hoveredIdx]).toFixed(3)}
                </span>
                . The draft model is overconfident on this token.
              </>
            )}
          </>
        ) : (
          <>
            Hover over any token to see the acceptance calculation. When the draft model assigns{" "}
            <span style={{ color: "white" }}>higher probability</span> than the target, we sometimes reject {"\u2014"}{" "}
            proportional to how overconfident the draft was.
          </>
        )}
      </div>
    </div>
  );
}
