"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Sentence {
  words: string[];
  label: string;
}

const SENTENCE_A: Sentence = {
  words: ["dog", "bites", "man"],
  label: "Sentence A",
};

const SENTENCE_B: Sentence = {
  words: ["man", "bites", "dog"],
  label: "Sentence B",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WordBox({
  word,
  position,
  showPosition,
  isDistinct,
}: {
  word: string;
  position: number;
  showPosition: boolean;
  isDistinct: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0">
      <div
        className="flex items-center justify-center rounded-md border px-5 py-2.5"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 14,
          color: isDistinct ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)",
          borderColor: isDistinct
            ? `rgba(74,222,128,0.4)`
            : "rgba(255,255,255,0.1)",
          backgroundColor: isDistinct
            ? "rgba(74,222,128,0.08)"
            : "rgba(255,255,255,0.03)",
          transition: "border-color 0.3s ease, background-color 0.3s ease",
        }}
      >
        {word}
      </div>

      {/* Position tag with slide-down animation */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: showPosition ? 28 : 0,
          opacity: showPosition ? 1 : 0,
          transition: "max-height 0.35s ease, opacity 0.3s ease",
        }}
      >
        <div
          className="mt-1.5 rounded-sm px-2 py-0.5"
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: isDistinct ? ACCENT : "rgba(255,255,255,0.5)",
            backgroundColor: isDistinct
              ? "rgba(74,222,128,0.1)"
              : "rgba(255,255,255,0.05)",
            transition: "color 0.3s ease, background-color 0.3s ease",
          }}
        >
          pos: {position}
        </div>
      </div>
    </div>
  );
}

function SentenceRow({
  sentence,
  showPositions,
  isDistinct,
}: {
  sentence: Sentence;
  showPositions: boolean;
  isDistinct: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.05em",
          textTransform: "uppercase" as const,
        }}
      >
        {sentence.label}
      </span>

      <div className="flex items-start gap-3">
        {sentence.words.map((word, index) => (
          <WordBox
            key={`${sentence.label}-${index}`}
            word={word}
            position={index}
            showPosition={showPositions}
            isDistinct={isDistinct && showPositions}
          />
        ))}
      </div>
    </div>
  );
}

function RepresentationLabel({ showPositions }: { showPositions: boolean }) {
  return (
    <div
      className="rounded-md px-4 py-2 text-center"
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: showPositions ? ACCENT : "rgba(255,255,255,0.45)",
        backgroundColor: showPositions
          ? "rgba(74,222,128,0.06)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${showPositions ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`,
        transition: "color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      {showPositions
        ? "With positions: distinct representations"
        : "Bag of words: identical representations"}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SequenceOrderDemo() {
  const [showPositions, setShowPositions] = useState(false);

  return (
    <div className="not-prose my-8 rounded-xl p-6">
      <div className="flex flex-col items-center gap-6">
        <SentenceRow
          sentence={SENTENCE_A}
          showPositions={showPositions}
          isDistinct={false}
        />

        <SentenceRow
          sentence={SENTENCE_B}
          showPositions={showPositions}
          isDistinct={true}
        />

        <RepresentationLabel showPositions={showPositions} />

        <button
          type="button"
          onClick={() => setShowPositions((prev) => !prev)}
          className="rounded-md px-4 py-2 transition-colors duration-200"
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: showPositions ? "white" : "rgba(255,255,255,0.7)",
            backgroundColor: showPositions ? ACCENT : "rgba(255,255,255,0.06)",
            border: `1px solid ${showPositions ? ACCENT : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {showPositions ? "Hide position encoding" : "Show position encoding"}
        </button>
      </div>
    </div>
  );
}
