"use client"

import React, { ReactNode, ReactElement } from 'react'

interface CodeBlockProps {
  children: ReactNode
  className?: string
  filename?: string
}

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  ts: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  py: 'Python',
  rb: 'Ruby',
  rs: 'Rust',
  go: 'Go',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  sql: 'SQL',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  toml: 'TOML',
  ini: 'INI',
  xml: 'XML',
  graphql: 'GraphQL',
  swift: 'Swift',
  kotlin: 'Kotlin',
}

function extractLanguage(className?: string): string | null {
  if (!className) return null
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : null
}

function getDisplayName(language: string): string {
  return LANGUAGE_DISPLAY_NAMES[language] ?? language
}

/**
 * Recursively extracts plain text from a React node tree.
 * Used to count lines from syntax-highlighted code elements
 * that contain nested spans from rehype-prism-plus.
 */
function extractTextContent(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join('')
  }

  if (React.isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>
    return extractTextContent(element.props.children)
  }

  return ''
}

function countLines(text: string): number {
  if (!text) return 1
  const trimmed = text.endsWith('\n') ? text.slice(0, -1) : text
  return trimmed.split('\n').length
}

function TrafficLights() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#ff5f57',
        }}
      />
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#febc2e',
        }}
      />
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#28c840',
        }}
      />
    </div>
  )
}

function LineNumbers({ count }: { count: number }) {
  const gutterWidth = String(count).length

  return (
    <div
      aria-hidden="true"
      style={{
        flexShrink: 0,
        paddingRight: '0.75rem',
        paddingLeft: '1rem',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        userSelect: 'none',
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          style={{
            textAlign: 'right',
            color: 'rgba(255, 255, 255, 0.2)',
            fontFamily:
              'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
            fontSize: '0.84em',
            lineHeight: '1.75',
            minWidth: `${gutterWidth}ch`,
          }}
        >
          {index + 1}
        </div>
      ))}
    </div>
  )
}

export function CodeBlock({ children, className, filename }: CodeBlockProps) {
  const language = extractLanguage(className)
  const titleText = filename ?? (language ? getDisplayName(language) : null)
  const textContent = extractTextContent(children)
  const lineCount = countLines(textContent)

  return (
    <div
      data-codeblock
      style={{
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* macOS title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'relative',
        }}
      >
        <TrafficLights />
        {titleText && (
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.35)',
              fontFamily:
                'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
              userSelect: 'none',
            }}
          >
            {titleText}
          </span>
        )}
      </div>

      {/* Code area */}
      <pre
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          border: 'none',
          borderRadius: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '1rem 0',
          }}
        >
          <LineNumbers count={lineCount} />

          <code
            className={className}
            style={{
              display: 'block',
              paddingLeft: '1rem',
              paddingRight: '1.25rem',
              fontFamily:
                'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
              fontSize: '0.84em',
              lineHeight: '1.75',
              backgroundColor: 'transparent',
              border: 'none',
            }}
          >
            {children}
          </code>
        </div>
      </pre>
    </div>
  )
}

export default CodeBlock
