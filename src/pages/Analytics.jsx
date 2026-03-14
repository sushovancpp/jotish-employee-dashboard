/**
 * Analytics Page
 */

import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmployeeData } from '../hooks/useEmployeeData'
import SVGChart from '../components/SVGChart'

const CITY_COORDS = {
  'edinburgh':   [55.9533,  -3.1883],
  'london':      [51.5074,  -0.1278],
  'new york':    [40.7128, -74.0060],
  'san francisco':[37.7749,-122.4194],
  'tokyo':       [35.6762, 139.6503],
  'sydney':      [-33.8688, 151.2093],
  'singapore':   [1.3521,   103.8198],
  'mumbai':      [19.0760,  72.8777],
  'delhi':       [28.6139,  77.2090],
  'bangalore':   [12.9716,  77.5946],
  'hyderabad':   [17.3850,  78.4867],
  'chennai':     [13.0827,  80.2707],
  'kolkata':     [22.5726,  88.3639],
  'pune':        [18.5204,  73.8567],
  'ahmedabad':   [23.0225,  72.5714],
  'jaipur':      [26.9124,  75.7873],
  'lucknow':     [26.8467,  80.9462],
  'nagpur':      [21.1458,  79.0882],
  'indore':      [22.7196,  75.8577],
  'bhopal':      [23.2599,  77.4126],
  'chandigarh':  [30.7333,  76.7794],
  'coimbatore':  [11.0168,  76.9558],
  'kochi':       [ 9.9312,  76.2673],
  'noida':       [28.5355,  77.3910],
  'gurgaon':     [28.4595,  77.0266],
  'gurugram':    [28.4595,  77.0266],
  'thane':       [19.2183,  72.9781],
  'nashik':      [19.9975,  73.7898],
  'agra':        [27.1767,  78.0081],
  'varanasi':    [25.3176,  82.9739],
  'mysore':      [12.2958,  76.6394],
  'mysuru':      [12.2958,  76.6394],
  'patna':       [25.5941,  85.1376],
  'surat':       [21.1702,  72.8311],
  'vadodara':    [22.3072,  73.1812],
  'rajkot':      [22.3039,  70.8022],
  'madurai':     [ 9.9252,  78.1198],
  'visakhapatnam':[17.6868, 83.2185],
  'bhubaneswar': [20.2961,  85.8245],
}

const resolveCoords = cityName => {
  const key = cityName.toLowerCase().trim()
  if (CITY_COORDS[key]) return CITY_COORDS[key]
  const match = Object.keys(CITY_COORDS).find(k => key.includes(k) || k.includes(key))
  if (match) return CITY_COORDS[match]
  return [20.5937 + (Math.random() - 0.5) * 4, 78.9629 + (Math.random() - 0.5) * 4]
}

function CityMap({ cityStats }) {
  const mapRef   = useRef(null)
  const mapObj   = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (mapObj.current || !mapRef.current) return

    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      })
      mapObj.current = map

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© OpenStreetMap contributors, © CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      cityStats.forEach(cs => {
        const [lat, lng] = resolveCoords(cs.city)
        const radius = Math.max(8, Math.min(30, cs.count * 2.5))
        const color  = '#f59e0b'

        const marker = L.circleMarker([lat, lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.55,
          weight: 1.5,
          opacity: 0.9,
        }).addTo(map)

        marker.bindPopup(`
          <div style="font-family:JetBrains Mono,monospace;font-size:12px;color:#e8e8f0;background:#0f0f1a;padding:2px;">
            <b style="color:#f59e0b">${cs.city}</b><br/>
            ${cs.count} employees<br/>
            Avg $${cs.avg.toLocaleString()}
          </div>
        `, { className: 'jotish-popup' })

        markersRef.current.push(marker)
      })
    })

    return () => {
      mapObj.current?.remove()
      mapObj.current = null
    }
  }, [cityStats])

  return (
    <div
      ref={mapRef}
      style={{ height: 380, borderRadius: 8, border: '1px solid #1e1e30', overflow: 'hidden' }}
    />
  )
}

export default function Analytics() {
  const { data, loading } = useEmployeeData()
  const { logout }        = useAuth()
  const navigate          = useNavigate()

  const stats = useMemo(() => {
    if (!data.length) return null
    const salaries = data.map(d => d.salary)
    const total    = salaries.reduce((s, v) => s + v, 0)
    const avg      = Math.round(total / salaries.length)
    const sorted   = [...salaries].sort((a, b) => a - b)
    const median   = sorted[Math.floor(sorted.length / 2)]

    const cityMap = {}
    data.forEach(r => {
      const c = r.city?.trim() || 'Unknown'
      if (!cityMap[c]) cityMap[c] = { city: c, total: 0, count: 0 }
      cityMap[c].total += r.salary
      cityMap[c].count++
    })
    const cityStats = Object.values(cityMap).map(c => ({
      ...c, avg: Math.round(c.total / c.count),
    })).sort((a, b) => b.count - a.count)

    return { avg, median, total, cityStats, headcount: data.length }
  }, [data])

  return (
    <div className="min-h-screen" style={{ background: '#08080f' }}>

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e1e30', background: '#0f0f1a' }}>
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.02em' }}>JOTISH</span>
          <span style={{ color: '#1e1e30' }}>|</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#06b6d4', letterSpacing: '0.1em' }}>ANALYTICS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/list')}
            style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#8888aa', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← List
          </button>
          <button
            onClick={() => { logout(); navigate('/') }}
            style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#f87171', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}
          >
            ⏻ Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {loading && (
          <div className="text-center py-20">
            <p style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>Loading analytics…</p>
          </div>
        )}

        {stats && (
          <>
            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-stagger">
              {[
                { label: 'Headcount',    value: stats.headcount.toLocaleString(),              color: '#f59e0b' },
                { label: 'Avg Salary',   value: `$${stats.avg.toLocaleString()}`,              color: '#06b6d4' },
                { label: 'Median',       value: `$${stats.median.toLocaleString()}`,           color: '#8b5cf6' },
                { label: 'Total Payout', value: `$${(stats.total / 1000000).toFixed(2)}M`,    color: '#10b981' },
              ].map(k => (
                <div
                  key={k.label}
                  className="px-5 py-4"
                  style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 8 }}
                >
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {k.label}
                  </p>
                  <p style={{ fontFamily: 'Syne', fontSize: '1.4rem', fontWeight: 700, color: k.color, letterSpacing: '-0.02em' }}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── SVG Bar chart ── */}
            <div
              className="p-6 fade-up"
              style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 8 }}
            >
              <h2
                className="text-sm mb-6"
                style={{ fontFamily: 'Syne', fontWeight: 600, color: '#e8e8f0', letterSpacing: '-0.01em' }}
              >
                Average Salary by City
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#4a4a6a', marginLeft: 12, fontWeight: 400 }}>
                  (SVG — no chart libraries)
                </span>
              </h2>
              <SVGChart data={data} />
            </div>

            {/* ── Leaflet map ── */}
            <div
              className="p-6 fade-up"
              style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 8 }}
            >
              <h2
                className="text-sm mb-2"
                style={{ fontFamily: 'Syne', fontWeight: 600, color: '#e8e8f0', letterSpacing: '-0.01em' }}
              >
                Workforce Geospatial Distribution
              </h2>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#4a4a6a', marginBottom: 16 }}>
                Marker size ∝ employee count. Coordinates resolved via static city lookup table + partial-match fallback.
              </p>
              <CityMap cityStats={stats.cityStats} />
            </div>

            {/* ── City table ── */}
            <div
              className="p-6 fade-up"
              style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 8 }}
            >
              <h2
                className="text-sm mb-4"
                style={{ fontFamily: 'Syne', fontWeight: 600, color: '#e8e8f0' }}
              >
                City Breakdown
              </h2>
              <div className="overflow-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      {['City', 'Employees', 'Avg Salary', 'Total Payout'].map(h => (
                        <th
                          key={h}
                          style={{ textAlign: 'left', padding: '6px 12px', color: '#4a4a6a', borderBottom: '1px solid #1e1e30', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.cityStats.map((cs, i) => (
                      <tr
                        key={cs.city}
                        style={{ borderBottom: '1px solid #1e1e30', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}
                      >
                        <td style={{ padding: '8px 12px', color: '#06b6d4' }}>{cs.city}</td>
                        <td style={{ padding: '8px 12px', color: '#e8e8f0' }}>{cs.count}</td>
                        <td style={{ padding: '8px 12px', color: '#f59e0b' }}>${cs.avg.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', color: '#8888aa' }}>${cs.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}