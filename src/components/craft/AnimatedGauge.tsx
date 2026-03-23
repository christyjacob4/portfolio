"use client"

import { useEffect, useRef, useState } from "react"

const CX = 400
const CY = 1040
const R = 1000
const ARC_START = 109
const ARC_END = 71
const TICK_COUNT = 61
const MINOR_TICK = 50
const MAJOR_TICK = 80
const MAJOR_EVERY = 10
const NEEDLE_VALUE = 0.72

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function setNeedle(el: SVGLineElement, angle: number) {
  const rad = toRad(angle)
  el.setAttribute("x2", String(CX + R * Math.cos(rad)))
  el.setAttribute("y2", String(CY - R * Math.sin(rad)))
}

export default function AnimatedGauge() {
  const [mounted, setMounted] = useState(false)
  const [hovering, setHovering] = useState(false)
  const needleRef = useRef<SVGLineElement>(null)
  const currentAngleRef = useRef(ARC_START)
  const rafRef = useRef(0)
  const hoverRef = useRef(false)

  const targetAngle = ARC_START - NEEDLE_VALUE * (ARC_START - ARC_END)

  useEffect(() => {
    hoverRef.current = hovering
  }, [hovering])

  useEffect(() => {
    setMounted(true)

    let alive = true
    const tick = () => {
      if (!alive) return
      const el = needleRef.current
      if (el) {
        if (hoverRef.current) {
          const diff = targetAngle - currentAngleRef.current
          if (Math.abs(diff) > 0.05) {
            currentAngleRef.current += diff * 0.06
          } else {
            currentAngleRef.current = targetAngle
          }
        } else {
          const diff = ARC_START - currentAngleRef.current
          if (Math.abs(diff) > 0.05) {
            currentAngleRef.current += diff * 0.06
          } else {
            currentAngleRef.current = ARC_START
          }
        }
        setNeedle(el, currentAngleRef.current)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [targetAngle])

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = ARC_START - (i / (TICK_COUNT - 1)) * (ARC_START - ARC_END)
    const rad = toRad(angle)
    const isMajor = i % MAJOR_EVERY === 0
    const len = isMajor ? MAJOR_TICK : MINOR_TICK
    return {
      x1: CX + (R - len) * Math.cos(rad),
      y1: CY - (R - len) * Math.sin(rad),
      x2: CX + R * Math.cos(rad),
      y2: CY - R * Math.sin(rad),
      isMajor,
      delay: i * 8,
    }
  })

  const initRad = toRad(ARC_START)

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <svg
        viewBox="0 0 800 450"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            strokeWidth={tick.isMajor ? 2 : 1.5}
            strokeLinecap="round"
            style={{
              opacity: mounted ? 1 : 0,
              transition: `opacity 0.3s ease-out ${tick.delay}ms`,
              stroke: tick.isMajor
                ? "rgba(255,255,255,0.8)"
                : "rgba(255,255,255,0.5)",
            }}
          />
        ))}

        <line
          ref={needleRef}
          x1={CX}
          y1={CY}
          x2={CX + R * Math.cos(initRad)}
          y2={CY - R * Math.sin(initRad)}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.3s ease-out 200ms",
            stroke: "#4ade80",
          }}
        />
      </svg>
    </div>
  )
}
