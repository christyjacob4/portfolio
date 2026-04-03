"use client";

// Data from: "Counting Ability of Large Language Models and Impact of Tokenization"
// arxiv 2410.19730 — GPT-4o mini, with/without CoT
const DATA = [
  {
    format: "Raw BPE",
    description: "Natural subword tokens",
    color: "bg-rose-500",
    accuracies: [45.7, 9.1, 2.0],
  },
  {
    format: "Space-delimited",
    description: "a b b a b …",
    color: "bg-amber-500",
    accuracies: [71.2, 38.4, 14.6],
  },
  {
    format: "Comma-delimited",
    description: "a, b, b, a, b …",
    color: "bg-blue-500",
    accuracies: [88.3, 62.1, 31.4],
  },
  {
    format: "Character-separated",
    description: "Each letter = 1 token",
    color: "bg-emerald-500",
    accuracies: [96.8, 81.6, 56.1],
  },
];

const LENGTHS = ["10-20 chars", "20-30 chars", "30-40 chars"];

export default function CountingAccuracyChart() {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-5">
      <div>
        <p className="text-xs text-neutral-400 font-mono">
          GPT-4o mini — letter counting accuracy by input format (with chain-of-thought)
        </p>
        <p className="text-[10px] text-neutral-600 mt-0.5 font-mono">Source: arxiv 2410.19730</p>
      </div>

      {/* Grouped bar chart */}
      <div className="space-y-6">
        {LENGTHS.map((len, li) => (
          <div key={len}>
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-mono">{len}</div>
            <div className="space-y-2">
              {DATA.map((d) => (
                <div key={d.format} className="flex items-center gap-3">
                  <div className="w-32 text-[11px] text-neutral-400 font-mono shrink-0">{d.format}</div>
                  <div className="flex-1 bg-neutral-900 rounded-full h-5 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all duration-700`}
                      style={{ width: `${d.accuracies[li]}%` }}
                    />
                    <span className="absolute right-2 top-0 h-full flex items-center text-[10px] font-mono text-neutral-300">
                      {d.accuracies[li]}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-2">
        {DATA.map((d) => (
          <div key={d.format} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${d.color} shrink-0`} />
            <span className="text-[10px] text-neutral-500 font-mono">{d.format}: {d.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
