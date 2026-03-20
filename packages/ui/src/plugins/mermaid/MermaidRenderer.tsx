import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import mermaid from 'mermaid'
import type { MermaidConfig } from 'mermaid'

import './mermaid.css'

interface MermaidRendererProps {
  readonly code: string
  readonly config?: MermaidConfig
}

interface Transform {
  readonly x: number
  readonly y: number
  readonly scale: number
}

type Tab = 'preview' | 'code'

const DIAGRAM_TYPE_MAP: Record<string, string> = {
  graph: 'Flowchart',
  flowchart: 'Flowchart',
  sequenceDiagram: 'Sequence',
  classDiagram: 'Class',
  stateDiagram: 'State',
  'stateDiagram-v2': 'State',
  erDiagram: 'ER',
  gantt: 'Gantt',
  journey: 'User Journey',
  pie: 'Pie',
  gitGraph: 'Git Graph',
  mindmap: 'Mindmap',
  timeline: 'Timeline',
  quadrantChart: 'Quadrant',
  sankey: 'Sankey',
  xychart: 'XY Chart',
  block: 'Block',
  c4Context: 'C4 Context',
  c4Container: 'C4 Container',
  c4Component: 'C4 Component',
  c4Dynamic: 'C4 Dynamic',
  c4Deployment: 'C4 Deployment',
}

// Keywords used for lightweight client-side syntax highlighting
const MERMAID_KEYWORDS = [
  'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
  'stateDiagram-v2', 'erDiagram', 'gantt', 'journey', 'pie', 'gitGraph',
  'mindmap', 'timeline', 'quadrantChart', 'sankey', 'xychart', 'block',
  'c4Context', 'c4Container', 'c4Component', 'c4Dynamic', 'c4Deployment',
  'subgraph', 'end', 'participant', 'actor', 'activate', 'deactivate',
  'note', 'loop', 'alt', 'else', 'opt', 'par', 'critical', 'break',
  'rect', 'class', 'state', 'direction', 'section', 'title',
  'dateFormat', 'axisFormat', 'excludes', 'includes', 'todayMarker',
  'TB', 'TD', 'BT', 'RL', 'LR',
]

const KEYWORD_PATTERN = new RegExp(
  `\\b(${MERMAID_KEYWORDS.join('|')})\\b`,
  'g',
)

const COMMENT_PATTERN = /%%.*$/gm
const ARROW_PATTERN = /--&gt;|-->|==>|-.->|--x|--o|&lt;--|<--|===|---|~~~|\|&gt;|\|>/g
const STRING_PATTERN = /"[^"]*"|'[^']*'/g

/**
 * Detect the mermaid diagram type from the first line of code.
 *
 * @param code - Raw mermaid source
 * @returns Human-readable diagram type label
 */
function detectDiagramType(code: string): string {
  const firstLine = code.trim().split('\n')[0].trim()
  const entries = Object.entries(DIAGRAM_TYPE_MAP)
  const match = entries.find(([key]) => firstLine.startsWith(key))
  if (match) return match[1]
  return 'Diagram'
}

/**
 * Escape HTML special characters for safe insertion via dangerouslySetInnerHTML.
 *
 * @param text - Raw text
 * @returns HTML-escaped text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Apply lightweight syntax highlighting to mermaid source code.
 * Returns an HTML string with span-wrapped tokens.
 *
 * @param code - Raw mermaid source
 * @returns HTML string with syntax highlighting spans
 */
function highlightMermaid(code: string): string {
  const escaped = escapeHtml(code)

  // Use placeholder tokens to avoid nested replacements
  const placeholders: string[] = []
  function placeholder(html: string): string {
    const idx = placeholders.length
    placeholders.push(html)
    return `\x00${String(idx)}\x00`
  }

  let result = escaped

  // Comments first (highest priority)
  result = result.replace(COMMENT_PATTERN, (m) =>
    placeholder(`<span class="zm-comment">${m}</span>`),
  )

  // Strings
  result = result.replace(STRING_PATTERN, (m) =>
    placeholder(`<span class="zm-string">${m}</span>`),
  )

  // Arrows / connectors
  result = result.replace(ARROW_PATTERN, (m) =>
    placeholder(`<span class="zm-arrow">${m}</span>`),
  )

  // Keywords
  result = result.replace(KEYWORD_PATTERN, (m) =>
    placeholder(`<span class="zm-keyword">${m}</span>`),
  )

  // Restore placeholders
  result = result.replace(/\x00(\d+)\x00/g, (_match, idx) => placeholders[Number(idx)])

  return result
}

const INITIAL_TRANSFORM: Transform = { x: 0, y: 0, scale: 1 }
const MIN_SCALE = 0.25
const MAX_SCALE = 4
const ZOOM_STEP = 0.1

/**
 * Render a mermaid diagram as an interactive SVG with pan, zoom,
 * fullscreen, and a code view toggle with syntax highlighting.
 *
 * @param props - Mermaid code string and optional mermaid config
 * @returns React element
 */
const MermaidRenderer: React.FC<MermaidRendererProps> = (props) => {
  const { code, config = {} } = props

  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  const [svg, setSvg] = useState('')
  const [renderError, setRenderError] = useState(false)
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM)
  const [fullscreen, setFullscreen] = useState(false)
  const [tab, setTab] = useState<Tab>('preview')

  const highlightedCode = useMemo(() => highlightMermaid(code), [code])

  const isPreview = tab === 'preview'

  const renderMermaid = useCallback(async () => {
    const hasDarkClass = document.documentElement.classList.contains('dark')

    const mermaidConfig: MermaidConfig = {
      securityLevel: 'loose',
      startOnLoad: false,
      theme: hasDarkClass ? 'dark' : 'default',
      ...config,
    }

    try {
      mermaid.initialize(mermaidConfig)
      const result = await mermaid.render(id.replace(/:/g, ''), code as string)
      setSvg(result.svg)
    } catch {
      setRenderError(true)
    }
  }, [code, config, id])

  useEffect(() => {
    renderMermaid()
  }, [renderMermaid])

  // Re-render on dark mode toggle
  useEffect(() => {
    const observer = new MutationObserver(() => {
      renderMermaid()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [renderMermaid])

  // Non-passive wheel listener for zoom — only in preview mode
  useEffect(() => {
    const el = containerRef.current
    if (!el || !isPreview) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const direction = e.deltaY < 0 ? 1 : -1
      setTransform((prev) => {
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + direction * ZOOM_STEP))
        return { ...prev, scale: nextScale }
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [isPreview])

  // Pointer-based panning — only in preview mode
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isPreview) return
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest('.zpress-mermaid-controls') || target.closest('.zpress-mermaid-footer')) return

      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: transform.x,
        originY: transform.y,
      }
      const container = e.currentTarget as HTMLElement
      container.setPointerCapture(e.pointerId)
    },
    [isPreview, transform.x, transform.y],
  )

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag.dragging) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setTransform((prev) => ({ ...prev, x: drag.originX + dx, y: drag.originY + dy }))
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = { ...dragRef.current, dragging: false }
  }, [])

  // Control button handlers
  const zoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.min(MAX_SCALE, prev.scale + ZOOM_STEP) }))
  }, [])

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.max(MIN_SCALE, prev.scale - ZOOM_STEP) }))
  }, [])

  const resetView = useCallback(() => {
    setTransform(INITIAL_TRANSFORM)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev)
    setTab('preview')
    setTransform(INITIAL_TRANSFORM)
  }, [])

  // Close fullscreen on Escape
  useEffect(() => {
    if (!fullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreen(false)
        setTransform(INITIAL_TRANSFORM)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [fullscreen])

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [fullscreen])

  if (renderError) return null

  const transformStyle = `translate(${String(transform.x)}px, ${String(transform.y)}px) scale(${String(transform.scale)})`

  const containerClasses = [
    'zpress-mermaid',
    fullscreen ? 'zpress-mermaid-fullscreen' : '',
    !isPreview ? 'zpress-mermaid-no-pan' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isPreview && (
        <div className="zpress-mermaid-controls">
          <button type="button" className="zpress-mermaid-btn" onClick={zoomIn} title="Zoom in">
            +
          </button>
          <button type="button" className="zpress-mermaid-btn" onClick={zoomOut} title="Zoom out">
            −
          </button>
          <button type="button" className="zpress-mermaid-btn" onClick={resetView} title="Reset view">
            ⟲
          </button>
          <button type="button" className="zpress-mermaid-btn" onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {fullscreen ? '✕' : '⛶'}
          </button>
        </div>
      )}

      {isPreview ? (
        <div
          ref={innerRef}
          className="zpress-mermaid-inner"
          style={{ transform: transformStyle }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="zpress-mermaid-code">
          <pre><code dangerouslySetInnerHTML={{ __html: highlightedCode }} /></pre>
        </div>
      )}

      {!fullscreen && (
        <div className="zpress-mermaid-footer">
          <span className="zpress-mermaid-type">{detectDiagramType(code)}</span>
          <div className="zpress-mermaid-tabs">
            <button
              type="button"
              className={isPreview ? 'zpress-mermaid-tab zpress-mermaid-tab-active' : 'zpress-mermaid-tab'}
              onClick={() => setTab('preview')}
            >
              Preview
            </button>
            <button
              type="button"
              className={!isPreview ? 'zpress-mermaid-tab zpress-mermaid-tab-active' : 'zpress-mermaid-tab'}
              onClick={() => setTab('code')}
            >
              Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MermaidRenderer
