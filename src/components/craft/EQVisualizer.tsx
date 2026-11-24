"use client"

import { useEffect, useRef, useState } from "react"

const BAR_COUNT = 12
const MAX_SEGMENTS = 16

const TARGETS: number[] = [8, 13, 10, 16, 6, 11, 14, 8, 13, 10, 12, 7]
const ZEROS: number[] = Array(BAR_COUNT).fill(0)

export default function EQVisualizer() {
  const [heights, setHeights] = useState<number[]>(() => ZEROS)
  const [hovering, setHovering] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (hovering) {
      // Start animating
      setHeights(TARGETS)
      intervalRef.current = setInterval(() => {
        setHeights(
          TARGETS.map((base) =>
            Math.max(1, Math.min(MAX_SEGMENTS, Math.round(base + (Math.random() - 0.5) * 4)))
          )
        )
      }, 350)
    } else {
      // Stop animating, show empty bars
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      setHeights(ZEROS)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [hovering])

  return (
    <div
      className="w-full h-full flex items-end justify-center"
      style={{ padding: "0 24px 24px", cursor: "crosshair" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", width: "100%" }}>
        {heights.map((h, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", flexDirection: "column-reverse", gap: "5px", width: "100%" }}>
              {Array.from({ length: MAX_SEGMENTS }, (_, si) => (
                <div
                  key={si}
                  style={{
                    width: "100%",
                    height: "7px",
                    backgroundColor: si < Math.round(h)
                      ? "rgba(74, 222, 128, 0.85)"
                      : "rgba(255, 255, 255, 0.07)",
                    transition: `background-color 0.2s ease ${i * 12}ms`,
                  }}
                />
              ))}
            </div>
            <span style={{
              fontSize: "9px",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "rgba(255,255,255,0.5)",
            }}>
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
