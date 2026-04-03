"use client"

import { useEffect, useRef, useState } from "react"

const SIZE = 300
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = SIZE / 2 - 10
const ACCENT = "rgba(74, 222, 128, 0.85)"
const MUTED = "rgba(255, 255, 255, 0.07)"

interface Blip {
  angle: number
  dist: number
  birth: number
  life: number
}

export default function RadarSweep() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas when not hovering
    if (!hovering) {
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, SIZE, SIZE)
      return
    }

    let raf: number
    const blips: Blip[] = []
    const start = Date.now()

    const draw = () => {
      const now = Date.now()
      const elapsed = (now - start) / 1000
      const sweepAngle = (elapsed * 0.72) % (Math.PI * 2)

      // fade background
      ctx.fillStyle = "rgba(10, 10, 10, 0.25)"
      ctx.fillRect(0, 0, SIZE, SIZE)

      // concentric circles
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(CX, CY, (RADIUS / 4) * i, 0, Math.PI * 2)
        ctx.strokeStyle = MUTED
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // crosshairs
      ctx.strokeStyle = MUTED
      ctx.beginPath()
      ctx.moveTo(CX, CY - RADIUS)
      ctx.lineTo(CX, CY + RADIUS)
      ctx.moveTo(CX - RADIUS, CY)
      ctx.lineTo(CX + RADIUS, CY)
      ctx.stroke()

      // sweep cone
      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.arc(CX, CY, RADIUS, sweepAngle - 0.5, sweepAngle)
      ctx.closePath()
      ctx.fillStyle = "rgba(74, 222, 128, 0.12)"
      ctx.fill()

      // sweep line
      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.lineTo(
        CX + Math.cos(sweepAngle) * RADIUS,
        CY + Math.sin(sweepAngle) * RADIUS
      )
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 2
      ctx.stroke()

      // spawn blips near sweep
      if (Math.random() < 0.04) {
        blips.push({
          angle: sweepAngle + (Math.random() - 0.5) * 0.3,
          dist: 0.2 + Math.random() * 0.75,
          birth: now,
          life: 2000 + Math.random() * 2000,
        })
      }

      // draw blips
      for (let i = blips.length - 1; i >= 0; i--) {
        const b = blips[i]
        const age = now - b.birth
        if (age > b.life) {
          blips.splice(i, 1)
          continue
        }
        const alpha = 1 - age / b.life
        const bx = CX + Math.cos(b.angle) * b.dist * RADIUS
        const by = CY + Math.sin(b.angle) * b.dist * RADIUS
        ctx.beginPath()
        ctx.arc(bx, by, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${(alpha * 0.9).toFixed(2)})`
        ctx.fill()
      }

      // center dot
      ctx.beginPath()
      ctx.arc(CX, CY, 3, 0, Math.PI * 2)
      ctx.fillStyle = ACCENT
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, SIZE, SIZE)
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
        width={SIZE}
        height={SIZE}
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "50%" }}
      />
    </div>
  )
}
