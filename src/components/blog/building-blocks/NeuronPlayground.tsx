"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";

const SLIDER_MIN = -2;
const SLIDER_MAX = 2;
const SLIDER_STEP = 0.1;

type ActivationName = "ReLU" | "Sigmoid" | "Tanh";

const ACTIVATION_FUNCTIONS: Record<ActivationName, (z: number) => number> = {
  ReLU: (z) => Math.max(0, z),
  Sigmoid: (z) => 1 / (1 + Math.exp(-z)),
  Tanh: (z) => Math.tanh(z),
};

const ACTIVATION_NAMES: ActivationName[] = ["ReLU", "Sigmoid", "Tanh"];

// ---------------------------------------------------------------------------
// SVG Neuron Diagram
// ---------------------------------------------------------------------------

function NeuronDiagram({
  x1,
  x2,
  w1,
  w2,
  output,
}: {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  output: number;
}) {
  const svgWidth = 560;
  const svgHeight = 260;

  // Node positions — spread across the wider SVG
  const inputX = 70;
  const input1Y = 70;
  const input2Y = 190;
  const neuronX = 260;
  const neuronY = 130;
  const neuronRadius = 36;
  const activationX = 400;
  const activationY = neuronY;
  const outputX = 510;

  // Line opacity based on weight magnitude
  const w1Opacity = Math.min(1, 0.2 + Math.abs(w1) * 0.4);
  const w2Opacity = Math.min(1, 0.2 + Math.abs(w2) * 0.4);

  // Stroke width based on weight magnitude
  const w1Width = 1 + Math.abs(w1) * 0.8;
  const w2Width = 1 + Math.abs(w2) * 0.8;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full max-w-[560px]"
      style={{ fontFamily: FONT_MONO }}
    >
      {/* Connection lines */}
      <line
        x1={inputX + 20}
        y1={input1Y}
        x2={neuronX - neuronRadius}
        y2={neuronY}
        stroke={w1 >= 0 ? ACCENT : "rgba(100,200,255,0.8)"}
        strokeWidth={w1Width}
        opacity={w1Opacity}
      />
      <line
        x1={inputX + 20}
        y1={input2Y}
        x2={neuronX - neuronRadius}
        y2={neuronY}
        stroke={w2 >= 0 ? ACCENT : "rgba(100,200,255,0.8)"}
        strokeWidth={w2Width}
        opacity={w2Opacity}
      />

      {/* Weight labels on connections */}
      <text
        x={125}
        y={input1Y - 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={10}
      >
        w&#x2081; = {w1.toFixed(1)}
      </text>
      <text
        x={125}
        y={input2Y + 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={10}
      >
        w&#x2082; = {w2.toFixed(1)}
      </text>

      {/* Input nodes */}
      <circle
        cx={inputX}
        cy={input1Y}
        r={20}
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1}
      />
      <text
        x={inputX}
        y={input1Y - 5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
      >
        x&#x2081;
      </text>
      <text
        x={inputX}
        y={input1Y + 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontSize={11}
        fontWeight={600}
      >
        {x1.toFixed(1)}
      </text>

      <circle
        cx={inputX}
        cy={input2Y}
        r={20}
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1}
      />
      <text
        x={inputX}
        y={input2Y - 5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
      >
        x&#x2082;
      </text>
      <text
        x={inputX}
        y={input2Y + 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontSize={11}
        fontWeight={600}
      >
        {x2.toFixed(1)}
      </text>

      {/* Central neuron */}
      <circle
        cx={neuronX}
        cy={neuronY}
        r={neuronRadius}
        fill="rgba(255,255,255,0.04)"
        stroke={ACCENT}
        strokeWidth={1.5}
      />
      <text
        x={neuronX}
        y={neuronY + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.7)"
        fontSize={13}
        fontWeight={600}
      >
        &#x3A3; + b
      </text>

      {/* Arrow from neuron to activation */}
      <line
        x1={neuronX + neuronRadius}
        y1={neuronY}
        x2={activationX - 28}
        y2={activationY}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
      />
      <polygon
        points={`${activationX - 28},${activationY - 4} ${activationX - 28},${activationY + 4} ${activationX - 22},${activationY}`}
        fill="rgba(255,255,255,0.4)"
      />

      {/* Activation function box */}
      <rect
        x={activationX - 20}
        y={activationY - 18}
        width={48}
        height={36}
        rx={6}
        fill="rgba(74,222,128,0.1)"
        stroke={ACCENT}
        strokeWidth={1}
      />
      <text
        x={activationX + 4}
        y={activationY + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={ACCENT}
        fontSize={10}
        fontWeight={600}
      >
        f(z)
      </text>

      {/* Arrow from activation to output */}
      <line
        x1={activationX + 30}
        y1={activationY}
        x2={outputX - 10}
        y2={activationY}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
      />
      <polygon
        points={`${outputX - 10},${activationY - 4} ${outputX - 10},${activationY + 4} ${outputX - 4},${activationY}`}
        fill="rgba(255,255,255,0.4)"
      />

      {/* Output value */}
      <text
        x={outputX + 4}
        y={activationY + 1}
        dominantBaseline="central"
        fill={ACCENT}
        fontSize={14}
        fontWeight={700}
      >
        {output.toFixed(3)}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Slider Control
// ---------------------------------------------------------------------------

function ParameterSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-8 shrink-0 text-right text-[11px] text-white/50"
        style={{ fontFamily: FONT_MONO }}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <input
        type="range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={SLIDER_STEP}
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
      <span
        className="w-10 shrink-0 text-right tabular-nums text-xs text-white/70"
        style={{ fontFamily: FONT_MONO }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activation Toggle Buttons
// ---------------------------------------------------------------------------

function ActivationPicker({
  selected,
  onSelect,
}: {
  selected: ActivationName;
  onSelect: (name: ActivationName) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {ACTIVATION_NAMES.map((name) => {
        const isActive = name === selected;
        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className="rounded-md px-3 py-1 text-[11px] transition-colors duration-150"
            style={{
              fontFamily: FONT_MONO,
              backgroundColor: isActive
                ? "rgba(74,222,128,0.15)"
                : "rgba(255,255,255,0.04)",
              color: isActive ? ACCENT : "rgba(255,255,255,0.45)",
              border: isActive
                ? `1px solid ${ACCENT}`
                : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Computation Steps
// ---------------------------------------------------------------------------

function ComputationSteps({
  x1,
  x2,
  w1,
  w2,
  bias,
  activation,
  weightedSum,
  preActivation,
  output,
}: {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  bias: number;
  activation: ActivationName;
  weightedSum: number;
  preActivation: number;
  output: number;
}) {
  const product1 = w1 * x1;
  const product2 = w2 * x2;

  const steps = [
    {
      label: "w\u2081 \u00d7 x\u2081",
      expression: `${w1.toFixed(1)} \u00d7 ${x1.toFixed(1)}`,
      value: product1,
    },
    {
      label: "w\u2082 \u00d7 x\u2082",
      expression: `${w2.toFixed(1)} \u00d7 ${x2.toFixed(1)}`,
      value: product2,
    },
    {
      label: "sum + bias",
      expression: `${weightedSum.toFixed(3)} + ${bias.toFixed(1)}`,
      value: preActivation,
    },
    {
      label: `${activation}(${preActivation.toFixed(3)})`,
      expression: null,
      value: output,
      isOutput: true,
    },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-baseline gap-2 text-[11px]"
          style={{ fontFamily: FONT_MONO }}
        >
          <span className="text-white/40">{step.label}</span>
          {step.expression && (
            <>
              <span className="text-white/25">=</span>
              <span className="text-white/50">{step.expression}</span>
            </>
          )}
          <span className="text-white/25">=</span>
          <span
            className="font-semibold"
            style={{ color: step.isOutput ? ACCENT : "rgba(255,255,255,0.8)" }}
          >
            {step.value.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function NeuronPlayground() {
  const x1 = 1.0;
  const x2 = 0.5;
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(-0.6);
  const [bias, setBias] = useState(0.1);
  const [activation, setActivation] = useState<ActivationName>("ReLU");

  const { weightedSum, preActivation, output } = useMemo(() => {
    const ws = w1 * x1 + w2 * x2;
    const pre = ws + bias;
    const out = ACTIVATION_FUNCTIONS[activation](pre);
    return { weightedSum: ws, preActivation: pre, output: out };
  }, [x1, x2, w1, w2, bias, activation]);

  return (
    <div className="not-prose my-8 rounded-xl p-2">
      {/* Neuron diagram — front and center */}
      <div className="flex justify-center">
        <NeuronDiagram x1={x1} x2={x2} w1={w1} w2={w2} output={output} />
      </div>

      {/* Controls row — compact, centered */}
      <div className="mx-auto mt-6 max-w-lg">
        <div className="flex flex-col gap-2">
          <ParameterSlider label="w₁" value={w1} onChange={setW1} />
          <ParameterSlider label="w₂" value={w2} onChange={setW2} />
          <ParameterSlider label="bias" value={bias} onChange={setBias} />
        </div>

        {/* Activation + computation in a row */}
        <div className="mt-4 flex items-start gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-white/30" style={{ fontFamily: FONT_MONO }}>activation</span>
            <ActivationPicker selected={activation} onSelect={setActivation} />
          </div>
          <div className="flex-1 rounded-lg bg-white/[0.02] px-4 py-3">
            <ComputationSteps
              x1={x1} x2={x2} w1={w1} w2={w2}
              bias={bias} activation={activation}
              weightedSum={weightedSum} preActivation={preActivation} output={output}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
