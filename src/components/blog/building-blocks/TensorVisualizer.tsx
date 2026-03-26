"use client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

// Grid subdivisions per axis
const NX = 12; // embedding dim
const NY = 10; // sequence length
const NZ = 4; // batch size

// Visual size of each small cube
const CELL = 6;

// Total visual dimensions
const W = NX * CELL;
const H = NY * CELL;
const D = NZ * CELL;

// ---------------------------------------------------------------------------
// Isometric projection
// ---------------------------------------------------------------------------

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

function iso(x: number, y: number, z: number): [number, number] {
  return [
    (x - z) * COS30,
    -(x + z) * SIN30 - y,
  ];
}

function isoStr(cx: number, cy: number, x: number, y: number, z: number): string {
  const [sx, sy] = iso(x, y, z);
  return `${cx + sx},${cy + sy}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TensorVisualizer() {
  // Compute bounding box of all 8 corners to center the cube
  const allCorners = [
    iso(0,0,0), iso(W,0,0), iso(0,H,0), iso(W,H,0),
    iso(0,0,D), iso(W,0,D), iso(0,H,D), iso(W,H,D),
  ];
  const xs = allCorners.map(c => c[0]);
  const ys = allCorners.map(c => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;

  const svgW = bboxW + 40;
  const svgH = bboxH + 30;
  const cx = -minX + 20;
  const cy = -minY + 15;

  // Build individual cube faces for all 3 visible sides
  const frontCells: { points: string; brightness: number }[] = [];
  const topCells: { points: string; brightness: number }[] = [];
  const rightCells: { points: string; brightness: number }[] = [];

  for (let ix = 0; ix < NX; ix++) {
    for (let iy = 0; iy < NY; iy++) {
      const x0 = ix * CELL, x1 = x0 + CELL;
      const y0 = iy * CELL, y1 = y0 + CELL;
      const pts = `${isoStr(cx,cy,x0,y0,0)} ${isoStr(cx,cy,x1,y0,0)} ${isoStr(cx,cy,x1,y1,0)} ${isoStr(cx,cy,x0,y1,0)}`;
      const brightness = 0.06 + (ix / NX) * 0.04 + ((NY - iy) / NY) * 0.03;
      frontCells.push({ points: pts, brightness });
    }
  }

  for (let ix = 0; ix < NX; ix++) {
    for (let iz = 0; iz < NZ; iz++) {
      const x0 = ix * CELL, x1 = x0 + CELL;
      const z0 = iz * CELL, z1 = z0 + CELL;
      const pts = `${isoStr(cx,cy,x0,H,z0)} ${isoStr(cx,cy,x1,H,z0)} ${isoStr(cx,cy,x1,H,z1)} ${isoStr(cx,cy,x0,H,z1)}`;
      const brightness = 0.08 + (ix / NX) * 0.04 + ((NZ - iz) / NZ) * 0.03;
      topCells.push({ points: pts, brightness });
    }
  }

  for (let iy = 0; iy < NY; iy++) {
    for (let iz = 0; iz < NZ; iz++) {
      const y0 = iy * CELL, y1 = y0 + CELL;
      const z0 = iz * CELL, z1 = z0 + CELL;
      const pts = `${isoStr(cx,cy,W,y0,z0)} ${isoStr(cx,cy,W,y0,z1)} ${isoStr(cx,cy,W,y1,z1)} ${isoStr(cx,cy,W,y1,z0)}`;
      const brightness = 0.02 + ((NZ - iz) / NZ) * 0.03 + ((NY - iy) / NY) * 0.02;
      rightCells.push({ points: pts, brightness });
    }
  }

  // Axis label positions and angles
  const embStart = iso(0, 0, 0);
  const embEnd = iso(W, 0, 0);
  const embAngle = Math.atan2(embEnd[1] - embStart[1], embEnd[0] - embStart[0]) * (180 / Math.PI);
  const embMid = iso(W / 2, 0, 0);
  const embLabelX = cx + embMid[0];
  const embLabelY = cy + embMid[1] + 10;

  const seqStart = iso(0, 0, 0);
  const seqEnd = iso(0, H, 0);
  const seqAngle = Math.atan2(seqEnd[1] - seqStart[1], seqEnd[0] - seqStart[0]) * (180 / Math.PI);
  const seqMid = iso(0, H / 2, 0);
  const seqLabelX = cx + seqMid[0] - 8;
  const seqLabelY = cy + seqMid[1];

  const batchStart = iso(W, H, 0);
  const batchEnd = iso(W, H, D);
  const batchAngle = Math.atan2(batchEnd[1] - batchStart[1], batchEnd[0] - batchStart[0]) * (180 / Math.PI) + 180;
  const batchMid = iso(W, H, D / 2);
  const batchLabelX = cx + batchMid[0] + 8;
  const batchLabelY = cy + batchMid[1];

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${Math.ceil(svgW)} ${Math.ceil(svgH)}`} className="w-full max-w-[360px]" preserveAspectRatio="xMidYMid meet">
          {/* Front face — green (Embedding × Sequence) */}
          {frontCells.map((cell, i) => (
            <polygon
              key={`f${i}`}
              points={cell.points}
              fill={`rgba(74,222,128,${cell.brightness})`}
              stroke="rgba(74,222,128,0.18)"
              strokeWidth={0.5}
            />
          ))}

          {/* Top face — blue/teal (Embedding × Batch) */}
          {topCells.map((cell, i) => (
            <polygon
              key={`t${i}`}
              points={cell.points}
              fill={`rgba(100,200,235,${cell.brightness + 0.02})`}
              stroke="rgba(100,200,235,0.18)"
              strokeWidth={0.5}
            />
          ))}

          {/* Right face — warm amber (Batch × Sequence) */}
          {rightCells.map((cell, i) => (
            <polygon
              key={`r${i}`}
              points={cell.points}
              fill={`rgba(220,180,100,${cell.brightness})`}
              stroke="rgba(220,180,100,0.14)"
              strokeWidth={0.5}
            />
          ))}

          {/* Axis labels — rotated along each edge */}
          <text
            x={embLabelX}
            y={embLabelY}
            textAnchor="middle"
            fill="rgba(74,222,128,0.55)"
            fontSize={3.5}
            fontFamily={FONT_MONO}
            transform={`rotate(${embAngle}, ${embLabelX}, ${embLabelY})`}
          >
            embedding (768)
          </text>
          <text
            x={seqLabelX}
            y={seqLabelY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(74,222,128,0.55)"
            fontSize={3.5}
            fontFamily={FONT_MONO}
            transform={`rotate(${seqAngle}, ${seqLabelX}, ${seqLabelY})`}
          >
            sequence (512)
          </text>
          <text
            x={batchLabelX}
            y={batchLabelY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(220,180,100,0.55)"
            fontSize={3.5}
            fontFamily={FONT_MONO}
            transform={`rotate(${batchAngle}, ${batchLabelX}, ${batchLabelY})`}
          >
            batch (32)
          </text>
        </svg>
      </div>

      <p className="mt-2 text-center text-xs text-white/35" style={{ fontFamily: FONT_MONO }}>
        32 × 512 × 768 ={" "}
        <span style={{ color: ACCENT, fontWeight: 600 }}>
          12,582,912
        </span>
        {" "}elements per forward pass
      </p>
    </div>
  );
}
