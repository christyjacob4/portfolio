"use client"
import React, { useState, useMemo } from 'react'

const TIMESTEPS = 10

export default function GradientExplorer() {
  const [eigenvalue, setEigenvalue] = useState(1.0)

  const gradients = useMemo(() => {
    return Array.from({ length: TIMESTEPS }, (_, i) => {
      return Math.pow(eigenvalue, TIMESTEPS - 1 - i)
    })
  }, [eigenvalue])

  const maxGrad = Math.max(...gradients, 1)

  const getColor = () => {
    if (eigenvalue < 0.85) return { bar: '#3b82f6', glow: 'rgba(59,130,246,0.3)' }
    if (eigenvalue > 1.15) return { bar: '#ef4444', glow: 'rgba(239,68,68,0.3)' }
    return { bar: '#10b981', glow: 'rgba(16,185,129,0.3)' }
  }

  const colors = getColor()

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Interactive Visualization</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Gradient Magnitude Through Time</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Drag the slider to see how the weight eigenvalue affects gradient flow</div>
      </div>

      <svg viewBox="0 0 620 260" style={{ width: '100%', display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <g key={i}>
            <line x1="70" y1={40 + frac * 180} x2="590" y2={40 + frac * 180} stroke="#1e293b" strokeWidth="1" />
          </g>
        ))}

        {/* Y-axis label */}
        <text x="18" y="130" textAnchor="middle" fill="#64748b" fontSize="10" transform="rotate(-90, 18, 130)">
          Gradient Magnitude
        </text>

        {/* Reference line at 1.0 */}
        {maxGrad > 0 && (
          <g>
            <line
              x1="70" y1={220 - (1 / maxGrad) * 180}
              x2="590" y2={220 - (1 / maxGrad) * 180}
              stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,4"
              opacity="0.5"
              style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            <text
              x="595" y={220 - (1 / maxGrad) * 180 + 3}
              fill="#fbbf24" fontSize="9" opacity="0.7"
              style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              1.0
            </text>
          </g>
        )}

        {/* Bars */}
        {gradients.map((g, i) => {
          const barW = 38
          const gap = 52
          const x = 80 + i * gap
          const normalized = Math.min(g / maxGrad, 1)
          const h = Math.max(normalized * 180, 2)
          const y = 220 - h
          const opacity = 0.4 + normalized * 0.6

          return (
            <g key={i}>
              {/* Glow effect */}
              <rect
                x={x - 2} y={y - 2}
                width={barW + 4} height={h + 4}
                fill={colors.glow}
                rx="6"
                style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              {/* Main bar */}
              <rect
                x={x} y={y}
                width={barW} height={h}
                fill={colors.bar}
                rx="4"
                opacity={opacity}
                style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              {/* Value label */}
              <text
                x={x + barW / 2} y={Math.max(y - 8, 30)}
                textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace"
                style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                {g > 100 ? g.toExponential(1) : g.toFixed(2)}
              </text>
              {/* Timestep label */}
              <text x={x + barW / 2} y="238" textAnchor="middle" fill="#64748b" fontSize="10">
                t{i > 0 ? `-${TIMESTEPS - 1 - i}` : ''}
              </text>
            </g>
          )
        })}

        {/* Gradient flow arrow */}
        <defs>
          <marker id="grad-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#f97316" opacity="0.6" />
          </marker>
        </defs>
        <line x1="555" y1="248" x2="105" y2="248" stroke="#f97316" strokeWidth="1.5" opacity="0.4" markerEnd="url(#grad-arrow)" />
        <text x="330" y="258" textAnchor="middle" fill="#f97316" fontSize="9" opacity="0.6">
          gradient flows backward
        </text>
      </svg>

      {/* Slider */}
      <div style={{ padding: '12px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Weight Eigenvalue (&#955;)</span>
          <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>{eigenvalue.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.01"
          value={eigenvalue}
          onChange={(e) => setEigenvalue(parseFloat(e.target.value))}
          style={{
            width: '100%', height: '6px', borderRadius: '3px',
            background: `linear-gradient(to right, #3b82f6, #10b981 45%, #10b981 55%, #ef4444)`,
            appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: '#3b82f6' }}>Vanishing</span>
          <span style={{ fontSize: '11px', color: '#10b981' }}>Healthy</span>
          <span style={{ fontSize: '11px', color: '#ef4444' }}>Exploding</span>
        </div>

        {/* Status */}
        <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: eigenvalue < 0.85 ? 'rgba(59,130,246,0.1)' : eigenvalue > 1.15 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${eigenvalue < 0.85 ? 'rgba(59,130,246,0.2)' : eigenvalue > 1.15 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, color: eigenvalue < 0.85 ? '#93c5fd' : eigenvalue > 1.15 ? '#fca5a5' : '#6ee7b7', transition: 'all 0.3s ease' }}>
          {eigenvalue < 0.85 && '⚠ Gradients vanish exponentially — early timesteps receive negligible updates. The network forgets long-range dependencies.'}
          {eigenvalue >= 0.85 && eigenvalue <= 1.15 && '✓ Gradients flow healthily through time — the network can learn dependencies across all timesteps.'}
          {eigenvalue > 1.15 && '⚠ Gradients explode exponentially — training becomes unstable with NaN losses and wildly oscillating parameters.'}
        </div>
      </div>
    </div>
  )
}
