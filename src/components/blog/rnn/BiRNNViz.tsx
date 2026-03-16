"use client"
import React, { useState } from 'react'

const WORDS = ['The', 'cat', 'sat', 'on', 'the', 'mat']

export default function BiRNNViz() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const cellW = 60
  const gap = 18
  const startX = 50

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Interactive Diagram</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Bidirectional RNN</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Hover over a word to see what context is available at that position</div>
      </div>

      <svg viewBox="0 0 560 300" style={{ width: '100%', display: 'block' }}>
        <defs>
          <marker id="birnn-fwd" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#60a5fa" />
          </marker>
          <marker id="birnn-bwd" viewBox="0 0 10 6" refX="0" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M10,0 L0,3 L10,6 Z" fill="#f472b6" />
          </marker>
          <marker id="birnn-up" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>

        {/* Labels */}
        <text x="15" y="80" fill="#60a5fa" fontSize="9" fontWeight="600">Forward</text>
        <text x="15" y="93" fill="#60a5fa" fontSize="9">→</text>
        <text x="15" y="160" fill="#f472b6" fontSize="9" fontWeight="600">Backward</text>
        <text x="15" y="173" fill="#f472b6" fontSize="9">←</text>
        <text x="15" y="38" fill="#34d399" fontSize="9" fontWeight="600">Output</text>

        {WORDS.map((word, i) => {
          const x = startX + i * (cellW + gap)
          const isHovered = hoveredIdx === i
          const isInForwardContext = hoveredIdx !== null && i <= hoveredIdx
          const isInBackwardContext = hoveredIdx !== null && i >= hoveredIdx

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
              {/* Input word */}
              <text x={x + cellW / 2} y="260" textAnchor="middle" fill={isHovered ? '#fbbf24' : '#e2e8f0'} fontSize="12" fontWeight={isHovered ? 700 : 500} style={{ transition: 'all 0.2s ease' }}>
                {word}
              </text>

              {/* Forward cell */}
              <rect x={x} y="65" width={cellW} height="35" rx="8"
                fill={isInForwardContext ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.05)'}
                stroke={isInForwardContext ? '#60a5fa' : '#334155'}
                strokeWidth={isHovered ? 2 : 1}
                style={{ transition: 'all 0.2s ease' }}
              />
              <text x={x + cellW / 2} y="87" textAnchor="middle" fill={isInForwardContext ? '#93c5fd' : '#475569'} fontSize="9" style={{ transition: 'all 0.2s ease' }}>
                h→_{i + 1}
              </text>

              {/* Backward cell */}
              <rect x={x} y="145" width={cellW} height="35" rx="8"
                fill={isInBackwardContext ? 'rgba(244,114,182,0.2)' : 'rgba(244,114,182,0.05)'}
                stroke={isInBackwardContext ? '#f472b6' : '#334155'}
                strokeWidth={isHovered ? 2 : 1}
                style={{ transition: 'all 0.2s ease' }}
              />
              <text x={x + cellW / 2} y="167" textAnchor="middle" fill={isInBackwardContext ? '#f9a8d4' : '#475569'} fontSize="9" style={{ transition: 'all 0.2s ease' }}>
                h←_{i + 1}
              </text>

              {/* Output (concatenation) */}
              <rect x={x + 5} y="20" width={cellW - 10} height="28" rx="6"
                fill={isHovered ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.05)'}
                stroke={isHovered ? '#34d399' : '#334155'}
                strokeWidth={isHovered ? 2 : 1}
                style={{ transition: 'all 0.2s ease' }}
              />
              <text x={x + cellW / 2} y="38" textAnchor="middle" fill={isHovered ? '#6ee7b7' : '#475569'} fontSize="8" style={{ transition: 'all 0.2s ease' }}>
                [h→;h←]
              </text>

              {/* Arrows: input to both cells */}
              <line x1={x + cellW / 2} y1="245" x2={x + cellW / 2} y2="182" stroke="#475569" strokeWidth="1" />
              <line x1={x + cellW / 2} y1="245" x2={x + cellW / 2} y2="102" stroke="#475569" strokeWidth="1" />

              {/* Arrows: cells to output */}
              <line x1={x + cellW / 2 - 8} y1="63" x2={x + cellW / 2 - 8} y2="50" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
              <line x1={x + cellW / 2 + 8} y1="143" x2={x + cellW / 2 + 8} y2="50" stroke="#f472b6" strokeWidth="1" opacity="0.5" />

              {/* Forward recurrent connection */}
              {i < WORDS.length - 1 && (
                <line x1={x + cellW + 1} y1="82" x2={x + cellW + gap - 1} y2="82"
                  stroke="#60a5fa" strokeWidth={isInForwardContext && hoveredIdx !== null && i < hoveredIdx ? 2 : 1.5}
                  markerEnd="url(#birnn-fwd)"
                  opacity={isInForwardContext ? 0.8 : 0.2}
                  style={{ transition: 'all 0.2s ease' }}
                />
              )}

              {/* Backward recurrent connection */}
              {i > 0 && (
                <line x1={x - 1} y1="162" x2={x - gap + 1} y2="162"
                  stroke="#f472b6" strokeWidth={isInBackwardContext && hoveredIdx !== null && i > hoveredIdx ? 2 : 1.5}
                  markerEnd="url(#birnn-bwd)"
                  opacity={isInBackwardContext ? 0.8 : 0.2}
                  style={{ transition: 'all 0.2s ease' }}
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Hover context info */}
      {hoveredIdx !== null && (
        <div style={{
          margin: '0 24px 16px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)',
          fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6',
        }}>
          At position <strong style={{ color: '#fbbf24' }}>&ldquo;{WORDS[hoveredIdx]}&rdquo;</strong>:
          <br />
          <span style={{ color: '#93c5fd' }}>→ Forward sees:</span> {WORDS.slice(0, hoveredIdx + 1).map((w, i) => (
            <span key={i} style={{ color: '#93c5fd', fontWeight: i === hoveredIdx ? 700 : 400 }}>{w}{i < hoveredIdx ? ' ' : ''}</span>
          ))}
          <br />
          <span style={{ color: '#f9a8d4' }}>← Backward sees:</span> {WORDS.slice(hoveredIdx).map((w, i) => (
            <span key={i} style={{ color: '#f9a8d4', fontWeight: i === 0 ? 700 : 400 }}>{w}{i < WORDS.length - hoveredIdx - 1 ? ' ' : ''}</span>
          ))}
          <br />
          <span style={{ color: '#6ee7b7' }}>Combined output has context from the <strong>entire</strong> sentence</span>
        </div>
      )}

      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
          The forward RNN only sees past context; the backward RNN only sees future context.
          By concatenating both, each position gets a representation informed by the <em>entire</em> sequence.
          This is critical for tasks like named entity recognition, where &ldquo;Apple&rdquo; could mean a fruit or a company depending on surrounding words.
        </div>
      </div>
    </div>
  )
}
