import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmployeeData } from '../hooks/useEmployeeData'
import VirtualList from '../components/VirtualList'

const SORT_FIELDS = ['name', 'city', 'salary', 'department']

export default function List() {
  const { user, logout }        = useAuth()
  const navigate                = useNavigate()
  const { data, loading, error} = useEmployeeData()

  const [search,    setSearch]  = useState('')
  const [sortField, setSort]    = useState('name')
  const [sortDir,   setDir]     = useState('asc')

  // ── Filter + sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? data.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q)  ||
          r.department.toLowerCase().includes(q)
        )
      : data

    return [...base].sort((a, b) => {
      const av = sortField === 'salary' ? a.salary : String(a[sortField]).toLowerCase()
      const bv = sortField === 'salary' ? b.salary : String(b[sortField]).toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [data, search, sortField, sortDir])

  const toggleSort = field => {
    if (field === sortField) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSort(field); setDir('asc') }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#08080f' }}>

      {/* ── Top nav ── */}
      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid #1e1e30', background: '#0f0f1a' }}
      >
        <div className="flex items-center gap-4">
          <span
            style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.02em' }}
          >
            JOTISH
          </span>
          <span style={{ color: '#1e1e30' }}>|</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#f59e0b', letterSpacing: '0.1em' }}>
            EMPLOYEE LIST
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/analytics')}
            className="px-4 py-1.5 text-xs transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid #1e1e30',
              borderRadius: 4,
              color: '#06b6d4',
              fontFamily: 'JetBrains Mono',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={e => e.target.style.borderColor = '#06b6d4'}
            onMouseLeave={e => e.target.style.borderColor = '#1e1e30'}
          >
            ◉ Analytics
          </button>
          <span
            style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#4a4a6a' }}
          >
            {user?.username}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              color: '#f87171',
              fontFamily: 'JetBrains Mono',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.target.style.borderColor = '#f87171'}
            onMouseLeave={e => e.target.style.borderColor = 'rgba(239,68,68,0.3)'}
          >
            ⏻ Logout
          </button>
        </div>
      </header>

      {/* ── Search + controls ── */}
      <div
        className="flex flex-wrap items-center gap-3 px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid #1e1e30' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, city…"
            className="w-full pl-9 pr-4 py-2 text-sm outline-none"
            style={{
              background: '#0f0f1a',
              border: '1px solid #1e1e30',
              borderRadius: 6,
              color: '#e8e8f0',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.8rem',
            }}
            onFocus={e => e.target.style.borderColor = '#f59e0b'}
            onBlur={e  => e.target.style.borderColor = '#1e1e30'}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#4a4a6a' }}>⌕</span>
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2">
          {SORT_FIELDS.map(f => (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              className="px-3 py-1.5 text-xs transition-all"
              style={{
                background: sortField === f ? 'rgba(245,158,11,0.1)' : 'transparent',
                border: `1px solid ${sortField === f ? '#f59e0b' : '#1e1e30'}`,
                borderRadius: 4,
                color: sortField === f ? '#f59e0b' : '#8888aa',
                fontFamily: 'JetBrains Mono',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f} {sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>

        {/* Count */}
        <span
          className="ml-auto text-xs"
          style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono' }}
        >
          {loading ? 'Loading…' : `${filtered.length} / ${data.length} rows`}
        </span>
      </div>

      {/* ── Column header ── */}
      <div
        className="flex items-center gap-4 px-6 py-2 shrink-0 select-none"
        style={{
          borderBottom: '1px solid #1e1e30',
          background: '#0a0a14',
        }}
      >
        <span className="text-xs w-10 text-right" style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono' }}>#</span>
        <span className="flex-1 text-xs" style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</span>
        <span className="w-52 text-xs hidden md:block" style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</span>
        <span className="w-28 text-xs hidden lg:block" style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>City</span>
        <span className="w-32 text-xs hidden xl:block" style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dept</span>
        <span className="w-24 text-xs text-right" style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salary</span>
        <span style={{ width: 24 }} />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="text-2xl mb-3"
                style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}
              >
                ◌
              </div>
              <p style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                Fetching employees…
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-center px-8 py-6 max-w-sm"
              style={{ background: '#0f0f1a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}
            >
              <p style={{ color: '#f87171', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', marginBottom: 8 }}>
                API Error: {error}
              </p>
              <p style={{ color: '#4a4a6a', fontSize: '0.75rem' }}>
                Check network or credentials.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
              No results match "{search}"
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <VirtualList
            data={filtered}
            searchTerm={search}
            onRowClick={id => navigate(`/details/${id}`)}
          />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
