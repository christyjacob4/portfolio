"use client"

import { useEffect, useRef, useState } from "react"

const CELL = 16
const WALL_COLOR = "rgba(255, 255, 255, 0.07)"
const PATH_COLOR = "rgba(74, 222, 128, 0.85)"
const BG = "#0a0a0a"
const STEPS_PER_FRAME = 2

interface Cell {
  visited: boolean
  walls: [boolean, boolean, boolean, boolean] // top, right, bottom, left
}

export default function MazeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const cols = Math.floor(400 / CELL)
    const rows = Math.floor(300 / CELL)
    const w = cols * CELL
    const h = rows * CELL

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

    let grid: Cell[][]
    let stack: [number, number][]
    let current: [number, number]

    function initMaze() {
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          visited: false,
          walls: [true, true, true, true],
        }))
      )
      const sr = Math.floor(Math.random() * rows)
      const sc = Math.floor(Math.random() * cols)
      current = [sr, sc]
      grid[sr][sc].visited = true
      stack = [[sr, sc]]
    }

    function getUnvisitedNeighbors(r: number, c: number): [number, number, number][] {
      const neighbors: [number, number, number][] = []
      if (r > 0 && !grid[r - 1][c].visited) neighbors.push([r - 1, c, 0])
      if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push([r, c + 1, 1])
      if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push([r + 1, c, 2])
      if (c > 0 && !grid[r][c - 1].visited) neighbors.push([r, c - 1, 3])
      return neighbors
    }

    function step(): boolean {
      if (stack.length === 0) return false
      const [r, c] = current
      const neighbors = getUnvisitedNeighbors(r, c)

      if (neighbors.length > 0) {
        const [nr, nc, dir] = neighbors[Math.floor(Math.random() * neighbors.length)]
        // Remove walls between current and next
        grid[r][c].walls[dir] = false
        grid[nr][nc].walls[(dir + 2) % 4] = false
        grid[nr][nc].visited = true
        stack.push([nr, nc])
        current = [nr, nc]
      } else {
        stack.pop()
        if (stack.length > 0) {
          current = stack[stack.length - 1]
        }
      }
      return true
    }

    function draw() {
      ctx!.fillStyle = BG
      ctx!.fillRect(0, 0, w, h)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CELL
          const y = r * CELL
          const cell = grid[r][c]

          if (cell.visited) {
            ctx!.fillStyle = "rgba(74, 222, 128, 0.08)"
            ctx!.fillRect(x, y, CELL, CELL)
          }

          ctx!.strokeStyle = cell.visited ? PATH_COLOR : WALL_COLOR
          ctx!.lineWidth = 1

          if (cell.walls[0]) {
            ctx!.beginPath(); ctx!.moveTo(x, y); ctx!.lineTo(x + CELL, y); ctx!.stroke()
          }
          if (cell.walls[1]) {
            ctx!.beginPath(); ctx!.moveTo(x + CELL, y); ctx!.lineTo(x + CELL, y + CELL); ctx!.stroke()
          }
          if (cell.walls[2]) {
            ctx!.beginPath(); ctx!.moveTo(x + CELL, y + CELL); ctx!.lineTo(x, y + CELL); ctx!.stroke()
          }
          if (cell.walls[3]) {
            ctx!.beginPath(); ctx!.moveTo(x, y + CELL); ctx!.lineTo(x, y); ctx!.stroke()
          }
        }
      }

      // Draw current cell highlight
      if (stack.length > 0) {
        const [cr, cc] = current
        ctx!.fillStyle = PATH_COLOR
        ctx!.fillRect(cc * CELL + 2, cr * CELL + 2, CELL - 4, CELL - 4)
      }
    }

    function animate() {
      let running = true
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        if (!step()) {
          running = false
          break
        }
      }
      draw()

      if (running) {
        animId = requestAnimationFrame(animate)
      } else {
        timeoutId = setTimeout(() => {
          initMaze()
          animId = requestAnimationFrame(animate)
        }, 2000)
      }
    }

    initMaze()
    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
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
