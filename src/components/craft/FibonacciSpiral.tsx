"use client"

import { useEffect, useRef, useState } from "react"

const FIB = [1, 1, 2, 3, 5, 8, 13]
const ACCENT = "rgba(74, 222, 128, 0.85)"
const MUTED = "rgba(255, 255, 255, 0.07)"
const SCALE = 18

export default function FibonacciSpiral() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState(-1)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (hovering) {
      setStep(0)
    } else {
      setStep(-1)
    }
  }, [hovering])

  useEffect(() => {
    if (step < 0) return
    if (!hovering) return
    if (step > FIB.length) {
      const timeout = setTimeout(() => setStep(0), 2000)
      return () => clearTimeout(timeout)
    }
    const timeout = setTimeout(() => setStep((s) => s + 1), 850)
    return () => clearTimeout(timeout)
  }, [step, hovering])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (step < 0) return

    // Starting position offset so spiral fits nicely
    let x = w * 0.38
    let y = h * 0.42

    // Direction cycle: right, up, left, down
    const dx = [1, 0, -1, 0]
    const dy = [0, -1, 0, 1]

    // Arc start angles for each direction
    const startAngles = [0, -Math.PI / 2, Math.PI, Math.PI / 2]

    const drawCount = Math.min(step, FIB.length)

    for (let i = 0; i < drawCount; i++) {
      const size = FIB[i] * SCALE
      const dir = i % 4

      // Draw rectangle
      ctx.strokeStyle = MUTED
      ctx.lineWidth = 1
      let rx = x
      let ry = y
      if (dir === 0) {
        // nothing
      } else if (dir === 1) {
        ry = y - size
      } else if (dir === 2) {
        rx = x - size
        ry = y - size
      } else {
        rx = x - size
      }
      ctx.strokeRect(rx, ry, size, size)

      // Draw arc
      ctx.strokeStyle = i < drawCount ? ACCENT : MUTED
      ctx.lineWidth = 2
      ctx.beginPath()

      // Center of arc is at the corner of the square
      let cx = x
      let cy = y
      if (dir === 0) {
        cx = x
        cy = y
      } else if (dir === 1) {
        cx = x
        cy = y - size
      } else if (dir === 2) {
        cx = x - size
        cy = y - size
      } else {
        cx = x - size
        cy = y
      }

      const startAngle = startAngles[dir]
      ctx.arc(cx, cy, size, startAngle, startAngle + Math.PI / 2)
      ctx.stroke()

      // Move origin for next rectangle
      if (dir === 0) {
        x = x + size
        y = y - FIB[Math.min(i + 1, FIB.length - 1)] * SCALE
      } else if (dir === 1) {
        x = x - FIB[Math.min(i + 1, FIB.length - 1)] * SCALE
        y = y - size
      } else if (dir === 2) {
        x = x - size
      } else {
        x = x + FIB[Math.min(i + 1, FIB.length - 1)] * SCALE
        y = y + size
      }
    }
  }, [step])

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
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.05em",
        }}
      >
        fibonacci spiral
        <span style={{ color: ACCENT, marginLeft: 8 }}>
          {step >= 0 && step <= FIB.length
            ? `[${FIB.slice(0, Math.min(step, FIB.length)).join(", ")}]`
            : ""}
        </span>
      </div>
    </div>
  )
}
