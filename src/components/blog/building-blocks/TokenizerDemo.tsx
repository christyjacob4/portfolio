"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const DEFAULT_TEXT = "The unbelievable refrigerator hummed quietly.";

// ---------------------------------------------------------------------------
// Simulated BPE tokenization
// ---------------------------------------------------------------------------

const BPE_SPLITS: Record<string, string[]> = {
  The: ["The"],
  unbelievable: ["un", "believ", "able"],
  refrigerator: ["refrig", "erator"],
  hummed: ["hum", "med"],
  quietly: ["quiet", "ly"],
  ".": ["."],
  cat: ["cat"],
  dog: ["dog"],
  transformer: ["trans", "former"],
  embedding: ["embed", "ding"],
  attention: ["attention"],
  the: ["the"],
  is: ["is"],
  a: ["a"],
};

interface TokenGroup {
  word: string;
  subTokens: string[];
}

function tokenizeWord(word: string): string[] {
  if (BPE_SPLITS[word]) {
    return BPE_SPLITS[word];
  }
  return word.split("");
}

/**
 * Split raw input into words (preserving punctuation as separate tokens),
 * then apply simulated BPE to each word.
 */
function tokenize(text: string): TokenGroup[] {
  const rawWords = text.match(/[a-zA-Z']+|[^\s]/g);
  if (!rawWords) return [];

  return rawWords.map((word) => ({
    word,
    subTokens: tokenizeWord(word),
  }));
}

// ---------------------------------------------------------------------------
// Token chip
// ---------------------------------------------------------------------------

function TokenChip({
  token,
  useGreenTint,
}: {
  token: string;
  useGreenTint: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const borderColor = isHovered
    ? ACCENT
    : useGreenTint
      ? "rgba(74, 222, 128, 0.25)"
      : "rgba(255, 255, 255, 0.1)";

  const backgroundColor = isHovered ? "rgba(74, 222, 128, 0.12)" : "rgba(255, 255, 255, 0.05)";

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        fontFamily: FONT_MONO,
        fontSize: 12,
        lineHeight: "1.4",
        padding: "4px 8px",
        borderRadius: 6,
        border: `1px solid ${borderColor}`,
        backgroundColor,
        color: isHovered ? ACCENT : "rgba(255, 255, 255, 0.8)",
        cursor: "default",
        transition:
          "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
        whiteSpace: "pre",
      }}
    >
      {token}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TokenizerDemo() {
  const [text, setText] = useState(DEFAULT_TEXT);

  const tokenGroups = useMemo(() => tokenize(text), [text]);

  const totalTokens = tokenGroups.reduce(
    (sum, group) => sum + group.subTokens.length,
    0,
  );
  const totalWords = tokenGroups.length;

  // Assign alternating tint per token group so chips from the same word
  // share a visual rhythm and word boundaries are easy to spot.
  const chips = useMemo(() => {
    const result: { token: string; useGreenTint: boolean }[] = [];
    tokenGroups.forEach((group, groupIndex) => {
      const useGreenTint = groupIndex % 2 === 0;
      group.subTokens.forEach((subToken) => {
        result.push({ token: subToken, useGreenTint });
      });
    });
    return result;
  }, [tokenGroups]);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      {/* Input field */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a sentence..."
        aria-label="Text to tokenize"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "rgba(255, 255, 255, 0.9)",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Token chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 16,
          minHeight: 32,
        }}
      >
        {chips.map((chip, index) => (
          <TokenChip
            key={`${index}-${chip.token}`}
            token={chip.token}
            useGreenTint={chip.useGreenTint}
          />
        ))}
      </div>

      {/* Token count summary */}
      {totalTokens > 0 && (
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.35)",
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          {totalTokens} token{totalTokens !== 1 ? "s" : ""} from {totalWords}{" "}
          word{totalWords !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
