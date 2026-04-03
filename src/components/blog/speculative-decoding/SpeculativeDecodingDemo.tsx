"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_BG = "rgba(74,222,128,0.15)";
const ACCENT_BORDER = "rgba(74,222,128,0.3)";
const RED = "#ef4444";
const RED_BG = "rgba(239,68,68,0.15)";
const RED_BORDER = "rgba(239,68,68,0.3)";
const BLUE = "#60a5fa";
const BLUE_BG = "rgba(96,165,250,0.15)";
const BLUE_BORDER = "rgba(96,165,250,0.3)";
const YELLOW = "#facc15";
const YELLOW_BG = "rgba(250,204,21,0.15)";
const YELLOW_BORDER = "rgba(250,204,21,0.3)";
const DIM_TEXT = "rgba(255,255,255,0.5)";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

// ---------------------------------------------------------------------------
// Example sentences for the demo
// ---------------------------------------------------------------------------

const FULL_SENTENCE = [
  "The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "today",
];

// Draft model guesses (some wrong to show rejection)
const DRAFT_GUESSES = [
  // Batch 1: guess tokens 0..4
  ["The", "quick", "brown", "fox", "jumped"], // "jumped" is wrong -> reject at index 4
  // Batch 2: guess tokens 5..8
  ["over", "the", "lazy", "dogs"],            // "dogs" is wrong -> reject at index 3
  // Batch 3: guess tokens 9
  ["today"],
];

const DRAFT_ACCEPTANCE = [
  [true, true, true, true, false],
  [true, true, true, false],
  [true],
];

// Recovery tokens (sampled from adjusted distribution when rejected)
const RECOVERY_TOKENS = ["jumps", "dog"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenState {
  text: string;
  status: "pending" | "drafting" | "verifying" | "accepted" | "rejected" | "recovery" | "done";
}

type Phase =
  | "idle"
  | "drafting"
  | "verifying"
  | "results"
  | "recovery"
  | "done";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeculativeDecodingDemo() {
  const [mode, setMode] = useState<"step" | "auto">("step");
  const [batchIndex, setBatchIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [draftTokens, setDraftTokens] = useState<TokenState[]>([]);
  const [acceptedTokens, setAcceptedTokens] = useState<string[]>([]);
  const [draftSubStep, setDraftSubStep] = useState(0);
  const [verifySubStep, setVerifySubStep] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryIndex, setRecoveryIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Press 'Next Step' to begin speculative decoding.");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // Reset
  const reset = useCallback(() => {
    cleanup();
    autoRef.current = false;
    setBatchIndex(0);
    setPhase("idle");
    setDraftTokens([]);
    setAcceptedTokens([]);
    setDraftSubStep(0);
    setVerifySubStep(0);
    setShowRecovery(false);
    setRecoveryIndex(0);
    setStatusMessage("Press 'Next Step' to begin speculative decoding.");
    setMode("step");
  }, [cleanup]);

  // Advance one logical step
  const advance = useCallback(() => {
    if (batchIndex >= DRAFT_GUESSES.length && phase === "done") return;

    const currentBatch = DRAFT_GUESSES[batchIndex] || [];
    const currentAcceptance = DRAFT_ACCEPTANCE[batchIndex] || [];

    if (phase === "idle") {
      // Start drafting
      setPhase("drafting");
      setDraftSubStep(0);
      setDraftTokens(
        currentBatch.map((t) => ({ text: t, status: "pending" }))
      );
      setStatusMessage(
        `Batch ${batchIndex + 1}: Draft model generating ${currentBatch.length} candidate tokens...`
      );
    } else if (phase === "drafting") {
      // Reveal draft tokens one by one
      if (draftSubStep < currentBatch.length) {
        setDraftTokens((prev) =>
          prev.map((tok, i) =>
            i === draftSubStep ? { ...tok, status: "drafting" } : tok
          )
        );
        setDraftSubStep((s) => s + 1);
        setStatusMessage(
          `Draft model outputs: "${currentBatch[draftSubStep]}"`
        );
      } else {
        // Move to verification
        setPhase("verifying");
        setVerifySubStep(0);
        setStatusMessage(
          `Target model verifies all ${currentBatch.length} tokens in ONE forward pass...`
        );
      }
    } else if (phase === "verifying") {
      // Show verification results one by one
      if (verifySubStep < currentBatch.length) {
        const accepted = currentAcceptance[verifySubStep];
        setDraftTokens((prev) =>
          prev.map((tok, i) =>
            i === verifySubStep
              ? { ...tok, status: accepted ? "accepted" : "rejected" }
              : i < verifySubStep
              ? tok
              : { ...tok, status: "verifying" }
          )
        );
        if (accepted) {
          setStatusMessage(
            `"${currentBatch[verifySubStep]}": q(t) <= p(t) -- ACCEPTED`
          );
        } else {
          setStatusMessage(
            `"${currentBatch[verifySubStep]}": q(t) > p(t), coin flip fails -- REJECTED`
          );
        }
        setVerifySubStep((s) => s + 1);
      } else {
        setPhase("results");
        // Collect accepted
        const accepted = currentBatch.filter((_, i) => currentAcceptance[i]);
        setStatusMessage(
          `${accepted.length}/${currentBatch.length} tokens accepted. ${
            accepted.length < currentBatch.length
              ? "Sampling recovery token from adjusted distribution..."
              : "All accepted!"
          }`
        );
      }
    } else if (phase === "results") {
      const accepted = currentBatch.filter((_, i) => currentAcceptance[i]);
      const hasRejection = accepted.length < currentBatch.length;
      if (hasRejection) {
        setPhase("recovery");
        setShowRecovery(true);
        const recToken = RECOVERY_TOKENS[recoveryIndex];
        setStatusMessage(
          `Recovery token: "${recToken}" sampled from p'(t) = norm(max(0, p(t) - q(t)))`
        );
      } else {
        // All accepted, just add them and move on
        setAcceptedTokens((prev) => [...prev, ...accepted]);
        const nextBatch = batchIndex + 1;
        if (nextBatch >= DRAFT_GUESSES.length) {
          setPhase("done");
          setStatusMessage(
            "Generation complete! All tokens decoded with speculative decoding."
          );
        } else {
          setBatchIndex(nextBatch);
          setPhase("idle");
          setDraftTokens([]);
          setDraftSubStep(0);
          setVerifySubStep(0);
          setStatusMessage("Ready for next batch...");
        }
      }
    } else if (phase === "recovery") {
      // Commit this batch: accepted tokens + recovery token
      const accepted = currentBatch.filter((_, i) => currentAcceptance[i]);
      const recToken = RECOVERY_TOKENS[recoveryIndex];
      setAcceptedTokens((prev) => [...prev, ...accepted, recToken]);
      setRecoveryIndex((i) => i + 1);
      setShowRecovery(false);

      const nextBatch = batchIndex + 1;
      if (nextBatch >= DRAFT_GUESSES.length) {
        setPhase("done");
        setStatusMessage(
          "Generation complete! All tokens decoded with speculative decoding."
        );
      } else {
        setBatchIndex(nextBatch);
        setPhase("idle");
        setDraftTokens([]);
        setDraftSubStep(0);
        setVerifySubStep(0);
        setStatusMessage("Ready for next batch...");
      }
    }
  }, [batchIndex, phase, draftSubStep, verifySubStep, recoveryIndex]);

  // Auto-play
  useEffect(() => {
    if (mode !== "auto") return;
    autoRef.current = true;

    const tick = () => {
      if (!autoRef.current) return;
      advance();
      timerRef.current = setTimeout(tick, 700);
    };
    timerRef.current = setTimeout(tick, 500);

    return () => {
      autoRef.current = false;
      cleanup();
    };
  }, [mode, advance, cleanup]);

  // Stop auto when done
  useEffect(() => {
    if (phase === "done") {
      autoRef.current = false;
      cleanup();
      setMode("step");
    }
  }, [phase, cleanup]);

  const currentBatch = DRAFT_GUESSES[batchIndex] || [];
  const currentAcceptance = DRAFT_ACCEPTANCE[batchIndex] || [];

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
          gap: 12,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: ACCENT }}>
          Speculative Decoding Simulation
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (mode === "auto") {
                autoRef.current = false;
                cleanup();
                setMode("step");
              } else {
                advance();
              }
            }}
            disabled={phase === "done" && mode === "step"}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              background: phase === "done" ? "rgba(255,255,255,0.05)" : ACCENT_BG,
              border: `1px solid ${phase === "done" ? "rgba(255,255,255,0.1)" : ACCENT_BORDER}`,
              borderRadius: 6,
              color: phase === "done" ? DIM_TEXT : ACCENT,
              cursor: phase === "done" ? "default" : "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            {mode === "auto" ? "Pause" : "Next Step"}
          </button>
          <button
            onClick={() => {
              if (mode === "auto") return;
              setMode("auto");
            }}
            disabled={phase === "done" || mode === "auto"}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              background: mode === "auto" || phase === "done" ? "rgba(255,255,255,0.05)" : BLUE_BG,
              border: `1px solid ${mode === "auto" || phase === "done" ? "rgba(255,255,255,0.1)" : BLUE_BORDER}`,
              borderRadius: 6,
              color: mode === "auto" || phase === "done" ? DIM_TEXT : BLUE,
              cursor: mode === "auto" || phase === "done" ? "default" : "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            Auto-Play
          </button>
          <button
            onClick={reset}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: DIM_TEXT,
              cursor: "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Accepted tokens so far */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: DIM_TEXT, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
          Generated Output
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            minHeight: 32,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {acceptedTokens.length === 0 ? (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>...</span>
          ) : (
            acceptedTokens.map((tok, i) => (
              <span
                key={i}
                style={{
                  padding: "3px 8px",
                  fontSize: 14,
                  background: ACCENT_BG,
                  border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: 4,
                  color: ACCENT,
                }}
              >
                {tok}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Current batch */}
      {draftTokens.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* Draft model */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, color: BLUE, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Draft Model (fast)
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "8px 12px",
                  background: "rgba(96,165,250,0.04)",
                  borderRadius: 8,
                  border: `1px solid ${BLUE_BORDER}`,
                }}
              >
                {draftTokens.map((tok, i) => {
                  let bg = "rgba(255,255,255,0.04)";
                  let border = "rgba(255,255,255,0.08)";
                  let textColor = "rgba(255,255,255,0.3)";

                  if (tok.status === "drafting") {
                    bg = BLUE_BG;
                    border = BLUE_BORDER;
                    textColor = BLUE;
                  } else if (tok.status === "accepted") {
                    bg = ACCENT_BG;
                    border = ACCENT_BORDER;
                    textColor = ACCENT;
                  } else if (tok.status === "rejected") {
                    bg = RED_BG;
                    border = RED_BORDER;
                    textColor = RED;
                  } else if (tok.status === "verifying") {
                    bg = YELLOW_BG;
                    border = YELLOW_BORDER;
                    textColor = YELLOW;
                  }

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        fontSize: 14,
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 4,
                        color: textColor,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {tok.text}
                      {tok.status === "accepted" && (
                        <span style={{ fontSize: 15 }}>&#10003;</span>
                      )}
                      {tok.status === "rejected" && (
                        <span style={{ fontSize: 15 }}>&#10007;</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target model */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, color: YELLOW, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Target Model (verifying)
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "8px 12px",
                  background: "rgba(250,204,21,0.04)",
                  borderRadius: 8,
                  border: `1px solid ${YELLOW_BORDER}`,
                }}
              >
                {draftTokens.map((tok, i) => {
                  const isVerified = tok.status === "accepted" || tok.status === "rejected";
                  const isBeingVerified = tok.status === "verifying";

                  let bg = "rgba(255,255,255,0.04)";
                  let border = "rgba(255,255,255,0.08)";
                  let textColor = "rgba(255,255,255,0.2)";

                  if (isVerified && currentAcceptance[i]) {
                    bg = ACCENT_BG;
                    border = ACCENT_BORDER;
                    textColor = ACCENT;
                  } else if (isVerified && !currentAcceptance[i]) {
                    bg = RED_BG;
                    border = RED_BORDER;
                    textColor = RED;
                  } else if (isBeingVerified) {
                    bg = YELLOW_BG;
                    border = YELLOW_BORDER;
                    textColor = YELLOW;
                  }

                  return (
                    <div
                      key={i}
                      style={{
                        padding: "4px 10px",
                        fontSize: 14,
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 4,
                        color: textColor,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isVerified
                        ? currentAcceptance[i]
                          ? `p(t) >= q(t)`
                          : `p(t) < q(t)`
                        : isBeingVerified
                        ? "checking..."
                        : "---"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery token */}
      {showRecovery && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: YELLOW, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            Recovery Token (from adjusted distribution)
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: YELLOW_BG,
              border: `1px solid ${YELLOW_BORDER}`,
              borderRadius: 6,
              fontSize: 15,
              color: YELLOW,
            }}
          >
            <span style={{ fontSize: 15 }}>+</span>
            {RECOVERY_TOKENS[recoveryIndex]}
          </div>
        </div>
      )}

      {/* Status */}
      <div
        style={{
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.5,
        }}
      >
        {statusMessage}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 14,
          fontSize: 13,
          color: DIM_TEXT,
        }}
      >
        <span>
          <span style={{ color: BLUE }}>&#9632;</span> Draft token
        </span>
        <span>
          <span style={{ color: YELLOW }}>&#9632;</span> Verifying
        </span>
        <span>
          <span style={{ color: ACCENT }}>&#10003;</span> Accepted
        </span>
        <span>
          <span style={{ color: RED }}>&#10007;</span> Rejected
        </span>
        <span>
          <span style={{ color: YELLOW }}>+</span> Recovery
        </span>
      </div>
    </div>
  );
}
