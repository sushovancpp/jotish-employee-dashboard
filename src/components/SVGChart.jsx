/**
 * SVGChart — Salary Distribution per City
 *
 * Pure SVG, zero external libraries.
 * Uses raw <rect>, <text>, <line>, <path> elements.
 */

import { useMemo } from 'react'

const PALETTE = [
  '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981',
  '#f43f5e', '#3b82f6', '#f97316', '#a3e635',
]

export default function SVGChart({ data }) {
  // ── Aggregate: sum of salaries per city ─────────────────────────────────
  const cities = useMemo(() => {
    const map = {}
    data.forEach(r => {
      const c = r.city?.trim() || 'Unknown'
      if (!map[c]) map[c] = { city: c, total: 0, count: 0 }
      map[c].total += r.salary
      map[c].count++
    })
    return Object.values(map)
      .map(m => ({ ...m, avg: Math.round(m.total / m.count) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 12)   // cap at 12 bars for readability
  }, [data])

  if (!cities.length) return null

  // ── Layout constants ──────────────────────────────────────────────────────
  const SVG_W       = 680
  const SVG_H       = 320
  const MARGIN      = { top: 20, right: 20, bottom: 64, left: 72 }
  const chartW      = SVG_W - MARGIN.left - MARGIN.right
  const chartH      = SVG_H - MARGIN.top  - MARGIN.bottom

  const maxVal      = Math.max(...cities.map(c => c.avg))
  const step        = Math.ceil(maxVal / 4 / 10000) * 10000   // nice grid interval
  const gridMax     = step * 5

  const barW        = (chartW / cities.length) * 0.62
  const barGap      = chartW / cities.length

  const yScale = v => chartH - (v / gridMax) * chartH

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      aria-label="Salary distribution per city bar chart"
    >
      <defs>
        {cities.map((c, i) => (
          <linearGradient key={c.city} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={PALETTE[i % PALETTE.length]} stopOpacity="0.95" />
            <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity="0.35" />
          </linearGradient>
        ))}
      </defs>

      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>

        {/* ── Y-axis grid lines ── */}
        {[0, 1, 2, 3, 4, 5].map(tick => {
          const val = tick * step
          const y   = yScale(val)
          return (
            <g key={tick}>
              <line
                x1={0} y1={y} x2={chartW} y2={y}
                stroke="#1e1e30" strokeWidth="1"
                strokeDasharray={tick === 0 ? '0' : '4 4'}
              />
              <text
                x={-8} y={y + 4}
                textAnchor="end"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fill="#4a4a6a"
              >
                {val >= 100000
                  ? `₹${(val / 100000).toFixed(1)}L`
                  : `₹${(val / 1000).toFixed(0)}k`
                }
              </text>
            </g>
          )
        })}

        {/* ── Bars ── */}
        {cities.map((c, i) => {
          const barH = chartH - yScale(c.avg)
          const x    = i * barGap + (barGap - barW) / 2
          const y    = yScale(c.avg)

          return (
            <g key={c.city}>
              {/* Bar */}
              <rect
                x={x} y={y}
                width={barW} height={barH}
                fill={`url(#bar-grad-${i})`}
                rx="3" ry="3"
                style={{ transition: 'all 0.3s' }}
              >
                <title>{c.city}: avg ₹{c.avg.toLocaleString('en-IN')} ({c.count} employees)</title>
              </rect>

              {/* Value label above bar */}
              <text
                x={x + barW / 2} y={y - 5}
                textAnchor="middle"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fill={PALETTE[i % PALETTE.length]}
                opacity="0.9"
              >
                {c.avg >= 100000
                  ? `₹${(c.avg / 100000).toFixed(1)}L`
                  : `₹${(c.avg / 1000).toFixed(0)}k`
                }
              </text>

              {/* X-axis label — rotated */}
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="end"
                fontSize="10"
                fontFamily="DM Sans, sans-serif"
                fill="#8888aa"
                transform={`rotate(-38, ${x + barW / 2}, ${chartH + 14})`}
              >
                {c.city.length > 12 ? c.city.slice(0, 11) + '…' : c.city}
              </text>
            </g>
          )
        })}

        {/* ── X-axis baseline ── */}
        <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#1e1e30" strokeWidth="1" />
        {/* ── Y-axis edge ── */}
        <line x1={0} y1={0} x2={0} y2={chartH} stroke="#1e1e30" strokeWidth="1" />
      </g>
    </svg>
  )
}
