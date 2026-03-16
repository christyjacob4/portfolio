"use client"
import React, { useState, useMemo } from 'react'

// Pre-computed attention weights for "Je suis étudiant" → "I am a student"
const SOURCE = ['Je', 'suis', 'étudiant', '<eos>']
const TARGET = ['I', 'am', 'a', 'student', '<eos>']

// Attention weights: target[i] attending to source[j]
const ATTENTION_WEIGHTS = [
  [0.85, 0.05, 0.05, 0.05],  // I -> Je
  [0.08, 0.80, 0.07, 0.05],  // am -> suis
  [0.05, 0.10, 0.15, 0.70],  // a -> <eos> (article, no direct mapping)
  [0.03, 0.07, 0.82, 0.08],  // student -> étudiant
  [0.05, 0.05, 0.10, 0.80],  // <eos> -> <eos>
]

function interpolateColor(weight: number): string {
  // Blue to yellow gradient
  const r = Math.round(59 + weight * (251 - 59))
  const g = Math.round(130 + weight * (191 - 130))
  const b = Math.round(246 + weight * (36 - 246))
  return `rgb(${r},${g},${b})`
}

export default function AttentionViz() {
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [showWeights, setShowWeights] = useState(false)

  const cellSize = 64
  const labelWidth = 90
  const topLabelHeight = 70
  const gridWidth = SOURCE.length * cellSize
  const gridHeight = TARGET.length * cellSize

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Interactive Visualization</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Attention Weights Heatmap</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Hover over cells to see which source words the decoder attends to when generating each target word
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px' }}>
        <svg
          viewBox={`0 0 ${labelWidth + gridWidth + 60} ${topLabelHeight + gridHeight + 40}`}
          style={{ width: '100%', maxWidth: '500px' }}
        >
          {/* Source labels (top) */}
          <text x={labelWidth + gridWidth / 2} y="14" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="600">
            Source (Encoder)
          </text>
          {SOURCE.map((word, j) => (
            <g key={`src-${j}`}>
              <text
                x={labelWidth + j * cellSize + cellSize / 2}
                y={topLabelHeight - 10}
                textAnchor="middle"
                fill={hoveredCell && hoveredCell[1] === j ? '#fbbf24' : '#93c5fd'}
                fontSize="13"
                fontWeight={hoveredCell && hoveredCell[1] === j ? 700 : 500}
                style={{ transition: 'all 0.2s ease' }}
              >
                {word}
              </text>
            </g>
          ))}

          {/* Target labels (left) */}
          <text
            x="10" y={topLabelHeight + gridHeight / 2}
            fill="#34d399" fontSize="11" fontWeight="600"
            transform={`rotate(-90, 10, ${topLabelHeight + gridHeight / 2})`}
            textAnchor="middle"
          >
            Target (Decoder)
          </text>
          {TARGET.map((word, i) => (
            <text
              key={`tgt-${i}`}
              x={labelWidth - 10}
              y={topLabelHeight + i * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              fill={hoveredRow === i || (hoveredCell && hoveredCell[0] === i) ? '#fbbf24' : '#6ee7b7'}
              fontSize="13"
              fontWeight={hoveredRow === i || (hoveredCell && hoveredCell[0] === i) ? 700 : 500}
              style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {word}
            </text>
          ))}

          {/* Heatmap cells */}
          {TARGET.map((_, i) =>
            SOURCE.map((_, j) => {
              const weight = ATTENTION_WEIGHTS[i][j]
              const x = labelWidth + j * cellSize
              const y = topLabelHeight + i * cellSize
              const isHovered = hoveredCell && hoveredCell[0] === i && hoveredCell[1] === j
              const isRowHovered = hoveredRow === i
              const opacity = hoveredRow !== null ? (isRowHovered ? 0.95 : 0.2) :
                hoveredCell ? (isHovered ? 1 : 0.3) : 0.85

              return (
                <g key={`${i}-${j}`}>
                  <rect
                    x={x + 2} y={y + 2}
                    width={cellSize - 4} height={cellSize - 4}
                    rx="6"
                    fill={interpolateColor(weight)}
                    opacity={opacity}
                    stroke={isHovered ? '#fff' : 'transparent'}
                    strokeWidth={isHovered ? 2 : 0}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={() => setHoveredCell([i, j])}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                  {(showWeights || isHovered || isRowHovered) && (
                    <text
                      x={x + cellSize / 2} y={y + cellSize / 2 + 4}
                      textAnchor="middle" fill={weight > 0.5 ? '#0f172a' : '#e2e8f0'}
                      fontSize="11" fontWeight="600" fontFamily="monospace"
                      style={{ pointerEvents: 'none', transition: 'all 0.2s ease' }}
                      opacity={opacity}
                    >
                      {weight.toFixed(2)}
                    </text>
                  )}
                </g>
              )
            })
          )}

          {/* Color scale legend */}
          <defs>
            <linearGradient id="attn-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={interpolateColor(0)} />
              <stop offset="50%" stopColor={interpolateColor(0.5)} />
              <stop offset="100%" stopColor={interpolateColor(1)} />
            </linearGradient>
          </defs>
          <rect x={labelWidth + gridWidth / 2 - 60} y={topLabelHeight + gridHeight + 14} width="120" height="8" rx="4" fill="url(#attn-gradient)" />
          <text x={labelWidth + gridWidth / 2 - 65} y={topLabelHeight + gridHeight + 22} textAnchor="end" fill="#64748b" fontSize="9">0</text>
          <text x={labelWidth + gridWidth / 2 + 65} y={topLabelHeight + gridHeight + 22} fill="#64748b" fontSize="9">1</text>
        </svg>
      </div>

      {/* Toggle weights */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 12px' }}>
        <button
          onClick={() => setShowWeights(!showWeights)}
          style={{
            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: showWeights ? 'rgba(251,191,36,0.15)' : 'transparent',
            border: `1px solid ${showWeights ? '#fbbf24' : 'rgba(148,163,184,0.2)'}`,
            color: showWeights ? '#fbbf24' : '#64748b', cursor: 'pointer',
          }}
        >
          {showWeights ? 'Hide' : 'Show'} All Weights
        </button>
      </div>

      {/* Hover info */}
      {hoveredCell && (
        <div style={{
          margin: '0 24px 16px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
          fontSize: '13px', color: '#fef3c7', textAlign: 'center',
        }}>
          When generating <strong style={{ color: '#34d399' }}>&ldquo;{TARGET[hoveredCell[0]]}&rdquo;</strong>, the decoder pays{' '}
          <strong style={{ color: '#fbbf24' }}>{(ATTENTION_WEIGHTS[hoveredCell[0]][hoveredCell[1]] * 100).toFixed(0)}%</strong> attention to{' '}
          <strong style={{ color: '#60a5fa' }}>&ldquo;{SOURCE[hoveredCell[1]]}&rdquo;</strong>
        </div>
      )}

      {/* Explanation */}
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
          <strong style={{ color: '#60a5fa' }}>Key insight:</strong> Instead of compressing the entire source sentence into a single fixed-length vector,
          attention lets the decoder <em>dynamically look back</em> at relevant source positions at each generation step.
          Notice how &ldquo;student&rdquo; strongly attends to &ldquo;étudiant&rdquo;, while &ldquo;a&rdquo; (an article absent in French) relies more on context.
        </div>
      </div>
    </div>
  )
}
