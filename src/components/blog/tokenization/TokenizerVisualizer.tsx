"use client";

import { useState } from "react";

// Pre-computed tokenizations (cl100k_base / GPT-4)
// Generated from tiktoken experiments
const TOKENIZATIONS: Record<string, string[]> = {
  mississippi: ["miss", "issippi"],
  strawberry: ["str", "aw", "berry"],
  hippopotamus: ["hip", "pop", "ot", "amus"],
  mammography: ["m", "amm", "ography"],
  bookkeeper: ["book", "keeper"],
  referral: ["ref", "erral"],
  banana: ["banana"],
  programming: ["programming"],
  attention: ["attention"],
  neural: ["ne", "ural"],
  acceleration: ["accel", "eration"],
  occasionally: ["occ", "asionally"],
  llama: ["ll", "ama"],
  "the cat sat": ["the", " cat", " sat"],
  hello: ["hello"],
  world: ["world"],
};

const TOKEN_COLORS = [
  { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300" },
  { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300" },
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300" },
  { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-300" },
  { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-300" },
];

const PRESETS = ["mississippi", "strawberry", "hippopotamus", "bookkeeper", "banana", "attention", "neural"];

interface Props {
  targetChar?: string;
}

export default function TokenizerVisualizer({ targetChar = "s" }: Props) {
  const [input, setInput] = useState("mississippi");
  const [searchChar, setSearchChar] = useState(targetChar);

  const lower = input.toLowerCase().trim();
  const tokens = TOKENIZATIONS[lower] ?? [input]; // fallback: treat whole word as one token

  const isKnown = lower in TOKENIZATIONS;
  const actualCount = input.split("").filter((c) => c.toLowerCase() === searchChar.toLowerCase()).length;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-5 font-mono text-sm">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] text-neutral-500 tracking-widest uppercase mb-1.5">Word</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 text-sm focus:outline-none focus:border-neutral-500"
            placeholder="type a word..."
          />
        </div>
        <div className="w-16">
          <label className="block text-[10px] text-neutral-500 tracking-widest uppercase mb-1.5">Count</label>
          <input
            value={searchChar}
            maxLength={1}
            onChange={(e) => setSearchChar(e.target.value.slice(-1))}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 text-sm text-center focus:outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((w) => (
          <button
            key={w}
            onClick={() => setInput(w)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] border transition-colors ${
              lower === w
                ? "bg-neutral-700 border-neutral-500 text-neutral-100"
                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Token display */}
      <div>
        <div className="text-[10px] text-neutral-500 tracking-widest uppercase mb-2">
          GPT-4 sees {tokens.length} token{tokens.length !== 1 ? "s" : ""} {!isKnown && "(estimated)"}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {tokens.map((tok, i) => {
            const col = TOKEN_COLORS[i % TOKEN_COLORS.length];
            const charCount = tok.split("").filter((c) => c.toLowerCase() === searchChar.toLowerCase()).length;
            return (
              <div key={i} className={`flex flex-col items-center gap-1`}>
                <span className={`px-3 py-1.5 rounded-lg border text-base font-bold ${col.bg} ${col.border} ${col.text}`}>
                  {tok}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {charCount} &apos;{searchChar}&apos;
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Character breakdown */}
      <div>
        <div className="text-[10px] text-neutral-500 tracking-widest uppercase mb-2">Character view</div>
        <div className="flex flex-wrap gap-1">
          {input.split("").map((char, i) => {
            const isTarget = char.toLowerCase() === searchChar.toLowerCase();
            // Find which token this character belongs to
            let charIdx = 0;
            let tokenIdx = 0;
            for (let t = 0; t < tokens.length; t++) {
              if (i < charIdx + tokens[t].length) { tokenIdx = t; break; }
              charIdx += tokens[t].length;
            }
            const col = TOKEN_COLORS[tokenIdx % TOKEN_COLORS.length];
            return (
              <span
                key={i}
                className={`w-7 h-7 flex items-center justify-center rounded text-sm border ${
                  isTarget
                    ? `font-bold ${col.bg} ${col.border} ${col.text}`
                    : `text-neutral-500 border-neutral-800 bg-neutral-900`
                }`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Result */}
      <div className="flex gap-4 pt-1 border-t border-neutral-800 text-xs text-neutral-400">
        <span>
          Actual &apos;{searchChar}&apos; count:{" "}
          <span className="text-white font-bold">{actualCount}</span>
        </span>
        <span>
          Tokens: <span className="text-white font-bold">{tokens.length}</span>
        </span>
        <span>
          Characters: <span className="text-white font-bold">{input.length}</span>
        </span>
      </div>
    </div>
  );
}
