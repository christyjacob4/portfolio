"use client"

import { useEffect, useRef, useState } from "react"

const W = 300
const H = 300
const ACCENT = "rgba(74, 222, 128, 0.85)"
const CX = W / 2
const CY = H / 2

export default function Spirograph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)
  const hoveringRef = useRef(false)
  hoveringRef.current = hovering

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number
    let elapsed = 0
    let lastTime: number | null = null

    // initial clear
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, W, H)

    const draw = (timestamp: number) => {
      if (hoveringRef.current) {
        if (lastTime !== null) {
          elapsed += (timestamp - lastTime) / 1000
        }
        lastTime = timestamp
      } else {
        lastTime = null
      }

      const t = elapsed

      // slowly evolving parameters
      const R = 80 + Math.sin(t * 0.042) * 15
      const r = 33 + Math.cos(t * 0.066) * 8
      const d = 42 + Math.sin(t * 0.078) * 12

      // fade the canvas slightly for trail effect
      ctx.fillStyle = "rgba(10, 10, 10, 0.02)"
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 1
      ctx.beginPath()

      const steps = 500

      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 20 + t * 0.3
        const x =
          CX + (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta)
        const y =
          CY + (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.globalAlpha = 0.6
      ctx.stroke()
      ctx.globalAlpha = 1.0

      // draw the current drawing point
      const theta = t * 1.2
      const dotX =
        CX + (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta)
      const dotY =
        CY + (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta)

      ctx.beginPath()
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
      ctx.fillStyle = ACCENT
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="w-full h-full"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        fontFamily: "var(--font-geist-mono), monospace",
        cursor: 'crosshair',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
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
