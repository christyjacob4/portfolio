"use client"
import React, { useState } from 'react'

export default function NetworkComparison() {
  const [activeTab, setActiveTab] = useState<'ffnn' | 'rnn'>('ffnn')

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Comparison</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Feedforward vs Recurrent</div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 24px' }}>
        <button
          onClick={() => setActiveTab('ffnn')}
          style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: activeTab === 'ffnn' ? 'rgba(239,68,68,0.15)' : 'transparent',
            border: `1px solid ${activeTab === 'ffnn' ? '#ef4444' : 'rgba(148,163,184,0.2)'}`,
            color: activeTab === 'ffnn' ? '#ef4444' : '#64748b', cursor: 'pointer',
          }}
        >
          Feedforward Network
        </button>
        <button
          onClick={() => setActiveTab('rnn')}
          style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: activeTab === 'rnn' ? 'rgba(96,165,250,0.15)' : 'transparent',
            border: `1px solid ${activeTab === 'rnn' ? '#60a5fa' : 'rgba(148,163,184,0.2)'}`,
            color: activeTab === 'rnn' ? '#60a5fa' : '#64748b', cursor: 'pointer',
          }}
        >
          Recurrent Network
        </button>
      </div>

      {activeTab === 'ffnn' ? (
        <svg viewBox="0 0 600 280" style={{ width: '100%', display: 'block' }}>
          <defs>
            <marker id="nc-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
              <path d="M0,0 L10,3 L0,6 Z" fill="#475569" />
            </marker>
          </defs>

          {/* Three independent inputs */}
          {['today', 'is', 'sunny'].map((word, i) => {
            const x = 120 + i * 150
            return (
              <g key={i}>
                {/* Input */}
                <circle cx={x} cy="220" r="24" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" />
                <text x={x} y="224" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="600">{word}</text>

                {/* Hidden */}
                <circle cx={x} cy="140" r="20" fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x={x} y="144" textAnchor="middle" fill="#c4b5fd" fontSize="9">h_{i + 1}</text>

                {/* Output */}
                <circle cx={x} cy="60" r="18" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
                <text x={x} y="64" textAnchor="middle" fill="#6ee7b7" fontSize="9">y_{i + 1}</text>

                {/* Arrows */}
                <line x1={x} y1="196" x2={x} y2="162" stroke="#475569" strokeWidth="1.5" markerEnd="url(#nc-arrow)" />
                <line x1={x} y1="120" x2={x} y2="80" stroke="#475569" strokeWidth="1.5" markerEnd="url(#nc-arrow)" />
              </g>
            )
          })}

          {/* No connection between hidden states */}
          <line x1="240" y1="140" x2="290" y2="140" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />
          <text x="265" y="130" textAnchor="middle" fill="#ef4444" fontSize="18" fontWeight="bold">✗</text>
          <line x1="390" y1="140" x2="440" y2="140" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />
          <text x="415" y="130" textAnchor="middle" fill="#ef4444" fontSize="18" fontWeight="bold">✗</text>

          <text x="300" y="265" textAnchor="middle" fill="#94a3b8" fontSize="11">No memory — each input processed independently</text>
        </svg>
      ) : (
        <svg viewBox="0 0 600 280" style={{ width: '100%', display: 'block' }}>
          <defs>
            <marker id="nc-arrow-b" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
              <path d="M0,0 L10,3 L0,6 Z" fill="#475569" />
            </marker>
            <marker id="nc-arrow-blue" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
              <path d="M0,0 L10,3 L0,6 Z" fill="#60a5fa" />
            </marker>
          </defs>

          {['today', 'is', 'sunny'].map((word, i) => {
            const x = 120 + i * 150
            return (
              <g key={i}>
                {/* Input */}
                <circle cx={x} cy="220" r="24" fill="rgba(96,165,250,0.1)" stroke="#60a5fa" strokeWidth="1.5" />
                <text x={x} y="224" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="600">{word}</text>

                {/* Hidden */}
                <rect x={x - 28} y="120" width="56" height="40" rx="10" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x={x} y="144" textAnchor="middle" fill="#c4b5fd" fontSize="9">h_{i + 1}</text>

                {/* Output */}
                <circle cx={x} cy="60" r="18" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
                <text x={x} y="64" textAnchor="middle" fill="#6ee7b7" fontSize="9">y_{i + 1}</text>

                {/* Arrows */}
                <line x1={x} y1="196" x2={x} y2="162" stroke="#475569" strokeWidth="1.5" markerEnd="url(#nc-arrow-b)" />
                <line x1={x} y1="118" x2={x} y2="80" stroke="#475569" strokeWidth="1.5" markerEnd="url(#nc-arrow-b)" />

                {/* Recurrent connection */}
                {i < 2 && (
                  <g>
                    <line x1={x + 30} y1="140" x2={x + 120} y2="140" stroke="#60a5fa" strokeWidth="2.5" markerEnd="url(#nc-arrow-blue)" />
                    <text x={x + 75} y="133" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="600">W_hh</text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Loop arrow on the right side */}
          <text x="300" y="265" textAnchor="middle" fill="#94a3b8" fontSize="11">Hidden state carries information forward through time</text>

          {/* Highlight the recurrent connections */}
          <text x="300" y="105" textAnchor="middle" fill="#60a5fa" fontSize="10" opacity="0.7">
            ← same weights shared at every step →
          </text>
        </svg>
      )}

      <div style={{ padding: '12px 24px 20px' }}>
        {activeTab === 'ffnn' ? (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', fontSize: '13px', color: '#fca5a5', lineHeight: '1.6' }}>
            <strong style={{ color: '#ef4444' }}>Problem:</strong> A feedforward network processes each input independently. It has no way to know that &ldquo;sunny&rdquo; relates to &ldquo;today&rdquo; — each position is its own isolated computation. It cannot handle variable-length sequences or capture temporal dependencies.
          </div>
        ) : (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)', fontSize: '13px', color: '#93c5fd', lineHeight: '1.6' }}>
            <strong style={{ color: '#60a5fa' }}>Solution:</strong> An RNN maintains a hidden state that gets updated at each timestep. When processing &ldquo;sunny&rdquo;, h_3 already contains information about &ldquo;today&rdquo; and &ldquo;is&rdquo;. The same weights are reused at every step (parameter sharing), allowing it to handle any sequence length.
          </div>
        )}
      </div>
    </div>
  )
}
