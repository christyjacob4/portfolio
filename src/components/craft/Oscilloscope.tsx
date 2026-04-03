"use client"

import { useEffect, useRef, useState } from "react"

const W = 400
const H = 300
const ACCENT = "rgba(74, 222, 128, 0.85)"

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas when not hovering
    if (!hovering) {
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, W, H)
      return
    }

    let raf: number
    const start = Date.now()

    const draw = () => {
      const t = (Date.now() - start) / 1000

      // slowly drifting parameters
      const a = 3 + Math.sin(t * 0.08) * 2
      const b = 2 + Math.cos(t * 0.055) * 1.5
      const delta = t * 0.18

      ctx.fillStyle = "rgba(10, 10, 10, 0.15)"
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 1.5
      ctx.beginPath()

      const steps = 600
      for (let i = 0; i <= steps; i++) {
        const s = (i / steps) * Math.PI * 2
        const x = W / 2 + Math.sin(a * s + delta) * (W * 0.38)
        const y = H / 2 + Math.sin(b * s) * (H * 0.38)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.stroke()
      frameRef.current = raf
      raf = requestAnimationFrame(draw)
    }

    // initial clear
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, W, H)
    raf = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(raf)
  }, [hovering])

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        fontFamily: "var(--font-geist-mono), monospace",
        cursor: "crosshair",
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 4 }}
      />
    </div>
  )
}
