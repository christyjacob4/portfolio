"use client"

import { useEffect, useRef, useState } from "react"

const RINGS = [
  { label: "Move", target: 0.82, radius: 0.38 },
  { label: "Exercise", target: 0.65, radius: 0.28 },
  { label: "Stand", target: 0.93, radius: 0.18 },
]

const GREEN = "rgba(74, 222, 128,"

export default function ActivityRings() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)
  const valuesRef = useRef(RINGS.map(() => 0))
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    let alive = true
    const draw = () => {
      if (!alive) return
      const W = rect.width
      const H = rect.height
      const cx = W / 2
      const cy = H / 2 - 10
      const size = Math.min(W, H)
      ctx.clearRect(0, 0, W, H)

      RINGS.forEach((ring, i) => {
        const target = ring.target
        const diff = target - valuesRef.current[i]
        valuesRef.current[i] += diff * 0.04
        const val = valuesRef.current[i]
        const r = ring.radius * size
        const lineW = size * 0.06
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + Math.PI * 2 * val
        const opacity = 0.9 - i * 0.2

        // Track
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)"
        ctx.lineWidth = lineW
        ctx.lineCap = "round"
        ctx.stroke()

        // Value
        if (val > 0.005) {
          ctx.beginPath()
          ctx.arc(cx, cy, r, startAngle, endAngle)
          ctx.strokeStyle = `${GREEN} ${opacity})`
          ctx.lineWidth = lineW
          ctx.lineCap = "round"
          ctx.stroke()

          // End dot
          const ex = cx + Math.cos(endAngle) * r
          const ey = cy + Math.sin(endAngle) * r
          ctx.beginPath()
          ctx.arc(ex, ey, lineW / 2, 0, Math.PI * 2)
          ctx.fillStyle = `${GREEN} ${opacity})`
          ctx.fill()
        }
      })

      // Center percentage
      {
        const avg = Math.round(valuesRef.current.reduce((a, b) => a + b, 0) / RINGS.length * 100)
        ctx.fillStyle = "rgba(74, 222, 128, 0.9)"
        ctx.font = `bold ${size * 0.08}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${avg}%`, cx, cy)
      }

      // Labels
      RINGS.forEach((ring, i) => {
        const pct = Math.round(valuesRef.current[i] * 100)
        const y = H - 16
        const x = cx + (i - 1) * (size * 0.22)
        ctx.fillStyle = `${GREEN} ${0.5 - i * 0.1})`
        ctx.font = "9px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`${ring.label} ${pct}%`, x, y)
      })

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, [hovering])

  return (
    <div
      className="w-full h-full"
      style={{ cursor: "crosshair" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}
