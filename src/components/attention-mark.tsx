// Brand mark: a causal attention matrix. Deterministic, server-rendered, CSS-only fade-in.
const N = 11;

function weight(r: number, c: number) {
  if (c > r) return 0; // causal mask
  // pseudo-random but stable; diagonal and a few "heads" are brighter
  const h = Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233) * 43758.5453;
  const rnd = h - Math.floor(h);
  const diag = c === r ? 0.55 : 0;
  const stripe = c === 0 ? 0.3 : 0;
  return Math.min(1, 0.08 + rnd * 0.45 + diag + stripe);
}

export function AttentionMark({ className }: { className?: string }) {
  const size = 10;
  const gap = 3;
  const total = N * (size + gap) - gap;
  const cells: JSX.Element[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const w = weight(r, c);
      cells.push(
        <rect
          key={`${r}-${c}`}
          className="cell"
          style={{
            ["--d" as string]: (r + c) * 55,
            fill: w === 0 ? "none" : "hsl(var(--brand))",
            fillOpacity: w === 0 ? undefined : w,
            stroke: w === 0 ? "hsl(var(--border))" : "none",
          }}
          x={c * (size + gap)}
          y={r * (size + gap)}
          width={size}
          height={size}
          rx={2}
          strokeDasharray={w === 0 ? "2 3" : undefined}
        />,
      );
    }
  }
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      role="img"
      aria-label="A causal attention matrix: each token attends only to earlier tokens"
    >
      {cells}
    </svg>
  );
}
