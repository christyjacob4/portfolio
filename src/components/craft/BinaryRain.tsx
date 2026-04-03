"use client"

import { useEffect, useRef, useState } from "react"

const W = 300
const H = 300
const FONT_SIZE = 14
const COLS = Math.floor(W / FONT_SIZE)
const TRAIL_LEN = 12

interface Column {
  y: number
  speed: number
  chars: string[]
  active: boolean
  delay: number
}

export default function BinaryRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)
  const hoveringRef = useRef(false)

  useEffect(() => {
    hoveringRef.current = hovering
  }, [hovering])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number

    // sparse columns - only some are active at a time
    const columns: Column[] = Array.from({ length: COLS }, () => ({
      y: Math.random() * -H,
      speed: 0.3 + Math.random() * 0.9,
      chars: Array.from({ length: TRAIL_LEN }, () =>
        Math.random() > 0.5 ? "1" : "0"
      ),
      active: Math.random() > 0.4,
      delay: Math.random() * 200,
    }))

    let lastTime = 0

    const draw = (time: number) => {
      const dt = time - lastTime
      lastTime = time

      if (!hoveringRef.current) {
        // When not hovering, fade to black and stop animating
        ctx.fillStyle = "rgba(10, 10, 10, 0.05)"
        ctx.fillRect(0, 0, W, H)
        raf = requestAnimationFrame(draw)
        return
      }

      ctx.fillStyle = "rgba(10, 10, 10, 0.15)"
      ctx.fillRect(0, 0, W, H)

      ctx.font = `${FONT_SIZE}px monospace`
      ctx.textAlign = "center"

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]
        if (!col.active) {
          // randomly reactivate
          if (Math.random() < 0.002) {
            col.active = true
            col.y = -FONT_SIZE * 2
            col.speed = 0.3 + Math.random() * 0.9
          }
          continue
        }

        col.y += col.speed

        const x = i * FONT_SIZE + FONT_SIZE / 2

        // draw trail characters
        for (let j = 0; j < TRAIL_LEN; j++) {
          const charY = col.y - j * FONT_SIZE
          if (charY < 0 || charY > H) continue

          if (j === 0) {
            // leading character - bright
            ctx.fillStyle = "rgba(200, 255, 200, 0.95)"
          } else {
            const alpha = (1 - j / TRAIL_LEN) * 0.7
            ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`
          }

          // occasionally change char
          if (Math.random() < 0.03) {
            col.chars[j] = Math.random() > 0.5 ? "1" : "0"
          }

          ctx.fillText(col.chars[j], x, charY)
        }

        // reset when off screen
        if (col.y - TRAIL_LEN * FONT_SIZE > H) {
          if (Math.random() > 0.6) {
            col.active = false
          } else {
            col.y = -FONT_SIZE * 2
            col.speed = 0.3 + Math.random() * 0.9
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, W, H)
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
        cursor: "crosshair",
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
