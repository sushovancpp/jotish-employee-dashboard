/**
 * VirtualList — custom scroll virtualization, no react-window / react-virtualized.
 *
 * ─── Virtualization Math ─────────────────────────────────────────────────────
 *
 *  ROW_HEIGHT  : fixed pixel height of every row (56 px)
 *  BUFFER      : extra rows rendered above & below the viewport (8)
 *  scrollTop   : pixels scrolled from the top of the container (from scroll event)
 *  viewHeight  : measured height of the scrollable container (ResizeObserver)
 *
 *  startIndex  = max(0,  floor(scrollTop / ROW_HEIGHT) - BUFFER)
 *  endIndex    = min(N,  floor((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER)
 *
 *  totalHeight = N * ROW_HEIGHT          → height of the invisible spacer div
 *                                          that creates the correct scrollbar range
 *  offsetY     = startIndex * ROW_HEIGHT → translateY of the rendered batch so
 *                                          rows land at the exact pixel position
 *                                          they would occupy in a fully-rendered list
 *
 *  Only `endIndex - startIndex` rows are in the DOM at any time (typically
 *  ~20 rows for a 1080 px viewport), regardless of dataset size.
 *
 * ─── INTENTIONAL BUG ─────────────────────────────────────────────────────────
 *  See the `useEffect` that attaches the 'scroll' listener (marked ⚠ BUG below).
 *  The cleanup returns a *new* anonymous function instead of the original
 *  `handleScroll` reference.  `removeEventListener` compares by reference, so
 *  the listener is NEVER removed when the component unmounts or when the effect
 *  re-fires.  Every mount cycle stacks another orphaned listener on the DOM node,
 *  causing a classic memory leak + potential ghost state-sets after unmount.
 *
 *  Fix: store `handleScroll` in a ref (or use the same function reference in both
 *  addEventListener and removeEventListener).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const ROW_HEIGHT = 56   // px — must match the rendered row's CSS height
const BUFFER     = 8    // extra rows above/below viewport

export default function VirtualList({ data, onRowClick, searchTerm }) {
  const containerRef = useRef(null)
  const [scrollTop,   setScrollTop]   = useState(0)
  const [viewHeight,  setViewHeight]  = useState(0)

  // ── Measure container height via ResizeObserver ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setViewHeight(entries[0].contentRect.height)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── ⚠ BUG: Stale-reference memory leak ──────────────────────────────────
  // handleScroll is defined inline inside the effect so its reference is
  // created fresh on every render.  The cleanup tries to remove an arrow
  // function that is DIFFERENT from the one that was added, so the original
  // listener accumulates across mounts / effect re-runs.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleScroll = () => {
      setScrollTop(el.scrollTop)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      // ⚠ BUG IS HERE — creates a NEW function, never matches handleScroll
      el.removeEventListener('scroll', () => {
        setScrollTop(el.scrollTop)
      })
    }
  }, []) // empty deps intentional for the bug; should also include no deps (no capture)

  // ── Derived virtual window ───────────────────────────────────────────────
  const totalHeight = data.length * ROW_HEIGHT

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - BUFFER
  )
  const endIndex = Math.min(
    data.length,
    Math.floor((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER
  )
  const offsetY     = startIndex * ROW_HEIGHT
  const visibleRows = data.slice(startIndex, endIndex)

  // ── Highlight search matches ─────────────────────────────────────────────
  const highlight = useCallback((text) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = String(text).split(regex)
    return parts.map((p, i) =>
      regex.test(p)
        ? <mark key={i} style={{ background: 'rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
        : p
    )
  }, [searchTerm])

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ flex: 1, minHeight: 0 }}
    >
      {/* Spacer: establishes correct scrollbar height for entire dataset */}
      <div style={{ height: totalHeight, position: 'relative' }}>

        {/* Rendered batch — absolutely positioned at offsetY */}
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {visibleRows.map((row, i) => {
            const absIdx = startIndex + i
            return (
              <div
                key={row.id}
                onClick={() => onRowClick(row.id)}
                className="flex items-center gap-4 px-6 cursor-pointer transition-colors duration-150"
                style={{
                  height: ROW_HEIGHT,
                  borderBottom: '1px solid #1e1e30',
                  background: absIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = absIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}
              >
                {/* Row index */}
                <span
                  className="text-xs w-10 shrink-0 text-right"
                  style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono' }}
                >
                  {absIdx + 1}
                </span>

                {/* Name */}
                <span
                  className="flex-1 min-w-0 text-sm font-medium truncate"
                  style={{ color: '#e8e8f0', fontFamily: 'DM Sans' }}
                >
                  {highlight(row.name)}
                </span>

                {/* Email */}
                <span
                  className="w-52 shrink-0 text-xs truncate hidden md:block"
                  style={{ color: '#8888aa', fontFamily: 'JetBrains Mono' }}
                >
                  {highlight(row.email)}
                </span>

                {/* City */}
                <span
                  className="w-28 shrink-0 text-xs truncate hidden lg:block"
                  style={{ color: '#06b6d4', fontFamily: 'JetBrains Mono' }}
                >
                  {highlight(row.city)}
                </span>

                {/* Dept */}
                <span
                  className="w-32 shrink-0 text-xs truncate hidden xl:block"
                  style={{ color: '#8888aa', fontFamily: 'DM Sans' }}
                >
                  {row.department}
                </span>

                {/* Salary */}
                <span
                  className="w-24 shrink-0 text-xs text-right"
                  style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono' }}
                >
                  ${row.salary.toLocaleString()}
                </span>

                {/* Arrow */}
                <span style={{ color: '#4a4a6a', marginLeft: 8 }}>›</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
