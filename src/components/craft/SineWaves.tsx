"use client"

import { useEffect, useRef, useState } from "react"

const BG = "#0a0a0a"

const WAVES = [
  { freq: 0.015, amp: 0.25, speed: 0.012, color: "rgba(74, 222, 128, 0.85)", width: 2 },
  { freq: 0.025, amp: 0.18, speed: 0.009, color: "rgba(74, 222, 128, 0.5)", width: 1.5 },
  { freq: 0.01, amp: 0.3, speed: 0.015, color: "rgba(74, 222, 128, 0.3)", width: 1.5 },
  { freq: 0.035, amp: 0.12, speed: 0.018, color: "rgba(74, 222, 128, 0.15)", width: 1 },
]

export default function SineWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)
  const hoveringRef = useRef(false)
  hoveringRef.current = hovering

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let time = 0

    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener("resize", resize)

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.width / window.devicePixelRatio
      const h = canvas.height / window.devicePixelRatio
      const midY = h / 2

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      for (const wave of WAVES) {
        ctx.beginPath()
        ctx.strokeStyle = wave.color
        ctx.lineWidth = wave.width

        for (let x = 0; x <= w; x++) {
          const y = midY + Math.sin(x * wave.freq + time * wave.speed * 100) * (h * wave.amp)
            + Math.sin(x * wave.freq * 0.5 + time * wave.speed * 60) * (h * wave.amp * 0.3)

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      }

      if (hoveringRef.current) {
        time += 1
      }
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div
      className="w-full h-full"
      style={{ cursor: 'crosshair' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block", background: BG }}
      />
    </div>
  )
}
