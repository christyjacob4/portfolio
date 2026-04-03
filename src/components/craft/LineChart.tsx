"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const SERIES = [
  { label: "Revenue", color: "rgba(74, 222, 128, 0.9)", data: [4, 6, 9, 11, 14, 18, 21, 26, 30, 34, 39, 45] },
  { label: "Users", color: "rgba(74, 222, 128, 0.4)", data: [2, 3, 5, 7, 8, 11, 14, 16, 19, 22, 26, 30] },
]
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function LineChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null)
  const [hovering, setHovering] = useState(false)
  const animProgress = useRef(0)
  const rafRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    ctx.clearRect(0, 0, W, H)

    const padL = 40, padR = 20, padT = 20, padB = 36
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const maxVal = 50
    const points = LABELS.length
    const stepX = plotW / (points - 1)

    // Grid
    for (let i = 0; i <= 5; i++) {
      const y = padT + (plotH / 5) * i
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.strokeStyle = "rgba(255,255,255,0.04)"
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = "rgba(255,255,255,0.2)"
      ctx.font = "9px monospace"
      ctx.textAlign = "right"
      ctx.fillText(String(maxVal - (maxVal / 5) * i), padL - 6, y + 3)
    }

    // X axis line
    ctx.beginPath()
    ctx.moveTo(padL, padT + plotH)
    ctx.lineTo(W - padR, padT + plotH)
    ctx.strokeStyle = "rgba(255,255,255,0.15)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Y axis line
    ctx.beginPath()
    ctx.moveTo(padL, padT)
    ctx.lineTo(padL, padT + plotH)
    ctx.strokeStyle = "rgba(255,255,255,0.15)"
    ctx.lineWidth = 1
    ctx.stroke()

    // X labels
    LABELS.forEach((label, i) => {
      const x = padL + i * stepX
      ctx.fillStyle = "rgba(255,255,255,0.2)"
      ctx.font = "9px monospace"
      ctx.textAlign = "center"
      ctx.fillText(label, x, H - 10)
    })

    const progress = Math.min(animProgress.current, 1)

    // Helper: get point coordinates up to visible progress
    function getVisiblePoints(data: number[]) {
      const visibleCount = Math.floor(progress * (points - 1))
      const frac = progress * (points - 1) - visibleCount
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i <= visibleCount && i < points; i++) {
        pts.push({ x: padL + i * stepX, y: padT + plotH - (data[i] / maxVal) * plotH })
      }
      if (visibleCount < points - 1 && frac > 0) {
        const px = pts[pts.length - 1]
        const nx = padL + (visibleCount + 1) * stepX
        const ny = padT + plotH - (data[visibleCount + 1] / maxVal) * plotH
        pts.push({ x: px.x + (nx - px.x) * frac, y: px.y + (ny - px.y) * frac })
      }
      return pts
    }

    // Helper: draw smooth monotone cubic through points
    function traceSmoothPath(pts: { x: number; y: number }[]) {
      if (pts.length === 0 || !ctx) return
      ctx.moveTo(pts[0].x, pts[0].y)
      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y)
        return
      }
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[Math.max(0, i - 2)]
        const p1 = pts[i - 1]
        const p2 = pts[i]
        const p3 = pts[Math.min(pts.length - 1, i + 1)]
        const tension = 0.35
        const cp1x = p1.x + (p2.x - p0.x) * tension
        const cp1y = p1.y + (p2.y - p0.y) * tension
        const cp2x = p2.x - (p3.x - p1.x) * tension
        const cp2y = p2.y - (p3.y - p1.y) * tension
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
      }
    }

    // Lines
    SERIES.forEach((series) => {
      const pts = getVisiblePoints(series.data)
      if (pts.length < 2) return

      // Filled area
      ctx.beginPath()
      traceSmoothPath(pts)
      ctx.lineTo(pts[pts.length - 1].x, padT + plotH)
      ctx.lineTo(pts[0].x, padT + plotH)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH)
      const baseColor = series.color.replace(/[\d.]+\)$/, "")
      grad.addColorStop(0, baseColor + "0.15)")
      grad.addColorStop(1, baseColor + "0)")
      ctx.fillStyle = grad
      ctx.fill()

      // Stroke
      ctx.beginPath()
      traceSmoothPath(pts)
      ctx.strokeStyle = series.color
      ctx.lineWidth = 2
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.stroke()

      // Dots
      pts.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = series.color
        ctx.fill()
      })
    })

    // Tooltip vertical line
    if (tooltip && hovering) {
      const x = padL + tooltip.idx * stepX
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
      ctx.strokeStyle = "rgba(255,255,255,0.15)"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])

      SERIES.forEach((series) => {
        const y = padT + plotH - (series.data[tooltip.idx] / maxVal) * plotH
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#0a0a0a"
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.strokeStyle = series.color
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }
  }, [hovering, tooltip])

  useEffect(() => {
    let alive = true
    const tick = () => {
      if (!alive) return
      if (animProgress.current < 1) {
        animProgress.current = Math.min(1, animProgress.current + 0.02)
      }
      draw()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, [hovering, draw])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const padL = 40, padR = 20
    const plotW = rect.width - padL - padR
    const stepX = plotW / (LABELS.length - 1)
    const idx = Math.round((mx - padL) / stepX)
    if (idx >= 0 && idx < LABELS.length) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx })
    } else {
      setTooltip(null)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: "relative", cursor: "crosshair" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTooltip(null) }}
      onMouseMove={handleMouseMove}
    >
      {/* Legend */}
      <div style={{ position: "absolute", top: "36px", left: "50px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 2 }}>
        {SERIES.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: s.color }} />
            <span style={{ fontSize: "9px", fontFamily: "var(--font-geist-mono), monospace", color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && hovering && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 12,
          top: 40,
          background: "rgba(0,0,0,0.85)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px",
          padding: "6px 10px",
          zIndex: 3,
          pointerEvents: "none",
          fontSize: "10px",
          fontFamily: "var(--font-geist-mono), monospace",
        }}>
          <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>{LABELS[tooltip.idx]}</div>
          {SERIES.map((s) => (
            <div key={s.label} style={{ display: "flex", gap: "8px", color: s.color }}>
              <span>{s.label}</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{s.data[tooltip.idx]}</span>
            </div>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}
