"use client"

import { useEffect, useRef, useState } from "react"

const GRID = 20
const LINE_LEN = 10
const BG = "#0a0a0a"
const ACCENT = "rgba(74, 222, 128, 0.85)"
const DIM = "rgba(74, 222, 128, 0.25)"

// Simple hash-based noise (no external deps)
function noise2d(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy

  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)

  const n00 = noise2d(ix, iy)
  const n10 = noise2d(ix + 1, iy)
  const n01 = noise2d(ix, iy + 1)
  const n11 = noise2d(ix + 1, iy + 1)

  const nx0 = n00 + (n10 - n00) * sx
  const nx1 = n01 + (n11 - n01) * sx

  return nx0 + (nx1 - nx0) * sy
}

function fbm(x: number, y: number): number {
  let value = 0
  let amplitude = 0.5
  let px = x
  let py = y
  for (let i = 0; i < 4; i++) {
    value += amplitude * smoothNoise(px, py)
    px *= 2
    py *= 2
    amplitude *= 0.5
  }
  return value
}

export default function NoiseField() {
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
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, rect.width, rect.height)
      return
    }

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

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      const colsCount = Math.floor(w / GRID)
      const rowsCount = Math.floor(h / GRID)
      const offsetX = (w - colsCount * GRID) / 2
      const offsetY = (h - rowsCount * GRID) / 2

      for (let r = 0; r < rowsCount; r++) {
        for (let c = 0; c < colsCount; c++) {
          const nx = c * 0.08
          const ny = r * 0.08
          const angle = fbm(nx + time * 0.3, ny + time * 0.2) * Math.PI * 4

          const cx = offsetX + c * GRID + GRID / 2
          const cy = offsetY + r * GRID + GRID / 2

          const dx = Math.cos(angle) * LINE_LEN * 0.5
          const dy = Math.sin(angle) * LINE_LEN * 0.5

          // Intensity based on noise value
          const intensity = fbm(nx + time * 0.1, ny + time * 0.15)

          ctx.beginPath()
          ctx.moveTo(cx - dx, cy - dy)
          ctx.lineTo(cx + dx, cy + dy)
          ctx.strokeStyle = intensity > 0.45 ? ACCENT : DIM
          ctx.lineWidth = intensity > 0.45 ? 1.5 : 1
          ctx.stroke()
        }
      }

      time += 0.005
      animId = requestAnimationFrame(draw)
    }

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
        style={{ display: "block", background: BG }}
      />
    </div>
  )
}
