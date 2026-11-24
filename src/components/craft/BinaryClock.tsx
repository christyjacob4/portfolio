"use client"

import { useEffect, useState } from "react"

function toBinary(n: number, bits: number): boolean[] {
  return Array.from({ length: bits }, (_, i) => Boolean((n >> (bits - 1 - i)) & 1))
}

export default function BinaryClock() {
  const [time, setTime] = useState<{ h: number; m: number; s: number }>({ h: 0, m: 0, s: 0 })
  const [mounted, setMounted] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      setTime({ h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const rows = [
    { label: "HR", bits: toBinary(time.h, 6), value: time.h },
    { label: "MN", bits: toBinary(time.m, 6), value: time.m },
    { label: "SC", bits: toBinary(time.s, 6), value: time.s },
  ]

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-5"
      style={{ padding: "24px", cursor: "crosshair" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Digital readout */}
      <div style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "28px",
        fontWeight: 700,
        color: "rgba(74, 222, 128, 0.9)",
        letterSpacing: "0.08em",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease, color 0.3s ease",
      }}>
        {String(time.h).padStart(2, "0")}
        <span style={{ opacity: 0.4 }}>:</span>
        {String(time.m).padStart(2, "0")}
        <span style={{ opacity: 0.4 }}>:</span>
        {String(time.s).padStart(2, "0")}
      </div>

      {/* Binary rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "260px" }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontSize: "9px",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "rgba(255,255,255,0.5)",
              width: "18px",
              flexShrink: 0,
            }}>
              {row.label}
            </span>
            <div style={{ display: "flex", gap: "4px", flex: 1 }}>
              {row.bits.map((on, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: "10px",
                    borderRadius: "1px",
                    backgroundColor: on
                      ? ("rgba(74, 222, 128, 0.8)")
                      : "rgba(255, 255, 255, 0.06)",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </div>
            <span style={{
              fontSize: "9px",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "rgba(255,255,255,0.5)",
              width: "18px",
              textAlign: "right",
              flexShrink: 0,
              transition: "color 0.3s ease",
            }}>
              {String(row.value).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
