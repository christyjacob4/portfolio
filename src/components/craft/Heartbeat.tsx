"use client"

import { useEffect, useRef, useState } from "react"

const W = 500
const H = 150
const ACCENT = "rgba(74, 222, 128, 0.85)"
const SPEED = 1.4 // pixels per frame

// Classic ECG waveform shape as y-offsets over one beat cycle (normalized 0..1 range mapped to pixel width)
function ecgSample(t: number): number {
  // t is 0..1 within one beat cycle
  const mid = H / 2

  // P wave
  if (t >= 0.0 && t < 0.1) {
    const s = (t - 0.0) / 0.1
    return mid - Math.sin(s * Math.PI) * 12
  }
  // flat
  if (t >= 0.1 && t < 0.18) return mid
  // Q dip
  if (t >= 0.18 && t < 0.22) {
    const s = (t - 0.18) / 0.04
    return mid + Math.sin(s * Math.PI) * 10
  }
  // R spike (tall)
  if (t >= 0.22 && t < 0.3) {
    const s = (t - 0.22) / 0.08
    return mid - Math.sin(s * Math.PI) * 55
  }
  // S dip
  if (t >= 0.3 && t < 0.36) {
    const s = (t - 0.3) / 0.06
    return mid + Math.sin(s * Math.PI) * 18
  }
  // flat
  if (t >= 0.36 && t < 0.5) return mid
  // T wave
  if (t >= 0.5 && t < 0.65) {
    const s = (t - 0.5) / 0.15
    return mid - Math.sin(s * Math.PI) * 16
  }
  // rest
  return mid
}

export default function Heartbeat() {
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
      ctx.fillRect(0, 0, W, H)
      return
    }

    let raf: number
    let offset = 0
    const beatWidth = 200 // pixels per one full beat cycle

    const draw = () => {
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, W, H)

      // subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)"
      ctx.lineWidth = 1
      for (let y = 0; y < H; y += 25) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      // ECG line
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let x = 0; x < W; x++) {
        const worldX = x + offset
        const t = ((worldX % beatWidth) + beatWidth) % beatWidth / beatWidth
        const y = ecgSample(t)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // glow at leading edge
      ctx.beginPath()
      const leadT = ((W + offset) % beatWidth) / beatWidth
      const leadY = ecgSample(leadT)
      ctx.arc(W - 1, leadY, 4, 0, Math.PI * 2)
      ctx.fillStyle = ACCENT
      ctx.fill()

      offset += SPEED
      raf = requestAnimationFrame(draw)
    }

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
