"use client"

import { useEffect, useState, useRef, useCallback } from "react"

const GRID = 16
const ACCENT = "rgba(74, 222, 128, 0.85)"
const INACTIVE = "rgba(255, 255, 255, 0.07)"

// Each pattern is a list of [row, col] coordinates
const HEART: [number, number][] = (() => {
  const rows = [
    "................",
    "................",
    "..011..011......",
    ".01110.01110....",
    ".0111110111100..",
    ".01111111111100.",
    "..111111111110..",
    "...1111111110...",
    "....11111110....",
    ".....111110.....",
    "......1110......",
    ".......10.......",
    "................",
    "................",
    "................",
    "................",
  ]
  const pts: [number, number][] = []
  rows.forEach((r, ri) => {
    for (let ci = 0; ci < r.length; ci++) {
      if (r[ci] === "1" || r[ci] === "0") pts.push([ri, ci])
    }
  })
  return pts
})()

const STAR: [number, number][] = (() => {
  const rows = [
    "................",
    ".......1........",
    ".......1........",
    "......111.......",
    "......111.......",
    ".11111111111111.",
    "..1111111111110.",
    "...11111111110..",
    "....1111111.....",
    "...1111111110...",
    "..11110.011110..",
    ".1110.....0110..",
    ".10.........10..",
    "................",
    "................",
    "................",
  ]
  const pts: [number, number][] = []
  rows.forEach((r, ri) => {
    for (let ci = 0; ci < r.length; ci++) {
      if (r[ci] === "1" || r[ci] === "0") pts.push([ri, ci])
    }
  })
  return pts
})()

const SMILEY: [number, number][] = (() => {
  const rows = [
    "................",
    ".....011110.....",
    "....1......1....",
    "...1........1...",
    "..1..1....1..1..",
    "..1..1....1..1..",
    "..1..........1..",
    "..1..........1..",
    "..1..1....1..1..",
    "..1...1111...1..",
    "...1........1...",
    "....1......1....",
    ".....011110.....",
    "................",
    "................",
    "................",
  ]
  const pts: [number, number][] = []
  rows.forEach((r, ri) => {
    for (let ci = 0; ci < r.length; ci++) {
      if (r[ci] === "1" || r[ci] === "0") pts.push([ri, ci])
    }
  })
  return pts
})()

const PATTERNS = [
  { name: "heart", data: HEART },
  { name: "star", data: STAR },
  { name: "smiley", data: SMILEY },
]

export default function PixelCanvas() {
  const [pixels, setPixels] = useState<Set<string>>(new Set())
  const [patIdx, setPatIdx] = useState(0)
  const [pixelIdx, setPixelIdx] = useState(0)
  const [phase, setPhase] = useState<"drawing" | "pausing" | "clearing">("drawing")
  const patIdxRef = useRef(patIdx)
  const [hovering, setHovering] = useState(false)

  patIdxRef.current = patIdx

  const currentPattern = PATTERNS[patIdx].data

  useEffect(() => {
    setPixels(new Set())
    setPixelIdx(0)
    setPhase("drawing")
  }, [patIdx])

  useEffect(() => {
    if (!hovering) return

    if (phase === "drawing") {
      if (pixelIdx >= currentPattern.length) {
        setPhase("pausing")
        return
      }
      const timeout = setTimeout(() => {
        const [r, c] = currentPattern[pixelIdx]
        setPixels((prev) => {
          const next = new Set(prev)
          next.add(`${r},${c}`)
          return next
        })
        setPixelIdx((p) => p + 1)
      }, 42)
      return () => clearTimeout(timeout)
    }

    if (phase === "pausing") {
      const timeout = setTimeout(() => setPhase("clearing"), 1500)
      return () => clearTimeout(timeout)
    }

    if (phase === "clearing") {
      const timeout = setTimeout(() => {
        setPatIdx((p) => (p + 1) % PATTERNS.length)
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [phase, pixelIdx, currentPattern, hovering])

  const cellSize = 16
  const gap = 1
  const totalSize = GRID * (cellSize + gap) + gap

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
        width={totalSize}
        height={totalSize}
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      >
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const key = `${r},${c}`
            const isActive = phase !== "clearing" && pixels.has(key)
            return (
              <rect
                key={key}
                x={gap + c * (cellSize + gap)}
                y={gap + r * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={isActive ? ACCENT : INACTIVE}
                style={{ transition: "fill 0.15s ease" }}
              />
            )
          })
        )}
      </svg>
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.05em",
        }}
      >
        pixel canvas{" "}
        <span style={{ color: ACCENT }}>{PATTERNS[patIdx].name}</span>
      </div>
    </div>
  )
}
