"use client"

import { useEffect, useRef, useState } from "react"

const PARTICLE_COUNT = 60
const CONNECT_DIST = 100
const SPEED = 0.24
const BG = "#0a0a0a"
const ACCENT = "rgba(74, 222, 128, 0.85)"
const LINE_COLOR_BASE = [74, 222, 128]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let w = 400
    let h = 300

    canvas.width = w * window.devicePixelRatio
    canvas.height = h * window.devicePixelRatio
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas when not hovering
    if (!hovering) {
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)
      return
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * SPEED * 2,
      vy: (Math.random() - 0.5) * SPEED * 2,
    }))

    function draw() {
      ctx!.fillStyle = BG
      ctx!.fillRect(0, 0, w, h)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.5
            ctx!.beginPath()
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.strokeStyle = `rgba(${LINE_COLOR_BASE[0]}, ${LINE_COLOR_BASE[1]}, ${LINE_COLOR_BASE[2]}, ${alpha})`
            ctx!.lineWidth = 1
            ctx!.stroke()
          }
        }
      }

      // Draw and update particles
      for (const p of particles) {
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx!.fillStyle = ACCENT
        ctx!.fill()

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        p.x = Math.max(0, Math.min(w, p.x))
        p.y = Math.max(0, Math.min(h, p.y))
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [hovering])

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ background: BG, cursor: "crosshair" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  )
}
