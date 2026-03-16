"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'

const COLORS = {
  input: '#60a5fa',
  hidden: '#a78bfa',
  output: '#34d399',
  weight: '#94a3b8',
  active: '#fbbf24',
  gradient: '#f97316',
}

const SEQUENCE = ['T', 'h', 'e', 'c', 'a', 't']
const TIMESTEPS = SEQUENCE.length

export default function RNNUnrolled() {
  const [activeStep, setActiveStep] = useState(-1)
  const [mode, setMode] = useState<'forward' | 'backward'>('forward')
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const play = useCallback(() => {
    setIsPlaying(true)
    setActiveStep(0)
    let step = 0
    intervalRef.current = setInterval(() => {
      step++
      if (step >= TIMESTEPS) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsPlaying(false)
        setActiveStep(-1)
        return
      }
      setActiveStep(step)
    }, 600)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const cellWidth = 80
  const cellGap = 20
  const startX = 40
  const hiddenY = 160
  const inputY = 300
  const outputY = 40

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Interactive Visualization</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>RNN Unrolled Through Time</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Processing the word &ldquo;{SEQUENCE.join('')}&rdquo; one character at a time. The same weights are shared across all timesteps.
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 24px', alignItems: 'center' }}>
        <button
          onClick={() => setMode('forward')}
          style={{
            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: mode === 'forward' ? 'rgba(96,165,250,0.15)' : 'transparent',
            border: `1px solid ${mode === 'forward' ? '#60a5fa' : 'rgba(148,163,184,0.2)'}`,
            color: mode === 'forward' ? '#60a5fa' : '#64748b', cursor: 'pointer',
          }}
        >
          Forward Pass
        </button>
        <button
          onClick={() => setMode('backward')}
          style={{
            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: mode === 'backward' ? 'rgba(249,115,22,0.15)' : 'transparent',
            border: `1px solid ${mode === 'backward' ? '#f97316' : 'rgba(148,163,184,0.2)'}`,
            color: mode === 'backward' ? '#f97316' : '#64748b', cursor: 'pointer',
          }}
        >
          Backward Pass (BPTT)
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: isPlaying ? 'rgba(148,163,184,0.1)' : 'rgba(251,191,36,0.15)',
            border: `1px solid ${isPlaying ? 'rgba(148,163,184,0.2)' : '#fbbf24'}`,
            color: isPlaying ? '#64748b' : '#fbbf24', cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? 'Playing...' : '▶ Animate'}
        </button>
      </div>

      <svg viewBox="0 0 660 360" style={{ width: '100%', display: 'block' }}>
        <defs>
          <marker id="rnn-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#64748b" />
          </marker>
          <marker id="rnn-arrow-active" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#fbbf24" />
          </marker>
          <marker id="rnn-arrow-gradient" viewBox="0 0 10 6" refX="0" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M10,0 L0,3 L10,6 Z" fill="#f97316" />
          </marker>
        </defs>

        {/* Labels */}
        <text x="15" y={outputY + 20} fill="#34d399" fontSize="10" fontWeight="600" opacity="0.7">output</text>
        <text x="15" y={hiddenY + 5} fill="#a78bfa" fontSize="10" fontWeight="600" opacity="0.7">hidden</text>
        <text x="15" y={inputY + 5} fill="#60a5fa" fontSize="10" fontWeight="600" opacity="0.7">input</text>

        {SEQUENCE.map((char, i) => {
          const x = startX + 60 + i * (cellWidth + cellGap)
          const isActiveForward = mode === 'forward' && activeStep >= 0 && i <= activeStep
          const isCurrentForward = mode === 'forward' && i === activeStep
          const isActiveBackward = mode === 'backward' && activeStep >= 0 && i >= (TIMESTEPS - 1 - activeStep)
          const isCurrentBackward = mode === 'backward' && i === (TIMESTEPS - 1 - activeStep)

          const isCurrent = isCurrentForward || isCurrentBackward
          const isHighlighted = isActiveForward || isActiveBackward

          const gradientDecay = mode === 'backward' ? Math.pow(0.7, activeStep >= 0 ? Math.abs(i - (TIMESTEPS - 1)) : 0) : 1

          return (
            <g key={i} style={{ cursor: 'pointer' }} onClick={() => setActiveStep(i)}>
              {/* Input node */}
              <g>
                <circle cx={x + cellWidth / 2} cy={inputY} r="22" fill={isHighlighted ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.08)'} stroke={COLORS.input} strokeWidth={isCurrent ? 2.5 : 1.5} style={{ transition: 'all 0.3s ease' }} />
                <text x={x + cellWidth / 2} y={inputY + 5} textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="700">{char}</text>
                <text x={x + cellWidth / 2} y={inputY + 32} textAnchor="middle" fill="#64748b" fontSize="9">x_{i}</text>
              </g>

              {/* Hidden state node */}
              <g>
                <rect
                  x={x} y={hiddenY - 25} width={cellWidth} height={50} rx="10"
                  fill={isCurrent ? 'rgba(167,139,250,0.25)' : isHighlighted ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.05)'}
                  stroke={isCurrent ? COLORS.active : COLORS.hidden}
                  strokeWidth={isCurrent ? 2.5 : 1.5}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text x={x + cellWidth / 2} y={hiddenY - 2} textAnchor="middle" fill={isCurrent ? '#fbbf24' : '#c4b5fd'} fontSize="11" fontWeight="700">tanh</text>
                <text x={x + cellWidth / 2} y={hiddenY + 15} textAnchor="middle" fill="#94a3b8" fontSize="9">h_{i}</text>
              </g>

              {/* Output node */}
              <g>
                <circle cx={x + cellWidth / 2} cy={outputY} r="18" fill={isHighlighted ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.05)'} stroke={COLORS.output} strokeWidth={isCurrent ? 2 : 1} style={{ transition: 'all 0.3s ease' }} />
                <text x={x + cellWidth / 2} y={outputY + 4} textAnchor="middle" fill="#6ee7b7" fontSize="9">y_{i}</text>
              </g>

              {/* Input to hidden arrow */}
              <line
                x1={x + cellWidth / 2} y1={inputY - 24}
                x2={x + cellWidth / 2} y2={hiddenY - 28}
                stroke={isHighlighted ? COLORS.active : '#475569'} strokeWidth="1.5"
                markerEnd={isHighlighted ? 'url(#rnn-arrow-active)' : 'url(#rnn-arrow)'}
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Hidden to output arrow */}
              <line
                x1={x + cellWidth / 2} y1={hiddenY - 28}
                x2={x + cellWidth / 2} y2={outputY + 20}
                stroke={isHighlighted ? 'rgba(52,211,153,0.6)' : '#475569'} strokeWidth="1.5"
                markerEnd="url(#rnn-arrow)"
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Recurrent connection (hidden to next hidden) */}
              {i < TIMESTEPS - 1 && (
                <g>
                  {mode === 'forward' ? (
                    <line
                      x1={x + cellWidth + 2} y1={hiddenY}
                      x2={x + cellWidth + cellGap - 2} y2={hiddenY}
                      stroke={isHighlighted && activeStep > i ? COLORS.active : '#475569'}
                      strokeWidth="2"
                      markerEnd={isHighlighted && activeStep > i ? 'url(#rnn-arrow-active)' : 'url(#rnn-arrow)'}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  ) : (
                    <line
                      x1={x + cellWidth + cellGap - 2} y1={hiddenY - 10}
                      x2={x + cellWidth + 2} y2={hiddenY - 10}
                      stroke={isActiveBackward && (TIMESTEPS - 1 - activeStep) <= i ? COLORS.gradient : '#475569'}
                      strokeWidth="2"
                      opacity={isActiveBackward ? gradientDecay : 0.5}
                      markerEnd="url(#rnn-arrow-gradient)"
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  )}
                </g>
              )}

              {/* Weight sharing indicator */}
              {i < TIMESTEPS - 1 && (
                <text x={x + cellWidth + cellGap / 2} y={hiddenY + (mode === 'backward' ? -22 : 18)} textAnchor="middle" fill="#475569" fontSize="8">
                  W_hh
                </text>
              )}
            </g>
          )
        })}

        {/* Shared weights callout */}
        <g>
          <rect x="200" y="340" width="260" height="16" rx="8" fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.2)" strokeWidth="1" />
          <text x="330" y="351" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="500">
            Same W_xh, W_hh, W_hy shared at every timestep
          </text>
        </g>

        {/* Backward pass gradient decay annotation */}
        {mode === 'backward' && activeStep >= 2 && (
          <g>
            <text x="330" y="130" textAnchor="middle" fill="#f97316" fontSize="10" opacity="0.8">
              Gradient shrinks as it travels further back in time
            </text>
          </g>
        )}
      </svg>

      {/* Explanation */}
      <div style={{ padding: '12px 24px 20px' }}>
        {mode === 'forward' ? (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', fontSize: '13px', color: '#93c5fd', lineHeight: '1.6' }}>
            <strong style={{ color: '#60a5fa' }}>Forward Pass:</strong> At each timestep, the hidden state h_t is computed from the current input x_t and the previous hidden state h_{'{t-1}'}.
            The same weight matrices are applied at every step — this is <em>parameter sharing</em>, which allows the network to generalize across sequence positions.
          </div>
        ) : (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', fontSize: '13px', color: '#fdba74', lineHeight: '1.6' }}>
            <strong style={{ color: '#f97316' }}>Backpropagation Through Time (BPTT):</strong> Gradients flow backward through the unrolled network.
            At each step, they&apos;re multiplied by W_hh and the activation derivative — causing them to
            {' '}<strong>shrink exponentially</strong> (vanishing) or <strong>grow exponentially</strong> (exploding).
          </div>
        )}
      </div>
    </div>
  )
}
