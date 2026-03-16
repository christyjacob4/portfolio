"use client"
import React, { useState, useCallback } from 'react'

type GateType = 'forget' | 'input' | 'candidate' | 'output' | null

const GATE_INFO: Record<string, { color: string; glow: string; label: string; symbol: string; equation: string; description: string }> = {
  forget: {
    color: '#ef4444', glow: 'rgba(239,68,68,0.25)',
    label: 'Forget Gate', symbol: 'f_t',
    equation: 'f_t = σ(W_f · x_t + U_f · h_{t-1} + b_f)',
    description: 'Decides what to discard from the cell state. A sigmoid output of 0 means "forget completely", 1 means "keep everything".',
  },
  input: {
    color: '#10b981', glow: 'rgba(16,185,129,0.25)',
    label: 'Input Gate', symbol: 'i_t',
    equation: 'i_t = σ(W_i · x_t + U_i · h_{t-1} + b_i)',
    description: 'Decides which new information to store in the cell state. Controls the flow of the candidate values.',
  },
  candidate: {
    color: '#f59e0b', glow: 'rgba(245,158,11,0.25)',
    label: 'Candidate Values', symbol: 'c̃_t',
    equation: 'c̃_t = tanh(W_c · x_t + U_c · h_{t-1} + b_c)',
    description: 'Creates a vector of new candidate values that could be added to the cell state. Uses tanh to squash values to [-1, 1].',
  },
  output: {
    color: '#3b82f6', glow: 'rgba(59,130,246,0.25)',
    label: 'Output Gate', symbol: 'o_t',
    equation: 'o_t = σ(W_o · x_t + U_o · h_{t-1} + b_o)',
    description: 'Decides what parts of the cell state to output. The cell state is passed through tanh and filtered by this gate.',
  },
}

export default function LSTMViz() {
  const [activeGate, setActiveGate] = useState<GateType>(null)
  const [step, setStep] = useState(0)

  const handleGateClick = useCallback((gate: GateType) => {
    setActiveGate(prev => prev === gate ? null : gate)
  }, [])

  const isActive = (gate: string) => activeGate === gate || activeGate === null
  const getOpacity = (gate: string) => activeGate === null ? 1 : activeGate === gate ? 1 : 0.15

  const steps = [
    { gate: 'forget' as GateType, title: 'Step 1: Forget', desc: 'The forget gate looks at h_{t-1} and x_t, and outputs a number between 0 and 1 for each value in the cell state. It decides what information to throw away.' },
    { gate: 'input' as GateType, title: 'Step 2: Store', desc: 'The input gate decides which values to update, while the candidate layer creates new values. Together they determine what new information gets stored.' },
    { gate: 'candidate' as GateType, title: 'Step 3: Update Cell', desc: 'We multiply the old state by f_t (forgetting), then add i_t × c̃_t (new candidates). This additive update is the key to solving vanishing gradients!' },
    { gate: 'output' as GateType, title: 'Step 4: Output', desc: 'The output gate controls which parts of the cell state are exposed. The cell state is squeezed through tanh and multiplied by the gate output.' },
  ]

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Interactive Diagram</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>LSTM Cell Architecture</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Click on any gate to learn what it does, or step through the process below</div>
      </div>

      <svg viewBox="0 0 700 420" style={{ width: '100%', display: 'block' }}>
        <defs>
          <marker id="lstm-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#64748b" />
          </marker>
          <marker id="lstm-arrow-yellow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#fbbf24" />
          </marker>
          <marker id="lstm-arrow-blue" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#60a5fa" />
          </marker>
          <filter id="glow-red"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-green"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-amber"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-blue"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* ===== CELL STATE HIGHWAY ===== */}
        <g opacity={activeGate === null || activeGate === 'forget' || activeGate === 'candidate' || activeGate === 'input' ? 1 : 0.3} style={{ transition: 'opacity 0.4s ease' }}>
          {/* Cell state line */}
          <line x1="30" y1="70" x2="670" y2="70" stroke="#fbbf24" strokeWidth="3" opacity="0.6" />
          <text x="30" y="55" fill="#fbbf24" fontSize="12" fontWeight="600" opacity="0.8">c_{'{t-1}'}</text>
          <text x="645" y="55" fill="#fbbf24" fontSize="12" fontWeight="600" opacity="0.8">c_t</text>

          {/* Pointwise multiply (forget) */}
          <circle cx="200" cy="70" r="16" fill="none" stroke="#ef4444" strokeWidth="2" opacity={getOpacity('forget')} style={{ transition: 'opacity 0.4s ease' }} />
          <text x="200" y="75" textAnchor="middle" fill="#ef4444" fontSize="16" fontWeight="bold" opacity={getOpacity('forget')} style={{ transition: 'opacity 0.4s ease' }}>x</text>

          {/* Pointwise add (input) */}
          <circle cx="380" cy="70" r="16" fill="none" stroke="#10b981" strokeWidth="2" opacity={getOpacity('input')} style={{ transition: 'opacity 0.4s ease' }} />
          <text x="380" y="76" textAnchor="middle" fill="#10b981" fontSize="18" fontWeight="bold" opacity={getOpacity('input')} style={{ transition: 'opacity 0.4s ease' }}>+</text>
        </g>

        {/* ===== FORGET GATE ===== */}
        <g
          opacity={getOpacity('forget')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => handleGateClick('forget')}
        >
          <rect x="160" y="180" width="80" height="50" rx="10" fill={activeGate === 'forget' ? '#ef4444' : '#1e293b'} stroke="#ef4444" strokeWidth="2" />
          <text x="200" y="201" textAnchor="middle" fill={activeGate === 'forget' ? '#fff' : '#ef4444'} fontSize="14" fontWeight="700">&#963;</text>
          <text x="200" y="220" textAnchor="middle" fill={activeGate === 'forget' ? '#fecaca' : '#f87171'} fontSize="9">forget</text>
          {/* Arrow from gate to multiply */}
          <line x1="200" y1="180" x2="200" y2="90" stroke="#ef4444" strokeWidth="1.5" strokeDasharray={activeGate === 'forget' ? 'none' : '4,3'} markerEnd="url(#lstm-arrow)" />
        </g>

        {/* ===== INPUT GATE ===== */}
        <g
          opacity={getOpacity('input')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => handleGateClick('input')}
        >
          <rect x="310" y="180" width="60" height="50" rx="10" fill={activeGate === 'input' ? '#10b981' : '#1e293b'} stroke="#10b981" strokeWidth="2" />
          <text x="340" y="201" textAnchor="middle" fill={activeGate === 'input' ? '#fff' : '#10b981'} fontSize="14" fontWeight="700">&#963;</text>
          <text x="340" y="220" textAnchor="middle" fill={activeGate === 'input' ? '#d1fae5' : '#34d399'} fontSize="9">input</text>

          {/* Pointwise multiply between input gate and candidate */}
          <circle cx="380" cy="150" r="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="380" y="155" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">x</text>
          {/* Arrow from input gate to multiply */}
          <line x1="355" y1="180" x2="370" y2="162" stroke="#10b981" strokeWidth="1.5" strokeDasharray={activeGate === 'input' ? 'none' : '4,3'} />
          {/* Arrow from multiply to cell state add */}
          <line x1="380" y1="138" x2="380" y2="90" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lstm-arrow)" />
        </g>

        {/* ===== CANDIDATE ===== */}
        <g
          opacity={getOpacity('candidate')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => handleGateClick('candidate')}
        >
          <rect x="400" y="180" width="70" height="50" rx="10" fill={activeGate === 'candidate' ? '#f59e0b' : '#1e293b'} stroke="#f59e0b" strokeWidth="2" />
          <text x="435" y="201" textAnchor="middle" fill={activeGate === 'candidate' ? '#fff' : '#f59e0b'} fontSize="12" fontWeight="700">tanh</text>
          <text x="435" y="220" textAnchor="middle" fill={activeGate === 'candidate' ? '#fef3c7' : '#fbbf24'} fontSize="9">candidate</text>
          {/* Arrow from candidate to multiply */}
          <line x1="410" y1="180" x2="392" y2="162" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray={activeGate === 'candidate' ? 'none' : '4,3'} />
        </g>

        {/* ===== OUTPUT GATE ===== */}
        <g
          opacity={getOpacity('output')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => handleGateClick('output')}
        >
          <rect x="520" y="180" width="80" height="50" rx="10" fill={activeGate === 'output' ? '#3b82f6' : '#1e293b'} stroke="#3b82f6" strokeWidth="2" />
          <text x="560" y="201" textAnchor="middle" fill={activeGate === 'output' ? '#fff' : '#3b82f6'} fontSize="14" fontWeight="700">&#963;</text>
          <text x="560" y="220" textAnchor="middle" fill={activeGate === 'output' ? '#dbeafe' : '#60a5fa'} fontSize="9">output</text>

          {/* tanh on cell state branch */}
          <rect x="530" y="100" width="60" height="30" rx="8" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="560" y="120" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="600">tanh</text>
          {/* Cell state to tanh */}
          <line x1="560" y1="70" x2="560" y2="100" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
          {/* Pointwise multiply for output */}
          <circle cx="560" cy="150" r="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="560" y="155" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">x</text>
          {/* tanh to multiply */}
          <line x1="560" y1="130" x2="560" y2="138" stroke="#8b5cf6" strokeWidth="1.5" />
          {/* Gate to multiply */}
          <line x1="560" y1="180" x2="560" y2="162" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray={activeGate === 'output' ? 'none' : '4,3'} />
        </g>

        {/* ===== INPUT CONNECTIONS ===== */}
        <g opacity="0.6">
          {/* h_{t-1} input line */}
          <line x1="30" y1="310" x2="250" y2="310" stroke="#a78bfa" strokeWidth="2" />
          <text x="30" y="300" fill="#a78bfa" fontSize="12" fontWeight="600">h_{'{t-1}'}</text>

          {/* x_t input line */}
          <line x1="250" y1="380" x2="250" y2="310" stroke="#60a5fa" strokeWidth="2" />
          <text x="240" y="396" fill="#60a5fa" fontSize="12" fontWeight="600">x_t</text>

          {/* Concatenation point */}
          <circle cx="250" cy="310" r="6" fill="#94a3b8" />

          {/* Fan out to all gates */}
          <line x1="250" y1="310" x2="200" y2="230" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lstm-arrow)" />
          <line x1="250" y1="310" x2="340" y2="230" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lstm-arrow)" />
          <line x1="250" y1="310" x2="435" y2="230" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lstm-arrow)" />
          <line x1="250" y1="310" x2="560" y2="230" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lstm-arrow)" />
          <text x="250" y="270" textAnchor="middle" fill="#64748b" fontSize="9">[h_{'{t-1}'}, x_t]</text>
        </g>

        {/* ===== h_t OUTPUT ===== */}
        <g opacity={getOpacity('output')} style={{ transition: 'opacity 0.4s ease' }}>
          <line x1="572" y1="150" x2="670" y2="150" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#lstm-arrow)" />
          <text x="645" y="140" fill="#a78bfa" fontSize="12" fontWeight="600">h_t</text>
        </g>

        {/* ===== LABELS ===== */}
        <text x="350" y="410" textAnchor="middle" fill="#475569" fontSize="10" fontStyle="italic">
          Click on any gate to highlight its role in the LSTM cell
        </text>
      </svg>

      {/* Step-through controls */}
      <div style={{ padding: '0 24px 12px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => { setStep(i); setActiveGate(s.gate) }}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                border: `1px solid ${step === i ? GATE_INFO[s.gate!].color : 'rgba(148,163,184,0.2)'}`,
                background: step === i ? `${GATE_INFO[s.gate!].glow}` : 'transparent',
                color: step === i ? GATE_INFO[s.gate!].color : '#64748b',
                cursor: 'pointer', transition: 'all 0.3s ease',
              }}
            >
              {s.title}
            </button>
          ))}
          <button
            onClick={() => { setStep(-1); setActiveGate(null) }}
            style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              border: '1px solid rgba(148,163,184,0.2)',
              background: activeGate === null ? 'rgba(148,163,184,0.1)' : 'transparent',
              color: '#94a3b8', cursor: 'pointer', transition: 'all 0.3s ease',
            }}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Gate info panel */}
      {activeGate && (
        <div style={{
          margin: '0 24px 20px', padding: '16px 20px', borderRadius: '12px',
          background: GATE_INFO[activeGate].glow,
          border: `1px solid ${GATE_INFO[activeGate].color}33`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: GATE_INFO[activeGate].color, marginBottom: '4px' }}>
            {GATE_INFO[activeGate].label}
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#e2e8f0', marginBottom: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}>
            {GATE_INFO[activeGate].equation}
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
            {GATE_INFO[activeGate].description}
          </div>
          {step >= 0 && (
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
              {steps[step].desc}
            </div>
          )}
        </div>
      )}

      {/* Cell state equation */}
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Magic: Additive Cell State Update</div>
          <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#fef3c7', letterSpacing: '0.02em' }}>
            c_t = f_t &#8857; c_{'{t-1}'} + i_t &#8857; c&#771;_t
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            This <strong style={{ color: '#fbbf24' }}>additive</strong> update (not multiplicative through weight matrices) is why gradients can flow unchanged through the cell state — the Constant Error Carousel.
          </div>
        </div>
      </div>
    </div>
  )
}
