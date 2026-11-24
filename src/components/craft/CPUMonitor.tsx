"use client"

import { useEffect, useRef, useState } from "react"

const ACCENT = "rgba(74, 222, 128, 0.85)"
const MUTED = "rgba(255, 255, 255, 0.07)"
const MAX_POINTS = 60

function generateValue(prev: number): number {
  const delta = (Math.random() - 0.5) * 20
  return Math.max(5, Math.min(95, prev + delta))
}

export default function CPUMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<number[]>([30])
  const [current, setCurrent] = useState(30)
  const [hovering, setHovering] = useState(false)
  const hoveringRef = useRef(false)
  hoveringRef.current = hovering

  useEffect(() => {
    let raf: number
    let last = 0
    const interval = 400 // ms between new points

    const loop = (time: number) => {
      if (hoveringRef.current && time - last > interval) {
        last = time
        const prev = dataRef.current[dataRef.current.length - 1]
        const next = generateValue(prev)
        dataRef.current.push(next)
        if (dataRef.current.length > MAX_POINTS) {
          dataRef.current = dataRef.current.slice(-MAX_POINTS)
        }
        setCurrent(Math.round(next))
      }
      draw()
      raf = requestAnimationFrame(loop)
    }

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const padTop = 20
      const padBottom = 20
      const padLeft = 30
      const padRight = 10
      const chartW = w - padLeft - padRight
      const chartH = h - padTop - padBottom

      ctx.clearRect(0, 0, w, h)

      // Draw grid lines
      ctx.strokeStyle = MUTED
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padTop + (chartH / 4) * i
        ctx.beginPath()
        ctx.moveTo(padLeft, y)
        ctx.lineTo(w - padRight, y)
        ctx.stroke()

        // Labels
        ctx.fillStyle = "rgba(255,255,255,0.25)"
        ctx.font = "9px monospace"
        ctx.textAlign = "right"
        ctx.fillText(`${100 - i * 25}`, padLeft - 5, y + 3)
      }

      // Draw line
      const data = dataRef.current
      if (data.length < 2) return

      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 1.5
      ctx.beginPath()

      for (let i = 0; i < data.length; i++) {
        const x = padLeft + (i / (MAX_POINTS - 1)) * chartW
        const y = padTop + chartH - (data[i] / 100) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Fill under line
      const lastX = padLeft + ((data.length - 1) / (MAX_POINTS - 1)) * chartW
      const lastY = padTop + chartH - (data[data.length - 1] / 100) * chartH
      ctx.lineTo(lastX, padTop + chartH)
      ctx.lineTo(padLeft, padTop + chartH)
      ctx.closePath()
      ctx.fillStyle = "rgba(74, 222, 128, 0.08)"
      ctx.fill()

      // Current dot
      ctx.fillStyle = ACCENT
      ctx.beginPath()
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

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
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 4,
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span>cpu usage</span>
        <span style={{ color: ACCENT, fontSize: 16, fontWeight: 600 }}>
          {current}%
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  )
}
