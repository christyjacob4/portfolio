"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";

const YELLOW = "rgba(250, 204, 21, 0.8)";
const YELLOW_RGB = "250, 204, 21";
const RED = "rgba(239, 68, 68, 0.8)";
const RED_RGB = "239, 68, 68";

// Example prompt/response pairs for the demo
const EXAMPLES = [
  {
    prompt: "Explain quantum computing in simple terms.",
    responseA:
      "Quantum computing uses quantum bits (qubits) that can be 0 and 1 simultaneously through superposition. This lets quantum computers explore many solutions at once, making them potentially much faster for specific problems like cryptography and drug discovery.",
    responseB:
      "Quantum computers are basically really fast computers that use quantum physics. They can do a lot of calculations really quickly. They're the future of computing and will make everything faster.",
    betterIs: "A" as const,
    rewardA: 0.82,
    rewardB: 0.31,
  },
  {
    prompt: "Write a haiku about machine learning.",
    responseA:
      "Data flows like streams / Patterns emerge from the noise / Machines learn to see",
    responseB:
      "Neural networks learn / Weights adjusting, loss descends / Gradient wisdom",
    betterIs: "B" as const,
    rewardA: 0.65,
    rewardB: 0.78,
  },
  {
    prompt: "What are the risks of AI?",
    responseA:
      "AI could destroy humanity and take over the world. We should ban all AI research immediately before it's too late. Skynet is coming.",
    responseB:
      "Key AI risks include: bias amplification in automated decisions, job displacement requiring workforce adaptation, misuse for deepfakes/surveillance, and longer-term concerns about systems optimizing for misspecified objectives. Mitigation requires technical safety research, policy frameworks, and international coordination.",
    betterIs: "B" as const,
    rewardA: 0.12,
    rewardB: 0.91,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RewardModelViz() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [userVote, setUserVote] = useState<"A" | "B" | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<number>(0);

  const example = EXAMPLES[exampleIdx];

  // Animate the reward bars when showing rewards
  useEffect(() => {
    if (!showRewards) {
      setAnimProgress(0);
      return;
    }
    let start: number | null = null;
    const duration = 800;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [showRewards]);

  const handleVote = useCallback(
    (choice: "A" | "B") => {
      setUserVote(choice);
      // Show rewards after a brief delay
      setTimeout(() => setShowRewards(true), 400);
    },
    []
  );

  const handleNextExample = useCallback(() => {
    setExampleIdx((prev) => (prev + 1) % EXAMPLES.length);
    setUserVote(null);
    setShowRewards(false);
  }, []);

  const bradleyTerryProb = (rA: number, rB: number) => {
    return 1 / (1 + Math.exp(-(rA - rB)));
  };

  const probAWins = bradleyTerryProb(example.rewardA, example.rewardB);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        background: BG,
        overflow: "hidden",
        fontFamily: FONT_MONO,
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
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          reward model · preference learning
        </span>
        <span
          style={{
            fontSize: 13,
            color: `rgba(${ACCENT_RGB}, 0.65)`,
          }}
        >
          {exampleIdx + 1}/{EXAMPLES.length}
        </span>
      </div>

      <div style={{ padding: 20 }}>
        {/* Prompt */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Prompt
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
            {example.prompt}
          </div>
        </div>

        {/* Responses side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Response A */}
          <div
            onClick={() => !userVote && handleVote("A")}
            style={{
              background:
                userVote === "A"
                  ? "rgba(74,222,128,0.06)"
                  : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                userVote === "A"
                  ? `rgba(${ACCENT_RGB}, 0.4)`
                  : showRewards && example.betterIs === "A"
                  ? `rgba(${ACCENT_RGB}, 0.3)`
                  : "rgba(255,255,255,0.08)"
              }`,
              borderRadius: 6,
              padding: "12px 14px",
              cursor: userVote ? "default" : "pointer",
              transition: "all 0.2s ease",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color:
                  userVote === "A"
                    ? `rgba(${ACCENT_RGB}, 0.7)`
                    : "rgba(255,255,255,0.5)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Response A</span>
              {userVote === "A" && (
                <span style={{ color: ACCENT }}>your pick</span>
              )}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.6,
              }}
            >
              {example.responseA}
            </div>
            {/* Reward bar */}
            {showRewards && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    r(x, y_A)
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color:
                        example.rewardA > example.rewardB
                          ? ACCENT
                          : "rgba(255,255,255,0.5)",
                      fontWeight: "bold",
                    }}
                  >
                    {(example.rewardA * animProgress).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${example.rewardA * animProgress * 100}%`,
                      background:
                        example.rewardA > example.rewardB
                          ? ACCENT
                          : "rgba(255,255,255,0.3)",
                      borderRadius: 3,
                      transition: "width 0.05s linear",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Response B */}
          <div
            onClick={() => !userVote && handleVote("B")}
            style={{
              background:
                userVote === "B"
                  ? "rgba(74,222,128,0.06)"
                  : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                userVote === "B"
                  ? `rgba(${ACCENT_RGB}, 0.4)`
                  : showRewards && example.betterIs === "B"
                  ? `rgba(${ACCENT_RGB}, 0.3)`
                  : "rgba(255,255,255,0.08)"
              }`,
              borderRadius: 6,
              padding: "12px 14px",
              cursor: userVote ? "default" : "pointer",
              transition: "all 0.2s ease",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color:
                  userVote === "B"
                    ? `rgba(${ACCENT_RGB}, 0.7)`
                    : "rgba(255,255,255,0.5)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Response B</span>
              {userVote === "B" && (
                <span style={{ color: ACCENT }}>your pick</span>
              )}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.6,
              }}
            >
              {example.responseB}
            </div>
            {/* Reward bar */}
            {showRewards && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    r(x, y_B)
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color:
                        example.rewardB > example.rewardA
                          ? ACCENT
                          : "rgba(255,255,255,0.5)",
                      fontWeight: "bold",
                    }}
                  >
                    {(example.rewardB * animProgress).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${example.rewardB * animProgress * 100}%`,
                      background:
                        example.rewardB > example.rewardA
                          ? ACCENT
                          : "rgba(255,255,255,0.3)",
                      borderRadius: 3,
                      transition: "width 0.05s linear",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vote prompt or Bradley-Terry result */}
        {!userVote ? (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Click the response you think is better
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {/* Feedback on vote */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 12,
                fontSize: 14,
                color:
                  userVote === example.betterIs
                    ? `rgba(${ACCENT_RGB}, 0.8)`
                    : `rgba(${RED_RGB}, 0.8)`,
              }}
            >
              {userVote === example.betterIs
                ? "You agreed with the reward model!"
                : "The reward model disagrees with you."}
            </div>

            {/* Bradley-Terry probability */}
            {showRewards && animProgress > 0.5 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 6,
                  padding: "12px 16px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Bradley-Terry Model
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: 8,
                    lineHeight: 1.6,
                  }}
                >
                  P(A {">"} B) = sigma(r_A - r_B) = sigma({example.rewardA.toFixed(2)} - {example.rewardB.toFixed(2)}) ={" "}
                  <span style={{ color: ACCENT, fontWeight: "bold" }}>
                    {probAWins.toFixed(3)}
                  </span>
                </div>
                {/* Probability bar */}
                <div
                  style={{
                    display: "flex",
                    height: 24,
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${probAWins * 100}%`,
                      background:
                        example.betterIs === "A"
                          ? `rgba(${ACCENT_RGB}, 0.3)`
                          : "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                      transition: "width 0.5s ease",
                    }}
                  >
                    A: {(probAWins * 100).toFixed(1)}%
                  </div>
                  <div
                    style={{
                      width: `${(1 - probAWins) * 100}%`,
                      background:
                        example.betterIs === "B"
                          ? `rgba(${ACCENT_RGB}, 0.3)`
                          : "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                      transition: "width 0.5s ease",
                    }}
                  >
                    B: {((1 - probAWins) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Next example button */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleNextExample}
                style={{
                  background: `rgba(${ACCENT_RGB}, 0.1)`,
                  border: `1px solid rgba(${ACCENT_RGB}, 0.3)`,
                  color: ACCENT,
                  borderRadius: 4,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontFamily: FONT_MONO,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.1)`;
                }}
              >
                Next Example
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
