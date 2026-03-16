"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'

const SOURCE = ['The', 'cat', 'sat', '<eos>']
const TARGET = ['<sos>', 'Le', 'chat', 'assis', '<eos>']

export default function Seq2SeqViz() {
  const [step, setStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSteps = SOURCE.length + TARGET.length - 1

  const play = useCallback(() => {
    setIsPlaying(true)
    setStep(0)
    let s = 0
    intervalRef.current = setInterval(() => {
      s++
      if (s > totalSteps) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsPlaying(false)
        return
      }
      setStep(s)
    }, 800)
  }, [totalSteps])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const isEncoding = step >= 0 && step < SOURCE.length
  const decoderStep = step >= SOURCE.length ? step - SOURCE.length : -1
  const cellW = 70
  const cellH = 45
  const gap = 16

  return (
    <div className="my-10 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.1)' }}>
      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Animated Visualization</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Sequence-to-Sequence Model</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Watch the encoder compress the input into a context vector, then the decoder generates the translation
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 24px' }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '6px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: isPlaying ? 'rgba(148,163,184,0.1)' : 'rgba(251,191,36,0.15)',
            border: `1px solid ${isPlaying ? 'rgba(148,163,184,0.2)' : '#fbbf24'}`,
            color: isPlaying ? '#64748b' : '#fbbf24', cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? 'Playing...' : '▶ Play Translation'}
        </button>
      </div>

      <svg viewBox="0 0 780 280" style={{ width: '100%', display: 'block' }}>
        <defs>
          <marker id="s2s-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#64748b" />
          </marker>
          <marker id="s2s-arrow-active" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#fbbf24" />
          </marker>
        </defs>

        {/* Section labels */}
        <text x="170" y="22" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="700" opacity="0.8">ENCODER</text>
        <text x="590" y="22" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700" opacity="0.8">DECODER</text>

        {/* Encoder cells */}
        {SOURCE.map((word, i) => {
          const x = 40 + i * (cellW + gap)
          const isActive = step >= 0 && i <= step && isEncoding || step >= SOURCE.length
          const isCurrent = isEncoding && i === step

          return (
            <g key={`enc-${i}`}>
              {/* Input word */}
              <text x={x + cellW / 2} y="230" textAnchor="middle" fill={isCurrent ? '#fbbf24' : '#93c5fd'} fontSize="13" fontWeight={isCurrent ? 700 : 500} style={{ transition: 'all 0.3s ease' }}>
                {word}
              </text>

              {/* Arrow up */}
              <line x1={x + cellW / 2} y1="215" x2={x + cellW / 2} y2="145" stroke={isCurrent ? '#fbbf24' : '#475569'} strokeWidth="1.5" markerEnd={isCurrent ? 'url(#s2s-arrow-active)' : 'url(#s2s-arrow)'} style={{ transition: 'all 0.3s ease' }} />

              {/* LSTM cell */}
              <rect x={x} y="95" width={cellW} height={cellH} rx="10"
                fill={isCurrent ? 'rgba(96,165,250,0.25)' : isActive ? 'rgba(96,165,250,0.12)' : 'rgba(96,165,250,0.04)'}
                stroke={isCurrent ? '#fbbf24' : '#60a5fa'}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                style={{ transition: 'all 0.4s ease' }}
              />
              <text x={x + cellW / 2} y="115" textAnchor="middle" fill={isCurrent ? '#fbbf24' : '#93c5fd'} fontSize="10" fontWeight="600" style={{ transition: 'all 0.3s ease' }}>LSTM</text>
              <text x={x + cellW / 2} y="130" textAnchor="middle" fill="#64748b" fontSize="9">h_{i}</text>

              {/* Recurrent arrow */}
              {i < SOURCE.length - 1 && (
                <line x1={x + cellW + 2} y1="118" x2={x + cellW + gap - 2} y2="118"
                  stroke={isActive && i < step ? '#60a5fa' : '#475569'} strokeWidth="1.5"
                  markerEnd="url(#s2s-arrow)"
                  opacity={isActive && i < step ? 0.8 : 0.3}
                  style={{ transition: 'all 0.3s ease' }}
                />
              )}
            </g>
          )
        })}

        {/* Context vector (bottleneck) */}
        {(() => {
          const bottleX = 40 + SOURCE.length * (cellW + gap) - gap / 2
          const isBottleActive = step >= SOURCE.length - 1
          return (
            <g>
              {/* Narrowing shape */}
              <path
                d={`M ${bottleX} 80 L ${bottleX + 30} 100 L ${bottleX + 30} 135 L ${bottleX} 155 Z`}
                fill={isBottleActive ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.05)'}
                stroke="#fbbf24" strokeWidth={isBottleActive ? 2 : 1}
                style={{ transition: 'all 0.5s ease' }}
              />
              <text x={bottleX + 15} y="122" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="700" style={{ transition: 'all 0.3s ease' }} opacity={isBottleActive ? 1 : 0.4}>
                c
              </text>
              <text x={bottleX + 15} y="60" textAnchor="middle" fill="#fbbf24" fontSize="9" opacity="0.6">
                context
              </text>
              <text x={bottleX + 15} y="72" textAnchor="middle" fill="#fbbf24" fontSize="9" opacity="0.6">
                vector
              </text>

              {/* Arrow from last encoder to bottleneck */}
              <line x1={bottleX - gap / 2 + 2} y1="118" x2={bottleX - 2} y2="118"
                stroke={isBottleActive ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                markerEnd={isBottleActive ? 'url(#s2s-arrow-active)' : 'url(#s2s-arrow)'}
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Arrow from bottleneck to first decoder */}
              <line x1={bottleX + 32} y1="118" x2={bottleX + gap + 32} y2="118"
                stroke={isBottleActive ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                markerEnd={isBottleActive ? 'url(#s2s-arrow-active)' : 'url(#s2s-arrow)'}
                style={{ transition: 'all 0.3s ease' }}
              />
            </g>
          )
        })()}

        {/* Decoder cells */}
        {TARGET.map((word, i) => {
          const offsetX = 40 + SOURCE.length * (cellW + gap) + 50
          const x = offsetX + i * (cellW + gap)
          const isActive = decoderStep >= 0 && i <= decoderStep
          const isCurrent = i === decoderStep

          return (
            <g key={`dec-${i}`}>
              {/* LSTM cell */}
              <rect x={x} y="95" width={cellW} height={cellH} rx="10"
                fill={isCurrent ? 'rgba(52,211,153,0.25)' : isActive ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.04)'}
                stroke={isCurrent ? '#fbbf24' : '#34d399'}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                style={{ transition: 'all 0.4s ease' }}
              />
              <text x={x + cellW / 2} y="115" textAnchor="middle" fill={isCurrent ? '#fbbf24' : '#6ee7b7'} fontSize="10" fontWeight="600" style={{ transition: 'all 0.3s ease' }}>LSTM</text>
              <text x={x + cellW / 2} y="130" textAnchor="middle" fill="#64748b" fontSize="9">s_{i}</text>

              {/* Output word (above) */}
              {i > 0 && (
                <g>
                  <line x1={x + cellW / 2} y1="93" x2={x + cellW / 2} y2="55" stroke={isActive ? '#34d399' : '#475569'} strokeWidth="1.5" markerEnd="url(#s2s-arrow)" style={{ transition: 'all 0.3s ease' }} />
                  <text x={x + cellW / 2} y="48" textAnchor="middle" fill={isCurrent ? '#fbbf24' : '#6ee7b7'} fontSize="13" fontWeight={isCurrent ? 700 : 500} style={{ transition: 'all 0.3s ease' }}>
                    {word}
                  </text>
                </g>
              )}

              {/* Input word (below) — teacher forcing */}
              <text x={x + cellW / 2} y="230" textAnchor="middle" fill={isCurrent ? '#fbbf24' : '#6ee7b7'} fontSize="13" fontWeight={isCurrent ? 700 : 500} opacity={isActive ? 1 : 0.3} style={{ transition: 'all 0.3s ease' }}>
                {word}
              </text>
              <line x1={x + cellW / 2} y1="215" x2={x + cellW / 2} y2="145" stroke={isCurrent ? '#fbbf24' : '#475569'} strokeWidth="1.5" markerEnd={isCurrent ? 'url(#s2s-arrow-active)' : 'url(#s2s-arrow)'} opacity={isActive ? 0.8 : 0.3} style={{ transition: 'all 0.3s ease' }} />

              {/* Recurrent arrow */}
              {i < TARGET.length - 1 && (
                <line x1={x + cellW + 2} y1="118" x2={x + cellW + gap - 2} y2="118"
                  stroke={isActive && i < decoderStep ? '#34d399' : '#475569'} strokeWidth="1.5"
                  markerEnd="url(#s2s-arrow)"
                  opacity={isActive && i < decoderStep ? 0.8 : 0.3}
                  style={{ transition: 'all 0.3s ease' }}
                />
              )}
            </g>
          )
        })}

        {/* Teacher forcing label */}
        <text x="590" y="260" textAnchor="middle" fill="#475569" fontSize="9" fontStyle="italic">
          (teacher forcing: feed ground truth during training)
        </text>
      </svg>

      {/* Step info */}
      <div style={{ padding: '8px 24px 20px' }}>
        {step < 0 && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
            Press <strong>Play</strong> to watch the encoder process &ldquo;The cat sat&rdquo; and the decoder generate the French translation
          </div>
        )}
        {isEncoding && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', fontSize: '13px', color: '#93c5fd' }}>
            <strong style={{ color: '#60a5fa' }}>Encoding:</strong> Reading &ldquo;{SOURCE[step]}&rdquo; — building up the context representation...
            {step === SOURCE.length - 1 && ' The final hidden state becomes the context vector c.'}
          </div>
        )}
        {decoderStep >= 0 && decoderStep < TARGET.length && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', fontSize: '13px', color: '#6ee7b7' }}>
            <strong style={{ color: '#34d399' }}>Decoding:</strong> Generating &ldquo;{TARGET[Math.min(decoderStep + 1, TARGET.length - 1)]}&rdquo; conditioned on the context vector and previous outputs
          </div>
        )}

        {/* Bottleneck callout */}
        <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
          <strong style={{ color: '#fbbf24' }}>The bottleneck problem:</strong> The entire source sentence must be compressed into a single fixed-length context vector.
          For long sentences, information is inevitably lost. This limitation directly motivated the invention of the <em style={{ color: '#fbbf24' }}>attention mechanism</em>.
        </div>
      </div>
    </div>
  )
}
