"use client";

import { useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const D_MODEL = 16;
const MIN_SEQUENCE_LENGTH = 8;
const MAX_SEQUENCE_LENGTH = 64;
const DEFAULT_SEQUENCE_LENGTH = 32;

const CELL_HEIGHT = 20;
const Y_AXIS_LABEL_WIDTH = 40;
const X_AXIS_LABEL_HEIGHT = 24;
const HEATMAP_MAX_WIDTH = 700;

// ---------------------------------------------------------------------------
// Positional encoding math
// ---------------------------------------------------------------------------

type EncodingType = "sin" | "cos";

interface CellInfo {
  position: number;
  dimension: number;
  value: number;
  encodingType: EncodingType;
}

function computePositionalEncodings(
  sequenceLength: number,
  dModel: number,
): number[][] {
  const encodings: number[][] = [];

  for (let dim = 0; dim < dModel; dim++) {
    const row: number[] = [];
    const i = Math.floor(dim / 2);
    const denominator = Math.pow(10000, (2 * i) / dModel);

    for (let pos = 0; pos < sequenceLength; pos++) {
      const angle = pos / denominator;
      row.push(dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
    }

    encodings.push(row);
  }

  return encodings;
}

// ---------------------------------------------------------------------------
// Color mapping: diverging scale from blue (negative) to orange (positive)
// ---------------------------------------------------------------------------

function encodingValueToColor(value: number): string {
  if (value >= 0) {
    const opacity = value;
    return `rgba(74, 222, 128, ${(opacity * 0.85 + 0.05).toFixed(3)})`;
  }

  const opacity = Math.abs(value);
  return `rgba(80, 130, 200, ${(opacity * 0.7 + 0.05).toFixed(3)})`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Tooltip({ cell, x, y }: { cell: CellInfo; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-10 rounded bg-black/90 px-3 py-2 font-mono text-xs text-white shadow-lg"
      style={{ left: x, top: y, transform: "translate(-50%, -120%)" }}
    >
      <div className="flex flex-col gap-0.5">
        <span>
          pos: <span style={{ color: ACCENT }}>{cell.position}</span>
          {" | "}dim: <span style={{ color: ACCENT }}>{cell.dimension}</span>
        </span>
        <span>
          {cell.encodingType}({cell.position} / 10000
          <sup>{((2 * Math.floor(cell.dimension / 2)) / D_MODEL).toFixed(2)}</sup>)
        </span>
        <span>
          value:{" "}
          <span
            style={{
              color: cell.value >= 0 ? ACCENT : "rgb(80,130,200)",
            }}
          >
            {cell.value >= 0 ? "+" : ""}
            {cell.value.toFixed(4)}
          </span>
        </span>
      </div>
    </div>
  );
}

function ColorLegend() {
  return (
    <div className="mt-4 flex items-center justify-center gap-3 font-mono text-[10px] text-white/50">
      <span>-1</span>
      <div
        className="h-3 w-16 rounded-sm"
        style={{
          background: "linear-gradient(to right, rgba(80,130,200,0.75), transparent)",
        }}
      />
      <span>0</span>
      <div
        className="h-3 w-16 rounded-sm"
        style={{
          background: `linear-gradient(to right, transparent, ${ACCENT})`,
        }}
      />
      <span>+1</span>
    </div>
  );
}

function SequenceLengthSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (length: number) => void;
}) {
  return (
    <div className="mt-5 flex items-center gap-4">
      <label className="shrink-0 font-mono text-[11px] text-white/50">
        Sequence length
      </label>
      <input
        type="range"
        min={MIN_SEQUENCE_LENGTH}
        max={MAX_SEQUENCE_LENGTH}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#4ade80]
          [&::-webkit-slider-thumb]:shadow-md
          [&::-moz-range-thumb]:h-3.5
          [&::-moz-range-thumb]:w-3.5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:bg-[#4ade80]"
      />
      <span className="shrink-0 font-mono text-xs tabular-nums text-white/70">
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PositionalEncoding() {
  const [sequenceLength, setSequenceLength] = useState(DEFAULT_SEQUENCE_LENGTH);
  const [hoveredCell, setHoveredCell] = useState<CellInfo | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [hoveredDimension, setHoveredDimension] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const encodings = useMemo(
    () => computePositionalEncodings(sequenceLength, D_MODEL),
    [sequenceLength],
  );

  const cellWidth = Math.max(
    4,
    Math.min(16, Math.floor((HEATMAP_MAX_WIDTH - Y_AXIS_LABEL_WIDTH) / sequenceLength)),
  );

  const handleCellMouseEnter = useCallback(
    (
      dim: number,
      pos: number,
      value: number,
      event: React.MouseEvent<HTMLDivElement>,
    ) => {
      const encodingType: EncodingType = dim % 2 === 0 ? "sin" : "cos";
      setHoveredCell({ position: pos, dimension: dim, value, encodingType });
      setHoveredPosition(pos);
      setHoveredDimension(dim);

      const container = event.currentTarget.closest("[data-pe-container]");
      if (container) {
        const rect = event.currentTarget.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top,
        });
      }
    },
    [],
  );

  const handleCellMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setHoveredPosition(null);
    setHoveredDimension(null);
  }, []);

  // Show tick labels on the x-axis at regular intervals
  const positionTickInterval = sequenceLength <= 16 ? 1 : sequenceLength <= 32 ? 4 : 8;

  return (
    <div className="not-prose my-8 flex flex-col items-center rounded-xl p-6">
      <div className="relative w-full overflow-x-auto" data-pe-container>
        {hoveredCell && (
          <Tooltip
            cell={hoveredCell}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        )}

        {/* Y-axis label */}
        <div className="flex items-start">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: Y_AXIS_LABEL_WIDTH, height: D_MODEL * CELL_HEIGHT }}
          >
            <span
              className="font-mono text-[10px] tracking-wider text-white/40"
              style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
            >
              Dimension
            </span>
          </div>

          <div className="flex flex-col">
            {/* Heatmap grid */}
            <div className="flex flex-col">
              {encodings.map((row, dim) => (
                <div key={dim} className="flex">
                  {/* Dimension label */}
                  <div
                    className="flex shrink-0 items-center justify-end pr-1.5 font-mono text-[9px] transition-colors duration-100"
                    style={{
                      width: 20,
                      height: CELL_HEIGHT,
                      color:
                        hoveredDimension === dim
                          ? ACCENT
                          : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {dim}
                  </div>

                  {/* Row of cells */}
                  {row.map((value, pos) => {
                    const isHovered =
                      hoveredCell?.position === pos &&
                      hoveredCell?.dimension === dim;
                    const isInCrosshair =
                      hoveredPosition === pos || hoveredDimension === dim;
                    const isDimmed =
                      hoveredCell !== null && !isInCrosshair;

                    return (
                      <div
                        key={pos}
                        style={{
                          width: cellWidth,
                          height: CELL_HEIGHT,
                          padding: 0.5,
                          opacity: isDimmed ? 0.3 : 1,
                          transition: "opacity 100ms ease",
                        }}
                        onMouseEnter={(e) =>
                          handleCellMouseEnter(dim, pos, value, e)
                        }
                        onMouseLeave={handleCellMouseLeave}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: encodingValueToColor(value),
                            borderRadius: 1,
                            outline: isHovered
                              ? `1.5px solid ${ACCENT}`
                              : "none",
                            outlineOffset: isHovered ? -1 : 0,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* X-axis tick labels */}
            <div className="flex" style={{ paddingLeft: 20 }}>
              {Array.from({ length: sequenceLength }, (_, pos) => (
                <div
                  key={pos}
                  className="flex items-start justify-center font-mono text-[9px] transition-colors duration-100"
                  style={{
                    width: cellWidth,
                    height: X_AXIS_LABEL_HEIGHT,
                    paddingTop: 3,
                    color:
                      hoveredPosition === pos
                        ? ACCENT
                        : "rgba(255,255,255,0.35)",
                    visibility:
                      pos % positionTickInterval === 0 ? "visible" : "hidden",
                  }}
                >
                  {pos}
                </div>
              ))}
            </div>

            {/* X-axis label */}
            <div
              className="text-center font-mono text-[10px] tracking-wider text-white/40"
              style={{ paddingLeft: 20 }}
            >
              Position
            </div>
          </div>
        </div>
      </div>

      <ColorLegend />
      <SequenceLengthSlider value={sequenceLength} onChange={setSequenceLength} />
    </div>
  );
}
