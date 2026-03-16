"use client"
import React, { useState } from 'react'

type GateType = 'update' | 'reset' | 'candidate' | null

const GATE_INFO: Record<string, { color: string; glow: string; label: string; equation: string; description: string }> = {
  update: {
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',
    label: 'Update Gate (z_t)',
    equation: 'z_t = σ(W_z · x_t + U_z · h_{t-1} + b_z)',
    description: 'Controls the balance between keeping the old hidden state and accepting the new candidate. When z_t ≈ 1, use the new candidate; when z_t ≈ 0, keep the old state. This single gate replaces both the forget and input gates of LSTM.',
  },
  reset: {
    color: '#ec4899', glow: 'rgba(236,72,153,0.2)',
    label: 'Reset Gate (r_t)',
    equation: 'r_t = σ(W_r · x_t + U_r · h_{t-1} + b_r)',
    description: 'Determines how much of the previous hidden state is relevant for computing the new candidate. When r_t ≈ 0, the unit acts as if reading the first symbol of a new sequence — it "resets" its memory.',
  },
  candidate: {
    color: '#14b8a6', glow: 'rgba(20,184,166,0.2)',
    label: 'Candidate Hidden State (h̃_t)',
    equation: 'h̃_t = tanh(W_h · x_t + U_h · (r_t ⊙ h_{t-1}) + b_h)',
    description: 'Creates a new candidate hidden state using the current input and a reset-filtered version of the previous hidden state. The reset gate controls how much history influences this candidate.',
  },
}

export default function GRUViz() {
  const [activeGate, setActiveGate] = useState<GateType>(null)
  const [showComparison, setShowComparison] = useState(false)

  const getOpacity = (gate: string) => activeGate === null ? 1 : activeGate === gate ? 1 : 0.15

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Interactive Diagram</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>GRU Cell Architecture</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Click on any gate to understand its role. Only 2 gates — simpler than LSTM!</div>
      </div>

      <svg viewBox="0 0 650 350" style={{ width: '100%', display: 'block' }}>
        <defs>
          <marker id="gru-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>

        {/* h_{t-1} input */}
        <g opacity="0.7">
          <line x1="30" y1="130" x2="100" y2="130" stroke="#a78bfa" strokeWidth="2.5" />
          <text x="30" y="118" fill="#a78bfa" fontSize="12" fontWeight="600">h_{'{t-1}'}</text>
        </g>

        {/* h_t output */}
        <g opacity={getOpacity('update')} style={{ transition: 'opacity 0.4s ease' }}>
          <line x1="570" y1="130" x2="630" y2="130" stroke="#a78bfa" strokeWidth="2.5" markerEnd="url(#gru-arrow)" />
          <text x="600" y="118" fill="#a78bfa" fontSize="12" fontWeight="600">h_t</text>
        </g>

        {/* x_t input */}
        <g opacity="0.7">
          <line x1="200" y1="320" x2="200" y2="260" stroke="#60a5fa" strokeWidth="2" />
          <text x="190" y="338" fill="#60a5fa" fontSize="12" fontWeight="600">x_t</text>
        </g>

        {/* ===== RESET GATE ===== */}
        <g
          opacity={getOpacity('reset')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => setActiveGate(prev => prev === 'reset' ? null : 'reset')}
        >
          <rect x="120" y="195" width="75" height="50" rx="10"
            fill={activeGate === 'reset' ? '#ec4899' : '#1e293b'}
            stroke="#ec4899" strokeWidth="2"
          />
          <text x="157" y="216" textAnchor="middle"
            fill={activeGate === 'reset' ? '#fff' : '#ec4899'} fontSize="14" fontWeight="700">&#963;</text>
          <text x="157" y="235" textAnchor="middle"
            fill={activeGate === 'reset' ? '#fce7f3' : '#f472b6'} fontSize="9">reset</text>

          {/* Arrow from reset to candidate (element-wise multiply with h_{t-1}) */}
          <circle cx="260" cy="195" r="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="260" y="200" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">x</text>
          <line x1="195" y1="210" x2="248" y2="198" stroke="#ec4899" strokeWidth="1.5" />

          {/* h_{t-1} branch to reset multiply */}
          <path d="M 100 130 Q 100 195 248 195" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* ===== CANDIDATE ===== */}
        <g
          opacity={getOpacity('candidate')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => setActiveGate(prev => prev === 'candidate' ? null : 'candidate')}
        >
          <rect x="300" y="195" width="75" height="50" rx="10"
            fill={activeGate === 'candidate' ? '#14b8a6' : '#1e293b'}
            stroke="#14b8a6" strokeWidth="2"
          />
          <text x="337" y="216" textAnchor="middle"
            fill={activeGate === 'candidate' ? '#fff' : '#14b8a6'} fontSize="12" fontWeight="700">tanh</text>
          <text x="337" y="235" textAnchor="middle"
            fill={activeGate === 'candidate' ? '#ccfbf1' : '#5eead4'} fontSize="9">candidate</text>

          {/* Arrow from reset*h to candidate */}
          <line x1="272" y1="195" x2="300" y2="210" stroke="#94a3b8" strokeWidth="1.5" />
          {/* x_t to candidate */}
          <line x1="200" y1="260" x2="310" y2="245" stroke="#60a5fa" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* ===== UPDATE GATE ===== */}
        <g
          opacity={getOpacity('update')}
          style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
          onClick={() => setActiveGate(prev => prev === 'update' ? null : 'update')}
        >
          <rect x="120" y="70" width="75" height="50" rx="10"
            fill={activeGate === 'update' ? '#8b5cf6' : '#1e293b'}
            stroke="#8b5cf6" strokeWidth="2"
          />
          <text x="157" y="91" textAnchor="middle"
            fill={activeGate === 'update' ? '#fff' : '#8b5cf6'} fontSize="14" fontWeight="700">&#963;</text>
          <text x="157" y="110" textAnchor="middle"
            fill={activeGate === 'update' ? '#ede9fe' : '#a78bfa'} fontSize="9">update</text>

          {/* Input connections to update gate */}
          <line x1="100" y1="130" x2="130" y2="120" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" />
          <line x1="200" y1="260" x2="150" y2="120" stroke="#60a5fa" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* Input connections to reset gate */}
        <g opacity={getOpacity('reset')} style={{ transition: 'opacity 0.4s ease' }}>
          <line x1="100" y1="130" x2="130" y2="195" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" />
          <line x1="200" y1="260" x2="145" y2="245" stroke="#60a5fa" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* ===== INTERPOLATION ===== */}
        <g opacity={getOpacity('update')} style={{ transition: 'opacity 0.4s ease' }}>
          {/* (1 - z_t) * h_{t-1} path */}
          <circle cx="460" cy="100" r="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="460" y="105" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">x</text>
          <text x="460" y="80" textAnchor="middle" fill="#8b5cf6" fontSize="9">1 - z_t</text>

          {/* z_t * h_tilde path */}
          <circle cx="460" cy="200" r="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="460" y="205" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold">x</text>
          <text x="460" y="225" textAnchor="middle" fill="#8b5cf6" fontSize="9">z_t</text>

          {/* Addition */}
          <circle cx="530" cy="130" r="14" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <text x="530" y="135" textAnchor="middle" fill="#fbbf24" fontSize="16" fontWeight="bold">+</text>

          {/* Connections */}
          <line x1="195" y1="90" x2="448" y2="100" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1="195" y1="100" x2="448" y2="200" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" />
          <path d="M 100 130 L 448 100" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" />
          <line x1="375" y1="220" x2="448" y2="200" stroke="#14b8a6" strokeWidth="1.5" />

          <line x1="472" y1="100" x2="516" y2="125" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="472" y1="200" x2="516" y2="135" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="544" y1="130" x2="570" y2="130" stroke="#fbbf24" strokeWidth="2" />
        </g>
      </svg>

      {/* Gate info panel */}
      {activeGate && (
        <div style={{
          margin: '0 24px 16px', padding: '14px 18px', borderRadius: '12px',
          background: GATE_INFO[activeGate].glow,
          border: `1px solid ${GATE_INFO[activeGate].color}33`,
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
        </div>
      )}

      {/* Interpolation equation */}
      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Key: Linear Interpolation</div>
          <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#ede9fe', letterSpacing: '0.02em' }}>
            h_t = (1 - z_t) &#8857; h_{'{t-1}'} + z_t &#8857; h&#771;_t
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            The final hidden state is a smooth blend between keeping the old state and using the new candidate. The update gate z_t acts as a learned &ldquo;mixing knob&rdquo;.
          </div>
        </div>
      </div>

      {/* LSTM vs GRU comparison */}
      <div style={{ padding: '0 24px 20px' }}>
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.15)',
            color: '#94a3b8', cursor: 'pointer', transition: 'all 0.3s ease',
          }}
        >
          {showComparison ? '▼' : '▶'} LSTM vs GRU Comparison
        </button>
        {showComparison && (
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>LSTM</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.8' }}>
                <div>&#8226; 3 gates (forget, input, output)</div>
                <div>&#8226; Separate cell state c_t</div>
                <div>&#8226; More parameters (~33% more)</div>
                <div>&#8226; Fine-grained memory control</div>
                <div>&#8226; Better on complex tasks</div>
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6', marginBottom: '8px' }}>GRU</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.8' }}>
                <div>&#8226; 2 gates (update, reset)</div>
                <div>&#8226; No separate cell state</div>
                <div>&#8226; Fewer parameters, faster</div>
                <div>&#8226; Simpler architecture</div>
                <div>&#8226; Often comparable results</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
