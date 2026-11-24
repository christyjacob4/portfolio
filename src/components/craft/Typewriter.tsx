"use client"

import { useEffect, useState, useRef, useCallback } from "react"

const LINES = [
  "$ ssh deploy@prod",
  "connected to 10.0.1.42",
  "$ git pull origin main",
  "Already up to date.",
  "$ docker compose up -d",
  "✓ container api started",
  "✓ container db started",
  "✓ container redis started",
  "$ curl -s localhost:3000/health",
  '{"status":"ok","uptime":"42d"}',
]

export default function Typewriter() {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState("")
  const [cursorVisible, setCursorVisible] = useState(true)
  const lineIdx = useRef(0)
  const charIdx = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  const type = useCallback(() => {
    if (lineIdx.current >= LINES.length) {
      lineIdx.current = 0
      charIdx.current = 0
      setDisplayed([])
      setCurrentLine("")
      timeoutRef.current = setTimeout(type, 1200)
      return
    }

    const line = LINES[lineIdx.current]
    if (charIdx.current <= line.length) {
      setCurrentLine(line.slice(0, charIdx.current))
      charIdx.current++
      const delay = line[charIdx.current - 1] === " " ? 30 : 25 + Math.random() * 40
      timeoutRef.current = setTimeout(type, delay)
    } else {
      setDisplayed((prev) => {
        const next = [...prev, line]
        return next.length > 7 ? next.slice(next.length - 7) : next
      })
      setCurrentLine("")
      lineIdx.current++
      charIdx.current = 0
      timeoutRef.current = setTimeout(type, 300 + Math.random() * 400)
    }
  }, [])

  useEffect(() => {
    timeoutRef.current = setTimeout(type, 500)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [type])

  return (
    <div
      className="w-full h-full flex flex-col justify-end"
      style={{ padding: "20px", fontFamily: "var(--font-geist-mono), monospace", fontSize: "15px", lineHeight: "1.9", overflow: "hidden", cursor: "crosshair" }}
    >
      {displayed.map((line, i) => (
        <div key={i} style={{ color: line.startsWith("$") ? "rgba(74, 222, 128, 0.7)" : line.startsWith("✓") ? "rgba(74, 222, 128, 0.5)" : "rgba(255,255,255,0.5)" }}>
          {line}
        </div>
      ))}
      <div style={{ color: currentLine.startsWith("$") ? "rgba(74, 222, 128, 0.7)" : "rgba(255,255,255,0.5)" }}>
          {currentLine}
          <span style={{ opacity: cursorVisible ? 1 : 0, color: "rgba(74, 222, 128, 0.8)", transition: "opacity 0.1s" }}>▋</span>
        </div>
    </div>
  )
}
