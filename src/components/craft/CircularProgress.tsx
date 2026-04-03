"use client"

import { useEffect, useState, useRef } from "react"

const ACCENT = "rgba(74, 222, 128, 0.85)"
const TRACK = "rgba(255, 255, 255, 0.07)"
const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2

interface Ring {
  label: string
  radius: number
  strokeWidth: number
  baseValue: number
  range: number
  speed: number
  phase: number
}

const RINGS: Ring[] = [
  { label: "SYS", radius: 110, strokeWidth: 8, baseValue: 72, range: 15, speed: 0.28, phase: 0 },
  { label: "NET", radius: 90, strokeWidth: 8, baseValue: 55, range: 20, speed: 0.21, phase: 1.2 },
  { label: "MEM", radius: 70, strokeWidth: 8, baseValue: 84, range: 10, speed: 0.35, phase: 2.5 },
  { label: "DSK", radius: 50, strokeWidth: 8, baseValue: 38, range: 25, speed: 0.14, phase: 3.8 },
]

const ZERO_VALUES = RINGS.map(() => 0)

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = {
    x: cx + r * Math.cos(startAngle),
    y: cy + r * Math.sin(startAngle),
  }
  const end = {
    x: cx + r * Math.cos(endAngle),
    y: cy + r * Math.sin(endAngle),
  }
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export default function CircularProgress() {
  const [values, setValues] = useState<number[]>(ZERO_VALUES)
  const [hovering, setHovering] = useState(false)
  const hoveringRef = useRef(false)

  useEffect(() => {
    hoveringRef.current = hovering
  }, [hovering])

  useEffect(() => {
    let raf: number
    const start = Date.now()

    const animate = () => {
      if (hoveringRef.current) {
        const t = (Date.now() - start) / 1000
        const newValues = RINGS.map((ring) => {
          const v = ring.baseValue + Math.sin(t * ring.speed + ring.phase) * ring.range
          return Math.max(0, Math.min(100, v))
        })
        setValues(newValues)
      } else {
        setValues(ZERO_VALUES)
      }
      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  const startAngle = -Math.PI / 2

  return (
    <div
      className="w-full h-full"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        fontFamily: "var(--font-geist-mono), monospace",
        cursor: "crosshair",
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ maxWidth: 280, maxHeight: 280, width: "80%", height: "80%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {RINGS.map((ring, i) => {
          const pct = values[i] / 100
          const endAngle = startAngle + pct * Math.PI * 2

          return (
            <g key={ring.label}>
              {/* Track circle */}
              <circle
                cx={CX}
                cy={CY}
                r={ring.radius}
                fill="none"
                stroke={TRACK}
                strokeWidth={ring.strokeWidth}
              />
              {/* Active arc */}
              {pct > 0.001 && (
                <path
                  d={describeArc(CX, CY, ring.radius, startAngle, endAngle)}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth={ring.strokeWidth}
                  strokeLinecap="round"
                />
              )}
              {/* Endpoint dot */}
              {pct > 0.001 && (
                <circle
                  cx={CX + ring.radius * Math.cos(endAngle)}
                  cy={CY + ring.radius * Math.sin(endAngle)}
                  r={ring.strokeWidth / 2 + 1}
                  fill={ACCENT}
                />
              )}
              {/* Label */}
              <text
                x={CX}
                y={CY - ring.radius}
                dx={ring.radius < 70 ? -20 : -22}
                dy={-ring.strokeWidth - 2}
                style={{
                  fontSize: 8,
                  fill: "rgba(255, 255, 255, 0.35)",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                {ring.label}
              </text>
              {/* Percentage text at the ring start */}
              <text
                x={CX}
                y={CY - ring.radius}
                dx={10}
                dy={-ring.strokeWidth - 2}
                style={{
                  fontSize: 8,
                  fill: "rgba(255, 255, 255, 0.55)",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                {Math.round(values[i])}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
