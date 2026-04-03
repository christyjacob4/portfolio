"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const BAR_COUNT = 40
const TICK = 80
const ACCENT = "rgba(74, 222, 128, 0.85)"
const MUTED = "rgba(255, 255, 255, 0.07)"

function shuffle(): number[] {
  const arr = Array.from({ length: BAR_COUNT }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function SortingVisualizer() {
  const [bars, setBars] = useState<number[]>(() => shuffle())
  const [active, setActive] = useState<[number, number]>([-1, -1])
  const [hovering, setHovering] = useState(false)
  const sortingRef = useRef(false)
  const cancelRef = useRef(false)

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const bubbleSort = useCallback(async () => {
    if (sortingRef.current) return
    sortingRef.current = true
    cancelRef.current = false

    const arr = [...bars]
    const n = arr.length

    for (let i = 0; i < n - 1 && !cancelRef.current; i++) {
      for (let j = 0; j < n - 1 - i && !cancelRef.current; j++) {
        setActive([j, j + 1])
        if (arr[j] > arr[j + 1]) {
          ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
          setBars([...arr])
        }
        await sleep(TICK)
      }
    }

    setActive([-1, -1])

    if (!cancelRef.current) {
      // pause, then reshuffle and restart
      await sleep(1500)
      const newArr = shuffle()
      setBars(newArr)
      sortingRef.current = false
      // trigger next sort via state change
    }

    sortingRef.current = false
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hovering) {
      cancelRef.current = true
      setActive([-1, -1])
      return
    }
    // Reset and start sorting when hover begins
    cancelRef.current = false
    sortingRef.current = false
    const newArr = shuffle()
    setBars(newArr)
    const id = setTimeout(() => bubbleSort(), 300)
    return () => {
      cancelRef.current = true
      clearTimeout(id)
    }
  }, [hovering]) // eslint-disable-line react-hooks/exhaustive-deps

  // restart after reshuffle
  useEffect(() => {
    if (hovering && !sortingRef.current) {
      const id = setTimeout(() => bubbleSort(), 300)
      return () => clearTimeout(id)
    }
  }, [bars, bubbleSort, hovering])

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 2,
        padding: 8,
        background: "#0a0a0a",
        fontFamily: "var(--font-geist-mono), monospace",
        cursor: "crosshair",
      }}
    >
      {bars.map((value, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(value / BAR_COUNT) * 100}%`,
            background: i === active[0] || i === active[1] ? ACCENT : MUTED,
            borderRadius: "2px 2px 0 0",
            transition: "background 0.05s ease",
          }}
        />
      ))}
    </div>
  )
}
