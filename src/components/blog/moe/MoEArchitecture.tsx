"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#4ade80";
const ACCENT_RGB = "74, 222, 128";
const FONT_MONO = "var(--font-geist-mono), ui-monospace, monospace";
const BG = "#0a0a0a";

type SelectedComponent =
  | null
  | "input"
  | "router"
  | "expert0"
  | "expert1"
  | "expert2"
  | "expert3"
  | "combiner"
  | "output"
  | "layernorm1"
  | "attention"
  | "layernorm2"
  | "moe";

interface ComponentInfo {
  title: string;
  description: string;
  math?: string;
}

const COMPONENT_INFO: Record<Exclude<SelectedComponent, null>, ComponentInfo> = {
  input: {
    title: "Input Tokens",
    description:
      "Token embeddings of shape (batch, seq_len, d_model). Each token is a dense vector representing its semantic content plus positional information.",
  },
  router: {
    title: "Gating Network (Router)",
    description:
      "A learned linear layer followed by softmax that produces routing probabilities. Maps each token to a probability distribution over all experts.",
    math: "G(x) = Softmax(W_g x + noise)",
  },
  expert0: {
    title: "Expert 0 (FFN)",
    description:
      "An independent feed-forward network. Typically two linear layers with a non-linearity: FFN(x) = W2 * ReLU(W1 * x). Each expert specializes in different patterns.",
  },
  expert1: {
    title: "Expert 1 (FFN)",
    description:
      "Each expert has its own unique parameters. Over training, experts naturally specialize - one might handle syntax, another semantics, another rare tokens.",
  },
  expert2: {
    title: "Expert 2 (FFN)",
    description:
      "Experts don't share weights. The total parameter count is num_experts x expert_size, but only Top-K experts are active per token.",
  },
  expert3: {
    title: "Expert 3 (FFN)",
    description:
      "With 8 experts and Top-2 routing, only 25% of expert parameters are used per token. This is the 'sparse' in sparse MoE.",
  },
  combiner: {
    title: "Weighted Combination",
    description:
      "The outputs of the selected experts are combined using the router's gating weights. This weighted sum produces the final MoE layer output for each token.",
    math: "y = Σ G(x)_i · E_i(x) for top-K i",
  },
  output: {
    title: "Output",
    description:
      "The combined expert output, same shape as input: (batch, seq_len, d_model). This replaces what a single FFN would produce in a standard transformer.",
  },
  layernorm1: {
    title: "Layer Norm 1",
    description:
      "Pre-norm layer normalization before the self-attention block. Stabilizes training by normalizing activations.",
  },
  attention: {
    title: "Multi-Head Self-Attention",
    description:
      "Standard transformer self-attention - unchanged from a dense model. The MoE modification only replaces the FFN block, leaving attention intact.",
  },
  layernorm2: {
    title: "Layer Norm 2",
    description:
      "Pre-norm layer normalization before the MoE/FFN block. This is standard in modern transformer architectures.",
  },
  moe: {
    title: "MoE Layer (replaces FFN)",
    description:
      "In a standard transformer, this would be a single FFN. In MoE, it is replaced by multiple expert FFNs plus a router. This is the only change to the transformer architecture.",
  },
};

const EXPERT_COLORS = [
  "rgba(99, 102, 241, 0.85)",
  "rgba(236, 72, 153, 0.85)",
  "rgba(74, 222, 128, 0.85)",
  "rgba(251, 191, 36, 0.85)",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MoEArchitecture() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [selected, setSelected] = useState<SelectedComponent>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 520 });
  const flowPhaseRef = useRef(0);
  const [hoveredComponent, setHoveredComponent] = useState<SelectedComponent>(null);

  // Responsive
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDimensions({ width: w, height: Math.max(450, Math.min(560, w * 0.78)) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Hit testing regions (updated each frame)
  const regionsRef = useRef<
    { id: SelectedComponent; x: number; y: number; w: number; h: number }[]
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = (timestamp: number) => {
      flowPhaseRef.current = (timestamp / 2000) % 1;
      const phase = flowPhaseRef.current;

      const { width, height } = dimensions;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      const regions: typeof regionsRef.current = [];

      // ---- LEFT SIDE: Transformer Block Overview ----
      const leftW = width * 0.32;
      const blockX = 20;
      const blockY = 30;
      const blockW = leftW - 30;
      const blockH = height - 70;

      // Transformer block outline
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(blockX, blockY, blockW, blockH, 8);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Transformer Block", blockX + blockW / 2, blockY - 8);

      // Sub-blocks of transformer
      const subBlockW = blockW - 24;
      const subBlockH = (blockH - 80) / 4;
      const subBlockX = blockX + 12;
      const gap = 10;

      const subBlocks: {
        id: SelectedComponent;
        label: string;
        y: number;
        color: string;
        isMoE: boolean;
      }[] = [
        {
          id: "layernorm1",
          label: "Layer Norm",
          y: blockY + 20,
          color: "rgba(255,255,255,0.3)",
          isMoE: false,
        },
        {
          id: "attention",
          label: "Multi-Head Attn",
          y: blockY + 20 + subBlockH + gap,
          color: "rgba(100,150,255,0.7)",
          isMoE: false,
        },
        {
          id: "layernorm2",
          label: "Layer Norm",
          y: blockY + 20 + 2 * (subBlockH + gap),
          color: "rgba(255,255,255,0.3)",
          isMoE: false,
        },
        {
          id: "moe",
          label: "MoE Layer",
          y: blockY + 20 + 3 * (subBlockH + gap),
          color: `rgba(${ACCENT_RGB}, 0.7)`,
          isMoE: true,
        },
      ];

      for (const block of subBlocks) {
        const isHovered = hoveredComponent === block.id;
        const isSelected = selected === block.id;
        const highlight = isHovered || isSelected;

        ctx.fillStyle = highlight
          ? block.isMoE
            ? `rgba(${ACCENT_RGB}, 0.12)`
            : "rgba(255,255,255,0.06)"
          : block.isMoE
            ? `rgba(${ACCENT_RGB}, 0.05)`
            : "rgba(255,255,255,0.02)";
        ctx.beginPath();
        ctx.roundRect(subBlockX, block.y, subBlockW, subBlockH, 6);
        ctx.fill();

        ctx.strokeStyle = highlight
          ? block.color
          : block.isMoE
            ? `rgba(${ACCENT_RGB}, 0.25)`
            : "rgba(255,255,255,0.08)";
        ctx.lineWidth = highlight ? 2 : 1;
        ctx.stroke();

        if (block.isMoE) {
          // Pulsing glow for MoE
          const pulseAlpha = 0.1 + Math.sin(timestamp / 500) * 0.05;
          ctx.shadowColor = ACCENT;
          ctx.shadowBlur = 12 * pulseAlpha;
          ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${0.3 + pulseAlpha})`;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // "replaces FFN" label
          ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.5)`;
          ctx.font = `8px ${FONT_MONO}`;
          ctx.textAlign = "center";
          ctx.fillText("(replaces FFN)", subBlockX + subBlockW / 2, block.y + subBlockH - 6);
        }

        ctx.fillStyle = highlight ? block.color : block.color.replace(/[\d.]+\)$/, "0.5)");
        ctx.font = `${highlight ? "bold " : ""}13px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(block.label, subBlockX + subBlockW / 2, block.y + subBlockH / 2 + (block.isMoE ? -4 : 0));

        // Arrows between blocks
        if (block.id !== "layernorm1") {
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          const arrowX = subBlockX + subBlockW / 2;
          ctx.moveTo(arrowX, block.y - gap);
          ctx.lineTo(arrowX, block.y);
          ctx.stroke();

          // Arrow head
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.moveTo(arrowX, block.y);
          ctx.lineTo(arrowX - 3, block.y - 5);
          ctx.lineTo(arrowX + 3, block.y - 5);
          ctx.closePath();
          ctx.fill();
        }

        regions.push({
          id: block.id,
          x: subBlockX,
          y: block.y,
          w: subBlockW,
          h: subBlockH,
        });
      }

      // ---- RIGHT SIDE: MoE Detail ----
      const rightX = leftW + 20;
      const rightW = width - rightX - 20;
      const centerX = rightX + rightW / 2;

      // Arrow from left MoE block to right detail
      ctx.strokeStyle = `rgba(${ACCENT_RGB}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(subBlockX + subBlockW, subBlocks[3].y + subBlockH / 2);
      ctx.lineTo(rightX, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.5)`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("MoE Layer Detail", centerX, 18);

      // Input box
      const inputBoxW = rightW * 0.55;
      const inputBoxH = 30;
      const inputBoxX = centerX - inputBoxW / 2;
      const inputBoxY = 35;

      const isInputHighlight = hoveredComponent === "input" || selected === "input";
      ctx.fillStyle = isInputHighlight ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.roundRect(inputBoxX, inputBoxY, inputBoxW, inputBoxH, 4);
      ctx.fill();
      ctx.strokeStyle = isInputHighlight
        ? "rgba(255,255,255,0.5)"
        : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isInputHighlight ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = isInputHighlight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Input x ∈ ℝ^(d_model)", centerX, inputBoxY + 19);
      regions.push({ id: "input", x: inputBoxX, y: inputBoxY, w: inputBoxW, h: inputBoxH });

      // Router box
      const routerBoxW = rightW * 0.4;
      const routerBoxH = 38;
      const routerBoxX = centerX - routerBoxW / 2;
      const routerBoxY = inputBoxY + inputBoxH + 30;

      const isRouterHighlight = hoveredComponent === "router" || selected === "router";
      ctx.fillStyle = isRouterHighlight
        ? `rgba(${ACCENT_RGB}, 0.12)`
        : `rgba(${ACCENT_RGB}, 0.04)`;
      ctx.beginPath();
      ctx.roundRect(routerBoxX, routerBoxY, routerBoxW, routerBoxH, 6);
      ctx.fill();
      ctx.strokeStyle = isRouterHighlight
        ? `rgba(${ACCENT_RGB}, 0.8)`
        : `rgba(${ACCENT_RGB}, 0.3)`;
      ctx.lineWidth = isRouterHighlight ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = isRouterHighlight
        ? `rgba(${ACCENT_RGB}, 1)`
        : `rgba(${ACCENT_RGB}, 0.7)`;
      ctx.font = `bold 13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Router / Gate", centerX, routerBoxY + 16);
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.45)`;
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText("G(x) = Softmax(W_g·x)", centerX, routerBoxY + 30);
      regions.push({
        id: "router",
        x: routerBoxX,
        y: routerBoxY,
        w: routerBoxW,
        h: routerBoxH,
      });

      // Arrow: input -> router
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, inputBoxY + inputBoxH);
      ctx.lineTo(centerX, routerBoxY);
      ctx.stroke();

      // Animated flow dot
      const dotY1 =
        inputBoxY + inputBoxH + phase * (routerBoxY - inputBoxY - inputBoxH);
      ctx.beginPath();
      ctx.arc(centerX, dotY1, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.8)`;
      ctx.fill();

      // Expert boxes
      const expertAreaY = routerBoxY + routerBoxH + 35;
      const expertBoxW = Math.min(70, rightW / 5.5);
      const expertBoxH = 50;
      const expertTotalW = 4 * expertBoxW + 3 * 8;
      const expertStartX = centerX - expertTotalW / 2;

      for (let i = 0; i < 4; i++) {
        const ex = expertStartX + i * (expertBoxW + 8);
        const ey = expertAreaY;
        const eid = `expert${i}` as SelectedComponent;
        const isHighlight = hoveredComponent === eid || selected === eid;

        ctx.fillStyle = isHighlight
          ? EXPERT_COLORS[i].replace("0.85", "0.15")
          : EXPERT_COLORS[i].replace("0.85", "0.05");
        ctx.beginPath();
        ctx.roundRect(ex, ey, expertBoxW, expertBoxH, 5);
        ctx.fill();
        ctx.strokeStyle = isHighlight
          ? EXPERT_COLORS[i]
          : EXPERT_COLORS[i].replace("0.85", "0.35");
        ctx.lineWidth = isHighlight ? 2 : 1;
        ctx.stroke();

        ctx.fillStyle = isHighlight
          ? EXPERT_COLORS[i]
          : EXPERT_COLORS[i].replace("0.85", "0.65");
        ctx.font = `bold 13px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(`E${i}`, ex + expertBoxW / 2, ey + 20);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.fillText("FFN", ex + expertBoxW / 2, ey + 35);

        // Arrow from router to expert
        const routerBottom = routerBoxY + routerBoxH;
        ctx.strokeStyle = EXPERT_COLORS[i].replace("0.85", "0.2");
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, routerBottom);
        ctx.lineTo(ex + expertBoxW / 2, ey);
        ctx.stroke();

        // Animated particles from router to experts (only for selected)
        const selected0 = 0; // Simulated top-K=2: experts 0 and 2 selected
        const selected1 = 2;
        if (i === selected0 || i === selected1) {
          const pPhase = (phase + (i === selected1 ? 0.15 : 0)) % 1;
          const px =
            centerX + pPhase * (ex + expertBoxW / 2 - centerX);
          const py = routerBottom + pPhase * (ey - routerBottom);
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = EXPERT_COLORS[i].replace("0.85", "0.9");
          ctx.fill();
        }

        regions.push({ id: eid, x: ex, y: ey, w: expertBoxW, h: expertBoxH });
      }

      // Combiner box
      const combinerY = expertAreaY + expertBoxH + 35;
      const combinerW = rightW * 0.45;
      const combinerH = 30;
      const combinerX = centerX - combinerW / 2;

      const isCombHighlight = hoveredComponent === "combiner" || selected === "combiner";
      ctx.fillStyle = isCombHighlight
        ? "rgba(168, 85, 247, 0.12)"
        : "rgba(168, 85, 247, 0.04)";
      ctx.beginPath();
      ctx.roundRect(combinerX, combinerY, combinerW, combinerH, 5);
      ctx.fill();
      ctx.strokeStyle = isCombHighlight
        ? "rgba(168, 85, 247, 0.7)"
        : "rgba(168, 85, 247, 0.3)";
      ctx.lineWidth = isCombHighlight ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = isCombHighlight
        ? "rgba(168, 85, 247, 0.9)"
        : "rgba(168, 85, 247, 0.6)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("Σ weighted combine", centerX, combinerY + 19);
      regions.push({
        id: "combiner",
        x: combinerX,
        y: combinerY,
        w: combinerW,
        h: combinerH,
      });

      // Arrows: experts -> combiner
      for (let i = 0; i < 4; i++) {
        const ex = expertStartX + i * (expertBoxW + 8) + expertBoxW / 2;
        ctx.strokeStyle = EXPERT_COLORS[i].replace("0.85", "0.12");
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ex, expertAreaY + expertBoxH);
        ctx.lineTo(centerX, combinerY);
        ctx.stroke();
      }

      // Output box
      const outputY = combinerY + combinerH + 25;
      const outputW = rightW * 0.55;
      const outputH = 30;
      const outputX = centerX - outputW / 2;

      const isOutputHighlight = hoveredComponent === "output" || selected === "output";
      ctx.fillStyle = isOutputHighlight
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.roundRect(outputX, outputY, outputW, outputH, 4);
      ctx.fill();
      ctx.strokeStyle = isOutputHighlight
        ? "rgba(255,255,255,0.5)"
        : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isOutputHighlight ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = isOutputHighlight
        ? "rgba(255,255,255,0.9)"
        : "rgba(255,255,255,0.5)";
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillText("Output y ∈ ℝ^(d_model)", centerX, outputY + 19);
      regions.push({ id: "output", x: outputX, y: outputY, w: outputW, h: outputH });

      // Arrow: combiner -> output
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.moveTo(centerX, combinerY + combinerH);
      ctx.lineTo(centerX, outputY);
      ctx.stroke();

      regionsRef.current = regions;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [dimensions, hoveredComponent, selected]);

  const hitTest = useCallback(
    (clientX: number, clientY: number): SelectedComponent => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      for (const region of regionsRef.current) {
        if (
          x >= region.x &&
          x <= region.x + region.w &&
          y >= region.y &&
          y <= region.y + region.h
        ) {
          return region.id;
        }
      }
      return null;
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setHoveredComponent(hitTest(e.clientX, e.clientY));
    },
    [hitTest],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const id = hitTest(e.clientX, e.clientY);
      setSelected((prev) => (prev === id ? null : id));
    },
    [hitTest],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredComponent(null);
  }, []);

  const info = selected ? COMPONENT_INFO[selected] : null;

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: 780 }}>
      <div
        style={{
          background: BG,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px 6px",
            borderBottom: `1px solid rgba(${ACCENT_RGB}, 0.08)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              fontWeight: 600,
              color: `rgba(${ACCENT_RGB}, 0.8)`,
            }}
          >
            MoE Layer Architecture
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Click components to inspect
          </span>
        </div>

        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: dimensions.height,
            cursor: hoveredComponent ? "pointer" : "default",
          }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
        />

        {info && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                fontWeight: 700,
                color: `rgba(${ACCENT_RGB}, 0.9)`,
                marginBottom: 4,
              }}
            >
              {info.title}
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.6,
              }}
            >
              {info.description}
            </div>
            {info.math && (
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: `rgba(${ACCENT_RGB}, 0.65)`,
                  marginTop: 6,
                  padding: "4px 8px",
                  background: `rgba(${ACCENT_RGB}, 0.05)`,
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                {info.math}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
