"use client"

import { useEffect, useState } from "react"

const ACCENT = "rgba(74, 222, 128, 0.85)"
const ACCENT_DIM = "rgba(255, 255, 255, 0.15)"
const DIM = "rgba(255, 255, 255, 0.07)"

// Simple encoding: each digit maps to a pattern of thin/thick bars
const PATTERNS: Record<string, number[]> = {
  "0": [1, 1, 3, 1, 2],
  "1": [2, 1, 1, 1, 3],
  "2": [1, 2, 1, 1, 3],
  "3": [3, 1, 1, 1, 2],
  "4": [1, 1, 2, 1, 3],
  "5": [2, 1, 2, 1, 2],
  "6": [1, 2, 2, 1, 2],
  "7": [1, 1, 1, 2, 3],
  "8": [2, 1, 1, 2, 2],
  "9": [1, 2, 1, 2, 2],
  ":": [1, 1, 1, 1, 1],
}

function timeToBarcode(time: string): { width: number; on: boolean }[] {
  const bars: { width: number; on: boolean }[] = []
  // start guard
  bars.push({ width: 1, on: true }, { width: 1, on: false }, { width: 1, on: true })

  for (const ch of time) {
    const pattern = PATTERNS[ch] || PATTERNS["0"]
    pattern.forEach((w, i) => {
      bars.push({ width: w, on: i % 2 === 0 })
    })
    // inter-character gap
    bars.push({ width: 1, on: false })
  }

  // end guard
  bars.push({ width: 1, on: true }, { width: 1, on: false }, { width: 1, on: true })
  return bars
}

export default function BarcodeClock() {
  const [time, setTime] = useState("")
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, "0")
      const m = String(now.getMinutes()).padStart(2, "0")
      const s = String(now.getSeconds()).padStart(2, "0")
      setTime(`${h}:${m}:${s}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const bars = timeToBarcode(time)
  const totalWidth = bars.reduce((sum, b) => sum + b.width, 0)

  return (
    <div
      className="w-full h-full"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        fontFamily: "var(--font-geist-mono), monospace",
        gap: 12,
        cursor: "crosshair",
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <svg
        viewBox={`0 0 ${totalWidth + 10} 120`}
        style={{ maxWidth: 320, width: "80%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {(() => {
          let x = 5
          return bars.map((bar, i) => {
            const rect = (
              <rect
                key={i}
                x={x}
                y={10}
                width={bar.width}
                height={100}
                fill={bar.on ? (hovering ? ACCENT : ACCENT_DIM) : DIM}
                rx={0.3}
                style={{ transition: "fill 0.3s ease" }}
              />
            )
            x += bar.width
            return rect
          })
        })()}
      </svg>
      <span
        style={{
          color: hovering ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.15)",
          fontSize: 13,
          letterSpacing: "0.2em",
          transition: "color 0.3s ease",
        }}
      >
        {time}
      </span>
    </div>
  )
}
