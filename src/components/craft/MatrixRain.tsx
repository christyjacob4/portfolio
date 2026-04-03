"use client"

import { useEffect, useRef, useState } from "react"

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|;:,.<>?/~"
const FONT_SIZE = 14
const ACCENT = "rgba(74, 222, 128, 0.85)"
const DIM = "rgba(74, 222, 128, 0.3)"

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas when not hovering
    if (!hovering) {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, rect.width, rect.height)
      return
    }

    let animId: number
    let columns: number[] = []
    let speeds: number[] = []

    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)

      const colCount = Math.floor(rect.width / FONT_SIZE)
      columns = Array.from({ length: colCount }, () =>
        Math.random() * rect.height / FONT_SIZE
      )
      speeds = Array.from({ length: colCount }, () =>
        0.3 + Math.random() * 0.9
      )
    }

    resize()
    window.addEventListener("resize", resize)

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.width / window.devicePixelRatio
      const h = canvas.height / window.devicePixelRatio

      ctx.fillStyle = "rgba(10, 10, 10, 0.08)"
      ctx.fillRect(0, 0, w, h)

      ctx.font = `${FONT_SIZE}px var(--font-geist-mono), monospace`

      for (let i = 0; i < columns.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * FONT_SIZE
        const y = columns[i] * FONT_SIZE

        // head character is bright
        ctx.fillStyle = ACCENT
        ctx.fillText(char, x, y)

        // trailing character is dimmer
        if (columns[i] > 1) {
          const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)]
          ctx.fillStyle = DIM
          ctx.fillText(trailChar, x, y - FONT_SIZE)
        }

        columns[i] += speeds[i]

        if (y > h && Math.random() > 0.975) {
          columns[i] = 0
        }
      }

      animId = requestAnimationFrame(draw)
    }

    // initial fill with dark
    const w = canvas.width / window.devicePixelRatio
    const h = canvas.height / window.devicePixelRatio
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, w, h)

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [hovering])

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ cursor: "crosshair" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block", background: "#0a0a0a" }}
      />
    </div>
  )
}
