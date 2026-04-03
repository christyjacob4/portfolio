"use client"

import { useEffect, useRef, useState } from "react"

const W = 300
const H = 300
const ACCENT = "rgba(74, 222, 128, 0.85)"
const PIVOT = { x: W / 2, y: 40 }
const STRING_LEN = 180
const BOB_RADIUS = 10
const TRAIL_COUNT = 12
const GRAVITY = 9.81
const LENGTH_M = 3.4

export default function Pendulum() {
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
    const trail: { x: number; y: number }[] = []
    const period = 2 * Math.PI * Math.sqrt(LENGTH_M / GRAVITY)

    const drawStatic = () => {
      // Draw pendulum at rest (angle = 0)
      const bobX = PIVOT.x
      const bobY = PIVOT.y + STRING_LEN

      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, W, H)

      // string
      ctx.beginPath()
      ctx.moveTo(PIVOT.x, PIVOT.y)
      ctx.lineTo(bobX, bobY)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // pivot
      ctx.beginPath()
      ctx.arc(PIVOT.x, PIVOT.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.fill()

      // bob
      ctx.beginPath()
      ctx.arc(bobX, bobY, BOB_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(74, 222, 128, 0.4)"
      ctx.fill()
    }

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
      const angle = (Math.PI / 5) * Math.sin((2 * Math.PI * t) / period)

      const bobX = PIVOT.x + STRING_LEN * Math.sin(angle)
      const bobY = PIVOT.y + STRING_LEN * Math.cos(angle)

      if (hoveringRef.current) {
        trail.push({ x: bobX, y: bobY })
        if (trail.length > TRAIL_COUNT) trail.shift()
      } else {
        trail.length = 0
      }

      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, W, H)

      if (!hoveringRef.current) {
        drawStatic()
        raf = requestAnimationFrame(draw)
        return
      }

      // trail
      for (let i = 0; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.4
        ctx.beginPath()
        ctx.arc(trail[i].x, trail[i].y, BOB_RADIUS * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`
        ctx.fill()
      }

      // string
      ctx.beginPath()
      ctx.moveTo(PIVOT.x, PIVOT.y)
      ctx.lineTo(bobX, bobY)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // pivot
      ctx.beginPath()
      ctx.arc(PIVOT.x, PIVOT.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.fill()

      // bob
      ctx.beginPath()
      ctx.arc(bobX, bobY, BOB_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = ACCENT
      ctx.fill()

      // bob glow
      ctx.beginPath()
      ctx.arc(bobX, bobY, BOB_RADIUS + 4, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(74, 222, 128, 0.15)"
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, W, H)
    drawStatic()
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
