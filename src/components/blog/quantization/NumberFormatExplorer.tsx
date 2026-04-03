"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SIGN_COLOR = "rgba(239, 68, 68, 0.85)";
const EXPONENT_COLOR = "rgba(96, 165, 250, 0.85)";
const MANTISSA_COLOR = "rgba(74, 222, 128, 0.85)";

const SIGN_BG = "rgba(239, 68, 68, 0.12)";
const EXPONENT_BG = "rgba(96, 165, 250, 0.12)";
const MANTISSA_BG = "rgba(74, 222, 128, 0.12)";

const BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";
const TEXT_BRIGHT = "rgba(255,255,255,0.9)";

// ---------------------------------------------------------------------------
// Number format definitions
// ---------------------------------------------------------------------------

interface NumberFormat {
  name: string;
  shortName: string;
  totalBits: number;
  signBits: number;
  exponentBits: number;
  mantissaBits: number;
  bias: number;
  description: string;
}

const FORMATS: NumberFormat[] = [
  {
    name: "FP32 (Single Precision)",
    shortName: "FP32",
    totalBits: 32,
    signBits: 1,
    exponentBits: 8,
    mantissaBits: 23,
    bias: 127,
    description: "Standard training precision. 4 bytes per parameter.",
  },
  {
    name: "FP16 (Half Precision)",
    shortName: "FP16",
    totalBits: 16,
    signBits: 1,
    exponentBits: 5,
    mantissaBits: 10,
    bias: 15,
    description: "Mixed precision training. Narrow dynamic range can overflow.",
  },
  {
    name: "BF16 (Brain Float)",
    shortName: "BF16",
    totalBits: 16,
    signBits: 1,
    exponentBits: 8,
    mantissaBits: 7,
    bias: 127,
    description: "Same range as FP32, less precision. Ideal for deep learning.",
  },
  {
    name: "INT8 (8-bit Integer)",
    shortName: "INT8",
    totalBits: 8,
    signBits: 1,
    exponentBits: 0,
    mantissaBits: 7,
    bias: 0,
    description: "Post-training quantization target. 256 discrete levels.",
  },
];

// ---------------------------------------------------------------------------
// Float to bits conversion
// ---------------------------------------------------------------------------

function floatToFP32Bits(value: number): number[] {
  const buffer = new ArrayBuffer(4);
  new Float32Array(buffer)[0] = value;
  const intVal = new Uint32Array(buffer)[0];
  const bits: number[] = [];
  for (let i = 31; i >= 0; i--) {
    bits.push((intVal >>> i) & 1);
  }
  return bits;
}

function floatToFP16Bits(value: number): number[] {
  // Convert through FP32 then down-convert
  const buffer32 = new ArrayBuffer(4);
  new Float32Array(buffer32)[0] = value;
  const fp32 = new Uint32Array(buffer32)[0];

  const sign = (fp32 >>> 31) & 1;
  let exponent = (fp32 >>> 23) & 0xff;
  let mantissa = fp32 & 0x7fffff;

  let fp16Exp: number;
  let fp16Man: number;

  if (exponent === 0) {
    // Zero or subnormal FP32 -> zero in FP16
    fp16Exp = 0;
    fp16Man = 0;
  } else if (exponent === 0xff) {
    // Inf or NaN
    fp16Exp = 0x1f;
    fp16Man = mantissa ? 0x200 : 0; // NaN vs Inf
  } else {
    const newExp = exponent - 127 + 15;
    if (newExp >= 0x1f) {
      // Overflow -> Inf
      fp16Exp = 0x1f;
      fp16Man = 0;
    } else if (newExp <= 0) {
      // Underflow -> zero
      fp16Exp = 0;
      fp16Man = 0;
    } else {
      fp16Exp = newExp;
      fp16Man = mantissa >>> 13;
    }
  }

  const fp16Val = (sign << 15) | (fp16Exp << 10) | fp16Man;
  const bits: number[] = [];
  for (let i = 15; i >= 0; i--) {
    bits.push((fp16Val >>> i) & 1);
  }
  return bits;
}

function floatToBF16Bits(value: number): number[] {
  const buffer = new ArrayBuffer(4);
  new Float32Array(buffer)[0] = value;
  const fp32 = new Uint32Array(buffer)[0];
  // BF16 is just the top 16 bits of FP32
  const bf16Val = fp32 >>> 16;
  const bits: number[] = [];
  for (let i = 15; i >= 0; i--) {
    bits.push((bf16Val >>> i) & 1);
  }
  return bits;
}

function floatToINT8Bits(value: number): number[] {
  // Symmetric quantization: map to [-127, 127]
  const clamped = Math.max(-127, Math.min(127, Math.round(value)));
  const unsigned = clamped < 0 ? 256 + clamped : clamped;
  const bits: number[] = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((unsigned >>> i) & 1);
  }
  return bits;
}

function getBitsForFormat(value: number, format: NumberFormat): number[] {
  switch (format.shortName) {
    case "FP32":
      return floatToFP32Bits(value);
    case "FP16":
      return floatToFP16Bits(value);
    case "BF16":
      return floatToBF16Bits(value);
    case "INT8":
      return floatToINT8Bits(value);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Reconstruct value from bits (to show precision loss)
// ---------------------------------------------------------------------------

function reconstructFP16(value: number): number {
  const bits = floatToFP16Bits(value);
  const sign = bits[0];
  let exp = 0;
  for (let i = 1; i <= 5; i++) exp = (exp << 1) | bits[i];
  let man = 0;
  for (let i = 6; i <= 15; i++) man = (man << 1) | bits[i];

  if (exp === 0 && man === 0) return sign ? -0 : 0;
  if (exp === 0x1f) return man ? NaN : sign ? -Infinity : Infinity;

  const mantissa = 1 + man / 1024;
  const result = Math.pow(2, exp - 15) * mantissa;
  return sign ? -result : result;
}

function reconstructBF16(value: number): number {
  const bits = floatToBF16Bits(value);
  const sign = bits[0];
  let exp = 0;
  for (let i = 1; i <= 8; i++) exp = (exp << 1) | bits[i];
  let man = 0;
  for (let i = 9; i <= 15; i++) man = (man << 1) | bits[i];

  if (exp === 0 && man === 0) return sign ? -0 : 0;
  if (exp === 0xff) return man ? NaN : sign ? -Infinity : Infinity;

  const mantissa = 1 + man / 128;
  const result = Math.pow(2, exp - 127) * mantissa;
  return sign ? -result : result;
}

function reconstructINT8(value: number): number {
  return Math.max(-127, Math.min(127, Math.round(value)));
}

function getReconstructedValue(value: number, format: NumberFormat): number {
  switch (format.shortName) {
    case "FP32":
      return value;
    case "FP16":
      return reconstructFP16(value);
    case "BF16":
      return reconstructBF16(value);
    case "INT8":
      return reconstructINT8(value);
    default:
      return value;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NumberFormatExplorer() {
  const [inputValue, setInputValue] = useState("3.14");
  const [selectedFormat, setSelectedFormat] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const numericValue = useMemo(() => {
    const v = parseFloat(inputValue);
    return isNaN(v) ? 0 : v;
  }, [inputValue]);

  const format = FORMATS[selectedFormat];
  const bits = useMemo(
    () => getBitsForFormat(numericValue, format),
    [numericValue, format]
  );
  const reconstructed = useMemo(
    () => getReconstructedValue(numericValue, format),
    [numericValue, format]
  );
  const error = Math.abs(numericValue - reconstructed);

  const getBitColor = useCallback(
    (index: number): string => {
      if (index < format.signBits) return SIGN_COLOR;
      if (index < format.signBits + format.exponentBits) return EXPONENT_COLOR;
      return MANTISSA_COLOR;
    },
    [format]
  );

  const getBitBg = useCallback(
    (index: number): string => {
      if (index < format.signBits) return SIGN_BG;
      if (index < format.signBits + format.exponentBits) return EXPONENT_BG;
      return MANTISSA_BG;
    },
    [format]
  );

  const getBitLabel = useCallback(
    (index: number): string => {
      if (index < format.signBits) return "S";
      if (index < format.signBits + format.exponentBits) return "E";
      return "M";
    },
    [format]
  );

  return (
    <div
      ref={containerRef}
      style={{
        background: BG,
        padding: "20px",
        fontFamily: FONT_MONO,
        color: TEXT_BRIGHT,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 13,
          color: TEXT_DIM,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Number Format Explorer
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label
            style={{ fontSize: 13, color: TEXT_DIM, display: "block", marginBottom: 6 }}
          >
            Enter a number
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              padding: "8px 12px",
              color: TEXT_BRIGHT,
              fontFamily: FONT_MONO,
              fontSize: 16,
              width: "100%",
              outline: "none",
            }}
          />
        </div>
        <div style={{ flex: "2 1 300px" }}>
          <label
            style={{ fontSize: 13, color: TEXT_DIM, display: "block", marginBottom: 6 }}
          >
            Format
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FORMATS.map((f, i) => (
              <button
                key={f.shortName}
                onClick={() => setSelectedFormat(i)}
                style={{
                  background:
                    i === selectedFormat
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    i === selectedFormat
                      ? "rgba(74,222,128,0.4)"
                      : BORDER
                  }`,
                  borderRadius: 4,
                  padding: "8px 14px",
                  color: i === selectedFormat ? ACCENT : TEXT_DIM,
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {f.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Format info */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 15, color: TEXT_BRIGHT, marginBottom: 4 }}>
          {format.name}
        </div>
        <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 8 }}>
          {format.description}
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, flexWrap: "wrap" }}>
          <span>
            <span style={{ color: SIGN_COLOR }}>Sign: {format.signBits}b</span>
          </span>
          {format.exponentBits > 0 && (
            <span>
              <span style={{ color: EXPONENT_COLOR }}>
                Exponent: {format.exponentBits}b
              </span>
            </span>
          )}
          <span>
            <span style={{ color: MANTISSA_COLOR }}>
              {format.exponentBits > 0 ? "Mantissa" : "Magnitude"}:{" "}
              {format.mantissaBits}b
            </span>
          </span>
          <span style={{ color: TEXT_DIM }}>Total: {format.totalBits} bits</span>
        </div>
      </div>

      {/* Bit display */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          marginBottom: 16,
          justifyContent: "center",
        }}
      >
        {bits.map((bit, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              width: format.totalBits > 16 ? 20 : 32,
              height: format.totalBits > 16 ? 36 : 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: getBitBg(i),
              border: `1px solid ${getBitColor(i)}40`,
              borderRadius: 3,
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                fontSize: format.totalBits > 16 ? 13 : 15,
                fontWeight: 600,
                color: getBitColor(i),
              }}
            >
              {bit}
            </span>
            <span
              style={{
                fontSize: 7,
                color: getBitColor(i),
                opacity: 0.6,
                position: "absolute",
                bottom: 2,
              }}
            >
              {getBitLabel(i)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          marginBottom: 20,
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: SIGN_COLOR,
              display: "inline-block",
            }}
          />
          <span style={{ color: TEXT_DIM }}>Sign</span>
        </span>
        {format.exponentBits > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: EXPONENT_COLOR,
                display: "inline-block",
              }}
            />
            <span style={{ color: TEXT_DIM }}>Exponent</span>
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: MANTISSA_COLOR,
              display: "inline-block",
            }}
          />
          <span style={{ color: TEXT_DIM }}>
            {format.exponentBits > 0 ? "Mantissa" : "Magnitude"}
          </span>
        </span>
      </div>

      {/* Reconstruction */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
            Original Value
          </div>
          <div style={{ fontSize: 16, color: TEXT_BRIGHT }}>
            {numericValue.toPrecision(8)}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
            Stored as {format.shortName}
          </div>
          <div style={{ fontSize: 16, color: ACCENT }}>
            {isNaN(reconstructed)
              ? "NaN"
              : !isFinite(reconstructed)
              ? reconstructed > 0
                ? "+Inf"
                : "-Inf"
              : reconstructed.toPrecision(8)}
          </div>
        </div>
        <div
          style={{
            background:
              error > 0
                ? "rgba(239, 68, 68, 0.05)"
                : "rgba(74,222,128,0.05)",
            border: `1px solid ${
              error > 0
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(74,222,128,0.2)"
            }`,
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
            Precision Loss
          </div>
          <div
            style={{
              fontSize: 16,
              color: error > 0 ? "rgba(239, 68, 68, 0.9)" : ACCENT,
            }}
          >
            {error === 0 ? "0 (exact)" : error.toExponential(4)}
          </div>
        </div>
      </div>

      {/* Memory comparison */}
      <div
        style={{
          marginTop: 20,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 10 }}>
          Memory per parameter comparison
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FORMATS.map((f) => {
            const bytes = f.totalBits / 8;
            const maxBytes = 4;
            const widthPct = (bytes / maxBytes) * 100;
            const isSelected = f.shortName === format.shortName;
            return (
              <div key={f.shortName} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 36,
                    fontSize: 13,
                    color: isSelected ? ACCENT : TEXT_DIM,
                    textAlign: "right",
                  }}
                >
                  {f.shortName}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 16,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: "100%",
                      background: isSelected
                        ? "rgba(74,222,128,0.3)"
                        : "rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 48,
                    fontSize: 13,
                    color: isSelected ? ACCENT : TEXT_DIM,
                    textAlign: "right",
                  }}
                >
                  {bytes}B
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
