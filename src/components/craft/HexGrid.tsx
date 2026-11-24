"use client"

import { useEffect, useState } from "react"

const COLS = 8
const ROWS = 6
const HEX_SIZE = 22
const ACCENT = "rgba(74, 222, 128, 0.85)"
const INACTIVE = "rgba(255, 255, 255, 0.07)"
const TOTAL = COLS * ROWS

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return pts.join(" ")
}

export default function HexGrid() {
  const [activeSet, setActiveSet] = useState<Set<number>>(new Set())
  const [waveCenter, setWaveCenter] = useState({ col: 0, row: 0 })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (!hovering) {
      setActiveSet(new Set())
      return
    }

    let frame = 0
    const interval = setInterval(() => {
      if (frame % 20 === 0) {
        setWaveCenter({
          col: Math.floor(Math.random() * COLS),
          row: Math.floor(Math.random() * ROWS),
        })
      }

      setActiveSet(() => {
        const next = new Set<number>()
        // Wave expands from center
        const radius = (frame % 20) * 0.8
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const dist = Math.sqrt(
              Math.pow(c - waveCenter.col, 2) + Math.pow(r - waveCenter.row, 2)
            )
            if (Math.abs(dist - radius) < 1.2) {
              next.add(r * COLS + c)
            }
          }
        }
        return next
      })

      frame++
    }, 170)

    return () => clearInterval(interval)
  }, [waveCenter, hovering])

  const hexW = HEX_SIZE * Math.sqrt(3)
  const hexH = HEX_SIZE * 2
  const svgW = COLS * hexW + hexW / 2 + 4
  const svgH = ROWS * hexH * 0.75 + hexH * 0.25 + 4

  const hexagons: { cx: number; cy: number; idx: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const offset = r % 2 === 1 ? hexW / 2 : 0
      const cx = c * hexW + hexW / 2 + offset + 2
      const cy = r * hexH * 0.75 + HEX_SIZE + 2
      hexagons.push({ cx, cy, idx: r * COLS + c })
    }
  }

  return (
    <div
      className="w-full h-full"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-mono), monospace",
        background: "transparent",
        cursor: 'crosshair',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      >
        {hexagons.map(({ cx, cy, idx }) => {
          const isActive = activeSet.has(idx)
          return (
            <polygon
              key={idx}
              points={hexPoints(cx, cy, HEX_SIZE - 1)}
              fill={isActive ? "rgba(74, 222, 128, 0.15)" : "transparent"}
              stroke={isActive ? ACCENT : INACTIVE}
              strokeWidth={isActive ? 1.5 : 1}
              style={{
                transition: "all 0.3s ease",
              }}
            />
          )
        })}
      </svg>
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.05em",
        }}
      >
        hex grid{" "}
        <span style={{ color: ACCENT }}>
          {activeSet.size}/{TOTAL}
        </span>
      </div>
    </div>
  )
}
