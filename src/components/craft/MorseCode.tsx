"use client"

import { useEffect, useState, useRef } from "react"

const ACCENT = "rgba(74, 222, 128, 0.85)"
const INACTIVE = "rgba(255, 255, 255, 0.07)"

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
}

const WORDS = ["HELLO", "WORLD", "CODE", "CRAFT", "PIXEL"]

interface MorseSymbol {
  type: "dot" | "dash" | "space" | "letterGap"
  letter: string
}

function wordToSymbols(word: string): MorseSymbol[] {
  const symbols: MorseSymbol[] = []
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    const code = MORSE[ch] || ""
    for (let j = 0; j < code.length; j++) {
      symbols.push({
        type: code[j] === "." ? "dot" : "dash",
        letter: ch,
      })
      if (j < code.length - 1) {
        symbols.push({ type: "space", letter: ch })
      }
    }
    if (i < word.length - 1) {
      symbols.push({ type: "letterGap", letter: ch })
    }
  }
  return symbols
}

export default function MorseCode() {
  const [wordIdx, setWordIdx] = useState(0)
  const [symbolIdx, setSymbolIdx] = useState(-1)
  const [decoded, setDecoded] = useState("")
  const symbolsRef = useRef<MorseSymbol[]>(wordToSymbols(WORDS[0]))
  const lastLetterRef = useRef("")
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    symbolsRef.current = wordToSymbols(WORDS[wordIdx])
    setSymbolIdx(-1)
    setDecoded("")
    lastLetterRef.current = ""
  }, [wordIdx])

  useEffect(() => {
    if (!hovering) return

    const interval = setInterval(() => {
      setSymbolIdx((prev) => {
        const next = prev + 1
        if (next >= symbolsRef.current.length) {
          // Move to next word after pause
          setTimeout(() => {
            setWordIdx((w) => (w + 1) % WORDS.length)
          }, 1500)
          return prev
        }

        const sym = symbolsRef.current[next]
        if (
          (sym.type === "letterGap" || next === symbolsRef.current.length - 1) &&
          sym.letter !== lastLetterRef.current
        ) {
          const letter = next === symbolsRef.current.length - 1 ? sym.letter : sym.letter
          setDecoded((d) => d + letter)
          lastLetterRef.current = letter
        } else if (
          sym.type !== "letterGap" &&
          sym.type !== "space" &&
          next === symbolsRef.current.length - 1 &&
          sym.letter !== lastLetterRef.current
        ) {
          setDecoded((d) => d + sym.letter)
          lastLetterRef.current = sym.letter
        }

        return next
      })
    }, 280)

    return () => clearInterval(interval)
  }, [wordIdx, hovering])

  const word = WORDS[wordIdx]
  const symbols = symbolsRef.current

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
        gap: 16,
        cursor: 'crosshair',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
        morse transmitter
      </div>

      {/* Morse display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexWrap: "wrap",
          justifyContent: "center",
          minHeight: 28,
          maxWidth: 300,
        }}
      >
        {symbols.map((sym, i) => {
          if (sym.type === "space") return <div key={i} style={{ width: 4 }} />
          if (sym.type === "letterGap") return <div key={i} style={{ width: 14 }} />

          const isActive = i <= symbolIdx
          const isCurrent = i === symbolIdx

          return (
            <div
              key={i}
              style={{
                width: sym.type === "dot" ? 8 : 22,
                height: 8,
                borderRadius: sym.type === "dot" ? "50%" : 4,
                backgroundColor: isActive ? ACCENT : INACTIVE,
                boxShadow: isCurrent ? `0 0 8px ${ACCENT}` : "none",
                transition: "all 0.15s ease",
              }}
            />
          )
        })}
      </div>

      {/* Morse text representation */}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
        {word.split("").map((ch, i) => (
          <span key={i} style={{ marginRight: 8 }}>
            {MORSE[ch]}
          </span>
        ))}
      </div>

      {/* Decoded output */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: ACCENT,
          letterSpacing: 6,
          minHeight: 30,
        }}
      >
        {decoded}
        <span
          style={{
            opacity: 0.5,
            animation: "morse-blink 0.8s infinite",
          }}
        >
          _
        </span>
      </div>

      <style>{`
        @keyframes morse-blink {
          0%, 50% { opacity: 0.5; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
