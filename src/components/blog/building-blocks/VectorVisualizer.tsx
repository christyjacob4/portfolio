"use client";

const ACCENT = "#4ade80";
const FONT = "var(--font-geist-mono), ui-monospace, monospace";
const AXIS = "rgba(255,255,255,0.12)";
const GRID = "rgba(255,255,255,0.04)";
const DOT_R = 3.5;

const QW = 220;
const QH = 160;
const GAP = 40;
const PAD = 10;

function qx(col: number) { return PAD + col * (QW + GAP); }
function qy(row: number) { return PAD + row * (QH + GAP + 30); }

export default function VectorVisualizer() {
  const W = PAD * 2 + QW * 2 + GAP;
  const H = PAD * 2 + (QH + 30) * 2 + GAP;

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[580px]" preserveAspectRatio="xMidYMid meet" fontFamily={FONT}>

          {/* ===== 1D — Number line ===== */}
          <g transform={`translate(${qx(0)}, ${qy(0)})`}>
            <text x={QW/2} y={0} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} letterSpacing="0.1em">1D</text>
            <line x1={20} y1={QH/2} x2={QW-10} y2={QH/2} stroke={AXIS} strokeWidth={1} markerEnd="url(#varrow)" />
            {[0,1,2,3,4,5].map(i => {
              const x = 20 + i * (QW-40)/5;
              return <g key={i}>
                <line x1={x} y1={QH/2-5} x2={x} y2={QH/2+5} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                <text x={x} y={QH/2+14} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={6}>{i}</text>
              </g>;
            })}
            <circle cx={20 + 3*(QW-40)/5} cy={QH/2} r={DOT_R} fill={ACCENT} />
            <text x={QW/2} y={QH+16} textAnchor="middle" fill={ACCENT} fontSize={10}>[3]</text>
            <text x={QW/2} y={QH+28} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontStyle="italic">temperature</text>
          </g>

          {/* ===== 2D — Coordinate plane ===== */}
          <g transform={`translate(${qx(1)}, ${qy(0)})`}>
            <text x={QW/2} y={0} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} letterSpacing="0.1em">2D</text>
            {[1,2,3,4,5,6,7,8].map(i => {
              const x = 30 + i * (QW-40)/9;
              const y = QH - 10 - i * (QH-20)/9;
              return <g key={i}>
                <line x1={x} y1={10} x2={x} y2={QH-10} stroke={GRID} strokeWidth={0.5} />
                <line x1={30} y1={y} x2={QW-10} y2={y} stroke={GRID} strokeWidth={0.5} />
              </g>;
            })}
            <line x1={30} y1={QH-10} x2={QW-5} y2={QH-10} stroke={AXIS} strokeWidth={1} markerEnd="url(#varrow)" />
            <line x1={30} y1={QH-10} x2={30} y2={8} stroke={AXIS} strokeWidth={1} markerEnd="url(#varrow)" />
            {(() => {
              const px = 30 + 3*(QW-40)/9;
              const py = QH - 10 - 7*(QH-20)/9;
              return <>
                <line x1={30} y1={QH-10} x2={px} y2={py} stroke={ACCENT} strokeWidth={1.5} opacity={0.6} />
                <circle cx={px} cy={py} r={DOT_R} fill={ACCENT} />
              </>;
            })()}
            <text x={QW/2} y={QH+16} textAnchor="middle" fill={ACCENT} fontSize={10}>[3, 7]</text>
            <text x={QW/2} y={QH+28} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontStyle="italic">position on a map</text>
          </g>

          {/* ===== 3D — Isometric axes ===== */}
          <g transform={`translate(${qx(0)}, ${qy(1)})`}>
            <text x={QW/2} y={0} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} letterSpacing="0.1em">3D</text>
            {(() => {
              const ox = QW/2;
              const oy = QH * 0.6;
              const len = 65;
              const cos30 = Math.cos(Math.PI/6);
              const sin30 = Math.sin(Math.PI/6);
              const xEnd = [ox + len*cos30, oy + len*sin30];
              const yEnd = [ox, oy - len*1.1];
              const zEnd = [ox - len*cos30, oy + len*sin30];
              // Point clearly offset in all 3 axes: (5,3,2)
              const s = 10;
              const px = ox + 5*s*cos30 - 2*s*cos30;
              const py = oy + 5*s*sin30 + 2*s*sin30 - 3*s;
              return <>
                <line x1={ox} y1={oy} x2={xEnd[0]} y2={xEnd[1]} stroke={AXIS} strokeWidth={1} markerEnd="url(#varrow)" />
                <line x1={ox} y1={oy} x2={yEnd[0]} y2={yEnd[1]} stroke={AXIS} strokeWidth={1} markerEnd="url(#varrow)" />
                <line x1={ox} y1={oy} x2={zEnd[0]} y2={zEnd[1]} stroke={AXIS} strokeWidth={1} markerEnd="url(#varrow)" />
                <text x={xEnd[0]+6} y={xEnd[1]+2} fill="rgba(255,255,255,0.2)" fontSize={7}>x</text>
                <text x={yEnd[0]-2} y={yEnd[1]-4} fill="rgba(255,255,255,0.2)" fontSize={7} textAnchor="middle">y</text>
                <text x={zEnd[0]-6} y={zEnd[1]+2} fill="rgba(255,255,255,0.2)" fontSize={7} textAnchor="end">z</text>
                {/* Dashed projections for clarity */}
                <line x1={ox} y1={oy} x2={ox + 5*s*cos30} y2={oy + 5*s*sin30} stroke={ACCENT} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.2} />
                <line x1={ox + 5*s*cos30} y1={oy + 5*s*sin30} x2={px} y2={oy + 5*s*sin30 + 2*s*sin30} stroke={ACCENT} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.2} />
                <line x1={px} y1={oy + 5*s*sin30 + 2*s*sin30} x2={px} y2={py} stroke={ACCENT} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.2} />
                <line x1={ox} y1={oy} x2={px} y2={py} stroke={ACCENT} strokeWidth={1} opacity={0.5} />
                <circle cx={px} cy={py} r={DOT_R} fill={ACCENT} />
              </>;
            })()}
            <text x={QW/2} y={QH+16} textAnchor="middle" fill={ACCENT} fontSize={10}>[5, 3, 2]</text>
            <text x={QW/2} y={QH+28} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontStyle="italic">color (RGB)</text>
          </g>

          {/* ===== 768D — Abstract cells ===== */}
          <g transform={`translate(${qx(1)}, ${qy(1)})`}>
            <text x={QW/2} y={0} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} letterSpacing="0.1em">768D</text>
            {(() => {
              const cellSize = 9;
              const cellGap = 2;
              const cols = 16;
              const rows = 6;
              const totalW = cols * (cellSize + cellGap);
              const totalH = rows * (cellSize + cellGap);
              const startX = (QW - totalW) / 2;
              const startY = QH / 2 - totalH / 2;
              const opacities = [
                [0.3,0.7,0.5,0.9,0.2,0.6,0.8,0.4,0.7,0.3,0.5,0.8,0.6,0.4,0.9,0.2],
                [0.6,0.4,0.8,0.3,0.7,0.5,0.2,0.9,0.4,0.6,0.3,0.7,0.8,0.5,0.4,0.6],
                [0.4,0.6,0.3,0.7,0.9,0.5,0.6,0.2,0.8,0.4,0.7,0.3,0.5,0.9,0.6,0.4],
                [0.7,0.3,0.6,0.5,0.4,0.8,0.3,0.7,0.5,0.9,0.2,0.6,0.4,0.3,0.7,0.8],
                [0.5,0.8,0.4,0.6,0.3,0.7,0.9,0.5,0.3,0.7,0.6,0.4,0.8,0.2,0.5,0.7],
                [0.2,0.5,0.7,0.4,0.8,0.3,0.6,0.4,0.7,0.5,0.8,0.9,0.3,0.6,0.4,0.5],
              ];
              return <>
                {opacities.map((row, ri) =>
                  row.map((op, ci) => (
                    <rect
                      key={`${ri}-${ci}`}
                      x={startX + ci * (cellSize + cellGap)}
                      y={startY + ri * (cellSize + cellGap)}
                      width={cellSize}
                      height={cellSize}
                      rx={1}
                      fill={ACCENT}
                      opacity={op * 0.4 + 0.05}
                    />
                  ))
                )}
                <text
                  x={startX + totalW + 8}
                  y={startY + totalH / 2}
                  fill="rgba(255,255,255,0.2)"
                  fontSize={10}
                  dominantBaseline="central"
                >
                  ...
                </text>
              </>;
            })()}
            <text x={QW/2} y={QH+16} textAnchor="middle" fill={ACCENT} fontSize={10}>[0.2, 0.8, -0.1, ..., 0.5]</text>
            <text x={QW/2} y={QH+28} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontStyle="italic">word embedding</text>
          </g>

          <defs>
            <marker id="varrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
              <path d="M 0 1 L 7 4 L 0 7 z" fill={AXIS} />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}
