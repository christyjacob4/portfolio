"use client"

import { useEffect, useState } from "react"

// 5x7 dot matrix font for digits 0-9 and colon
const GLYPHS: Record<string, number[]> = {
  "0": [0x7C, 0xC6, 0xCE, 0xD6, 0xE6, 0xC6, 0x7C],
  "1": [0x30, 0x70, 0x30, 0x30, 0x30, 0x30, 0xFC],
  "2": [0x78, 0xCC, 0x0C, 0x38, 0x60, 0xC0, 0xFC],
  "3": [0x78, 0xCC, 0x0C, 0x38, 0x0C, 0xCC, 0x78],
  "4": [0x1C, 0x3C, 0x6C, 0xCC, 0xFE, 0x0C, 0x0C],
  "5": [0xFC, 0xC0, 0xF8, 0x0C, 0x0C, 0xCC, 0x78],
  "6": [0x38, 0x60, 0xC0, 0xF8, 0xCC, 0xCC, 0x78],
  "7": [0xFC, 0x0C, 0x18, 0x30, 0x60, 0x60, 0x60],
  "8": [0x78, 0xCC, 0xCC, 0x78, 0xCC, 0xCC, 0x78],
  "9": [0x78, 0xCC, 0xCC, 0x7C, 0x0C, 0x18, 0x70],
  ":": [0x00, 0x30, 0x30, 0x00, 0x30, 0x30, 0x00],
}

function getPixels(char: string): boolean[][] {
  const glyph = GLYPHS[char] || GLYPHS["0"]
  return glyph.map((row) =>
    Array.from({ length: 8 }, (_, i) => Boolean((row >> (7 - i)) & 1))
  )
}

export default function DotMatrixClock() {
  const [time, setTime] = useState("")
  const [mounted, setMounted] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const chars = time.split("")

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ padding: "24px", opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease", cursor: "crosshair" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {chars.map((char, ci) => {
          const pixels = getPixels(char)
          const isColon = char === ":"
          return (
            <div
              key={ci}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                width: isColon ? "12px" : undefined,
              }}
            >
              {pixels.map((row, ri) => (
                <div key={ri} style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                  {row.map((on, di) => (
                    <div
                      key={di}
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: on
                          ? ("rgba(74, 222, 128, 0.85)")
                          : "rgba(255, 255, 255, 0.04)",
                        transition: "background-color 0.3s ease",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
